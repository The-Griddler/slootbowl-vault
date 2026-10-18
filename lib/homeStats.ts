
import type {
  HistoricalMatchup,
  HistoricalSeason,
} from "./sleeper";

export const HOME_SEASON = "2026";

export const HOME_CONFERENCES = [
  {
    id: "OBFC",
    name: "Osmington Bay Football Conference",
    rosterIds: [4, 6, 8, 7, 9],
  },
  {
    id: "GPFC",
    name: "Gloucester-Plymouth Football Conference",
    rosterIds: [1, 2, 10, 3, 5],
  },
] as const;

export type HomeStanding = {
  rosterId: number;
  conference: "OBFC" | "GPFC";
  rank: number;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  gamesPlayed: number;
  winPercentage: number;
  inPlayoffPosition: boolean;
};

export type HomeGame = HistoricalMatchup & {
  margin: number;
  combinedScore: number;
  winnerId: number | null;
  loserId: number | null;
};

export type HomeSeasonStats = {
  season: string;
  completedWeeks: number;
  latestCompletedWeek: number;
  gamesPlayed: number;
  totalPoints: number;
  averageTeamScore: number;
  highestTeamScore: {
    rosterId: number;
    points: number;
    week: number;
  } | null;
  closestGame: HomeGame | null;
  biggestBlowout: HomeGame | null;
  highestScoringGame: HomeGame | null;
};

export type HomeRecordWatch = {
  category: string;
  record: number;
  recordSeason: string;
  recordRosterId: number | null;
  challenger: number;
  challengerRosterId: number | null;
  progressPercentage: number;
  projectedTotal: number | null;
  onRecordPace: boolean;
};

export type HomeStats = {
  season: string;
  seasonStats: HomeSeasonStats;
  standings: HomeStanding[];
  conferences: {
    OBFC: HomeStanding[];
    GPFC: HomeStanding[];
  };
  playoffContenders: number[];
  completedGames: HomeGame[];
  recordWatch: HomeRecordWatch[];
};

type MutableStanding = Omit<
  HomeStanding,
  "rank" | "winPercentage" | "inPlayoffPosition"
>;

