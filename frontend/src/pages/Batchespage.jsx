import { useEffect, useState } from "react";
import { API_BASE_URL } from "../config";

function BatchesPage({ user, theme }) {
  const [batches, setBatches] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [health, setHealth] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    recipe_id: "",
    target_duration_min: 60,
    objective: "",
    notes: "",
  });

  const canOperate =
    user?.role === "admin" ||
    user?.role === "supervisor" ||
    user?.role === "operator";

  const canCreateBatch = canOperate;
  const canStartBatch = canOperate;
  const canStopBatch = canOperate;
  const canAbortBatch = canOperate;
  const canAnalyzeBatch = canOperate;

  const cardStyle = {
    background: theme.panelAlt,
    borderRadius: "22px",
    padding: "20px",
    border: `1px solid ${theme.border}`,
    boxShadow: "0 10px 22px rgba(15,23,42,0.05)",
    color: theme.text,
    marginBottom: "20px",
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "12px",
    border: `1px solid ${theme.border}`,
    backgroundColor: theme.inputBg,
    color: theme.text,
    marginTop: 6,
    boxSizing: "border-box",
  };

  const primaryButton = {
    padding: "10px 14px",
    borderRadius: "12px",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
    color: "#fff",
    background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryAlt} 100%)`,
  };

  const successButton = {
    padding: "10px 14px",
    borderRadius: "12px",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
    color: "#fff",
    background: `linear-gradient(135deg, ${theme.success} 0%, #22c55e 100%)`,
  };

  const dangerButton = {
    padding: "10px 14px",
    borderRadius: "12px",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
    color: "#fff",
    background: `linear-gradient(135deg, ${theme.danger} 0%, #ef4444 100%)`,
  };

  const secondaryButton = {
    padding: "10px 14px",
    borderRadius: "12px",
    border: `1px solid ${theme.border}`,
    cursor: "pointer",
    fontWeight: "bold",
    color: theme.text,
    background: theme.panel,
  };

  const disabledStyle = {
    opacity: 0.5,
    cursor: "not-allowed",
  };

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "12px",
  };

  const loadBatches = () => {
    fetch(`${API_BASE_URL}/batches`)
      .then((r) => r.json())
      .then((data) => {
        setBatches(data.rows || []);
        setError("");
      })
      .catch(() => setError("Impossible de charger les batchs"));
  };

  const loadRecipes = () => {
    fetch(`${API_BASE_URL}/recipes`)
      .then((r) => r.json())
      .then((data) => {
        setRecipes(data.rows || []);
      })
      .catch(() => {});
  };

  const loadBatchDetails = async (batchId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/batches/${batchId}`);
      const data = await response.json();
      setSelectedBatch(data.batch || null);
      setAnalysis(null);
      setHealth(null);
      setError("");
    } catch {
      setError("Impossible de charger le détail du batch");
    }
  };

  useEffect(() => {
    loadBatches();
    loadRecipes();
  }, []);

  const createBatch = async () => {
    if (!canCreateBatch) {
      setError("Ton rôle ne permet pas de créer un batch");
      return;
    }

    if (!form.name.trim() || !form.recipe_id) {
      setError("Nom du batch et recette obligatoires");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/batches`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          recipe_id: Number(form.recipe_id),
          operator_username: user?.username || "operator",
          target_duration_min: Number(form.target_duration_min),
          objective: form.objective,
          notes: form.notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Erreur création batch");
        return;
      }

      setMessage("Batch créé avec succès");
      setError("");
      setForm({
        name: "",
        recipe_id: "",
        target_duration_min: 60,
        objective: "",
        notes: "",
      });

      loadBatches();

      if (data.batch_id) {
        loadBatchDetails(data.batch_id);
      }
    } catch {
      setError("Impossible de créer le batch");
    }
  };

  const startBatch = async () => {
    if (!selectedBatch || !canStartBatch) return;

    try {
      await fetch(
        `${API_BASE_URL}/batches/${selectedBatch.id}/start?actor=${user?.username || "operator"}`,
        { method: "PUT" }
      );
      setMessage("Batch démarré");
      setError("");
      loadBatches();
      loadBatchDetails(selectedBatch.id);
    } catch {
      setError("Impossible de démarrer le batch");
    }
  };

  const stopBatch = async () => {
    if (!selectedBatch || !canStopBatch) return;

    try {
      await fetch(
        `${API_BASE_URL}/batches/${selectedBatch.id}/stop?actor=${user?.username || "operator"}`,
        { method: "PUT" }
      );
      setMessage("Batch terminé");
      setError("");
      loadBatches();
      loadBatchDetails(selectedBatch.id);
    } catch {
      setError("Impossible de terminer le batch");
    }
  };

  const abortBatch = async () => {
    if (!selectedBatch || !canAbortBatch) return;

    try {
      await fetch(
        `${API_BASE_URL}/batches/${selectedBatch.id}/abort?actor=${user?.username || "operator"}`,
        { method: "PUT" }
      );
      setMessage("Batch abandonné");
      setError("");
      loadBatches();
      loadBatchDetails(selectedBatch.id);
    } catch {
      setError("Impossible d'abandonner le batch");
    }
  };

  const analyzeBatch = async () => {
    if (!selectedBatch || !canAnalyzeBatch) return;

    try {
      const analysisResponse = await fetch(`${API_BASE_URL}/batches/${selectedBatch.id}/analysis`);
      const analysisData = await analysisResponse.json();

      const healthResponse = await fetch(`${API_BASE_URL}/batches/${selectedBatch.id}/health`);
      const healthData = await healthResponse.json();

      setAnalysis(analysisData);
      setHealth(healthData.health || null);
      setMessage("Analyse calculée");
      setError("");
    } catch {
      setError("Impossible de calculer l’analyse");
    }
  };

  return (
    <div>
      <h2 style={{ color: theme.text, marginBottom: 20, fontSize: 24, fontWeight: 800 }}>
        Batchs
      </h2>

      <div
        style={{
          ...cardStyle,
          marginBottom: 16,
          background: theme.panel,
        }}
      >
        <strong>Utilisateur connecté :</strong> {user?.username || "-"} | <strong>Rôle :</strong>{" "}
        {user?.role || "-"}
      </div>

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
        <h3 style={{ marginTop: 0 }}>Créer un batch</h3>

        <div style={gridStyle}>
          <div>
            <label>Nom</label>
            <input
              style={inputStyle}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <label>Recette</label>
            <select
              style={inputStyle}
              value={form.recipe_id}
              onChange={(e) => setForm({ ...form, recipe_id: e.target.value })}
            >
              <option value="">Choisir une recette</option>
              {recipes.map((recipe) => (
                <option key={recipe.id} value={recipe.id}>
                  {recipe.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Durée cible (min)</label>
            <input
              type="number"
              style={inputStyle}
              value={form.target_duration_min}
              onChange={(e) => setForm({ ...form, target_duration_min: e.target.value })}
            />
          </div>

          <div>
            <label>Objectif</label>
            <input
              style={inputStyle}
              value={form.objective}
              onChange={(e) => setForm({ ...form, objective: e.target.value })}
            />
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <label>Notes</label>
          <textarea
            style={{ ...inputStyle, minHeight: 90 }}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>

        <button
          onClick={createBatch}
          disabled={!canCreateBatch}
          style={{
            ...primaryButton,
            marginTop: 14,
            ...(canCreateBatch ? {} : disabledStyle),
          }}
          title={canCreateBatch ? "Créer un batch" : "Rôle insuffisant"}
        >
          Créer le batch
        </button>
      </div>

      <div style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>Liste des batchs</h3>

        {batches.length > 0 ? (
          batches.map((batch) => (
            <div
              key={batch.id}
              style={{
                borderBottom: `1px solid ${theme.border}`,
                padding: "12px 0",
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <div>
                <div style={{ fontWeight: 800 }}>{batch.name}</div>
                <div style={{ color: theme.textSoft }}>
                  Recette : {batch.recipe_name || "-"} | Statut : {batch.status}
                </div>
              </div>

              <button
                style={secondaryButton}
                onClick={() => loadBatchDetails(batch.id)}
              >
                Voir
              </button>
            </div>
          ))
        ) : (
          <p>Aucun batch disponible</p>
        )}
      </div>

      {selectedBatch && (
        <>
          <div style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Détail batch : {selectedBatch.name}</h3>
            <p><strong>Statut :</strong> {selectedBatch.status}</p>
            <p><strong>Recette :</strong> {selectedBatch.recipe_name || "-"}</p>
            <p><strong>Opérateur :</strong> {selectedBatch.operator_username || "-"}</p>
            <p><strong>Durée cible :</strong> {selectedBatch.target_duration_min} min</p>
            <p><strong>Début :</strong> {selectedBatch.start_time || "-"}</p>
            <p><strong>Fin :</strong> {selectedBatch.end_time || "-"}</p>
            <p><strong>Objectif :</strong> {selectedBatch.objective || "-"}</p>
            <p><strong>Notes :</strong> {selectedBatch.notes || "-"}</p>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
              <button
                onClick={startBatch}
                disabled={!canStartBatch || selectedBatch.status !== "planned"}
                style={{
                  ...successButton,
                  ...((!canStartBatch || selectedBatch.status !== "planned") ? disabledStyle : {}),
                }}
                title={!canStartBatch ? "Rôle insuffisant" : "Démarrer le batch"}
              >
                Démarrer
              </button>

              <button
                onClick={stopBatch}
                disabled={!canStopBatch || selectedBatch.status !== "running"}
                style={{
                  ...primaryButton,
                  ...((!canStopBatch || selectedBatch.status !== "running") ? disabledStyle : {}),
                }}
                title={!canStopBatch ? "Rôle insuffisant" : "Terminer le batch"}
              >
                Terminer
              </button>

              <button
                onClick={abortBatch}
                disabled={!canAbortBatch || selectedBatch.status !== "running"}
                style={{
                  ...dangerButton,
                  ...((!canAbortBatch || selectedBatch.status !== "running") ? disabledStyle : {}),
                }}
                title={!canAbortBatch ? "Rôle insuffisant" : "Abandonner le batch"}
              >
                Abandonner
              </button>

              <button
                onClick={analyzeBatch}
                disabled={!canAnalyzeBatch}
                style={{
                  ...secondaryButton,
                  ...(canAnalyzeBatch ? {} : disabledStyle),
                }}
                title={canAnalyzeBatch ? "Calculer l’analyse" : "Rôle insuffisant"}
              >
                Analyser
              </button>
            </div>
          </div>

          {(analysis || health) && (
            <div style={cardStyle}>
              <h3 style={{ marginTop: 0 }}>Analyse du batch</h3>

              {analysis && (
                <>
                  <p><strong>Observations :</strong></p>
                  <ul>
                    {(analysis.observations || []).map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>

                  <p>
                    <strong>Alarmes :</strong>{" "}
                    {analysis.alarm_summary?.total_alarm_events ?? 0}
                  </p>
                </>
              )}

              {health && (
                <>
                  <p><strong>Health score :</strong> {health.health_score}</p>
                  <p><strong>Stability score :</strong> {health.stability_score}</p>
                  <p><strong>Alarm score :</strong> {health.alarm_score}</p>
                  <p><strong>Recipe adherence :</strong> {health.recipe_adherence_score}</p>
                  <p><strong>Résumé :</strong> {health.summary}</p>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default BatchesPage;