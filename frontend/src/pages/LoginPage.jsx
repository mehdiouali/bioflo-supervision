import { useState } from "react";

function LoginPage({ onLogin, theme }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    fetch(
      `http://127.0.0.1:8000/login/${encodeURIComponent(username)}/${encodeURIComponent(password)}`
    )
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "success") {
          onLogin(data.user);
          setError("");
        } else {
          setError(data.details || "Login failed");
        }
      })
      .catch(() => setError("Impossible de contacter le backend"));
  };

  return (
    <div
      style={{
        maxWidth: 460,
        margin: "40px auto",
        background: theme.panelAlt,
        borderRadius: 28,
        padding: 30,
        boxShadow: theme.shadow,
        border: `1px solid ${theme.border}`,
      }}
    >
      <h2 style={{ marginTop: 0, color: theme.text, fontSize: 28 }}>
        Connexion
      </h2>
      <p style={{ color: theme.textSoft, marginTop: 8 }}>
        Connecte-toi pour accéder au dashboard BioFlo.
      </p>

      {error && (
        <div
          style={{
            backgroundColor: theme.mode === "dark" ? "#3f1d1d" : "#fee2e2",
            color: theme.danger,
            padding: 12,
            borderRadius: 14,
            marginBottom: 16,
            fontWeight: "bold",
            border: `1px solid ${theme.danger}55`,
          }}
        >
          {error}
        </div>
      )}

      <div style={{ marginBottom: 14 }}>
        <label style={{ fontWeight: 700, color: theme.text }}>Username</label>
        <input
          style={{
            width: "100%",
            padding: 13,
            borderRadius: 14,
            border: `1px solid ${theme.border}`,
            marginTop: 6,
            backgroundColor: theme.inputBg,
            color: theme.text,
            outline: "none",
          }}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>

      <div style={{ marginBottom: 18 }}>
        <label style={{ fontWeight: 700, color: theme.text }}>Password</label>
        <input
          type="password"
          style={{
            width: "100%",
            padding: 13,
            borderRadius: 14,
            border: `1px solid ${theme.border}`,
            marginTop: 6,
            backgroundColor: theme.inputBg,
            color: theme.text,
            outline: "none",
          }}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <button
        onClick={handleLogin}
        style={{
          padding: "13px 16px",
          borderRadius: 16,
          border: "none",
          cursor: "pointer",
          fontWeight: 800,
          color: "#fff",
          background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryAlt} 100%)`,
          width: "100%",
          boxShadow: `0 12px 20px ${theme.primary}33`,
          fontSize: 15,
        }}
      >
        Se connecter
      </button>

      <div
        style={{
          marginTop: 20,
          fontSize: 14,
          color: theme.textSoft,
          backgroundColor: theme.panel,
          padding: 16,
          borderRadius: 16,
          border: `1px solid ${theme.border}`,
        }}
      >
        <p style={{ margin: "4px 0" }}>viewer / viewer123</p>
        <p style={{ margin: "4px 0" }}>operator / operator123</p>
        <p style={{ margin: "4px 0" }}>supervisor / supervisor123</p>
        <p style={{ margin: "4px 0" }}>admin / admin123</p>
      </div>
    </div>
  );
}

export default LoginPage;