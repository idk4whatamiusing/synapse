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
  let redis_host = case getenv("REDIS_HOST") {
    "" -> "localhost"
    h -> h
  }
  let redis_port = case getenv_int("REDIS_PORT") {
    0 -> 6379
    p -> p
  }
  let rabbit_host = case getenv("RABBITMQ_HOST") {
    "" -> "localhost"
    h -> h
  }
  let rabbit_port = case getenv_int("RABBITMQ_PORT") {
    0 -> 5672
    p -> p
  }
  DepStatus(
    postgres: postgres_status(),
    redis: ffi_redis_ping(redis_host, redis_port),
    rabbitmq: ffi_rabbitmq_reachable(rabbit_host, rabbit_port),
  )
}

fn postgres_status() -> String {
  case pg.query_list("SELECT 1", []) {
    pg.Rows(_) -> "ok"
    pg.Failed(reason) -> "error:" <> reason
  }
}
