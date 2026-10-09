
"use client";

import { useState } from "react";
import type { HallOfFameScore } from "../../lib/hallOfFame";

type Props = {
  scores: HallOfFameScore[];
};

function formatPoints(value: number): string {
  return value.toFixed(2);
}

export default function HallOfFameLeaderboard({
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
          border: "1px solid #263244",
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
            color: "#9da7b3",
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

          return (
            <div
              key={player.playerId}
              style={{
                borderTop: "1px solid #263244",
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
                      color: "#9da7b3",
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
                        color: "#9da7b3",
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
                    color: "#9da7b3",
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
                    borderTop: "1px solid #263244",
                  }}
                >
                  <p
                    style={{
                      fontWeight: 700,
                      fontSize: "12px",
                      marginBottom: "14px",
                    }}
                  >
                    Hall of Fame Score:{" "}
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
                      style={{ marginBottom: "12px" }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
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
                      borderTop: "1px solid #263244",
                      paddingTop: "12px",
                      marginTop: "14px",
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "12px",
                      fontSize: "12px",
                    }}
                  >
                    <div>
                      <div style={{ color: "#9da7b3" }}>
                        Regular Season Points
                      </div>
                      <strong>
                        {formatPoints(
                          player.regularSeasonPoints
                        )}
                      </strong>
                    </div>

                    <div>
                      <div style={{ color: "#9da7b3" }}>
                        Regular Season Starts
                      </div>
                      <strong>
                        {player.regularSeasonStarts}
                      </strong>
                    </div>

                    <div>
                      <div style={{ color: "#9da7b3" }}>
                        Playoff Points
                      </div>
                      <strong>
                        {formatPoints(
                          player.playoffPoints
                        )}
                      </strong>
                    </div>

                    <div>
                      <div style={{ color: "#9da7b3" }}>
                        Playoff Starts
                      </div>
                      <strong>
                        {player.playoffStarts}
                      </strong>
                    </div>
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
            border: "1px solid #263244",
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
