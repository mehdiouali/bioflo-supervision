import { useState } from "react";
import { API_BASE_URL } from "../config";

function LoginPage({ onLogin, theme }) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const cardStyle = {
    maxWidth: 520,
    margin: "0 auto",
    background: theme.panelAlt,
    borderRadius: 28,
    padding: 28,
    border: `1px solid ${theme.border}`,
    boxShadow: theme.panelGlow,
    color: theme.text,
  };

  const inputStyle = {
    width: "100%",
    padding: "16px 18px",
    borderRadius: 18,
    border: `1px solid ${theme.border}`,
    background: theme.inputBg,
    color: theme.text,
    fontSize: 18,
    boxSizing: "border-box",
    outline: "none",
  };

  const buttonStyle = {
    width: "100%",
    padding: "16px 18px",
    borderRadius: 18,
    border: "none",
    cursor: loading ? "not-allowed" : "pointer",
    fontWeight: 800,
    fontSize: 18,
    color: "#fff",
    background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryAlt} 100%)`,
    opacity: loading ? 0.7 : 1,
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Login failed");
        setLoading(false);
        return;
      }

      if (data.status === "success" && data.user) {
        onLogin(data.user);
        return;
      }

      setError("Login failed");
    } catch (err) {
      setError("Impossible de contacter le backend");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={cardStyle}>
      <h2
        style={{
          marginTop: 0,
          marginBottom: 8,
          textAlign: "center",
          fontSize: 34,
          fontWeight: 900,
          color: theme.text,
        }}
      >
        Connexion
      </h2>

      <p
        style={{
          textAlign: "center",
          marginTop: 0,
          marginBottom: 18,
          color: theme.textSoft,
          fontSize: 18,
        }}
      >
        Connecte-toi pour accéder au dashboard BioFlo.
      </p>

      {error && (
        <div
          style={{
            backgroundColor: theme.mode === "dark" ? "#3f1d1d" : "#fee2e2",
            color: theme.danger,
            padding: 16,
            borderRadius: 18,
            marginBottom: 18,
            fontWeight: 800,
            border: `1px solid ${theme.danger}55`,
            textAlign: "center",
            fontSize: 18,
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 18 }}>
          <label
            style={{
              display: "block",
              marginBottom: 10,
              fontWeight: 800,
              fontSize: 18,
              color: theme.text,
              textAlign: "center",
            }}
          >
            Username
          </label>
          <input
            style={inputStyle}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
        </div>

        <div style={{ marginBottom: 22 }}>
          <label
            style={{
              display: "block",
              marginBottom: 10,
              fontWeight: 800,
              fontSize: 18,
              color: theme.text,
              textAlign: "center",
            }}
          >
            Password
          </label>
          <input
            type="password"
            style={inputStyle}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        <button type="submit" style={buttonStyle} disabled={loading}>
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>

      <div
        style={{
          marginTop: 24,
          padding: 20,
          borderRadius: 20,
          background: theme.panel,
          border: `1px solid ${theme.border}`,
          textAlign: "center",
          color: theme.textSoft,
          lineHeight: 1.9,
          fontSize: 16,
        }}
      >
        <div>viewer / viewer123</div>
        <div>operator / operator123</div>
        <div>supervisor / supervisor123</div>
        <div>admin / admin123</div>
      </div>
    </div>
  );
}

export default LoginPage;