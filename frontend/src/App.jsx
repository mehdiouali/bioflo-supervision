import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";

import HomePage from "./pages/HomePage";
import RealtimePage from "./pages/RealtimePage";
import AlarmsPage from "./pages/AlarmsPage";
import CommunicationPage from "./pages/CommunicationPage";
import TrendsPage from "./pages/TrendsPage";
import EventsPage from "./pages/EventsPage";
import SettingsPage from "./pages/SettingsPage";
import LoginPage from "./pages/LoginPage";
import RecipesPage from "./pages/RecipesPage";
import BatchesPage from "./pages/BatchesPage";
import BatchComparisonPage from "./pages/BatchComparisonPage";
import AnnotationsPage from "./pages/AnnotationsPage";
import ReplayPage from "./pages/ReplayPage";
import HealthPage from "./pages/HealthPage";
import LabNotebookPage from "./pages/LabNotebookPage";

import GlobalStatusBar from "./components/GlobalStatusBar";
import UserBar from "./components/UserBar";
import { getTheme } from "./theme";

function BiofloLogo({ theme }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: 16,
          background: `linear-gradient(135deg, ${theme.success} 0%, ${theme.primaryAlt} 100%)`,
          display: "grid",
          placeItems: "center",
          boxShadow: `0 10px 24px ${theme.primaryAlt}33`,
        }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 3C9 6.3 7 8.9 7 12.1C7 15 9.2 17 12 17C14.8 17 17 15 17 12.1C17 8.9 15 6.3 12 3Z"
            fill="white"
          />
          <path
            d="M8.5 18.5C9.5 19.5 10.7 20 12 20C13.3 20 14.5 19.5 15.5 18.5"
            stroke="white"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div>
        <div style={{ color: theme.textOnDark, fontWeight: 800, fontSize: 22 }}>
          BioFlo
        </div>
        <div style={{ color: "#94a3b8", fontSize: 13 }}>
          Supervision Dashboard
        </div>
      </div>
    </div>
  );
}

