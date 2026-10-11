
import {
  getHistoricalData,
  type HistoricalMatchup,
} from "./sleeper";

import { getSlootbowlResults } from "./slootbowlResults";

export type RecordPhase =
  | "Regular Season"
  | "Main Playoffs";

export type Competition =
  | "regularSeason"
  | "mainPlayoffs";

export type TeamPerformance = {
  season: string;
  week: number;
  phase: RecordPhase;
  rosterId: number;
  score: number;
  opponentRosterId: number;
  opponentScore: number;
};

export type LeagueRecord = TeamPerformance & {
  margin: number;
};

export type SeasonRecord = {
  season: string;
  rosterId: number;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDifferential: number;
  gamesOver150: number;
  games100OrFewer: number;
};

export type RecordSet = {
  highestTeamScore: LeagueRecord | null;
  lowestTeamScore: LeagueRecord | null;
  biggestWinningMargin: LeagueRecord | null;
  closestGame: LeagueRecord | null;
  highestCombinedScore: LeagueRecord | null;
  lowestCombinedScore: LeagueRecord | null;
  highestLosingScore: LeagueRecord | null;
  lowestWinningScore: LeagueRecord | null;
  mostPointsConcededInVictory: LeagueRecord | null;
};

export type SeasonRecordSet = {
  mostWins: SeasonRecord | null;
  fewestWins: SeasonRecord | null;
  mostPointsFor: SeasonRecord | null;
  fewestPointsFor: SeasonRecord | null;
  mostPointsAgainst: SeasonRecord | null;
  fewestPointsAgainst: SeasonRecord | null;
  bestPointDifferential: SeasonRecord | null;
  worstPointDifferential: SeasonRecord | null;
  mostGamesOver150: SeasonRecord | null;
  mostGames100OrFewer: SeasonRecord | null;
};

export type AllTimeFranchiseRecord = {
  rosterId: number;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDifferential: number;
};

export type AllTimeRecordSet = {
  mostWins: AllTimeFranchiseRecord | null;
  fewestWins: AllTimeFranchiseRecord | null;
  mostPointsFor: AllTimeFranchiseRecord | null;
  mostPointsAgainst: AllTimeFranchiseRecord | null;
  bestPointDifferential: AllTimeFranchiseRecord | null;
  worstPointDifferential: AllTimeFranchiseRecord | null;
};

export type RecordLeaderboardSet = {
  [K in keyof RecordSet]: LeagueRecord[];
};

export type SeasonLeaderboardSet = {
  [K in keyof SeasonRecordSet]: SeasonRecord[];
};

export type AllTimeLeaderboardSet = {
  [K in keyof AllTimeRecordSet]:
    AllTimeFranchiseRecord[];
};

export type FranchiseAchievement = {
  rosterId: number;
  championships: number;
  championshipSeasons: string[];
  slootbowlAppearances: number;
  slootbowlSeasons: string[];
  runnerUpFinishes: number;
  runnerUpSeasons: string[];
  playoffAppearances: number;
  playoffSeasons: string[];
  playoffWins: number;
  playoffLosses: number;
  playoffTies: number;
};

export type AchievementLeaderboards = {
  championships: FranchiseAchievement[];
  slootbowlAppearances: FranchiseAchievement[];
  runnerUpFinishes: FranchiseAchievement[];
  playoffAppearances: FranchiseAchievement[];
  playoffWins: FranchiseAchievement[];
  playoffLosses: FranchiseAchievement[];
};

export type StreakRecord = {
  rosterId: number;
  competition: Competition;
  result: "win" | "loss";
  length: number;
  startSeason: string;
  startWeek: number;
  endSeason: string;
  endWeek: number;
};

export type StreakLeaderboards = {
  regularSeasonWinning: StreakRecord[];
  regularSeasonLosing: StreakRecord[];
  mainPlayoffsWinning: StreakRecord[];
  mainPlayoffsLosing: StreakRecord[];
};

export type HistoricalAchievements = {
  franchises: FranchiseAchievement[];
  leaderboards: AchievementLeaderboards;
  streaks: StreakLeaderboards;
};

export type CompetitionLeaderboards = {
  regularSeason: RecordLeaderboardSet;
  mainPlayoffs: RecordLeaderboardSet;
};

