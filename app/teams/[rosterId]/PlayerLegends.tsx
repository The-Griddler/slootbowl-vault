
"use client";

import { useMemo, useState } from "react";
import type { HistoricalMatchup } from "../../../lib/sleeper";

type Phase = "Regular Season" | "Main Playoffs";

type PlayerGame = {
  playerId: string;
  year: string;
  week: number;
  points: number;
};

type PlayerStats = {
  playerId: string;
  games: number;
  points: number;
  bestGame: number;
  bestGameYear: string;
  bestGameWeek: number;
  bestSeason: number;
  bestSeasonYear: string;
};

type PlayerLegendsProps = {
  rosterId: number;
  matchups: HistoricalMatchup[];
  playerNames: Record<string, string>;
};

function formatPoints(value: number) {
  return value.toFixed(2);
}

function Leaderboard({
  title,
  players,
  getValue,
  getDetail,
  playerNames,
}: {
  title: string;
  players: PlayerStats[];
  getValue: (player: PlayerStats) => string;
  getDetail: (player: PlayerStats) => string;
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
        {players.length === 0 ? (
          <p style={{ padding: "18px", color: "#9da7b3" }}>
            No qualifying player performances.
          </p>
        ) : (
          players.map((player, index) => (
            <div
              key={player.playerId}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "13px 12px",
                borderBottom:
                  index === players.length - 1
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
                  {playerNames[player.playerId] ??
                    `Player ${player.playerId}`}
                </div>

                <div
                  style={{
                    color: "#9da7b3",
                    fontSize: "11px",
                    marginTop: "4px",
                  }}
                >
                  {getDetail(player)}
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
                {getValue(player)}
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
}: PlayerLegendsProps) {
  const [phase, setPhase] =
    useState<Phase>("Regular Season");

  const stats = useMemo(() => {
    const games: PlayerGame[] = [];

    for (const matchup of matchups) {
      if (matchup.phase !== phase) continue;

      if (
        matchup.rosterA !== rosterId &&
        matchup.rosterB !== rosterId
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

      for (let index = 0; index < starters.length; index++) {
        const playerId = starters[index];
        const points = starterPoints[index];

        if (
          !playerId ||
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

    const byPlayer = new Map<
      string,
      {
        games: number;
        points: number;
        bestGame: number;
        bestGameYear: string;
        bestGameWeek: number;
        seasons: Map<string, number>;
      }
    >();

    for (const game of games) {
      let player = byPlayer.get(game.playerId);

      if (!player) {
        player = {
          games: 0,
          points: 0,
          bestGame: -Infinity,
          bestGameYear: "",
          bestGameWeek: 0,
          seasons: new Map<string, number>(),
        };

        byPlayer.set(game.playerId, player);
      }

      player.games++;
      player.points += game.points;

      if (game.points > player.bestGame) {
        player.bestGame = game.points;
        player.bestGameYear = game.year;
        player.bestGameWeek = game.week;
      }

      player.seasons.set(
        game.year,
        (player.seasons.get(game.year) ?? 0) +
          game.points
      );
    }

    const result: PlayerStats[] = [];

    for (const [playerId, player] of byPlayer) {
      const bestSeason = [...player.seasons.entries()]
        .sort((a, b) => b[1] - a[1])[0];

      result.push({
        playerId,
        games: player.games,
        points: player.points,
        bestGame: player.bestGame,
        bestGameYear: player.bestGameYear,
        bestGameWeek: player.bestGameWeek,
        bestSeason: bestSeason?.[1] ?? 0,
        bestSeasonYear: bestSeason?.[0] ?? "",
      });
    }

    return result;
  }, [rosterId, matchups, phase]);

  const mostPoints = [...stats]
    .sort((a, b) => b.points - a.points)
    .slice(0, 10);

  const mostStarts = [...stats]
    .sort((a, b) => b.games - a.games)
    .slice(0, 10);

  const bestGames = [...stats]
    .sort((a, b) => b.bestGame - a.bestGame)
    .slice(0, 10);

  const bestSeasons = [...stats]
    .sort((a, b) => b.bestSeason - a.bestSeason)
    .slice(0, 10);

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
        performances are excluded.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "8px",
          marginTop: "20px",
        }}
      >
        {(["Regular Season", "Main Playoffs"] as Phase[]).map(
          (option) => (
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
          )
        )}
      </div>

      <Leaderboard
        title="All-Time Points Leaders"
        players={mostPoints}
        getValue={(player) =>
          formatPoints(player.points)
        }
        getDetail={(player) =>
          `${player.games} games started`
        }
        playerNames={playerNames}
      />

      <Leaderboard
        title="Most Games Started"
        players={mostStarts}
        getValue={(player) =>
          String(player.games)
        }
        getDetail={(player) =>
          `${formatPoints(player.points)} career points`
        }
        playerNames={playerNames}
      />

      <Leaderboard
        title="Highest Single-Game Score"
        players={bestGames}
        getValue={(player) =>
          formatPoints(player.bestGame)
        }
        getDetail={(player) =>
          `${player.bestGameYear} · Week ${player.bestGameWeek}`
        }
        playerNames={playerNames}
      />

      <Leaderboard
        title="Best Single Season"
        players={bestSeasons}
        getValue={(player) =>
          formatPoints(player.bestSeason)
        }
        getDetail={(player) =>
          `${player.bestSeasonYear} season`
        }
        playerNames={playerNames}
      />
    </section>
  );
}
