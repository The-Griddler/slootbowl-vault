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

export type LeagueRecord = {
  season: string;
  week: number;
  phase: RecordPhase;
  rosterId: number;
  score: number;
  opponentRosterId: number;
  opponentScore: number;
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

export type AllTimeRecords = {
  individualGame: {
    regularSeason: RecordSet;
    mainPlayoffs: RecordSet;
  };
  season: {
    regularSeason: SeasonRecordSet;
    mainPlayoffs: SeasonRecordSet;
  };
  allTime: AllTimeRecordSet;
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
      performance.score -
        performance.opponentScore
    ),
  };
}

function calculateRecordSet(
  performances: TeamPerformance[]
): RecordSet {
  const records =
    performances.map(toLeagueRecord);

  const highestTeamScore =
    records.reduce<LeagueRecord | null>(
      (best, current) =>
        best === null ||
        current.score > best.score
          ? current
          : best,
      null
    );

  const lowestTeamScore =
    records.reduce<LeagueRecord | null>(
      (best, current) =>
        best === null ||
        current.score < best.score
          ? current
          : best,
      null
    );

  const winningGames = records.filter(
    (record) =>
      record.score > record.opponentScore
  );

  const losingGames = records.filter(
    (record) =>
      record.score < record.opponentScore
  );

  const biggestWinningMargin =
    winningGames.reduce<LeagueRecord | null>(
      (best, current) =>
        best === null ||
        current.margin > best.margin
          ? current
          : best,
      null
    );

  const closestGame =
    records.reduce<LeagueRecord | null>(
      (best, current) =>
        best === null ||
        current.margin < best.margin
          ? current
          : best,
      null
    );

  const highestCombinedScore =
    records.reduce<LeagueRecord | null>(
      (best, current) => {
        if (best === null) {
          return current;
        }

        const currentTotal =
          current.score +
          current.opponentScore;

        const bestTotal =
          best.score +
          best.opponentScore;

        return currentTotal > bestTotal
          ? current
          : best;
      },
      null
    );

  const lowestCombinedScore =
    records.reduce<LeagueRecord | null>(
      (best, current) => {
        if (best === null) {
          return current;
        }

        const currentTotal =
          current.score +
          current.opponentScore;

        const bestTotal =
          best.score +
          best.opponentScore;

        return currentTotal < bestTotal
          ? current
          : best;
      },
      null
    );

  const highestLosingScore =
    losingGames.reduce<LeagueRecord | null>(
      (best, current) =>
        best === null ||
        current.score > best.score
          ? current
          : best,
      null
    );

  const lowestWinningScore =
    winningGames.reduce<LeagueRecord | null>(
      (best, current) =>
        best === null ||
        current.score < best.score
          ? current
          : best,
      null
    );

  return {
    highestTeamScore,
    lowestTeamScore,
    biggestWinningMargin,
    closestGame,
    highestCombinedScore,
    lowestCombinedScore,
    highestLosingScore,
    lowestWinningScore,
  };
}

function buildSeasonRecords(
  performances: TeamPerformance[]
): SeasonRecord[] {
  const seasons = new Map<
    string,
    SeasonRecord
  >();

  for (const performance of performances) {
    const key =
      `${performance.season}-${performance.rosterId}`;

    const existing = seasons.get(key);

    if (!existing) {
      seasons.set(key, {
        season: performance.season,
        rosterId: performance.rosterId,
        wins:
          performance.score >
          performance.opponentScore
            ? 1
            : 0,
        losses:
          performance.score <
          performance.opponentScore
            ? 1
            : 0,
        ties:
          performance.score ===
          performance.opponentScore
            ? 1
            : 0,
        pointsFor: performance.score,
        pointsAgainst:
          performance.opponentScore,
        pointDifferential:
          performance.score -
          performance.opponentScore,
      });

      continue;
    }

    if (
      performance.score >
      performance.opponentScore
    ) {
      existing.wins += 1;
    } else if (
      performance.score <
      performance.opponentScore
    ) {
      existing.losses += 1;
    } else {
      existing.ties += 1;
    }

    existing.pointsFor += performance.score;
    existing.pointsAgainst +=
      performance.opponentScore;

    existing.pointDifferential +=
      performance.score -
      performance.opponentScore;
  }

  return Array.from(seasons.values());
}

