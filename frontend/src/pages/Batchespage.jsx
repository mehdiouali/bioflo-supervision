import { useEffect, useState } from "react";

function BatchesPage({ user, theme }) {
  const [batches, setBatches] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [selectedRecipeSteps, setSelectedRecipeSteps] = useState([]);
  const [batchNotes, setBatchNotes] = useState([]);
  const [annotations, setAnnotations] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [health, setHealth] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [newBatch, setNewBatch] = useState({
    name: "",
    recipe_id: "",
    target_duration_min: 0,
    objective: "",
    notes: "",
  });

  const [newNote, setNewNote] = useState({
    note_type: "operator_note",
    note_text: "",
  });

  const canOperate = ["operator", "supervisor", "admin"].includes(user?.role);

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
    cursor: canOperate ? "pointer" : "not-allowed",
    fontWeight: "bold",
    color: "#fff",
    background: canOperate
      ? `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryAlt} 100%)`
      : "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)",
    opacity: canOperate ? 1 : 0.8,
  };

  const successButtonStyle = {
    ...buttonStyle,
    background: `linear-gradient(135deg, ${theme.success} 0%, #15803d 100%)`,
  };

  const dangerButtonStyle = {
    ...buttonStyle,
    background: `linear-gradient(135deg, ${theme.danger} 0%, #b91c1c 100%)`,
  };

  const analysisButtonStyle = {
    ...buttonStyle,
    background: `linear-gradient(135deg, ${theme.info || theme.primaryAlt} 0%, ${theme.primary} 100%)`,
  };

  const metricCardStyle = {
    background: theme.panel,
    border: `1px solid ${theme.border}`,
    borderRadius: "16px",
    padding: "14px",
  };

  const sectionTitleStyle = {
    marginTop: 0,
    marginBottom: 16,
    color: theme.text,
    fontSize: 20,
    fontWeight: 800,
  };

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "12px",
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

  const loadRecipes = () => {
    fetch("http://127.0.0.1:8000/recipes")
      .then((r) => r.json())
      .then((data) => setRecipes(data.rows || []))
      .catch(() => setError("Impossible de charger les recettes"));
  };

  const loadBatchAnalysis = (batchId) => {
    fetch(`http://127.0.0.1:8000/batches/${batchId}/analysis`)
      .then((r) => r.json())
      .then((data) => {
        if (data.status === "success") {
          setAnalysis(data);
          setError("");
        } else {
          setAnalysis(null);
          setError(data.details || "Analyse non disponible");
        }
      })
      .catch(() => {
        setAnalysis(null);
        setError("Impossible de charger l’analyse du batch");
      });
  };

  const loadBatchHealth = (batchId) => {
    fetch(`http://127.0.0.1:8000/batches/${batchId}/health`)
      .then((r) => r.json())
      .then((data) => {
        if (data.status === "success") {
          setHealth(data.health);
          setError("");
        } else {
          setHealth(null);
        }
      })
      .catch(() => setHealth(null));
  };

  const loadBatchDetails = (batchId) => {
    fetch(`http://127.0.0.1:8000/batches/${batchId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.status === "success") {
          setSelectedBatch(data.batch);
          setSelectedRecipe(data.recipe);
          setSelectedRecipeSteps(data.recipe_steps || []);
          setBatchNotes(data.notes || []);
          setAnnotations(data.annotations || []);
          setAnalysis(null);
          setHealth(null);
          setError("");
        } else {
          setError(data.details || "Erreur lors du chargement du batch");
        }
      })
      .catch(() => setError("Impossible de charger le détail du batch"));
  };

  useEffect(() => {
    loadBatches();
    loadRecipes();
  }, []);

  const handleCreateBatch = async () => {
    if (!canOperate) return;

    if (!newBatch.name.trim() || !newBatch.recipe_id) {
      setError("Le nom du batch et la recette sont obligatoires");
      return;
    }

    const response = await fetch("http://127.0.0.1:8000/batches", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...newBatch,
        recipe_id: Number(newBatch.recipe_id),
        operator_username: user.username,
        target_duration_min: Number(newBatch.target_duration_min),
      }),
    });

    const data = await response.json();

    if (data.status === "success") {
      setMessage("Batch créé avec succès");
      setError("");
      setNewBatch({
        name: "",
        recipe_id: "",
        target_duration_min: 0,
        objective: "",
        notes: "",
      });
      loadBatches();
    } else {
      setError(data.details || "Erreur lors de la création du batch");
    }
  };

  const updateBatchStatus = async (batchId, action) => {
    if (!canOperate) return;

    const response = await fetch(
      `http://127.0.0.1:8000/batches/${batchId}/${action}?actor=${encodeURIComponent(
        user.username
      )}`,
      { method: "PUT" }
    );

    const data = await response.json();

    if (data.status === "success") {
      setMessage(`Batch ${action} ok`);
      setError("");
      loadBatches();
      loadBatchDetails(batchId);
    } else {
      setError(data.details || `Erreur lors de ${action}`);
    }
  };

  const handleAddNote = async () => {
    if (!canOperate || !selectedBatch || !newNote.note_text.trim()) return;

    const response = await fetch("http://127.0.0.1:8000/batch-notes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        batch_id: selectedBatch.id,
        note_type: newNote.note_type,
        note_text: newNote.note_text,
        author: user.username,
      }),
    });

    const data = await response.json();

    if (data.status === "success") {
      setMessage("Note ajoutée");
      setError("");
      setNewNote({ note_type: "operator_note", note_text: "" });
      loadBatchDetails(selectedBatch.id);
    } else {
      setError(data.details || "Erreur lors de l’ajout de la note");
    }
  };

  const badgeStyle = (status) => {
    let bg = theme.primary;
    if (status === "planned") bg = theme.warning;
    if (status === "running") bg = theme.success;
    if (status === "completed") bg = theme.info || theme.primaryAlt;
    if (status === "aborted") bg = theme.danger;

    return {
      display: "inline-block",
      padding: "6px 12px",
      borderRadius: "999px",
      fontSize: "12px",
      fontWeight: "bold",
      color: "#fff",
      backgroundColor: bg,
    };
  };

  const renderTagAnalysis = (label, key, unit = "") => {
    if (!analysis?.tags?.[key]) return null;

    const stats = analysis.tags[key].stats;
    const range = analysis.tags[key].out_of_range;
    const comparison = analysis.recipe_comparison?.[key];

    return (
      <div style={metricCardStyle}>
        <h4 style={{ marginTop: 0 }}>{label}</h4>
        <p><strong>Moyenne :</strong> {stats.avg ?? "-"} {unit}</p>
        <p><strong>Min :</strong> {stats.min ?? "-"} {unit}</p>
        <p><strong>Max :</strong> {stats.max ?? "-"} {unit}</p>
        <p><strong>Delta :</strong> {stats.delta ?? "-"} {unit}</p>
        <p><strong>Échantillons :</strong> {stats.count ?? 0}</p>
        <p><strong>Hors plage :</strong> {range.percent ?? 0}%</p>
        <p><strong>Cible recette :</strong> {comparison?.target_avg ?? "-"} {unit}</p>
        <p><strong>Écart :</strong> {comparison?.deviation ?? "-"} {unit}</p>
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
        Batch / Expérience
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
        <h3 style={sectionTitleStyle}>Créer un batch</h3>

        <div style={gridStyle}>
          <div>
            <label>Nom du batch</label>
            <input
              style={inputStyle}
              value={newBatch.name}
              onChange={(e) =>
                setNewBatch({ ...newBatch, name: e.target.value })
              }
            />
          </div>

          <div>
            <label>Recette</label>
            <select
              style={inputStyle}
              value={newBatch.recipe_id}
              onChange={(e) =>
                setNewBatch({ ...newBatch, recipe_id: e.target.value })
              }
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
              style={inputStyle}
              type="number"
              value={newBatch.target_duration_min}
              onChange={(e) =>
                setNewBatch({
                  ...newBatch,
                  target_duration_min: e.target.value,
                })
              }
            />
          </div>
        </div>

        <div style={{ marginTop: "12px" }}>
          <label>Objectif</label>
          <textarea
            style={{ ...inputStyle, minHeight: "80px" }}
            value={newBatch.objective}
            onChange={(e) =>
              setNewBatch({ ...newBatch, objective: e.target.value })
            }
          />
        </div>

        <div style={{ marginTop: "12px" }}>
          <label>Notes initiales</label>
          <textarea
            style={{ ...inputStyle, minHeight: "80px" }}
            value={newBatch.notes}
            onChange={(e) =>
              setNewBatch({ ...newBatch, notes: e.target.value })
            }
          />
        </div>

        <button
          style={{ ...buttonStyle, marginTop: "14px" }}
          onClick={handleCreateBatch}
        >
          Créer le batch
        </button>
      </div>

      <div style={cardStyle}>
        <h3 style={sectionTitleStyle}>Liste des batchs</h3>
        {batches.length > 0 ? (
          batches.map((batch) => (
            <div
              key={batch.id}
              style={{
                borderBottom: `1px solid ${theme.border}`,
                padding: "12px 0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <div>
                <div style={{ fontWeight: 800 }}>{batch.name}</div>
                <div style={{ color: theme.textSoft, fontSize: "14px" }}>
                  Recette : {batch.recipe_name || "-"} | Statut :{" "}
                  <span style={badgeStyle(batch.status)}>{batch.status}</span>
                </div>
              </div>

              <button
                style={buttonStyle}
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
        <div style={cardStyle}>
          <h3 style={sectionTitleStyle}>Détail batch : {selectedBatch.name}</h3>

          <p>
            <strong>Statut :</strong>{" "}
            <span style={badgeStyle(selectedBatch.status)}>
              {selectedBatch.status}
            </span>
          </p>
          <p><strong>Recette :</strong> {selectedBatch.recipe_name || "-"}</p>
          <p><strong>Opérateur :</strong> {selectedBatch.operator_username || "-"}</p>
          <p><strong>Durée cible :</strong> {selectedBatch.target_duration_min} min</p>
          <p><strong>Début :</strong> {selectedBatch.start_time || "-"}</p>
          <p><strong>Fin :</strong> {selectedBatch.end_time || "-"}</p>
          <p><strong>Objectif :</strong> {selectedBatch.objective || "-"}</p>
          <p><strong>Notes :</strong> {selectedBatch.notes || "-"}</p>

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              marginTop: "14px",
              marginBottom: "18px",
            }}
          >
            {selectedBatch.status === "planned" && (
              <button
                style={successButtonStyle}
                onClick={() => updateBatchStatus(selectedBatch.id, "start")}
              >
                Démarrer
              </button>
            )}

            {selectedBatch.status === "running" && (
              <>
                <button
                  style={successButtonStyle}
                  onClick={() => updateBatchStatus(selectedBatch.id, "stop")}
                >
                  Terminer
                </button>

                <button
                  style={dangerButtonStyle}
                  onClick={() => updateBatchStatus(selectedBatch.id, "abort")}
                >
                  Abandonner
                </button>
              </>
            )}

            <button
              style={analysisButtonStyle}
              onClick={() => loadBatchAnalysis(selectedBatch.id)}
            >
              Analyser le batch
            </button>

            <button
              style={analysisButtonStyle}
              onClick={() => loadBatchHealth(selectedBatch.id)}
            >
              Calculer santé
            </button>
          </div>

          {selectedRecipe && (
            <>
              <h4 style={{ marginTop: "20px" }}>Recette associée</h4>
              <p><strong>Nom :</strong> {selectedRecipe.name}</p>
              <p><strong>Description :</strong> {selectedRecipe.description || "-"}</p>
              <p><strong>Objectif :</strong> {selectedRecipe.objective || "-"}</p>

              <h4 style={{ marginTop: "20px" }}>Étapes de la recette</h4>
              {selectedRecipeSteps.length > 0 ? (
                selectedRecipeSteps.map((step) => (
                  <div
                    key={step.id}
                    style={{
                      border: `1px solid ${theme.border}`,
                      borderRadius: "14px",
                      padding: "14px",
                      marginBottom: "12px",
                      background: theme.panel,
                    }}
                  >
                    <p><strong>Ordre :</strong> {step.step_order}</p>
                    <p><strong>Nom :</strong> {step.step_name}</p>
                    <p><strong>Durée :</strong> {step.duration_min} min</p>
                    <p><strong>Temp :</strong> {step.temp_setpoint || "-"}</p>
                    <p><strong>pH :</strong> {step.ph_setpoint || "-"}</p>
                    <p><strong>DO :</strong> {step.do_setpoint || "-"}</p>
                    <p><strong>RPM :</strong> {step.rpm_setpoint || "-"}</p>
                    <p><strong>Notes :</strong> {step.notes || "-"}</p>
                  </div>
                ))
              ) : (
                <p>Aucune étape définie</p>
              )}
            </>
          )}

          {health && (
            <>
              <h4 style={{ marginTop: "24px" }}>Santé du procédé</h4>
              <div style={gridStyle}>
                <div style={metricCardStyle}>
                  <p><strong>Health score :</strong> {health.health_score}</p>
                </div>
                <div style={metricCardStyle}>
                  <p><strong>Stability score :</strong> {health.stability_score}</p>
                </div>
                <div style={metricCardStyle}>
                  <p><strong>Alarm score :</strong> {health.alarm_score}</p>
                </div>
                <div style={metricCardStyle}>
                  <p><strong>Recipe adherence :</strong> {health.recipe_adherence_score}</p>
                </div>
              </div>
              <div style={{ ...metricCardStyle, marginTop: 12 }}>
                <p><strong>Summary :</strong> {health.summary}</p>
              </div>
            </>
          )}

          {analysis && (
            <>
              <h4 style={{ marginTop: "24px" }}>Analyse automatique</h4>

              <div style={gridStyle}>
                <div style={metricCardStyle}>
                  <h4 style={{ marginTop: 0 }}>Durée réelle</h4>
                  <p>{analysis.time_window?.actual_duration_min ?? "-"} min</p>
                </div>

                <div style={metricCardStyle}>
                  <h4 style={{ marginTop: 0 }}>Alarmes</h4>
                  <p>{analysis.alarm_summary?.total_alarm_events ?? 0} événements</p>
                </div>
              </div>

              <div style={{ ...gridStyle, marginTop: "14px" }}>
                {renderTagAnalysis("Température", "temp_reactor", "°C")}
                {renderTagAnalysis("pH", "ph_value")}
                {renderTagAnalysis("DO", "do_percent", "%")}
                {renderTagAnalysis("Agitation", "stirrer_rpm", "rpm")}
              </div>

              <div style={{ ...metricCardStyle, marginTop: "14px" }}>
                <h4 style={{ marginTop: 0 }}>Résumé des alarmes</h4>
                {analysis.alarm_summary?.alarms_by_code &&
                Object.keys(analysis.alarm_summary.alarms_by_code).length > 0 ? (
                  Object.entries(analysis.alarm_summary.alarms_by_code).map(
                    ([code, count]) => (
                      <p key={code}>
                        <strong>{code}</strong> : {count}
                      </p>
                    )
                  )
                ) : (
                  <p>Aucune alarme enregistrée pendant le batch</p>
                )}
              </div>

              <div style={{ ...metricCardStyle, marginTop: "14px" }}>
                <h4 style={{ marginTop: 0 }}>Observations pédagogiques</h4>
                {analysis.observations?.length > 0 ? (
                  <ul style={{ marginBottom: 0 }}>
                    {analysis.observations.map((obs, index) => (
                      <li key={index} style={{ marginBottom: "8px" }}>
                        {obs}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Aucune observation disponible</p>
                )}
              </div>
            </>
          )}

          <h4 style={{ marginTop: "20px" }}>Annotations pédagogiques</h4>
          {annotations.length > 0 ? (
            annotations.map((item) => (
              <div
                key={item.id}
                style={{
                  borderBottom: `1px solid ${theme.border}`,
                  padding: "10px 0",
                }}
              >
                <p><strong>Titre :</strong> {item.title}</p>
                <p><strong>Type :</strong> {item.annotation_type}</p>
                <p><strong>Description :</strong> {item.description || "-"}</p>
                <p><strong>Heure :</strong> {item.event_time || "-"}</p>
                <p><strong>Auteur :</strong> {item.author || "-"}</p>
              </div>
            ))
          ) : (
            <p>Aucune annotation</p>
          )}

          <h4 style={{ marginTop: "20px" }}>Notes d’expérience</h4>
          {batchNotes.length > 0 ? (
            batchNotes.map((note) => (
              <div
                key={note.id}
                style={{
                  borderBottom: `1px solid ${theme.border}`,
                  padding: "10px 0",
                }}
              >
                <p><strong>Type :</strong> {note.note_type}</p>
                <p><strong>Texte :</strong> {note.note_text}</p>
                <p><strong>Auteur :</strong> {note.author}</p>
                <p><strong>Date :</strong> {new Date(note.created_at).toLocaleString()}</p>
              </div>
            ))
          ) : (
            <p>Aucune note</p>
          )}

          <div style={{ marginTop: "14px" }}>
            <label>Ajouter une note</label>
            <textarea
              style={{ ...inputStyle, minHeight: "90px" }}
              value={newNote.note_text}
              onChange={(e) =>
                setNewNote({ ...newNote, note_text: e.target.value })
              }
            />
            <button
              style={{ ...buttonStyle, marginTop: "12px" }}
              onClick={handleAddNote}
            >
              Ajouter note
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BatchesPage;