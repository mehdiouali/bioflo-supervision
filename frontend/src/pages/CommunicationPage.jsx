import { useEffect, useState } from "react";

function CommunicationPage({ theme }) {
  const [status, setStatus] = useState(null);
  const [sourceMode, setSourceMode] = useState(null);
  const [dbStatus, setDbStatus] = useState(null);
  const [settings, setSettings] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const cardStyle = {
    background: theme.panelAlt,
    borderRadius: "22px",
    padding: "20px",
    border: `1px solid ${theme.border}`,
    boxShadow: "0 10px 22px rgba(15,23,42,0.05)",
    color: theme.text,
    marginBottom: "20px",
  };

  const metricCardStyle = {
    background: theme.panel,
    border: `1px solid ${theme.border}`,
    borderRadius: "16px",
    padding: "14px",
  };

  const buttonStyle = {
    padding: "10px 14px",
    borderRadius: "12px",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
    color: "#fff",
    background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryAlt} 100%)`,
  };

  const warningButtonStyle = {
    ...buttonStyle,
    background: `linear-gradient(135deg, ${theme.warning} 0%, #b45309 100%)`,
  };

  const loadData = () => {
    fetch("http://127.0.0.1:8000/status")
      .then((r) => r.json())
      .then((data) => setStatus(data))
      .catch(() => setError("Impossible de charger le status backend"));

    fetch("http://127.0.0.1:8000/source-mode")
      .then((r) => r.json())
      .then((data) => setSourceMode(data.source_mode))
      .catch(() => setError("Impossible de charger le mode source"));

    fetch("http://127.0.0.1:8000/db-status")
      .then((r) => r.json())
      .then((data) => setDbStatus(data.database))
      .catch(() => setDbStatus("error"));

    fetch("http://127.0.0.1:8000/settings")
      .then((r) => r.json())
      .then((data) => setSettings(data.rows || []))
      .catch(() => setSettings([]));
  };

  useEffect(() => {
    loadData();
  }, []);

  const setMode = async (mode) => {
    const response = await fetch(
      `http://127.0.0.1:8000/set-source-mode/${mode}?actor=admin`
    );
    const data = await response.json();

    if (data.status === "updated") {
      setMessage(`Mode source changé vers ${data.source_mode}`);
      setError("");
      loadData();
    } else {
      setError(data.details || "Erreur lors du changement de mode");
    }
  };

  const getColor = (value) => {
    if (value === "ok" || value === "connected") return theme.success;
    if (
      value === "simulation" ||
      value === "warning" ||
      value === "waiting_connector"
    ) {
      return theme.warning;
    }
    if (value === "error") return theme.danger;
    return theme.text;
  };

  return (
    <div>
      <h2
        style={{
          color: theme.text,
          marginBottom: 20,
          fontSize: 24,
          fontWeight: 800,
        }}
      >
        Communication
      </h2>

      {message && (
        <div
          style={{
            backgroundColor: theme.mode === "dark" ? "#16311f" : "#dcfce7",
            color: theme.success,
            padding: 15,
            borderRadius: 14,
            marginBottom: 20,
            fontWeight: "bold",
            border: `1px solid ${theme.success}55`,
          }}
        >
          {message}
        </div>
      )}

      {error && (
        <div
          style={{
            backgroundColor: theme.mode === "dark" ? "#3f1d1d" : "#fee2e2",
            color: theme.danger,
            padding: 15,
            borderRadius: 14,
            marginBottom: 20,
            fontWeight: "bold",
            border: `1px solid ${theme.danger}55`,
          }}
        >
          {error}
        </div>
      )}

      <div style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>État de communication</h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
          }}
        >
          <div style={metricCardStyle}>
            <p>
              <strong>Backend :</strong>{" "}
              <span style={{ color: getColor(status?.status), fontWeight: 700 }}>
                {status?.status || "-"}
              </span>
            </p>
          </div>

          <div style={metricCardStyle}>
            <p>
              <strong>Database :</strong>{" "}
              <span style={{ color: getColor(dbStatus), fontWeight: 700 }}>
                {dbStatus || "-"}
              </span>
            </p>
          </div>

          <div style={metricCardStyle}>
            <p>
              <strong>Mode source :</strong>{" "}
              <span style={{ color: getColor(sourceMode), fontWeight: 700 }}>
                {sourceMode || "-"}
              </span>
            </p>
          </div>

          <div style={metricCardStyle}>
            <p>
              <strong>Message backend :</strong> {status?.message || "-"}
            </p>
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>Changer le mode de communication</h3>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button style={buttonStyle} onClick={() => setMode("simulation")}>
            Passer en simulation
          </button>

          <button style={warningButtonStyle} onClick={() => setMode("live_bioflo")}>
            Passer en live_bioflo
          </button>
        </div>

        <p style={{ marginTop: 14, color: theme.textSoft }}>
          Utilise <strong>simulation</strong> pour les tests logiciels et{" "}
          <strong>live_bioflo</strong> quand le connecteur réel sera prêt.
        </p>
      </div>

      <div style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>Paramètres utiles</h3>

        {settings.length > 0 ? (
          settings.map((item, index) => (
            <div
              key={`${item.setting_key}-${index}`}
              style={{
                borderBottom: `1px solid ${theme.border}`,
                padding: "10px 0",
              }}
            >
              <p>
                <strong>Clé :</strong> {item.setting_key}
              </p>
              <p>
                <strong>Valeur :</strong> {item.setting_value}
              </p>
              <p>
                <strong>Type :</strong> {item.value_type}
              </p>
              <p>
                <strong>Updated :</strong> {item.updated_at}
              </p>
            </div>
          ))
        ) : (
          <p>Aucun paramètre disponible</p>
        )}
      </div>
    </div>
  );
}

export default CommunicationPage;