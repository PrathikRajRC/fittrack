import { useState, useRef, useEffect } from "react";
import { coachApi } from "../services/api.js";

const SUGGESTED = [
  "How does my training look this month?",
  "What should I do to improve my run pace?",
  "Am I training too hard or not enough?",
  "How can I build towards a half marathon?",
  "Analyse my consistency and recovery patterns",
];

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center", padding: "4px 0" }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "var(--accent)",
            animation: `coachDot 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

export default function CoachPage() {
  const [messages,  setMessages]  = useState([]);
  const [input,     setInput]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [apiError,  setApiError]  = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const userMsg    = { role: "user", content };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setApiError(false);
    inputRef.current?.focus();

    try {
      const { data } = await coachApi.chat(
        newMessages.map((m) => ({ role: m.role, content: m.content }))
      );
      setMessages([...newMessages, { role: "assistant", content: data.content }]);
    } catch (err) {
      if (err.response?.status === 503) {
        setApiError(true);
        setMessages(newMessages);
      } else {
        setMessages([
          ...newMessages,
          { role: "assistant", content: "I'm having trouble connecting right now. Please try again in a moment." },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => { setMessages([]); setApiError(false); };

  return (
    <>
      {/* Keyframe injection for typing dots */}
      <style>{`
        @keyframes coachDot {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
          40%            { transform: scale(1);   opacity: 1; }
        }
      `}</style>

      <div style={{
        display: "flex", flexDirection: "column",
        height: "calc(100vh - 60px)", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          padding: "18px 28px 14px",
          borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800 }}>
              AI Fitness Coach
            </div>
            <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 3 }}>
              Powered by Claude · Reads your real Strava data
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              style={{
                background: "none", border: "1px solid var(--border)", borderRadius: 8,
                color: "var(--text3)", fontSize: 12, padding: "6px 14px", cursor: "pointer",
              }}
            >
              New chat
            </button>
          )}
        </div>

        {/* Messages area */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
          {messages.length === 0 && !loading && (
            <div style={{ margin: "auto 0", display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 0 24px" }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>🤖</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800, marginBottom: 10, textAlign: "center" }}>
                Your Personal Fitness Coach
              </div>
              <div style={{ fontSize: 13, color: "var(--text3)", maxWidth: 420, textAlign: "center", marginBottom: 32, lineHeight: 1.6 }}>
                I've analysed your Strava training data. Ask me anything about your fitness, training patterns, or how to reach your goals.
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 580 }}>
                {SUGGESTED.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    style={{
                      background: "var(--surface)", border: "1px solid var(--border)",
                      borderRadius: 20, padding: "9px 18px", fontSize: 12,
                      color: "var(--text2)", cursor: "pointer", transition: "all 0.18s",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = "var(--accent)";
                      e.currentTarget.style.color = "var(--accent)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = "var(--border)";
                      e.currentTarget.style.color = "var(--text2)";
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}
            >
              {m.role === "assistant" && (
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, var(--accent), var(--purple))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, flexShrink: 0, marginRight: 10, marginTop: 2,
                }}>
                  🤖
                </div>
              )}
              <div style={{
                maxWidth: "72%",
                background: m.role === "user" ? "var(--accent)" : "var(--surface)",
                color: m.role === "user" ? "#0d1320" : "var(--text1)",
                borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                padding: "12px 18px",
                fontSize: 13,
                lineHeight: 1.65,
                border: m.role === "assistant" ? "1px solid var(--border)" : "none",
                whiteSpace: "pre-wrap",
              }}>
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: "linear-gradient(135deg, var(--accent), var(--purple))",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
              }}>
                🤖
              </div>
              <div style={{
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: "18px 18px 18px 4px", padding: "12px 18px",
              }}>
                <TypingDots />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* API key error banner */}
        {apiError && (
          <div style={{
            padding: "12px 28px", flexShrink: 0,
            background: "rgba(239,68,68,0.08)", borderTop: "1px solid rgba(239,68,68,0.2)",
            fontSize: 12, color: "#ef4444", lineHeight: 1.5,
          }}>
            ⚠️ <strong>ANTHROPIC_API_KEY</strong> is not set in <code>backend/.env</code>. Add it and restart the backend to enable the AI coach. Get a key at console.anthropic.com.
          </div>
        )}

        {/* Input bar */}
        <div style={{
          padding: "14px 28px 20px",
          borderTop: "1px solid var(--border)",
          display: "flex", gap: 12, flexShrink: 0,
        }}>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask your coach anything…"
            disabled={loading}
            style={{
              flex: 1, background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: 14, padding: "11px 18px", fontSize: 13, color: "var(--text1)",
              outline: "none", fontFamily: "var(--font-body)", transition: "border-color 0.18s",
            }}
            onFocus={(e)  => { e.target.style.borderColor = "var(--accent)"; }}
            onBlur={(e)   => { e.target.style.borderColor = "var(--border)"; }}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            style={{
              background: "var(--accent)", color: "#0d1320", border: "none",
              borderRadius: 14, padding: "11px 22px", fontWeight: 700, fontSize: 13,
              cursor: "pointer", flexShrink: 0, transition: "opacity 0.18s",
              opacity: !input.trim() || loading ? 0.45 : 1,
            }}
          >
            Send
          </button>
        </div>
      </div>
    </>
  );
}
