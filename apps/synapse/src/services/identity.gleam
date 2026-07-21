//// Identity & auth (Story 2.1, spine AD-7). Login validates roll number +
//// credential against Postgres (adamas DB); on match it derives
//// school/department/year and stores a Redis session (TTL). Sessions gate
//// protected routes (Story 2.2).

import gleam/dynamic.{type Dynamic}
import gleam/dynamic/decode
import gleam/list
import gleam/option.{type Option, None, Some}
import gleam/string
import synapse_pg as pg

@external(erlang, "synapse_thoas_ffi", "decode")
fn ffi_json_decode(input: String) -> Result(Dynamic, String)

@external(erlang, "synapse_thoas_ffi", "encode")
fn ffi_json_encode(term: Dynamic) -> String

@external(erlang, "synapse_thoas_ffi", "session_json")
fn ffi_session_json(
  session_id: String,
  school: String,
  department: String,
  year: String,
) -> Dynamic

//// Opaque Redis handle. Internally the eredis pool is registered as
//// `synapse_redis`; this is a placeholder typed to satisfy the FFI.
pub type Red

@external(erlang, "synapse_deps_ffi", "redis_pool_start")
fn ffi_redis_pool_start(host: String, port: Int) -> Result(Red, String)

@external(erlang, "synapse_deps_ffi", "redis_setex")
fn ffi_redis_setex(pool: Red, key: String, ttl: Int, value: String) -> Result(Nil, String)

@external(erlang, "synapse_deps_ffi", "redis_get")
fn ffi_redis_get(pool: Red, key: String) -> Result(Option(String), String)

@external(erlang, "synapse_deps_ffi", "redis_del")
fn ffi_redis_del(pool: Red, key: String) -> Result(Nil, String)

@external(erlang, "synapse_deps_ffi", "random_session_id")
fn ffi_random_session_id() -> String

@external(erlang, "services_adamas_ffi", "portal_login")
fn ffi_portal_login(
  registration_no: String,
  password: String,
) -> Result(String, String)

@external(erlang, "services_adamas_ffi", "fetch_student_info")
fn ffi_fetch_student_info(session_cookie: String) -> Result(String, String)

pub type LoginResult {
  Authed(session_id: String, school: String, department: String, year: String)
  Rejected(reason: String)
}

pub type AuthContext {
  AuthContext(session_id: String, school: String, department: String, year: String)
}

const session_ttl_secs = 604800

//// Start the Redis session pool (named synapse_redis). Returns the handle
//// used by all session ops. Safe to call once at boot.
pub fn start_redis(host: String, port: Int) -> Result(Red, String) {
  ffi_redis_pool_start(host, port)
}

//// Validate roll number + credential against the adamas DB. On match, create
//// a Redis session and return the derived school/department/year.
pub fn login(
  pool: Red,
  roll_number: String,
  credential: String,
) -> LoginResult {
  case lookup_student(roll_number) {
    Error(reason) -> Rejected(reason)
    Ok(None) -> Rejected("unknown roll number")
    Ok(Some(row)) -> {
      case row.credential == credential {
        False -> Rejected("invalid credential")
        True -> {
          let session_id = ffi_random_session_id()
          let payload =
            ffi_json_encode(
              ffi_session_json(session_id, row.school_code, row.department_code, row.year_level),
            )
          case ffi_redis_setex(pool, session_key(session_id), session_ttl_secs, payload) {
            Error(reason) -> Rejected("session store failed: " <> reason)
            Ok(Nil) ->
              Authed(session_id, row.school_code, row.department_code, row.year_level)
          }
        }
      }
    }
  }
}

pub fn logout(pool: Red, session_id: String) -> Result(Nil, String) {
  ffi_redis_del(pool, session_key(session_id))
}

