
"use client";

import { useMemo, useState } from "react";
import type { HistoricalMatchup } from "../../../lib/sleeper";
import {
  getFranchiseRivalries,
  type OfficialRivalry,
} from "../../../lib/rivalries";

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

function formatMargin(value: number) {
  return `${value > 0 ? "+" : ""}${formatPoints(value)}`;
}

function recordLabel(rivalry: Rivalry) {
  return `${rivalry.wins}-${rivalry.losses}-${rivalry.ties}`;
}

function isPlayed(matchup: HistoricalMatchup) {
  return (
    Number.isFinite(matchup.scoreA) &&
    Number.isFinite(matchup.scoreB) &&
    (matchup.scoreA !== 0 || matchup.scoreB !== 0)
  );
}

function toGame(
  matchup: HistoricalMatchup,
  rosterId: number
): Game {
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
}

function buildRivalry(
  opponent: number,
  games: Game[]
): Rivalry {
  const opponentGames = games
    .filter((game) => game.opponent === opponent)
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

  const biggestWin =
    opponentGames
      .filter((game) => game.margin > 0)
      .sort((a, b) => b.margin - a.margin)[0] ??
    null;

  const closestGame =
    [...opponentGames].sort(
      (a, b) =>
        Math.abs(a.margin) - Math.abs(b.margin)
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

function SummaryStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div style={{ textAlign: "center", minWidth: 0 }}>
      <div
        style={{
          color: "#ffffff",
          fontSize: "18px",
          fontWeight: "800",
          overflowWrap: "anywhere",
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

function MatchupHistory({
  games,
}: {
  games: Game[];
}) {
  if (games.length === 0) {
    return (
      <p
        style={{
          color: "#9da7b3",
          fontSize: "12px",
        }}
      >
        No meetings in this competition.
      </p>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      {games.map((game) => (
        <div
          key={`${game.year}-${game.week}-${game.opponent}`}
          style={{
            display: "flex",
            justifyContent: "space-between",
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
              {game.year} · Week {game.week}
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
  );
}

function RivalryDetails({
  rivalry,
}: {
  rivalry: Rivalry;
}) {
  return (
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
          value={formatPoints(rivalry.pointsFor)}
        />

        <SummaryStat
          label="Points Conceded"
          value={formatPoints(rivalry.pointsAgainst)}
        />

        <SummaryStat
          label="Point Difference"
          value={formatMargin(
            rivalry.pointsFor - rivalry.pointsAgainst
          )}
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
            ? `${formatMargin(
                rivalry.biggestWin.margin
              )} (${rivalry.biggestWin.year}, Week ${rivalry.biggestWin.week})`
            : "None"}
        </div>

        <div>
          <strong>Closest Encounter:</strong>{" "}
          {rivalry.closestGame
            ? `${formatPoints(
                Math.abs(rivalry.closestGame.margin)
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

      <MatchupHistory games={rivalry.games} />
    </div>
  );
}

function OfficialRivalryCard({
  official,
  rivalry,
  rosterId,
  franchiseNames,
}: {
  official: OfficialRivalry;
  rivalry: Rivalry;
  rosterId: number;
  franchiseNames: Record<number, string>;
}) {
  const [expanded, setExpanded] = useState(false);

  const opponentName =
    franchiseNames[rivalry.opponent] ??
    `Roster ${rivalry.opponent}`;

  const latestGame = rivalry.games[0] ?? null;

  const holder =
    latestGame === null
      ? "Not yet contested"
      : latestGame.margin > 0
        ? franchiseNames[rosterId] ??
          `Roster ${rosterId}`
        : latestGame.margin < 0
          ? opponentName
          : "Shared — latest game tied";

  const winPercentage = rivalry.games.length
    ? (
        ((rivalry.wins + rivalry.ties / 2) /
          rivalry.games.length) *
        100
      ).toFixed(1)
    : "—";

  return (
    <div
      style={{
        background: "#151b23",
        border: expanded
          ? "1px solid #facc15"
          : "1px solid #65552a",
        borderRadius: "14px",
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        style={{
          display: "block",
          width: "100%",
          padding: "17px",
          background: "transparent",
          border: "none",
          color: "#ffffff",
          textAlign: "left",
          cursor: "pointer",
        }}
      >
        <div
          style={{
            color: "#facc15",
            fontSize: "10px",
            fontWeight: "800",
            letterSpacing: "1.2px",
            marginBottom: "7px",
          }}
        >
          {official.series === "love-triangle"
            ? "LOVE TRIANGLE SERIES"
            : "OFFICIAL SFL RIVALRY"}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "12px",
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: "18px",
                fontWeight: "800",
              }}
            >
              🏆 {official.name}
            </div>

            <div
              style={{
                color: "#9da7b3",
                fontSize: "12px",
                marginTop: "7px",
              }}
            >
              vs {opponentName}
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
                fontSize: "19px",
                fontWeight: "800",
                color:
                  rivalry.wins > rivalry.losses
                    ? "#86efac"
                    : rivalry.wins < rivalry.losses
                      ? "#fca5a5"
                      : "#ffffff",
              }}
            >
              {recordLabel(rivalry)}
            </div>

            <div
              style={{
                color: "#9da7b3",
                fontSize: "10px",
                marginTop: "5px",
              }}
            >
              {rivalry.games.length} meetings
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: "16px",
            padding: "12px",
            background: "#202a35",
            borderRadius: "10px",
          }}
        >
          <div
            style={{
              fontSize: "10px",
              color: "#9da7b3",
              fontWeight: "700",
              marginBottom: "5px",
            }}
          >
            CURRENT HOLDER
          </div>

          <div
            style={{
              fontSize: "13px",
              fontWeight: "800",
              color: "#facc15",
            }}
          >
            {holder}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(2, minmax(0, 1fr))",
            gap: "12px",
            marginTop: "15px",
          }}
        >
          <div>
            <div
              style={{
                color: "#9da7b3",
                fontSize: "10px",
              }}
            >
              SERIES WIN %
            </div>

            <div
              style={{
                marginTop: "5px",
                fontSize: "14px",
                fontWeight: "800",
              }}
            >
              {winPercentage === "—"
                ? "—"
                : `${winPercentage}%`}
            </div>
          </div>

          <div>
            <div
              style={{
                color: "#9da7b3",
                fontSize: "10px",
              }}
            >
              LATEST MEETING
            </div>

            <div
              style={{
                marginTop: "5px",
                fontSize: "12px",
                fontWeight: "800",
              }}
            >
              {latestGame
                ? `${latestGame.year} · W${latestGame.week}`
                : "None yet"}
            </div>

            {latestGame && (
              <div
                style={{
                  color:
                    latestGame.margin > 0
                      ? "#86efac"
                      : latestGame.margin < 0
                        ? "#fca5a5"
                        : "#9da7b3",
                  fontSize: "11px",
                  marginTop: "4px",
                }}
              >
                {formatPoints(latestGame.scored)}
                {" – "}
                {formatPoints(latestGame.conceded)}
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            color: "#facc15",
            fontSize: "11px",
            fontWeight: "700",
            marginTop: "17px",
            textAlign: "right",
          }}
        >
          {expanded
            ? "Hide rivalry history ▲"
            : "View rivalry history ▼"}
        </div>
      </button>

      {expanded && (
        <RivalryDetails rivalry={rivalry} />
      )}
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

  const [officialPhase, setOfficialPhase] =
    useState<Phase>("Regular Season");

  const allGames = useMemo(
    () =>
      matchups
        .filter(
          (matchup) =>
            (matchup.rosterA === rosterId ||
              matchup.rosterB === rosterId) &&
            (matchup.phase === "Regular Season" ||
              matchup.phase === "Main Playoffs") &&
            isPlayed(matchup)
        )
        .map((matchup) => ({
          phase: matchup.phase,
          game: toGame(matchup, rosterId),
        })),
    [matchups, rosterId]
  );

  const rivalries = useMemo(() => {
    const games = allGames
      .filter((item) => item.phase === phase)
      .map((item) => item.game);

    const opponents = Object.keys(franchiseNames)
      .map(Number)
      .filter((id) => id !== rosterId);

    return opponents
      .map((opponent) =>
        buildRivalry(opponent, games)
      )
      .sort(
        (a, b) =>
          b.games.length - a.games.length ||
          a.opponent - b.opponent
      );
  }, [allGames, franchiseNames, rosterId, phase]);

  const officialRivalries = useMemo(() => {
    const games = allGames
      .filter(
        (item) => item.phase === officialPhase
      )
      .map((item) => item.game);

    return getFranchiseRivalries(rosterId).map(
      (official) => {
        const opponent =
          official.teams[0] === rosterId
            ? official.teams[1]
            : official.teams[0];

        return {
          official,
          rivalry: buildRivalry(opponent, games),
        };
      }
    );
  }, [allGames, rosterId, officialPhase]);

  const activeRivalry =
    rivalries.find(
      (rivalry) =>
        rivalry.opponent === selectedOpponent
    ) ?? null;

  return (
    <section style={{ marginTop: "24px" }}>
      {officialRivalries.length > 0 && (
        <section>
          <div
            style={{
              color: "#facc15",
              fontSize: "11px",
              fontWeight: "800",
              letterSpacing: "1.5px",
            }}
          >
            THE SFL RIVALRY COLLECTION
          </div>

          <h2
            style={{
              fontSize: "22px",
              marginTop: "8px",
            }}
          >
            🏆 Official Rivalries
          </h2>

          <p
            style={{
              color: "#9da7b3",
              fontSize: "12px",
              lineHeight: "1.7",
              marginTop: "10px",
            }}
          >
            The league's named grudge matches.
            Each series has its own historical
            record and a holder determined by
            the most recent result.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(2, minmax(0, 1fr))",
              gap: "8px",
              marginTop: "18px",
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
                onClick={() =>
                  setOfficialPhase(option)
                }
                style={{
                  padding: "12px 6px",
                  background:
                    officialPhase === option
                      ? "#303b48"
                      : "#151b23",
                  color:
                    officialPhase === option
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

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              marginTop: "16px",
            }}
          >
            {officialRivalries.map(
              ({ official, rivalry }) => (
                <OfficialRivalryCard
                  key={`${official.id}-${officialPhase}`}
                  official={official}
                  rivalry={rivalry}
                  rosterId={rosterId}
                  franchiseNames={franchiseNames}
                />
              )
            )}
          </div>
        </section>
      )}

      <div
        style={{
          marginTop:
            officialRivalries.length > 0
              ? "38px"
              : "0",
          paddingTop:
            officialRivalries.length > 0
              ? "26px"
              : "0",
          borderTop:
            officialRivalries.length > 0
              ? "1px solid #27303b"
              : "none",
        }}
      >
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
            gridTemplateColumns:
              "repeat(2, 1fr)",
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

            const totalGames =
              rivalry.games.length;

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
                      justifyContent:
                        "space-between",
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
                            rivalry.wins >
                            rivalry.losses
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
                  <RivalryDetails
                    rivalry={rivalry}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
