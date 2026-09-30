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

export type RecordSet = {
  highestTeamScore: LeagueRecord | null;
  lowestTeamScore: LeagueRecord | null;
  biggestWinningMargin: LeagueRecord | null;
  closestGame: LeagueRecord | null;
};

export type AllTimeRecords = {
  regularSeason: RecordSet;
  mainPlayoffs: RecordSet;
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

  return {
    highestTeamScore,
    lowestTeamScore,
    biggestWinningMargin,
    closestGame,
  };
}

export async function getAllTimeRecords(): Promise<AllTimeRecords> {
  const seasons = await getHistoricalData();

  const allPerformances = seasons.flatMap(
    (season) =>
      buildPerformances(season.matchups)
  );

  const regularSeason =
    allPerformances.filter(
      (performance) =>
        performance.phase === "Regular Season"
    );

  const mainPlayoffs =
    allPerformances.filter(
      (performance) =>
        performance.phase === "Main Playoffs"
    );

  return {
    regularSeason:
      calculateRecordSet(regularSeason),

    mainPlayoffs:
      calculateRecordSet(mainPlayoffs),
  };
}