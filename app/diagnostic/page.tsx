import { getMatchups } from "../../lib/sleeper";

const LEAGUE_ID = "1326512818865868800";
const WEEK = 1;

export default async function DiagnosticPage() {
  const matchups = await getMatchups(
    WEEK,
    LEAGUE_ID
  );

  const response = await fetch(
    `https://api.sleeper.app/v1/stats/nfl/2026/${WEEK}?season_type=regular`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      "Failed to load Sleeper player stats"
    );
  }

  const stats = await response.json();

  const statKeys = Object.keys(stats);

  const firstTenKeys =
    statKeys.slice(0, 10);

  const firstStarter =
    matchups.find(
      (matchup) =>
        matchup.starters &&
        matchup.starters.length > 0
    )?.starters?.[0];

  return (
    <main>
      <p
        style={{
          fontSize: "12px",
          fontWeight: "700",
          letterSpacing: "1.5px",
          color: "#687384",
          marginBottom: "8px",
        }}
      >
        DYNASTY SLUTS
      </p>

      <h1>Player Points Diagnostic</h1>

      <p
        style={{
          marginTop: "8px",
          marginBottom: "28px",
        }}
      >
        2026 · Week {WEEK}
      </p>

      <article style={cardStyle}>
        <p style={labelStyle}>
          FIRST STARTER
        </p>

        <h2 style={valueStyle}>
          {firstStarter ?? "None"}
        </h2>
      </article>

      <article style={cardStyle}>
        <p style={labelStyle}>
          STATS OBJECT
        </p>

        <p style={{ marginTop: "10px" }}>
          Number of players returned:
        </p>

        <h2 style={valueStyle}>
          {statKeys.length}
        </h2>
      </article>

      <article style={cardStyle}>
        <p style={labelStyle}>
          FIRST 10 PLAYER IDS RETURNED
        </p>

        <pre style={preStyle}>
          {JSON.stringify(
            firstTenKeys,
            null,
            2
          )}
        </pre>
      </article>

      <article style={cardStyle}>
        <p style={labelStyle}>
          DOES SLEEPER RETURN OUR STARTER?
        </p>

        <h2 style={valueStyle}>
          {firstStarter &&
          stats[firstStarter]
            ? "YES"
            : "NO"}
        </h2>
      </article>
    </main>
  );
}

const cardStyle = {
  background: "#151b23",
  border: "1px solid #27303b",
  borderRadius: "18px",
  padding: "18px",
  marginBottom: "12px",
};

const labelStyle = {
  fontSize: "11px",
  fontWeight: "700",
  letterSpacing: "1px",
  color: "#687384",
};

const valueStyle = {
  margin: "8px 0 0",
  fontSize: "24px",
};

const preStyle = {
  marginTop: "12px",
  whiteSpace: "pre-wrap" as const,
  wordBreak: "break-word" as const,
  fontSize: "12px",
  lineHeight: "1.5",
  color: "#ffffff",
};