//// Portal-based login: authenticates against the Adamas student portal,
//// fetches student info, upserts to local DB, and creates a Redis session.
pub fn portal_login(
  pool: Red,
  registration_no: String,
  password: String,
) -> LoginResult {
  // Fetch CSRF token + login in one step
  case ffi_portal_login(registration_no, password) {
    Error(reason) -> Rejected(reason)
    Ok(session_cookie) -> {
      // Fetch student info from dashboard
      case ffi_fetch_student_info(session_cookie) {
        Error(reason) -> Rejected("could not fetch student info: " <> reason)
        Ok(student_json) -> {
          // Parse student info and upsert to local DB
          case parse_student_json(student_json) {
            Error(reason) -> Rejected("could not parse student info: " <> reason)
            Ok(info) -> {
              upsert_student(registration_no, info)
              // Create Redis session
              let session_id = ffi_random_session_id()
              let payload =
                ffi_json_encode(
                  ffi_session_json(session_id, info.school, info.department, info.year),
                )
              case ffi_redis_setex(pool, session_key(session_id), session_ttl_secs, payload) {
                Error(reason) -> Rejected("session store failed: " <> reason)
                Ok(Nil) ->
                  Authed(session_id, info.school, info.department, info.year)
              }
            }
          }
        }
      }
    }
  }
}

//// Resolve a session cookie value into an auth context, or None.
pub fn resolve_session(
  pool: Red,
  session_id: Option(String),
) -> Result(Option(AuthContext), String) {
  case session_id {
    None -> Ok(None)
    Some(id) -> {
      case ffi_redis_get(pool, session_key(id)) {
        Error(reason) -> Error(reason)
        Ok(None) -> Ok(None)
        Ok(Some(json_str)) ->
          case ffi_json_decode(json_str) {
            Error(_) -> Ok(None)
            Ok(term) ->
              case decode_session(term) {
                Ok(ctx) -> Ok(Some(ctx))
                Error(_) -> Ok(None)
              }
          }
      }
    }
  }
}

//// Extract the synapse session cookie from a request's Cookie header.
pub fn session_from_cookie(cookie_header: Option(String)) -> Option(String) {
  case cookie_header {
    None -> None
    Some(header) -> find_session_cookie(string.split(header, ";"))
  }
}

fn find_session_cookie(parts: List(String)) -> Option(String) {
  case parts {
    [] -> None
    [part, ..rest] -> {
      let trimmed = string.trim(part)
      case string.starts_with(trimmed, "synapse_session=") {
        True -> Some(string.split(trimmed, "=") |> list.drop(1) |> string.join("="))
        False -> find_session_cookie(rest)
      }
    }
  }
}

