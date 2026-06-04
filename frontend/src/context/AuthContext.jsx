import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api, authApi, importApi } from "../services/api.js";

const AuthContext = createContext(null);

const IMPORT_ATHLETE_KEY    = "runlytics_import_athlete";
const IMPORT_ACTIVITIES_KEY = "runlytics_import_activities";

function readLocalImport() {
  try {
    const a = localStorage.getItem(IMPORT_ATHLETE_KEY);
    return a ? JSON.parse(a) : null;
  } catch { return null; }
}

function writeLocalImport(athlete, activities) {
  try {
    localStorage.setItem(IMPORT_ATHLETE_KEY,    JSON.stringify(athlete));
    localStorage.setItem(IMPORT_ACTIVITIES_KEY, JSON.stringify(activities));
  } catch { /* quota — server remains the durable copy */ }
}

function clearLocalImport() {
  localStorage.removeItem(IMPORT_ATHLETE_KEY);
  localStorage.removeItem(IMPORT_ACTIVITIES_KEY);
}

export function AuthProvider({ children }) {
  const [user,         setUser]         = useState(null);   // app account
  const [athlete,      setAthlete]      = useState(null);   // linked Strava athlete or import athlete
  const [stravaLinked, setStravaLinked] = useState(false);
  const [loading,      setLoading]      = useState(true);
  const [isImportMode, setIsImportMode] = useState(false);

  // Authoritative: ask the server who we are, then resolve the data source.
  const refreshMe = useCallback(async () => {
    let data;
    try {
      ({ data } = await authApi.me());
    } catch {
      data = { authenticated: false };
    }

    if (data.authenticated) {
      setUser(data.user);

      if (data.stravaLinked) {
        // Live Strava account
        setStravaLinked(true);
        setIsImportMode(false);
        setAthlete(data.athlete ?? null);
        clearLocalImport(); // a strava account shouldn't keep stale local import
        return data;
      }

      if (data.hasImport) {
        // Account-backed import — pull the dataset and mirror to localStorage so
        // the existing import-mode hooks (which read localStorage) work.
        try {
          const { data: imp } = await importApi.get();
          if (imp.exists) {
            writeLocalImport(imp.athlete, imp.activities);
            setAthlete(imp.athlete);
            setIsImportMode(true);
            setStravaLinked(false);
            return data;
          }
        } catch { /* fall through to no-data */ }
      }

      // Logged in but no data source yet → gate.
      setStravaLinked(false);
      setIsImportMode(false);
      setAthlete(null);
      return data;
    }

    // Not signed in: honour an existing local (unauthenticated) import.
    const localAthlete = readLocalImport();
    if (localAthlete) {
      setAthlete(localAthlete);
      setIsImportMode(true);
      setStravaLinked(true);
      setUser(null);
      return null;
    }

    setUser(null);
    setAthlete(null);
    setStravaLinked(false);
    setIsImportMode(false);
    return null;
  }, []);

  useEffect(() => {
    refreshMe().finally(() => setLoading(false));
  }, [refreshMe]);

  const login = async (email, password) => {
    const { data } = await authApi.login(email, password);
    setUser(data.user);
    // /login is minimal — refreshMe resolves strava/import/none.
    await refreshMe();
    return data;
  };

  const register = async (email, password, name) => {
    const { data } = await authApi.register(email, password, name);
    setUser(data.user);
    setStravaLinked(false);
    setIsImportMode(false);
    setAthlete(null);
    return data;
  };

  // Called by ImportPage after a successful local parse.
  const setImportData = async (athleteData, activities) => {
    writeLocalImport(athleteData, activities);
    setAthlete(athleteData);
    setIsImportMode(true);
    setStravaLinked(true);

    // If signed in, persist to the account so it survives the next login.
    if (user) {
      try { await importApi.save(athleteData, activities); }
      catch (e) { console.error("Failed to save import to account:", e?.message); }
    }
  };

  const logout = async () => {
    clearLocalImport();
    localStorage.removeItem("runlytics_onboarded");
    // If there's a server session, end it too.
    try { await authApi.logout(); } catch { /* ignore */ }
    setUser(null);
    setAthlete(null);
    setStravaLinked(false);
    setIsImportMode(false);
  };

  return (
    <AuthContext.Provider value={{
      user, athlete, setAthlete, stravaLinked, loading,
      isImportMode, isAuthenticated: !!user || isImportMode,
      login, register, logout, setImportData, refreshMe,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
