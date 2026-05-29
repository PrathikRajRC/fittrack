import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { coachApi, queryApi } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

const COACH_SUGGESTED = [
  "How does my training look this month?",
  "What should I do to improve my run pace?",
  "Am I training too hard or not enough?",
  "How can I build towards a half marathon?",
  "Analyse my consistency and recovery patterns",
];

const QUERY_SUGGESTED = [
  "Show me my best 5K pace this year",
  "What's my longest run ever?",
  "How many km did I run last month?",
  "Which month had the most activities?",
  "What's my fastest 10K pace?",
];

const MD_STYLES = `
  .md-body { font-size: 13.5px; line-height: 1.75; color: var(--text); }
  .md-body p { margin: 0 0 12px; }
  .md-body p:last-child { margin-bottom: 0; }
  .md-body h2 { font-family: var(--font-display); font-size: 15px; font-weight: 800;
    color: var(--text); margin: 18px 0 8px; letter-spacing: 0.02em; text-transform: uppercase; }
  .md-body h3 { font-size: 13.5px; font-weight: 700; color: var(--text); margin: 14px 0 6px; }
  .md-body ul, .md-body ol { margin: 0 0 12px; padding-left: 0; list-style: none; }
  .md-body li { position: relative; padding-left: 18px; margin-bottom: 6px; }
  .md-body ul li::before { content: "▸"; position: absolute; left: 0; color: var(--accent); font-size: 11px; top: 2px; }
  .md-body ol { counter-reset: item; }
  .md-body ol li { counter-increment: item; }
  .md-body ol li::before { content: counter(item) "."; position: absolute; left: 0; color: var(--accent); font-size: 12px; font-weight: 700; }
  .md-body strong { color: var(--accent); font-weight: 700; }
  .md-body em { color: var(--text2); font-style: italic; }
  .md-body code { background: rgba(0,229,255,0.08); border: 1px solid rgba(0,229,255,0.15);
    border-radius: 4px; padding: 1px 6px; font-size: 12px; color: var(--accent); }
  .md-body blockquote { border-left: 2px solid var(--accent); margin: 12px 0;
    padding: 6px 14px; color: var(--text2); font-style: italic; }
`;

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center", padding: "4px 0" }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{
          width: 6, height: 6, borderRadius: "50%", background: "var(--accent)",
          animation: `coachDot 1.2s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
    </div>
  );
}

function SuggestChips({ items, onSelect }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 600 }}>
      {items.map((s) => (
        <button key={s} onClick={() => onSelect(s)} style={{
          background: "var(--surface)", border: "1px solid var(--border2)",
          borderRadius: 20, padding: "8px 16px", fontSize: 12,
          color: "var(--text2)", cursor: "pointer", transition: "all 0.15s",
        }}
          onMouseOver={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; e.currentTarget.style.background = "var(--accent3)"; }}
          onMouseOut={(e)  => { e.currentTarget.style.borderColor = "var(--border2)"; e.currentTarget.style.color = "var(--text2)"; e.currentTarget.style.background = "var(--surface)"; }}
        >{s}</button>
      ))}
    </div>
  );
}

function AssistantMessage({ content }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", maxWidth: 760 }}>
      <div style={{
        width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
        background: "linear-gradient(135deg, var(--accent), var(--purple))",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, marginTop: 2,
      }}>🤖</div>
      <div style={{
        flex: 1, borderLeft: "2px solid rgba(0,229,255,0.3)",
        paddingLeft: 16,
      }}>
        <div className="md-body">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

function UserMessage({ content }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <div style={{
        maxWidth: "58%", background: "var(--accent3)",
        border: "1px solid rgba(0,229,255,0.2)",
        borderRadius: "16px 16px 4px 16px",
        padding: "10px 16px", fontSize: 13, lineHeight: 1.6,
        color: "var(--text)",
      }}>
        {content}
      </div>
    </div>
  );
}

export default function CoachPage() {
  const { isImportMode } = useAuth();
  const [mode,        setMode]       = useState("coach");
  const [messages,    setMessages]   = useState([]);
  const [input,       setInput]      = useState("");
  const [loading,     setLoading]    = useState(false);
  const [apiError,    setApiError]   = useState(false);
  const [queryResult, setQueryResult] = useState(null);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, queryResult]);

  const switchMode = (m) => {
    setMode(m);
    setInput("");
    setApiError(false);
    setQueryResult(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput("");
    setLoading(true);
    setApiError(false);
    inputRef.current?.focus();

    if (mode === "query") {
      setQueryResult(null);
      try {
        const { data } = await queryApi.ask(content);
        setQueryResult({ question: content, answer: data.answer });
      } catch (err) {
        if (err.response?.status === 503) setApiError(true);
        else setQueryResult({ question: content, answer: "Couldn't fetch an answer right now. Please try again." });
      } finally {
        setLoading(false);
      }
      return;
    }

    const userMsg     = { role: "user", content };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);

    try {
      const { data } = await coachApi.chat(newMessages.map((m) => ({ role: m.role, content: m.content })));
      setMessages([...newMessages, { role: "assistant", content: data.content }]);
    } catch (err) {
      if (err.response?.status === 503) {
        setApiError(true);
        setMessages(newMessages);
      } else {
        setMessages([...newMessages, { role: "assistant", content: "I'm having trouble connecting right now. Please try again." }]);
      }
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => { setMessages([]); setApiError(false); setQueryResult(null); };

  if (isImportMode) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh", padding: 40, textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 20 }}>🤖</div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800, marginBottom: 10 }}>AI Coach needs Strava OAuth</div>
        <div style={{ fontSize: 14, color: "var(--text2)", maxWidth: 420, lineHeight: 1.7 }}>
          The AI Coach reads your live Strava activities to provide personalised coaching. This feature requires a direct Strava OAuth connection.
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes coachDot {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
          40%            { transform: scale(1);   opacity: 1; }
        }
        ${MD_STYLES}
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 60px)", overflow: "hidden" }}>

        {/* Header */}
        <div style={{
          padding: "16px 28px 12px", borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
        }}>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800 }}>
              {mode === "coach" ? "AI Fitness Coach" : "Query Your Data"}
            </div>
            <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>
              {mode === "coach"
                ? "Llama 3.3 · 70B · Groq · reads your real Strava data"
                : "Natural language search across your full activity history"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ display: "flex", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 3 }}>
              {[["coach", "Coach"], ["query", "Query"]].map(([m, label]) => (
                <button key={m} onClick={() => switchMode(m)} style={{
                  background: mode === m ? "var(--accent)" : "none",
                  color: mode === m ? "#0d1320" : "var(--text3)",
                  border: "none", borderRadius: 7, padding: "5px 16px",
                  fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
                }}>{label}</button>
              ))}
            </div>
            {mode === "coach" && messages.length > 0 && (
              <button onClick={clearChat} style={{
                background: "none", border: "1px solid var(--border)", borderRadius: 8,
                color: "var(--text3)", fontSize: 12, padding: "6px 14px", cursor: "pointer",
              }}>New chat</button>
            )}
          </div>
        </div>

        {/* Scroll area */}
        <div style={{ flex: 1, overflowY: "auto", padding: "28px 36px", display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Coach empty state */}
          {mode === "coach" && messages.length === 0 && !loading && (
            <div style={{ margin: "auto 0", display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 0 24px" }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>🤖</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 800, marginBottom: 8, textAlign: "center" }}>
                Your Personal Fitness Coach
              </div>
              <div style={{ fontSize: 13, color: "var(--text3)", maxWidth: 400, textAlign: "center", marginBottom: 28, lineHeight: 1.6 }}>
                I have your real Strava data. Ask me anything — pacing, training load, race plans, recovery.
              </div>
              <SuggestChips items={COACH_SUGGESTED} onSelect={send} />
            </div>
          )}

          {/* Query empty state */}
          {mode === "query" && !queryResult && !loading && (
            <div style={{ margin: "auto 0", display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 0 24px" }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>🔍</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 800, marginBottom: 8, textAlign: "center" }}>
                Ask Anything About Your Data
              </div>
              <div style={{ fontSize: 13, color: "var(--text3)", maxWidth: 400, textAlign: "center", marginBottom: 28, lineHeight: 1.6 }}>
                PRs, totals, streaks, paces — your full history is searched.
              </div>
              <SuggestChips items={QUERY_SUGGESTED} onSelect={send} />
            </div>
          )}

          {/* Query result */}
          {mode === "query" && queryResult && !loading && (
            <div style={{ maxWidth: 700, margin: "0 auto", width: "100%" }}>
              <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 12, fontStyle: "italic" }}>
                "{queryResult.question}"
              </div>
              <div style={{
                background: "var(--surface)", border: "1px solid var(--border2)",
                borderLeft: "3px solid var(--accent)",
                borderRadius: 14, padding: "20px 24px",
              }}>
                <div className="md-body">
                  <ReactMarkdown>{queryResult.answer}</ReactMarkdown>
                </div>
              </div>
              <button onClick={() => setQueryResult(null)} style={{
                marginTop: 14, background: "none", border: "1px solid var(--border)",
                borderRadius: 8, color: "var(--text3)", fontSize: 12, padding: "6px 16px", cursor: "pointer",
              }}>Ask another</button>
            </div>
          )}

          {/* Coach messages */}
          {mode === "coach" && messages.map((m, i) =>
            m.role === "user"
              ? <UserMessage key={i} content={m.content} />
              : <AssistantMessage key={i} content={m.content} />
          )}

          {/* Loading states */}
          {mode === "coach" && loading && (
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{
                width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(135deg, var(--accent), var(--purple))",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15,
              }}>🤖</div>
              <div style={{ borderLeft: "2px solid rgba(0,229,255,0.3)", paddingLeft: 16, paddingTop: 6 }}>
                <TypingDots />
              </div>
            </div>
          )}

          {mode === "query" && loading && (
            <div style={{ maxWidth: 700, margin: "0 auto", width: "100%" }}>
              <div style={{ background: "var(--surface)", border: "1px solid var(--border2)", borderLeft: "3px solid var(--accent)", borderRadius: 14, padding: "20px 24px" }}>
                <TypingDots />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Error banner */}
        {apiError && (
          <div style={{
            padding: "10px 28px", flexShrink: 0,
            background: "rgba(239,68,68,0.07)", borderTop: "1px solid rgba(239,68,68,0.18)",
            fontSize: 12, color: "#ef4444",
          }}>
            ⚠️ <strong>GROQ_API_KEY</strong> not set in <code>backend/.env</code>. Restart the backend after adding it. Get a free key at console.groq.com.
          </div>
        )}

        {/* Input bar */}
        <div style={{ padding: "12px 28px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, flexShrink: 0 }}>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={mode === "query" ? "e.g. Show me my best 5K pace this year…" : "Ask your coach anything…"}
            disabled={loading}
            style={{
              flex: 1, background: "var(--surface)", border: "1px solid var(--border2)",
              borderRadius: 12, padding: "11px 18px", fontSize: 13, color: "var(--text)",
              outline: "none", fontFamily: "var(--font-body)", transition: "border-color 0.15s",
            }}
            onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; }}
            onBlur={(e)  => { e.target.style.borderColor = "var(--border2)"; }}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            style={{
              background: "var(--accent)", color: "#0d1320", border: "none",
              borderRadius: 12, padding: "11px 22px", fontWeight: 700, fontSize: 13,
              cursor: "pointer", flexShrink: 0, transition: "opacity 0.15s",
              opacity: !input.trim() || loading ? 0.4 : 1,
            }}
          >Send</button>
        </div>
      </div>
    </>
  );
}
