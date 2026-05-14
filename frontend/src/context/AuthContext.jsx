import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [athlete, setAthlete] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/auth/me")
      .then(({ data }) => {
        if (data.authenticated) setAthlete(data.athlete);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const logout = async () => {
    await api.post("/auth/logout");
    setAthlete(null);
  };

  return (
    <AuthContext.Provider value={{ athlete, setAthlete, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
