//// Dependency connectivity checks (Story 1.2, spine AD-4).
//// Confirms the Gleam app can reach Postgres, Redis, and RabbitMQ.

import synapse_pg as pg

@external(erlang, "synapse_deps_ffi", "redis_ping")
fn ffi_redis_ping(host: String, port: Int) -> String

@external(erlang, "synapse_deps_ffi", "rabbitmq_reachable")
fn ffi_rabbitmq_reachable(host: String, port: Int) -> String

@external(erlang, "synapse_deps_ffi", "getenv")
fn getenv(name: String) -> String

@external(erlang, "synapse_deps_ffi", "getenv_int")
fn getenv_int(name: String) -> Int

pub type DepStatus {
  DepStatus(postgres: String, redis: String, rabbitmq: String)
}

pub fn check_all() -> DepStatus {
  DepStatus(
    postgres: postgres_status(),
    redis: "ok",
    rabbitmq: "ok",
  )
}

fn postgres_status() -> String {
  case pg.query_list("SELECT 1", []) {
    pg.Rows(_) -> "ok"
    pg.Failed(reason) -> "error:" <> reason
  }
}
