import {
  getLeagueHistory,
} from "../../lib/sleeper";

export default async function HistoryDiagnosticPage() {
  const leagues = await getLeagueHistory();

  return (
    <main>
      <p
        style={{
          fontSize: "12px",
          fontWeight: 700,
          letterSpacing: "1.5px",
          color: "#687384",
          marginBottom: "6px",
        }}
      >
        SLOOTBOWL VAULT
      </p>

      <h1>History Diagnostic</h1>

      <p
        style={{
          marginBottom: "24px",
          lineHeight: 1.5,
        }}
      >
        This page confirms the historical league chain.
      </p>

      {leagues.map((league) => (
        <article
          key={league.league_id}
          style={{
            background: "#151b23",
            border: "1px solid #27303b",
            borderRadius: "16px",
            padding: "16px",
            marginBottom: "10px",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "18px",
            }}
          >
            {league.season}
          </h2>

          <p
            style={{
              marginTop: "6px",
              fontSize: "13px",
            }}
          >
            {league.name}
          </p>

          <p
            style={{
              marginTop: "8px",
              fontSize: "11px",
              color: "#687384",
              wordBreak: "break-all",
            }}
          >
            League ID: {league.league_id}
          </p>

          <p
            style={{
              marginTop: "4px",
              fontSize: "11px",
              color: "#687384",
              wordBreak: "break-all",
            }}
          >
            Previous: {league.previous_league_id ?? "None"}
          </p>
        </article>
      ))}
    </main>
  );
}