import { rng } from "./formatters.js";

const ACT_TYPES = ["Run", "Ride", "Walk", "Hike", "Swim", "Workout"];

const NAMES = {
  Run:     ["Morning Run", "Evening Jog", "10K Training", "Tempo Run", "Long Run", "Recovery Run", "Fartlek Run", "Hill Repeats"],
  Ride:    ["Morning Ride", "Commute", "Hill Climb", "Endurance Ride", "Sprint Session"],
  Walk:    ["Evening Walk", "Lunch Walk", "Morning Stroll", "Recovery Walk"],
  Hike:    ["Weekend Hike", "Trail Run", "Mountain Trek", "Forest Walk"],
  Swim:    ["Morning Laps", "Endurance Swim", "Technique Session"],
  Workout: ["Strength Training", "HIIT Session", "Core Workout", "Cross Training", "Gym Session"],
};

export function generateMockActivities(count = 120) {
  const r = rng(42);
  const now = new Date();
  const activities = [];
  let id = 1;
  let daysAgo = 0;

  while (activities.length < count && daysAgo < 200) {
    daysAgo++;
    if (r() > 0.40) continue;

    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    const type = ACT_TYPES[Math.floor(r() * ACT_TYPES.length)];
    const name = NAMES[type][Math.floor(r() * NAMES[type].length)];

    let distance = 0, moving_time = 0, total_elevation_gain = 0, average_heartrate = 0, kilojoules = 0;

    if (type === "Run") {
      distance      = (3 + r() * 12) * 1000;
      moving_time   = (distance / 1000) * (5.5 + r() * 1.5) * 60;
      total_elevation_gain = 20 + r() * 200;
      average_heartrate    = 140 + r() * 30;
      kilojoules           = 0.06 * distance;
    } else if (type === "Ride") {
      distance      = (10 + r() * 50) * 1000;
      moving_time   = (distance / 1000) / (20 + r() * 10) * 3600;
      total_elevation_gain = 50 + r() * 600;
      average_heartrate    = 125 + r() * 35;
      kilojoules           = 0.04 * distance;
    } else if (type === "Walk") {
      distance      = (2 + r() * 6) * 1000;
      moving_time   = (distance / 1000) * (12 + r() * 4) * 60;
      average_heartrate = 95 + r() * 25;
      kilojoules    = 0.07 * distance;
    } else if (type === "Hike") {
      distance      = (5 + r() * 15) * 1000;
      moving_time   = (distance / 1000) * (15 + r() * 8) * 60;
      total_elevation_gain = 100 + r() * 800;
      average_heartrate    = 120 + r() * 30;
      kilojoules           = 0.08 * distance;
    } else if (type === "Swim") {
      distance      = (0.5 + r() * 2) * 1000;
      moving_time   = (20 + r() * 40) * 60;
      average_heartrate = 130 + r() * 30;
      kilojoules    = 300 + r() * 200;
    } else {
      moving_time   = (30 + r() * 60) * 60;
      average_heartrate = 130 + r() * 40;
      kilojoules    = 200 + r() * 400;
    }

    activities.push({
      id: id++,
      name,
      type,
      start_date_local: date.toISOString(),
      distance:              Math.round(distance),
      moving_time:           Math.round(moving_time),
      total_elevation_gain:  Math.round(total_elevation_gain),
      average_heartrate:     Math.round(average_heartrate),
      kilojoules:            Math.round(kilojoules),
    });
  }

  return activities;
}

export const MOCK_ACTIVITIES = generateMockActivities();

export const MOCK_ATHLETE = {
  id: 1,
  firstname: "Prathikraj",
  lastname: "",
  city: "Bengaluru",
  country: "India",
  sex: "M",
  profile: null,
  created_at: "2023-03-01T00:00:00Z",
};
