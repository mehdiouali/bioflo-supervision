import { useEffect, useState } from "react";

function SettingsPage({ user, theme }) {
  const [sourceMode, setSourceMode] = useState("");
  const [settings, setSettings] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadSourceMode = () => {
    fetch("http://127.0.0.1:8000/source-mode")
      .then((response) => response.json())
      .then((data) => {
        setSourceMode(data.source_mode || "");
      })
      .catch(() => setError("Impossible de charger le mode actuel"));
  };

  const loadSettings = () => {
    fetch("http://127.0.0.1:8000/settings")
      .then((response) => response.json())
      .then((data) => {
        const mapped = {};
        (data.rows || []).forEach((row) => {
          mapped[row.setting_key] = row.setting_value;
        });
        setSettings(mapped);
        setError("");
      })
      .catch(() => setError("Impossible de charger les paramètres"));
  };

  useEffect(() => {
    loadSourceMode();
    loadSettings();
  }, []);

  const handleModeChange = (mode) => {
    fetch(`http://127.0.0.1:8000/set-source-mode/${mode}?actor=${encodeURIComponent(user.username)}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "updated") {
          setSourceMode(data.source_mode);
          setMessage(`Mode changé vers : ${data.source_mode}`);
          setError("");
        } else {
          setError(data.details || "Erreur lors du changement de mode");
          setMessage("");
        }
      })
      .catch(() => {
        setError("Impossible de changer le mode");
        setMessage("");
      });
  };

  const handleInputChange = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveSetting = (key) => {
    const value = settings[key];

    fetch(
      `http://127.0.0.1:8000/settings/update/${key}/${encodeURIComponent(value)}?actor=${encodeURIComponent(user.username)}`
    )
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "updated") {
          setMessage(`Paramètre mis à jour : ${key} = ${value}`);
          setError("");
          loadSettings();
        } else {
          setError(data.details || "Erreur lors de la mise à jour");
          setMessage("");
        }
      })
      .catch(() => {
        setError("Impossible de sauvegarder le paramètre");
        setMessage("");
      });
  };

  const cardStyle = {
    background: theme.panelAlt,
    borderRadius: "22px",
    padding: "20px",
    boxShadow: "0 10px 22px rgba(15,23,42,0.05)",
    marginBottom: "20px",
    border: `1px solid ${theme.border}`,
    color: theme.text,
  };

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "10px",
  };

  const thtdStyle = {
    borderBottom: `1px solid ${theme.border}`,
    textAlign: "left",
    padding: "10px",
    verticalAlign: "middle",
    color: theme.text,
  };

  const buttonStyle = (active) => ({
    padding: "10px 16px",
    borderRadius: "12px",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
    color: "#fff",
    background: active
      ? `linear-gradient(135deg, ${theme.success} 0%, #15803d 100%)`
      : `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryAlt} 100%)`,
    marginRight: "10px",
    boxShadow: active ? `0 10px 18px ${theme.success}33` : `0 10px 18px ${theme.primary}33`,
  });

  const saveButtonStyle = {
    padding: "8px 12px",
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
    color: "#fff",
    background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryAlt} 100%)`,
  };

  const inputStyle = {
    padding: "9px 10px",
    borderRadius: "10px",
    border: `1px solid ${theme.border}`,
    width: "120px",
    backgroundColor: theme.inputBg,
    color: theme.text,
  };

  return (
    <div>
      <h2 style={{ color: theme.text, marginBottom: "20px", fontSize: "24px", fontWeight: 800 }}>
        Paramètres
      </h2>

      {message && (
        <div
          style={{
            backgroundColor: theme.mode === "dark" ? "#16311f" : "#dcfce7",
            color: theme.success,
            padding: "15px",
            borderRadius: "14px",
            marginBottom: "20px",
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
            padding: "15px",
            borderRadius: "14px",
            marginBottom: "20px",
            fontWeight: "bold",
            border: `1px solid ${theme.danger}55`,
          }}
        >
          {error}
        </div>
      )}

      <div style={cardStyle}>
        <h3>Source de données</h3>
        <p>
          <strong>Mode actuel :</strong> {sourceMode || "inconnu"}
        </p>

        <div style={{ marginTop: "15px" }}>
          <button
            style={buttonStyle(sourceMode === "simulation")}
            onClick={() => handleModeChange("simulation")}
          >
            Mode Simulation
          </button>

          <button
            style={buttonStyle(sourceMode === "live_bioflo")}
            onClick={() => handleModeChange("live_bioflo")}
          >
            Mode Live BioFlo
          </button>
        </div>
      </div>

      <div style={cardStyle}>
        <h3>Paramètres dynamiques</h3>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thtdStyle}>Paramètre</th>
              <th style={thtdStyle}>Valeur</th>
              <th style={thtdStyle}>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={thtdStyle}>DO low threshold</td>
              <td style={thtdStyle}>
                <input
                  style={inputStyle}
                  value={settings.do_low_threshold || ""}
                  onChange={(e) => handleInputChange("do_low_threshold", e.target.value)}
                />
              </td>
              <td style={thtdStyle}>
                <button style={saveButtonStyle} onClick={() => handleSaveSetting("do_low_threshold")}>
                  Sauvegarder
                </button>
              </td>
            </tr>

            <tr>
              <td style={thtdStyle}>Temperature high threshold</td>
              <td style={thtdStyle}>
                <input
                  style={inputStyle}
                  value={settings.temp_high_threshold || ""}
                  onChange={(e) => handleInputChange("temp_high_threshold", e.target.value)}
                />
              </td>
              <td style={thtdStyle}>
                <button style={saveButtonStyle} onClick={() => handleSaveSetting("temp_high_threshold")}>
                  Sauvegarder
                </button>
              </td>
            </tr>

            <tr>
              <td style={thtdStyle}>pH low threshold</td>
              <td style={thtdStyle}>
                <input
                  style={inputStyle}
                  value={settings.ph_low_threshold || ""}
                  onChange={(e) => handleInputChange("ph_low_threshold", e.target.value)}
                />
              </td>
              <td style={thtdStyle}>
                <button style={saveButtonStyle} onClick={() => handleSaveSetting("ph_low_threshold")}>
                  Sauvegarder
                </button>
              </td>
            </tr>

            <tr>
              <td style={thtdStyle}>Refresh interval (sec)</td>
              <td style={thtdStyle}>
                <input
                  style={inputStyle}
                  value={settings.refresh_interval_sec || ""}
                  onChange={(e) => handleInputChange("refresh_interval_sec", e.target.value)}
                />
              </td>
              <td style={thtdStyle}>
                <button style={saveButtonStyle} onClick={() => handleSaveSetting("refresh_interval_sec")}>
                  Sauvegarder
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={cardStyle}>
        <h3>État actuel de configuration</h3>
        <table style={tableStyle}>
          <tbody>
            <tr>
              <td style={thtdStyle}><strong>Mode système</strong></td>
              <td style={thtdStyle}>{sourceMode || "inconnu"}</td>
            </tr>
            <tr>
              <td style={thtdStyle}><strong>Source de données</strong></td>
              <td style={thtdStyle}>
                {sourceMode === "simulation"
                  ? "Simulateur BioFlo"
                  : sourceMode === "live_bioflo"
                  ? "Connecteur BioFlo réel"
                  : "Non définie"}
              </td>
            </tr>
            <tr>
              <td style={thtdStyle}><strong>DO low threshold</strong></td>
              <td style={thtdStyle}>{settings.do_low_threshold || "-"}</td>
            </tr>
            <tr>
              <td style={thtdStyle}><strong>Temperature high threshold</strong></td>
              <td style={thtdStyle}>{settings.temp_high_threshold || "-"}</td>
            </tr>
            <tr>
              <td style={thtdStyle}><strong>pH low threshold</strong></td>
              <td style={thtdStyle}>{settings.ph_low_threshold || "-"}</td>
            </tr>
            <tr>
              <td style={thtdStyle}><strong>Refresh interval</strong></td>
              <td style={thtdStyle}>{settings.refresh_interval_sec || "-"} s</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SettingsPage;