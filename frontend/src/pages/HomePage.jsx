import { useEffect, useState } from "react";
import SectionCard from "../components/SectionCard";
import StatusBadge from "../components/StatusBadge";

function KpiCard({ title, value, subtitle, accent, theme }) {
  return (
    <div
      style={{
        background: theme.panel,
        border: `1px solid ${theme.border}`,
        borderRadius: 20,
        padding: 18,
        boxShadow: theme.cardShadow,
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
        {title}
      </div>
      <div
        style={{
          fontSize: 30,
          fontWeight: 900,
          color: accent || theme.text,
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      {subtitle ? (
        <div style={{ marginTop: 8, color: theme.textSoft, fontSize: 14 }}>
          {subtitle}
        </div>
      ) : null}
    </div>
  );
}

function HomePage({ theme }) {
  const [status, setStatus] = useState(null);
  const [currentBatch, setCurrentBatch] = useState(null);
  const [globalHealth, setGlobalHealth] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [batches, setBatches] = useState([]);
  const [alarms, setAlarms] = useState(null);

  const loadData = () => {
    fetch("http://127.0.0.1:8000/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => {});

    fetch("http://127.0.0.1:8000/batches/current")
      .then((r) => r.json())
      .then((data) => setCurrentBatch(data.batch || null))
      .catch(() => {});

    fetch("http://127.0.0.1:8000/health")
      .then((r) => r.json())
      .then(setGlobalHealth)
      .catch(() => {});

    fetch("http://127.0.0.1:8000/recipes")
      .then((r) => r.json())
      .then((data) => setRecipes(data.rows || []))
      .catch(() => {});

    fetch("http://127.0.0.1:8000/batches")
      .then((r) => r.json())
      .then((data) => setBatches(data.rows || []))
      .catch(() => {});

    fetch("http://127.0.0.1:8000/alarms")
      .then((r) => r.json())
      .then(setAlarms)
      .catch(() => {});
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, []);

  const plannedCount = batches.filter((b) => b.status === "planned").length;
  const runningCount = batches.filter((b) => b.status === "running").length;
  const completedCount = batches.filter((b) => b.status === "completed").length;
  const abortedCount = batches.filter((b) => b.status === "aborted").length;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2
          style={{
            color: theme.text,
            marginBottom: 8,
            fontSize: 28,
            fontWeight: 900,
          }}
        >
          Vue d’ensemble du système
        </h2>
        <p style={{ margin: 0, color: theme.textSoft, fontSize: 15 }}>
          Dashboard académique pour supervision, analyse pédagogique et suivi des batchs BioFlo.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: 14,
          marginBottom: 20,
        }}
      >
        <KpiCard
          title="Mode"
          value={status?.mode || "-"}
          subtitle="Simulation / live"
          accent={theme.warning}
          theme={theme}
        />
        <KpiCard
          title="Batchs"
          value={batches.length}
          subtitle="Total enregistrés"
          accent={theme.primary}
          theme={theme}
        />
        <KpiCard
          title="Recettes"
          value={recipes.length}
          subtitle="Disponibles"
          accent={theme.info}
          theme={theme}
        />
        <KpiCard
          title="Alarmes actives"
          value={alarms?.active_count ?? 0}
          subtitle="État procédé"
          accent={(alarms?.active_count ?? 0) > 0 ? theme.danger : theme.success}
          theme={theme}
        />
        <KpiCard
          title="Health score"
          value={globalHealth?.health?.health_score ?? "-"}
          subtitle="Santé du procédé"
          accent={theme.success}
          theme={theme}
        />
      </div>

      <SectionCard
        title="Tableau santé du procédé"
        subtitle="Vue synthétique pour la démonstration et la soutenance"
        theme={theme}
      >
        {globalHealth?.health ? (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 12,
                marginBottom: 14,
              }}
            >
              <KpiCard
                title="Health score"
                value={globalHealth.health.health_score}
                subtitle="Score global"
                accent={theme.success}
                theme={theme}
              />
              <KpiCard
                title="Stability"
                value={globalHealth.health.stability_score}
                subtitle="Stabilité"
                accent={theme.info}
                theme={theme}
              />
              <KpiCard
                title="Alarm score"
                value={globalHealth.health.alarm_score}
                subtitle="Impact alarmes"
                accent={theme.warning}
                theme={theme}
              />
              <KpiCard
                title="Recipe adherence"
                value={globalHealth.health.recipe_adherence_score}
                subtitle="Écart à la recette"
                accent={theme.purple}
                theme={theme}
              />
            </div>

            <div
              style={{
                background: theme.panel,
                border: `1px solid ${theme.border}`,
                borderRadius: 18,
                padding: 16,
              }}
            >
              <strong>Résumé :</strong> {globalHealth.health.summary}
            </div>
          </>
        ) : (
          <div
            style={{
              background: theme.panel,
              border: `1px solid ${theme.border}`,
              borderRadius: 18,
              padding: 18,
              color: theme.textSoft,
            }}
          >
            Aucune donnée de santé disponible pour le moment.
          </div>
        )}
      </SectionCard>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr",
          gap: 20,
        }}
      >
        <SectionCard
          title="Batch en cours"
          subtitle="Suivi opérateur"
          theme={theme}
        >
          {currentBatch ? (
            <>
              <p><strong>Nom :</strong> {currentBatch.name}</p>
              <p>
                <strong>Statut :</strong>{" "}
                <StatusBadge label={currentBatch.status} type="success" theme={theme} />
              </p>
              <p><strong>Recette :</strong> {currentBatch.recipe_name || "-"}</p>
              <p><strong>Opérateur :</strong> {currentBatch.operator_username || "-"}</p>
              <p><strong>Début :</strong> {currentBatch.start_time || "-"}</p>
              <p><strong>Objectif :</strong> {currentBatch.objective || "-"}</p>
            </>
          ) : (
            <div
              style={{
                background: theme.panel,
                border: `1px solid ${theme.border}`,
                borderRadius: 18,
                padding: 16,
                color: theme.textSoft,
              }}
            >
              Aucun batch en cours actuellement.
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Statuts des batchs"
          subtitle="Répartition globale"
          theme={theme}
        >
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Planned</span>
              <StatusBadge label={String(plannedCount)} type="warning" theme={theme} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Running</span>
              <StatusBadge label={String(runningCount)} type="success" theme={theme} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Completed</span>
              <StatusBadge label={String(completedCount)} type="info" theme={theme} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Aborted</span>
              <StatusBadge label={String(abortedCount)} type="danger" theme={theme} />
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Derniers batchs"
        subtitle="Historique récent"
        theme={theme}
      >
        {batches.length > 0 ? (
          batches.slice(0, 6).map((batch) => (
            <div
              key={batch.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                padding: "12px 0",
                borderBottom: `1px solid ${theme.border}`,
                flexWrap: "wrap",
              }}
            >
              <div>
                <div style={{ fontWeight: 800 }}>{batch.name}</div>
                <div style={{ color: theme.textSoft, fontSize: 14 }}>
                  {batch.recipe_name || "-"}
                </div>
              </div>

              <StatusBadge
                label={batch.status}
                type={
                  batch.status === "running"
                    ? "success"
                    : batch.status === "planned"
                    ? "warning"
                    : batch.status === "completed"
                    ? "info"
                    : batch.status === "aborted"
                    ? "danger"
                    : "default"
                }
                theme={theme}
              />
            </div>
          ))
        ) : (
          <div
            style={{
              background: theme.panel,
              border: `1px solid ${theme.border}`,
              borderRadius: 18,
              padding: 16,
              color: theme.textSoft,
            }}
          >
            Aucun batch disponible.
          </div>
        )}
      </SectionCard>
    </div>
  );
}

export default HomePage;