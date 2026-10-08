
import {
  getHistoricalData,
  HistoricalMatchup,
} from "./sleeper";

export type RecordPhase =
  | "Regular Season"
  | "Main Playoffs";

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

export type FilteredSeasonRecords = {
  individualGame: {
    regularSeason: RecordSet;
    mainPlayoffs: RecordSet;
  };
  season: {
    regularSeason: SeasonRecordSet;
    mainPlayoffs: SeasonRecordSet;
  };
};

export type AllTimeRecords = FilteredSeasonRecords & {
  allTime: AllTimeRecordSet;
  bySeason: Record<string, FilteredSeasonRecords>;
  availableSeasons: string[];
  completedSeasons: {
    regularSeason: string[];
    mainPlayoffs: string[];
  };
};

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
    margin: Math.abs(
      performance.score - performance.opponentScore
    ),
  };
}

function highest<T>(
  records: T[],
  value: (record: T) => number
): T | null {
  return records.reduce<T | null>(
    (best, current) =>
      best === null || value(current) > value(best)
        ? current
        : best,
    null
  );
}

function lowest<T>(
  records: T[],
  value: (record: T) => number
): T | null {
  return records.reduce<T | null>(
    (best, current) =>
      best === null || value(current) < value(best)
        ? current
        : best,
    null
  );
}

function calculateRecordSet(
  performances: TeamPerformance[]
): RecordSet {
  const records = performances.map(toLeagueRecord);

  const winningGames = records.filter(
    (r) => r.score > r.opponentScore
  );

  const losingGames = records.filter(
    (r) => r.score < r.opponentScore
  );

  return {
    highestTeamScore: highest(records, (r) => r.score),
    lowestTeamScore: lowest(records, (r) => r.score),

    biggestWinningMargin: highest(
      winningGames,
      (r) => r.margin
    ),

    closestGame: lowest(records, (r) => r.margin),

    highestCombinedScore: highest(
      records,
      (r) => r.score + r.opponentScore
    ),

    lowestCombinedScore: lowest(
      records,
      (r) => r.score + r.opponentScore
    ),

    highestLosingScore: highest(
      losingGames,
      (r) => r.score
    ),

    lowestWinningScore: lowest(
      winningGames,
      (r) => r.score
    ),
  };
}

function buildSeasonRecords(
  performances: TeamPerformance[]
): SeasonRecord[] {
  const seasons = new Map<string, SeasonRecord>();

  for (const performance of performances) {
    const key =
      `${performance.season}-${performance.rosterId}`;

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
      };

      seasons.set(key, record);
    }

    if (performance.score > performance.opponentScore) {
      record.wins++;
    } else if (
      performance.score < performance.opponentScore
    ) {
      record.losses++;
    } else {
      record.ties++;
    }

    record.pointsFor += performance.score;
    record.pointsAgainst += performance.opponentScore;
    record.pointDifferential +=
      performance.score - performance.opponentScore;
  }

  return Array.from(seasons.values());
}

function calculateSeasonRecordSet(
  records: SeasonRecord[]
): SeasonRecordSet {
  return {
    mostWins: highest(records, (r) => r.wins),
    fewestWins: lowest(records, (r) => r.wins),

    mostPointsFor: highest(
      records,
      (r) => r.pointsFor
    ),

    fewestPointsFor: lowest(
      records,
      (r) => r.pointsFor
    ),

    mostPointsAgainst: highest(
      records,
      (r) => r.pointsAgainst
    ),

    fewestPointsAgainst: lowest(
      records,
      (r) => r.pointsAgainst
    ),

    bestPointDifferential: highest(
      records,
      (r) => r.pointDifferential
    ),

    worstPointDifferential: lowest(
      records,
      (r) => r.pointDifferential
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
    let record = franchises.get(performance.rosterId);

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

      franchises.set(performance.rosterId, record);
    }

    if (performance.score > performance.opponentScore) {
      record.wins++;
    } else if (
      performance.score < performance.opponentScore
    ) {
      record.losses++;
    } else {
      record.ties++;
    }

    record.pointsFor += performance.score;
    record.pointsAgainst += performance.opponentScore;
    record.pointDifferential +=
      performance.score - performance.opponentScore;
  }

  return Array.from(franchises.values());
}

