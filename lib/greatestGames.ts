
import type { HistoricalMatchup } from "./sleeper";

export type GreatestGame = {
  season: string;
  week: number;
  phase: string;
  rosterA: number;
  rosterB: number;
  scoreA: number;
  scoreB: number;
  winnerId: number | null;
  margin: number;
  combinedScore: number;
  closenessPoints: number;
  scoringPoints: number;
  importancePoints: number;
  underdogPoints: number;
  greatnessScore: number;
  pregameRecordA: string;
  pregameRecordB: string;
  isUpset: boolean;
};

type TeamRecord = {
  wins: number;
  losses: number;
  ties: number;
};

function roundTo(value: number, places: number) {
  const multiplier = 10 ** places;

  return (
    Math.round((value + Number.EPSILON) * multiplier) /
    multiplier
  );
}

function validGame(game: HistoricalMatchup) {
  return (
    (game.phase === "Regular Season" ||
      game.phase === "Main Playoffs") &&
    Number.isFinite(game.scoreA) &&
    Number.isFinite(game.scoreB) &&
    (game.scoreA !== 0 || game.scoreB !== 0) &&
    game.rosterA !== game.rosterB
  );
}

function recordString(record: TeamRecord) {
  return `${record.wins}-${record.losses}-${record.ties}`;
}

function winRate(record: TeamRecord) {
  const games =
    record.wins + record.losses + record.ties;

  return games > 0
    ? (record.wins + record.ties * 0.5) / games
    : 0.5;
}

function gamesPlayed(record: TeamRecord) {
  return (
    record.wins + record.losses + record.ties
  );
}

function getRecord(
  records: Map<string, TeamRecord>,
  season: string,
  rosterId: number
): TeamRecord {
  const key = `${season}:${rosterId}`;

  if (!records.has(key)) {
    records.set(key, {
      wins: 0,
      losses: 0,
      ties: 0,
    });
  }

  return records.get(key)!;
}

function getImportancePoints(
  game: HistoricalMatchup
) {
  if (game.phase === "Regular Season") {
    return 5;
  }

  // The current SFL playoff structure:
  // Week 15: opening round
  // Week 16: semifinals
  // Week 17: championship
  //
  // Main Playoffs is already classified
  // using Sleeper's winners bracket.
  if (game.week === 17) {
    return 25;
  }

  if (game.week === 16) {
    return 19;
  }

  return 14;
}

export function calculateGreatestGames(
  matchups: HistoricalMatchup[]
): GreatestGame[] {
  const eligible = matchups
    .filter(validGame)
    .sort(
      (a, b) =>
        Number(a.season) - Number(b.season) ||
        a.week - b.week ||
        a.rosterA - b.rosterA ||
        a.rosterB - b.rosterB
    );

  const maxCombined = Math.max(
    1,
    ...eligible.map(
      (game) => game.scoreA + game.scoreB
    )
  );

  const records = new Map<string, TeamRecord>();

  const results: GreatestGame[] = [];

  // Group games by season and week.
  // Every game in a given week must use
  // the same pre-week standings.
  const weeklyGroups = new Map<
    string,
    HistoricalMatchup[]
  >();

  for (const game of eligible) {
    const key = `${game.season}:${game.week}`;

    if (!weeklyGroups.has(key)) {
      weeklyGroups.set(key, []);
    }

    weeklyGroups.get(key)!.push(game);
  }

  for (const weeklyGames of weeklyGroups.values()) {
    // FIRST PASS:
    // Calculate greatness using records
    // as they stood before this week.
    for (const game of weeklyGames) {
      const recordA = getRecord(
        records,
        game.season,
        game.rosterA
      );

      const recordB = getRecord(
        records,
        game.season,
        game.rosterB
      );

      const pregameRecordA =
        recordString(recordA);

      const pregameRecordB =
        recordString(recordB);

      const scoreA = roundTo(game.scoreA, 2);
      const scoreB = roundTo(game.scoreB, 2);

      const margin = roundTo(
        Math.abs(scoreA - scoreB),
        2
      );

      const combinedScore = roundTo(
        scoreA + scoreB,
        2
      );

      const winnerId =
        scoreA > scoreB
          ? game.rosterA
          : scoreB > scoreA
            ? game.rosterB
            : null;

      // CLOSENESS: 40 POINTS
      //
      // A tie scores 40.
      // Increasing margins score less.
      // A margin of 50+ scores zero.
      const closenessPoints =
        40 *
        Math.pow(
          Math.max(0, 1 - margin / 50),
          1.5
        );

      // SCORING QUALITY: 25 POINTS
      //
      // Compare total points against the
      // highest-scoring eligible matchup.
      const scoringPoints =
        25 * (combinedScore / maxCombined);

      // MATCH IMPORTANCE: 25 POINTS
      const importancePoints =
        getImportancePoints(game);

      // UNDERDOG DRAMA: 10 POINTS
      //
      // Compare regular-season win rates
      // entering the game.
      //
      // Require at least three previous
      // regular-season games for each side.
      const enoughHistory =
        gamesPlayed(recordA) >= 3 &&
        gamesPlayed(recordB) >= 3;

      const rateA = winRate(recordA);
      const rateB = winRate(recordB);

      const winnerRate =
        winnerId === game.rosterA
          ? rateA
          : rateB;

      const loserRate =
        winnerId === game.rosterA
          ? rateB
          : rateA;

      const recordGap =
        loserRate - winnerRate;

      const isUpset =
        winnerId !== null &&
        enoughHistory &&
        recordGap >= 0.15;

      const underdogPoints = isUpset
        ? Math.min(10, recordGap * 20)
        : 0;

      const greatnessScore = roundTo(
        closenessPoints +
          scoringPoints +
          importancePoints +
          underdogPoints,
        1
      );

      results.push({
        season: game.season,
        week: game.week,
        phase: game.phase,
        rosterA: game.rosterA,
        rosterB: game.rosterB,
        scoreA,
        scoreB,
        winnerId,
        margin,
        combinedScore,
        closenessPoints: roundTo(
          closenessPoints,
          1
        ),
        scoringPoints: roundTo(
          scoringPoints,
          1
        ),
        importancePoints,
        underdogPoints: roundTo(
          underdogPoints,
          1
        ),
        greatnessScore,
        pregameRecordA,
        pregameRecordB,
        isUpset,
      });
    }

    // SECOND PASS:
    // Only after all games have been
    // scored do we update standings.
    //
    // Playoff results do not alter
    // regular-season win-loss records.
    for (const game of weeklyGames) {
      if (game.phase !== "Regular Season") {
        continue;
      }

      const recordA = getRecord(
        records,
        game.season,
        game.rosterA
      );

      const recordB = getRecord(
        records,
        game.season,
        game.rosterB
      );

      if (game.scoreA > game.scoreB) {
        recordA.wins++;
        recordB.losses++;
      } else if (game.scoreB > game.scoreA) {
        recordB.wins++;
        recordA.losses++;
      } else {
        recordA.ties++;
        recordB.ties++;
      }
    }
  }

  return results.sort(
    (a, b) =>
      b.greatnessScore - a.greatnessScore ||
      a.margin - b.margin ||
      b.combinedScore - a.combinedScore
  );
}
