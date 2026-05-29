// Milestone definitions + computation from activity data.
// Returns an array of { id, label, icon, category, threshold, achievedAt | null, progress }

const DISTANCE_TIERS = [
  { km:    100, icon: "🥉", label: "First 100 km"     },
  { km:    500, icon: "🥈", label: "500 km Club"      },
  { km:   1000, icon: "🥇", label: "1,000 km Club"    },
  { km:   2500, icon: "🏆", label: "2,500 km Legend"  },
  { km:   5000, icon: "💎", label: "5,000 km Elite"   },
  { km:  10000, icon: "🌟", label: "10,000 km Master" },
];

const COUNT_TIERS = [
  { n:   10, icon: "🌱", label: "10 Activities"    },
  { n:   50, icon: "🌿", label: "50 Activities"    },
  { n:  100, icon: "🌳", label: "100 Activities"   },
  { n:  250, icon: "🔥", label: "250 Activities"   },
  { n:  500, icon: "⚡", label: "500 Activities"   },
  { n: 1000, icon: "👑", label: "1000 Activities"  },
];

const LONG_RUN_TIERS = [
  { km:  5, icon: "🏃", label: "First 5K Run"     },
  { km: 10, icon: "🏃‍♂️", label: "10K Run"          },
  { km: 21.0975, icon: "🥇", label: "Half Marathon" },
  { km: 42.195, icon: "🏆", label: "Marathon"      },
];

const LONG_RIDE_TIERS = [
  { km:  20, icon: "🚴", label: "20 km Ride"       },
  { km:  50, icon: "🚴‍♂️", label: "50 km Ride"      },
  { km: 100, icon: "🏆", label: "Century Ride (100 km)" },
];

const RUN_TYPES  = ["Run", "TrailRun", "VirtualRun"];
const RIDE_TYPES = ["Ride", "VirtualRide", "MountainBikeRide", "GravelRide"];

function pace(a) { return (a.moving_time / 60) / (a.distance / 1000); }

// Find earliest activity where cumulative distance crosses each threshold.
function findCumulativeAchievement(sortedActs, predicateKm) {
  let cum = 0;
  for (const a of sortedActs) {
    cum += a.distance / 1000;
    if (predicateKm(cum)) return { activity: a, value: cum };
  }
  return null;
}

// Earliest single activity that crosses a distance threshold for given types
function findFirstSingle(activities, types, thresholdKm) {
  const matching = activities
    .filter((a) => types.includes(a.type) && (a.distance / 1000) >= thresholdKm)
    .sort((x, y) => new Date(x.start_date_local) - new Date(y.start_date_local));
  return matching[0] ?? null;
}

export function computeMilestones(activities) {
  if (!activities?.length) return [];

  // Oldest first for cumulative calculations
  const byOld = [...activities].sort(
    (a, b) => new Date(a.start_date_local) - new Date(b.start_date_local)
  );
  const totalKm = activities.reduce((s, a) => s + a.distance / 1000, 0);
  const totalCount = activities.length;

  const out = [];

  // Lifetime distance
  for (const t of DISTANCE_TIERS) {
    const hit = findCumulativeAchievement(byOld, (cum) => cum >= t.km);
    out.push({
      id:         `dist-${t.km}`,
      category:   "distance",
      icon:       t.icon,
      label:      t.label,
      threshold:  `${t.km.toLocaleString()} km`,
      achievedAt: hit?.activity?.start_date_local ?? null,
      progress:   Math.min(1, totalKm / t.km),
      current:    `${totalKm.toFixed(0)} km`,
    });
  }

  // Activity count
  for (const t of COUNT_TIERS) {
    const hit = byOld[t.n - 1] ?? null;
    out.push({
      id:         `count-${t.n}`,
      category:   "count",
      icon:       t.icon,
      label:      t.label,
      threshold:  `${t.n} activities`,
      achievedAt: hit?.start_date_local ?? null,
      progress:   Math.min(1, totalCount / t.n),
      current:    `${totalCount}`,
    });
  }

  // Long run tiers
  for (const t of LONG_RUN_TIERS) {
    const hit = findFirstSingle(activities, RUN_TYPES, t.km);
    out.push({
      id:         `run-${t.km}`,
      category:   "run",
      icon:       t.icon,
      label:      t.label,
      threshold:  `${t.km.toFixed(t.km % 1 ? 2 : 0)} km in one go`,
      achievedAt: hit?.start_date_local ?? null,
      progress:   hit ? 1 : 0,
    });
  }

  // Long ride tiers
  for (const t of LONG_RIDE_TIERS) {
    const hit = findFirstSingle(activities, RIDE_TYPES, t.km);
    out.push({
      id:         `ride-${t.km}`,
      category:   "ride",
      icon:       t.icon,
      label:      t.label,
      threshold:  `${t.km} km ride`,
      achievedAt: hit?.start_date_local ?? null,
      progress:   hit ? 1 : 0,
    });
  }

  // PR — fastest 5K (any run ≥ 4.8 km)
  const runs5k = activities.filter((a) => RUN_TYPES.includes(a.type) && a.distance >= 4800);
  if (runs5k.length) {
    const best = runs5k.reduce((b, a) => (pace(a) < pace(b) ? a : b));
    out.push({
      id:         `pr-5k`,
      category:   "pr",
      icon:       "⚡",
      label:      "Fastest 5K",
      threshold:  "Run ≥ 4.8 km",
      achievedAt: best.start_date_local,
      progress:   1,
      current:    `${Math.floor(pace(best))}:${String(Math.round((pace(best) % 1) * 60)).padStart(2, "0")}/km`,
    });
  }

  return out;
}

// IDs that have been achieved at least once.
export function achievedIds(milestones) {
  return milestones.filter((m) => m.achievedAt).map((m) => m.id);
}
