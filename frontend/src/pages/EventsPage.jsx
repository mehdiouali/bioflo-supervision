import { useEffect, useState } from "react";

function EventsPage({ theme }) {
  const [events, setEvents] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
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

  const buttonStyle = {
    padding: "10px 14px",
    borderRadius: "12px",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
    color: "#fff",
    background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryAlt} 100%)`,
  };

  const loadEvents = () => {
    fetch("http://127.0.0.1:8000/db-events")
      .then((r) => r.json())
      .then((data) => {
        setEvents(data.rows || []);
        setError("");
      })
      .catch(() => setError("Impossible de charger les événements système"));
  };

  const loadAuditLogs = () => {
    fetch("http://127.0.0.1:8000/audit-logs")
      .then((r) => r.json())
      .then((data) => {
        setAuditLogs(data.rows || []);
      })
      .catch(() => setAuditLogs([]));
  };

  useEffect(() => {
    loadEvents();
    loadAuditLogs();
  }, []);

  const exportAudit = () => {
    window.open("http://127.0.0.1:8000/export/audit", "_blank");
    setMessage("Export audit lancé");
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
        Historique / Événements
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
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 12,
          }}
        >
          <h3 style={{ margin: 0 }}>Événements système</h3>
          <button style={buttonStyle} onClick={loadEvents}>
            Rafraîchir
          </button>
        </div>

        {events.length > 0 ? (
          events.map((event) => (
            <div
              key={event.id}
              style={{
                borderBottom: `1px solid ${theme.border}`,
                padding: "10px 0",
              }}
            >
              <p>
                <strong>Type :</strong> {event.event_type}
              </p>
              <p>
                <strong>Message :</strong> {event.message}
              </p>
              <p>
                <strong>Date :</strong> {event.created_at}
              </p>
            </div>
          ))
        ) : (
          <p>Aucun événement système</p>
        )}
      </div>

      <div style={cardStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 12,
          }}
        >
          <h3 style={{ margin: 0 }}>Audit utilisateur</h3>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button style={buttonStyle} onClick={loadAuditLogs}>
              Rafraîchir
            </button>
            <button style={buttonStyle} onClick={exportAudit}>
              Export CSV
            </button>
          </div>
        </div>

        {auditLogs.length > 0 ? (
          auditLogs.map((log) => (
            <div
              key={log.id}
              style={{
                borderBottom: `1px solid ${theme.border}`,
                padding: "10px 0",
              }}
            >
              <p>
                <strong>Acteur :</strong> {log.actor}
              </p>
              <p>
                <strong>Action :</strong> {log.action}
              </p>
              <p>
                <strong>Cible :</strong> {log.target}
              </p>
              <p>
                <strong>Détails :</strong> {log.details || "-"}
              </p>
              <p>
                <strong>Date :</strong> {log.created_at}
              </p>
            </div>
          ))
        ) : (
          <p>Aucun log d’audit</p>
        )}
      </div>
    </div>
  );
}

export default EventsPage;