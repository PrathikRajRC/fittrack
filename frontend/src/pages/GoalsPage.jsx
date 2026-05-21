import { useState, useMemo, useEffect, useRef } from "react";
import { useActivities } from "../hooks/useActivities.js";
import { useGoals, useCreateGoal, useDeleteGoal } from "../hooks/useGoals.js";
import { Card, CardHeader, Tag, ProgressBar, Spinner } from "../components/ui/index.jsx";

const GOAL_TYPES = [
  { id: "weekly_distance",   label: "Weekly Distance",    unit: "km",       desc: "Total km logged in the current week (Mon–Sun)" },
  { id: "monthly_distance",  label: "Monthly Distance",   unit: "km",       desc: "Total km logged this calendar month" },
  { id: "weekly_activities", label: "Weekly Activities",  unit: "sessions", desc: "Number of workouts completed this week" },
  { id: "longest_run",       label: "Longest Run PR",     unit: "km",       desc: "Your single longest run ever recorded" },
  { id: "total_distance",    label: "Distance Milestone", unit: "km",       desc: "Cumulative lifetime distance across all activities" },
];

function computeProgress(goal, activities) {
  const now     = new Date();
  const wkStart = new Date(now);
  wkStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  wkStart.setHours(0, 0, 0, 0);
  const moStart = new Date(now.getFullYear(), now.getMonth(), 1);

  switch (goal.type) {
    case "weekly_distance": {
      const km = activities
        .filter((a) => new Date(a.start_date_local) >= wkStart)
        .reduce((s, a) => s + a.distance, 0) / 1000;
      return parseFloat(km.toFixed(1));
    }
    case "monthly_distance": {
      const km = activities
        .filter((a) => new Date(a.start_date_local) >= moStart)
        .reduce((s, a) => s + a.distance, 0) / 1000;
      return parseFloat(km.toFixed(1));
    }
    case "weekly_activities":
      return activities.filter((a) => new Date(a.start_date_local) >= wkStart).length;
    case "longest_run": {
      const runs = activities.filter((a) => a.type === "Run" && a.distance > 0);
      return runs.length ? parseFloat((Math.max(...runs.map((a) => a.distance)) / 1000).toFixed(1)) : 0;
    }
    case "total_distance":
      return parseFloat((activities.reduce((s, a) => s + a.distance, 0) / 1000).toFixed(0));
    default:
      return 0;
  }
}

const EMPTY_FORM = { type: "weekly_distance", target: "", name: "" };

