import { useEffect, useState } from "react";
import { API_BASE_URL } from "../config";

function SimpleMiniChart({ title, points, unit, theme }) {
  const width = 100;
  const height = 36;

  if (!points || points.length === 0) {
    return (
      <div
        style={{
          background: theme.panel,
          border: `1px solid ${theme.border}`,
          borderRadius: 18,
          padding: 16,
        }}
      >
        <div style={{ fontWeight: 800, marginBottom: 10 }}>{title}</div>
        <div style={{ color: theme.textSoft }}>Aucune donnée</div>
      </div>
    );
  }

  const values = points.map((p) => Number(p.tag_value));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const last = values[values.length - 1];

  const norm = (v) => {
    if (max === min) return height / 2;
    return height - ((v - min) / (max - min)) * height;
  };

  const stepX = values.length > 1 ? width / (values.length - 1) : width;
  const d = values
    .map((v, i) => `${i === 0 ? "M" : "L"} ${i * stepX} ${norm(v)}`)
    .join(" ");

  return (
    <div
      style={{
        background: theme.panel,
        border: `1px solid ${theme.border}`,
        borderRadius: 18,
        padding: 16,
      }}
    >
      <div style={{ fontWeight: 800, marginBottom: 4, color: theme.text }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 900, color: theme.primary }}>
        {last} {unit}
      </div>
      <div style={{ color: theme.textSoft, fontSize: 13, marginBottom: 12 }}>
        Min: {min} {unit} | Max: {max} {unit}
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: 70 }}>
        <path
          d={d}
          fill="none"
          stroke={theme.primaryAlt}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function TrendsTable({ title, points, unit, theme }) {
  return (
    <div
      style={{
        background: theme.panel,
        border: `1px solid ${theme.border}`,
        borderRadius: 18,
        padding: 16,
      }}
    >
      <div style={{ fontWeight: 800, marginBottom: 12, color: theme.text }}>{title}</div>

      {points.length === 0 ? (
        <div style={{ color: theme.textSoft }}>Aucune donnée</div>
      ) : (
        <div style={{ maxHeight: 260, overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th
                  style={{
                    textAlign: "left",
                    padding: 8,
                    borderBottom: `1px solid ${theme.border}`,
                    color: theme.text,
                  }}
                >
                  Heure
                </th>
                <th
                  style={{
                    textAlign: "right",
                    padding: 8,
                    borderBottom: `1px solid ${theme.border}`,
                    color: theme.text,
                  }}
                >
                  Valeur
                </th>
              </tr>
            </thead>
            <tbody>
              {[...points].reverse().slice(0, 20).map((point, idx) => (
                <tr key={idx}>
                  <td
                    style={{
                      padding: 8,
                      borderBottom: `1px solid ${theme.border}`,
                      color: theme.textSoft,
                    }}
                  >
                    {new Date(point.recorded_at).toLocaleString()}
                  </td>
                  <td
                    style={{
                      padding: 8,
                      textAlign: "right",
                      borderBottom: `1px solid ${theme.border}`,
                      color: theme.text,
                      fontWeight: 700,
                    }}
                  >
                    {point.tag_value} {unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TrendsPage({ theme }) {
  const [series, setSeries] = useState({
    temp_reactor: [],
    ph_value: [],
    do_percent: [],
    stirrer_rpm: [],
  });
  const [error, setError] = useState("");
  const [lastUpdate, setLastUpdate] = useState("");

  const cardStyle = {
    background: theme.panelAlt,
    borderRadius: 22,
    padding: 20,
    boxShadow: "0 10px 22px rgba(15,23,42,0.05)",
    border: `1px solid ${theme.border}`,
    marginBottom: 20,
  };

  const loadTrends = () => {
    fetch(`${API_BASE_URL}/trends`)
      .then((r) => r.json())
      .then((data) => {
        setSeries(
          data.series || {
            temp_reactor: [],
            ph_value: [],
            do_percent: [],
            stirrer_rpm: [],
          }
        );
        setError("");
        setLastUpdate(new Date().toLocaleTimeString());
      })
      .catch(() => {
        setError("Impossible de charger les tendances");
      });
  };

  useEffect(() => {
    loadTrends();
    const interval = setInterval(loadTrends, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h2
        style={{
          color: theme.text,
          marginBottom: 20,
          fontSize: 24,
          fontWeight: 800,
        }}
      >
        Tendances
      </h2>

      {error && (
        <div
          style={{
            backgroundColor: theme.mode === "dark" ? "#3f1d1d" : "#fee2e2",
            color: theme.danger,
            padding: 15,
            borderRadius: 14,
            marginBottom: 20,
            fontWeight: "bold",
            border: `1px solid ${theme.danger}55`,
          }}
        >
          {error}
        </div>
      )}

      <div style={cardStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: theme.text }}>
              Évolution des variables procédé
            </div>
            <div style={{ color: theme.textSoft, marginTop: 4 }}>
              Dernière mise à jour : {lastUpdate || "-"}
            </div>
          </div>

          <button
            onClick={loadTrends}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "none",
              cursor: "pointer",
              fontWeight: "bold",
              color: "#fff",
              background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryAlt} 100%)`,
            }}
          >
            Rafraîchir
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
            gap: 14,
          }}
        >
          <SimpleMiniChart
            title="Température"
            points={series.temp_reactor}
            unit="°C"
            theme={theme}
          />
          <SimpleMiniChart
            title="pH"
            points={series.ph_value}
            unit=""
            theme={theme}
          />
          <SimpleMiniChart
            title="DO"
            points={series.do_percent}
            unit="%"
            theme={theme}
          />
          <SimpleMiniChart
            title="Agitation"
            points={series.stirrer_rpm}
            unit="rpm"
            theme={theme}
          />
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 16,
        }}
      >
        <TrendsTable
          title="Historique température"
          points={series.temp_reactor}
          unit="°C"
          theme={theme}
        />
        <TrendsTable
          title="Historique pH"
          points={series.ph_value}
          unit=""
          theme={theme}
        />
        <TrendsTable
          title="Historique DO"
          points={series.do_percent}
          unit="%"
          theme={theme}
        />
        <TrendsTable
          title="Historique agitation"
          points={series.stirrer_rpm}
          unit="rpm"
          theme={theme}
        />
      </div>
    </div>
  );
}

export default TrendsPage;