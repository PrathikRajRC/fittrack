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

const COACH_STYLES = `
  @keyframes coachDot {
    0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
    40%            { transform: scale(1);   opacity: 1; }
  }

  /* Layout shell */
  .coach-shell {
    display: flex; flex-direction: column;
    height: calc(100vh - 60px);
    overflow: hidden;
  }
  .coach-header {
    padding: 16px 28px 12px;
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
    gap: 12px; flex-shrink: 0;
  }
  .coach-header-info { min-width: 0; }
  .coach-header-title {
    font-family: var(--font-display);
    font-size: 20px; font-weight: 800;
    line-height: 1.2;
  }
  .coach-header-sub {
    font-size: 11px; color: var(--text3); margin-top: 2px;
  }
  .coach-header-actions { display: flex; gap: 8px; align-items: center; flex-shrink: 0; }

  .coach-mode-toggle {
    display: flex; background: var(--surface);
    border: 1px solid var(--border); border-radius: 10px;
    padding: 3px;
  }
  .coach-mode-btn {
    background: none; color: var(--text3);
    border: none; border-radius: 7px;
    padding: 5px 16px;
    font-size: 12px; font-weight: 700;
    cursor: pointer; transition: all 0.15s;
  }
  .coach-mode-btn.active { background: var(--accent); color: #0d1320; }

  .coach-newchat-btn {
    background: none; border: 1px solid var(--border); border-radius: 8px;
    color: var(--text3); font-size: 12px;
    padding: 6px 14px; cursor: pointer;
  }

  /* Scroll area */
  .coach-scroll {
    flex: 1; overflow-y: auto;
    padding: 28px 36px;
    display: flex; flex-direction: column; gap: 24px;
  }

  /* Empty state */
  .coach-empty {
    margin: auto 0;
    display: flex; flex-direction: column; align-items: center;
    padding: 40px 0 24px;
  }
  .coach-empty-icon { font-size: 52px; margin-bottom: 16px; }
  .coach-empty-title {
    font-family: var(--font-display);
    font-size: 24px; font-weight: 800;
    margin-bottom: 8px; text-align: center;
  }
  .coach-empty-desc {
    font-size: 13px; color: var(--text3);
    max-width: 400px; text-align: center;
    margin-bottom: 28px; line-height: 1.6;
  }

  /* Suggested chips */
  .coach-chips {
    display: flex; flex-wrap: wrap; gap: 8px;
    justify-content: center; max-width: 600px;
  }
  .coach-chip {
    background: var(--surface);
    border: 1px solid var(--border2);
    border-radius: 20px;
    padding: 8px 16px;
    font-size: 12px; color: var(--text2);
    cursor: pointer; transition: all 0.15s;
  }
  .coach-chip:hover, .coach-chip:active {
    border-color: var(--accent);
    color: var(--accent);
    background: var(--accent3);
  }

  /* Messages */
  .coach-msg-assist {
    display: flex; gap: 12px;
    align-items: flex-start; max-width: 760px;
  }
  .coach-msg-avatar {
    width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;
    background: linear-gradient(135deg, var(--accent), var(--purple));
    display: flex; align-items: center; justify-content: center;
    font-size: 15px; margin-top: 2px;
  }
  .coach-msg-body {
    flex: 1; min-width: 0;
    border-left: 2px solid rgba(0,229,255,0.3);
    padding-left: 16px;
  }
  .coach-msg-user {
    display: flex; justify-content: flex-end;
  }
  .coach-msg-user-bubble {
    max-width: 58%;
    background: var(--accent3);
    border: 1px solid rgba(0,229,255,0.2);
    border-radius: 16px 16px 4px 16px;
    padding: 10px 16px;
    font-size: 13px; line-height: 1.6;
    color: var(--text);
    word-wrap: break-word;
  }

  /* Query result card */
  .coach-query-wrap {
    max-width: 700px; margin: 0 auto; width: 100%;
  }
  .coach-query-q {
    font-size: 12px; color: var(--text3);
    margin-bottom: 12px; font-style: italic;
  }
  .coach-query-card {
    background: var(--surface);
    border: 1px solid var(--border2);
    border-left: 3px solid var(--accent);
    border-radius: 14px;
    padding: 20px 24px;
  }

  /* Markdown rendering */
  .md-body { font-size: 13.5px; line-height: 1.75; color: var(--text); }
  .md-body p { margin: 0 0 12px; }
  .md-body p:last-child { margin-bottom: 0; }
  .md-body h2 {
    font-family: var(--font-display); font-size: 15px; font-weight: 800;
    color: var(--text); margin: 18px 0 8px;
    letter-spacing: 0.02em; text-transform: uppercase;
  }
  .md-body h3 { font-size: 13.5px; font-weight: 700; color: var(--text); margin: 14px 0 6px; }
  .md-body ul, .md-body ol { margin: 0 0 12px; padding-left: 0; list-style: none; }
  .md-body li { position: relative; padding-left: 18px; margin-bottom: 6px; }
  .md-body ul li::before { content: "▸"; position: absolute; left: 0; color: var(--accent); font-size: 11px; top: 2px; }
  .md-body ol { counter-reset: item; }
  .md-body ol li { counter-increment: item; }
  .md-body ol li::before { content: counter(item) "."; position: absolute; left: 0; color: var(--accent); font-size: 12px; font-weight: 700; }
  .md-body strong { color: var(--accent); font-weight: 700; }
  .md-body em { color: var(--text2); font-style: italic; }
  .md-body code {
    background: rgba(0,229,255,0.08);
    border: 1px solid rgba(0,229,255,0.15);
    border-radius: 4px; padding: 1px 6px;
    font-size: 12px; color: var(--accent);
  }
  .md-body blockquote {
    border-left: 2px solid var(--accent);
    margin: 12px 0; padding: 6px 14px;
    color: var(--text2); font-style: italic;
  }

  /* Input bar */
  .coach-input-bar {
    padding: 12px 28px 20px;
    border-top: 1px solid var(--border);
    display: flex; gap: 10px; flex-shrink: 0;
  }
  .coach-input {
    flex: 1; background: var(--surface);
    border: 1px solid var(--border2); border-radius: 12px;
    padding: 11px 18px; font-size: 13px; color: var(--text);
    outline: none; font-family: var(--font-body);
    transition: border-color 0.15s;
    min-width: 0;
  }
  .coach-input:focus { border-color: var(--accent); }
  .coach-send-btn {
    background: var(--accent); color: #0d1320; border: none;
    border-radius: 12px; padding: 11px 22px;
    font-weight: 700; font-size: 13px;
    cursor: pointer; flex-shrink: 0;
    transition: opacity 0.15s;
  }
  .coach-send-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  /* Error banner */
  .coach-error-banner {
    padding: 12px 28px; flex-shrink: 0;
    background: rgba(239,68,68,0.07);
    border-top: 1px solid rgba(239,68,68,0.18);
    font-size: 12px; color: #ef4444;
    line-height: 1.55;
  }

  /* ── Mobile ────────────────────────────────────────────────────── */
  @media (max-width: 640px) {
    .coach-header {
      padding: 12px 14px 10px;
      flex-direction: column;
      align-items: stretch;
      gap: 10px;
    }
    .coach-header-info { text-align: left; }
    .coach-header-title { font-size: 17px; }
    .coach-header-sub { font-size: 10.5px; }
    .coach-header-actions { justify-content: space-between; }
    .coach-mode-toggle { flex: 1; }
    .coach-mode-btn { flex: 1; padding: 7px 8px; font-size: 12px; }
    .coach-newchat-btn { padding: 7px 12px; font-size: 11.5px; }

    .coach-scroll {
      padding: 16px 14px 12px;
      gap: 18px;
    }

    .coach-empty { padding: 24px 0 16px; }
    .coach-empty-icon { font-size: 44px; margin-bottom: 12px; }
    .coach-empty-title { font-size: 20px; }
    .coach-empty-desc { font-size: 12.5px; margin-bottom: 20px; }

    .coach-chips { gap: 6px; }
    .coach-chip {
      padding: 9px 14px;
      font-size: 12px;
      min-height: 38px;
      display: inline-flex; align-items: center;
    }

    .coach-msg-assist { gap: 10px; }
    .coach-msg-avatar { width: 28px; height: 28px; font-size: 14px; }
    .coach-msg-body { padding-left: 12px; }
    .coach-msg-user-bubble {
      max-width: 82%;
      font-size: 13.5px;
      padding: 10px 14px;
    }

    .coach-query-card { padding: 16px 16px; border-radius: 12px; }
    .coach-query-q { font-size: 11.5px; margin-bottom: 8px; }

    .md-body { font-size: 13.5px; }
    .md-body h2 { font-size: 14px; }

    .coach-input-bar {
      padding: 10px 12px max(12px, env(safe-area-inset-bottom));
      gap: 8px;
    }
    .coach-input {
      padding: 12px 14px;
      font-size: 15px;  /* prevent iOS auto-zoom */
      border-radius: 14px;
    }
    .coach-send-btn {
      padding: 12px 18px;
      border-radius: 14px;
      font-size: 13px;
      min-width: 64px;
    }

    .coach-error-banner { padding: 10px 14px; font-size: 11.5px; }
  }
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
    <div className="coach-chips">
      {items.map((s) => (
        <button key={s} onClick={() => onSelect(s)} className="coach-chip">
          {s}
        </button>
      ))}
    </div>
  );
}

function AssistantMessage({ content }) {
  return (
    <div className="coach-msg-assist">
      <div className="coach-msg-avatar">🤖</div>
      <div className="coach-msg-body">
        <div className="md-body">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

function UserMessage({ content }) {
  return (
    <div className="coach-msg-user">
      <div className="coach-msg-user-bubble">{content}</div>
    </div>
  );
}

// Detect prod build so the error message points to the right place
const IS_DEPLOYED = !import.meta.env.DEV;

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
      <style>{COACH_STYLES}</style>

      <div className="coach-shell">

        {/* Header */}
        <div className="coach-header">
          <div className="coach-header-info">
            <div className="coach-header-title">
              {mode === "coach" ? "AI Fitness Coach" : "Query Your Data"}
            </div>
            <div className="coach-header-sub">
              {mode === "coach"
                ? "Llama 3.3 · 70B · Groq · reads your real Strava data"
                : "Natural language search across your full activity history"}
            </div>
          </div>
          <div className="coach-header-actions">
            <div className="coach-mode-toggle">
              {[["coach", "Coach"], ["query", "Query"]].map(([m, label]) => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className={`coach-mode-btn ${mode === m ? "active" : ""}`}
                >{label}</button>
              ))}
            </div>
            {mode === "coach" && messages.length > 0 && (
              <button onClick={clearChat} className="coach-newchat-btn">New chat</button>
            )}
          </div>
        </div>

        {/* Scroll area */}
        <div className="coach-scroll">

          {/* Coach empty state */}
          {mode === "coach" && messages.length === 0 && !loading && (
            <div className="coach-empty">
              <div className="coach-empty-icon">🤖</div>
              <div className="coach-empty-title">Your Personal Fitness Coach</div>
              <div className="coach-empty-desc">
                I have your real Strava data. Ask me anything — pacing, training load, race plans, recovery.
              </div>
              <SuggestChips items={COACH_SUGGESTED} onSelect={send} />
            </div>
          )}

          {/* Query empty state */}
          {mode === "query" && !queryResult && !loading && (
            <div className="coach-empty">
              <div className="coach-empty-icon">🔍</div>
              <div className="coach-empty-title">Ask Anything About Your Data</div>
              <div className="coach-empty-desc">
                PRs, totals, streaks, paces — your full history is searched.
              </div>
              <SuggestChips items={QUERY_SUGGESTED} onSelect={send} />
            </div>
          )}

          {/* Query result */}
          {mode === "query" && queryResult && !loading && (
            <div className="coach-query-wrap">
              <div className="coach-query-q">"{queryResult.question}"</div>
              <div className="coach-query-card">
                <div className="md-body">
                  <ReactMarkdown>{queryResult.answer}</ReactMarkdown>
                </div>
              </div>
              <button onClick={() => setQueryResult(null)} style={{
                marginTop: 14, background: "none", border: "1px solid var(--border)",
                borderRadius: 8, color: "var(--text3)", fontSize: 12,
                padding: "6px 16px", cursor: "pointer",
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
            <div className="coach-msg-assist">
              <div className="coach-msg-avatar">🤖</div>
              <div className="coach-msg-body" style={{ paddingTop: 6 }}>
                <TypingDots />
              </div>
            </div>
          )}

          {mode === "query" && loading && (
            <div className="coach-query-wrap">
              <div className="coach-query-card">
                <TypingDots />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Error banner — deployment-aware message */}
        {apiError && (
          <div className="coach-error-banner">
            ⚠️ <strong>AI Coach not configured.</strong>{" "}
            {IS_DEPLOYED ? (
              <>The backend on your hosting platform is missing <code>GROQ_API_KEY</code>.
              Add it as an environment variable in your backend service (Render / Railway / Fly etc.)
              and redeploy. Get a free key at <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" style={{ color: "#ef4444", textDecoration: "underline" }}>console.groq.com</a>.</>
            ) : (
              <>Set <code>GROQ_API_KEY</code> in <code>backend/.env</code> and restart the backend.
              Get a free key at <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" style={{ color: "#ef4444", textDecoration: "underline" }}>console.groq.com</a>.</>
            )}
          </div>
        )}

        {/* Input bar */}
        <div className="coach-input-bar">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={mode === "query" ? "e.g. Best 5K pace this year…" : "Ask your coach anything…"}
            disabled={loading}
            className="coach-input"
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className="coach-send-btn"
          >Send</button>
        </div>
      </div>
    </>
  );
}
