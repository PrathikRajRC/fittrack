import { describe, it, expect } from "vitest";
import { currentStreak, longestStreak, weeklyStreak, recentDays } from "../performance.js";

function mkAct(dateStr, distance = 5000, type = "Run") {
  return { start_date_local: `${dateStr}T08:00:00`, distance, type, moving_time: 1800 };
}

function todayStr(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

describe("currentStreak", () => {
  it("returns 0 for empty activities", () => {
    expect(currentStreak([])).toBe(0);
  });

  it("counts a 3-day active streak ending today", () => {
    const acts = [todayStr(0), todayStr(-1), todayStr(-2)].map((d) => mkAct(d));
    expect(currentStreak(acts)).toBe(3);
  });

  it("counts a streak that ended yesterday (grace period for today)", () => {
    const acts = [todayStr(-1), todayStr(-2)].map((d) => mkAct(d));
    expect(currentStreak(acts)).toBe(2);
  });

  it("returns 0 when last activity was 2+ days ago", () => {
    const acts = [todayStr(-3), todayStr(-4)].map((d) => mkAct(d));
    expect(currentStreak(acts)).toBe(0);
  });
});

describe("longestStreak", () => {
  it("returns 0 for empty activities", () => {
    expect(longestStreak([])).toBe(0);
  });

  it("finds the longest consecutive run", () => {
    const acts = [
      "2026-01-01", "2026-01-02", "2026-01-03",            // 3-day streak
      "2026-01-10", "2026-01-11", "2026-01-12", "2026-01-13", // 4-day streak
      "2026-01-20",                                          // 1-day
    ].map((d) => mkAct(d));
    expect(longestStreak(acts)).toBe(4);
  });

  it("deduplicates same-day activities", () => {
    const acts = [
      mkAct("2026-01-01"), mkAct("2026-01-01", 3000),
      mkAct("2026-01-02"),
    ];
    expect(longestStreak(acts)).toBe(2);
  });
});

describe("recentDays", () => {
  it("returns exactly N days ending today", () => {
    const days = recentDays([], 7);
    expect(days).toHaveLength(7);
    expect(days[days.length - 1].date).toBe(todayStr(0));
  });

  it("marks active days correctly", () => {
    const acts = [mkAct(todayStr(0)), mkAct(todayStr(-2))];
    const days = recentDays(acts, 5);
    const activeDates = days.filter((d) => d.active).map((d) => d.date);
    expect(activeDates).toContain(todayStr(0));
    expect(activeDates).toContain(todayStr(-2));
    expect(activeDates).not.toContain(todayStr(-1));
  });
});

describe("weeklyStreak", () => {
  it("returns 0 for empty activities", () => {
    expect(weeklyStreak([])).toBe(0);
  });

  it("counts consecutive active weeks", () => {
    // One activity this week + one last week = 2-week streak
    const acts = [mkAct(todayStr(0)), mkAct(todayStr(-7))];
    expect(weeklyStreak(acts)).toBeGreaterThanOrEqual(2);
  });
});