//// Parse JSON login body -> {registration_no, password}.
//// Accepts both "roll_number" and "registration_no" as the identifier field.
pub fn parse_login_body(body: String) -> Result(#(String, String), String) {
  case ffi_json_decode(body) {
    Error(reason) -> Error(reason)
    Ok(term) -> {
      // Try "registration_no" first (matches Adamas portal field name)
      case
        decode.run(
          term,
          decode.field(
            "registration_no",
            decode.string,
            fn(reg) {
              decode.field(
                "password",
                decode.string,
                fn(pass) { decode.success(#(reg, pass)) },
              )
            },
          ),
        )
      {
        Ok(#(r, c)) -> Ok(#(r, c))
        Error(_) ->
          // Fall back to "roll_number" + "credential" (legacy format)
          case
            decode.run(
              term,
              decode.field(
                "roll_number",
                decode.string,
                fn(roll) {
                  decode.field(
                    "credential",
                    decode.string,
                    fn(cred) { decode.success(#(roll, cred)) },
                  )
                },
              ),
            )
          {
            Ok(#(r, c)) -> Ok(#(r, c))
            Error(_) -> Error("missing registration_no/roll_number or password/credential")
          }
      }
    }
  }
}

//// ---- internals ----

type StudentRow {
  StudentRow(
    school_code: String,
    department_code: String,
    year_level: String,
    credential: String,
  )
}

fn lookup_student(roll: String) -> Result(Option(StudentRow), String) {
  let sql =
    "SELECT s.code, d.code, y.level, st.credential
       FROM students st
       JOIN schools s ON st.school_id = s.id
       JOIN departments d ON st.department_id = d.id
       JOIN years y ON st.year_id = y.id
      WHERE st.roll_number = $1"
  case pg.query_list(sql, [roll]) {
    pg.Failed(reason) -> Error(reason)
    pg.Rows(rows) ->
      case rows {
        [] -> Ok(None)
        [row, ..] -> {
          let assert [school, dept, year, cred] = row
          Ok(Some(StudentRow(school, dept, year, cred)))
        }
      }
  }
}

fn decode_session(term: Dynamic) -> Result(AuthContext, List(decode.DecodeError)) {
  decode.run(
    term,
    decode.field(
      "session_id",
      decode.string,
      fn(session_id) {
        decode.field(
          "school",
          decode.string,
          fn(school) {
            decode.field(
              "department",
              decode.string,
              fn(department) {
                decode.field(
                  "year",
                  decode.string,
                  fn(year) {
                    decode.success(AuthContext(session_id, school, department, year))
                  },
                )
              },
            )
          },
        )
      },
    ),
  )
}

fn session_key(session_id: String) -> String {
  "synapse:session:" <> session_id
}

type StudentInfo {
  StudentInfo(
    name: String,
    school: String,
    department: String,
    year: String,
  )
}

//// Parse student info JSON string extracted from portal dashboard.
fn parse_student_json(json: String) -> Result(StudentInfo, String) {
  case ffi_json_decode(json) {
    Error(reason) -> Error(reason)
    Ok(term) -> {
      case
        decode.run(
          term,
          decode.field(
            "name",
            decode.string,
            fn(name) {
              decode.field(
                "school",
                decode.string,
                fn(school) {
                  decode.field(
                    "department",
                    decode.string,
                    fn(department) {
                      decode.field(
                        "year",
                        decode.string,
                        fn(year) { decode.success(StudentInfo(name, school, department, year)) },
                      )
                    },
                  )
                },
              )
            },
          ),
        )
      {
        Ok(info) -> Ok(info)
        Error(_) -> Error("could not decode student info")
      }
    }
  }
}

//// Upsert student into local DB from portal data.
fn upsert_student(registration_no: String, info: StudentInfo) -> Nil {
  // Resolve school, department, year IDs from local lookup tables
  let school_id = lookup_or_create_school(info.school)
  let dept_id = lookup_or_create_department(info.department, school_id)
  let year_id = lookup_or_create_year(info.year)
  // Upsert student record
  let sql =
    "INSERT INTO students (roll_number, name, school_id, department_id, year_id, credential)
       VALUES ($1, $2, $3, $4, $5, '')
       ON CONFLICT (roll_number) DO UPDATE SET name = $2, school_id = $3, department_id = $4, year_id = $5"
  let _ = pg.query_list(sql, [registration_no, info.name, school_id, dept_id, year_id])
  Nil
}

fn lookup_or_create_school(code: String) -> String {
  case pg.query_list("SELECT id FROM schools WHERE code = $1", [code]) {
    pg.Rows([[id, ..], ..]) -> id
    _ ->
      case
        pg.query_list(
          "INSERT INTO schools (code, name) VALUES ($1, $2) RETURNING id",
          [code, code],
        )
      {
        pg.Rows([[id, ..], ..]) -> id
        _ -> "1"
      }
  }
}

fn lookup_or_create_department(code: String, school_id: String) -> String {
  case pg.query_list("SELECT id FROM departments WHERE code = $1 AND school_id = $2", [code, school_id]) {
    pg.Rows([[id, ..], ..]) -> id
    _ ->
      case
        pg.query_list(
          "INSERT INTO departments (code, name, school_id) VALUES ($1, $2, $3) RETURNING id",
          [code, code, school_id],
        )
      {
        pg.Rows([[id, ..], ..]) -> id
        _ -> "1"
      }
  }
}

fn lookup_or_create_year(level: String) -> String {
  case pg.query_list("SELECT id FROM years WHERE level = $1", [level]) {
    pg.Rows([[id, ..], ..]) -> id
    _ ->
      case pg.query_list("INSERT INTO years (level) VALUES ($1) RETURNING id", [level]) {
        pg.Rows([[id, ..], ..]) -> id
        _ -> "1"
      }
  }
}
