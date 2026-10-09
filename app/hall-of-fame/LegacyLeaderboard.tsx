
"use client";

import { useState } from "react";

import type {
  LegacyScore,
} from "../../lib/legacyScore";

type Props = {
  scores: LegacyScore[];
};

const BORDER = "1px solid #263244";
const MUTED = "#9da7b3";

function formatNumber(value: number): string {
  return value.toLocaleString("en-AU");
}

function categoryBar(
  label: string,
  points: number,
  total: number
) {
  return (
    <div
      key={label}
      style={{ marginBottom: "13px" }}
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
        <span>{label}</span>
        <strong>{formatNumber(points)}</strong>
      </div>

      <div
        style={{
          height: "7px",
          background: "#263244",
          borderRadius: "10px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${
              total > 0
                ? (points / total) * 100
                : 0
            }%`,
            background: "#4388c7",
          }}
        />
      </div>
    </div>
  );
}

export default function LegacyLeaderboard({
  scores,
}: Props) {
  const [expandedPlayer, setExpandedPlayer] =
    useState<string | null>(null);

  const [showAll, setShowAll] = useState(false);

  const visibleScores = showAll
    ? scores
    : scores.slice(0, 20);

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
              "minmax(0, 1fr) 90px 20px",
            gap: "8px",
            padding: "12px",
            background: "#202833",
            color: MUTED,
            fontSize: "11px",
            fontWeight: 700,
          }}
        >
          <span>PLAYER</span>
          <span style={{ textAlign: "right" }}>
            LEGACY
          </span>
          <span />
        </div>

        {visibleScores.map((player, index) => {
          const expanded =
            expandedPlayer === player.playerId;

          return (
            <div
              key={player.playerId}
              style={{ borderTop: BORDER }}
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
                    "minmax(0, 1fr) 90px 20px",
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
                    textAlign: "right",
                    fontWeight: 800,
                    fontSize: "14px",
                  }}
                >
                  {formatNumber(
                    player.totalLegacyPoints
                  )}
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
                  <div
                    style={{
                      marginBottom: "18px",
                    }}
                  >
                    <div
                      style={{
                        color: MUTED,
                        fontSize: "11px",
                        marginBottom: "4px",
                      }}
                    >
                      TOTAL SFL LEGACY POINTS
                    </div>

                    <div
                      style={{
                        fontSize: "27px",
                        fontWeight: 800,
                      }}
                    >
                      {formatNumber(
                        player.totalLegacyPoints
                      )}
                    </div>
                  </div>

                  {categoryBar(
                    "Seasonal Greatness",
                    player.seasonalGradePoints,
                    player.totalLegacyPoints
                  )}

                  {categoryBar(
                    "All-Sloot Honours",
                    player.allSlootHonoursPoints,
                    player.totalLegacyPoints
                  )}

                  {categoryBar(
                    "Career Milestones",
                    player.careerMilestonePoints,
                    player.totalLegacyPoints
                  )}

                  {categoryBar(
                    "Playoff Legacy",
                    player.playoffLegacyPoints,
                    player.totalLegacyPoints
                  )}

                  <div
                    style={{
                      borderTop: BORDER,
                      marginTop: "18px",
                      paddingTop: "15px",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "14px",
                        marginBottom: "12px",
                      }}
                    >
                      Career Achievements
                    </h3>

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
                          value: player.legendarySeasons,
                        },
                        {
                          label: "Elite",
                          value: player.eliteSeasons,
                        },
                        {
                          label: "Great",
                          value: player.greatSeasons,
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
                        marginBottom: "14px",
                      }}
                    >
                      <strong>
                        {player.qualifyingGreatSeasons}
                      </strong>{" "}
                      qualifying great seasons
                    </p>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "12px",
                        fontSize: "12px",
                      }}
                    >
                      {[
                        {
                          label: "First Team",
                          value:
                            player.firstTeamSelections,
                        },
                        {
                          label: "Second Team",
                          value:
                            player.secondTeamSelections,
                        },
                        {
                          label: "Rookie Team",
                          value:
                            player.rookieTeamSelections,
                        },
                        {
                          label: "Regular Season Starts",
                          value:
                            player.regularSeasonStarts,
                        },
                        {
                          label: "Regular Season Points",
                          value:
                            player.regularSeasonPoints.toFixed(
                              2
                            ),
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
                  </div>

                  {player.milestones.length > 0 && (
                    <div
                      style={{
                        borderTop: BORDER,
                        marginTop: "18px",
                        paddingTop: "15px",
                      }}
                    >
                      <h3
                        style={{
                          fontSize: "14px",
                          marginBottom: "10px",
                        }}
                      >
                        Career Milestones
                      </h3>

                      {player.milestones.map(
                        (milestone) => (
                          <div
                            key={milestone.tier}
                            style={{
                              display: "flex",
                              justifyContent:
                                "space-between",
                              gap: "8px",
                              padding: "8px 0",
                              fontSize: "12px",
                              borderBottom: BORDER,
                            }}
                          >
                            <span>
                              {formatNumber(
                                milestone.requiredPoints
                              )}{" "}
                              career points
                            </span>

                            <strong>
                              +{milestone.legacyPoints}
                            </strong>
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {player.playoffAwards.length > 0 && (
                    <div
                      style={{
                        borderTop: BORDER,
                        marginTop: "18px",
                        paddingTop: "15px",
                      }}
                    >
                      <h3
                        style={{
                          fontSize: "14px",
                          marginBottom: "10px",
                        }}
                      >
                        Playoff Achievements
                      </h3>

                      {player.playoffAwards.map(
                        (award, index) => (
                          <div
                            key={`${award.season}-${award.award}-${index}`}
                            style={{
                              display: "flex",
                              justifyContent:
                                "space-between",
                              gap: "8px",
                              padding: "8px 0",
                              fontSize: "12px",
                              borderBottom: BORDER,
                            }}
                          >
                            <span>
                              {award.season} ·{" "}
                              {award.award}
                            </span>

                            <strong>
                              +{award.points}
                            </strong>
                          </div>
                        )
                      )}
                    </div>
                  )}

                  <div
                    style={{
                      borderTop: BORDER,
                      marginTop: "18px",
                      paddingTop: "15px",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "14px",
                        marginBottom: "10px",
                      }}
                    >
                      Season-by-Season Grades
                    </h3>

                    {player.seasonalGrades.map(
                      (season, index) => (
                        <div
                          key={`${season.season}-${index}`}
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "48px 1fr auto",
                            alignItems: "center",
                            gap: "8px",
                            padding: "9px 0",
                            borderBottom: BORDER,
                            fontSize: "12px",
                          }}
                        >
                          <strong>{season.season}</strong>

                          <span style={{ color: MUTED }}>
                            #{season.rank} ·{" "}
                            {season.points.toFixed(2)} pts
                          </span>

                          <strong>{season.grade}</strong>
                        </div>
                      )
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
        <p>No SFL Legacy candidates found.</p>
      )}
    </section>
  );
}
