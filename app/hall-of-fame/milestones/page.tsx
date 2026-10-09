
import { getPlayerRecords } from "../../../lib/playerRecords";

import {
  getPlayers,
  getPlayerName,
} from "../../../lib/players";

import {
  calculateLegacyMilestones,
  LEGACY_MILESTONES,
  MILESTONE_BONUSES,
} from "../../../lib/legacyMilestones";

import type {
  AllSlootPosition,
  AllSlootPlayerDirectory,
} from "../../../lib/allSloot";

const POSITIONS: AllSlootPosition[] = [
  "QB",
  "RB",
  "WR",
  "TE",
];

const BORDER = "1px solid #263244";
const MUTED = "#9da7b3";

function formatNumber(value: number): string {
  return value.toLocaleString("en-AU", {
    maximumFractionDigits: 2,
  });
}

function median(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort(
    (a, b) => a - b
  );

  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 1) {
    return sorted[middle];
  }

  return (
    (sorted[middle - 1] + sorted[middle]) / 2
  );
}

export default async function MilestoneAnalysisPage() {
  const [records, players] = await Promise.all([
    getPlayerRecords(),
    getPlayers(),
  ]);

  const currentYear = new Date().getUTCFullYear();
  const completedThroughSeason = currentYear - 1;

  const directory: AllSlootPlayerDirectory =
    Object.fromEntries(
      Object.entries(players).map(([id, player]) => [
        id,
        {
          name: getPlayerName(player),
          position: player.position,
        },
      ])
    );

  const careers = calculateLegacyMilestones(
    records,
    directory,
    completedThroughSeason
  );

  return (
    <main
      style={{
        maxWidth: "1000px",
        margin: "0 auto",
        padding: "24px 12px 110px",
      }}
    >
      <a
        href="/hall-of-fame"
        style={{
          color: MUTED,
          fontSize: "13px",
          textDecoration: "none",
        }}
      >
        ← Back to Hall of Fame
      </a>

      <h1
        style={{
          fontSize: "26px",
          fontWeight: 800,
          marginTop: "20px",
          marginBottom: "8px",
        }}
      >
        SFL Career Milestone Analysis
      </h1>

      <p
        style={{
          color: MUTED,
          fontSize: "13px",
          lineHeight: 1.6,
          marginBottom: "26px",
        }}
      >
        Career scoring totals from completed SFL
        regular seasons through{" "}
        {completedThroughSeason}. Only points scored
        in starting lineups count. Playoff points
        are excluded.
      </p>

      {POSITIONS.map((position) => {
        const positionCareers = careers
          .filter(
            (player) => player.position === position
          )
          .sort(
            (a, b) =>
              b.regularSeasonPoints -
              a.regularSeasonPoints
          );

        const topPlayers = positionCareers.slice(
          0,
          15
        );

        const totals = positionCareers.map(
          (player) => player.regularSeasonPoints
        );

        const maximum = Math.max(0, ...totals);

        const positionMedian = median(totals);

        const thresholds =
          LEGACY_MILESTONES[position];

        return (
          <section
            key={position}
            style={{
              marginBottom: "34px",
            }}
          >
            <h2
              style={{
                fontSize: "21px",
                fontWeight: 800,
                marginBottom: "12px",
              }}
            >
              {position} Career Scoring
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(3, minmax(0, 1fr))",
                gap: "8px",
                marginBottom: "16px",
              }}
            >
              {[
                {
                  label: "Players",
                  value: positionCareers.length,
                },
                {
                  label: "Highest",
                  value: formatNumber(maximum),
                },
                {
                  label: "Median",
                  value: formatNumber(positionMedian),
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    background: "#202833",
                    border: BORDER,
                    borderRadius: "9px",
                    padding: "12px 8px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      color: MUTED,
                      fontSize: "11px",
                      marginBottom: "5px",
                    }}
                  >
                    {stat.label}
                  </div>

                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: "17px",
                    }}
                  >
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                border: BORDER,
                borderRadius: "10px",
                overflow: "hidden",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  padding: "12px",
                  background: "#202833",
                  fontWeight: 700,
                  fontSize: "12px",
                }}
              >
                CURRENT MILESTONE THRESHOLDS
              </div>

              {thresholds.map((threshold, index) => {
                const achieved = positionCareers.filter(
                  (player) =>
                    player.regularSeasonPoints >=
                    threshold
                ).length;

                return (
                  <div
                    key={threshold}
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "1fr auto auto",
                      gap: "12px",
                      alignItems: "center",
                      padding: "11px 12px",
                      borderTop: BORDER,
                      fontSize: "12px",
                    }}
                  >
                    <span>
                      {formatNumber(threshold)} pts
                    </span>

                    <span style={{ color: MUTED }}>
                      {achieved} players
                    </span>

                    <strong>
                      +{MILESTONE_BONUSES[index]}
                    </strong>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                border: BORDER,
                borderRadius: "10px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "minmax(0, 1fr) 78px 40px 40px",
                  gap: "6px",
                  padding: "12px 8px",
                  background: "#202833",
                  color: MUTED,
                  fontSize: "10px",
                  fontWeight: 700,
                }}
              >
                <span>PLAYER</span>
                <span style={{ textAlign: "right" }}>
                  POINTS
                </span>
                <span style={{ textAlign: "center" }}>
                  GP
                </span>
                <span style={{ textAlign: "center" }}>
                  YRS
                </span>
              </div>

              {topPlayers.map((player, index) => (
                <div
                  key={player.playerId}
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "minmax(0, 1fr) 78px 40px 40px",
                    gap: "6px",
                    padding: "12px 8px",
                    alignItems: "center",
                    borderTop: BORDER,
                    fontSize: "12px",
                  }}
                >
                  <span
                    style={{
                      overflowWrap: "anywhere",
                    }}
                  >
                    <span
                      style={{
                        color: MUTED,
                        marginRight: "7px",
                      }}
                    >
                      {index + 1}.
                    </span>
                    <strong>{player.name}</strong>
                  </span>

                  <strong
                    style={{
                      textAlign: "right",
                    }}
                  >
                    {formatNumber(
                      player.regularSeasonPoints
                    )}
                  </strong>

                  <span
                    style={{
                      textAlign: "center",
                      color: MUTED,
                    }}
                  >
                    {player.regularSeasonStarts}
                  </span>

                  <span
                    style={{
                      textAlign: "center",
                      color: MUTED,
                    }}
                  >
                    {player.seasonsPlayed}
                  </span>
                </div>
              ))}

              {topPlayers.length === 0 && (
                <p
                  style={{
                    padding: "14px",
                    color: MUTED,
                    fontSize: "12px",
                  }}
                >
                  No career scoring records found.
                </p>
              )}
            </div>
          </section>
        );
      })}
    </main>
  );
}
