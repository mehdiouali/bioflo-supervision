function SectionCard({ title, subtitle = "", right = null, children, theme }) {
  return (
    <div
      style={{
        background: theme.panelAlt,
        borderRadius: 24,
        padding: 20,
        border: `1px solid ${theme.border}`,
        boxShadow: theme.cardShadow,
        color: theme.text,
        marginBottom: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 16,
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 800,
              color: theme.text,
            }}
          >
            {title}
          </h3>
          {subtitle ? (
            <p
              style={{
                margin: "6px 0 0 0",
                color: theme.textMuted,
                fontSize: 14,
              }}
            >
              {subtitle}
            </p>
          ) : null}
        </div>

        {right}
      </div>

      {children}
    </div>
  );
}

export default SectionCard;