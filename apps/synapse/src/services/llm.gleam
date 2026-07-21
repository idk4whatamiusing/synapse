//// LLM provider abstraction (FR-8, AD-6).
//// One interface: agent_chat(Provider, user_message, context) -> String.
//// OpenRouter backend (OpenAI-compatible) with function calling support.
//// Ponytail: OpenRouter first, Bedrock when SigV4 is needed.
//// FR-9: KB retrieval — search campus FAQ, inject as system context.
//// FR-10: Controllable agent — function calling, tool execution loop.

import gleam/json
import gleam/result
import gleam/string
import services/identity
import services/kb
import services/messages

pub type Provider {
  OpenRouter
  Bedrock
}

pub type Message {
  Message(role: String, content: String)
}

pub type ToolCall {
  ToolCall(id: String, name: String, arguments: String)
}

//// Controllable agent — one entry point: agent_chat.
pub fn agent_chat(
  provider: Provider,
  user_message: String,
  ctx_school: String,
  ctx_dept: String,
  ctx_year: String,
) -> Result(String, String) {
  let context = case kb.search(user_message) {
    Ok(entries) -> kb.format_context(entries)
    Error(_) -> ""
  }
  let system_content = case context {
    "" -> "You are a helpful campus assistant for Adamas University. Answer the user's question."
    ctx -> "You are a helpful campus assistant for Adamas University. Answer based on the provided context when relevant.\n\n" <> ctx
  }
  let messages = [
    Message(role: "system", content: system_content),
    Message(role: "user", content: user_message),
  ]
  agent_loop(provider, messages, ctx_school, ctx_dept, ctx_year, 0)
}

fn agent_loop(
  provider: Provider,
  messages: List(Message),
  ctx_school: String,
  ctx_dept: String,
  ctx_year: String,
  depth: Int,
) -> Result(String, String) {
  case depth > 3 {
    True -> Error("agent loop exceeded max depth")
    False ->
      case provider {
        OpenRouter -> openrouter_agent_loop(messages, ctx_school, ctx_dept, ctx_year, depth)
        Bedrock -> Error("bedrock not implemented yet")
      }
  }
}

fn openrouter_agent_loop(
  messages: List(Message),
  ctx_school: String,
  ctx_dept: String,
  ctx_year: String,
  depth: Int,
) -> Result(String, String) {
  let body = build_openrouter_body_with_tools(messages)
  case http_post(
    "https://openrouter.ai/api/v1/chat/completions",
    [
      #("Authorization", "Bearer " <> get_env("OPENROUTER_API_KEY").unwrap_or("")),
      #("Content-Type", "application/json"),
      #("HTTP-Referer", "https://synapse.adamas.edu"),
      #("X-Title", "Synapse Campus Assistant"),
    ],
    body,
  ) {
    Error(e) -> Error("http request failed: " <> e)
    Ok(response_body) -> {
      let tool_calls = extract_tool_calls(response_body)
      case tool_calls {
        [] -> extract_content(response_body)
        calls -> {
          let results = execute_all_tools(calls, ctx_school, ctx_dept, ctx_year)
          let tool_message = build_tool_message(results)
          let updated_messages = [
            Message(role: "assistant", content: "Executed tools: OK"),
            tool_message,
          ]
          openrouter_agent_loop(updated_messages, ctx_school, ctx_dept, ctx_year, depth + 1)
        }
      }
    }
  }
}

fn execute_all_tools(
  calls: List(ToolCall),
  ctx_school: String,
  ctx_dept: String,
  ctx_year: String,
) -> List(String) {
  case calls {
    [] -> []
    [first, ..rest] -> {
      let result = execute_tool(first, ctx_school, ctx_dept, ctx_year)
      let rest_results = execute_all_tools(rest, ctx_school, ctx_dept, ctx_year)
      [result, ..rest_results]
    }
  }
}