export default function GoalsPage() {
  const { activities, loading: activitiesLoading } = useActivities({ per_page: 100 });
  const { goals, loading: goalsLoading }           = useGoals();
  const { createGoal, creating }                   = useCreateGoal();
  const { deleteGoal }                             = useDeleteGoal();

  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [formErr,  setFormErr]  = useState("");

  // One-time migration: localStorage goals → DB (runs after first successful load)
  const migrated = useRef(false);
  useEffect(() => {
    if (goalsLoading || migrated.current) return;
    migrated.current = true;

    try {
      const stored = JSON.parse(localStorage.getItem("runlytics_goals") || "[]");
      if (stored.length === 0) return;

      // Only migrate if DB is empty for this athlete (avoid duplicates on refresh)
      if (goals.length > 0) {
        localStorage.removeItem("runlytics_goals");
        return;
      }

      Promise.all(
        stored.map((g) =>
          createGoal({ type: g.type, label: g.label, target: g.target, unit: g.unit })
        )
      ).then(() => localStorage.removeItem("fittrack_goals"));
    } catch {
      // Ignore parse errors
    }
  }, [goalsLoading, goals.length, createGoal]);

  const addGoal = async () => {
    const t = Number(form.target);
    if (!form.target || isNaN(t) || t <= 0) { setFormErr("Enter a valid target number."); return; }
    const info = GOAL_TYPES.find((g) => g.id === form.type);
    try {
      await createGoal({
        type:   form.type,
        label:  form.name.trim() || info.label,
        target: t,
        unit:   info.unit,
      });
      setForm(EMPTY_FORM);
      setFormErr("");
      setShowForm(false);
    } catch {
      setFormErr("Failed to save goal. Please try again.");
    }
  };

  const goalsWithProgress = useMemo(() =>
    goals.map((g) => {
      const current = computeProgress(g, activities);
      const pct     = Math.min(100, Math.round((current / g.target) * 100));
      return { ...g, current, pct };
    }),
    [goals, activities]
  );

  const achieved = goalsWithProgress.filter((g) => g.pct >= 100).length;

  if (goalsLoading || activitiesLoading) return <Spinner />;

  return (
    <div className="page-content">
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800 }}>Goals</div>
          <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 4 }}>
            Track training targets · progress updates live from your Strava data
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {goals.length > 0 && (
            <Tag style={{ color: "var(--green)" }}>{achieved} / {goals.length} achieved</Tag>
          )}
          <button
            onClick={() => { setShowForm(true); setFormErr(""); }}
            style={{
              background: "var(--accent)", color: "#0d1320", border: "none",
              borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer",
            }}
          >
            + New Goal
          </button>
        </div>
      </div>

      {/* Add goal form */}
      {showForm && (
        <Card style={{ marginBottom: 28 }} className="fade-up">
          <CardHeader
            title="Create Goal"
            right={
              <button
                onClick={() => setShowForm(false)}
                style={{ background: "none", border: "none", color: "var(--text3)", cursor: "pointer", fontSize: 20, lineHeight: 1 }}
              >
                ×
              </button>
            }
          />

          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Goal Type</div>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="compare-select"
              >
                {GOAL_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>
                Target ({GOAL_TYPES.find((t) => t.id === form.type)?.unit})
              </div>
              <input
                type="number"
                min="1"
                value={form.target}
                onChange={(e) => { setForm({ ...form, target: e.target.value }); setFormErr(""); }}
                placeholder="e.g. 50"
                className="compare-select"
                style={{ width: "100%", boxSizing: "border-box" }}
              />
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Custom Name (optional)</div>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={GOAL_TYPES.find((t) => t.id === form.type)?.label}
                className="compare-select"
                style={{ width: "100%", boxSizing: "border-box" }}
              />
            </div>
          </div>

          <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 16 }}>
            {GOAL_TYPES.find((t) => t.id === form.type)?.desc}
          </div>

          {formErr && (
            <div style={{ fontSize: 12, color: "#ef4444", marginBottom: 12 }}>{formErr}</div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={addGoal}
              disabled={creating}
              style={{
                background: "var(--accent)", color: "#0d1320", border: "none",
                borderRadius: 8, padding: "9px 22px", fontWeight: 700, fontSize: 13,
                cursor: creating ? "not-allowed" : "pointer", opacity: creating ? 0.7 : 1,
              }}
            >
              {creating ? "Saving…" : "Create Goal"}
            </button>
            <button
              onClick={() => { setShowForm(false); setFormErr(""); }}
              style={{
                background: "none", color: "var(--text2)", border: "1px solid var(--border)",
                borderRadius: 8, padding: "9px 22px", fontSize: 13, cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </Card>
      )}

      {/* Empty state */}
      {goalsWithProgress.length === 0 && (
        <Card style={{ textAlign: "center", padding: "56px 28px" }} className="fade-up">
          <div style={{ fontSize: 52, marginBottom: 16 }}>🎯</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800, marginBottom: 10 }}>
            No goals yet
          </div>
          <div style={{ fontSize: 13, color: "var(--text3)", maxWidth: 320, margin: "0 auto 24px", lineHeight: 1.6 }}>
            Set a training goal and Runlytics will automatically track your progress using your Strava data.
          </div>
          <button
            onClick={() => { setShowForm(true); setFormErr(""); }}
            style={{
              background: "var(--accent)", color: "#0d1320", border: "none",
              borderRadius: 10, padding: "11px 28px", fontWeight: 700, fontSize: 13, cursor: "pointer",
            }}
          >
            Create your first goal
          </button>
        </Card>
      )}

      {/* Goals grid */}
      {goalsWithProgress.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {goalsWithProgress.map((g) => {
            const barColor = g.pct >= 100 ? "var(--green)" : g.pct >= 75 ? "#fbbf24" : "var(--accent)";
            return (
              <Card key={g.id} className="fade-up" style={{ position: "relative" }}>
                <button
                  onClick={() => deleteGoal(g.id)}
                  title="Remove goal"
                  style={{
                    position: "absolute", top: 14, right: 14,
                    background: "none", border: "none",
                    color: "var(--text3)", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 4,
                    borderRadius: 4, transition: "color 0.15s",
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.color = "#ef4444"; }}
                  onMouseOut={(e)  => { e.currentTarget.style.color = "var(--text3)"; }}
                >
                  ×
                </button>

                <div style={{ marginBottom: 18, paddingRight: 28 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{g.label}</div>
                  <div style={{ fontSize: 11, color: "var(--text3)" }}>
                    {GOAL_TYPES.find((t) => t.id === g.type)?.desc}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 14 }}>
                  <div style={{
                    fontFamily: "var(--font-display)", fontSize: 36, fontWeight: 900,
                    color: g.pct >= 100 ? "var(--green)" : "var(--accent)", lineHeight: 1,
                  }}>
                    {g.current}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text3)" }}>
                    / {g.target} {g.unit}
                  </div>
                  <div style={{ marginLeft: "auto", fontSize: 20, fontWeight: 800, color: barColor }}>
                    {g.pct}%
                  </div>
                </div>

                <ProgressBar value={g.pct} max={100} color={barColor} />

                {g.pct >= 100 && (
                  <div style={{ marginTop: 12, fontSize: 12, color: "var(--green)", fontWeight: 600 }}>
                    🎉 Goal achieved! Keep it up.
                  </div>
                )}
                {g.pct >= 75 && g.pct < 100 && (
                  <div style={{ marginTop: 12, fontSize: 12, color: "#fbbf24" }}>
                    Almost there — {g.target - g.current} {g.unit} to go!
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
