%% Erlang FFI helpers for Postgres access via pgo (spine AD-4).
%% ponytail: avoids Gleam stdlib 1.0.3's missing Dynamic decoders by
%% doing row->tuple conversion in Erlang, returning flat term lists.

-module(synapse_pg_ffi).
-export([start_pool/2, query_rows/2, default_pool_config/0]).

%% Default dev pool config (localhost:5432, db synapse, user x).
default_pool_config() ->
  #{host => "localhost",
    port => 5432,
    user => "x",
    database => "synapse",
    pool_size => 5}.

start_pool(Name, Config) ->
  case application:ensure_all_started(pgo) of
    {ok, _} -> ok;
    {error, Reason} -> erlang:display({pgo_start_failed, Reason})
  end,
  %% pgo registers/looks up the pool as a local atom; Gleam strings are
  %% binaries, so coerce. ponytail: binary_to_atom, pool names are static.
  Pool = to_atom(Name),
  pgo:start_pool(Pool, Config).

to_atom(N) when is_atom(N) -> N;
to_atom(N) when is_binary(N) -> binary_to_atom(N, utf8);
to_atom(N) when is_list(N) -> list_to_atom(N).

%% Runs an extended query. Returns a term shaped exactly like the Gleam
%% QueryResult record so it can be identity-coerced on the Gleam side:
%%   {rows, [[binary()]]} | {failed, binary()}
query_rows(Sql, Params) ->
  case pgo:query(Sql, Params) of
    #{rows := Rows} ->
      {rows, [stringify_row(R) || R <- Rows]};
    {error, Reason} ->
      {failed, term_to_string(Reason)}
  end.

stringify_row(Row) when is_tuple(Row) ->
  [term_to_string(V) || V <- tuple_to_list(Row)];
stringify_row(Row) when is_map(Row) ->
  [term_to_string(V) || V <- maps:values(Row)];
stringify_row(Row) ->
  [term_to_string(Row)].

%% Always returns a flat UTF-8 binary (Gleam String).
term_to_string(V) when is_binary(V) -> V;
term_to_string(V) when is_integer(V) -> integer_to_binary(V);
term_to_string(V) when is_float(V) -> float_to_binary(V, [{decimals, 6}, compact]);
term_to_string(V) when is_list(V) ->
  try iolist_to_binary(V)
  catch _:_ -> iolist_to_binary(io_lib:format("~p", [V]))
  end;
term_to_string(V) -> iolist_to_binary(io_lib:format("~p", [V])).