const REGULAR_SEASON_WEEKS = 14;

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function validScore(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

/**
 * Only completed regular-season matchups count
 * towards homepage standings and season stats.
 *
 * This also excludes the Toilet Bowl,
 * playoff placement games and future fixtures.
 */
function isEligibleGame(
  game: HistoricalMatchup,
  season: string
): boolean {
  return (
    game.season === season &&
    game.phase === "Regular Season" &&
    game.isComplete === true &&
    game.week >= 1 &&
    game.week <= REGULAR_SEASON_WEEKS &&
    game.rosterA !== game.rosterB &&
    validScore(game.scoreA) &&
    validScore(game.scoreB)
  );
}

function toHomeGame(
  game: HistoricalMatchup
): HomeGame {
  const margin = Math.abs(
    game.scoreA - game.scoreB
  );

  const winnerId =
    game.scoreA > game.scoreB
      ? game.rosterA
      : game.scoreB > game.scoreA
        ? game.rosterB
        : null;

  const loserId =
    winnerId === game.rosterA
      ? game.rosterB
      : winnerId === game.rosterB
        ? game.rosterA
        : null;

  return {
    ...game,
    margin: round2(margin),
    combinedScore: round2(
      game.scoreA + game.scoreB
    ),
    winnerId,
    loserId,
  };
}

function getConference(
  rosterId: number
): "OBFC" | "GPFC" | null {
  for (const conference of HOME_CONFERENCES) {
    if (
      (conference.rosterIds as readonly number[])
        .includes(rosterId)
    ) {
      return conference.id;
    }
  }

  return null;
}

/**
 * Sort by W-L record first, then Points For.
 *
 * Win percentage handles the same number
 * of games played with possible ties.
 * For equal win percentage, PF breaks ties.
 *
 * If both remain equal, roster ID gives
 * the display a deterministic order.
 */
function compareStandings(
  a: MutableStanding,
  b: MutableStanding
): number {
  const aWinPercentage =
    a.gamesPlayed > 0
      ? (a.wins + a.ties * 0.5) /
        a.gamesPlayed
      : 0;

  const bWinPercentage =
    b.gamesPlayed > 0
      ? (b.wins + b.ties * 0.5) /
        b.gamesPlayed
      : 0;

  return (
    bWinPercentage - aWinPercentage ||
    b.pointsFor - a.pointsFor ||
    a.rosterId - b.rosterId
  );
}

export function calculateHomeStandings(
  games: HomeGame[]
): HomeStanding[] {
  const standings = new Map<
    number,
    MutableStanding
  >();

  for (const conference of HOME_CONFERENCES) {
    for (const rosterId of conference.rosterIds) {
      standings.set(rosterId, {
        rosterId,
        conference: conference.id,
        wins: 0,
        losses: 0,
        ties: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        gamesPlayed: 0,
      });
    }
  }

  for (const game of games) {
    const teamA = standings.get(
      game.rosterA
    );

    const teamB = standings.get(
      game.rosterB
    );

    if (!teamA || !teamB) {
      continue;
    }

    teamA.gamesPlayed++;
    teamB.gamesPlayed++;

    teamA.pointsFor += game.scoreA;
    teamA.pointsAgainst += game.scoreB;

    teamB.pointsFor += game.scoreB;
    teamB.pointsAgainst += game.scoreA;

    if (game.scoreA > game.scoreB) {
      teamA.wins++;
      teamB.losses++;
    } else if (game.scoreB > game.scoreA) {
      teamB.wins++;
      teamA.losses++;
    } else {
      teamA.ties++;
      teamB.ties++;
    }
  }

  const result: HomeStanding[] = [];

  for (const conference of HOME_CONFERENCES) {
    const conferenceStandings = [
      ...standings.values(),
    ]
      .filter(
        (team) =>
          team.conference === conference.id
      )
      .sort(compareStandings);

    conferenceStandings.forEach(
      (team, index) => {
        const winPercentage =
          team.gamesPlayed > 0
            ? (team.wins + team.ties * 0.5) /
              team.gamesPlayed
            : 0;

        result.push({
          ...team,
          rank: index + 1,
          pointsFor: round2(team.pointsFor),
          pointsAgainst: round2(
            team.pointsAgainst
          ),
          winPercentage,
          inPlayoffPosition: index < 3,
        });
      }
    );
  }

  return result;
}

function calculateSeasonStats(
  games: HomeGame[],
  season: string
): HomeSeasonStats {
  const weeks = new Set(
    games.map((game) => game.week)
  );

  let highestTeamScore:
    HomeSeasonStats["highestTeamScore"] = null;

  for (const game of games) {
    const performances = [
      {
        rosterId: game.rosterA,
        points: game.scoreA,
      },
      {
        rosterId: game.rosterB,
        points: game.scoreB,
      },
    ];

    for (const performance of performances) {
      if (
        !highestTeamScore ||
        performance.points >
          highestTeamScore.points
      ) {
        highestTeamScore = {
          ...performance,
          week: game.week,
        };
      }
    }
  }

  const closestGame =
    [...games].sort(
      (a, b) =>
        a.margin - b.margin ||
        b.combinedScore - a.combinedScore
    )[0] ?? null;

  const biggestBlowout =
    [...games].sort(
      (a, b) =>
        b.margin - a.margin ||
        b.combinedScore - a.combinedScore
    )[0] ?? null;

  const highestScoringGame =
    [...games].sort(
      (a, b) =>
        b.combinedScore - a.combinedScore
    )[0] ?? null;

  const totalPoints = games.reduce(
    (sum, game) =>
      sum + game.scoreA + game.scoreB,
    0
  );

  return {
    season,
    completedWeeks: weeks.size,
    latestCompletedWeek:
      games.length > 0
        ? Math.max(
            ...games.map(
              (game) => game.week
            )
          )
        : 0,
    gamesPlayed: games.length,
    totalPoints: round2(totalPoints),
    averageTeamScore:
      games.length > 0
        ? round2(
            totalPoints / (games.length * 2)
          )
        : 0,
    highestTeamScore,
    closestGame,
    biggestBlowout,
    highestScoringGame,
  };
}

/**
 * Compare current-season team scoring
 * against the highest completed historical
 * regular-season team scoring total.
 *
 * Historical records are calculated using
 * full completed seasons only.
 */
function calculateRecordWatch(
  historicalData: HistoricalSeason[],
  currentGames: HomeGame[],
  season: string,
  latestCompletedWeek: number
): HomeRecordWatch[] {
  const historicalTotals: {
    season: string;
    rosterId: number;
    points: number;
  }[] = [];

  for (const historicalSeason of historicalData) {
    const historicalYear = Number(
      historicalSeason.league.season
    );

    if (
      !Number.isFinite(historicalYear) ||
      historicalYear >= Number(season)
    ) {
      continue;
    }

    const seasonGames =
      historicalSeason.matchups.filter(
        (game) =>
          isEligibleGame(
            game,
            historicalSeason.league.season
          )
      );

    const totals = new Map<
      number,
      number
    >();

    for (const game of seasonGames) {
      totals.set(
        game.rosterA,
        (totals.get(game.rosterA) ?? 0) +
          game.scoreA
      );

      totals.set(
        game.rosterB,
        (totals.get(game.rosterB) ?? 0) +
          game.scoreB
      );
    }

    for (const [rosterId, points] of totals) {
      historicalTotals.push({
        season:
          historicalSeason.league.season,
        rosterId,
        points: round2(points),
      });
    }
  }

  historicalTotals.sort(
    (a, b) => b.points - a.points
  );

  const record = historicalTotals[0];

  const currentTotals = new Map<
    number,
    number
  >();

  for (const game of currentGames) {
    currentTotals.set(
      game.rosterA,
      (currentTotals.get(game.rosterA) ?? 0) +
        game.scoreA
    );

    currentTotals.set(
      game.rosterB,
      (currentTotals.get(game.rosterB) ?? 0) +
        game.scoreB
    );
  }

  const currentLeader = [
    ...currentTotals.entries(),
  ].sort(
    (a, b) => b[1] - a[1]
  )[0];

  if (!record || !currentLeader) {
    return [];
  }

  const challengerPoints = round2(
    currentLeader[1]
  );

  const projectedTotal =
    latestCompletedWeek > 0
      ? round2(
          (challengerPoints /
            latestCompletedWeek) *
            REGULAR_SEASON_WEEKS
        )
      : null;

  return [
    {
      category:
        "Single-season team scoring",
      record: record.points,
      recordSeason: record.season,
      recordRosterId: record.rosterId,
      challenger: challengerPoints,
      challengerRosterId:
        currentLeader[0],
      progressPercentage:
        record.points > 0
          ? Math.min(
              100,
              round2(
                (challengerPoints /
                  record.points) *
                  100
              )
            )
          : 0,
      projectedTotal,
      onRecordPace:
        projectedTotal !== null &&
        projectedTotal > record.points,
    },
  ];
}

/**
 * Main homepage statistics calculator.
 *
 * All results are derived from the
 * historical data already loaded by
 * lib/sleeper.ts.
 *
 * No additional Sleeper API calls.
 */
export function calculateHomeStats(
  historicalData: HistoricalSeason[],
  season: string = HOME_SEASON
): HomeStats {
  const currentSeason =
    historicalData.find(
      (item) =>
        item.league.season === season
    );

  const completedGames = (
    currentSeason?.matchups ?? []
  )
    .filter(
      (game) =>
        isEligibleGame(game, season)
    )
    .map(toHomeGame)
    .sort(
      (a, b) =>
        a.week - b.week ||
        a.rosterA - b.rosterA
    );

  const standings =
    calculateHomeStandings(
      completedGames
    );

  const seasonStats =
    calculateSeasonStats(
      completedGames,
      season
    );

  const conferences = {
    OBFC: standings.filter(
      (team) =>
        team.conference === "OBFC"
    ),
    GPFC: standings.filter(
      (team) =>
        team.conference === "GPFC"
    ),
  };

  const playoffContenders =
    standings
      .filter(
        (team) =>
          team.inPlayoffPosition
      )
      .map(
        (team) => team.rosterId
      );

  const recordWatch =
    calculateRecordWatch(
      historicalData,
      completedGames,
      season,
      seasonStats.latestCompletedWeek
    );

  return {
    season,
    seasonStats,
    standings,
    conferences,
    playoffContenders,
    completedGames,
    recordWatch,
  };
}

/**
 * Convenience helper for the MVP Ladder.
 *
 * Returns whether a franchise is currently
 * ranked inside its conference's top three.
 */
export function isHomePlayoffContender(
  rosterId: number,
  standings: HomeStanding[]
): boolean {
  return (
    standings.find(
      (team) =>
        team.rosterId === rosterId
    )?.inPlayoffPosition ?? false
  );
}
