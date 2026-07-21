%% Erlang FFI for LLM HTTP calls (services/llm.gleam).
%% ponytail: uses OTP's built-in httpc — no new dependency.

-module(services_llm_ffi).
-export([get_env/1, http_post/3]).

get_env(Key) ->
  case os:getenv(binary_to_list(Key)) of
    false -> {error, <<"not set">>};
    Val -> {ok, list_to_binary(Val)}
  end.

http_post(Url, Headers, Body) ->
  try
    do_http_post(Url, Headers, Body)
  catch
    Class:Reason:Stack ->
      {error, iolist_to_binary(io_lib:format("~p:~p ~p", [Class, Reason, Stack]))}
  end.

do_http_post(Url, Headers, Body) ->
  application:ensure_all_started(inets),
  application:ensure_all_started(ssl),
  HeaderList = [{binary_to_list(K), binary_to_list(V)} || {K, V} <- Headers],
  Request = {binary_to_list(Url), HeaderList, "application/json", binary_to_list(Body)},
  HttpOpts = [{ssl, [{verify, verify_none}]}],
  Opts = [{body_format, binary}],
  case httpc:request(post, Request, HttpOpts, Opts) of
    {ok, {{_, 200, _}, _RespHeaders, RespBody}} ->
      {ok, RespBody};
    {ok, {{_, Code, _}, _RespHeaders, RespBody}} ->
      {error, <<"HTTP ", (integer_to_binary(Code))/binary, ": ", RespBody/binary>>};
    {error, Reason} ->
      {error, iolist_to_binary(io_lib:format("~p", [Reason]))}
  end.
