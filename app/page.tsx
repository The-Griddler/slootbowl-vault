
export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 20px",
        textAlign: "center",
        color: "#f4f5f7",
      }}
    >
      <h1
        style={{
          fontSize: "clamp(32px, 8vw, 52px)",
          fontWeight: 900,
          letterSpacing: -1.5,
          margin: "0 0 16px",
        }}
      >
        SLOOTBOWL VAULT
      </h1>

      <p
        style={{
          color: "#929eae",
          fontSize: 15,
          lineHeight: 1.7,
          maxWidth: 420,
          margin: 0,
        }}
      >
        A new chapter is coming.
      </p>
    </main>
  );
}