export type SeasonCompetitionLeaderboards = {
  regularSeason: SeasonLeaderboardSet;
  mainPlayoffs: SeasonLeaderboardSet;
};

export type FilteredSeasonRecords = {
  individualGame: {
    regularSeason: RecordSet;
    mainPlayoffs: RecordSet;
  };
  season: {
    regularSeason: SeasonRecordSet;
    mainPlayoffs: SeasonRecordSet;
  };
  leaderboards: {
    individualGame: CompetitionLeaderboards;
    season: SeasonCompetitionLeaderboards;
  };
};

export type AllTimeRecords =
  FilteredSeasonRecords & {
    allTime: AllTimeRecordSet;
    allTimeLeaderboards:
      AllTimeLeaderboardSet;
    bySeason: Record<
      string,
      FilteredSeasonRecords
    >;
    availableSeasons: string[];
    completedSeasons: {
      regularSeason: string[];
      mainPlayoffs: string[];
    };
    historicalAchievements:
      HistoricalAchievements;
  };

const LEADERBOARD_LIMIT = 10;

const REGULAR_SEASON_WEEKS = 14;
const REGULAR_SEASON_MATCHUPS_PER_WEEK = 5;

function rounded(value: number): number {
  return (
    Math.round(
      (value + Number.EPSILON) * 100
    ) / 100
  );
}

/**
 * A matchup is eligible for historical
 * records only after its NFL week has
 * officially completed.
 *
 * Nonzero scores alone are not proof
 * that a matchup is finished.
 */
function isValidPerformance(
  matchup: HistoricalMatchup
): boolean {
  return (
    matchup.isComplete === true &&
    Number.isFinite(matchup.scoreA) &&
    Number.isFinite(matchup.scoreB) &&
    matchup.scoreA >= 0 &&
    matchup.scoreB >= 0 &&
    (
      matchup.scoreA !== 0 ||
      matchup.scoreB !== 0
    )
  );
}

/**
 * One completed fantasy matchup creates
 * two team performances.
 *
 * Live, future and ignored matchups
 * cannot enter the records pipeline.
 */
function buildPerformances(
  matchups: HistoricalMatchup[]
): TeamPerformance[] {
  const performances: TeamPerformance[] = [];

  for (const matchup of matchups) {
    if (
      matchup.phase !== "Regular Season" &&
      matchup.phase !== "Main Playoffs"
    ) {
      continue;
    }

    if (!isValidPerformance(matchup)) {
      continue;
    }

    performances.push({
      season: matchup.season,
      week: matchup.week,
      phase: matchup.phase,
      rosterId: matchup.rosterA,
      score: matchup.scoreA,
      opponentRosterId: matchup.rosterB,
      opponentScore: matchup.scoreB,
    });

    performances.push({
      season: matchup.season,
      week: matchup.week,
      phase: matchup.phase,
      rosterId: matchup.rosterB,
      score: matchup.scoreB,
      opponentRosterId: matchup.rosterA,
      opponentScore: matchup.scoreA,
    });
  }

  return performances;
}

function toLeagueRecord(
  performance: TeamPerformance
): LeagueRecord {
  return {
    ...performance,
    margin: rounded(
      Math.abs(
        performance.score -
        performance.opponentScore
      )
    ),
  };
}

