import { useEffect, useState } from "react";

function AlarmsPage({ user, theme }) {
  const [alarmData, setAlarmData] = useState(null);
  const [dbAlarms, setDbAlarms] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const canAcknowledge = ["operator", "supervisor", "admin"].includes(user?.role);

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
    cursor: canAcknowledge ? "pointer" : "not-allowed",
    fontWeight: "bold",
    color: "#fff",
    background: canAcknowledge
      ? `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryAlt} 100%)`
      : "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)",
    opacity: canAcknowledge ? 1 : 0.8,
  };

  const dangerButtonStyle = {
    ...buttonStyle,
    background: `linear-gradient(135deg, ${theme.danger} 0%, #b91c1c 100%)`,
  };

  const getPriorityColor = (priority) => {
    if (priority === "critical") return theme.danger;
    if (priority === "warning") return theme.warning;
    if (priority === "info") return theme.info;
    return theme.textSoft;
  };

  const getStatusColor = (status) => {
    if (status === "active") return theme.danger;
    if (status === "acknowledged") return theme.warning;
    if (status === "cleared") return theme.success;
    return theme.textSoft;
  };

  const loadActiveAlarms = () => {
    fetch("http://127.0.0.1:8000/alarms")
      .then((r) => r.json())
      .then((data) => {
        setAlarmData(data);
        setError("");
      })
      .catch(() => setError("Impossible de charger les alarmes actives"));
  };

  const loadAlarmHistory = () => {
    fetch("http://127.0.0.1:8000/db-alarms")
      .then((r) => r.json())
      .then((data) => {
        setDbAlarms(data.rows || []);
      })
      .catch(() => setDbAlarms([]));
  };

  useEffect(() => {
    loadActiveAlarms();
    loadAlarmHistory();

    const interval = setInterval(() => {
      loadActiveAlarms();
      loadAlarmHistory();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const acknowledgeAlarm = async (code) => {
    if (!canAcknowledge) return;

    const response = await fetch(
      `http://127.0.0.1:8000/ack-alarm/${encodeURIComponent(code)}?actor=${encodeURIComponent(
        user.username
      )}`
    );

    const data = await response.json();

    if (data.status === "acknowledged") {
      setMessage(`Alarme ${code} acquittée`);
      setError("");
      loadActiveAlarms();
      loadAlarmHistory();
    } else {
      setError(data.details || "Erreur lors de l’acquittement");
    }
  };

  const acknowledgeAll = async () => {
    if (!canAcknowledge) return;

    const response = await fetch(
      `http://127.0.0.1:8000/ack-all-alarms?actor=${encodeURIComponent(user.username)}`
    );

    const data = await response.json();

    if (data.status === "acknowledged_all") {
      setMessage("Toutes les alarmes actives ont été acquittées");
      setError("");
      loadActiveAlarms();
      loadAlarmHistory();
    } else {
      setError(data.details || "Erreur lors de l’acquittement global");
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
        Alarmes
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
            marginBottom: 14,
          }}
        >
          <h3 style={{ margin: 0 }}>Alarmes actives</h3>

          <button style={dangerButtonStyle} onClick={acknowledgeAll}>
            Acquitter toutes
          </button>
        </div>

        {alarmData ? (
          <>
            <p>
              <strong>Global status :</strong> {alarmData.global_status || "-"}
            </p>
            <p>
              <strong>Active count :</strong> {alarmData.active_count ?? 0}
            </p>
            <p>
              <strong>Acknowledged count :</strong>{" "}
              {alarmData.acknowledged_count ?? 0}
            </p>

            {alarmData.active_alarms?.length > 0 ? (
              alarmData.active_alarms.map((alarm, index) => (
                <div
                  key={`${alarm.code}-${index}`}
                  style={{
                    border: `1px solid ${theme.border}`,
                    borderRadius: 16,
                    padding: 14,
                    marginTop: 12,
                    background: theme.panel,
                  }}
                >
                  <p>
                    <strong>Code :</strong> {alarm.code}
                  </p>
                  <p>
                    <strong>Message :</strong> {alarm.message}
                  </p>
                  <p>
                    <strong>Priority :</strong>{" "}
                    <span style={{ color: getPriorityColor(alarm.priority), fontWeight: 700 }}>
                      {alarm.priority}
                    </span>
                  </p>
                  <p>
                    <strong>Status :</strong>{" "}
                    <span style={{ color: getStatusColor(alarm.status), fontWeight: 700 }}>
                      {alarm.status}
                    </span>
                  </p>

                  {alarm.status === "active" && (
                    <button
                      style={{ ...buttonStyle, marginTop: 10 }}
                      onClick={() => acknowledgeAlarm(alarm.code)}
                    >
                      Acquitter
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p>Aucune alarme active</p>
            )}
          </>
        ) : (
          <p>Chargement des alarmes...</p>
        )}
      </div>

      <div style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>Historique des alarmes</h3>

        {dbAlarms.length > 0 ? (
          dbAlarms.map((alarm) => (
            <div
              key={alarm.id}
              style={{
                borderBottom: `1px solid ${theme.border}`,
                padding: "10px 0",
              }}
            >
              <p>
                <strong>Code :</strong> {alarm.code}
              </p>
              <p>
                <strong>Message :</strong> {alarm.message}
              </p>
              <p>
                <strong>Priority :</strong>{" "}
                <span style={{ color: getPriorityColor(alarm.priority), fontWeight: 700 }}>
                  {alarm.priority}
                </span>
              </p>
              <p>
                <strong>Status :</strong>{" "}
                <span style={{ color: getStatusColor(alarm.status), fontWeight: 700 }}>
                  {alarm.status}
                </span>
              </p>
              <p>
                <strong>Date :</strong> {alarm.created_at}
              </p>
            </div>
          ))
        ) : (
          <p>Aucune alarme enregistrée</p>
        )}
      </div>
    </div>
  );
}

export default AlarmsPage;