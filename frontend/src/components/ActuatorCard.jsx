function ActuatorCard({ title, state, theme }) {
  return (
    <div
      style={{
        background: theme.panelAlt,
        borderRadius: 22,
        padding: 22,
        boxShadow: "0 10px 22px rgba(15,23,42,0.05)",
        border: `1px solid ${theme.border}`,
        minWidth: "180px",
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
          fontSize: 13,
          fontWeight: 800,
          color: "#fff",
          background: state
            ? `linear-gradient(135deg, ${theme.success} 0%, #15803d 100%)`
            : "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)",
        }}
      >
        {state ? "ON" : "OFF"}
      </span>
    </div>
  );
}

export default ActuatorCard;