function uniqueGames(
  records: LeagueRecord[]
): LeagueRecord[] {
  const seen = new Set<string>();

  return records.filter((record) => {
    const first = Math.min(
      record.rosterId,
      record.opponentRosterId
    );

    const second = Math.max(
      record.rosterId,
      record.opponentRosterId
    );

    const key = [
      record.season,
      record.week,
      record.phase,
      first,
      second,
    ].join("|");

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function compareChronologically(
  a: {
    season: string;
    week?: number;
    rosterId: number;
    opponentRosterId?: number;
  },
  b: {
    season: string;
    week?: number;
    rosterId: number;
    opponentRosterId?: number;
  }
): number {
  return (
    Number(a.season) -
      Number(b.season) ||
    (a.week ?? 0) - (b.week ?? 0) ||
    a.rosterId - b.rosterId ||
    (a.opponentRosterId ?? 0) -
      (b.opponentRosterId ?? 0)
  );
}

function rankRecords<
  T extends {
    season?: string;
    week?: number;
    rosterId: number;
    opponentRosterId?: number;
  }
>(
  records: T[],
  value: (record: T) => number,
  direction: "highest" | "lowest",
  limit = LEADERBOARD_LIMIT
): T[] {
  const sorted = [...records].sort(
    (a, b) => {
      const difference =
        rounded(value(a)) -
        rounded(value(b));

      if (difference !== 0) {
        return direction === "highest"
          ? -difference
          : difference;
      }

      return compareChronologically(
        {
          season: a.season ?? "0",
          week: a.week,
          rosterId: a.rosterId,
          opponentRosterId:
            a.opponentRosterId,
        },
        {
          season: b.season ?? "0",
          week: b.week,
          rosterId: b.rosterId,
          opponentRosterId:
            b.opponentRosterId,
        }
      );
    }
  );

  if (sorted.length <= limit) {
    return sorted;
  }

  const cutoff = rounded(
    value(sorted[limit - 1])
  );

  return sorted.filter(
    (record, index) =>
      index < limit ||
      rounded(value(record)) === cutoff
  );
}

function firstOrNull<T>(
  records: T[]
): T | null {
  return records[0] ?? null;
}

function calculateGameLeaderboards(
  performances: TeamPerformance[]
): RecordLeaderboardSet {
  const records =
    performances.map(toLeagueRecord);

  const games = uniqueGames(records);

  const winningGames = records.filter(
    (record) =>
      record.score > record.opponentScore
  );

  const losingGames = records.filter(
    (record) =>
      record.score < record.opponentScore
  );

  return {
    highestTeamScore: rankRecords(
      records,
      (record) => record.score,
      "highest"
    ),

    lowestTeamScore: rankRecords(
      records,
      (record) => record.score,
      "lowest"
    ),

    biggestWinningMargin: rankRecords(
      winningGames,
      (record) => record.margin,
      "highest"
    ),

    closestGame: rankRecords(
      games,
      (record) => record.margin,
      "lowest"
    ),

    highestCombinedScore: rankRecords(
      games,
      (record) =>
        record.score +
        record.opponentScore,
      "highest"
    ),

    lowestCombinedScore: rankRecords(
      games,
      (record) =>
        record.score +
        record.opponentScore,
      "lowest"
    ),

    highestLosingScore: rankRecords(
      losingGames,
      (record) => record.score,
      "highest"
    ),

    lowestWinningScore: rankRecords(
      winningGames,
      (record) => record.score,
      "lowest"
    ),

    mostPointsConcededInVictory:
      rankRecords(
        winningGames,
        (record) =>
          record.opponentScore,
        "highest"
      ),
  };
}

function firstGameRecords(
  leaders: RecordLeaderboardSet
): RecordSet {
  return {
    highestTeamScore: firstOrNull(
      leaders.highestTeamScore
    ),

    lowestTeamScore: firstOrNull(
      leaders.lowestTeamScore
    ),

    biggestWinningMargin: firstOrNull(
      leaders.biggestWinningMargin
    ),

    closestGame: firstOrNull(
      leaders.closestGame
    ),

    highestCombinedScore: firstOrNull(
      leaders.highestCombinedScore
    ),

    lowestCombinedScore: firstOrNull(
      leaders.lowestCombinedScore
    ),

    highestLosingScore: firstOrNull(
      leaders.highestLosingScore
    ),

    lowestWinningScore: firstOrNull(
      leaders.lowestWinningScore
    ),

    mostPointsConcededInVictory:
      firstOrNull(
        leaders.mostPointsConcededInVictory
      ),
  };
}

function buildSeasonRecords(
  performances: TeamPerformance[]
): SeasonRecord[] {
  const seasons =
    new Map<string, SeasonRecord>();

  for (const performance of performances) {
    const key = [
      performance.season,
      performance.rosterId,
    ].join("|");

    let record = seasons.get(key);

    if (!record) {
      record = {
        season: performance.season,
        rosterId: performance.rosterId,
        wins: 0,
        losses: 0,
        ties: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        pointDifferential: 0,
        gamesOver150: 0,
        games100OrFewer: 0,
      };

      seasons.set(key, record);
    }

    if (
      performance.score >
      performance.opponentScore
    ) {
      record.wins++;
    } else if (
      performance.score <
      performance.opponentScore
    ) {
      record.losses++;
    } else {
      record.ties++;
    }

    if (performance.score >= 150) {
      record.gamesOver150++;
    }

    if (performance.score <= 100) {
      record.games100OrFewer++;
    }

    record.pointsFor = rounded(
      record.pointsFor +
      performance.score
    );

    record.pointsAgainst = rounded(
      record.pointsAgainst +
      performance.opponentScore
    );

    record.pointDifferential = rounded(
      record.pointsFor -
      record.pointsAgainst
    );
  }

  return Array.from(seasons.values());
}

function calculateSeasonLeaderboards(
  records: SeasonRecord[]
): SeasonLeaderboardSet {
  return {
    mostWins: rankRecords(
      records,
      (record) => record.wins,
      "highest"
    ),

    fewestWins: rankRecords(
      records,
      (record) => record.wins,
      "lowest"
    ),

    mostPointsFor: rankRecords(
      records,
      (record) => record.pointsFor,
      "highest"
    ),

    fewestPointsFor: rankRecords(
      records,
      (record) => record.pointsFor,
      "lowest"
    ),

    mostPointsAgainst: rankRecords(
      records,
      (record) => record.pointsAgainst,
      "highest"
    ),

    fewestPointsAgainst: rankRecords(
      records,
      (record) => record.pointsAgainst,
      "lowest"
    ),

    bestPointDifferential: rankRecords(
      records,
      (record) =>
        record.pointDifferential,
      "highest"
    ),

    worstPointDifferential: rankRecords(
      records,
      (record) =>
        record.pointDifferential,
      "lowest"
    ),

    mostGamesOver150: rankRecords(
      records,
      (record) => record.gamesOver150,
      "highest"
    ),

    mostGames100OrFewer: rankRecords(
      records,
      (record) => record.games100OrFewer,
      "highest"
    ),
  };
}

function firstSeasonRecords(
  leaders: SeasonLeaderboardSet
): SeasonRecordSet {
  return {
    mostWins: firstOrNull(
      leaders.mostWins
    ),

    fewestWins: firstOrNull(
      leaders.fewestWins
    ),

    mostPointsFor: firstOrNull(
      leaders.mostPointsFor
    ),

    fewestPointsFor: firstOrNull(
      leaders.fewestPointsFor
    ),

    mostPointsAgainst: firstOrNull(
      leaders.mostPointsAgainst
    ),

    fewestPointsAgainst: firstOrNull(
      leaders.fewestPointsAgainst
    ),

    bestPointDifferential: firstOrNull(
      leaders.bestPointDifferential
    ),

    worstPointDifferential: firstOrNull(
      leaders.worstPointDifferential
    ),

    mostGamesOver150: firstOrNull(
      leaders.mostGamesOver150
    ),

    mostGames100OrFewer: firstOrNull(
      leaders.mostGames100OrFewer
    ),
  };
}

function buildAllTimeFranchiseRecords(
  performances: TeamPerformance[]
): AllTimeFranchiseRecord[] {
  const franchises = new Map<
    number,
    AllTimeFranchiseRecord
  >();

  for (const performance of performances) {
    let record = franchises.get(
      performance.rosterId
    );

    if (!record) {
      record = {
        rosterId: performance.rosterId,
        wins: 0,
        losses: 0,
        ties: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        pointDifferential: 0,
      };

      franchises.set(
        performance.rosterId,
        record
      );
    }

    if (
      performance.score >
      performance.opponentScore
    ) {
      record.wins++;
    } else if (
      performance.score <
      performance.opponentScore
    ) {
      record.losses++;
    } else {
      record.ties++;
    }

    record.pointsFor = rounded(
      record.pointsFor +
      performance.score
    );

    record.pointsAgainst = rounded(
      record.pointsAgainst +
      performance.opponentScore
    );

    record.pointDifferential = rounded(
      record.pointsFor -
      record.pointsAgainst
    );
  }

  return Array.from(franchises.values());
}

function calculateAllTimeLeaderboards(
  records: AllTimeFranchiseRecord[]
): AllTimeLeaderboardSet {
  return {
    mostWins: rankRecords(
      records,
      (record) => record.wins,
      "highest"
    ),

    fewestWins: rankRecords(
      records,
      (record) => record.wins,
      "lowest"
    ),

    mostPointsFor: rankRecords(
      records,
      (record) => record.pointsFor,
      "highest"
    ),

    mostPointsAgainst: rankRecords(
      records,
      (record) => record.pointsAgainst,
      "highest"
    ),

    bestPointDifferential: rankRecords(
      records,
      (record) =>
        record.pointDifferential,
      "highest"
    ),

    worstPointDifferential: rankRecords(
      records,
      (record) =>
        record.pointDifferential,
      "lowest"
    ),
  };
}

function firstAllTimeRecords(
  leaders: AllTimeLeaderboardSet
): AllTimeRecordSet {
  return {
    mostWins: firstOrNull(
      leaders.mostWins
    ),

    fewestWins: firstOrNull(
      leaders.fewestWins
    ),

    mostPointsFor: firstOrNull(
      leaders.mostPointsFor
    ),

    mostPointsAgainst: firstOrNull(
      leaders.mostPointsAgainst
    ),

    bestPointDifferential: firstOrNull(
      leaders.bestPointDifferential
    ),

    worstPointDifferential: firstOrNull(
      leaders.worstPointDifferential
    ),
  };
}

/**
 * A completed regular season must have
 * all five valid matchups in every week
 * from Week 1 through Week 14.
 *
 * This prevents a partially populated
 * Week 14 from marking the season complete.
 */
function isRegularSeasonComplete(
  matchups: HistoricalMatchup[]
): boolean {
  for (
    let week = 1;
    week <= REGULAR_SEASON_WEEKS;
    week++
  ) {
    const weekly = matchups.filter(
      (matchup) =>
        matchup.week === week &&
        matchup.phase ===
          "Regular Season" &&
        isValidPerformance(matchup)
    );

    if (
      weekly.length !==
      REGULAR_SEASON_MATCHUPS_PER_WEEK
    ) {
      return false;
    }

    const rosterIds = new Set<number>();

    for (const matchup of weekly) {
      rosterIds.add(matchup.rosterA);
      rosterIds.add(matchup.rosterB);
    }

    if (rosterIds.size !== 10) {
      return false;
    }
  }

  return true;
}

/**
 * The Slootbowl final must be present,
 * valid and officially completed.
 *
 * Week 17 placement games are not
 * eligible to establish completion.
 */
function arePlayoffsComplete(
  matchups: HistoricalMatchup[]
): boolean {
  return matchups.some(
    (matchup) =>
      matchup.week === 17 &&
      matchup.phase ===
        "Main Playoffs" &&
      isValidPerformance(matchup)
  );
}

function buildFilteredRecords(
  regularPerformances: TeamPerformance[],
  playoffPerformances: TeamPerformance[],
  regularSeasonRecords: SeasonRecord[],
  playoffSeasonRecords: SeasonRecord[]
): FilteredSeasonRecords {
  const regularGameLeaders =
    calculateGameLeaderboards(
      regularPerformances
    );

  const playoffGameLeaders =
    calculateGameLeaderboards(
      playoffPerformances
    );

  const regularSeasonLeaders =
    calculateSeasonLeaderboards(
      regularSeasonRecords
    );

  const playoffSeasonLeaders =
    calculateSeasonLeaderboards(
      playoffSeasonRecords
    );

  return {
    individualGame: {
      regularSeason: firstGameRecords(
        regularGameLeaders
      ),

      mainPlayoffs: firstGameRecords(
        playoffGameLeaders
      ),
    },

    season: {
      regularSeason: firstSeasonRecords(
        regularSeasonLeaders
      ),

      mainPlayoffs: firstSeasonRecords(
        playoffSeasonLeaders
      ),
    },

    leaderboards: {
      individualGame: {
        regularSeason:
          regularGameLeaders,

        mainPlayoffs:
          playoffGameLeaders,
      },

      season: {
        regularSeason:
          regularSeasonLeaders,

        mainPlayoffs:
          playoffSeasonLeaders,
      },
    },
  };
}

function buildFranchiseAchievements(
  performances: TeamPerformance[],
  championshipResults: {
    season: string;
    championRosterId: number;
    runnerUpRosterId: number;
  }[]
): FranchiseAchievement[] {
  const franchises = new Map<
    number,
    FranchiseAchievement
  >();

  function ensure(
    rosterId: number
  ): FranchiseAchievement {
    const existing =
      franchises.get(rosterId);

    if (existing) {
      return existing;
    }

    const created: FranchiseAchievement = {
      rosterId,
      championships: 0,
      championshipSeasons: [],
      slootbowlAppearances: 0,
      slootbowlSeasons: [],
      runnerUpFinishes: 0,
      runnerUpSeasons: [],
      playoffAppearances: 0,
      playoffSeasons: [],
      playoffWins: 0,
      playoffLosses: 0,
      playoffTies: 0,
    };

    franchises.set(rosterId, created);

    return created;
  }

  for (const performance of performances) {
    ensure(performance.rosterId);
  }

  const playoffAppearances =
    new Map<number, Set<string>>();

  for (const performance of performances) {
    if (
      performance.phase !==
      "Main Playoffs"
    ) {
      continue;
    }

    const franchise = ensure(
      performance.rosterId
    );

    if (
      performance.score >
      performance.opponentScore
    ) {
      franchise.playoffWins++;
    } else if (
      performance.score <
      performance.opponentScore
    ) {
      franchise.playoffLosses++;
    } else {
      franchise.playoffTies++;
    }

    let years = playoffAppearances.get(
      performance.rosterId
    );

    if (!years) {
      years = new Set<string>();

      playoffAppearances.set(
        performance.rosterId,
        years
      );
    }

    years.add(performance.season);
  }

  for (const [rosterId, years] of
    playoffAppearances.entries()) {
    const franchise = ensure(rosterId);

    franchise.playoffSeasons =
      Array.from(years).sort(
        (a, b) => Number(a) - Number(b)
      );

    franchise.playoffAppearances =
      franchise.playoffSeasons.length;
  }

  for (const result of championshipResults) {
    const champion = ensure(
      result.championRosterId
    );

    const runnerUp = ensure(
      result.runnerUpRosterId
    );

    champion.championships++;
    champion.slootbowlAppearances++;

    champion.championshipSeasons.push(
      result.season
    );

    champion.slootbowlSeasons.push(
      result.season
    );

    runnerUp.runnerUpFinishes++;
    runnerUp.slootbowlAppearances++;

    runnerUp.runnerUpSeasons.push(
      result.season
    );

    runnerUp.slootbowlSeasons.push(
      result.season
    );
  }

  return Array.from(franchises.values())
    .sort(
      (a, b) =>
        a.rosterId - b.rosterId
    );
}

function calculateAchievementLeaderboards(
  franchises: FranchiseAchievement[]
): AchievementLeaderboards {
  return {
    championships: rankRecords(
      franchises.filter(
        (record) =>
          record.championships > 0
      ),
      (record) => record.championships,
      "highest"
    ),

    slootbowlAppearances: rankRecords(
      franchises.filter(
        (record) =>
          record.slootbowlAppearances > 0
      ),
      (record) =>
        record.slootbowlAppearances,
      "highest"
    ),

    runnerUpFinishes: rankRecords(
      franchises.filter(
        (record) =>
          record.runnerUpFinishes > 0
      ),
      (record) =>
        record.runnerUpFinishes,
      "highest"
    ),

    playoffAppearances: rankRecords(
      franchises.filter(
        (record) =>
          record.playoffAppearances > 0
      ),
      (record) =>
        record.playoffAppearances,
      "highest"
    ),

    playoffWins: rankRecords(
      franchises.filter(
        (record) =>
          record.playoffWins > 0
      ),
      (record) =>
        record.playoffWins,
      "highest"
    ),

    playoffLosses: rankRecords(
      franchises.filter(
        (record) =>
          record.playoffLosses > 0
      ),
      (record) =>
        record.playoffLosses,
      "highest"
    ),
  };
}

/**
 * Regular-season streaks must use
 * consecutive fantasy weeks.
 *
 * Week 14 -> next season Week 1 is
 * a legitimate consecutive transition.
 *
 * Missing weeks break streaks instead
 * of accidentally joining separate runs.
 *
 * Playoff streaks follow successive
 * playoff appearances. Byes and
 * off-seasons do not break them.
 */
function areConsecutiveStreakGames(
  previous: TeamPerformance,
  current: TeamPerformance,
  competition: Competition
): boolean {
  const previousYear =
    Number(previous.season);

  const currentYear =
    Number(current.season);

  if (
    !Number.isFinite(previousYear) ||
    !Number.isFinite(currentYear)
  ) {
    return false;
  }

  if (competition === "mainPlayoffs") {
    return true;
  }

  if (previousYear === currentYear) {
    return (
      current.week ===
      previous.week + 1
    );
  }

  return (
    currentYear === previousYear + 1 &&
    previous.week ===
      REGULAR_SEASON_WEEKS &&
    current.week === 1
  );
}

function buildStreaks(
  performances: TeamPerformance[],
  competition: Competition,
  result: "win" | "loss"
): StreakRecord[] {
  const requiredPhase: RecordPhase =
    competition === "regularSeason"
      ? "Regular Season"
      : "Main Playoffs";

  const byFranchise = new Map<
    number,
    TeamPerformance[]
  >();

  for (const performance of performances) {
    if (
      performance.phase !== requiredPhase
    ) {
      continue;
    }

    const games =
      byFranchise.get(
        performance.rosterId
      ) ?? [];

    games.push(performance);

    byFranchise.set(
      performance.rosterId,
      games
    );
  }

  const streaks: StreakRecord[] = [];

  for (const [rosterId, games] of
    byFranchise.entries()) {
    games.sort(
      (a, b) =>
        Number(a.season) -
          Number(b.season) ||
        a.week - b.week
    );

    let start: TeamPerformance | null =
      null;

    let end: TeamPerformance | null =
      null;

    let length = 0;

    let previousGame:
      | TeamPerformance
      | null = null;

    function finishStreak() {
      if (
        start === null ||
        end === null ||
        length === 0
      ) {
        return;
      }

      streaks.push({
        rosterId,
        competition,
        result,
        length,
        startSeason: start.season,
        startWeek: start.week,
        endSeason: end.season,
        endWeek: end.week,
      });

      start = null;
      end = null;
      length = 0;
    }

    for (const game of games) {
      if (
        previousGame !== null &&
        !areConsecutiveStreakGames(
          previousGame,
          game,
          competition
        )
      ) {
        finishStreak();
      }

      const won =
        game.score >
        game.opponentScore;

      const lost =
        game.score <
        game.opponentScore;

      const matches =
        result === "win"
          ? won
          : lost;

      if (!matches) {
        finishStreak();
        previousGame = game;
        continue;
      }

      if (length === 0) {
        start = game;
      }

      end = game;
      length++;

      previousGame = game;
    }

    finishStreak();
  }

  return streaks;
}

function rankStreaks(
  streaks: StreakRecord[]
): StreakRecord[] {
  const sorted = [...streaks].sort(
    (a, b) =>
      b.length - a.length ||
      Number(a.startSeason) -
        Number(b.startSeason) ||
      a.startWeek - b.startWeek ||
      a.rosterId - b.rosterId
  );

  if (
    sorted.length <=
    LEADERBOARD_LIMIT
  ) {
    return sorted;
  }

  const cutoff =
    sorted[LEADERBOARD_LIMIT - 1].length;

  return sorted.filter(
    (streak, index) =>
      index < LEADERBOARD_LIMIT ||
      streak.length === cutoff
  );
}

function calculateStreakLeaderboards(
  performances: TeamPerformance[]
): StreakLeaderboards {
  return {
    regularSeasonWinning: rankStreaks(
      buildStreaks(
        performances,
        "regularSeason",
        "win"
      )
    ),

    regularSeasonLosing: rankStreaks(
      buildStreaks(
        performances,
        "regularSeason",
        "loss"
      )
    ),

    mainPlayoffsWinning: rankStreaks(
      buildStreaks(
        performances,
        "mainPlayoffs",
        "win"
      )
    ),

    mainPlayoffsLosing: rankStreaks(
      buildStreaks(
        performances,
        "mainPlayoffs",
        "loss"
      )
    ),
  };
}

export async function getAllTimeRecords():
  Promise<AllTimeRecords> {
  const seasons =
    await getHistoricalData();

  /**
   * Only officially completed games
   * enter the performance pipeline.
   */
  const allPerformances =
    seasons.flatMap(
      (season) =>
        buildPerformances(
          season.matchups
        )
    );

  const regularSeason =
    allPerformances.filter(
      (performance) =>
        performance.phase ===
        "Regular Season"
    );

  const mainPlayoffs =
    allPerformances.filter(
      (performance) =>
        performance.phase ===
        "Main Playoffs"
    );

  const availableSeasons =
    Array.from(
      new Set(
        seasons.map(
          (season) =>
            season.league.season
        )
      )
    ).sort(
      (a, b) =>
        Number(b) - Number(a)
    );

  const completedRegularSeasons =
    seasons
      .filter((season) =>
        isRegularSeasonComplete(
          season.matchups
        )
      )
      .map(
        (season) =>
          season.league.season
      );

  const completedPlayoffSeasons =
    seasons
      .filter((season) =>
        arePlayoffsComplete(
          season.matchups
        )
      )
      .map(
        (season) =>
          season.league.season
      );

  const completedRegularPerformances =
    regularSeason.filter(
      (performance) =>
        completedRegularSeasons.includes(
          performance.season
        )
    );

  const completedPlayoffPerformances =
    mainPlayoffs.filter(
      (performance) =>
        completedPlayoffSeasons.includes(
          performance.season
        )
    );

  const bySeason: Record<
    string,
    FilteredSeasonRecords
  > = {};

  for (const year of availableSeasons) {
    const yearRegular =
      regularSeason.filter(
        (performance) =>
          performance.season === year
      );

    const yearPlayoffs =
      mainPlayoffs.filter(
        (performance) =>
          performance.season === year
      );

    bySeason[year] =
      buildFilteredRecords(
        yearRegular,
        yearPlayoffs,
        buildSeasonRecords(
          yearRegular
        ),
        buildSeasonRecords(
          yearPlayoffs
        )
      );
  }

  const allTimeLeaders =
    calculateAllTimeLeaderboards(
      buildAllTimeFranchiseRecords(
        allPerformances
      )
    );

  const filteredRecords =
    buildFilteredRecords(
      regularSeason,
      mainPlayoffs,
      buildSeasonRecords(
        completedRegularPerformances
      ),
      buildSeasonRecords(
        completedPlayoffPerformances
      )
    );

  /**
   * Only completed playoff seasons
   * are eligible for verified
   * Slootbowl championship results.
   */
  const completedThroughSeason =
    completedPlayoffSeasons.length > 0
      ? Math.max(
          ...completedPlayoffSeasons.map(
            Number
          )
        )
      : 0;

  const verifiedSlootbowls =
    completedThroughSeason > 0
      ? await getSlootbowlResults(
          seasons,
          completedThroughSeason
        )
      : [];

  const championshipResults =
    verifiedSlootbowls
      .filter((result) =>
        completedPlayoffSeasons.includes(
          String(result.season)
        )
      )
      .map((result) => ({
        season: String(result.season),
        championRosterId:
          result.championRosterId,
        runnerUpRosterId:
          result.runnerUpRosterId,
      }));

  const franchises =
    buildFranchiseAchievements(
      allPerformances,
      championshipResults
    );

  const historicalAchievements:
    HistoricalAchievements = {
      franchises,

      leaderboards:
        calculateAchievementLeaderboards(
          franchises
        ),

      streaks:
        calculateStreakLeaderboards(
          allPerformances
        ),
    };

  return {
    ...filteredRecords,

    allTime: firstAllTimeRecords(
      allTimeLeaders
    ),

    allTimeLeaderboards:
      allTimeLeaders,

    bySeason,

    availableSeasons,

    completedSeasons: {
      regularSeason:
        completedRegularSeasons,

      mainPlayoffs:
        completedPlayoffSeasons,
    },

    historicalAchievements,
  };
}
