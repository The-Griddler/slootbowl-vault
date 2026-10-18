
import type {
  HistoricalMatchup,
  HistoricalSeason,
} from "./sleeper";

import {
  calculateGreatestGames,
  type GreatestGame,
} from "./greatestGames";

export const RECAP_SEASON = "2026";

export const RECAP_CONFERENCES = {
  OBFC: [4, 6, 8, 7, 9],
  GPFC: [1, 2, 10, 3, 5],
} as const;

export type WeeklyPlayerAward = {
  conference: "OBFC" | "GPFC";
  playerId: string;
  rosterId: number;
  points: number;
  week: number;
};

export type WeeklyRecapGame = {
  matchup: HistoricalMatchup;
  ranking: GreatestGame;
};

export type WeeklyRecap = {
  season: string;
  week: number;
  gameOfTheWeek: WeeklyRecapGame;
  otherGames: WeeklyRecapGame[];
  obfcPlayerOfTheWeek: WeeklyPlayerAward | null;
  gpfcPlayerOfTheWeek: WeeklyPlayerAward | null;
};

export type WeeklyRecapData = {
  season: string;
  availableWeeks: number[];
  latestWeek: number | null;
  recaps: WeeklyRecap[];
};

function getConference(
  rosterId: number
): "OBFC" | "GPFC" | null {
  if (
    (RECAP_CONFERENCES.OBFC as readonly number[])
      .includes(rosterId)
  ) {
    return "OBFC";
  }

  if (
    (RECAP_CONFERENCES.GPFC as readonly number[])
      .includes(rosterId)
  ) {
    return "GPFC";
  }

  return null;
}

function isCompletedRegularGame(
  game: HistoricalMatchup,
  season: string
): boolean {
  return (
    game.season === season &&
    game.phase === "Regular Season" &&
    game.isComplete === true &&
    game.week >= 1 &&
    game.week <= 14 &&
    game.rosterA !== game.rosterB &&
    Number.isFinite(game.scoreA) &&
    Number.isFinite(game.scoreB) &&
    (game.scoreA !== 0 || game.scoreB !== 0)
  );
}

function gameKey(
  season: string,
  week: number,
  rosterA: number,
  rosterB: number
): string {
  const teams = [rosterA, rosterB].sort(
    (a, b) => a - b
  );

  return [
    season,
    week,
    teams[0],
    teams[1],
  ].join(":");
}

function calculatePlayerAwards(
  games: HistoricalMatchup[],
  week: number
): {
  OBFC: WeeklyPlayerAward | null;
  GPFC: WeeklyPlayerAward | null;
} {
  const awards: {
    OBFC: WeeklyPlayerAward | null;
    GPFC: WeeklyPlayerAward | null;
  } = {
    OBFC: null,
    GPFC: null,
  };

  for (const game of games) {
    const teams = [
      {
        rosterId: game.rosterA,
        starters: game.startersA,
        points: game.startersPointsA,
      },
      {
        rosterId: game.rosterB,
        starters: game.startersB,
        points: game.startersPointsB,
      },
    ];

    for (const team of teams) {
      const conference = getConference(
        team.rosterId
      );

      if (!conference) continue;

      team.starters.forEach(
        (playerId, index) => {
          const points = team.points[index];

          if (
            !playerId ||
            playerId === "0" ||
            !Number.isFinite(points)
          ) {
            return;
          }

          const candidate: WeeklyPlayerAward = {
            conference,
            playerId,
            rosterId: team.rosterId,
            points,
            week,
          };

          const current = awards[conference];

          if (
            !current ||
            candidate.points > current.points ||
            (
              candidate.points === current.points &&
              candidate.playerId.localeCompare(
                current.playerId
              ) < 0
            )
          ) {
            awards[conference] = candidate;
          }
        }
      );
    }
  }

  return awards;
}

/**
 * Builds the 2026 Weekly Recap archive.
 *
 * Uses the existing Greatest Games
 * rankings, so Game of the Week agrees
 * with the main historical archive.
 *
 * A week is available only when all
 * five scheduled matchups are complete.
 */
export function calculateWeeklyRecaps(
  historicalData: HistoricalSeason[],
  season: string = RECAP_SEASON
): WeeklyRecapData {
  const currentSeason =
    historicalData.find(
      (item) => item.league.season === season
    );

  if (!currentSeason) {
    return {
      season,
      availableWeeks: [],
      latestWeek: null,
      recaps: [],
    };
  }

  const allMatchups =
    historicalData.flatMap(
      (item) => item.matchups
    );

  const rankings =
    calculateGreatestGames(allMatchups);

  const rankingsByGame = new Map<
    string,
    GreatestGame
  >();

  for (const ranking of rankings) {
    rankingsByGame.set(
      gameKey(
        ranking.season,
        ranking.week,
        ranking.rosterA,
        ranking.rosterB
      ),
      ranking
    );
  }

  const gamesByWeek = new Map<
    number,
    HistoricalMatchup[]
  >();

  for (const game of currentSeason.matchups) {
    if (
      !isCompletedRegularGame(game, season)
    ) {
      continue;
    }

    const existing =
      gamesByWeek.get(game.week) ?? [];

    existing.push(game);

    gamesByWeek.set(
      game.week,
      existing
    );
  }

  const recaps: WeeklyRecap[] = [];

  for (const [week, games] of gamesByWeek) {
    // Ten franchises play five games
    // each regular-season week.
    if (games.length !== 5) {
      continue;
    }

    // Ensure each franchise appears once.
    const participatingTeams = new Set(
      games.flatMap(
        (game) => [
          game.rosterA,
          game.rosterB,
        ]
      )
    );

    if (participatingTeams.size !== 10) {
      continue;
    }

    const rankedGames: WeeklyRecapGame[] =
      [];

    for (const matchup of games) {
      const ranking = rankingsByGame.get(
        gameKey(
          matchup.season,
          matchup.week,
          matchup.rosterA,
          matchup.rosterB
        )
      );

      if (!ranking) continue;

      rankedGames.push({
        matchup,
        ranking,
      });
    }

    if (rankedGames.length !== 5) {
      continue;
    }

    rankedGames.sort(
      (a, b) =>
        b.ranking.greatnessScore -
          a.ranking.greatnessScore ||
        a.ranking.margin -
          b.ranking.margin ||
        b.ranking.combinedScore -
          a.ranking.combinedScore
    );

    const awards = calculatePlayerAwards(
      games,
      week
    );

    recaps.push({
      season,
      week,
      gameOfTheWeek: rankedGames[0],
      otherGames: rankedGames.slice(1),
      obfcPlayerOfTheWeek: awards.OBFC,
      gpfcPlayerOfTheWeek: awards.GPFC,
    });
  }

  recaps.sort(
    (a, b) => a.week - b.week
  );

  const availableWeeks = recaps.map(
    (recap) => recap.week
  );

  return {
    season,
    availableWeeks,
    latestWeek:
      availableWeeks.length > 0
        ? availableWeeks[
            availableWeeks.length - 1
          ]
        : null,
    recaps,
  };
}

export function getWeeklyRecap(
  data: WeeklyRecapData,
  week?: number
): WeeklyRecap | null {
  const selectedWeek =
    week ?? data.latestWeek;

  if (selectedWeek === null) {
    return null;
  }

  return (
    data.recaps.find(
      (recap) =>
        recap.week === selectedWeek
    ) ?? null
  );
}
