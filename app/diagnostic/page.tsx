import { getMatchups } from "../../lib/sleeper";
const LEAGUE_ID = "1326512818865868800";
const WEEK = 1;
type PlayerStats = {
  [playerId: string]: {
    pts_ppr?: number;
    pts_half_ppr?: number;
    pts_std?: number;
    [stat: string]: unknown;
  };
};
export default async function DiagnosticPage() {
  const matchups = await getMatchups(
    WEEK,
    LEAGUE_ID
  );
  const response = await fetch(
    `https://api.sleeper.com/stats/nfl/2026/${WEEK}?season_type=regular`,
    {
      cache: "no-store",
    }
  );
  if (!response.ok) {
    const errorText =
      await response.text();
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
            SLEEPER RESPONSE
          </p>
          <h2
            style={{
              marginTop: "8px",
              fontSize: "24px",
            }}
          >
            {response.status}
          </h2>
          <pre style={preStyle}>
            {errorText ||
              "Sleeper returned no error message."}
          </pre>
        </article>
      </main>
    );
  }
  const stats =
    (await response.json()) as PlayerStats;
  const starterIds = Array.from(
    new Set(
      matchups.flatMap(
        (matchup) =>
          matchup.starters ?? []
      )
    )
  );
  const startersWithStats =
    starterIds.filter(
      (playerId) =>
        stats[playerId] !== undefined
    );
  const startersWithPoints =
    starterIds.filter(
      (playerId) => {
        const playerStats =
          stats[playerId];
        if (!playerStats) {
          return false;
        }
        return (
          playerStats.pts_ppr !==
            undefined ||
          playerStats.pts_half_ppr !==
            undefined ||
          playerStats.pts_std !==
            undefined
        );
      }
    );
  const firstStarter =
    starterIds[0] ?? null;
  const firstStarterStats =
    firstStarter
      ? stats[firstStarter]
      : null;
  const firstPlayerWithStats =
    startersWithPoints[0] ?? null;
  const firstPlayerWithStatsData =
    firstPlayerWithStats
      ? stats[firstPlayerWithStats]
      : null;
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
          TOTAL STARTERS
        </p>
        <h2 style={valueStyle}>
          {starterIds.length}
        </h2>
      </article>
      <article style={cardStyle}>
        <p style={labelStyle}>
          STARTERS FOUND IN STATS
        </p>
        <h2 style={valueStyle}>
          {startersWithStats.length}
        </h2>
      </article>
      <article style={cardStyle}>
        <p style={labelStyle}>
          STARTERS WITH FANTASY POINTS
        </p>
        <h2 style={valueStyle}>
          {startersWithPoints.length}
        </h2>
      </article>
      <article style={cardStyle}>
        <p style={labelStyle}>
          FIRST STARTER
        </p>
        <p
          style={{
            marginTop: "10px",
            color: "#ffffff",
            fontWeight: "600",
          }}
        >
          Player ID:{" "}
          {firstStarter ?? "None"}
        </p>
        <pre style={preStyle}>
          {JSON.stringify(
            firstStarterStats,
            null,
            2
          )}
        </pre>
      </article>
      <article style={cardStyle}>
        <p style={labelStyle}>
          FIRST STARTER WITH FANTASY POINTS
        </p>
        <p
          style={{
            marginTop: "10px",
            color: "#ffffff",
            fontWeight: "600",
          }}
        >
          Player ID:{" "}
          {firstPlayerWithStats ??
            "None"}
        </p>
        <pre style={preStyle}>
          {JSON.stringify(
            firstPlayerWithStatsData,
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