import { useEffect, useState } from "react";

function RecipesPage({ user, theme }) {
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [selectedSteps, setSelectedSteps] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [newRecipe, setNewRecipe] = useState({
    name: "",
    description: "",
    objective: "",
  });

  const [newStep, setNewStep] = useState({
    step_order: 1,
    step_name: "",
    duration_min: 0,
    temp_setpoint: "",
    ph_setpoint: "",
    do_setpoint: "",
    rpm_setpoint: "",
    notes: "",
  });

  const canEdit = ["supervisor", "admin"].includes(user?.role);

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
  };

  const buttonStyle = {
    padding: "10px 14px",
    borderRadius: "12px",
    border: "none",
    cursor: canEdit ? "pointer" : "not-allowed",
    fontWeight: "bold",
    color: "#fff",
    background: canEdit
      ? `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryAlt} 100%)`
      : "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)",
    opacity: canEdit ? 1 : 0.8,
  };

  const dangerButtonStyle = {
    ...buttonStyle,
    background: `linear-gradient(135deg, ${theme.danger} 0%, #b91c1c 100%)`,
  };

  const loadRecipes = () => {
    fetch("http://127.0.0.1:8000/recipes")
      .then((r) => r.json())
      .then((data) => {
        setRecipes(data.rows || []);
        setError("");
      })
      .catch(() => setError("Impossible de charger les recettes"));
  };

  const loadRecipeDetails = (recipeId) => {
    fetch(`http://127.0.0.1:8000/recipes/${recipeId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.status === "success") {
          setSelectedRecipe(data.recipe);
          setSelectedSteps(data.steps || []);
          setError("");
        } else {
          setError(data.details || "Erreur lors du chargement de la recette");
        }
      })
      .catch(() => setError("Impossible de charger le détail de la recette"));
  };

  useEffect(() => {
    loadRecipes();
  }, []);

  const handleCreateRecipe = async () => {
    if (!canEdit) return;

    const response = await fetch("http://127.0.0.1:8000/recipes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...newRecipe,
        created_by: user.username,
      }),
    });

    const data = await response.json();

    if (data.status === "success") {
      setMessage("Recette créée avec succès");
      setNewRecipe({ name: "", description: "", objective: "" });
      loadRecipes();
    } else {
      setError(data.details || "Erreur lors de la création de la recette");
    }
  };

  const handleDeleteRecipe = async (recipeId) => {
    if (!canEdit) return;

    const response = await fetch(
      `http://127.0.0.1:8000/recipes/${recipeId}?actor=${encodeURIComponent(user.username)}`,
      { method: "DELETE" }
    );
    const data = await response.json();

    if (data.status === "success") {
      setMessage("Recette supprimée");
      if (selectedRecipe?.id === recipeId) {
        setSelectedRecipe(null);
        setSelectedSteps([]);
      }
      loadRecipes();
    } else {
      setError(data.details || "Erreur lors de la suppression");
    }
  };

  const handleAddStep = async () => {
    if (!canEdit || !selectedRecipe) return;

    const response = await fetch("http://127.0.0.1:8000/recipe-steps", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipe_id: selectedRecipe.id,
        ...newStep,
        actor: user.username,
      }),
    });

    const data = await response.json();

    if (data.status === "success") {
      setMessage("Étape ajoutée");
      setNewStep({
        step_order: selectedSteps.length + 2,
        step_name: "",
        duration_min: 0,
        temp_setpoint: "",
        ph_setpoint: "",
        do_setpoint: "",
        rpm_setpoint: "",
        notes: "",
      });
      loadRecipeDetails(selectedRecipe.id);
    } else {
      setError(data.details || "Erreur lors de l’ajout de l’étape");
    }
  };

  const handleDeleteStep = async (stepId) => {
    if (!canEdit) return;

    const response = await fetch(
      `http://127.0.0.1:8000/recipe-steps/${stepId}?actor=${encodeURIComponent(user.username)}`,
      { method: "DELETE" }
    );
    const data = await response.json();

    if (data.status === "success") {
      setMessage("Étape supprimée");
      loadRecipeDetails(selectedRecipe.id);
    } else {
      setError(data.details || "Erreur lors de la suppression de l’étape");
    }
  };

  return (
    <div>
      <h2 style={{ color: theme.text, marginBottom: "20px", fontSize: "24px", fontWeight: 800 }}>
        Recettes
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
        <h3>Liste des recettes</h3>
        {recipes.length > 0 ? (
          recipes.map((recipe) => (
            <div
              key={recipe.id}
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
                <div style={{ fontWeight: 800 }}>{recipe.name}</div>
                <div style={{ color: theme.textSoft, fontSize: "14px" }}>
                  {recipe.objective || "No objective"}
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button style={buttonStyle} onClick={() => loadRecipeDetails(recipe.id)}>
                  Voir
                </button>
                {canEdit && (
                  <button
                    style={dangerButtonStyle}
                    onClick={() => handleDeleteRecipe(recipe.id)}
                  >
                    Supprimer
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <p>Aucune recette disponible</p>
        )}
      </div>

      {canEdit && (
        <div style={cardStyle}>
          <h3>Créer une recette</h3>

          <div style={{ marginBottom: "12px" }}>
            <label>Nom</label>
            <input
              style={inputStyle}
              value={newRecipe.name}
              onChange={(e) => setNewRecipe({ ...newRecipe, name: e.target.value })}
            />
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label>Description</label>
            <textarea
              style={{ ...inputStyle, minHeight: "90px" }}
              value={newRecipe.description}
              onChange={(e) =>
                setNewRecipe({ ...newRecipe, description: e.target.value })
              }
            />
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label>Objectif</label>
            <textarea
              style={{ ...inputStyle, minHeight: "90px" }}
              value={newRecipe.objective}
              onChange={(e) =>
                setNewRecipe({ ...newRecipe, objective: e.target.value })
              }
            />
          </div>

          <button style={buttonStyle} onClick={handleCreateRecipe}>
            Créer la recette
          </button>
        </div>
      )}

      {selectedRecipe && (
        <div style={cardStyle}>
          <h3>Détail recette : {selectedRecipe.name}</h3>
          <p><strong>Description :</strong> {selectedRecipe.description || "-"}</p>
          <p><strong>Objectif :</strong> {selectedRecipe.objective || "-"}</p>
          <p><strong>Créée par :</strong> {selectedRecipe.created_by || "-"}</p>

          <h4 style={{ marginTop: "20px" }}>Étapes</h4>
          {selectedSteps.length > 0 ? (
            selectedSteps.map((step) => (
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
                <p><strong>Temp setpoint :</strong> {step.temp_setpoint || "-"}</p>
                <p><strong>pH setpoint :</strong> {step.ph_setpoint || "-"}</p>
                <p><strong>DO setpoint :</strong> {step.do_setpoint || "-"}</p>
                <p><strong>RPM setpoint :</strong> {step.rpm_setpoint || "-"}</p>
                <p><strong>Notes :</strong> {step.notes || "-"}</p>

                {canEdit && (
                  <button
                    style={dangerButtonStyle}
                    onClick={() => handleDeleteStep(step.id)}
                  >
                    Supprimer étape
                  </button>
                )}
              </div>
            ))
          ) : (
            <p>Aucune étape définie</p>
          )}

          {canEdit && (
            <>
              <h4 style={{ marginTop: "20px" }}>Ajouter une étape</h4>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
                <div>
                  <label>Ordre</label>
                  <input
                    style={inputStyle}
                    value={newStep.step_order}
                    onChange={(e) => setNewStep({ ...newStep, step_order: Number(e.target.value) })}
                  />
                </div>

                <div>
                  <label>Nom</label>
                  <input
                    style={inputStyle}
                    value={newStep.step_name}
                    onChange={(e) => setNewStep({ ...newStep, step_name: e.target.value })}
                  />
                </div>

                <div>
                  <label>Durée (min)</label>
                  <input
                    style={inputStyle}
                    value={newStep.duration_min}
                    onChange={(e) => setNewStep({ ...newStep, duration_min: Number(e.target.value) })}
                  />
                </div>

                <div>
                  <label>Temp</label>
                  <input
                    style={inputStyle}
                    value={newStep.temp_setpoint}
                    onChange={(e) => setNewStep({ ...newStep, temp_setpoint: e.target.value })}
                  />
                </div>

                <div>
                  <label>pH</label>
                  <input
                    style={inputStyle}
                    value={newStep.ph_setpoint}
                    onChange={(e) => setNewStep({ ...newStep, ph_setpoint: e.target.value })}
                  />
                </div>

                <div>
                  <label>DO</label>
                  <input
                    style={inputStyle}
                    value={newStep.do_setpoint}
                    onChange={(e) => setNewStep({ ...newStep, do_setpoint: e.target.value })}
                  />
                </div>

                <div>
                  <label>RPM</label>
                  <input
                    style={inputStyle}
                    value={newStep.rpm_setpoint}
                    onChange={(e) => setNewStep({ ...newStep, rpm_setpoint: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ marginTop: "12px" }}>
                <label>Notes</label>
                <textarea
                  style={{ ...inputStyle, minHeight: "90px" }}
                  value={newStep.notes}
                  onChange={(e) => setNewStep({ ...newStep, notes: e.target.value })}
                />
              </div>

              <button style={{ ...buttonStyle, marginTop: "14px" }} onClick={handleAddStep}>
                Ajouter étape
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default RecipesPage;