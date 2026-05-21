import { useMemo, useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useActivities, useAthleteGear } from "../hooks/useActivities.js";
import { useAnalyticsSummary } from "../hooks/useAnalytics.js";
import { Card, CardHeader, Tag, ProgressBar, Spinner } from "../components/ui/index.jsx";
import { fmtPace, fmtDateShort, calcPace } from "../utils/formatters.js";
import { webhookApi } from "../services/api.js";

const SHOE_MAX_KM = 700;
const BIKE_MAX_KM = 10000;

// ── Strava Webhook management panel ──────────────────────────────────────────
function WebhookPanel() {
  const [subscriptions, setSubscriptions] = useState(null);
  const [status,        setStatus]        = useState("idle"); // idle | loading | subscribing | unsubscribing | error
  const [errorMsg,      setErrorMsg]      = useState("");

  const load = () => {
    setStatus("loading");
    webhookApi.getSubscription()
      .then(({ data }) => { setSubscriptions(data.subscriptions ?? []); setStatus("idle"); })
      .catch((err) => { setErrorMsg(err.response?.data?.error ?? "Failed to check subscription"); setStatus("error"); });
  };

  useEffect(() => { load(); }, []);

  const subscribe = async () => {
    setStatus("subscribing");
    setErrorMsg("");
    try {
      await webhookApi.subscribe();
      load();
    } catch (err) {
      setErrorMsg(err.response?.data?.error ?? "Subscription failed");
      setStatus("error");
    }
  };

  const unsubscribe = async (id) => {
    setStatus("unsubscribing");
    setErrorMsg("");
    try {
      await webhookApi.unsubscribe(id);
      load();
    } catch (err) {
      setErrorMsg(err.response?.data?.error ?? "Unsubscribe failed");
      setStatus("error");
    }
  };

  const active = subscriptions?.length > 0;
  const sub    = subscriptions?.[0];
  const busy   = status === "loading" || status === "subscribing" || status === "unsubscribing";

  return (
    <Card style={{ marginBottom: 24 }} className="fade-up fade-up-2">
      <CardHeader
        title="Strava Webhooks"
        right={
          <Tag style={{ color: active ? "var(--green)" : "var(--text3)" }}>
            {status === "loading" ? "Checking…" : active ? "Active" : "Inactive"}
          </Tag>
        }
      />

      {/* Status row */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: active ? 14 : 20 }}>
        <div style={{ fontSize: 28 }}>{active ? "🟢" : "🔴"}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>
            {active ? `Subscription active · ID ${sub.id}` : "No active subscription"}
          </div>
          <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 3 }}>
            {active
              ? `Strava will push new activities to Runlytics automatically.`
              : "Activities only sync when you manually refresh. Enable webhooks for real-time sync."}
          </div>
        </div>
        {active ? (
          <button
            onClick={() => unsubscribe(sub.id)}
            disabled={busy}
            style={{
              background: "none", border: "1px solid rgba(239,68,68,0.5)", borderRadius: 8,
              color: "#ef4444", fontSize: 12, padding: "7px 16px", cursor: "pointer",
              opacity: busy ? 0.5 : 1,
            }}
          >
            Unsubscribe
          </button>
        ) : (
          <button
            onClick={subscribe}
            disabled={busy}
            style={{
              background: "var(--accent)", border: "none", borderRadius: 8,
              color: "#0d1320", fontSize: 12, fontWeight: 700, padding: "7px 16px", cursor: "pointer",
              opacity: busy ? 0.5 : 1,
            }}
          >
            {status === "subscribing" ? "Subscribing…" : "Subscribe"}
          </button>
        )}
      </div>

      {errorMsg && (
        <div style={{ fontSize: 12, color: "#ef4444", background: "rgba(239,68,68,0.08)", borderRadius: 6, padding: "10px 14px", marginBottom: 14 }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Setup guide — shown when inactive or on error */}
      {!active && (
        <div style={{ background: "var(--bg2)", borderRadius: 8, padding: "14px 16px", fontSize: 12, lineHeight: 1.7 }}>
          <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 13 }}>Setup guide (ngrok for local dev)</div>
          {[
            { n: 1, text: "Install ngrok: download from ngrok.com or run npm install -g ngrok" },
            { n: 2, text: "Start a tunnel: ngrok http 3001" },
            { n: 3, text: "Copy the HTTPS URL (e.g. https://abc123.ngrok-free.app)" },
            { n: 4, text: "Add to backend/.env → STRAVA_WEBHOOK_CALLBACK_URL=https://abc123.ngrok-free.app/api/webhooks/strava" },
            { n: 5, text: "Restart the backend server, then click Subscribe above" },
          ].map(({ n, text }) => (
            <div key={n} style={{ display: "flex", gap: 10, marginBottom: 4 }}>
              <div style={{
                width: 20, height: 20, borderRadius: "50%", background: "var(--accent3)",
                color: "var(--accent)", fontSize: 10, fontWeight: 800,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2,
              }}>{n}</div>
              <span style={{ color: "var(--text2)" }}>{text}</span>
            </div>
          ))}
          <div style={{ marginTop: 10, fontSize: 11, color: "var(--text3)" }}>
            Note: <code style={{ background: "var(--surface)", padding: "1px 5px", borderRadius: 3 }}>STRAVA_WEBHOOK_VERIFY_TOKEN</code> is already set in your .env (fittrack_webhook_secret_2026). Strava allows only one active subscription per app.
          </div>
        </div>
      )}

      {/* Active subscription details */}
      {active && sub && (
        <div style={{ fontSize: 11, color: "var(--text3)", display: "flex", gap: 20 }}>
          <span>Callback: <code style={{ color: "var(--text2)" }}>{sub.callback_url}</code></span>
          <span>Created: {new Date(sub.created_at).toLocaleDateString()}</span>
        </div>
      )}
    </Card>
  );
}

