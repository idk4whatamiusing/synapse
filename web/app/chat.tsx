"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";
const API_TOKEN = process.env.NEXT_PUBLIC_API_TOKEN || "dev-token";
const USER_ID = "web-user";

type Msg = { from: "user" | "bot"; text: string };

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${API_TOKEN}`,
  };
}

export default function Chat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [help, setHelp] = useState<{ examples: string[]; topics: string[] } | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/help`)
      .then((r) => r.json())
      .then(setHelp)
      .catch(() => {});
  }, []);

  async function send(text: string) {
    const message = text.trim();
    if (!message || busy) return;
    setMessages((m) => [...m, { from: "user", text: message }]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ message, userId: USER_ID }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { from: "bot", text: data.message ?? "(no response)" }]);
    } catch {
      setMessages((m) => [...m, { from: "bot", text: "Network error — is the backend running?" }]);
    } finally {
      setBusy(false);
    }
  }

  async function sendFeedback(rating: number) {
    try {
      await fetch(`${API_BASE}/feedback`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          userId: USER_ID,
          message: messages[messages.length - 1]?.text ?? "",
          rating,
          comment: "",
        }),
      });
      setMessages((m) => [...m, { from: "bot", text: `Thanks for your feedback (${rating}/5).` }]);
    } catch {
      /* ignore */
    }
  }

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: 16 }}>
      <h1>Adamas Campus Assistant</h1>
      <button onClick={() => setShowHelp((s) => !s)} style={{ marginBottom: 8 }}>
        {showHelp ? "Hide help" : "Show help"}
      </button>
      {showHelp && help && (
        <div style={{ background: "#f4f4f4", padding: 12, borderRadius: 8, marginBottom: 12 }}>
          <strong>Topics:</strong> {help.topics.join(", ")}
          <ul>
            {help.examples.map((ex) => (
              <li key={ex}>
                <button onClick={() => send(ex)} style={{ cursor: "pointer" }}>
                  {ex}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: 8,
          minHeight: 300,
          padding: 12,
          marginBottom: 12,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {messages.length === 0 && <p style={{ color: "#888" }}>Ask me about hostels, transport, academics, notices, or clubs.</p>}
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.from === "user" ? "flex-end" : "flex-start",
              background: m.from === "user" ? "#2563eb" : "#e5e7eb",
              color: m.from === "user" ? "#fff" : "#111",
              padding: "8px 12px",
              borderRadius: 12,
              whiteSpace: "pre-wrap",
              maxWidth: "80%",
            }}
          >
            {m.text}
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        style={{ display: "flex", gap: 8 }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question..."
          style={{ flex: 1, padding: 8, borderRadius: 8, border: "1px solid #ccc" }}
        />
        <button type="submit" disabled={busy}>
          {busy ? "..." : "Send"}
        </button>
      </form>

      {messages.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <span>Rate last answer: </span>
          {[1, 2, 3, 4, 5].map((r) => (
            <button key={r} onClick={() => sendFeedback(r)} style={{ marginRight: 4 }}>
              {r}
            </button>
          ))}
        </div>
      )}
    </main>
  );
}
