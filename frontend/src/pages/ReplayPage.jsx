import { useEffect, useState } from "react";

function ReplayPage({ theme }) {
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [replay, setReplay] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const cardStyle = {
    background: theme.panelAlt,
    borderRadius: "22px",
    padding: "20px",
    boxShadow: "0 10px 22px rgba(15,23,42,0.05)",
    border: `1px solid ${theme.border}`,
    marginBottom: "20px",
    color: theme.text,
  };

  const metricStyle = {
    background: theme.panel,
    border: `1px solid ${theme.border}`,
    borderRadius: 16,
    padding: 14,
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

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "10px",
    border: `1px solid ${theme.border}`,
    backgroundColor: theme.inputBg,
    color: theme.text,
    marginTop: "6px",
    boxSizing: "border-box",
  };

  const loadBatches = () => {
    fetch("http://127.0.0.1:8000/batches")
      .then((r) => r.json())
      .then((data) => {
        setBatches(data.rows || []);
      })
      .catch(() => setError("Impossible de charger les batchs"));
  };

  const loadReplay = () => {
    if (!selectedBatchId) return;

    fetch(`http://127.0.0.1:8000/replay/${selectedBatchId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.status === "success") {
          setReplay(data);
          setError("");
          setMessage("Replay chargé");
        } else {
          setReplay(null);
          setError(data.details || "Replay indisponible");
        }
      })
      .catch(() => setError("Erreur lors du chargement du replay"));
  };

  useEffect(() => {
    loadBatches();
  }, []);

  return (
    <div>
      <h2 style={{ color: theme.text, marginBottom: 20, fontSize: 24, fontWeight: 800 }}>
        Replay d’expérience
      </h2>

      {message && (
        <div style={{
          backgroundColor: theme.mode === "dark" ? "#16311f" : "#dcfce7",
          color: theme.success,
          padding: 15,
          borderRadius: 14,
          marginBottom: 20,
          fontWeight: "bold",
          border: `1px solid ${theme.success}55`,
        }}>
          {message}
        </div>
      )}

      {error && (
        <div style={{
          backgroundColor: theme.mode === "dark" ? "#3f1d1d" : "#fee2e2",
          color: theme.danger,
          padding: 15,
          borderRadius: 14,
          marginBottom: 20,
          fontWeight: "bold",
          border: `1px solid ${theme.danger}55`,
        }}>
          {error}
        </div>
      )}

      <div style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>Charger un replay</h3>

        <div style={{ maxWidth: 420 }}>
          <label>Batch</label>
          <select
            style={inputStyle}
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
          >
            <option value="">Choisir un batch</option>
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.name} - {batch.status}
              </option>
            ))}
          </select>
        </div>

        <button style={{ ...buttonStyle, marginTop: 14 }} onClick={loadReplay}>
          Charger replay
        </button>
      </div>

      {replay && (
        <>
          <div style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Informations batch</h3>
            <p><strong>Nom :</strong> {replay.batch.name}</p>
            <p><strong>Début :</strong> {replay.time_window.start_time}</p>
            <p><strong>Fin :</strong> {replay.time_window.end_time}</p>
          </div>

          <div style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Volumes de replay</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
              <div style={metricStyle}>
                <p><strong>Température :</strong> {replay.tags?.temp_reactor?.length || 0} points</p>
              </div>
              <div style={metricStyle}>
                <p><strong>pH :</strong> {replay.tags?.ph_value?.length || 0} points</p>
              </div>
              <div style={metricStyle}>
                <p><strong>DO :</strong> {replay.tags?.do_percent?.length || 0} points</p>
              </div>
              <div style={metricStyle}>
                <p><strong>RPM :</strong> {replay.tags?.stirrer_rpm?.length || 0} points</p>
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Alarmes du replay</h3>
            {replay.alarms?.length > 0 ? (
              replay.alarms.map((alarm) => (
                <div key={alarm.id} style={{ borderBottom: `1px solid ${theme.border}`, padding: "10px 0" }}>
                  <p><strong>Code :</strong> {alarm.code}</p>
                  <p><strong>Message :</strong> {alarm.message}</p>
                  <p><strong>Priorité :</strong> {alarm.priority}</p>
                  <p><strong>Date :</strong> {alarm.created_at}</p>
                </div>
              ))
            ) : (
              <p>Aucune alarme</p>
            )}
          </div>

          <div style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Annotations pédagogiques</h3>
            {replay.annotations?.length > 0 ? (
              replay.annotations.map((item) => (
                <div key={item.id} style={{ borderBottom: `1px solid ${theme.border}`, padding: "10px 0" }}>
                  <p><strong>Titre :</strong> {item.title}</p>
                  <p><strong>Type :</strong> {item.annotation_type}</p>
                  <p><strong>Description :</strong> {item.description || "-"}</p>
                  <p><strong>Moment :</strong> {item.event_time || "-"}</p>
                </div>
              ))
            ) : (
              <p>Aucune annotation</p>
            )}
          </div>

          <div style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Markers replay</h3>
            {replay.markers?.length > 0 ? (
              replay.markers.map((item) => (
                <div key={item.id} style={{ borderBottom: `1px solid ${theme.border}`, padding: "10px 0" }}>
                  <p><strong>Label :</strong> {item.label}</p>
                  <p><strong>Type :</strong> {item.marker_type}</p>
                  <p><strong>Temps :</strong> {item.replay_time}</p>
                  <p><strong>Description :</strong> {item.description || "-"}</p>
                </div>
              ))
            ) : (
              <p>Aucun marker</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default ReplayPage;