import { getLeagueHistory } from "../../lib/sleeper";

export default async function HistoryTestPage() {
  const leagues = await getLeagueHistory();

  return (
    <main>
      <h1>League History Test</h1>

      <p
        style={{
          marginTop: "10px",
          marginBottom: "24px",
        }}
      >
        Found {leagues.length} seasons.
      </p>

      {leagues.map((league, index) => (
        <article
          key={league.league_id}
          style={{
            background: "#151b23",
            border: "1px solid #27303b",
            borderRadius: "18px",
            padding: "18px",
            marginBottom: "10px",
          }}
        >
          <p
            style={{
              fontSize: "12px",
              fontWeight: "700",
              letterSpacing: "1px",
              color: "#687384",
            }}
          >
            SEASON {index + 1}
          </p>

          <h2
            style={{
              margin: "6px 0 0",
              fontSize: "22px",
            }}
          >
            {league.season}
          </h2>

          <p
            style={{
              marginTop: "6px",
            }}
          >
            {league.name}
          </p>

          <p
            style={{
              marginTop: "6px",
              fontSize: "12px",
              color: "#687384",
              wordBreak: "break-all",
            }}
          >
            League ID: {league.league_id}
          </p>

          <p
            style={{
              marginTop: "6px",
              fontSize: "12px",
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