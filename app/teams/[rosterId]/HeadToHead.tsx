
"use client";

import { useMemo, useState } from "react";
import type { HistoricalMatchup } from "../../../lib/sleeper";

type Phase = "Regular Season" | "Main Playoffs";

type Game = {
  year: string;
  week: number;
  opponent: number;
  scored: number;
  conceded: number;
  margin: number;
};

type Rivalry = {
  opponent: number;
  games: Game[];
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  biggestWin: Game | null;
  closestGame: Game | null;
};

type HeadToHeadProps = {
  rosterId: number;
  matchups: HistoricalMatchup[];
  franchiseNames: Record<number, string>;
};

function formatPoints(value: number) {
  return value.toFixed(2);
}

function recordLabel(rivalry: Rivalry) {
  return `${rivalry.wins}-${rivalry.losses}-${rivalry.ties}`;
}

function SummaryStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          color: "#ffffff",
          fontSize: "20px",
          fontWeight: "800",
        }}
      >
        {value}
      </div>
      <div
        style={{
          color: "#9da7b3",
          fontSize: "10px",
          marginTop: "5px",
        }}
      >
        {label}
      </div>
    </div>
  );
}

export default function HeadToHead({
  rosterId,
  matchups,
  franchiseNames,
}: HeadToHeadProps) {
  const [phase, setPhase] =
    useState<Phase>("Regular Season");

  const [selectedOpponent, setSelectedOpponent] =
    useState<number | null>(null);

  const rivalries = useMemo(() => {
    const games: Game[] = matchups
      .filter(
        (matchup) =>
          matchup.phase === phase &&
          (matchup.rosterA === rosterId ||
            matchup.rosterB === rosterId) &&
          Number.isFinite(matchup.scoreA) &&
          Number.isFinite(matchup.scoreB) &&
          (matchup.scoreA !== 0 ||
            matchup.scoreB !== 0)
      )
      .map((matchup) => {
        const isA = matchup.rosterA === rosterId;

        const scored = isA
          ? matchup.scoreA
          : matchup.scoreB;

        const conceded = isA
          ? matchup.scoreB
          : matchup.scoreA;

        return {
          year: matchup.season,
          week: matchup.week,
          opponent: isA
            ? matchup.rosterB
            : matchup.rosterA,
          scored,
          conceded,
          margin: scored - conceded,
        };
      });

    const opponents = Object.keys(franchiseNames)
      .map(Number)
      .filter((id) => id !== rosterId);

    const results: Rivalry[] = opponents.map(
      (opponent) => {
        const opponentGames = games
          .filter(
            (game) => game.opponent === opponent
          )
          .sort(
            (a, b) =>
              Number(b.year) - Number(a.year) ||
              b.week - a.week
          );

        const wins = opponentGames.filter(
          (game) => game.margin > 0
        ).length;

        const losses = opponentGames.filter(
          (game) => game.margin < 0
        ).length;

        const ties = opponentGames.filter(
          (game) => game.margin === 0
        ).length;

        const pointsFor = opponentGames.reduce(
          (sum, game) => sum + game.scored,
          0
        );

        const pointsAgainst = opponentGames.reduce(
          (sum, game) => sum + game.conceded,
          0
        );

        const victories = opponentGames.filter(
          (game) => game.margin > 0
        );

        const biggestWin =
          [...victories].sort(
            (a, b) => b.margin - a.margin
          )[0] ?? null;

        const closestGame =
          [...opponentGames].sort(
            (a, b) =>
              Math.abs(a.margin) -
              Math.abs(b.margin)
          )[0] ?? null;

        return {
          opponent,
          games: opponentGames,
          wins,
          losses,
          ties,
          pointsFor,
          pointsAgainst,
          biggestWin,
          closestGame,
        };
      }
    );

    return results.sort(
      (a, b) =>
        b.games.length - a.games.length ||
        a.opponent - b.opponent
    );
  }, [rosterId, matchups, franchiseNames, phase]);

  const activeRivalry =
    rivalries.find(
      (rivalry) =>
        rivalry.opponent === selectedOpponent
    ) ?? null;

  return (
    <section style={{ marginTop: "24px" }}>
      <h2 style={{ fontSize: "21px" }}>
        Head-to-Head Rivalries
      </h2>

      <p
        style={{
          color: "#9da7b3",
          fontSize: "12px",
          marginTop: "8px",
          lineHeight: "1.6",
        }}
      >
        Every SFL meeting since 2022.
        Regular-season and main playoff results
        are tracked separately.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "8px",
          marginTop: "20px",
        }}
      >
        {(
          [
            "Regular Season",
            "Main Playoffs",
          ] as Phase[]
        ).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => {
              setPhase(option);
              setSelectedOpponent(null);
            }}
            style={{
              padding: "12px 6px",
              background:
                phase === option
                  ? "#303b48"
                  : "#151b23",
              color:
                phase === option
                  ? "#ffffff"
                  : "#9da7b3",
              border: "1px solid #27303b",
              borderRadius: "10px",
              fontSize: "12px",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            {option === "Main Playoffs"
              ? "Playoffs"
              : option}
          </button>
        ))}
      </div>

      <h3
        style={{
          fontSize: "17px",
          marginTop: "28px",
          marginBottom: "14px",
        }}
      >
        All Opponents
      </h3>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        {rivalries.map((rivalry) => {
          const expanded =
            selectedOpponent === rivalry.opponent;

          const totalGames = rivalry.games.length;

          const winPercentage = totalGames
            ? (
                ((rivalry.wins +
                  rivalry.ties / 2) /
                  totalGames) *
                100
              ).toFixed(1)
            : "—";

          return (
            <div
              key={rivalry.opponent}
              style={{
                background: "#151b23",
                border: expanded
                  ? "1px solid #64748b"
                  : "1px solid #27303b",
                borderRadius: "14px",
                overflow: "hidden",
              }}
            >
              <button
                type="button"
                onClick={() =>
                  setSelectedOpponent(
                    expanded
                      ? null
                      : rivalry.opponent
                  )
                }
                aria-expanded={expanded}
                style={{
                  width: "100%",
                  padding: "16px",
                  background: "transparent",
                  border: "none",
                  color: "#ffffff",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <div
                    style={{
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: "800",
                      }}
                    >
                      {franchiseNames[
                        rivalry.opponent
                      ] ??
                        `Roster ${rivalry.opponent}`}
                    </div>

                    <div
                      style={{
                        color: "#9da7b3",
                        fontSize: "11px",
                        marginTop: "6px",
                      }}
                    >
                      {totalGames} meetings ·{" "}
                      {winPercentage === "—"
                        ? "No record"
                        : `${winPercentage}% wins`}
                    </div>
                  </div>

                  <div
                    style={{
                      textAlign: "right",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        fontSize: "18px",
                        fontWeight: "800",
                        color:
                          rivalry.wins > rivalry.losses
                            ? "#86efac"
                            : rivalry.wins <
                                rivalry.losses
                              ? "#fca5a5"
                              : "#ffffff",
                      }}
                    >
                      {recordLabel(rivalry)}
                    </div>

                    <div
                      style={{
                        color: "#9da7b3",
                        fontSize: "11px",
                        marginTop: "5px",
                      }}
                    >
                      {expanded
                        ? "Hide details ▲"
                        : "View rivalry ▼"}
                    </div>
                  </div>
                </div>
              </button>

              {expanded && (
                <div
                  style={{
                    borderTop: "1px solid #27303b",
                    padding: "16px",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(3, minmax(0, 1fr))",
                      gap: "12px",
                    }}
                  >
                    <SummaryStat
                      label="Points Scored"
                      value={formatPoints(
                        rivalry.pointsFor
                      )}
                    />

                    <SummaryStat
                      label="Points Conceded"
                      value={formatPoints(
                        rivalry.pointsAgainst
                      )}
                    />

                    <SummaryStat
                      label="Point Difference"
                      value={
                        rivalry.pointsFor -
                          rivalry.pointsAgainst >
                        0
                          ? `+${formatPoints(
                              rivalry.pointsFor -
                                rivalry.pointsAgainst
                            )}`
                          : formatPoints(
                              rivalry.pointsFor -
                                rivalry.pointsAgainst
                            )
                      }
                    />
                  </div>

                  <div
                    style={{
                      marginTop: "22px",
                      fontSize: "12px",
                      lineHeight: "1.9",
                      color: "#cbd5e1",
                    }}
                  >
                    <div>
                      <strong>Biggest Victory:</strong>{" "}
                      {rivalry.biggestWin
                        ? `+${formatPoints(
                            rivalry.biggestWin.margin
                          )} (${rivalry.biggestWin.year}, Week ${rivalry.biggestWin.week})`
                        : "None"}
                    </div>

                    <div>
                      <strong>Closest Encounter:</strong>{" "}
                      {rivalry.closestGame
                        ? `${formatPoints(
                            Math.abs(
                              rivalry.closestGame.margin
                            )
                          )} points (${rivalry.closestGame.year}, Week ${rivalry.closestGame.week})`
                        : "None"}
                    </div>
                  </div>

                  <h4
                    style={{
                      fontSize: "14px",
                      marginTop: "24px",
                      marginBottom: "12px",
                    }}
                  >
                    Matchup History
                  </h4>

                  {rivalry.games.length === 0 ? (
                    <p
                      style={{
                        color: "#9da7b3",
                        fontSize: "12px",
                      }}
                    >
                      No meetings in this competition.
                    </p>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      {rivalry.games.map((game) => (
                        <div
                          key={`${game.year}-${game.week}`}
                          style={{
                            display: "flex",
                            justifyContent:
                              "space-between",
                            alignItems: "center",
                            gap: "10px",
                            padding: "12px",
                            background: "#1d2631",
                            borderRadius: "9px",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                color: "#ffffff",
                                fontSize: "12px",
                                fontWeight: "700",
                              }}
                            >
                              {game.year} · Week{" "}
                              {game.week}
                            </div>

                            <div
                              style={{
                                color:
                                  game.margin > 0
                                    ? "#86efac"
                                    : game.margin < 0
                                      ? "#fca5a5"
                                      : "#9da7b3",
                                fontSize: "11px",
                                marginTop: "4px",
                              }}
                            >
                              {game.margin > 0
                                ? "WIN"
                                : game.margin < 0
                                  ? "LOSS"
                                  : "TIE"}
                            </div>
                          </div>

                          <div
                            style={{
                              color: "#ffffff",
                              fontSize: "13px",
                              fontWeight: "800",
                              textAlign: "right",
                            }}
                          >
                            {formatPoints(game.scored)}
                            {" – "}
                            {formatPoints(game.conceded)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