function calculateSeasonRecordSet(
  records: SeasonRecord[]
): SeasonRecordSet {
  return {
    mostWins:
      records.reduce<SeasonRecord | null>(
        (best, current) =>
          best === null ||
          current.wins > best.wins
            ? current
            : best,
        null
      ),

    fewestWins:
      records.reduce<SeasonRecord | null>(
        (best, current) =>
          best === null ||
          current.wins < best.wins
            ? current
            : best,
        null
      ),

    mostPointsFor:
      records.reduce<SeasonRecord | null>(
        (best, current) =>
          best === null ||
          current.pointsFor >
            best.pointsFor
            ? current
            : best,
        null
      ),

    fewestPointsFor:
      records.reduce<SeasonRecord | null>(
        (best, current) =>
          best === null ||
          current.pointsFor <
            best.pointsFor
            ? current
            : best,
        null
      ),

    mostPointsAgainst:
      records.reduce<SeasonRecord | null>(
        (best, current) =>
          best === null ||
          current.pointsAgainst >
            best.pointsAgainst
            ? current
            : best,
        null
      ),

    fewestPointsAgainst:
      records.reduce<SeasonRecord | null>(
        (best, current) =>
          best === null ||
          current.pointsAgainst <
            best.pointsAgainst
            ? current
            : best,
        null
      ),

    bestPointDifferential:
      records.reduce<SeasonRecord | null>(
        (best, current) =>
          best === null ||
          current.pointDifferential >
            best.pointDifferential
            ? current
            : best,
        null
      ),

    worstPointDifferential:
      records.reduce<SeasonRecord | null>(
        (best, current) =>
          best === null ||
          current.pointDifferential <
            best.pointDifferential
            ? current
            : best,
        null
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
    const existing =
      franchises.get(
        performance.rosterId
      );

    if (!existing) {
      franchises.set(
        performance.rosterId,
        {
          rosterId: performance.rosterId,
          wins:
            performance.score >
            performance.opponentScore
              ? 1
              : 0,
          losses:
            performance.score <
            performance.opponentScore
              ? 1
              : 0,
          ties:
            performance.score ===
            performance.opponentScore
              ? 1
              : 0,
          pointsFor:
            performance.score,
          pointsAgainst:
            performance.opponentScore,
          pointDifferential:
            performance.score -
            performance.opponentScore,
        }
      );

      continue;
    }

    if (
      performance.score >
      performance.opponentScore
    ) {
      existing.wins += 1;
    } else if (
      performance.score <
      performance.opponentScore
    ) {
      existing.losses += 1;
    } else {
      existing.ties += 1;
    }

    existing.pointsFor +=
      performance.score;

    existing.pointsAgainst +=
      performance.opponentScore;

    existing.pointDifferential +=
      performance.score -
      performance.opponentScore;
  }

  return Array.from(
    franchises.values()
  );
}

function calculateAllTimeRecordSet(
  records: AllTimeFranchiseRecord[]
): AllTimeRecordSet {
  return {
    mostWins:
      records.reduce<AllTimeFranchiseRecord | null>(
        (best, current) =>
          best === null ||
          current.wins > best.wins
            ? current
            : best,
        null
      ),

    fewestWins:
      records.reduce<AllTimeFranchiseRecord | null>(
        (best, current) =>
          best === null ||
          current.wins < best.wins
            ? current
            : best,
        null
      ),

    mostPointsFor:
      records.reduce<AllTimeFranchiseRecord | null>(
        (best, current) =>
          best === null ||
          current.pointsFor >
            best.pointsFor
            ? current
            : best,
        null
      ),

    mostPointsAgainst:
      records.reduce<AllTimeFranchiseRecord | null>(
        (best, current) =>
          best === null ||
          current.pointsAgainst >
            best.pointsAgainst
            ? current
            : best,
        null
      ),

    bestPointDifferential:
      records.reduce<AllTimeFranchiseRecord | null>(
        (best, current) =>
          best === null ||
          current.pointDifferential >
            best.pointDifferential
            ? current
            : best,
        null
      ),

    worstPointDifferential:
      records.reduce<AllTimeFranchiseRecord | null>(
        (best, current) =>
          best === null ||
          current.pointDifferential <
            best.pointDifferential
            ? current
            : best,
        null
      ),
  };
}

export async function getAllTimeRecords(): Promise<AllTimeRecords> {
  const seasons =
    await getHistoricalData();

  const allPerformances =
    seasons.flatMap((season) =>
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

  const regularSeasonRecords =
    calculateRecordSet(
      regularSeason
    );

  const playoffRecords =
    calculateRecordSet(
      mainPlayoffs
    );

  const regularSeasonSeasons =
    buildSeasonRecords(
      regularSeason
    );

  const playoffSeasons =
    buildSeasonRecords(
      mainPlayoffs
    );

  const allTimeFranchises =
    buildAllTimeFranchiseRecords(
      allPerformances
    );

  return {
    individualGame: {
      regularSeason:
        regularSeasonRecords,
      mainPlayoffs:
        playoffRecords,
    },

    season: {
      regularSeason:
        calculateSeasonRecordSet(
          regularSeasonSeasons
        ),
      mainPlayoffs:
        calculateSeasonRecordSet(
          playoffSeasons
        ),
    },

    allTime:
      calculateAllTimeRecordSet(
        allTimeFranchises
      ),
  };
}