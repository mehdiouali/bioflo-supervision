function AlarmCard({ alarm, theme }) {
  const borderColor =
    alarm.priority === "critical"
      ? theme.danger
      : alarm.priority === "warning"
      ? theme.warning
      : theme.success;

  const background =
    theme.mode === "dark"
      ? theme.panelAlt
      : alarm.priority === "critical"
      ? "linear-gradient(180deg, #fff1f2 0%, #fef2f2 100%)"
      : alarm.priority === "warning"
      ? "linear-gradient(180deg, #fff7ed 0%, #fffbeb 100%)"
      : "linear-gradient(180deg, #f0fdf4 0%, #ecfdf5 100%)";

  return (
    <div
      style={{
        background,
        borderLeft: `6px solid ${borderColor}`,
        borderRadius: 18,
        padding: 18,
        boxShadow: "0 8px 18px rgba(15,23,42,0.05)",
        border: `1px solid ${theme.border}`,
        color: theme.text,
      }}
    >
      <p><strong>Code :</strong> {alarm.code}</p>
      <p><strong>Message :</strong> {alarm.message}</p>
      <p><strong>Priorité :</strong> {alarm.priority}</p>
      <p><strong>Statut :</strong> {alarm.status}</p>
    </div>
  );
}

export default AlarmCard;