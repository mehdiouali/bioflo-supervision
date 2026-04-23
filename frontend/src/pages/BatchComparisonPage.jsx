import { useEffect, useState } from "react";

function BatchComparisonPage({ theme }) {
  const [batches, setBatches] = useState([]);
  const [batchA, setBatchA] = useState("");
  const [batchB, setBatchB] = useState("");
  const [comparison, setComparison] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const cardStyle = {
    background: theme.panelAlt,
    borderRadius: "22px",
    padding: "20px",
    boxShadow: "0 10px 22px rgba(15,23,42,0.05)",
    border: `1px solid ${theme.border}`,
    marginBottom: "20px",
    color: theme.text,
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

  const buttonStyle = {
    padding: "10px 14px",
    borderRadius: "12px",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
    color: "#fff",
    background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryAlt} 100%)`,
    boxShadow: `0 10px 18px ${theme.primary}33`,
  };

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "12px",
  };

  const metricCardStyle = {
    background: theme.panel,
    border: `1px solid ${theme.border}`,
    borderRadius: "16px",
    padding: "14px",
  };

  const loadBatches = () => {
    fetch("http://127.0.0.1:8000/batches")
      .then((r) => r.json())
      .then((data) => {
        setBatches(data.rows || []);
        setError("");
      })
      .catch(() => setError("Impossible de charger les batchs"));
  };

  useEffect(() => {
    loadBatches();
  }, []);

  const handleCompare = () => {
    if (!batchA || !batchB) {
      setError("Choisis deux batchs");
      return;
    }

    if (batchA === batchB) {
      setError("Choisis deux batchs différents");
      return;
    }

    fetch(`http://127.0.0.1:8000/batches/compare/${batchA}/${batchB}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.status === "success") {
          setComparison(data);
          setError("");
          setMessage("Comparaison chargée");
        } else {
          setComparison(null);
          setError(data.details || "Impossible de comparer les batchs");
        }
      })
      .catch(() => {
        setComparison(null);
        setError("Erreur pendant la comparaison");
      });
  };

  const renderTagCard = (title, key, unit = "") => {
    if (!comparison?.comparison?.[key]) return null;

    const c = comparison.comparison[key];

    return (
      <div style={metricCardStyle}>
        <h4 style={{ marginTop: 0 }}>{title}</h4>
        <p><strong>Batch A moyenne :</strong> {c.batch_a_avg ?? "-"} {unit}</p>
        <p><strong>Batch B moyenne :</strong> {c.batch_b_avg ?? "-"} {unit}</p>
        <p><strong>Différence moyenne :</strong> {c.avg_difference ?? "-"} {unit}</p>
        <p><strong>Batch A hors plage :</strong> {c.batch_a_out_percent ?? "-"} %</p>
        <p><strong>Batch B hors plage :</strong> {c.batch_b_out_percent ?? "-"} %</p>
        <p><strong>Écart recette A :</strong> {c.batch_a_recipe_deviation ?? "-"} {unit}</p>
        <p><strong>Écart recette B :</strong> {c.batch_b_recipe_deviation ?? "-"} {unit}</p>
      </div>
    );
  };

  return (
    <div>
      <h2
        style={{
          color: theme.text,
          marginBottom: "20px",
          fontSize: "24px",
          fontWeight: 800,
        }}
      >
        Comparaison de batchs
      </h2>

      {message && (
        <div
          style={{
            backgroundColor: theme.mode === "dark" ? "#16311f" : "#dcfce7",
            color: theme.success,
            padding: "15px",
            borderRadius: "14px",
            marginBottom: "20px",
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
        <h3 style={{ marginTop: 0 }}>Choisir deux batchs</h3>

        <div style={gridStyle}>
          <div>
            <label>Batch A</label>
            <select
              style={inputStyle}
              value={batchA}
              onChange={(e) => setBatchA(e.target.value)}
            >
              <option value="">Choisir un batch</option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.name} - {batch.status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Batch B</label>
            <select
              style={inputStyle}
              value={batchB}
              onChange={(e) => setBatchB(e.target.value)}
            >
              <option value="">Choisir un batch</option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.name} - {batch.status}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button style={{ ...buttonStyle, marginTop: "14px" }} onClick={handleCompare}>
          Comparer les batchs
        </button>
      </div>

      {comparison && (
        <>
          <div style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Résumé général</h3>
            <div style={gridStyle}>
              <div style={metricCardStyle}>
                <p><strong>Batch A :</strong> {comparison.batch_a.batch.name}</p>
                <p><strong>Durée A :</strong> {comparison.batch_a.time_window.actual_duration_min} min</p>
                <p><strong>Alarmes A :</strong> {comparison.batch_a.alarm_summary.total_alarm_events}</p>
              </div>
              <div style={metricCardStyle}>
                <p><strong>Batch B :</strong> {comparison.batch_b.batch.name}</p>
                <p><strong>Durée B :</strong> {comparison.batch_b.time_window.actual_duration_min} min</p>
                <p><strong>Alarmes B :</strong> {comparison.batch_b.alarm_summary.total_alarm_events}</p>
              </div>
            </div>
          </div>

          <div style={gridStyle}>
            {renderTagCard("Température", "temp_reactor", "°C")}
            {renderTagCard("pH", "ph_value")}
            {renderTagCard("DO", "do_percent", "%")}
            {renderTagCard("Agitation", "stirrer_rpm", "rpm")}
          </div>

          <div style={{ ...cardStyle, marginTop: "20px" }}>
            <h3 style={{ marginTop: 0 }}>Conclusions automatiques</h3>
            {comparison.summary?.length > 0 ? (
              <ul style={{ marginBottom: 0 }}>
                {comparison.summary.map((item, index) => (
                  <li key={index} style={{ marginBottom: "8px" }}>
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p>Aucune conclusion disponible</p>
            )}
          </div>

          <div style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Observations batch A</h3>
            {comparison.batch_a.observations?.length > 0 ? (
              <ul style={{ marginBottom: 0 }}>
                {comparison.batch_a.observations.map((item, index) => (
                  <li key={index} style={{ marginBottom: 8 }}>
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p>Aucune observation</p>
            )}
          </div>

          <div style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Observations batch B</h3>
            {comparison.batch_b.observations?.length > 0 ? (
              <ul style={{ marginBottom: 0 }}>
                {comparison.batch_b.observations.map((item, index) => (
                  <li key={index} style={{ marginBottom: 8 }}>
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p>Aucune observation</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default BatchComparisonPage;