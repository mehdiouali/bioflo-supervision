import { useEffect, useState } from "react";

function LabNotebookPage({ user, theme }) {
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [notes, setNotes] = useState([]);
  const [annotations, setAnnotations] = useState([]);
  const [batchInfo, setBatchInfo] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [noteForm, setNoteForm] = useState({
    note_type: "operator_note",
    note_text: "",
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
  };

  const loadBatches = () => {
    fetch("http://127.0.0.1:8000/batches")
      .then((r) => r.json())
      .then((data) => {
        setBatches(data.rows || []);
      })
      .catch(() => setError("Impossible de charger les batchs"));
  };

  const loadNotebook = (batchId) => {
    if (!batchId) return;

    fetch(`http://127.0.0.1:8000/batches/${batchId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.status === "success") {
          setBatchInfo(data.batch);
          setNotes(data.notes || []);
          setAnnotations(data.annotations || []);
          setError("");
        } else {
          setError(data.details || "Impossible de charger le cahier");
        }
      })
      .catch(() => setError("Erreur lors du chargement du cahier"));
  };

  useEffect(() => {
    loadBatches();
  }, []);

  useEffect(() => {
    if (selectedBatchId) {
      loadNotebook(selectedBatchId);
    }
  }, [selectedBatchId]);

  const handleAddNote = async () => {
    if (!selectedBatchId || !noteForm.note_text.trim()) {
      setError("Choisis un batch et écris une note");
      return;
    }

    const response = await fetch("http://127.0.0.1:8000/batch-notes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        batch_id: Number(selectedBatchId),
        note_type: noteForm.note_type,
        note_text: noteForm.note_text,
        author: user.username,
      }),
    });

    const data = await response.json();

    if (data.status === "success") {
      setMessage("Note ajoutée au cahier");
      setError("");
      setNoteForm({
        note_type: "operator_note",
        note_text: "",
      });
      loadNotebook(selectedBatchId);
    } else {
      setError(data.details || "Erreur lors de l’ajout de la note");
    }
  };

  return (
    <div>
      <h2 style={{ color: theme.text, marginBottom: 20, fontSize: 24, fontWeight: 800 }}>
        Cahier de laboratoire numérique
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
        <h3 style={{ marginTop: 0 }}>Choisir un batch</h3>
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
      </div>

      {batchInfo && (
        <>
          <div style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Fiche batch</h3>
            <p><strong>Nom :</strong> {batchInfo.name}</p>
            <p><strong>Statut :</strong> {batchInfo.status}</p>
            <p><strong>Opérateur :</strong> {batchInfo.operator_username || "-"}</p>
            <p><strong>Objectif :</strong> {batchInfo.objective || "-"}</p>
            <p><strong>Notes initiales :</strong> {batchInfo.notes || "-"}</p>
            <p><strong>Début :</strong> {batchInfo.start_time || "-"}</p>
            <p><strong>Fin :</strong> {batchInfo.end_time || "-"}</p>
          </div>

          <div style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Ajouter une note au cahier</h3>

            <div style={{ maxWidth: 320 }}>
              <label>Type</label>
              <select
                style={inputStyle}
                value={noteForm.note_type}
                onChange={(e) => setNoteForm({ ...noteForm, note_type: e.target.value })}
              >
                <option value="operator_note">Operator note</option>
                <option value="observation">Observation</option>
                <option value="decision">Decision</option>
                <option value="incident">Incident</option>
                <option value="conclusion">Conclusion</option>
              </select>
            </div>

            <div style={{ marginTop: 12 }}>
              <label>Texte</label>
              <textarea
                style={{ ...inputStyle, minHeight: 100 }}
                value={noteForm.note_text}
                onChange={(e) => setNoteForm({ ...noteForm, note_text: e.target.value })}
              />
            </div>

            <button style={{ ...buttonStyle, marginTop: 14 }} onClick={handleAddNote}>
              Ajouter note
            </button>
          </div>

          <div style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Notes du cahier</h3>
            {notes.length > 0 ? (
              notes.map((note) => (
                <div key={note.id} style={{ borderBottom: `1px solid ${theme.border}`, padding: "10px 0" }}>
                  <p><strong>Type :</strong> {note.note_type}</p>
                  <p><strong>Texte :</strong> {note.note_text}</p>
                  <p><strong>Auteur :</strong> {note.author}</p>
                  <p><strong>Date :</strong> {new Date(note.created_at).toLocaleString()}</p>
                </div>
              ))
            ) : (
              <p>Aucune note</p>
            )}
          </div>

          <div style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Annotations liées</h3>
            {annotations.length > 0 ? (
              annotations.map((item) => (
                <div key={item.id} style={{ borderBottom: `1px solid ${theme.border}`, padding: "10px 0" }}>
                  <p><strong>Titre :</strong> {item.title}</p>
                  <p><strong>Type :</strong> {item.annotation_type}</p>
                  <p><strong>Description :</strong> {item.description || "-"}</p>
                  <p><strong>Heure :</strong> {item.event_time || "-"}</p>
                </div>
              ))
            ) : (
              <p>Aucune annotation</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default LabNotebookPage;