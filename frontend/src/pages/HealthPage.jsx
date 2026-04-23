import { useEffect, useState } from "react";

function HealthPage({ theme }) {
  const [healthData, setHealthData] = useState(null);
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [batchHealth, setBatchHealth] = useState(null);
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

  const scoreCard = {
    background: theme.panel,
    border: `1px solid ${theme.border}`,
    borderRadius: 16,
    padding: 16,
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

  const loadGlobalHealth = () => {
    fetch("http://127.0.0.1:8000/health")
      .then((r) => r.json())
      .then((data) => {
        setHealthData(data);
        setError("");
      })
      .catch(() => setError("Impossible de charger la santé procédé"));
  };

  const loadBatches = () => {
    fetch("http://127.0.0.1:8000/batches")
      .then((r) => r.json())
      .then((data) => {
        setBatches(data.rows || []);
      })
      .catch(() => setError("Impossible de charger les batchs"));
  };

  const loadBatchHealth = () => {
    if (!selectedBatchId) return;

    fetch(`http://127.0.0.1:8000/batches/${selectedBatchId}/health`)
      .then((r) => r.json())
      .then((data) => {
        if (data.status === "success") {
          setBatchHealth(data);
          setMessage("Santé du batch calculée");
          setError("");
        } else {
          setBatchHealth(null);
          setError(data.details || "Impossible de calculer la santé");
        }
      })
      .catch(() => setError("Erreur de calcul santé batch"));
  };

  useEffect(() => {
    loadGlobalHealth();
    loadBatches();
  }, []);

  const renderHealthBlock = (title, health) => {
    if (!health) return null;

    return (
      <div style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>{title}</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          <div style={scoreCard}>
            <p><strong>Health score :</strong> {health.health_score}</p>
          </div>
          <div style={scoreCard}>
            <p><strong>Stability score :</strong> {health.stability_score}</p>
          </div>
          <div style={scoreCard}>
            <p><strong>Alarm score :</strong> {health.alarm_score}</p>
          </div>
          <div style={scoreCard}>
            <p><strong>Recipe adherence :</strong> {health.recipe_adherence_score}</p>
          </div>
        </div>
        <div style={{ ...scoreCard, marginTop: 12 }}>
          <p><strong>Summary :</strong> {health.summary}</p>
        </div>
      </div>
    );
  };

  return (
    <div>
      <h2 style={{ color: theme.text, marginBottom: 20, fontSize: 24, fontWeight: 800 }}>
        Santé du procédé
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

      {healthData?.health && renderHealthBlock("Santé actuelle", healthData.health)}

      <div style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>Calcul santé d’un batch</h3>

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

        <button style={{ ...buttonStyle, marginTop: 14 }} onClick={loadBatchHealth}>
          Calculer santé batch
        </button>
      </div>

      {batchHealth?.health && renderHealthBlock("Santé du batch sélectionné", batchHealth.health)}

      <div style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>Snapshots récents</h3>
        {healthData?.snapshots?.length > 0 ? (
          healthData.snapshots.map((item) => (
            <div
              key={item.id}
              style={{
                borderBottom: `1px solid ${theme.border}`,
                padding: "10px 0",
              }}
            >
              <p><strong>Batch ID :</strong> {item.batch_id}</p>
              <p><strong>Health :</strong> {item.health_score}</p>
              <p><strong>Stability :</strong> {item.stability_score}</p>
              <p><strong>Alarm :</strong> {item.alarm_score}</p>
              <p><strong>Recipe adherence :</strong> {item.recipe_adherence_score}</p>
              <p><strong>Summary :</strong> {item.summary}</p>
              <p><strong>Date :</strong> {item.created_at}</p>
            </div>
          ))
        ) : (
          <p>Aucun snapshot</p>
        )}
      </div>
    </div>
  );
}

export default HealthPage;