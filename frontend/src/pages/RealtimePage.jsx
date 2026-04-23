import { useEffect, useState } from "react";

function RealtimePage({ theme }) {
  const [realtime, setRealtime] = useState(null);
  const [dbRealtime, setDbRealtime] = useState([]);
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

  const loadRealtime = () => {
    fetch("http://127.0.0.1:8000/realtime")
      .then((r) => r.json())
      .then((data) => {
        setRealtime(data);
        setError("");
        setMessage("Données temps réel chargées");
      })
      .catch(() => {
        setError("Impossible de charger les données temps réel");
      });
  };

  const loadDbRealtime = () => {
    fetch("http://127.0.0.1:8000/db-realtime")
      .then((r) => r.json())
      .then((data) => {
        setDbRealtime(data.rows || []);
      })
      .catch(() => {
        setDbRealtime([]);
      });
  };

  useEffect(() => {
    loadRealtime();
    loadDbRealtime();

    const interval = setInterval(() => {
      loadRealtime();
      loadDbRealtime();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const boolText = (value) => {
    if (value === true) return "ON";
    if (value === false) return "OFF";
    return String(value ?? "-");
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
        Temps réel
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
        <h3 style={{ marginTop: 0 }}>Vue opérateur</h3>

        {realtime ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 12,
            }}
          >
            <div style={metricCardStyle}>
              <p><strong>Mode source :</strong> {realtime.source_mode ?? "-"}</p>
            </div>
            <div style={metricCardStyle}>
              <p><strong>Communication :</strong> {realtime.comm_status ?? "-"}</p>
            </div>
            <div style={metricCardStyle}>
              <p><strong>Qualité donnée :</strong> {realtime.data_quality ?? "-"}</p>
            </div>
            <div style={metricCardStyle}>
              <p><strong>État procédé :</strong> {realtime.process_state ?? "-"}</p>
            </div>
            <div style={metricCardStyle}>
              <p><strong>Température :</strong> {realtime.temp_reactor ?? "-"} °C</p>
            </div>
            <div style={metricCardStyle}>
              <p><strong>pH :</strong> {realtime.ph_value ?? "-"}</p>
            </div>
            <div style={metricCardStyle}>
              <p><strong>DO :</strong> {realtime.do_percent ?? "-"} %</p>
            </div>
            <div style={metricCardStyle}>
              <p><strong>Agitation :</strong> {realtime.stirrer_rpm ?? "-"} rpm</p>
            </div>
            <div style={metricCardStyle}>
              <p><strong>Pump 1 :</strong> {boolText(realtime.pump1_state)}</p>
            </div>
            <div style={metricCardStyle}>
              <p><strong>Pump 2 :</strong> {boolText(realtime.pump2_state)}</p>
            </div>
            <div style={metricCardStyle}>
              <p><strong>Pump 3 :</strong> {boolText(realtime.pump3_state)}</p>
            </div>
            <div style={metricCardStyle}>
              <p><strong>Gas 1 :</strong> {boolText(realtime.gas1_state)}</p>
            </div>
            <div style={metricCardStyle}>
              <p><strong>Gas 2 :</strong> {boolText(realtime.gas2_state)}</p>
            </div>
            <div style={metricCardStyle}>
              <p><strong>Gas 3 :</strong> {boolText(realtime.gas3_state)}</p>
            </div>
            <div style={metricCardStyle}>
              <p><strong>Gas 4 :</strong> {boolText(realtime.gas4_state)}</p>
            </div>
          </div>
        ) : (
          <p>Aucune donnée temps réel disponible</p>
        )}
      </div>

      <div style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>Tags enregistrés en base</h3>

        {dbRealtime.length > 0 ? (
          dbRealtime.map((row, index) => (
            <div
              key={`${row.tag_name}-${index}`}
              style={{
                borderBottom: `1px solid ${theme.border}`,
                padding: "10px 0",
              }}
            >
              <p><strong>Tag :</strong> {row.tag_name}</p>
              <p><strong>Valeur :</strong> {row.tag_value}</p>
              <p><strong>Updated at :</strong> {row.updated_at}</p>
            </div>
          ))
        ) : (
          <p>Aucune valeur temps réel en base</p>
        )}
      </div>
    </div>
  );
}

export default RealtimePage;