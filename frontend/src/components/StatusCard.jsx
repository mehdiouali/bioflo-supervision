function StatusCard({ title, value, color = "#16a34a", theme }) {
  return (
    <div
      style={{
        background: theme.panelAlt,
        borderRadius: 22,
        padding: 22,
        boxShadow: "0 10px 22px rgba(15,23,42,0.05)",
        border: `1px solid ${theme.border}`,
        minWidth: "200px",
        flex: "1",
      }}
    >
      <div style={{ color: theme.textSoft, fontSize: 13, marginBottom: 14 }}>
        {title}
      </div>

      <span
        style={{
          display: "inline-block",
          padding: "8px 14px",
          borderRadius: "999px",
          fontSize: "13px",
          fontWeight: "800",
          color: "#fff",
          backgroundColor: color,
          letterSpacing: "0.2px",
        }}
      >
        {value}
      </span>
    </div>
  );
}

export default StatusCard;