function App() {
  const [status, setStatus] = useState(null);
  const [dbStatus, setDbStatus] = useState(null);
  const [realtime, setRealtime] = useState(null);
  const [updatedAt, setUpdatedAt] = useState("");
  const [error, setError] = useState("");
  const [themeMode, setThemeMode] = useState(
    localStorage.getItem("bioflo_theme") || "light"
  );
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("bioflo_user");
    return saved ? JSON.parse(saved) : null;
  });

  const theme = getTheme(themeMode);

  useEffect(() => {
    const loadGlobalData = () => {
      fetch("http://127.0.0.1:8000/status")
        .then((response) => response.json())
        .then((data) => {
          setStatus(data);
          setError("");
        })
        .catch(() => setError("Impossible de contacter le backend"));

      fetch("http://127.0.0.1:8000/db-status")
        .then((response) => response.json())
        .then((data) => {
          setDbStatus(data.database);
        })
        .catch(() => setDbStatus("error"));

      fetch("http://127.0.0.1:8000/realtime")
        .then((response) => response.json())
        .then((data) => {
          setRealtime(data);
          setUpdatedAt(new Date().toLocaleString());
        })
        .catch(() => setError("Impossible de charger l’état global"));
    };

    loadGlobalData();
    const interval = setInterval(loadGlobalData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = (loggedUser) => {
    setUser(loggedUser);
    localStorage.setItem("bioflo_user", JSON.stringify(loggedUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("bioflo_user");
  };

  const toggleTheme = () => {
    const next = themeMode === "light" ? "dark" : "light";
    setThemeMode(next);
    localStorage.setItem("bioflo_theme", next);
  };

  const navLinkStyle = ({ isActive }) => ({
    display: "flex",
    alignItems: "center",
    gap: 10,
    color: isActive ? "#ffffff" : theme.navText,
    textDecoration: "none",
    fontWeight: 700,
    padding: "13px 14px",
    borderRadius: 14,
    background: isActive
      ? `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryAlt} 100%)`
      : "transparent",
    boxShadow: isActive ? `0 12px 24px ${theme.primary}33` : "none",
    transition: "all 0.2s ease",
    marginBottom: 8,
    fontSize: 14,
  });

  const themeButtonStyle = {
    padding: "10px 14px",
    borderRadius: 14,
    border: `1px solid ${theme.border}`,
    cursor: "pointer",
    fontWeight: 800,
    color: themeMode === "light" ? "#ffffff" : theme.text,
    background:
      themeMode === "light"
        ? `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryAlt} 100%)`
        : theme.panel,
  };

  if (!user) {
    return (
      <div
        style={{
          fontFamily: "Inter, Arial, sans-serif",
          minHeight: "100vh",
          background:
            themeMode === "light"
              ? "radial-gradient(circle at top left, #e2e8f0 0%, #edf2f7 45%, #f8fafc 100%)"
              : "radial-gradient(circle at top left, #0f172a 0%, #111827 40%, #020617 100%)",
          padding: 30,
        }}
      >
        <div
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            borderRadius: 28,
            overflow: "hidden",
            background: theme.panel,
            border: `1px solid ${theme.border}`,
            boxShadow: theme.panelGlow,
          }}
        >
          <div
            style={{
              padding: 28,
              borderBottom: `1px solid ${theme.border}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 20,
              background: `linear-gradient(135deg, ${theme.sidebarA} 0%, ${theme.sidebarB} 100%)`,
            }}
          >
            <BiofloLogo theme={theme} />
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ color: "#cbd5e1", fontSize: 14 }}>
                Monitoring platform — Academic Project
              </div>
              <button onClick={toggleTheme} style={themeButtonStyle}>
                {themeMode === "light" ? "🌙 Dark" : "☀️ Light"}
              </button>
            </div>
          </div>

          <div style={{ padding: 30 }}>
            <LoginPage onLogin={handleLogin} theme={theme} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div
        style={{
          fontFamily: "Inter, Arial, sans-serif",
          background: theme.appBg,
          minHeight: "100vh",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "290px 1fr",
            minHeight: "100vh",
          }}
        >
          <aside
            style={{
              background: `linear-gradient(180deg, ${theme.sidebarA} 0%, ${theme.sidebarB} 100%)`,
              color: "#fff",
              padding: 22,
              boxShadow: "14px 0 34px rgba(15,23,42,0.12)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
                marginBottom: 22,
              }}
            >
              <BiofloLogo theme={theme} />
              <button onClick={toggleTheme} style={themeButtonStyle}>
                {themeMode === "light" ? "🌙" : "☀️"}
              </button>
            </div>

            <div
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 18,
                padding: 16,
                marginBottom: 22,
              }}
            >
              <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 6 }}>
                Project mode
              </div>
              <div style={{ fontWeight: 800, fontSize: 16 }}>
                {status?.mode || "simulation"}
              </div>
              <div style={{ color: "#cbd5e1", marginTop: 6, fontSize: 13 }}>
                Modern dashboard / SCADA style
              </div>
            </div>

            <nav>
              <NavLink to="/" style={navLinkStyle}>
                <span>🏠</span>
                <span>Accueil</span>
              </NavLink>

              <NavLink to="/realtime" style={navLinkStyle}>
                <span>📡</span>
                <span>Temps réel</span>
              </NavLink>

              <NavLink to="/trends" style={navLinkStyle}>
                <span>📈</span>
                <span>Tendances</span>
              </NavLink>

              <NavLink to="/alarms" style={navLinkStyle}>
                <span>🚨</span>
                <span>Alarmes</span>
              </NavLink>

              <NavLink to="/communication" style={navLinkStyle}>
                <span>🔌</span>
                <span>Communication</span>
              </NavLink>

              <NavLink to="/events" style={navLinkStyle}>
                <span>🗂️</span>
                <span>Historique</span>
              </NavLink>

              <NavLink to="/recipes" style={navLinkStyle}>
                <span>🧪</span>
                <span>Recettes</span>
              </NavLink>

              <NavLink to="/batches" style={navLinkStyle}>
                <span>🧫</span>
                <span>Batchs</span>
              </NavLink>

              <NavLink to="/batch-comparison" style={navLinkStyle}>
                <span>⚖️</span>
                <span>Comparaison</span>
              </NavLink>

              <NavLink to="/annotations" style={navLinkStyle}>
                <span>📝</span>
                <span>Annotations</span>
              </NavLink>

              <NavLink to="/replay" style={navLinkStyle}>
                <span>⏪</span>
                <span>Replay</span>
              </NavLink>

              <NavLink to="/lab-notebook" style={navLinkStyle}>
                <span>📓</span>
                <span>Cahier labo</span>
              </NavLink>

              <NavLink to="/health" style={navLinkStyle}>
                <span>💚</span>
                <span>Santé procédé</span>
              </NavLink>

              {(user.role === "supervisor" || user.role === "admin") && (
                <NavLink to="/settings" style={navLinkStyle}>
                  <span>⚙️</span>
                  <span>Paramètres</span>
                </NavLink>
              )}
            </nav>
          </aside>

          <main style={{ padding: 26 }}>
            <div
              style={{
                background: theme.panel,
                borderRadius: 28,
                padding: 24,
                boxShadow: theme.panelGlow,
                border: `1px solid ${theme.border}`,
                minHeight: "calc(100vh - 52px)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 16,
                  flexWrap: "wrap",
                  marginBottom: 18,
                }}
              >
                <div>
                  <h1
                    style={{
                      margin: 0,
                      color: theme.text,
                      fontSize: 32,
                      fontWeight: 900,
                    }}
                  >
                    BioFlo Supervision
                  </h1>
                  <p
                    style={{
                      marginTop: 8,
                      marginBottom: 0,
                      color: theme.textSoft,
                      fontSize: 14,
                    }}
                  >
                    Monitoring, batch analysis, replay, annotations and learning tools
                  </p>
                </div>

                <div
                  style={{
                    background: theme.panelAlt,
                    border: `1px solid ${theme.border}`,
                    borderRadius: 16,
                    padding: "10px 14px",
                    color: theme.text,
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  UI professionnelle
                </div>
              </div>

              <UserBar user={user} onLogout={handleLogout} theme={theme} />

              {error && (
                <div
                  style={{
                    backgroundColor:
                      theme.mode === "dark" ? "#3f1d1d" : "#fee2e2",
                    color: theme.danger,
                    padding: 15,
                    borderRadius: 16,
                    marginBottom: 20,
                    fontWeight: "bold",
                    border: `1px solid ${theme.danger}55`,
                  }}
                >
                  {error}
                </div>
              )}

              <GlobalStatusBar
                backendStatus={status?.status}
                dbStatus={dbStatus}
                realtime={realtime}
                updatedAt={updatedAt}
                theme={theme}
              />

              <div style={{ marginTop: 20 }}>
                <Routes>
                  <Route path="/" element={<HomePage theme={theme} />} />
                  <Route path="/realtime" element={<RealtimePage theme={theme} />} />
                  <Route path="/trends" element={<TrendsPage theme={theme} />} />
                  <Route path="/alarms" element={<AlarmsPage user={user} theme={theme} />} />
                  <Route path="/communication" element={<CommunicationPage theme={theme} />} />
                  <Route path="/events" element={<EventsPage theme={theme} />} />
                  <Route path="/recipes" element={<RecipesPage user={user} theme={theme} />} />
                  <Route path="/batches" element={<BatchesPage user={user} theme={theme} />} />
                  <Route path="/batch-comparison" element={<BatchComparisonPage theme={theme} />} />
                  <Route path="/annotations" element={<AnnotationsPage user={user} theme={theme} />} />
                  <Route path="/replay" element={<ReplayPage theme={theme} />} />
                  <Route path="/lab-notebook" element={<LabNotebookPage user={user} theme={theme} />} />
                  <Route path="/health" element={<HealthPage theme={theme} />} />
                  <Route path="/settings" element={<SettingsPage user={user} theme={theme} />} />
                </Routes>
              </div>
            </div>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;