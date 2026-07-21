//// Dept-year room messages (Story 2.3). Server-side admission: the user's
//// school/dept/year from the session is the ONLY key — no client-supplied
//// room identifiers accepted. UUIDs resolved via single-param queries
//// (ponytail: stdlib 1.0.3 dynamic.list broken for >1 element).

import gleam/dynamic.{type Dynamic}
import gleam/string
import synapse_pg as pg
import services/data
import services/identity.{type AuthContext}

@external(erlang, "synapse_thoas_ffi", "encode")
fn ffi_json_encode(term: Dynamic) -> String

@external(erlang, "synapse_thoas_ffi", "obj")
fn ffi_json_obj(entries: List(#(String, String))) -> Dynamic

pub type Message {
  Message(
    id: String,
    body: String,
    created_at: String,
  )
}

pub fn post_message(
  ctx: AuthContext,
  body: String,
) -> Result(Message, String) {
  case string.trim(body) {
    "" -> Error("empty message")
    trimmed ->
      case data.resolve_school_id(ctx.school) {
        Error(e) -> Error(e)
        Ok(sid) ->
          case data.resolve_department_id(ctx.school, ctx.department) {
            Error(e) -> Error(e)
            Ok(did) ->
              case data.resolve_year_id(ctx.year) {
                Error(e) -> Error(e)
                Ok(yid) ->
                  case pg.query_list(
                    "INSERT INTO dept_year_messages (school_id, department_id, year_id, body)
                      VALUES ($1, $2, $3, $4)
                      RETURNING id, body, created_at",
                    [sid, did, yid, trimmed],
                  ) {
                    pg.Rows([row, ..]) -> {
                      let assert [id, msg_body, created_at] = row
                      Ok(Message(id, msg_body, created_at))
                    }
                    pg.Failed(_) -> Error("insert failed")
                    _ -> Error("no rows returned")
                  }
              }
          }
      }
  }
}

pub fn list_messages(
  ctx: AuthContext,
) -> Result(List(Message), String) {
  case data.resolve_school_id(ctx.school) {
    Error(e) -> Error(e)
    Ok(sid) ->
      case data.resolve_department_id(ctx.school, ctx.department) {
        Error(e) -> Error(e)
        Ok(did) ->
          case data.resolve_year_id(ctx.year) {
            Error(e) -> Error(e)
            Ok(yid) ->
              case pg.query_list(
                "SELECT id, body, created_at
                   FROM dept_year_messages
                  WHERE school_id = $1 AND department_id = $2 AND year_id = $3
                  ORDER BY created_at DESC
                  LIMIT 50",
                [sid, did, yid],
              ) {
                pg.Rows(rows) ->
                  Ok(rows_to_messages(rows))
                pg.Failed(_) -> Error("select failed")
              }
          }
      }
  }
}

fn rows_to_messages(rows: List(List(String))) -> List(Message) {
  case rows {
    [] -> []
    [row, ..rest] -> {
      let assert [id, msg_body, created_at] = row
      [Message(id, msg_body, created_at), ..rows_to_messages(rest)]
    }
  }
}

pub fn message_to_json(msg: Message) -> String {
  ffi_json_encode(ffi_json_obj([
    #("id", msg.id),
    #("body", msg.body),
    #("created_at", msg.created_at),
  ]))
}

pub fn messages_to_json(msgs: List(Message)) -> String {
  case msgs {
    [] -> "[]"
    [m] -> "[" <> message_to_json(m) <> "]"
    [m, ..rest] -> "[" <> message_to_json(m) <> "," <> rest_to_json(rest) <> "]"
  }
}

fn rest_to_json(msgs: List(Message)) -> String {
  case msgs {
    [] -> ""
    [m] -> message_to_json(m)
    [m, ..rest] -> message_to_json(m) <> "," <> rest_to_json(rest)
  }
}
