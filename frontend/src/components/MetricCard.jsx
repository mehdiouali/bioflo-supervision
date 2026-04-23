function MetricCard({ title, value, unit = "", theme }) {
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
      <div style={{ color: theme.textSoft, fontSize: 13, marginBottom: 12 }}>
        {title}
      </div>
      <p
        style={{
          fontSize: 32,
          fontWeight: 800,
          margin: 0,
          color: theme.text,
        }}
      >
        {value}{" "}
        <span style={{ fontSize: 15, color: theme.textSoft, fontWeight: 700 }}>
          {unit}
        </span>
      </p>
    </div>
  );
}

export default MetricCard;