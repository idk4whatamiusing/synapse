%% Erlang FFI for Adamas portal HTTP communication.
%% Scrapes the student login portal to authenticate and fetch student info.

-module(services_adamas_ffi).
-export([portal_login/2, fetch_student_info/1]).

-define(LOGIN_URL, "https://adamasknowledgecity.ac.in/student/login").
-define(DASHBOARD_URL, "https://adamasknowledgecity.ac.in/student/dashboard").
-define(PROFILE_URL, "https://adamasknowledgecity.ac.in/student/profile").

%% Ensure SSL and httpc are started.
ensure_started() ->
  application:ensure_all_started(inets),
  application:ensure_all_started(ssl).

%% GET the login page and extract the CSRF _token + session cookie.
%% Returns {ok, {Token, Cookie}} or {error, Reason}.
fetch_csrf_token() ->
  ensure_started(),
  case httpc:request(get, {?LOGIN_URL, [{"User-Agent", "Synapse/1.0"}]}, [{ssl, [{verify, verify_none}]}], [{body_format, binary}, {full_result, true}]) of
    {ok, {{_, 200, _}, Headers, Body}} ->
      case extract_token(Body) of
        {ok, Token} ->
          case extract_session_cookie(Headers) of
            {ok, Cookie} -> {ok, {Token, Cookie}};
            error -> {error, <<"no session cookie from login page">>}
          end;
        error -> {error, <<"csrf token not found">>}
      end;
    {ok, {{_, Code, _}, _, _}} ->
      {error, <<"HTTP ", (integer_to_binary(Code))/binary>>};
    {error, Reason} ->
      {error, iolist_to_binary(io_lib:format("~p", [Reason]))}
  end.

%% Combined login: fetch CSRF token (with session cookie), then POST credentials.
%% Returns {ok, SessionCookie} on success, {error, Reason} on failure.
portal_login(RegistrationNo, Password) ->
  ensure_started(),
  %% Step 1: GET login page to get CSRF token + session cookie
  case httpc:request(get, {?LOGIN_URL, [{"User-Agent", "Synapse/1.0"}]}, [{ssl, [{verify, verify_none}]}], [{body_format, binary}, {full_result, true}]) of
    {ok, {{_, 200, _}, GetHeaders, Body}} ->
      case extract_token(Body) of
        {ok, Token} ->
          case extract_session_cookie(GetHeaders) of
            {ok, Cookie} ->
              %% Step 2: POST credentials with CSRF token + session cookie
              PostBody = "registration_no=" ++ uri_encode(binary_to_list(RegistrationNo))
                ++ "&password=" ++ uri_encode(binary_to_list(Password))
                ++ "&_token=" ++ uri_encode(binary_to_list(Token))
                ++ "&login=login",
              PostHeaders = [
                {"User-Agent", "Synapse/1.0"},
                {"Content-Type", "application/x-www-form-urlencoded"},
                {"Referer", ?LOGIN_URL},
                {"Origin", "https://adamasknowledgecity.ac.in"},
                {"Cookie", binary_to_list(Cookie)}
              ],
              HttpOpts = [{ssl, [{verify, verify_none}]}],
              Opts = [{body_format, binary}, {full_result, true}],
              case httpc:request(post, {?LOGIN_URL, PostHeaders, "application/x-www-form-urlencoded", PostBody}, HttpOpts, Opts) of
                {ok, {{_, Code, _}, RespHeaders, RespBody}} ->
                  case Code of
                    302 ->
                      %% Check redirect location — login page = failed, dashboard = success
                      RedirectLoc = extract_header(RespHeaders, "location"),
                      case RedirectLoc of
                        {ok, Loc} ->
                          case binary:match(Loc, <<"login">>) of
                            nomatch ->
                              %% Redirected to dashboard — success
                              case extract_session_cookie(RespHeaders) of
                                {ok, C} -> {ok, C};
                                error -> {error, <<"no session cookie in redirect">>}
                              end;
                            _ -> {error, <<"invalid credentials">>}
                          end;
                        error ->
                          %% No location header — try to get session cookie anyway
                          case extract_session_cookie(RespHeaders) of
                            {ok, C} -> {ok, C};
                            error -> {error, <<"login redirect with no location">>}
                          end
                      end;
                    200 ->
                      case binary:match(RespBody, <<"Dashboard">>) of
                        nomatch -> {error, <<"login failed — still on login page">>};
                        _ ->
                          case extract_session_cookie(RespHeaders) of
                            {ok, C} -> {ok, C};
                            error -> {error, <<"login may have succeeded but no session cookie">>}
                          end
                      end;
                    _ ->
                      {error, <<"HTTP ", (integer_to_binary(Code))/binary, " from portal">>}
                  end;
                {error, Reason} ->
                  {error, iolist_to_binary(io_lib:format("~p", [Reason]))}
              end;
            error -> {error, <<"no session cookie from login page">>}
          end;
        error -> {error, <<"csrf token not found">>}
      end;
    {ok, {{_, Code, _}, _, _}} ->
      {error, <<"HTTP ", (integer_to_binary(Code))/binary>>};
    {error, Reason} ->
      {error, iolist_to_binary(io_lib:format("~p", [Reason]))}
  end.

