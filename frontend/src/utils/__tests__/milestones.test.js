import { describe, it, expect } from "vitest";
import { computeMilestones, achievedIds } from "../milestones.js";

function mkAct(date, distance, type = "Run") {
  return {
    id: Math.random(),
    start_date_local: `${date}T08:00:00`,
    distance,
    type,
    moving_time: distance / 3,
  };
}

describe("computeMilestones", () => {
  it("returns empty array for no activities", () => {
    expect(computeMilestones([])).toEqual([]);
  });

  it("unlocks 100km lifetime distance milestone", () => {
    const acts = Array.from({ length: 20 }, (_, i) =>
      mkAct(`2026-01-${String(i + 1).padStart(2, "0")}`, 6000) // 6km × 20 = 120km
    );
    const milestones = computeMilestones(acts);
    const m100 = milestones.find((m) => m.id === "dist-100");
    expect(m100.achievedAt).toBeTruthy();
  });

  it("does not unlock a milestone that hasn't been reached", () => {
    const acts = [mkAct("2026-01-01", 5000)];
    const milestones = computeMilestones(acts);
    const m500 = milestones.find((m) => m.id === "dist-500");
    expect(m500.achievedAt).toBeNull();
    expect(m500.progress).toBeLessThan(0.05);
  });

  it("unlocks the first-5K-run milestone for a 6 km run", () => {
    const acts = [mkAct("2026-01-01", 6000, "Run")];
    const milestones = computeMilestones(acts);
    const m5k = milestones.find((m) => m.id === "run-5");
    expect(m5k.achievedAt).toBe("2026-01-01T08:00:00");
  });

  it("only counts runs (not rides) toward run milestones", () => {
    const acts = [mkAct("2026-01-01", 30000, "Ride")];
    const milestones = computeMilestones(acts);
    const m5k = milestones.find((m) => m.id === "run-5");
    expect(m5k.achievedAt).toBeNull();
  });
});

describe("achievedIds", () => {
  it("returns only IDs of achieved milestones", () => {
    const milestones = [
      { id: "a", achievedAt: "2026-01-01" },
      { id: "b", achievedAt: null },
      { id: "c", achievedAt: "2026-02-01" },
    ];
    expect(achievedIds(milestones).sort()).toEqual(["a", "c"]);
  });
});
