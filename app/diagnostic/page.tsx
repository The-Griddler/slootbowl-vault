import { getMatchups } from "../../lib/sleeper";

const LEAGUE_ID = "1326512818865868800";
const WEEK = 1;

type PlayerStats = {
  fantasy_points?: number;
  pts_ppr?: number;
};

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

  const stats: Record<
    string,
    PlayerStats
  > = await response.json();

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

      {matchups.map((matchup, index) => {
        let calculatedScore = 0;

        const starters =
          matchup.starters ?? [];

        for (const playerId of starters) {
          const playerStats =
            stats[playerId];

          if (!playerStats) {
            continue;
          }

          calculatedScore +=
            playerStats.fantasy_points ??
            playerStats.pts_ppr ??
            0;
        }

        return (
          <article
            key={`${matchup.roster_id}-${index}`}
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
              ROSTER {matchup.roster_id}
            </p>

            <h2
              style={{
                margin: "6px 0 18px",
                fontSize: "20px",
              }}
            >
              Score comparison
            </h2>

            <p>
              <strong>
                Sleeper official score:
              </strong>{" "}
              {matchup.points.toFixed(2)}
            </p>

            <p
              style={{
                marginTop: "8px",
              }}
            >
              <strong>
                Calculated starter total:
              </strong>{" "}
              {calculatedScore.toFixed(2)}
            </p>

            <p
              style={{
                marginTop: "8px",
              }}
            >
              <strong>
                Difference:
              </strong>{" "}
              {(
                calculatedScore -
                matchup.points
              ).toFixed(2)}
            </p>

            <p
              style={{
                marginTop: "14px",
                fontSize: "12px",
                color: "#687384",
              }}
            >
              Starters found:{" "}
              {starters.length}
            </p>
          </article>
        );
      })}
    </main>
  );
}