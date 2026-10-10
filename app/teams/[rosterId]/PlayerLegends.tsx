
"use client";

import { useMemo, useState } from "react";
import type { HistoricalMatchup } from "../../../lib/sleeper";
import type { FranchiseLegacyScore } from "../../../lib/franchiseLegacyScore";

type Phase = "Regular Season" | "Main Playoffs";

type PlayerGame = {
  playerId: string;
  year: string;
  week: number;
  points: number;
};

type CareerStats = {
  playerId: string;
  games: number;
  points: number;
};

type SeasonStats = {
  playerId: string;
  year: string;
  games: number;
  points: number;
};

type PlayerLegendsProps = {
  rosterId: number;
  matchups: HistoricalMatchup[];
  playerNames: Record<string, string>;
  franchiseLegends?: FranchiseLegacyScore[];
};

function formatPoints(value: number) {
  return value.toFixed(2);
}

function formatLegacyPoints(value: number) {
  return value.toLocaleString("en-AU", {
    maximumFractionDigits: 0,
  });
}

type LeaderboardEntry = {
  key: string;
  playerId: string;
  value: string;
  detail: string;
};

function Leaderboard({
  title,
  entries,
  playerNames,
}: {
  title: string;
  entries: LeaderboardEntry[];
  playerNames: Record<string, string>;
}) {
  return (
    <section style={{ marginTop: "28px" }}>
      <h3
        style={{
          fontSize: "17px",
          marginBottom: "12px",
        }}
      >
        {title}
      </h3>

      <div
        style={{
          background: "#151b23",
          border: "1px solid #27303b",
          borderRadius: "14px",
          overflow: "hidden",
        }}
      >
        {entries.length === 0 ? (
          <p
            style={{
              padding: "18px",
              color: "#9da7b3",
            }}
          >
            No qualifying player performances.
          </p>
        ) : (
          entries.map((entry, index) => (
            <div
              key={entry.key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "13px 12px",
                borderBottom:
                  index === entries.length - 1
                    ? "none"
                    : "1px solid #27303b",
              }}
            >
              <span
                style={{
                  color: "#687384",
                  fontSize: "12px",
                  fontWeight: "800",
                  width: "20px",
                  flexShrink: 0,
                }}
              >
                {index + 1}
              </span>

              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: "700",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {playerNames[entry.playerId] ??
                    `Player ${entry.playerId}`}
                </div>

                <div
                  style={{
                    color: "#9da7b3",
                    fontSize: "11px",
                    marginTop: "4px",
                  }}
                >
                  {entry.detail}
                </div>
              </div>

              <div
                style={{
                  color: "#ffffff",
                  fontSize: "15px",
                  fontWeight: "800",
                  textAlign: "right",
                  flexShrink: 0,
                }}
              >
                {entry.value}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function FranchiseLegends({
  entries,
  playerNames,
}: {
  entries: FranchiseLegacyScore[];
  playerNames: Record<string, string>;
}) {
  const topFive = [...entries]
    .sort(
      (a, b) =>
        b.totalFranchiseLegacyPoints -
          a.totalFranchiseLegacyPoints ||
        b.rosterWeeks - a.rosterWeeks ||
        b.starts - a.starts
    )
    .slice(0, 5);

  return (
    <section style={{ marginTop: "24px" }}>
      <h3
        style={{
          fontSize: "18px",
          marginBottom: "8px",
        }}
      >
        🏛️ Franchise Legends
      </h3>

      <p
        style={{
          color: "#9da7b3",
          fontSize: "12px",
          lineHeight: 1.6,
          marginBottom: "14px",
        }}
      >
        The five greatest players in franchise
        history, ranked by loyalty, official
        starts, fantasy production, individual
        honours and Slootbowl championships.
      </p>

      <div
        style={{
          background: "#151b23",
          border: "1px solid #27303b",
          borderRadius: "14px",
          overflow: "hidden",
        }}
      >
        {topFive.length === 0 ? (
          <p
            style={{
              padding: "18px",
              color: "#9da7b3",
            }}
          >
            Franchise rankings are being prepared.
          </p>
        ) : (
          topFive.map((player, index) => (
            <div
              key={player.playerId}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "16px 12px",
                background:
                  index === 0
                    ? "rgba(234,179,8,0.07)"
                    : "transparent",
                borderBottom:
                  index === topFive.length - 1
                    ? "none"
                    : "1px solid #27303b",
              }}
            >
              <div
                style={{
                  width: "28px",
                  flexShrink: 0,
                  color:
                    index === 0
                      ? "#eab308"
                      : "#687384",
                  fontSize: "16px",
                  fontWeight: 800,
                  textAlign: "center",
                }}
              >
                {index + 1}
              </div>

              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    color: "#ffffff",
                    fontSize: "14px",
                    fontWeight: 800,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {playerNames[player.playerId] ??
                    `Player ${player.playerId}`}
                </div>

                <div
                  style={{
                    color: "#9da7b3",
                    fontSize: "11px",
                    marginTop: "5px",
                    lineHeight: 1.5,
                  }}
                >
                  {player.rosterWeeks} roster weeks
                  {" · "}
                  {player.starts} starts
                </div>

                {player.championships > 0 && (
                  <div
                    style={{
                      color: "#eab308",
                      fontSize: "11px",
                      fontWeight: 700,
                      marginTop: "4px",
                    }}
                  >
                    🏆 {player.championships}{" "}
                    {player.championships === 1
                      ? "Slootbowl title"
                      : "Slootbowl titles"}
                  </div>
                )}
              </div>

              <div
                style={{
                  textAlign: "right",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    color:
                      index === 0
                        ? "#eab308"
                        : "#ffffff",
                    fontSize: "17px",
                    fontWeight: 800,
                  }}
                >
                  {formatLegacyPoints(
                    player.totalFranchiseLegacyPoints
                  )}
                </div>

                <div
                  style={{
                    color: "#9da7b3",
                    fontSize: "10px",
                    marginTop: "4px",
                  }}
                >
                  LEGACY PTS
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default function PlayerLegends({
  rosterId,
  matchups,
  playerNames,
  franchiseLegends = [],
}: PlayerLegendsProps) {
  const [phase, setPhase] =
    useState<Phase>("Regular Season");

  const {
    careerPoints,
    careerStarts,
    bestGames,
    bestSeasons,
  } = useMemo(() => {
    const games: PlayerGame[] = [];

    for (const matchup of matchups) {
      if (matchup.phase !== phase) continue;

      if (
        matchup.rosterA !== rosterId &&
        matchup.rosterB !== rosterId
      ) {
        continue;
      }

      // Exclude unplayed matchups.
      if (
        !Number.isFinite(matchup.scoreA) ||
        !Number.isFinite(matchup.scoreB) ||
        (matchup.scoreA === 0 &&
          matchup.scoreB === 0)
      ) {
        continue;
      }

      const isA = matchup.rosterA === rosterId;

      const starters = isA
        ? matchup.startersA
        : matchup.startersB;

      const starterPoints = isA
        ? matchup.startersPointsA
        : matchup.startersPointsB;

      for (
        let index = 0;
        index < starters.length;
        index++
      ) {
        const playerId = starters[index];
        const points = starterPoints[index];

        if (
          !playerId ||
          playerId === "0" ||
          !Number.isFinite(points)
        ) {
          continue;
        }

        games.push({
          playerId,
          year: matchup.season,
          week: matchup.week,
          points,
        });
      }
    }

    // Career totals: one entry per player.
    const careerMap = new Map<
      string,
      CareerStats
    >();

    // Season totals: one entry per player
    // per season.
    const seasonMap = new Map<
      string,
      SeasonStats
    >();

    for (const game of games) {
      const career = careerMap.get(
        game.playerId
      );

      if (career) {
        career.games++;
        career.points += game.points;
      } else {
        careerMap.set(game.playerId, {
          playerId: game.playerId,
          games: 1,
          points: game.points,
        });
      }

      const seasonKey =
        `${game.playerId}-${game.year}`;

      const season = seasonMap.get(
        seasonKey
      );

      if (season) {
        season.games++;
        season.points += game.points;
      } else {
        seasonMap.set(seasonKey, {
          playerId: game.playerId,
          year: game.year,
          games: 1,
          points: game.points,
        });
      }
    }

    const careers = [...careerMap.values()];
    const seasons = [...seasonMap.values()];

    // Career leaderboards: unique players.
    const careerPoints: LeaderboardEntry[] =
      [...careers]
        .sort(
          (a, b) =>
            b.points - a.points ||
            b.games - a.games
        )
        .slice(0, 10)
        .map((player) => ({
          key: player.playerId,
          playerId: player.playerId,
          value: formatPoints(player.points),
          detail:
            `${player.games} games started`,
        }));

    const careerStarts: LeaderboardEntry[] =
      [...careers]
        .sort(
          (a, b) =>
            b.games - a.games ||
            b.points - a.points
        )
        .slice(0, 10)
        .map((player) => ({
          key: player.playerId,
          playerId: player.playerId,
          value: String(player.games),
          detail:
            `${formatPoints(player.points)} career points`,
        }));

    // Individual games: a player can
    // appear multiple times.
    const bestGames: LeaderboardEntry[] =
      [...games]
        .sort(
          (a, b) =>
            b.points - a.points ||
            Number(b.year) - Number(a.year) ||
            b.week - a.week
        )
        .slice(0, 10)
        .map((game) => ({
          key:
            `${game.playerId}-${game.year}-${game.week}`,
          playerId: game.playerId,
          value: formatPoints(game.points),
          detail:
            `${game.year} · Week ${game.week}`,
        }));

    // Individual seasons: a player can
    // appear once for each different season.
    const bestSeasons: LeaderboardEntry[] =
      [...seasons]
        .sort(
          (a, b) =>
            b.points - a.points ||
            Number(b.year) - Number(a.year)
        )
        .slice(0, 10)
        .map((season) => ({
          key:
            `${season.playerId}-${season.year}`,
          playerId: season.playerId,
          value: formatPoints(season.points),
          detail:
            `${season.year} season · ${season.games} starts`,
        }));

    return {
      careerPoints,
      careerStarts,
      bestGames,
      bestSeasons,
    };
  }, [rosterId, matchups, phase]);

  return (
    <section style={{ marginTop: "24px" }}>
      <h2 style={{ fontSize: "21px" }}>
        Player Legends
      </h2>

      <p
        style={{
          color: "#9da7b3",
          fontSize: "12px",
          marginTop: "8px",
          lineHeight: "1.6",
        }}
      >
        Franchise player records based exclusively
        on games started for this team. Bench
        performances, Toilet Bowl games and
        consolation matches are excluded from
        the performance leaderboards below.
      </p>

      <FranchiseLegends
        entries={franchiseLegends}
        playerNames={playerNames}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "8px",
          marginTop: "28px",
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
            onClick={() => setPhase(option)}
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

      <Leaderboard
        title="All-Time Points Leaders"
        entries={careerPoints}
        playerNames={playerNames}
      />

      <Leaderboard
        title="Most Games Started"
        entries={careerStarts}
        playerNames={playerNames}
      />

      <Leaderboard
        title="Highest Single-Game Score"
        entries={bestGames}
        playerNames={playerNames}
      />

      <Leaderboard
        title="Best Single Season"
        entries={bestSeasons}
        playerNames={playerNames}
      />
    </section>
  );
}
