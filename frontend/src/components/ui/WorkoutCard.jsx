import { actIcon, actClass, fmtDist, fmtDur, fmtPace, fmtDate, calcPace } from "../../utils/formatters.js";

export default function WorkoutCard({ activity, onClick }) {
  const pace = calcPace(activity);

  return (
    <div className="workout-card" onClick={() => onClick?.(activity)}>
      <div className={`workout-type-badge ${actClass(activity.type)}`}>
        {actIcon(activity.type)}
      </div>

      <div className="workout-info">
        <div className="workout-name">{activity.name}</div>
        <div className="workout-date">
          {fmtDate(activity.start_date_local)} · {activity.type}
        </div>
      </div>

      <div className="workout-stats">
        <div className="workout-stat">
          <div className="workout-stat-val">
            {activity.distance ? (activity.distance / 1000).toFixed(1) : "—"}
          </div>
          <div className="workout-stat-label">km</div>
        </div>
        <div className="workout-stat">
          <div className="workout-stat-val">{fmtDur(activity.moving_time)}</div>
          <div className="workout-stat-label">time</div>
        </div>
        <div className="workout-stat">
          <div className="workout-stat-val" style={{ fontSize: 14 }}>
            {fmtPace(pace, activity.type)}
          </div>
          <div className="workout-stat-label">
            {activity.type === "Ride" ? "speed" : "pace"}
          </div>
        </div>
      </div>
    </div>
  );
}
