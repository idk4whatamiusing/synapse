//// Synapse backend — monolith Gleam/BEAM app (spine AD-1).
//// Single runtime: HTTP via mist. No microservices, no GraphQL, no K8s.
//// OTP supervision and per-module children are added as later epics land.

import gleam/erlang/process
import gleam/http/request.{type Request}
import gleam/http/response.{type Response}
import gleam/bytes_tree
import gleam/dynamic.{type Dynamic}
import gleam/list
import mist
import synapse_pg as pg
import data
import deps

//// erlang FFI: default dev Postgres pool config.
@external(erlang, "synapse_pg_ffi", "default_pool_config")
fn default_pool_config() -> Dynamic

//// mist response body type.
pub type Body =
  mist.ResponseData

pub fn main() {
  // ponytail: pgo's query/2 checks out the "default" pool; name it so.
  let _ = pg.start_pool("default", default_pool_config())

  let builder =
    mist.new(handle_request)
    |> mist.port(8000)
  let assert Ok(_) = mist.start(builder)
  process.sleep_forever()
}

//// mist entry point: adapt the opaque connection request into routing.
fn handle_request(req: Request(mist.Connection)) -> Response(Body) {
  route(req.path)
}

//// Pure router — testable without a live connection (Story 1.1).
pub fn route(path: String) -> Response(Body) {
  case path {
    "/" -> ok_response("ok")
    "/health" -> ok_response("ok")
    "/health/deps" -> deps_response()
    "/schools" -> schools_response()
    _ ->
      response.new(404)
      |> response.set_body(mist.Bytes(bytes_tree.from_string("not found")))
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

//// ponytail: stdlib 1.0.3 has no list.join; fold with a separator.
fn string_join(items: List(String), sep: String) -> String {
  list.fold(items, "", fn(acc, item) {
    case acc {
      "" -> item
      _ -> acc <> sep <> item
    }
  })
}
