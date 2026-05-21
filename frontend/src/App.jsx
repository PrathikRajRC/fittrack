import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { ToastProvider, useToast } from "./context/ToastContext.jsx";
import Layout from "./components/layout/Layout.jsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:            5 * 60 * 1000,
      gcTime:               30 * 60 * 1000,
      retry:                1,
      refetchOnWindowFocus: true,
    },
  },
});

import LandingPage    from "./pages/LandingPage.jsx";
import PrivacyPage    from "./pages/PrivacyPage.jsx";
import TermsPage      from "./pages/TermsPage.jsx";
import ContactPage    from "./pages/ContactPage.jsx";
import ImportPage     from "./pages/ImportPage.jsx";
import ComingSoonPage from "./pages/ComingSoonPage.jsx";
import Dashboard      from "./pages/Dashboard.jsx";
import ActivitiesPage from "./pages/ActivitiesPage.jsx";
import WorkoutDetail  from "./pages/WorkoutDetail.jsx";
import AnalyticsPage  from "./pages/AnalyticsPage.jsx";
import InsightsPage   from "./pages/InsightsPage.jsx";
import ProfilePage    from "./pages/ProfilePage.jsx";
import CoachPage      from "./pages/CoachPage.jsx";
import GoalsPage      from "./pages/GoalsPage.jsx";
import OnboardingModal from "./components/ui/OnboardingModal.jsx";
import { useWebhookEvents } from "./hooks/useWebhookEvents.js";
import "./styles/components.css";

function WebhookPoller() {
  const { isImportMode } = useAuth();
  useWebhookEvents(!isImportMode);
  return null;
}

// Pages accessible without auth (no sidebar)
const LEGAL_PAGES = ["privacy", "terms", "contact"];

function getInitialPage() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("comingsoon")) {
    window.history.replaceState({}, "", "/");
    return "comingsoon";
  }
  const path = window.location.pathname.replace(/^\//, "") || "home";
  if (LEGAL_PAGES.includes(path)) return path;
  if (path === "dashboard") return "dashboard";
  return "home";
}

const PAGE_KEYS = { d: "dashboard", a: "activities", n: "analytics", i: "insights", p: "profile", c: "coach", g: "goals" };
const PAGE_LABELS = { dashboard: "Dashboard", activities: "Activities", analytics: "Analytics", insights: "Insights", profile: "Profile", coach: "AI Coach", goals: "Goals" };
const SHORTCUTS = [
  { key: "D", label: "Dashboard" }, { key: "A", label: "Activities" }, { key: "N", label: "Analytics" },
  { key: "I", label: "Insights" },  { key: "P", label: "Profile" },    { key: "C", label: "AI Coach" },
  { key: "G", label: "Goals" },     { key: "Esc", label: "Back / close" }, { key: "?", label: "Show shortcuts" },
];

function ShortcutsPanel({ onClose }) {
  return (
    <div className="shortcuts-panel fade-up">
      <div className="shortcuts-title">Keyboard Shortcuts</div>
      {SHORTCUTS.map(({ key, label }) => (
        <div key={key} className="shortcut-row">
          <span className="shortcut-label">{label}</span>
          <kbd className="kbd">{key}</kbd>
        </div>
      ))}
      <button className="onboarding-skip" style={{ marginTop: 12 }} onClick={onClose}>Close</button>
    </div>
  );
}

function AppInner() {
  const { athlete, loading } = useAuth();
  const toast = useToast();
  const [page, setPage]               = useState(getInitialPage);
  const [selectedActivity, setSelect] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showShortcuts,  setShowShortcuts]  = useState(false);

  // Sync URL for legal pages
  const navigate = (id) => {
    // "home" resolves to "dashboard" when authenticated, landing page otherwise
    const resolved = (id === "home" && athlete) ? "dashboard" : id;
    if (LEGAL_PAGES.includes(resolved)) {
      window.history.pushState({}, "", `/${resolved}`);
    } else {
      window.history.pushState({}, "", "/");
    }
    setPage(resolved);
    setSelect(null);
  };

  // Import/comingsoon are unauthenticated flows
  const goUnauth = (id) => { window.history.pushState({}, "", "/"); setPage(id); setSelect(null); };

  // Handle browser back/forward
  useEffect(() => {
    const handler = () => setPage(getInitialPage());
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  useEffect(() => {
    if (athlete && !localStorage.getItem("runlytics_onboarded")) {
      const t = setTimeout(() => setShowOnboarding(true), 600);
      return () => clearTimeout(t);
    }
  }, [athlete]);

  const handleOnboardingDone = () => {
    localStorage.setItem("runlytics_onboarded", "1");
    setShowOnboarding(false);
  };

  useEffect(() => {
    const handler = (e) => {
      const tag = e.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (!athlete || LEGAL_PAGES.includes(page)) return;
      if (e.key === "?") { setShowShortcuts((v) => !v); return; }
      if (e.key === "Escape") {
        if (showShortcuts)  { setShowShortcuts(false); return; }
        if (showOnboarding) { handleOnboardingDone(); return; }
        if (page === "detail") { setSelect(null); setPage("activities"); }
        return;
      }
      const dest = PAGE_KEYS[e.key.toLowerCase()];
      if (dest && dest !== page) { setPage(dest); setSelect(null); toast(`→ ${PAGE_LABELS[dest]}`, "info", 1200); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [athlete, page, showShortcuts, showOnboarding, toast]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <div className="spinner" />
      </div>
    );
  }

  // Pages accessible without auth
  if (page === "privacy")    return <PrivacyPage    onNavigate={navigate} />;
  if (page === "terms")      return <TermsPage      onNavigate={navigate} />;
  if (page === "contact")    return <ContactPage    onNavigate={navigate} />;
  if (page === "import")     return <ImportPage     onNavigate={(id) => { navigate(id); }} />;
  if (page === "comingsoon") return <ComingSoonPage onNavigate={(id) => { navigate(id); }} />;

  // Unauthenticated → landing page
  if (!athlete) return <LandingPage onNavigate={(id) => {
    if (id === "import" || id === "comingsoon") { goUnauth(id); }
    else { navigate(id); }
  }} />;

  const handleWorkoutClick = (activity) => { setSelect(activity); setPage("detail"); };
  const handleBack         = () => { setSelect(null); setPage("activities"); };
  const appNavigate        = (id) => { setPage(id); setSelect(null); };
  const currentPage        = page === "detail" ? "activities" : page;

  return (
    <>
      <WebhookPoller />
      <Layout currentPage={currentPage} onNavigate={(id) => {
        if (LEGAL_PAGES.includes(id)) { navigate(id); } else { appNavigate(id); }
      }}>
        {page === "dashboard"  && <Dashboard      onWorkoutClick={handleWorkoutClick} />}
        {page === "activities" && <ActivitiesPage onWorkoutClick={handleWorkoutClick} />}
        {page === "detail"     && <WorkoutDetail  activity={selectedActivity} onBack={handleBack} />}
        {page === "analytics"  && <AnalyticsPage />}
        {page === "insights"   && <InsightsPage />}
        {page === "profile"    && <ProfilePage onNavigate={navigate} />}
        {page === "coach"      && <CoachPage />}
        {page === "goals"      && <GoalsPage />}
      </Layout>

      {showOnboarding && <OnboardingModal onDone={handleOnboardingDone} />}
      {showShortcuts  && <ShortcutsPanel onClose={() => setShowShortcuts(false)} />}
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <AppInner />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />}
    </QueryClientProvider>
  );
}
