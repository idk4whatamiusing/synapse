//// Knowledge base for campus FAQ retrieval (FR-9, NFR-3).
//// Simple keyword search — no vector embeddings for v1.

import gleam/string
import synapse_pg as pg

pub type KbEntry {
  KbEntry(
    id: String,
    category: String,
    question: String,
    answer: String,
  )
}

pub fn search(query: String) -> Result(List(KbEntry), String) {
  let terms = extract_search_terms(query)
  case terms {
    [] -> Ok([])
    [term, ..] -> search_with_term(term)
  }
}

fn search_with_term(term: String) -> Result(List(KbEntry), String) {
  let pattern = "%" <> term <> "%"
  case pg.query_list(
    "SELECT id, category, question, answer
       FROM knowledge_base
      WHERE LOWER(question) LIKE LOWER($1)
         OR LOWER(answer) LIKE LOWER($1)
         OR LOWER(keywords) LIKE LOWER($1)
      ORDER BY
        CASE WHEN LOWER(question) LIKE LOWER($1) THEN 0 ELSE 1 END,
        id
      LIMIT 5",
    [pattern],
  ) {
    pg.Rows(rows) -> Ok(rows_to_entries(rows))
    pg.Failed(reason) -> Error(reason)
  }
}

fn rows_to_entries(rows: List(List(String))) -> List(KbEntry) {
  case rows {
    [] -> []
    [row, ..rest] -> {
      let assert [id, category, question, answer] = row
      [KbEntry(id, category, question, answer), ..rows_to_entries(rest)]
    }
  }
}

fn extract_search_terms(query: String) -> List(String) {
  query
  |> string.lowercase
  |> string.split(" ")
  |> filter_noise_words
}

fn filter_noise_words(words: List(String)) -> List(String) {
  case words {
    [] -> []
    [word, ..rest] -> {
      let trimmed = string.trim(word)
      case is_noise_word(trimmed) || string.length(trimmed) < 2 {
        True -> filter_noise_words(rest)
        False -> [trimmed, ..filter_noise_words(rest)]
      }
    }
  }
}

fn is_noise_word(word: String) -> Bool {
  word == "the"
  || word == "is"
  || word == "a"
  || word == "an"
  || word == "what"
  || word == "how"
  || word == "where"
  || word == "when"
  || word == "can"
  || word == "do"
  || word == "does"
  || word == "i"
  || word == "my"
  || word == "me"
  || word == "we"
  || word == "you"
  || word == "to"
  || word == "in"
  || word == "on"
  || word == "at"
  || word == "for"
  || word == "of"
  || word == "and"
  || word == "or"
  || word == "is"
  || word == "it"
  || word == "this"
  || word == "that"
}

pub fn format_context(entries: List(KbEntry)) -> String {
  case entries {
    [] -> ""
    _ -> {
      let parts = entries |> list_map_entries(fn(e) {
        "Q: " <> e.question <> "\nA: " <> e.answer
      })
      "Relevant campus information:\n" <> join_strings(parts, "\n\n")
    }
  }
}

fn list_map_entries(items: List(a), fun: fn(a) -> String) -> List(String) {
  case items {
    [] -> []
    [item, ..rest] -> [fun(item), ..list_map_entries(rest, fun)]
  }
}

fn join_strings(items: List(String), sep: String) -> String {
  case items {
    [] -> ""
    [single] -> single
    [first, ..rest] -> first <> sep <> join_strings(rest, sep)
  }
}
