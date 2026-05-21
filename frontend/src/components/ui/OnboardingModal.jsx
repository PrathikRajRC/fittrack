import { useState } from "react";

const STEPS = [
  {
    icon: "⚡",
    title: "Welcome to Runlytics!",
    desc: "Your personal fitness intelligence platform. Let's take a 30-second tour so you know where everything is.",
  },
  {
    icon: "⊞",
    title: "Dashboard",
    desc: "See your weekly summary, distance trend, and recent activities. Charts update live as you switch the activity type filter.",
  },
  {
    icon: "📋",
    title: "Activities",
    desc: "Browse all your workouts with search, type filters, and sorting. Click any activity for full stats, route map, and real per-km pace data from Strava.",
  },
  {
    icon: "📊",
    title: "Analytics",
    desc: "Deep dive into weekly volume, monthly progress, pace trends, and your training consistency heatmap over the last 12 weeks.",
  },
  {
    icon: "⌨️",
    title: "Quick tip: keyboard shortcuts",
    desc: "Press D · A · N · I · P to instantly jump between pages. Press ? anytime to see the full shortcut list.",
  },
];

export default function OnboardingModal({ onDone }) {
  const [step, setStep] = useState(0);
  const s = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-card fade-up">
        <div className="onboarding-icon">{s.icon}</div>
        <div className="onboarding-title">{s.title}</div>
        <div className="onboarding-desc">{s.desc}</div>

        <div className="onboarding-dots">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`onboarding-dot ${i === step ? "active" : i < step ? "done" : ""}`}
              onClick={() => setStep(i)}
            />
          ))}
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 28 }}>
          {step > 0 && (
            <button className="btn-secondary" onClick={() => setStep((s) => s - 1)}>← Back</button>
          )}
          {isLast ? (
            <button className="btn-primary" onClick={onDone}>Let's go! 🚀</button>
          ) : (
            <button className="btn-primary" onClick={() => setStep((s) => s + 1)}>Next →</button>
          )}
        </div>

        {!isLast && (
          <button className="onboarding-skip" onClick={onDone}>Skip tour</button>
        )}
      </div>
    </div>
  );
}
