import { useEffect, useState } from "react";
import { API_BASE_URL } from "../config";

function RecipesPage({ user, theme }) {
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [recipeSteps, setRecipeSteps] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [recipeForm, setRecipeForm] = useState({
    name: "",
    description: "",
    objective: "",
  });

  const [stepForm, setStepForm] = useState({
    step_order: 1,
    step_name: "",
    duration_min: 10,
    temp_setpoint: "",
    ph_setpoint: "",
    do_setpoint: "",
    rpm_setpoint: "",
    notes: "",
  });

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

  const buttonStyle = {
    padding: "10px 14px",
    borderRadius: "12px",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
    color: "#fff",
    background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryAlt} 100%)`,
  };

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "12px",
  };

  const loadRecipes = () => {
    fetch(`${API_BASE_URL}/recipes`)
      .then((r) => r.json())
      .then((data) => {
        setRecipes(data.rows || []);
        setError("");
      })
      .catch(() => setError("Impossible de charger les recettes"));
  };

  const loadRecipeDetails = (recipeId) => {
    fetch(`${API_BASE_URL}/recipes/${recipeId}`)
      .then((r) => r.json())
      .then((data) => {
        setSelectedRecipe(data.recipe || null);
        setRecipeSteps(data.steps || []);
        setError("");
      })
      .catch(() => setError("Impossible de charger le détail de la recette"));
  };

  useEffect(() => {
    loadRecipes();
  }, []);

  const createRecipe = async () => {
    if (!recipeForm.name.trim()) {
      setError("Le nom de la recette est obligatoire");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/recipes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: recipeForm.name,
          description: recipeForm.description,
          objective: recipeForm.objective,
          created_by: user?.username || "admin",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Erreur lors de la création");
        return;
      }

      setMessage("Recette créée avec succès");
      setError("");
      setRecipeForm({
        name: "",
        description: "",
        objective: "",
      });

      loadRecipes();

      if (data.recipe_id) {
        loadRecipeDetails(data.recipe_id);
      }
    } catch (err) {
      setError("Impossible de créer la recette");
    }
  };

  const addStep = async () => {
    if (!selectedRecipe) {
      setError("Sélectionne d'abord une recette");
      return;
    }

    if (!stepForm.step_name.trim()) {
      setError("Le nom de l'étape est obligatoire");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/recipes/${selectedRecipe.id}/steps`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          step_order: Number(stepForm.step_order),
          step_name: stepForm.step_name,
          duration_min: Number(stepForm.duration_min),
          temp_setpoint: stepForm.temp_setpoint === "" ? null : Number(stepForm.temp_setpoint),
          ph_setpoint: stepForm.ph_setpoint === "" ? null : Number(stepForm.ph_setpoint),
          do_setpoint: stepForm.do_setpoint === "" ? null : Number(stepForm.do_setpoint),
          rpm_setpoint: stepForm.rpm_setpoint === "" ? null : Number(stepForm.rpm_setpoint),
          notes: stepForm.notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Erreur lors de l'ajout d'étape");
        return;
      }

      setMessage("Étape ajoutée avec succès");
      setError("");
      setStepForm({
        step_order: stepForm.step_order + 1,
        step_name: "",
        duration_min: 10,
        temp_setpoint: "",
        ph_setpoint: "",
        do_setpoint: "",
        rpm_setpoint: "",
        notes: "",
      });

      loadRecipeDetails(selectedRecipe.id);
    } catch (err) {
      setError("Impossible d'ajouter l'étape");
    }
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
        Recettes
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
        <h3 style={{ marginTop: 0 }}>Créer une recette</h3>

        <div style={gridStyle}>
          <div>
            <label>Nom</label>
            <input
              style={inputStyle}
              value={recipeForm.name}
              onChange={(e) => setRecipeForm({ ...recipeForm, name: e.target.value })}
            />
          </div>

          <div>
            <label>Objectif</label>
            <input
              style={inputStyle}
              value={recipeForm.objective}
              onChange={(e) => setRecipeForm({ ...recipeForm, objective: e.target.value })}
            />
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <label>Description</label>
          <textarea
            style={{ ...inputStyle, minHeight: 90 }}
            value={recipeForm.description}
            onChange={(e) => setRecipeForm({ ...recipeForm, description: e.target.value })}
          />
        </div>

        <button style={{ ...buttonStyle, marginTop: 14 }} onClick={createRecipe}>
          Ajouter recette
        </button>
      </div>

      <div style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>Liste des recettes</h3>

        {recipes.length > 0 ? (
          recipes.map((recipe) => (
            <div
              key={recipe.id}
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
                <div style={{ fontWeight: 800 }}>{recipe.name}</div>
                <div style={{ color: theme.textSoft }}>{recipe.objective || "-"}</div>
              </div>

              <button
                style={buttonStyle}
                onClick={() => loadRecipeDetails(recipe.id)}
              >
                Voir
              </button>
            </div>
          ))
        ) : (
          <p>Aucune recette disponible</p>
        )}
      </div>

      {selectedRecipe && (
        <>
          <div style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Détail recette : {selectedRecipe.name}</h3>
            <p><strong>Description :</strong> {selectedRecipe.description || "-"}</p>
            <p><strong>Objectif :</strong> {selectedRecipe.objective || "-"}</p>
            <p><strong>Créée par :</strong> {selectedRecipe.created_by || "-"}</p>
            <p><strong>Active :</strong> {selectedRecipe.is_active ? "Oui" : "Non"}</p>
          </div>

          <div style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Ajouter une étape</h3>

            <div style={gridStyle}>
              <div>
                <label>Ordre</label>
                <input
                  type="number"
                  style={inputStyle}
                  value={stepForm.step_order}
                  onChange={(e) => setStepForm({ ...stepForm, step_order: e.target.value })}
                />
              </div>

              <div>
                <label>Nom étape</label>
                <input
                  style={inputStyle}
                  value={stepForm.step_name}
                  onChange={(e) => setStepForm({ ...stepForm, step_name: e.target.value })}
                />
              </div>

              <div>
                <label>Durée (min)</label>
                <input
                  type="number"
                  style={inputStyle}
                  value={stepForm.duration_min}
                  onChange={(e) => setStepForm({ ...stepForm, duration_min: e.target.value })}
                />
              </div>

              <div>
                <label>Température</label>
                <input
                  type="number"
                  style={inputStyle}
                  value={stepForm.temp_setpoint}
                  onChange={(e) => setStepForm({ ...stepForm, temp_setpoint: e.target.value })}
                />
              </div>

              <div>
                <label>pH</label>
                <input
                  type="number"
                  style={inputStyle}
                  value={stepForm.ph_setpoint}
                  onChange={(e) => setStepForm({ ...stepForm, ph_setpoint: e.target.value })}
                />
              </div>

              <div>
                <label>DO</label>
                <input
                  type="number"
                  style={inputStyle}
                  value={stepForm.do_setpoint}
                  onChange={(e) => setStepForm({ ...stepForm, do_setpoint: e.target.value })}
                />
              </div>

              <div>
                <label>RPM</label>
                <input
                  type="number"
                  style={inputStyle}
                  value={stepForm.rpm_setpoint}
                  onChange={(e) => setStepForm({ ...stepForm, rpm_setpoint: e.target.value })}
                />
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <label>Notes</label>
              <textarea
                style={{ ...inputStyle, minHeight: 80 }}
                value={stepForm.notes}
                onChange={(e) => setStepForm({ ...stepForm, notes: e.target.value })}
              />
            </div>

            <button style={{ ...buttonStyle, marginTop: 14 }} onClick={addStep}>
              Ajouter étape
            </button>
          </div>

          <div style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Étapes de la recette</h3>

            {recipeSteps.length > 0 ? (
              recipeSteps.map((step) => (
                <div
                  key={step.id}
                  style={{
                    borderBottom: `1px solid ${theme.border}`,
                    padding: "12px 0",
                  }}
                >
                  <p><strong>Ordre :</strong> {step.step_order}</p>
                  <p><strong>Nom :</strong> {step.step_name}</p>
                  <p><strong>Durée :</strong> {step.duration_min} min</p>
                  <p><strong>Température :</strong> {step.temp_setpoint ?? "-"}</p>
                  <p><strong>pH :</strong> {step.ph_setpoint ?? "-"}</p>
                  <p><strong>DO :</strong> {step.do_setpoint ?? "-"}</p>
                  <p><strong>RPM :</strong> {step.rpm_setpoint ?? "-"}</p>
                  <p><strong>Notes :</strong> {step.notes || "-"}</p>
                </div>
              ))
            ) : (
              <p>Aucune étape pour cette recette</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default RecipesPage;