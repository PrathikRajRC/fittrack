import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import Layout from "./components/layout/Layout.jsx";
import ConnectPage     from "./pages/ConnectPage.jsx";
import Dashboard       from "./pages/Dashboard.jsx";
import ActivitiesPage  from "./pages/ActivitiesPage.jsx";
import WorkoutDetail   from "./pages/WorkoutDetail.jsx";
import AnalyticsPage   from "./pages/AnalyticsPage.jsx";
import InsightsPage    from "./pages/InsightsPage.jsx";
import ProfilePage     from "./pages/ProfilePage.jsx";
import "./styles/components.css";

function AppInner() {
  const { athlete, loading } = useAuth();
  const [page, setPage]               = useState("dashboard");
  const [selectedActivity, setSelect] = useState(null);

  if (loading) {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh" }}>
        <div className="spinner" />
      </div>
    );
  }

  // Not authenticated — show connect/landing page
  if (!athlete) return <ConnectPage />;

  const handleWorkoutClick = (activity) => {
    setSelect(activity);
    setPage("detail");
  };

  const handleBack = () => {
    setSelect(null);
    setPage("activities");
  };

  const navigate = (id) => {
    setPage(id);
    setSelect(null);
  };

  const currentPage = page === "detail" ? "activities" : page;

  return (
    <Layout currentPage={currentPage} onNavigate={navigate}>
      {page === "dashboard"  && <Dashboard      onWorkoutClick={handleWorkoutClick} />}
      {page === "activities" && <ActivitiesPage onWorkoutClick={handleWorkoutClick} />}
      {page === "detail"     && <WorkoutDetail  activity={selectedActivity} onBack={handleBack} />}
      {page === "analytics"  && <AnalyticsPage />}
      {page === "insights"   && <InsightsPage />}
      {page === "profile"    && <ProfilePage />}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
