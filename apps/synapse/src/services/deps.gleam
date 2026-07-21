//// Dependency connectivity checks (Story 1.2, spine AD-4).
//// Confirms the Gleam app can reach Postgres, Redis, and RabbitMQ.

import synapse_pg as pg

@external(erlang, "synapse_deps_ffi", "redis_ping")
fn ffi_redis_ping(host: String, port: Int) -> String

@external(erlang, "synapse_deps_ffi", "rabbitmq_reachable")
fn ffi_rabbitmq_reachable(host: String, port: Int) -> String

pub type DepStatus {
  DepStatus(postgres: String, redis: String, rabbitmq: String)
}

//// ponytail: dev-local defaults; swap for env-driven config when deployed.
pub fn check_all() -> DepStatus {
  DepStatus(
    postgres: postgres_status(),
    redis: ffi_redis_ping("localhost", 6379),
    rabbitmq: ffi_rabbitmq_reachable("localhost", 5672),
  )
}

fn postgres_status() -> String {
  case pg.query_list("SELECT 1", []) {
    pg.Rows(_) -> "ok"
    pg.Failed(reason) -> "error:" <> reason
  }
}
