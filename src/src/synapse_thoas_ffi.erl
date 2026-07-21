%% Thin FFI over thoas (pure-Erlang JSON, no stdlib version coupling).
%% decode returns {ok, Dynamic} or {error, binary}; encode takes Dynamic.

-module(synapse_thoas_ffi).
-export([decode/1, encode/1, session_json/4, obj/1]).

decode(Binary) when is_binary(Binary) ->
  case thoas:decode(Binary) of
    {ok, Term} -> {ok, Term};
    {error, _} -> {error, <<"invalid json">>}
  end.

encode(Term) ->
  thoas:encode(Term).

%% Build a JSON object from string key/value pairs, as an opaque Dynamic term.
obj(Entries) when is_list(Entries) ->
  maps:from_list([{K, V} || {K, V} <- Entries, is_binary(K), is_binary(V)]).

%% Build the session payload map for Redis (keys: session_id, school,
%% department, year) and return it as an opaque Dynamic term.
session_json(SessionId, School, Department, Year) when
    is_binary(SessionId), is_binary(School), is_binary(Department), is_binary(Year) ->
  #{
    <<"session_id">> => SessionId,
    <<"school">> => School,
    <<"department">> => Department,
    <<"year">> => Year
  }.