function calculateAllTimeRecordSet(
  records: AllTimeFranchiseRecord[]
): AllTimeRecordSet {
  return {
    mostWins: highest(records, (r) => r.wins),
    fewestWins: lowest(records, (r) => r.wins),

    mostPointsFor: highest(
      records,
      (r) => r.pointsFor
    ),

    mostPointsAgainst: highest(
      records,
      (r) => r.pointsAgainst
    ),

    bestPointDifferential: highest(
      records,
      (r) => r.pointDifferential
    ),

    worstPointDifferential: lowest(
      records,
      (r) => r.pointDifferential
    ),
  };
}

/*
 * A regular season is complete when all five
 * Week 14 matchups have final scores.
 *
 * The main playoffs are complete when the
 * Week 17 Slootbowl has a final score.
 *
 * Historical seasons are checked using their
 * actual matchup data, not the calendar year.
 */

function isFinalScore(
  matchup: HistoricalMatchup
): boolean {
  return (
    Number.isFinite(matchup.scoreA) &&
    Number.isFinite(matchup.scoreB) &&
    (matchup.scoreA !== 0 || matchup.scoreB !== 0)
  );
}

function isRegularSeasonComplete(
  matchups: HistoricalMatchup[]
): boolean {
  const finalWeek = matchups.filter(
    (matchup) =>
      matchup.week === 14 &&
      matchup.phase === "Regular Season" &&
      isFinalScore(matchup)
  );

  return finalWeek.length === 5;
}

function arePlayoffsComplete(
  matchups: HistoricalMatchup[]
): boolean {
  return matchups.some(
    (matchup) =>
      matchup.week === 17 &&
      matchup.phase === "Main Playoffs" &&
      isFinalScore(matchup)
  );
}

export async function getAllTimeRecords(): Promise<AllTimeRecords> {
  const seasons = await getHistoricalData();

  const allPerformances = seasons.flatMap((season) =>
    buildPerformances(season.matchups)
  );

  const regularSeason = allPerformances.filter(
    (p) => p.phase === "Regular Season"
  );

  const mainPlayoffs = allPerformances.filter(
    (p) => p.phase === "Main Playoffs"
  );

  const availableSeasons = Array.from(
    new Set(
      seasons.map((season) => season.league.season)
    )
  ).sort((a, b) => Number(b) - Number(a));

  const completedRegularSeasons = seasons
    .filter((season) =>
      isRegularSeasonComplete(season.matchups)
    )
    .map((season) => season.league.season);

  const completedPlayoffSeasons = seasons
    .filter((season) =>
      arePlayoffsComplete(season.matchups)
    )
    .map((season) => season.league.season);

  const completedRegularPerformances =
    regularSeason.filter((p) =>
      completedRegularSeasons.includes(p.season)
    );

  const completedPlayoffPerformances =
    mainPlayoffs.filter((p) =>
      completedPlayoffSeasons.includes(p.season)
    );

  const bySeason: Record<
    string,
    FilteredSeasonRecords
  > = {};

  for (const year of availableSeasons) {
    const yearRegular = regularSeason.filter(
      (p) => p.season === year
    );

    const yearPlayoffs = mainPlayoffs.filter(
      (p) => p.season === year
    );

    bySeason[year] = {
      individualGame: {
        regularSeason: calculateRecordSet(yearRegular),
        mainPlayoffs: calculateRecordSet(yearPlayoffs),
      },

      season: {
        regularSeason: calculateSeasonRecordSet(
          buildSeasonRecords(yearRegular)
        ),

        mainPlayoffs: calculateSeasonRecordSet(
          buildSeasonRecords(yearPlayoffs)
        ),
      },
    };
  }

  return {
    individualGame: {
      regularSeason: calculateRecordSet(regularSeason),
      mainPlayoffs: calculateRecordSet(mainPlayoffs),
    },

    season: {
      regularSeason: calculateSeasonRecordSet(
        buildSeasonRecords(
          completedRegularPerformances
        )
      ),

      mainPlayoffs: calculateSeasonRecordSet(
        buildSeasonRecords(
          completedPlayoffPerformances
        )
      ),
    },

    allTime: calculateAllTimeRecordSet(
      buildAllTimeFranchiseRecords(allPerformances)
    ),

    bySeason,
    availableSeasons,

    completedSeasons: {
      regularSeason: completedRegularSeasons,
      mainPlayoffs: completedPlayoffSeasons,
    },
  };
}
