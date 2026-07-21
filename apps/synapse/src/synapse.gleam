//// Synapse backend — monolith Gleam/BEAM app (spine AD-1).
//// Single runtime: HTTP via mist. No microservices, no GraphQL, no K8s.
//// OTP supervision and per-module children are added as later epics land.

import gleam/bit_array
import gleam/erlang/process
import gleam/http/request.{type Request}
import gleam/http.{method_to_string}
import gleam/http/response.{type Response}
import gleam/bytes_tree
import gleam/dynamic.{type Dynamic}
import gleam/list
import gleam/string
import gleam/option.{Some}
import gleam/result
import mist
import synapse_pg as pg
import services/data
import services/deps
import services/identity.{type Red}
import services/llm
import services/messages

@external(erlang, "synapse_thoas_ffi", "encode")
fn ffi_json_encode(term: Dynamic) -> String

@external(erlang, "synapse_thoas_ffi", "obj")
fn ffi_json_obj(entries: List(#(String, String))) -> Dynamic

//// erlang FFI: default dev Postgres pool config.
@external(erlang, "synapse_pg_ffi", "default_pool_config")
fn default_pool_config() -> Dynamic

//// mist response body type.
pub type Body =
  mist.ResponseData

pub fn main() {
  // ponytail: pgo's query/2 checks out the "default" pool; name it so.
  let _ = pg.start_pool("default", default_pool_config())
  // ponytail: Redis session store — plain eredis Pid, no named pool.
  let assert Ok(session_red) = identity.start_redis("localhost", 6379)

  let builder =
    mist.new(fn(req) { handle_request(req, session_red) })
    |> mist.port(8000)
  let assert Ok(_) = mist.start(builder)
  process.sleep_forever()
}

//// mist entry point: route by method + path, carrying the Redis session pool.
//// Pure router for static, session-free routes (testable without a live
//// connection). Dynamic routes (login/me) are handled in handle_request.
pub fn route(path: String) -> Response(Body) {
  case path {
    "/health/deps" -> deps_response()
    "/schools" -> schools_response()
    "/" -> ok_response("ok")
    "/health" -> ok_response("ok")
    _ ->
      response.new(404)
      |> response.set_body(mist.Bytes(bytes_tree.from_string("not found")))
  }
}

fn handle_request(req: Request(mist.Connection), session_red: Red) -> Response(Body) {
  let method = method_to_string(req.method)
  case req.path {
    "/health/deps" -> deps_response()
    "/schools" -> schools_response()
    "/" -> ok_response("ok")
    "/health" -> ok_response("ok")
    "/login" if method == "POST" -> login_response(req, session_red)
    "/me" -> me_response(req, session_red)
    "/messages" if method == "POST" -> post_message_response(req, session_red)
    "/messages" -> list_messages_response(req, session_red)
    "/chat" if method == "POST" -> chat_response(req, session_red)
    _ ->
      response.new(404)
      |> response.set_body(mist.Bytes(bytes_tree.from_string("not found")))
  }
}

fn login_response(
  req: Request(mist.Connection),
  session_red: Red,
) -> Response(Body) {
  case mist.read_body(req, max_body_limit: 4096) {
    Error(_) ->
      json_response(400, make_json([#("error", "bad request body")]))
    Ok(read_req) -> {
      let body =
        bit_array.to_string(read_req.body)
        |> result.unwrap("")
      case identity.parse_login_body(body) {
        Error(reason) ->
          json_response(400, make_json([#("error", reason)]))
        Ok(#(roll, cred)) ->
          case identity.login(session_red, roll, cred) {
            identity.Rejected(reason) ->
              json_response(401, make_json([#("error", reason)]))
            identity.Authed(session_id, school, department, year) ->
              json_response(
                200,
                make_json([
                  #("session_id", session_id),
                  #("school", school),
                  #("department", department),
                  #("year", year),
                ]),
              )
              |> response.set_header(
                "Set-Cookie",
                "synapse_session=" <> session_id
                  <> "; Path=/; HttpOnly; Max-Age=604800",
              )
          }
      }
    }
  }
}

//// Story 2.2 preview: protected route guarded by the Redis session.
fn me_response(req: Request(mist.Connection), session_red: Red) -> Response(Body) {
  let cookie = request.get_header(req, "cookie")
  case identity.session_from_cookie(option.from_result(cookie)) {
    option.None -> json_response(401, make_json([#("error", "no session")]))
    Some(id) ->
      case identity.resolve_session(session_red, Some(id)) {
        Ok(Some(ctx)) ->
          json_response(
            200,
            make_json([
              #("school", ctx.school),
              #("department", ctx.department),
              #("year", ctx.year),
            ]),
          )
        _ ->
          json_response(401, make_json([#("error", "invalid session")]))
      }
  }
}

//// Story 2.3: dept-year room admission. POST /messages — send a message
//// to the user's own dept-year room (server-enforced).
fn post_message_response(
  req: Request(mist.Connection),
  session_red: Red,
) -> Response(Body) {
  let cookie = request.get_header(req, "cookie")
  case identity.session_from_cookie(option.from_result(cookie)) {
    option.None -> json_response(401, make_json([#("error", "no session")]))
    Some(id) ->
      case identity.resolve_session(session_red, Some(id)) {
        Ok(Some(ctx)) ->
          case mist.read_body(req, max_body_limit: 4096) {
            Error(_) ->
              json_response(400, make_json([#("error", "bad request body")]))
            Ok(read_req) -> {
              let body = bit_array.to_string(read_req.body) |> result.unwrap("")
              case parse_message_body(body) {
                Error(reason) ->
                  json_response(400, make_json([#("error", reason)]))
                Ok(msg_body) ->
                  case messages.post_message(ctx, msg_body) {
                    Ok(msg) ->
                      json_response(200, messages.message_to_json(msg))
                    Error(reason) ->
                      json_response(500, make_json([#("error", reason)]))
                  }
              }
            }
          }
        _ -> json_response(401, make_json([#("error", "invalid session")]))
      }
  }
}

//// Story 2.3: GET /messages — list messages from the user's own dept-year room.
fn list_messages_response(
  req: Request(mist.Connection),
  session_red: Red,
) -> Response(Body) {
  let cookie = request.get_header(req, "cookie")
  case identity.session_from_cookie(option.from_result(cookie)) {
    option.None -> json_response(401, make_json([#("error", "no session")]))
    Some(id) ->
      case identity.resolve_session(session_red, Some(id)) {
        Ok(Some(ctx)) ->
          case messages.list_messages(ctx) {
            Ok(msgs) -> json_response(200, messages.messages_to_json(msgs))
            Error(reason) -> json_response(500, make_json([#("error", reason)]))
          }
        _ -> json_response(401, make_json([#("error", "invalid session")]))
      }
  }
}

//// Story 3.1: LLM chat endpoint. POST /chat — send messages, get LLM response.
fn chat_response(
  req: Request(mist.Connection),
  session_red: Red,
) -> Response(Body) {
  let cookie = request.get_header(req, "cookie")
  case identity.session_from_cookie(option.from_result(cookie)) {
    option.None -> json_response(401, make_json([#("error", "no session")]))
    Some(id) ->
      case identity.resolve_session(session_red, Some(id)) {
        Ok(Some(_ctx)) ->
          case mist.read_body(req, max_body_limit: 4096) {
            Error(_) ->
              json_response(400, make_json([#("error", "bad request body")]))
            Ok(read_req) -> {
              let body = bit_array.to_string(read_req.body) |> result.unwrap("")
              case parse_chat_body(body) {
                Error(reason) ->
                  json_response(400, make_json([#("error", reason)]))
                Ok(user_msg) -> {
                  case llm.chat_with_context(llm.OpenRouter, user_msg) {
                    Ok(response) ->
                      json_response(200, make_json([#("response", response)]))
                    Error(reason) ->
                      json_response(502, make_json([#("error", reason)]))
                  }
                }
              }
            }
          }
        _ -> json_response(401, make_json([#("error", "invalid session")]))
      }
  }
}

fn parse_chat_body(body: String) -> Result(String, String) {
  let trimmed = string.trim(body)
  case string.contains(trimmed, "\"message\"") {
    False -> Error("missing message field")
    True -> {
      let val = extract_json_string_value(trimmed, "message")
      case val {
        "" -> Error("empty message value")
        v -> Ok(v)
      }
    }
  }
}

fn parse_message_body(body: String) -> Result(String, String) {
  let trimmed = string.trim(body)
  case string.contains(trimmed, "\"body\"") {
    False -> Error("missing body field")
    True -> {
      let val = extract_json_string_value(trimmed, "body")
      case val {
        "" -> Error("empty body value")
        v -> Ok(v)
      }
    }
  }
}

fn extract_json_string_value(json: String, key: String) -> String {
  let needle = "\"" <> key <> "\""
  case string.split(json, needle) {
    [_, rest] ->
      case string.split(rest, "\"") {
        [_, value, ..] -> value
        _ -> ""
      }
    _ -> ""
  }
}

fn deps_response() -> Response(Body) {
  let s = deps.check_all()
  let body =
    "postgres="
    <> s.postgres
    <> " redis="
    <> s.redis
    <> " rabbitmq="
    <> s.rabbitmq
  case s.postgres == "ok" && s.redis == "ok" && s.rabbitmq == "ok" {
    True -> ok_response(body)
    False ->
      response.new(503)
      |> response.set_body(mist.Bytes(bytes_tree.from_string(body)))
  }
}

fn schools_response() -> Response(Body) {
  case data.list_schools() {
    Ok(schools) -> {
      let lines =
        schools
        |> list.map(fn(s) { s.code <> " " <> s.name })
      let body = string_join(lines, "\n")
      ok_response(body)
    }
    Error(reason) -> {
      response.new(500)
      |> response.set_body(mist.Bytes(bytes_tree.from_string(reason)))
    }
  }
}

fn ok_response(body: String) -> Response(Body) {
  response.new(200)
  |> response.set_body(mist.Bytes(bytes_tree.from_string(body)))
}

fn json_response(status: Int, value: String) -> Response(Body) {
  response.new(status)
  |> response.set_header("content-type", "application/json")
  |> response.set_body(mist.Bytes(bytes_tree.from_string(value)))
}

//// Build a flat string-keyed JSON object from entries (all String values).
fn make_json(entries: List(#(String, String))) -> String {
  ffi_json_encode(ffi_json_obj(entries))
}

//// ponytail: stdlib 1.0.3 has no list.join; fold with a separator.
fn string_join(items: List(String), sep: String) -> String {
  list.fold(items, "", fn(acc, item) {
    case acc {
      "" -> item
      _ -> acc <> sep <> item
    }
  })
}
