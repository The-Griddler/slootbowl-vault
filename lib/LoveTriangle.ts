
import type { HistoricalMatchup } from "./sleeper";
import { LOVE_TRIANGLE_SERIES } from "./rivalries";

export type LoveTriangleStanding = {
  rosterId: number;
  wins: number;
  losses: number;
  ties: number;
  games: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDifference: number;
  winPercentage: number;
};

export type LoveTriangleSeason = {
  year: string;
  standings: LoveTriangleStanding[];
  champions: number[];
  completed: boolean;
  gamesPlayed: number;
};

export type LoveTriangleAllTimeStanding =
  LoveTriangleStanding & {
    championships: number;
  };

export type LoveTriangleHistory = {
  seasons: LoveTriangleSeason[];
  allTime: LoveTriangleAllTimeStanding[];
};

const TEAM_IDS: readonly number[] =
  LOVE_TRIANGLE_SERIES.teams;

function createStanding(
  rosterId: number
): LoveTriangleStanding {
  return {
    rosterId,
    wins: 0,
    losses: 0,
    ties: 0,
    games: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    pointDifference: 0,
    winPercentage: 0,
  };
}

function isPlayed(matchup: HistoricalMatchup) {
  return (
    Number.isFinite(matchup.scoreA) &&
    Number.isFinite(matchup.scoreB) &&
    (matchup.scoreA !== 0 ||
      matchup.scoreB !== 0)
  );
}

function isQualifyingGame(
  matchup: HistoricalMatchup
) {
  return (
    matchup.phase ===
      LOVE_TRIANGLE_SERIES.qualifyingPhase &&
    matchup.rosterA !== matchup.rosterB &&
    TEAM_IDS.includes(matchup.rosterA) &&
    TEAM_IDS.includes(matchup.rosterB)
  );
}

function addGame(
  standing: LoveTriangleStanding,
  scored: number,
  conceded: number
) {
  standing.games++;
  standing.pointsFor += scored;
  standing.pointsAgainst += conceded;

  if (scored > conceded) {
    standing.wins++;
  } else if (scored < conceded) {
    standing.losses++;
  } else {
    standing.ties++;
  }
}

function finishStanding(
  standing: LoveTriangleStanding
) {
  standing.pointDifference =
    standing.pointsFor -
    standing.pointsAgainst;

  standing.winPercentage =
    standing.games > 0
      ? (standing.wins +
          standing.ties / 2) /
        standing.games
      : 0;
}

function compareStandings(
  a: LoveTriangleStanding,
  b: LoveTriangleStanding
) {
  return (
    b.winPercentage - a.winPercentage ||
    b.pointDifference - a.pointDifference ||
    b.pointsFor - a.pointsFor ||
    a.rosterId - b.rosterId
  );
}

function tiedOnChampionshipRules(
  a: LoveTriangleStanding,
  b: LoveTriangleStanding
) {
  return (
    a.winPercentage === b.winPercentage &&
    Math.abs(
      a.pointDifference - b.pointDifference
    ) < 0.000001 &&
    Math.abs(
      a.pointsFor - b.pointsFor
    ) < 0.000001
  );
}

function buildStandings(
  matchups: HistoricalMatchup[]
): LoveTriangleStanding[] {
  const standings = new Map<
    number,
    LoveTriangleStanding
  >(
    TEAM_IDS.map((id) => [
      id,
      createStanding(id),
    ])
  );

  for (const matchup of matchups) {
    if (
      !isQualifyingGame(matchup) ||
      !isPlayed(matchup)
    ) {
      continue;
    }

    const teamA = standings.get(
      matchup.rosterA
    );

    const teamB = standings.get(
      matchup.rosterB
    );

    if (!teamA || !teamB) continue;

    addGame(
      teamA,
      matchup.scoreA,
      matchup.scoreB
    );

    addGame(
      teamB,
      matchup.scoreB,
      matchup.scoreA
    );
  }

  const results = [
    ...standings.values(),
  ];

  for (const standing of results) {
    finishStanding(standing);
  }

  return results.sort(compareStandings);
}

export function getLoveTriangleHistory(
  allMatchups: HistoricalMatchup[],
  seasonYears: string[]
): LoveTriangleHistory {
  const years = [
    ...new Set(
      seasonYears.filter(
        (year) =>
          Number(year) >=
          LOVE_TRIANGLE_SERIES.startSeason
      )
    ),
  ].sort(
    (a, b) =>
      Number(b) - Number(a)
  );

  const seasons: LoveTriangleSeason[] =
    years.map((year) => {
      const seasonMatchups =
        allMatchups.filter(
          (matchup) =>
            matchup.season === year
        );

      const qualifyingGames =
        seasonMatchups.filter(
          isQualifyingGame
        );

      const playedGames =
        qualifyingGames.filter(isPlayed);

      const standings =
        buildStandings(playedGames);

      // A season is considered complete
      // only when the league's regular
      // season Week 14 has been played.
      const week14Games =
        seasonMatchups.filter(
          (matchup) =>
            matchup.phase ===
              "Regular Season" &&
            matchup.week === 14 &&
            isPlayed(matchup)
        );

      const completed =
        week14Games.length === 5;

      const leader = standings[0];

      const champions =
        completed &&
        playedGames.length > 0 &&
        leader &&
        leader.games > 0
          ? standings
              .filter((standing) =>
                tiedOnChampionshipRules(
                  standing,
                  leader
                )
              )
              .map(
                (standing) =>
                  standing.rosterId
              )
          : [];

      return {
        year,
        standings,
        champions,
        completed,
        gamesPlayed:
          playedGames.length,
      };
    });

  const allTime = buildStandings(
    allMatchups
  ).map((standing) => {
    const championships =
      seasons.filter(
        (season) =>
          season.champions.includes(
            standing.rosterId
          )
      ).length;

    return {
      ...standing,
      championships,
    };
  });

  return {
    seasons,
    allTime,
  };
}
