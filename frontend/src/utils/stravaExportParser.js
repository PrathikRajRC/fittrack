import JSZip from "jszip";

function parseCSVLine(line) {
  const result = [];
  let inQuote = false;
  let current = "";
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuote = !inQuote; }
      continue;
    }
    if (ch === "," && !inQuote) { result.push(current.trim()); current = ""; continue; }
    current += ch;
  }
  result.push(current.trim());
  return result;
}

function parseNum(val) {
  const n = parseFloat(String(val).replace(/,/g, ""));
  return isNaN(n) ? 0 : n;
}

function normalizeHeader(h) {
  return h.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function parseActivityDate(dateStr) {
  if (!dateStr) return new Date().toISOString();
  // Handle "Jan 15, 2024, 6:30:00 AM"
  // Handle "2024-01-15 06:30:00 UTC"
  // Handle ISO formats
  try {
    const cleaned = dateStr.replace(" UTC", "Z").replace(" ", "T");
    const d = new Date(cleaned);
    if (!isNaN(d.getTime())) return d.toISOString();
  } catch { /* fallthrough */ }
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d.toISOString();
  } catch { /* fallthrough */ }
  return new Date().toISOString();
}

function mapActivityType(raw) {
  const map = {
    run: "Run", virtualrun: "VirtualRun", trailrun: "TrailRun",
    ride: "Ride", virtualride: "VirtualRide", ebikeride: "EBikeRide",
    walk: "Walk", hike: "Hike", swim: "Swim",
    workout: "Workout", weighttraining: "WeightTraining",
    yoga: "Yoga", crossfit: "Crossfit", elliptical: "Elliptical",
    rowing: "Rowing", stairstepper: "StairStepper",
    alpineski: "AlpineSki", nordicski: "NordicSki",
    snowboard: "Snowboard", iceskate: "IceSkate",
    inlineskate: "InlineSkate", rockclimbing: "RockClimbing",
    golf: "Golf", soccer: "Soccer", tennis: "Tennis",
    basketball: "Basketball", volleyball: "Volleyball",
  };
  const key = (raw || "").toLowerCase().replace(/\s/g, "");
  return map[key] || raw || "Workout";
}

export async function parseStravaExportZip(file, onProgress) {
  onProgress?.("Reading ZIP file…");
  const zip = await JSZip.loadAsync(file);

  // Find activities.csv (may be in a subfolder)
  let csvFile = zip.file("activities.csv");
  if (!csvFile) {
    zip.forEach((path, entry) => {
      if (!csvFile && path.endsWith("activities.csv") && !entry.dir) csvFile = entry;
    });
  }
  if (!csvFile) throw new Error("activities.csv not found in ZIP. Please export from Strava → Settings → My Account → Download or Delete Your Account → Request Your Archive.");

  onProgress?.("Parsing activities…");
  const csvText = await csvFile.async("text");
  const lines = csvText.split(/\r?\n/).filter(Boolean);

  if (lines.length < 2) throw new Error("No activities found in the CSV file.");

  const headers = parseCSVLine(lines[0]).map(normalizeHeader);
  const col = {};
  headers.forEach((h, i) => { col[h] = i; });

  const get = (row, ...names) => {
    for (const name of names) {
      const idx = col[name];
      if (idx !== undefined && row[idx] !== undefined) return row[idx] || "";
    }
    return "";
  };

  const activities = [];
  for (let i = 1; i < lines.length; i++) {
    if (i % 100 === 0) onProgress?.(`Parsed ${i} / ${lines.length - 1} activities…`);
    const row = parseCSVLine(lines[i]);
    if (row.length < 3) continue;

    const actId   = get(row, "activity_id", "id");
    const name    = get(row, "activity_name", "name") || "Activity";
    const type    = mapActivityType(get(row, "activity_type", "type"));
    const dateStr = get(row, "activity_date", "date", "start_date");

    const distRaw    = parseNum(get(row, "distance", "distance_km_", "distance_mi_"));
    const elapsedRaw = parseNum(get(row, "elapsed_time", "elapsed_time_s_", "elapsed_time_1"));
    const movingRaw  = parseNum(get(row, "moving_time",  "moving_time_s_",  "moving_time_1")) || elapsedRaw;

    if (!distRaw && !movingRaw) continue;

    // Distance heuristic: if max value > 500, assume meters; otherwise km
    // We'll detect this after collecting all rows — for now store raw and flag
    const avgSpeedRaw = parseNum(get(row, "average_speed", "average_speed_m_s_"));
    const avgHR       = parseNum(get(row, "average_heart_rate", "average_heartrate"));
    const maxHR       = parseNum(get(row, "max_heart_rate",     "max_heartrate"));
    const elevGain    = parseNum(get(row, "elevation_gain", "elevation_gain_m_"));
    const cadenceRaw  = parseNum(get(row, "average_cadence", "average_run_cadence", "average_cycling_cadence"));
    const calories    = parseNum(get(row, "calories", "kilojoules"));
    const maxSpeed    = parseNum(get(row, "max_speed", "max_speed_m_s_"));

    activities.push({
      _distRaw: distRaw,
      id:         actId || `import_${i}`,
      name,
      type,
      sport_type: type,
      start_date_local: parseActivityDate(dateStr),
      moving_time:  movingRaw,
      elapsed_time: elapsedRaw,
      average_speed: avgSpeedRaw,
      max_speed: maxSpeed,
      total_elevation_gain: elevGain,
      average_heartrate: avgHR || null,
      max_heartrate:     maxHR || null,
      average_cadence:   cadenceRaw || null,
      kilojoules: calories || null,
      map:        null,
    });
  }

  if (!activities.length) throw new Error("No valid activities found. Make sure the ZIP contains an activities.csv with activity data.");

  // Detect distance unit: if median activity distance > 200, it's likely meters
  const dists = activities.map((a) => a._distRaw).filter(Boolean).sort((a, b) => a - b);
  const median = dists[Math.floor(dists.length / 2)] ?? 0;
  const distIsMeters = median > 200;

  for (const a of activities) {
    a.distance = distIsMeters ? a._distRaw : a._distRaw * 1000;
    delete a._distRaw;
  }

  onProgress?.("Done!");
  return activities.sort((a, b) => new Date(b.start_date_local) - new Date(a.start_date_local));
}

export function buildImportAthlete(activities) {
  const oldest = activities.length > 0
    ? activities[activities.length - 1].start_date_local
    : new Date().toISOString();

  return {
    id: `import_${Date.now()}`,
    firstname: "Strava",
    lastname:  "Athlete",
    profile:   null,
    city:      "",
    country:   "",
    created_at: oldest,
    isImport:  true,
  };
}
