import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api.js";

const AuthContext = createContext(null);

const IMPORT_ATHLETE_KEY    = "runlytics_import_athlete";
const IMPORT_ACTIVITIES_KEY = "runlytics_import_activities";

export function AuthProvider({ children }) {
  const [athlete,      setAthlete]      = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [isImportMode, setIsImportMode] = useState(false);

  useEffect(() => {
    // Import mode takes priority over server session
    const stored = localStorage.getItem(IMPORT_ATHLETE_KEY);
    if (stored) {
      try {
        setAthlete(JSON.parse(stored));
        setIsImportMode(true);
        setLoading(false);
        return;
      } catch { /* corrupted — fall through to server check */ }
    }

    api.get("/auth/me")
      .then(({ data }) => {
        if (data.authenticated) setAthlete(data.athlete);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const setImportData = (athleteData, activities) => {
    localStorage.setItem(IMPORT_ATHLETE_KEY,    JSON.stringify(athleteData));
    localStorage.setItem(IMPORT_ACTIVITIES_KEY, JSON.stringify(activities));
    setAthlete(athleteData);
    setIsImportMode(true);
  };

  const logout = async () => {
    if (isImportMode) {
      localStorage.removeItem(IMPORT_ATHLETE_KEY);
      localStorage.removeItem(IMPORT_ACTIVITIES_KEY);
      localStorage.removeItem("runlytics_onboarded");
      setAthlete(null);
      setIsImportMode(false);
      return;
    }
    await api.post("/auth/logout");
    setAthlete(null);
  };

  return (
    <AuthContext.Provider value={{ athlete, setAthlete, loading, logout, isImportMode, setImportData }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
