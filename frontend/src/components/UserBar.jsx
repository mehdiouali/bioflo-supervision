import StatusBadge from "./StatusBadge";

function UserBar({ user, onLogout, theme }) {
  const roleType =
    user?.role === "admin"
      ? "danger"
      : user?.role === "supervisor"
      ? "warning"
      : "success";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 16,
        flexWrap: "wrap",
        marginBottom: 20,
        background: theme.panelAlt,
        border: `1px solid ${theme.border}`,
        borderRadius: 22,
        padding: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryAlt} 100%)`,
            color: "#fff",
            display: "grid",
            placeItems: "center",
            fontWeight: 800,
            fontSize: 18,
          }}
        >
          {(user?.username || "U").slice(0, 1).toUpperCase()}
        </div>

        <div>
          <div style={{ fontWeight: 800, color: theme.text }}>
            {user?.full_name || user?.username}
          </div>
          <div style={{ fontSize: 13, color: theme.textMuted }}>
            @{user?.username || "-"}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <StatusBadge label={user?.role || "-"} type={roleType} theme={theme} />

        <button
          onClick={onLogout}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "none",
            cursor: "pointer",
            fontWeight: 800,
            color: "#fff",
            background: `linear-gradient(135deg, ${theme.danger} 0%, #b91c1c 100%)`,
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default UserBar;