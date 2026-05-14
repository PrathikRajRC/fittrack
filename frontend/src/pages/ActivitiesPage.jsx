import { useState, useMemo } from "react";
import { useActivities } from "../hooks/useActivities.js";
import WorkoutCard from "../components/ui/WorkoutCard.jsx";
import { FilterChip, EmptyState, Spinner } from "../components/ui/index.jsx";
import { calcPace } from "../utils/formatters.js";

const TYPES = ["All", "Run", "Ride", "Walk", "Hike", "Swim", "Workout"];
const ICONS  = { Run:"🏃", Ride:"🚴", Walk:"🚶", Hike:"⛰️", Swim:"🏊", Workout:"💪" };

export default function ActivitiesPage({ onWorkoutClick }) {
  const { activities, loading } = useActivities({ per_page: 100 });
  const [search, setSearch]     = useState("");
  const [typeFilter, setType]   = useState("All");
  const [sort, setSort]         = useState("date");

  const filtered = useMemo(() => {
    let ws = [...activities];
    if (typeFilter !== "All") ws = ws.filter((a) => a.type === typeFilter);
    if (search) {
      const q = search.toLowerCase();
      ws = ws.filter((a) => a.name.toLowerCase().includes(q) || a.type.toLowerCase().includes(q));
    }
    if (sort === "date")     ws.sort((a, b) => new Date(b.start_date_local) - new Date(a.start_date_local));
    if (sort === "distance") ws.sort((a, b) => b.distance - a.distance);
    if (sort === "duration") ws.sort((a, b) => b.moving_time - a.moving_time);
    if (sort === "pace")     ws.sort((a, b) => calcPace(a) - calcPace(b));
    return ws;
  }, [activities, search, typeFilter, sort]);

  return (
    <div className="page-content">
      {/* Filter bar */}
      <div className="filter-bar fade-up">
        {TYPES.map((t) => (
          <FilterChip
            key={t}
            label={t === "All" ? "All" : `${ICONS[t]} ${t}`}
            active={typeFilter === t}
            onClick={() => setType(t)}
          />
        ))}
        <select
          className="sort-select"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="date">Sort: Latest</option>
          <option value="distance">Sort: Distance</option>
          <option value="duration">Sort: Duration</option>
          <option value="pace">Sort: Pace</option>
        </select>
      </div>

      {/* Search */}
      <div className="fade-up fade-up-1" style={{ marginBottom: 16 }}>
        <div className="topbar-search" style={{ width: "100%", borderRadius: "var(--radius2)" }}>
          <span style={{ color: "var(--text3)" }}>🔍</span>
          <input
            placeholder="Search activities…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 12 }}>
        {filtered.length} activities
      </div>

      {loading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <EmptyState icon="🔍" title="No activities found" desc="Try adjusting your filters" />
      ) : (
        <div className="fade-up fade-up-2" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((a) => (
            <WorkoutCard key={a.id} activity={a} onClick={onWorkoutClick} />
          ))}
        </div>
      )}
    </div>
  );
}