%% Fetch student info from the dashboard/profile page using session cookie.
fetch_student_info(SessionCookie) ->
  ensure_started(),
  Headers = [
    {"User-Agent", "Synapse/1.0"},
    {"Cookie", binary_to_list(SessionCookie)}
  ],
  HttpOpts = [{ssl, [{verify, verify_none}]}],
  Opts = [{body_format, binary}],
  %% Try dashboard first, fall back to profile
  case httpc:request(get, {?DASHBOARD_URL, Headers}, HttpOpts, Opts) of
    {ok, {{_, 200, _}, _RespHeaders, Body}} ->
      case extract_student_json(Body) of
        {ok, Json} -> {ok, Json};
        error -> {error, <<"could not parse student info from dashboard">>}
      end;
    {ok, {{_, Code, _}, _, _}} ->
      {error, <<"dashboard HTTP ", (integer_to_binary(Code))/binary>>};
    {error, Reason} ->
      {error, iolist_to_binary(io_lib:format("~p", [Reason]))}
  end.

%% ---- internal helpers ----

%% Extract _token value from HTML.
extract_token(Html) ->
  case binary:match(Html, <<"name=\"_token\" value=\"">>) of
    {Pos, Len} ->
      After = binary:part(Html, Pos + Len, byte_size(Html) - Pos - Len),
      case binary:match(After, <<"\"">>) of
        {EndPos, _} ->
          Token = binary:part(After, 0, EndPos),
          {ok, Token};
        nomatch -> error
      end;
    nomatch -> error
  end.

%% Extract session cookie from Set-Cookie headers.
extract_session_cookie(Headers) ->
  Filtered = [{K, V} || {K, V} <- Headers, string:lowercase(K) =:= "set-cookie"],
  extract_session_cookie_loop(Filtered).

extract_session_cookie_loop([]) -> error;
extract_session_cookie_loop([{_, CookieStr} | Rest]) ->
  %% Look for the session cookie (usually 'session' or 'laravel_session' or similar)
  case string:find(CookieStr, "session=") of
    nomatch ->
      %% Also try 'PHPSESSID' or any cookie that looks like a session
      case string:find(CookieStr, "PHPSESSID=") of
        nomatch -> extract_session_cookie_loop(Rest);
        _ -> {ok, list_to_binary(string:trim(CookieStr, trailing, ";"))}
      end;
    _ -> {ok, list_to_binary(string:trim(CookieStr, trailing, ";"))}
  end.

%% Extract a specific header value by name (case-insensitive).
extract_header(Headers, Name) ->
  Filtered = [{K, V} || {K, V} <- Headers, string:lowercase(K) =:= Name],
  case Filtered of
    [{_, Val} | _] -> {ok, list_to_binary(Val)};
    [] -> error
  end.

%% Extract student info as a JSON-like string from HTML.
%% Looks for common patterns in the dashboard HTML to find student details.
extract_student_json(Html) ->
  %% Try to find registration number, name, department, etc. from the HTML
  RegNo = extract_field(Html, <<"Registration No">>),
  Name = extract_field(Html, <<"Student Name">>),
  Dept = extract_field(Html, <<"Department">>),
  School = extract_field(Html, <<"School">>),
  Year = extract_field(Html, <<"Semester">>),
  case {RegNo, Name} of
    {_, none} ->
      %% Try alternative patterns
      Name2 = extract_field(Html, <<"name">>),
      RegNo2 = extract_field(Html, <<"reg_no">>),
      build_student_json(RegNo2, Name2, Dept, School, Year);
    _ ->
      build_student_json(RegNo, Name, Dept, School, Year)
  end.

