import { useEffect, useMemo, useRef } from "react";
import { computeMilestones, achievedIds } from "../utils/milestones.js";
import { useToast } from "../context/ToastContext.jsx";

const SEEN_KEY = "runlytics_seen_milestones_v1";

function loadSeen() {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
}

function saveSeen(set) {
  try { localStorage.setItem(SEEN_KEY, JSON.stringify([...set])); } catch {}
}

export function useMilestones(activities) {
  const toast = useToast();
  const firstLoadRef = useRef(true);

  const milestones = useMemo(() => computeMilestones(activities ?? []), [activities]);

  useEffect(() => {
    if (!activities?.length) return;

    const seen = loadSeen();
    const earned = achievedIds(milestones);
    const newlyEarned = earned.filter((id) => !seen.has(id));

    // On first ever load with no seen-state, mark everything seen silently — don't spam toasts retroactively.
    if (firstLoadRef.current && seen.size === 0) {
      firstLoadRef.current = false;
      earned.forEach((id) => seen.add(id));
      saveSeen(seen);
      return;
    }
    firstLoadRef.current = false;

    if (newlyEarned.length && toast) {
      newlyEarned.forEach((id) => {
        const m = milestones.find((x) => x.id === id);
        if (m) toast(`${m.icon}  Milestone unlocked: ${m.label}`, "success", 6000);
        seen.add(id);
      });
      saveSeen(seen);
    }
  }, [milestones, activities, toast]);

  return milestones;
}
