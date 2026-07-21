%% Connectivity checks for external stores (spine AD-4, Story 1.2).
%% ponytail: Redis gets a real client (eredis PING); RabbitMQ gets a plain
%% TCP reach check — full AMQP wiring is deferred until the LLM-agent
%% pipeline needs a durable queue.
%%
%% Session storage (Story 2.1): eredis key/value with TTL, via a named pool
%% "synapse_redis" so Gleam just calls redis_* without per-request connect.

-module(synapse_deps_ffi).
-export([redis_ping/2,
         rabbitmq_reachable/2,
         redis_pool_start/2,
         redis_setex/4,
         redis_get/2,
         redis_del/2,
         random_session_id/0,
         getenv/1,
         getenv_int/1]).

%% Start a plain eredis connection. Returns {ok, Pid} or {error, Reason}.
redis_pool_start(Host, Port) ->
  HostList = binary_to_list(Host),
  eredis:start_link([{host, HostList}, {port, Port}]).

%% Session storage (Story 2.1): eredis key/value with TTL via the connection
%% Pid returned by redis_pool_start. The registered name 'synapse_redis' is
%% not used; each op receives the opaque Pid from Gleam.

redis_setex(Pid, Key, TtlSecs, Value) when is_binary(Key), is_binary(Value) ->
  case eredis:q(Pid, ["SETEX", Key, integer_to_binary(TtlSecs), Value]) of
    {ok, _} -> {ok, nil};
    {error, Reason} -> {error, iolist_to_binary(io_lib:format("~p", [Reason]))}
  end.

redis_get(Pid, Key) when is_binary(Key) ->
  case eredis:q(Pid, ["GET", Key]) of
    {ok, undefined} -> {ok, none};
    {ok, Bin} when is_binary(Bin) -> {ok, {some, Bin}};
    {error, Reason} -> {error, iolist_to_binary(io_lib:format("~p", [Reason]))}
  end.

redis_del(Pid, Key) when is_binary(Key) ->
  case eredis:q(Pid, ["DEL", Key]) of
    {ok, _} -> ok;
    {error, Reason} -> {error, iolist_to_binary(io_lib:format("~p", [Reason]))}
  end.

random_session_id() ->
  base64:encode(crypto:strong_rand_bytes(24)).

%% Returns <<"ok">> if Redis answers PONG, else <<"error:...">>.
redis_ping(Host, Port) ->
  HostList = binary_to_list(Host),
  case eredis:start_link([{host, HostList}, {port, Port}]) of
    {ok, Pid} ->
      Result =
        case eredis:q(Pid, ["PING"]) of
          {ok, <<"PONG">>} -> <<"ok">>;
          Other -> iolist_to_binary(io_lib:format("error:~p", [Other]))
        end,
      _ = (try eredis:stop(Pid) catch _:_ -> ok end),
      Result;
    {error, Reason} ->
      iolist_to_binary(io_lib:format("error:~p", [Reason]))
  end.

%% Returns <<"ok">> if the AMQP port accepts a TCP connection.
rabbitmq_reachable(Host, Port) ->
  HostList = binary_to_list(Host),
  case gen_tcp:connect(HostList, Port, [binary, {active, false}], 2000) of
    {ok, Sock} ->
      gen_tcp:close(Sock),
      <<"ok">>;
    {error, Reason} ->
      iolist_to_binary(io_lib:format("error:~p", [Reason]))
  end.

%% Read an environment variable, returning "" if unset.
getenv(Name) ->
  case os:getenv(binary_to_list(Name)) of
    false -> "";
    Val -> list_to_binary(Val)
  end.

%% Read an environment variable as integer, returning Default if unset or invalid.
getenv_int(Name) ->
  case os:getenv(binary_to_list(Name)) of
    false -> 0;
    Val -> try list_to_integer(Val) catch _:_ -> 0 end
  end.
