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

  const firstStarter =
    matchups.find(
      (matchup) =>
        matchup.starters &&
        matchup.starters.length > 0
    )?.starters?.[0];

  const firstStarterStats =
    firstStarter
      ? stats[firstStarter]
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

      <h1>Player Points Diagnostic</h1>

      <p
        style={{
          marginTop: "8px",
          marginBottom: "28px",
        }}
      >
        2026 · Week {WEEK}
      </p>

      <article
        style={{
          background: "#151b23",
          border: "1px solid #27303b",
          borderRadius: "18px",
          padding: "18px",
          marginBottom: "12px",
        }}
      >
        <p
          style={{
            fontSize: "11px",
            fontWeight: "700",
            letterSpacing: "1px",
            color: "#687384",
          }}
        >
          FIRST STARTER FOUND
        </p>

        <p
          style={{
            marginTop: "10px",
          }}
        >
          Player ID:
        </p>

        <p
          style={{
            marginTop: "4px",
            color: "#ffffff",
            fontWeight: "600",
          }}
        >
          {firstStarter ?? "None"}
        </p>
      </article>

      <article
        style={{
          background: "#151b23",
          border: "1px solid #27303b",
          borderRadius: "18px",
          padding: "18px",
          marginBottom: "12px",
        }}
      >
        <p
          style={{
            fontSize: "11px",
            fontWeight: "700",
            letterSpacing: "1px",
            color: "#687384",
          }}
        >
          RAW SLEEPER PLAYER STATS
        </p>

        <pre
          style={{
            marginTop: "14px",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontSize: "12px",
            lineHeight: "1.5",
            color: "#ffffff",
          }}
        >
          {JSON.stringify(
            firstStarterStats,
            null,
            2
          )}
        </pre>
      </article>
    </main>
  );
}