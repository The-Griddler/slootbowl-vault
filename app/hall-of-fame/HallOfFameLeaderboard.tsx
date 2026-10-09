
"use client";

import { useState } from "react";

import type {
  HallOfFameScore,
} from "../../lib/hallOfFame";

import type {
  SFLPlayerGradeCareer,
  SFLSeasonGrade,
} from "../../lib/seasonGrades";

type Props = {
  scores: HallOfFameScore[];
  gradeCareers?: SFLPlayerGradeCareer[];
};

const MUTED = "#9da7b3";
const BORDER = "1px solid #263244";

function formatPoints(value: number): string {
  return value.toFixed(2);
}

function gradeColor(
  grade: SFLSeasonGrade
): string {
  switch (grade) {
    case "Legendary":
      return "#f5c76a";
    case "Elite":
      return "#85b9ff";
    case "Great":
      return "#80d4a0";
    case "Good":
      return "#d2b5fa";
    case "Ordinary":
      return "#aab3c0";
    default:
      return "#778391";
  }
}

export default function HallOfFameLeaderboard({
  scores,
  gradeCareers = [],
}: Props) {
  const [expandedPlayer, setExpandedPlayer] =
    useState<string | null>(null);

  const [showAll, setShowAll] = useState(false);

  const visibleScores = showAll
    ? scores
    : scores.slice(0, 20);

  const gradesByPlayer = new Map(
    gradeCareers.map((career) => [
      career.playerId,
      career,
    ])
  );

  return (
    <section>
      <div
        style={{
          border: BORDER,
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(0, 1fr) 65px 20px",
            gap: "8px",
            padding: "12px",
            background: "#202833",
            color: MUTED,
            fontSize: "11px",
            fontWeight: 700,
          }}
        >
          <span>PLAYER</span>
          <span style={{ textAlign: "center" }}>
            SCORE
          </span>
          <span />
        </div>

        {visibleScores.map((player, index) => {
          const expanded =
            expandedPlayer === player.playerId;

          const career = gradesByPlayer.get(
            player.playerId
          );

          return (
            <div
              key={player.playerId}
              style={{
                borderTop: BORDER,
              }}
            >
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() =>
                  setExpandedPlayer(
                    expanded ? null : player.playerId
                  )
                }
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "minmax(0, 1fr) 65px 20px",
                  gap: "8px",
                  width: "100%",
                  padding: "13px 12px",
                  background: expanded
                    ? "#202833"
                    : "transparent",
                  border: "none",
                  color: "inherit",
                  textAlign: "left",
                  cursor: "pointer",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: "9px",
                    alignItems: "center",
                    minWidth: 0,
                  }}
                >
                  <span
                    style={{
                      color: MUTED,
                      fontSize: "11px",
                      minWidth: "19px",
                    }}
                  >
                    {index + 1}
                  </span>

                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        overflowWrap: "anywhere",
                      }}
                    >
                      {player.name}
                    </div>

                    <div
                      style={{
                        color: MUTED,
                        fontSize: "11px",
                        marginTop: "3px",
                      }}
                    >
                      {player.position} ·{" "}
                      {player.seasonsPlayed} SFL seasons
                    </div>
                  </div>
                </div>

                <span
                  style={{
                    textAlign: "center",
                    fontWeight: 800,
                    fontSize: "14px",
                  }}
                >
                  {player.totalScore.toFixed(1)}
                </span>

                <span
                  style={{
                    color: MUTED,
                    fontSize: "12px",
                    textAlign: "center",
                  }}
                >
                  {expanded ? "▲" : "▼"}
                </span>
              </button>

              {expanded && (
                <div
                  style={{
                    background: "#151b23",
                    padding: "14px",
                    borderTop: BORDER,
                  }}
                >
                  <p
                    style={{
                      fontWeight: 700,
                      fontSize: "12px",
                      marginBottom: "14px",
                    }}
                  >
                    Provisional Hall of Fame Score:{" "}
                    {player.totalScore.toFixed(2)} / 100
                  </p>

                  {[
                    {
                      label: "Career Production",
                      score: player.careerProduction,
                      max: 35,
                    },
                    {
                      label: "Peak Dominance",
                      score: player.peakDominance,
                      max: 30,
                    },
                    {
                      label: "All-Sloot Honours",
                      score: player.allSlootHonours,
                      max: 20,
                    },
                    {
                      label: "Playoff Legacy",
                      score: player.playoffLegacy,
                      max: 15,
                    },
                  ].map((category) => (
                    <div
                      key={category.label}
                      style={{
                        marginBottom: "12px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: "8px",
                          fontSize: "12px",
                          marginBottom: "6px",
                        }}
                      >
                        <span>{category.label}</span>
                        <span>
                          {category.score.toFixed(2)} /{" "}
                          {category.max}
                        </span>
                      </div>

                      <div
                        style={{
                          height: "6px",
                          borderRadius: "10px",
                          background: "#263244",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${
                              (category.score /
                                category.max) *
                              100
                            }%`,
                            height: "100%",
                            background: "#4388c7",
                          }}
                        />
                      </div>
                    </div>
                  ))}

                  <div
                    style={{
                      borderTop: BORDER,
                      paddingTop: "12px",
                      marginTop: "14px",
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "12px",
                      fontSize: "12px",
                    }}
                  >
                    {[
                      {
                        label: "Regular Season Points",
                        value: formatPoints(
                          player.regularSeasonPoints
                        ),
                      },
                      {
                        label: "Regular Season Starts",
                        value: player.regularSeasonStarts,
                      },
                      {
                        label: "Playoff Points",
                        value: formatPoints(
                          player.playoffPoints
                        ),
                      },
                      {
                        label: "Playoff Starts",
                        value: player.playoffStarts,
                      },
                    ].map((stat) => (
                      <div key={stat.label}>
                        <div style={{ color: MUTED }}>
                          {stat.label}
                        </div>
                        <strong>{stat.value}</strong>
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      borderTop: BORDER,
                      marginTop: "18px",
                      paddingTop: "16px",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "14px",
                        marginBottom: "12px",
                      }}
                    >
                      SFL Seasonal Grades
                    </h3>

                    {career ? (
                      <>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(3, minmax(0, 1fr))",
                            gap: "8px",
                            marginBottom: "14px",
                          }}
                        >
                          {[
                            {
                              label: "Legendary",
                              value: career.legendary,
                            },
                            {
                              label: "Elite",
                              value: career.elite,
                            },
                            {
                              label: "Great",
                              value: career.great,
                            },
                          ].map((item) => (
                            <div
                              key={item.label}
                              style={{
                                background: "#202833",
                                borderRadius: "8px",
                                padding: "10px 6px",
                                textAlign: "center",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "20px",
                                  fontWeight: 800,
                                }}
                              >
                                {item.value}
                              </div>
                              <div
                                style={{
                                  color: MUTED,
                                  fontSize: "11px",
                                }}
                              >
                                {item.label}
                              </div>
                            </div>
                          ))}
                        </div>

                        <p
                          style={{
                            fontSize: "12px",
                            marginBottom: "12px",
                          }}
                        >
                          <strong>
                            {career.qualifyingSeasons}
                          </strong>{" "}
                          qualifying great seasons
                        </p>

                        <div
                          style={{
                            border: BORDER,
                            borderRadius: "8px",
                            overflow: "hidden",
                          }}
                        >
                          {career.seasons.map(
                            (season, index) => (
                              <div
                                key={season.season}
                                style={{
                                  display: "grid",
                                  gridTemplateColumns:
                                    "48px 1fr auto",
                                  alignItems: "center",
                                  gap: "8px",
                                  padding: "10px",
                                  borderTop:
                                    index === 0
                                      ? "none"
                                      : BORDER,
                                  fontSize: "12px",
                                }}
                              >
                                <strong>
                                  {season.season}
                                </strong>

                                <span
                                  style={{
                                    color: MUTED,
                                  }}
                                >
                                  {season.position} #
                                  {season.rank} ·{" "}
                                  {season.points.toFixed(2)}{" "}
                                  pts
                                </span>

                                <span
                                  style={{
                                    color: gradeColor(
                                      season.grade
                                    ),
                                    fontWeight: 700,
                                    fontSize: "11px",
                                  }}
                                >
                                  {season.grade}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </>
                    ) : (
                      <p
                        style={{
                          color: MUTED,
                          fontSize: "12px",
                        }}
                      >
                        No completed-season grades
                        available.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {scores.length > 20 && (
        <button
          type="button"
          onClick={() =>
            setShowAll((previous) => !previous)
          }
          style={{
            display: "block",
            width: "100%",
            marginTop: "16px",
            padding: "14px",
            border: BORDER,
            borderRadius: "10px",
            background: "#202833",
            color: "#ffffff",
            fontWeight: 700,
            fontSize: "13px",
            cursor: "pointer",
          }}
        >
          {showAll
            ? "Show Top 20"
            : `Show All ${scores.length} Players`}
        </button>
      )}

      {scores.length === 0 && (
        <p>No Hall of Fame candidates found.</p>
      )}
    </section>
  );
}
