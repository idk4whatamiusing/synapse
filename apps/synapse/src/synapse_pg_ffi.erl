%% Erlang FFI helpers for Postgres access via pgo (spine AD-4).
%% ponytail: avoids Gleam stdlib 1.0.3's missing Dynamic decoders by
%% doing row->tuple conversion in Erlang, returning flat term lists.

-module(synapse_pg_ffi).
-export([start_pool/2, query_rows/2, query_rows_list/2, default_pool_config/0]).

%% Pool config from environment variables, falling back to dev defaults.
env_get(Key, Default) ->
  case os:getenv(Key) of
    false -> Default;
    Val -> Val
  end.

default_pool_config() ->
  #{host => env_get("DB_HOST", "localhost"),
    port => list_to_integer(env_get("DB_PORT", "5432")),
    user => env_get("DB_USER", "x"),
    password => env_get("DB_PASSWORD", ""),
    database => env_get("DB_NAME", "synapse"),
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

%% Runs a query with params as a Dynamic term (typically from dynamic.list).
%% ponytail: kept for single-param / zero-param callers (identity, data, deps).
query_rows(Sql, Params) ->
  case pgo:query(Sql, Params) of
    #{rows := Rows} ->
      {rows, [stringify_row(R) || R <- Rows]};
    {error, Reason} ->
      {failed, term_to_string(Reason)}
  end.

%% Runs an extended query with params as a plain Erlang list of binaries.
%% ponytail: bypasses dynamic.list which is broken for >1 element in stdlib 1.0.3.
%% Converts string params to native Erlang types for pgo encoding.
query_rows_list(Sql, Params) when is_list(Params) ->
  Converted = [to_native(P) || P <- Params],
  case pgo:query(Sql, Converted) of
    #{rows := Rows} ->
      {rows, [stringify_row(R) || R <- Rows]};
    {error, Reason} ->
      {failed, term_to_string(Reason)}
  end.

%% Convert a binary param to native Erlang type for pgo encoding.
%% ponytail: try integer first, then UUID (binary-as-is for text/uuid columns).
to_native(Bin) when is_binary(Bin) ->
  try binary_to_integer(Bin)
  catch _:_ -> Bin
  end.

stringify_row(Row) when is_tuple(Row) ->
  [term_to_string(V) || V <- tuple_to_list(Row)];
stringify_row(Row) when is_map(Row) ->
  [term_to_string(V) || V <- maps:values(Row)];
stringify_row(Row) ->
  [term_to_string(Row)].

%% Always returns a flat UTF-8 binary (Gleam String).
%% ponytail: format Erlang datetime tuples as readable; detect raw UUID binaries
%% (16 bytes with valid version/variant) and format as hyphenated hex strings;
%% sanitize non-UTF8 in other binaries so error strings don't crash mist.
term_to_string(V) when is_binary(V) andalso byte_size(V) =:= 16 ->
  case V of
    <<_:48, Version:4, _:12, Variant:2, _:62>> when Version >= 1, Version =< 5,
                                                      Variant =:= 2 orelse Variant =:= 3 ->
      format_uuid(V);
    _ -> safe_utf8(V)
  end;
term_to_string(V) when is_binary(V) -> V;
term_to_string(V) when is_integer(V) -> integer_to_binary(V);
term_to_string(V) when is_float(V) -> float_to_binary(V, [{decimals, 6}, compact]);
%% Erlang datetime tuple {{Y,M,D},{H,Min,S}} from Postgres timestamps.
%% ponytail: Sec can be integer or float (pgo returns float).
term_to_string({{Year,Mon,Day},{Hr,Min,Sec}}) when is_integer(Year), is_integer(Mon), is_integer(Day) ->
  SecInt = round(Sec),
  iolist_to_binary([pad2(Mon), $/, pad2(Day), $/, integer_to_binary(Year), $\s,
                    pad2(Hr), $:, pad2(Min), $:, pad2(SecInt)]);
term_to_string(V) when is_list(V) ->
  try iolist_to_binary(V)
  catch _:_ -> safe_utf8(io_lib:format("~p", [V]))
  end;
term_to_string(V) -> safe_utf8(io_lib:format("~p", [V])).

pad2(N) when N < 10 -> iolist_to_binary([<<"0">>, integer_to_binary(N)]);
pad2(N) -> integer_to_binary(N).

%% Format a raw 16-byte UUID binary as a hyphenated string.
format_uuid(<<A:32, B:16, C:16, D:16, E:48>>) ->
  iolist_to_binary([hex32(A), $-, hex16(B), $-, hex16(C), $-, hex16(D), $-, hex48(E)]).

hex32(N) -> io_lib:format("~8.16.0b", [N]).
hex16(N) -> io_lib:format("~4.16.0b", [N]).
hex48(N) -> io_lib:format("~12.16.0b", [N]).

safe_utf8(Iodata) ->
  Bin = iolist_to_binary(Iodata),
  << <<(sanitize_byte(B))>> || <<B>> <= Bin >>.

sanitize_byte(B) when B >= 32, B < 127 -> B;
sanitize_byte(_) -> 63.
