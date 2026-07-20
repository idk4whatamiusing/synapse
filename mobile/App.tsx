import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import Constants from "expo-constants";

const extra = (Constants.expoConfig?.extra ?? {}) as { apiBase?: string; apiToken?: string };
const API_BASE = extra.apiBase || "http://localhost:3000";
const API_TOKEN = extra.apiToken || "dev-token";
const USER_ID = "mobile-user";

type Msg = { from: "user" | "bot"; text: string };

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${API_TOKEN}`,
  };
}

export default function App() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [help, setHelp] = useState<{ examples: string[]; topics: string[] } | null>(null);

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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar style="auto" />
      <Text style={styles.title}>Adamas Campus Assistant</Text>

      {help && (
        <View style={styles.help}>
          <Text style={styles.helpTitle}>Try:</Text>
          {help.examples.slice(0, 3).map((ex) => (
            <Pressable key={ex} onPress={() => send(ex)}>
              <Text style={styles.helpItem}>• {ex}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <FlatList
        style={styles.list}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        ListEmptyComponent={
          <Text style={styles.empty}>Ask about hostels, transport, academics, notices, or clubs.</Text>
        }
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.from === "user" ? styles.user : styles.bot]}>
            <Text style={item.from === "user" ? styles.userText : styles.botText}>{item.text}</Text>
          </View>
        )}
      />

      {messages.length > 0 && (
        <View style={styles.rateRow}>
          <Text>Rate: </Text>
          {[1, 2, 3, 4, 5].map((r) => (
            <Pressable key={r} onPress={() => sendFeedback(r)} style={styles.rateBtn}>
              <Text>{r}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type your question..."
          onSubmitEditing={() => send(input)}
        />
        <Pressable style={styles.sendBtn} onPress={() => send(input)} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendText}>Send</Text>}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 16, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  help: { backgroundColor: "#f4f4f4", padding: 12, borderRadius: 8, marginBottom: 12 },
  helpTitle: { fontWeight: "600", marginBottom: 4 },
  helpItem: { color: "#2563eb", paddingVertical: 2 },
  list: { flex: 1 },
  empty: { color: "#888", textAlign: "center", marginTop: 24 },
  bubble: { padding: 10, borderRadius: 12, marginVertical: 4, maxWidth: "80%" },
  user: { alignSelf: "flex-end", backgroundColor: "#2563eb" },
  bot: { alignSelf: "flex-start", backgroundColor: "#e5e7eb" },
  userText: { color: "#fff" },
  botText: { color: "#111" },
  rateRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  rateBtn: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: "#eee", borderRadius: 6, marginRight: 4 },
  inputRow: { flexDirection: "row", marginBottom: 24 },
  input: { flex: 1, borderWidth: 1, borderColor: "#ccc", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  sendBtn: { backgroundColor: "#2563eb", borderRadius: 8, paddingHorizontal: 16, justifyContent: "center", marginLeft: 8 },
  sendText: { color: "#fff", fontWeight: "600" },
});
