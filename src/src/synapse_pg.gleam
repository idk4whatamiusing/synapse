//// Minimal Postgres client over the Erlang `pgo` pool (spine AD-4).
//// ponytail: thin FFI to synapse_pg_ffi.erl; rows come back as
//// List(List(String)) (each row = list of stringified columns).
//// Tuple/term decoding done via raw erlang FFI (no gleam/erlang import).

import gleam/dynamic.{type Dynamic}

@external(erlang, "synapse_pg_ffi", "start_pool")
fn ffi_start_pool(name: String, config: Dynamic) -> Dynamic

@external(erlang, "synapse_pg_ffi", "query_rows")
fn ffi_query_rows(sql: String, params: Dynamic) -> QueryResult

//// A query result: rows, each a list of stringified column values.
//// ponytail: the FFI returns terms shaped exactly like this record
//// ({rows, ...} / {failed, ...}), so no Dynamic decoding is needed.
pub type QueryResult {
  Rows(rows: List(List(String)))
  Failed(reason: String)
}

pub fn start_pool(name: String, config: Dynamic) -> Result(Nil, String) {
  case ffi_start_pool(name, config) {
    _ -> Ok(Nil)
  }
}

pub fn query(sql: String, params: Dynamic) -> QueryResult {
  ffi_query_rows(sql, params)
}