export default function ProfilePage() {
  const { athlete }                          = useAuth();
  const { activities, loading: aLoading }    = useActivities({ per_page: 100 });
  const { data: summary, loading: sLoading } = useAnalyticsSummary();
  const { gear }                             = useAthleteGear();

  const runs = useMemo(
    () => activities.filter((a) => a.type === "Run" && a.distance > 0),
    [activities]
  );

  const avgPace = runs.length ? runs.reduce((s, a) => s + calcPace(a), 0) / runs.length : 0;
  const longest = useMemo(
    () => runs.reduce((m, a) => a.distance > m.distance ? a : m, runs[0] || { distance: 0 }),
    [runs]
  );
  const bestPaceRun = useMemo(
    () => runs.reduce((m, a) => calcPace(a) < (m.p || 99) ? { ...a, p: calcPace(a) } : m, {}),
    [runs]
  );

  const typeCounts = useMemo(() => {
    const counts = {};
    activities.forEach((a) => { counts[a.type] = (counts[a.type] || 0) + 1; });
    return counts;
  }, [activities]);
  const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  // Consistency score: workouts in last 30 days vs target (13 = ~3/week)
  const last30 = useMemo(() => {
    const cutoff = Date.now() - 30 * 86400000;
    return activities.filter((a) => new Date(a.start_date_local).getTime() > cutoff);
  }, [activities]);
  const consistencyScore = Math.min(100, Math.round(last30.length / 13 * 100));

  // Achievements computed entirely from real activity data
  const achievements = useMemo(() => {
    const all    = [...activities].sort((a, b) => new Date(a.start_date_local) - new Date(b.start_date_local));
    const sorted = [...runs].sort((a, b) => new Date(a.start_date_local) - new Date(b.start_date_local));
    const result = [];

    if (all.length >= 1) {
      result.push({ icon:"🏅", title:"First Workout",  desc:all[0].name,                       date:fmtDateShort(all[0].start_date_local) });
    }
    const firstTenK = sorted.find((a) => a.distance >= 10000);
    if (firstTenK) {
      result.push({ icon:"🥇", title:"First 10K",      desc:firstTenK.name,                    date:fmtDateShort(firstTenK.start_date_local) });
    }
    if (all.length >= 50) {
      result.push({ icon:"🚀", title:"50 Activities",   desc:"Half a century of workouts",      date:fmtDateShort(all[49].start_date_local) });
    }
    if (all.length >= 100) {
      result.push({ icon:"💯", title:"100 Activities",  desc:"A century of workouts logged",    date:fmtDateShort(all[99].start_date_local) });
    }
    const totalKm = summary?.totalDistance ?? 0;
    if (totalKm >= 1000) {
      result.push({ icon:"🌍", title:"1000 km Club",    desc:"Total distance exceeded 1000 km" });
    } else if (totalKm >= 500) {
      result.push({ icon:"📍", title:"500 km Club",     desc:"Total distance exceeded 500 km"  });
    }
    const subSix = sorted.find((a) => calcPace(a) <= 6.0);
    if (subSix) {
      result.push({ icon:"⚡", title:"Sub-6 Pacer",    desc:`${fmtPace(calcPace(subSix), "Run")} — ${subSix.name}`, date:fmtDateShort(subSix.start_date_local) });
    }
    const subFive = sorted.find((a) => calcPace(a) <= 5.0);
    if (subFive) {
      result.push({ icon:"🔥", title:"Sub-5 Pacer",    desc:`${fmtPace(calcPace(subFive), "Run")} — ${subFive.name}`, date:fmtDateShort(subFive.start_date_local) });
    }

    return result.slice(0, 5);
  }, [activities, runs, summary]);

  const allGear = useMemo(() => {
    if (!gear) return [];
    const shoes = (gear.shoes || []).map((g) => ({ ...g, icon: "👟", maxKm: SHOE_MAX_KM }));
    const bikes = (gear.bikes || []).map((g) => ({ ...g, icon: "🚴", maxKm: BIKE_MAX_KM }));
    return [...bikes, ...shoes];
  }, [gear]);

  // Member-since year from Strava athlete data
  const memberSince = athlete?.created_at
    ? new Date(athlete.created_at).getFullYear()
    : null;

  const initials  = athlete ? (athlete.firstname?.[0] || "") + (athlete.lastname?.[0] || "") : "?";
  const name      = athlete ? `${athlete.firstname} ${athlete.lastname || ""}`.trim() : "Athlete";
  const avatarUrl = athlete?.profile_medium || athlete?.profile || null;
  const location  = [athlete?.city, athlete?.country].filter(Boolean).join(", ") || null;

  if (aLoading || sLoading) return <Spinner />;

  return (
    <div className="page-content">
      {/* Hero */}
      <div className="profile-hero fade-up">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
          />
        ) : (
          <div className="profile-avatar">{initials}</div>
        )}
        <div>
          <div className="profile-name">{name}</div>
          {location && <div className="profile-sub">📍 {location}</div>}
          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            <Tag>{topType} · {typeCounts[topType] ?? 0} sessions</Tag>
            {memberSince && <Tag>Member since {memberSince}</Tag>}
          </div>
        </div>
        <div style={{ marginLeft: "auto", textAlign: "right" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 48, fontWeight: 900, color: "var(--accent)" }}>
            {consistencyScore}
          </div>
          <div style={{ fontSize: 11, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 1 }}>
            Consistency Score
          </div>
          <ProgressBar value={consistencyScore} max={100} />
        </div>
      </div>

      {/* Lifetime stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }} className="fade-up fade-up-1">
        {[
          { label:"Total Activities", val: summary?.totalActivities ?? activities.length, icon:"🏅", color:"var(--accent)" },
          { label:"Total Distance",   val: `${(summary?.totalDistance ?? 0).toFixed(0)} km`, icon:"📍", color:"var(--green)" },
          { label:"Training Hours",   val: `${Math.round((summary?.totalMovingTime ?? 0) / 3600)}h`, icon:"⏱️", color:"var(--orange)" },
          { label:"Favourite Type",   val: topType, icon:"🏆", color:"var(--purple)" },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 11, color:"var(--text3)", textTransform:"uppercase", letterSpacing:1, marginBottom:4 }}>{s.label}</div>
            <div style={{ fontFamily:"var(--font-display)", fontSize:22, fontWeight:800, color:s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* ── Gear Tracking ─────────────────────────────────────────────────── */}
      {allGear.length > 0 && (
        <Card style={{ marginBottom: 24 }} className="fade-up fade-up-2">
          <CardHeader title="Gear Tracker" right={<Tag>{allGear.length} items</Tag>} />
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {allGear.map((g) => {
              const km      = Math.round((g.distance || 0) / 1000);
              const pct     = Math.min(100, Math.round((km / g.maxKm) * 100));
              const warn    = pct >= 80;
              const replace = pct >= 100;
              return (
                <div key={g.id}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 20 }}>{g.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>
                        {g.name}
                        {g.primary && <span style={{ marginLeft: 6, fontSize: 10, background: "var(--accent)", color: "#0d1320", borderRadius: 4, padding: "1px 5px", fontWeight: 700 }}>PRIMARY</span>}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text3)" }}>
                        {km.toLocaleString()} km / {g.maxKm.toLocaleString()} km recommended
                      </div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: replace ? "#ef4444" : warn ? "#f97316" : "var(--green)" }}>
                      {replace ? "Replace soon" : warn ? `${100 - pct}% left` : `${pct}%`}
                    </div>
                  </div>
                  <ProgressBar
                    value={pct}
                    max={100}
                    color={replace ? "#ef4444" : warn ? "#f97316" : "var(--green)"}
                  />
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── Strava Webhooks ──────────────────────────────────────────────── */}
      <WebhookPanel />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }} className="fade-up fade-up-2">
        {/* Personal Records */}
        <Card>
          <CardHeader title="Personal Records" />
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {[
              { label:"Longest Run",  val: longest.distance ? `${(longest.distance/1000).toFixed(2)} km` : "—", sub:longest.name || "—", icon:"📍" },
              { label:"Best Run Pace", val: fmtPace(bestPaceRun.p, "Run"),                                      sub:bestPaceRun.name || "—", icon:"⚡" },
              { label:"Avg Run Pace",  val: fmtPace(avgPace, "Run"),                                            sub:`Over ${runs.length} runs`, icon:"🏃" },
            ].map((pr) => (
              <div key={pr.label} style={{ display:"flex", alignItems:"center", gap:12, padding:"8px 0", borderBottom:"1px solid var(--border)" }}>
                <span style={{ fontSize:18 }}>{pr.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:11, color:"var(--text3)", textTransform:"uppercase", letterSpacing:0.5 }}>{pr.label}</div>
                  <div style={{ fontSize:12, color:"var(--text2)", marginTop:1 }}>{pr.sub}</div>
                </div>
                <div style={{ fontFamily:"var(--font-display)", fontSize:18, fontWeight:800, color:"var(--accent)" }}>{pr.val}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Achievements — computed from real data */}
        <Card>
          <CardHeader title="Achievements" />
          {achievements.length === 0 ? (
            <div style={{ fontSize:13, color:"var(--text3)", padding:"12px 0" }}>
              Keep training — achievements unlock as you hit milestones!
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {achievements.map((ach) => (
                <div key={ach.title} style={{ display:"flex", gap:12, padding:"8px 0", borderBottom:"1px solid var(--border)" }}>
                  <span style={{ fontSize:22 }}>{ach.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600 }}>{ach.title}</div>
                    <div style={{ fontSize:11, color:"var(--text3)" }}>{ach.desc}</div>
                  </div>
                  {ach.date && <div style={{ fontSize:11, color:"var(--text3)", whiteSpace:"nowrap" }}>{ach.date}</div>}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
