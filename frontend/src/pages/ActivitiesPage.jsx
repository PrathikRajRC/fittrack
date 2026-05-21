import { useState, useMemo } from "react";
import { useActivities } from "../hooks/useActivities.js";
import { useToast } from "../context/ToastContext.jsx";
import WorkoutCard from "../components/ui/WorkoutCard.jsx";
import { FilterChip, EmptyState, Spinner } from "../components/ui/index.jsx";
import { calcPace, fmtPace } from "../utils/formatters.js";

const TYPES = ["All", "Run", "Ride", "Walk", "Hike", "Swim", "Workout"];
const ICONS  = { Run:"🏃", Ride:"🚴", Walk:"🚶", Hike:"⛰️", Swim:"🏊", Workout:"💪" };

function exportCSV(activities) {
  const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const header = ["Date","Name","Type","Distance (km)","Duration (min)","Pace","Elevation (m)","Avg HR","Calories (kJ)"];
  const rows = activities.map((a) => [
    a.start_date_local.slice(0, 10),
    a.name,
    a.type,
    a.distance ? (a.distance / 1000).toFixed(2) : "",
    a.moving_time ? Math.round(a.moving_time / 60) : "",
    a.distance && a.moving_time ? fmtPace(calcPace(a), a.type) : "",
    a.total_elevation_gain ?? "",
    a.average_heartrate ?? "",
    a.kilojoules ? Math.round(a.kilojoules) : "",
  ].map(escape));

  const csv = [header.map(escape), ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `runlytics_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function ActivitiesPage({ onWorkoutClick }) {
  const { activities, loading } = useActivities({ per_page: 100 });
  const toast = useToast();

  const [search, setSearch]       = useState("");
  const [typeFilter, setType]     = useState("All");
  const [sort, setSort]           = useState("date");
  const [fromDate, setFromDate]   = useState("");
  const [toDate, setToDate]       = useState("");
  const [showDateRange, setShowDateRange] = useState(false);

  const filtered = useMemo(() => {
    let ws = [...activities];

    if (typeFilter !== "All") ws = ws.filter((a) => a.type === typeFilter);

    if (search) {
      const q = search.toLowerCase();
      ws = ws.filter((a) => a.name.toLowerCase().includes(q) || a.type.toLowerCase().includes(q));
    }

    if (fromDate) ws = ws.filter((a) => a.start_date_local.slice(0, 10) >= fromDate);
    if (toDate)   ws = ws.filter((a) => a.start_date_local.slice(0, 10) <= toDate);

    if (sort === "date")     ws.sort((a, b) => new Date(b.start_date_local) - new Date(a.start_date_local));
    if (sort === "distance") ws.sort((a, b) => b.distance - a.distance);
    if (sort === "duration") ws.sort((a, b) => b.moving_time - a.moving_time);
    if (sort === "pace")     ws.sort((a, b) => {
      if (a.type !== b.type) return a.type.localeCompare(b.type);
      return (calcPace(a) || Infinity) - (calcPace(b) || Infinity);
    });

    return ws;
  }, [activities, search, typeFilter, sort, fromDate, toDate]);

  const hasDateFilter = fromDate || toDate;

  const clearDates = () => { setFromDate(""); setToDate(""); };

  const handleExport = () => {
    if (!filtered.length) { toast("No activities to export", "warn"); return; }
    exportCSV(filtered);
    toast(`Exported ${filtered.length} activities as CSV`, "success");
  };

  return (
    <div className="page-content">
      {/* Type filter bar */}
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

      {/* Search + date range + export row */}
      <div className="fade-up fade-up-1" style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div className="topbar-search" style={{ flex: 1, minWidth: 200, borderRadius: "var(--radius2)" }}>
          <span style={{ color: "var(--text3)" }}>🔍</span>
          <input
            placeholder="Search activities…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Date range toggle */}
        <button
          className={`filter-chip ${(showDateRange || hasDateFilter) ? "active" : ""}`}
          onClick={() => setShowDateRange((v) => !v)}
          style={{ gap: 6 }}
        >
          📅 {hasDateFilter ? "Date filtered" : "Date range"}
        </button>

        {/* Export CSV */}
        <button className="btn-secondary" onClick={handleExport} style={{ fontSize: 12 }}>
          ⬇ Export CSV
        </button>
      </div>

      {/* Date range inputs */}
      {showDateRange && (
        <div className="fade-up date-range-row" style={{ marginBottom: 16 }}>
          <span style={{ fontSize: 12, color: "var(--text3)" }}>From</span>
          <input
            type="date"
            className="date-input"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
          <span style={{ fontSize: 12, color: "var(--text3)" }}>To</span>
          <input
            type="date"
            className="date-input"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
          {hasDateFilter && (
            <button className="filter-chip" onClick={clearDates}>✕ Clear</button>
          )}
        </div>
      )}

      <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 12 }}>
        {filtered.length} {filtered.length !== activities.length ? `of ${activities.length} ` : ""}activities
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
