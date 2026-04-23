import StatusBadge from "./StatusBadge";

function MiniCard({ label, value, hint, accent, theme }) {
  return (
    <div
      style={{
        background: theme.panelAlt,
        border: `1px solid ${theme.border}`,
        borderRadius: 18,
        padding: 14,
        minWidth: 160,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 800,
          color: theme.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.4,
          marginBottom: 8,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 18,
          fontWeight: 800,
          color: accent || theme.text,
          marginBottom: hint ? 4 : 0,
        }}
      >
        {value}
      </div>

      {hint ? (
        <div style={{ fontSize: 12, color: theme.textMuted }}>{hint}</div>
      ) : null}
    </div>
  );
}

function getColor(value, theme) {
  if (value === "ok" || value === "connected" || value === "running") {
    return theme.success;
  }
  if (
    value === "warning" ||
    value === "simulation" ||
    value === "waiting_connector"
  ) {
    return theme.warning;
  }
  if (value === "error" || value === "critical") {
    return theme.danger;
  }
  return theme.text;
}

function GlobalStatusBar({ backendStatus, dbStatus, realtime, updatedAt, theme }) {
  const mode = realtime?.source_mode || "-";
  const comm = realtime?.comm_status || "-";
  const processState = realtime?.process_state || "-";
  const temp = realtime?.temp_reactor ?? "-";
  const ph = realtime?.ph_value ?? "-";
  const doValue = realtime?.do_percent ?? "-";
  const rpm = realtime?.stirrer_rpm ?? "-";

  return (
    <div style={{ marginBottom: 20 }}>
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          marginBottom: 14,
        }}
      >
        <StatusBadge
          label={`Backend: ${backendStatus || "-"}`}
          type={backendStatus === "ok" ? "success" : "danger"}
          theme={theme}
        />
        <StatusBadge
          label={`Database: ${dbStatus || "-"}`}
          type={dbStatus === "connected" ? "success" : "danger"}
          theme={theme}
        />
        <StatusBadge
          label={`Mode: ${mode}`}
          type={mode === "simulation" ? "warning" : "info"}
          theme={theme}
        />
        <StatusBadge
          label={`Communication: ${comm}`}
          type={comm === "ok" ? "success" : "warning"}
          theme={theme}
        />
        <StatusBadge
          label={`Process: ${processState}`}
          type={processState === "running" ? "success" : "default"}
          theme={theme}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 12,
        }}
      >
        <MiniCard
          label="Température"
          value={`${temp} °C`}
          accent={getColor(processState, theme)}
          theme={theme}
        />
        <MiniCard label="pH" value={`${ph}`} theme={theme} />
        <MiniCard label="DO" value={`${doValue} %`} theme={theme} />
        <MiniCard label="Agitation" value={`${rpm} rpm`} theme={theme} />
        <MiniCard
          label="Dernière mise à jour"
          value={updatedAt || "-"}
          hint="Frontend refresh"
          theme={theme}
        />
      </div>
    </div>
  );
}

export default GlobalStatusBar;