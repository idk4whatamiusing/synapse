-module(messages_ffi).
-export([int_to_string/1]).

int_to_string(N) when is_integer(N) -> integer_to_binary(N);
int_to_string(N) -> iolist_to_binary(io_lib:format("~p", [N])).
