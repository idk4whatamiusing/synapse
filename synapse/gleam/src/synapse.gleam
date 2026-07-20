//// Synapse backend — monolith Gleam/BEAM app (spine AD-1).
//// Single runtime: HTTP via mist. No microservices, no GraphQL, no K8s.
//// OTP supervision and per-module children are added as later epics land.

import gleam/erlang/process
import gleam/http/request.{type Request}
import gleam/http/response.{type Response}
import gleam/bytes_tree
import mist

//// mist response body type.
pub type Body =
  mist.ResponseData

pub fn main() {
  // ponytail: blocks forever serving; supervisor/children added in later
  // epics (auth, chatbot, notices, chat) once modules exist.
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
    _ ->
      response.new(404)
      |> response.set_body(mist.Bytes(bytes_tree.from_string("not found")))
  }
}

fn ok_response(body: String) -> Response(Body) {
  response.new(200)
  |> response.set_body(mist.Bytes(bytes_tree.from_string(body)))
}