%% Extract a field value from HTML by looking for label patterns.
extract_field(Html, Label) ->
  %% Pattern: <td>Label</td><td>Value</td> or <th>Label</th><td>Value</td>
  Pattern = <<"<t[dh][^>]*>", Label/binary, "</t[dh]>">>,
  case binary:match(Html, Pattern) of
    {Pos, Len} ->
      After = binary:part(Html, Pos + Len, byte_size(Html) - Pos - Len),
      %% Skip to the next <td> or <span> content
      case binary:match(After, <<"<td">>) of
        {TdPos, _} ->
          AfterTd = binary:part(After, TdPos, byte_size(After) - TdPos),
          case extract_inner_text(AfterTd) of
            {ok, Value} -> Value;
            error -> none
          end;
        nomatch ->
          case binary:match(After, <<"<span">>) of
            {SpPos, _} ->
              AfterSp = binary:part(After, SpPos, byte_size(After) - SpPos),
              case extract_inner_text(AfterSp) of
                {ok, Value} -> Value;
                error -> none
              end;
            nomatch -> none
          end
      end;
    nomatch -> none
  end.

%% Extract text content from inside an HTML tag.
extract_inner_text(Html) ->
  %% Find the first > after the opening tag
  case binary:match(Html, <<">">>) of
    {Pos, _} ->
      AfterTag = binary:part(Html, Pos + 1, byte_size(Html) - Pos - 1),
      %% Read until </
      case binary:match(AfterTag, <<"</">>) of
        {EndPos, _} ->
          Text = binary:part(AfterTag, 0, EndPos),
          %% Strip HTML tags from the text
          Clean = strip_html_tags(Text),
          {ok, Clean};
        nomatch -> error
      end;
    nomatch -> error
  end.

%% Strip HTML tags from text.
strip_html_tags(Text) ->
  strip_html_tags(Text, <<>>).

strip_html_tags(<<>>, Acc) -> Acc;
strip_html_tags(<<"<", Rest/binary>>, Acc) ->
  %% Skip until >
  case binary:match(Rest, <<">">>) of
    {Pos, _} -> strip_html_tags(binary:part(Rest, Pos + 1, byte_size(Rest) - Pos - 1), Acc);
    nomatch -> Acc
  end;
strip_html_tags(<<C, Rest/binary>>, Acc) ->
  strip_html_tags(Rest, <<Acc/binary, C>>).

%% Build a JSON string from student fields.
build_student_json(RegNo, Name, Dept, School, Year) ->
  Json = <<"{",
    "\"registration_no\":\"", (safe_json(RegNo))/binary, "\",",
    "\"name\":\"", (safe_json(Name))/binary, "\",",
    "\"department\":\"", (safe_json(Dept))/binary, "\",",
    "\"school\":\"", (safe_json(School))/binary, "\",",
    "\"year\":\"", (safe_json(Year))/binary,
    "}">>,
  {ok, Json}.

%% Safe JSON string — escape special chars, handle 'none' atom.
safe_json(none) -> <<"">>;
safe_json(Bin) when is_binary(Bin) ->
  iolist_to_binary(escape_json_chars(Bin));
safe_json(_) -> <<"">>.

escape_json_chars(<<>>) -> [];
escape_json_chars(<<C, Rest/binary>>) when C =:= $\n -> [<<"\\n">> | escape_json_chars(Rest)];
escape_json_chars(<<C, Rest/binary>>) when C =:= $\r -> [<<"\\r">> | escape_json_chars(Rest)];
escape_json_chars(<<C, Rest/binary>>) when C =:= $\t -> [<<"\\t">> | escape_json_chars(Rest)];
escape_json_chars(<<C, Rest/binary>>) when C =:= $\\ -> [<<"\\\\">> | escape_json_chars(Rest)];
escape_json_chars(<<C, Rest/binary>>) when C =:= $" -> [<<"\\\"">> | escape_json_chars(Rest)];
escape_json_chars(<<C, Rest/binary>>) -> [<<C>> | escape_json_chars(Rest)].

%% URL-encode a string.
uri_encode(Str) -> uri_encode(Str, []).

uri_encode([], Acc) -> lists:reverse(Acc);
uri_encode([C | Rest], Acc) when
  (C >= $A andalso C =< $Z) orelse
  (C >= $a andalso C =< $z) orelse
  (C >= $0 andalso C =< $9) orelse
  C =:= $- orelse C =:= $_ orelse C =:= $. orelse C =:= $~ ->
  uri_encode(Rest, [C | Acc]);
uri_encode([C | Rest], Acc) ->
  Hex = io_lib:format("~2.16.0b", [C]),
  Pct = "%" ++ Hex,
  uri_encode(Rest, lists:reverse(Pct) ++ Acc).
