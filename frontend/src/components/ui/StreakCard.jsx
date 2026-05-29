import { useMemo } from "react";
import { streakStats } from "../../utils/performance.js";

function statusText(current, longest) {
  if (current === 0)             return { msg: "Time to lace up — get one in today!",          color: "var(--text2)" };
  if (current >= longest && longest > 1) return { msg: "🚀 You're at your best ever streak!",   color: "var(--green)" };
  if (current >= 14)             return { msg: "🔥 Two weeks strong — incredible consistency!", color: "#ffb020" };
  if (current >= 7)              return { msg: "🔥 Week-long streak — keep it going!",          color: "#ffb020" };
  if (current >= 3)              return { msg: "Building momentum — don't break the chain!",   color: "var(--accent)" };
  return                              { msg: "Just getting started — make today count!",    color: "var(--accent)" };
}

export default function StreakCard({ activities }) {
  const stats = useMemo(() => streakStats(activities), [activities]);
  const { msg, color } = statusText(stats.current, stats.longest);
  const last30Active = stats.last30.filter((d) => d.active).length;

  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(255,176,32,0.08), rgba(255,112,64,0.04))",
      border: "1px solid rgba(255,176,32,0.2)",
      borderRadius: "var(--radius)",
      padding: "20px 22px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Flame bg accent */}
      <div style={{
        position: "absolute", top: -30, right: -10, fontSize: 140, opacity: 0.06,
        pointerEvents: "none", transform: "rotate(-12deg)",
      }}>🔥</div>

      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>🔥</span>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 800, letterSpacing: 0.4, textTransform: "uppercase" }}>
            Streak
          </div>
        </div>
        <div style={{ fontSize: 11, color: "var(--text3)" }}>{last30Active}/30 active days</div>
      </div>

      {/* Big numbers */}
      <div style={{ display: "flex", gap: 28, marginBottom: 18, position: "relative" }}>
        <div>
          <div style={{ fontSize: 38, fontWeight: 900, color: "#ffb020", lineHeight: 1, fontFamily: "var(--font-display)" }}>
            {stats.current}
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, color: "rgba(255,176,32,0.8)", marginTop: 4 }}>
            Current {stats.current === 1 ? "day" : "days"}
          </div>
        </div>
        <div style={{ width: 1, background: "rgba(255,255,255,0.07)" }} />
        <div>
          <div style={{ fontSize: 38, fontWeight: 900, color: "var(--text)", lineHeight: 1, fontFamily: "var(--font-display)" }}>
            {stats.longest}
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, color: "var(--text3)", marginTop: 4 }}>
            Best ever
          </div>
        </div>
        <div style={{ width: 1, background: "rgba(255,255,255,0.07)" }} />
        <div>
          <div style={{ fontSize: 38, fontWeight: 900, color: "var(--text)", lineHeight: 1, fontFamily: "var(--font-display)" }}>
            {stats.weeks}
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, color: "var(--text3)", marginTop: 4 }}>
            Week streak
          </div>
        </div>
      </div>

      {/* Last 30 days mini calendar */}
      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", gap: 3, marginBottom: 8 }}>
          {stats.last30.map((d, i) => (
            <div
              key={i}
              title={`${d.date}${d.active ? " — active" : ""}`}
              style={{
                flex: 1,
                height: 18,
                borderRadius: 3,
                background: d.active
                  ? "linear-gradient(180deg, #ffb020, #ff7040)"
                  : "rgba(255,255,255,0.04)",
                border: d.active ? "none" : "1px solid var(--border)",
              }}
            />
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>
          <span>30 days ago</span>
          <span>today</span>
        </div>
      </div>

      <div style={{ fontSize: 12, color, fontWeight: 600, position: "relative" }}>
        {msg}
      </div>
    </div>
  );
}
