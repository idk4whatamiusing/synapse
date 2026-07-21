//// LLM provider abstraction (FR-8, AD-6).
//// One interface: chat(Provider, messages) -> String.
//// OpenRouter backend (OpenAI-compatible); Bedrock stub.
//// Ponytail: OpenRouter first, Bedrock when SigV4 is needed.

import gleam/string

pub type Provider {
  OpenRouter
  Bedrock
}

pub type Message {
  Message(role: String, content: String)
}

pub fn chat(
  provider: Provider,
  messages: List(Message),
) -> Result(String, String) {
  case provider {
    OpenRouter -> openrouter_chat(messages)
    Bedrock -> Error("bedrock not implemented yet")
  }
}

pub fn chat_with_fallback(
  primary: Provider,
  fallback: Provider,
  messages: List(Message),
) -> Result(String, String) {
  case chat(primary, messages) {
    Ok(response) -> Ok(response)
    Error(_) -> chat(fallback, messages)
  }
}

fn openrouter_chat(messages: List(Message)) -> Result(String, String) {
  let api_key = get_env("OPENROUTER_API_KEY")
  case api_key {
    Error(_) -> Error("OPENROUTER_API_KEY not set")
    Ok(key) ->
      case build_openrouter_body(messages) {
        Error(e) -> Error(e)
        Ok(body) ->
          case http_post(
            "https://openrouter.ai/api/v1/chat/completions",
            [
              #("Authorization", "Bearer " <> key),
              #("Content-Type", "application/json"),
              #("HTTP-Referer", "https://synapse.adamas.edu"),
              #("X-Title", "Synapse Campus Assistant"),
            ],
            body,
          ) {
            Error(e) -> Error("http request failed: " <> e)
            Ok(response_body) ->
              extract_content(response_body)
          }
      }
  }
}

fn build_openrouter_body(messages: List(Message)) -> Result(String, String) {
  let msg_json = messages_to_json(messages)
  let body =
    "{\"model\":\"meta-llama/llama-3.1-8b-instruct:free\",\"messages\":"
    <> msg_json
    <> ",\"max_tokens\":512}"
  Ok(body)
}

fn messages_to_json(messages: List(Message)) -> String {
  case messages {
    [] -> "[]"
    [m] -> "[" <> message_to_json(m) <> "]"
    [m, ..rest] ->
      "[" <> message_to_json(m) <> "," <> rest_messages_json(rest) <> "]"
  }
}

fn rest_messages_json(messages: List(Message)) -> String {
  case messages {
    [] -> ""
    [m] -> message_to_json(m)
    [m, ..rest] -> message_to_json(m) <> "," <> rest_messages_json(rest)
  }
}

fn message_to_json(msg: Message) -> String {
  "{\"role\":\"" <> msg.role <> "\",\"content\":\"" <> escape_json(msg.content) <> "\"}"
}

fn escape_json(s: String) -> String {
  s
  |> string.replace("\\", "\\\\")
  |> string.replace("\"", "\\\"")
  |> string.replace("\n", "\\n")
  |> string.replace("\r", "\\r")
  |> string.replace("\t", "\\t")
}

fn extract_content(response_body: String) -> Result(String, String) {
  // Simple extraction: find "content":"..." in OpenRouter response.
  // ponytail: no gleam_json, use string splitting.
  case string.split(response_body, "\"content\":\"") {
    [_, rest] ->
      case extract_json_string(rest) {
        "" -> Error("empty content in response")
        content -> Ok(content)
      }
    _ -> Error("no content field in response")
  }
}

fn extract_json_string(s: String) -> String {
  case string.split(s, "\"") {
    [value, ..] -> unescape_json(value)
    _ -> ""
  }
}

fn unescape_json(s: String) -> String {
  s
  |> string.replace("\\n", "\n")
  |> string.replace("\\r", "\r")
  |> string.replace("\\t", "\t")
  |> string.replace("\\\"", "\"")
  |> string.replace("\\\\", "\\")
}

fn get_env(key: String) -> Result(String, String) {
  ffi_get_env(key)
}

@external(erlang, "services_llm_ffi", "get_env")
fn ffi_get_env(key: String) -> Result(String, String)

fn http_post(
  url: String,
  headers: List(#(String, String)),
  body: String,
) -> Result(String, String) {
  ffi_http_post(url, headers, body)
}

@external(erlang, "services_llm_ffi", "http_post")
fn ffi_http_post(
  url: String,
  headers: List(#(String, String)),
  body: String,
) -> Result(String, String)
