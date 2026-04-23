function StatusBadge({ label, type = "default", theme }) {
  const map = {
    default: {
      bg: theme.mode === "dark" ? "#1f2937" : "#e2e8f0",
      color: theme.text,
      border: theme.border,
    },
    success: {
      bg: `${theme.success}22`,
      color: theme.success,
      border: `${theme.success}44`,
    },
    danger: {
      bg: `${theme.danger}22`,
      color: theme.danger,
      border: `${theme.danger}44`,
    },
    warning: {
      bg: `${theme.warning}22`,
      color: theme.warning,
      border: `${theme.warning}44`,
    },
    info: {
      bg: `${theme.info}22`,
      color: theme.info,
      border: `${theme.info}44`,
    },
    primary: {
      bg: `${theme.primary}22`,
      color: theme.primary,
      border: `${theme.primary}44`,
    },
    purple: {
      bg: `${theme.purple}22`,
      color: theme.purple,
      border: `${theme.purple}44`,
    },
  };

  const style = map[type] || map.default;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 12px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 800,
        background: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
      }}
    >
      {label}
    </span>
  );
}

export default StatusBadge;