fn execute_tool(
  call: ToolCall,
  ctx_school: String,
  ctx_dept: String,
  ctx_year: String,
) -> String {
  let ctx = identity.AuthContext(
    session_id: "agent",
    school: ctx_school,
    department: ctx_dept,
    year: ctx_year,
  )
  case call.name {
    "post_message" -> {
      let body = parse_tool_arguments(call.arguments)
      case messages.post_message(ctx, body) {
        Ok(msg) -> "Message posted: " <> msg.id
        Error(reason) -> "Error: " <> reason
      }
    }
    _ -> "Unknown tool: " <> call.name
  }
}

fn parse_tool_arguments(args_json: String) -> String {
  case json.parse(args_json) {
    Error(_) -> ""
    Ok(args) -> json.get(args, "body") |> option.unwrap_or("")
  }
}

fn build_tool_message(results: List(String)) -> Message {
  Message(
    role: "tool",
    content: "Tool execution results:\n" <> string_join(results, "\n"),
  )
}

fn extract_tool_calls(response_body: String) -> List(ToolCall) {
  case json.parse(response_body) {
    Error(_) -> []
    Ok(data) -> {
      let tool_calls = case json.get(data, "choices") {
        Error(_) -> []
        Ok(choices) -> case json.get(choices, 0) {
          Error(_) -> []
          Ok(choice) -> case json.get(choice, "message") {
            Error(_) -> []
            Ok(message) -> case json.get(message, "tool_calls") {
              Error(_) -> []
              Ok(calls) -> calls
            }
          }
        }
      }
      case tool_calls {
        [] -> []
        _ -> tool_calls
      }
    }
  }
}

fn extract_content(response_body: String) -> Result(String, String) {
  case json.parse(response_body) {
    Error(_) -> Error("no content field")
    Ok(data) -> case json.get(data, "choices") {
      Error(_) -> Error("no content field")
      Ok(choices) -> case json.get(choices, 0) {
        Error(_) -> Error("no content field")
        Ok(choice) -> {
          case json.get(choice, "message") {
            Error(_) -> Error("no content field")
            Ok(message) -> json.get(message, "content")
          }
        }
      }
    }
  }
}

fn build_openrouter_body_with_tools(messages: List(Message)) -> String {
  let tools_section = tools_json()
  "{\"model\":\"meta-llama/llama-3.1-8b-instruct:free\",\"messages\":"
  <> messages_to_json(messages)
  <> "," <> tools_section
  <> ",\"max_tokens\":512,\"tools\":" <> tools_section}"
}

fn tools_json() -> String {
  "{\"tools\":[{\"type\":\"function\",\"function\":{\"name\":\"post_message\",\"description\":\"Post a message to your dept-year room. Use when user asks to send, post, or share a message to their department year group.\",\"parameters\":{\"type\":\"object\",\"properties\":{\"body\":{\"type\":\"string\",\"description\":\"The message content to post\"}},\"required\":[\"body\"]}}}]}"
}

fn build_openrouter_body(messages: List(Message)) -> String {
  "{\"model\":\"meta-llama/llama-3.1-8b-instruct:free\",\"messages\":"
  <> messages_to_json(messages)
  <> ",\"max_tokens\":512}"
}

fn messages_to_json(messages: List(Message)) -> String {
  case messages {
    [] -> "[]"
    [first, ..rest] -> {
      let first_json = build_message_json(first)
      case rest {
        [] -> "[" <> first_json <> "]"
        [..] -> "[" <> first_json <> "," <> rest_messages_json(rest) <> "]"
      }
    }
  }
}

fn rest_messages_json(messages: List(Message)) -> String {
  case messages {
    [] -> ""
    [first, ..rest] -> build_message_json(first) <> "," <> rest_messages_json(rest)
  }
}

fn build_message_json(msg: Message) -> String {
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

fn string_join(items: List(String), sep: String) -> String {
  list.fold(items, "", fn(acc, item) {
    case acc {
      "" -> item
      _ -> acc <> sep <> item
    }
  })
}
