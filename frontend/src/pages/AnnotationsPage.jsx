import { useEffect, useState } from "react";

function AnnotationsPage({ user, theme }) {
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [annotations, setAnnotations] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    annotation_type: "event",
    title: "",
    description: "",
    event_time: "",
    tag_name: "",
    tag_value: "",
  });

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

  const loadBatches = () => {
    import { API_BASE_URL } from "../config";

    fetch(`${API_BASE_URL}/status`)
      .then((r) => r.json())
      .then((data) => {
        setBatches(data.rows || []);
        setError("");
      })
      .catch(() => setError("Impossible de charger les batchs"));
  };

  const loadAnnotations = (batchId) => {
    if (!batchId) {
      setAnnotations([]);
      return;
    }

    import BatchesPage from "./pages/BatchesPage";(`http://127.0.0.1:8000/annotations/${batchId}`)
      .then((r) => r.json())
      .then((data) => {
        setAnnotations(data.rows || []);
        setError("");
      })
      .catch(() => setError("Impossible de charger les annotations"));
  };

  useEffect(() => {
    loadBatches();
  }, []);

  useEffect(() => {
    loadAnnotations(selectedBatchId);
  }, [selectedBatchId]);

  const handleCreate = async () => {
    if (!selectedBatchId || !form.title.trim()) {
      setError("Choisis un batch et mets un titre");
      return;
    }

    const response = await fetch("http://127.0.0.1:8000/annotations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        batch_id: Number(selectedBatchId),
        ...form,
        author: user.username,
        event_time: form.event_time || null,
      }),
    });

    const data = await response.json();

    if (data.status === "success") {
      setMessage("Annotation ajoutée");
      setError("");
      setForm({
        annotation_type: "event",
        title: "",
        description: "",
        event_time: "",
        tag_name: "",
        tag_value: "",
      });
      loadAnnotations(selectedBatchId);
    } else {
      setError(data.details || "Erreur lors de la création");
    }
  };

  return (
    <div>
      <h2 style={{ color: theme.text, marginBottom: 20, fontSize: 24, fontWeight: 800 }}>
        Annotations pédagogiques
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
        <h3 style={{ marginTop: 0 }}>Créer une annotation</h3>

        <div style={gridStyle}>
          <div>
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

          <div>
            <label>Type</label>
            <select
              style={inputStyle}
              value={form.annotation_type}
              onChange={(e) => setForm({ ...form, annotation_type: e.target.value })}
            >
              <option value="event">Event</option>
              <option value="inoculation">Inoculation</option>
              <option value="substrate_addition">Ajout substrat</option>
              <option value="ph_correction">Correction pH</option>
              <option value="observation">Observation</option>
            </select>
          </div>

          <div>
            <label>Heure événement</label>
            <input
              type="datetime-local"
              style={inputStyle}
              value={form.event_time}
              onChange={(e) => setForm({ ...form, event_time: e.target.value })}
            />
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <label>Titre</label>
          <input
            style={inputStyle}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <label>Description</label>
          <textarea
            style={{ ...inputStyle, minHeight: 90 }}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div style={{ ...gridStyle, marginTop: 12 }}>
          <div>
            <label>Tag associé</label>
            <input
              style={inputStyle}
              value={form.tag_name}
              onChange={(e) => setForm({ ...form, tag_name: e.target.value })}
            />
          </div>

          <div>
            <label>Valeur</label>
            <input
              style={inputStyle}
              value={form.tag_value}
              onChange={(e) => setForm({ ...form, tag_value: e.target.value })}
            />
          </div>
        </div>

        <button style={{ ...buttonStyle, marginTop: 14 }} onClick={handleCreate}>
          Ajouter annotation
        </button>
      </div>

      <div style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>Liste des annotations</h3>

        {annotations.length > 0 ? (
          annotations.map((item) => (
            <div
              key={item.id}
              style={{
                borderBottom: `1px solid ${theme.border}`,
                padding: "12px 0",
              }}
            >
              <p><strong>Type :</strong> {item.annotation_type}</p>
              <p><strong>Titre :</strong> {item.title}</p>
              <p><strong>Description :</strong> {item.description || "-"}</p>
              <p><strong>Heure :</strong> {item.event_time || "-"}</p>
              <p><strong>Tag :</strong> {item.tag_name || "-"}</p>
              <p><strong>Valeur :</strong> {item.tag_value || "-"}</p>
              <p><strong>Auteur :</strong> {item.author || "-"}</p>
            </div>
          ))
        ) : (
          <p>Aucune annotation pour ce batch</p>
        )}
      </div>
    </div>
  );
}

export default AnnotationsPage;