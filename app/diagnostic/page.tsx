import { getMatchups } from "../../lib/sleeper";
const LEAGUE_ID = "1326512818865868800";
const WEEK = 1;
export default async function DiagnosticPage() {
  const matchups = await getMatchups(
    WEEK,
    LEAGUE_ID
  );
  const firstMatchup =
    matchups[0] ?? null;
  const starters =
    firstMatchup?.starters ?? [];
  const startersPoints =
    firstMatchup?.starters_points ?? [];
  const playerRows = starters.map(
    (playerId, index) => ({
      playerId,
      points:
        startersPoints[index] ?? null,
    })
  );
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
      <h1>
        Player Points Diagnostic
      </h1>
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
          ROSTER ID
        </p>
        <h2 style={valueStyle}>
          {firstMatchup?.roster_id ??
            "None"}
        </h2>
      </article>
      <article style={cardStyle}>
        <p style={labelStyle}>
          STARTERS
        </p>
        <h2 style={valueStyle}>
          {starters.length}
        </h2>
        <pre style={preStyle}>
          {JSON.stringify(
            starters,
            null,
            2
          )}
        </pre>
      </article>
      <article style={cardStyle}>
        <p style={labelStyle}>
          STARTERS POINTS
        </p>
        <h2 style={valueStyle}>
          {startersPoints.length}
        </h2>
        <pre style={preStyle}>
          {JSON.stringify(
            startersPoints,
            null,
            2
          )}
        </pre>
      </article>
      <article style={cardStyle}>
        <p style={labelStyle}>
          PLAYER → POINTS
        </p>
        <pre style={preStyle}>
          {JSON.stringify(
            playerRows,
            null,
            2
          )}
        </pre>
      </article>
      <article style={cardStyle}>
        <p style={labelStyle}>
          RAW MATCHUP
        </p>
        <pre style={preStyle}>
          {JSON.stringify(
            firstMatchup,
            null,
            2
          )}
        </pre>
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
  marginTop: "14px",
  whiteSpace: "pre-wrap" as const,
  wordBreak: "break-word" as const,
  fontSize: "12px",
  lineHeight: "1.5",
  color: "#ffffff",
};