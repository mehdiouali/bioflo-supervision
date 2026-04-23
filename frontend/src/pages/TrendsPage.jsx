import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

function TrendsPage({ theme }) {
  const [tempData, setTempData] = useState([]);
  const [phData, setPhData] = useState([]);
  const [doData, setDoData] = useState([]);
  const [rpmData, setRpmData] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadHistory = () => {
      Promise.all([
        fetch("http://127.0.0.1:8000/history/temp_reactor").then((r) => r.json()),
        fetch("http://127.0.0.1:8000/history/ph_value").then((r) => r.json()),
        fetch("http://127.0.0.1:8000/history/do_percent").then((r) => r.json()),
        fetch("http://127.0.0.1:8000/history/stirrer_rpm").then((r) => r.json()),
      ])
        .then(([temp, ph, oxygen, rpm]) => {
          setTempData(
            temp.rows.map((item) => ({
              time: new Date(item.recorded_at).toLocaleTimeString(),
              value: Number(item.tag_value),
            }))
          );
          setPhData(
            ph.rows.map((item) => ({
              time: new Date(item.recorded_at).toLocaleTimeString(),
              value: Number(item.tag_value),
            }))
          );
          setDoData(
            oxygen.rows.map((item) => ({
              time: new Date(item.recorded_at).toLocaleTimeString(),
              value: Number(item.tag_value),
            }))
          );
          setRpmData(
            rpm.rows.map((item) => ({
              time: new Date(item.recorded_at).toLocaleTimeString(),
              value: Number(item.tag_value),
            }))
          );
          setError("");
        })
        .catch(() => setError("Impossible de charger l’historique"));
    };

    loadHistory();
    const interval = setInterval(loadHistory, 3000);
    return () => clearInterval(interval);
  }, []);

  const cardStyle = {
    background: theme.panelAlt,
    borderRadius: "22px",
    padding: "20px",
    boxShadow: "0 10px 22px rgba(15,23,42,0.05)",
    border: `1px solid ${theme.border}`,
    marginBottom: "20px",
    color: theme.text,
  };

  const exportButtonStyle = {
    display: "inline-block",
    marginTop: "12px",
    padding: "9px 12px",
    borderRadius: "12px",
    background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryAlt} 100%)`,
    color: "#fff",
    textDecoration: "none",
    fontWeight: "bold",
    boxShadow: `0 10px 18px ${theme.primary}33`,
  };

  const axisColor = theme.textSoft;

  return (
    <div>
      <h2 style={{ color: theme.text, marginBottom: "20px", fontSize: "24px", fontWeight: 800 }}>
        Tendances
      </h2>

      {error && (
        <div
          style={{
            backgroundColor: theme.mode === "dark" ? "#3f1d1d" : "#fee2e2",
            color: theme.danger,
            padding: "15px",
            borderRadius: "14px",
            marginBottom: "20px",
            fontWeight: "bold",
            border: `1px solid ${theme.danger}55`,
          }}
        >
          {error}
        </div>
      )}

      <div style={cardStyle}>
        <h3>Température</h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={tempData}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
            <XAxis dataKey="time" stroke={axisColor} />
            <YAxis stroke={axisColor} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="value" name="°C" stroke={theme.primary} strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
        <a href="http://127.0.0.1:8000/export/history/temp_reactor" style={exportButtonStyle}>
          Export CSV Température
        </a>
      </div>

      <div style={cardStyle}>
        <h3>pH</h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={phData}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
            <XAxis dataKey="time" stroke={axisColor} />
            <YAxis domain={[6.4, 7.6]} stroke={axisColor} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="value" name="pH" stroke={theme.success} strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
        <a href="http://127.0.0.1:8000/export/history/ph_value" style={exportButtonStyle}>
          Export CSV pH
        </a>
      </div>

      <div style={cardStyle}>
        <h3>DO</h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={doData}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
            <XAxis dataKey="time" stroke={axisColor} />
            <YAxis stroke={axisColor} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="value" name="DO %" stroke={theme.warning} strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
        <a href="http://127.0.0.1:8000/export/history/do_percent" style={exportButtonStyle}>
          Export CSV DO
        </a>
      </div>

      <div style={cardStyle}>
        <h3>Agitation</h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={rpmData}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
            <XAxis dataKey="time" stroke={axisColor} />
            <YAxis stroke={axisColor} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="value" name="RPM" stroke={theme.danger} strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
        <a href="http://127.0.0.1:8000/export/history/stirrer_rpm" style={exportButtonStyle}>
          Export CSV Agitation
        </a>
      </div>
    </div>
  );
}

export default TrendsPage;