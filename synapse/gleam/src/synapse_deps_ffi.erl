%% Connectivity checks for external stores (spine AD-4, Story 1.2).
%% ponytail: Redis gets a real client (eredis PING); RabbitMQ gets a plain
%% TCP reach check — full AMQP wiring is deferred until the LLM-agent
%% pipeline needs a durable queue.

-module(synapse_deps_ffi).
-export([redis_ping/2, rabbitmq_reachable/2]).

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
