//// Tests for Epic 1 foundation (Story 1.1 health endpoint routing).
import gleeunit
import gleam/http/response.{type Response}
import gleeunit/should
import synapse

pub fn main() {
  gleeunit.main()
}

// Health route returns 200.
pub fn health_returns_ok_test() {
  let resp: Response(synapse.Body) = synapse.route("/health")
  resp.status |> should.equal(200)
}

// Root route returns 200.
pub fn root_returns_ok_test() {
  let resp = synapse.route("/")
  resp.status |> should.equal(200)
}

// Unknown route returns 404.
pub fn unknown_route_404_test() {
  let resp = synapse.route("/nope")
  resp.status |> should.equal(404)
}
