export default function BottomNav() {
  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "76px",
        background: "rgba(11, 15, 20, 0.96)",
        borderTop: "1px solid #27303b",
        display: "flex",
        justifyContent: "center",
        zIndex: 100,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "600px",
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          padding: "0 10px",
        }}
      >
        <a
          href="/"
          style={{
            textDecoration: "none",
            color: "#ffffff",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "5px",
            fontSize: "11px",
            fontWeight: "600",
          }}
        >
          <span style={{ fontSize: "22px" }}>🏠</span>
          Home
        </a>

        <a
          href="/matchups"
          style={{
            textDecoration: "none",
            color: "#687384",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "5px",
            fontSize: "11px",
            fontWeight: "600",
          }}
        >
          <span style={{ fontSize: "22px" }}>🏈</span>
          Matchups
        </a>

        <a
          href="/records"
          style={{
            textDecoration: "none",
            color: "#687384",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "5px",
            fontSize: "11px",
            fontWeight: "600",
          }}
        >
          <span style={{ fontSize: "22px" }}>📊</span>
          Records
        </a>

        <a
          href="/history"
          style={{
            textDecoration: "none",
            color: "#687384",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "5px",
            fontSize: "11px",
            fontWeight: "600",
          }}
        >
          <span style={{ fontSize: "22px" }}>🏆</span>
          History
        </a>

        <a
          href="/more"
          style={{
            textDecoration: "none",
            color: "#687384",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "5px",
            fontSize: "11px",
            fontWeight: "600",
          }}
        >
          <span style={{ fontSize: "22px" }}>☰</span>
          More
        </a>
      </div>
    </nav>
  );
}