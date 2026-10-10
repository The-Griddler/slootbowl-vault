
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

function round(value: number) {
  return Math.round(value * 10) / 10;
}

export function calculateGreatestGames(
  matchups: HistoricalMatchup[]
): GreatestGame[] {
  const eligible = matchups
    .filter(validGame)
    .sort(
      (a, b) =>
        Number(a.season) - Number(b.season) ||
        a.week - b.week
    );

  // Find the highest combined score
  // in the historical dataset.
  const maxCombined = Math.max(
    1,
    ...eligible.map(
      (game) => game.scoreA + game.scoreB
    )
  );

  const records = new Map<string, TeamRecord>();

  function getRecord(
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

  const results: GreatestGame[] = [];

  for (const game of eligible) {
    const recordA = getRecord(
      game.season,
      game.rosterA
    );

    const recordB = getRecord(
      game.season,
      game.rosterB
    );

    // Snapshot the records BEFORE this game.
    const pregameRecordA = recordString(recordA);
    const pregameRecordB = recordString(recordB);

    const rateA = winRate(recordA);
    const rateB = winRate(recordB);

    const margin = Math.abs(
      game.scoreA - game.scoreB
    );

    const combinedScore =
      game.scoreA + game.scoreB;

    const winnerId =
      game.scoreA > game.scoreB
        ? game.rosterA
        : game.scoreB > game.scoreA
          ? game.rosterB
          : null;

    // 40 points: progressively rewards
    // increasingly close results.
    // Margins of 50+ score zero.
    const closenessPoints =
      40 *
      Math.pow(
        Math.max(0, 1 - margin / 50),
        1.5
      );

    // 25 points: rewards high combined
    // scores relative to league history.
    const scoringPoints =
      25 * (combinedScore / maxCombined);

    // 25 points: importance of the fixture.
    // Week 17 is the Slootbowl;
    // Week 16 is the semifinal round.
    let importancePoints = 5;

    if (game.phase === "Main Playoffs") {
      if (game.week === 17) {
        importancePoints = 25;
      } else if (game.week === 16) {
        importancePoints = 19;
      } else {
        importancePoints = 14;
      }
    }

    // 10 points: underdog drama.
    // Only award upset points when the
    // winner had a meaningfully worse
    // record before kickoff.
    const gamesA =
      recordA.wins + recordA.losses + recordA.ties;

    const gamesB =
      recordB.wins + recordB.losses + recordB.ties;

    const enoughHistory =
      gamesA >= 3 && gamesB >= 3;

    const winnerRate =
      winnerId === game.rosterA
        ? rateA
        : rateB;

    const loserRate =
      winnerId === game.rosterA
        ? rateB
        : rateA;

    const recordGap = loserRate - winnerRate;

    const isUpset =
      enoughHistory &&
      winnerId !== null &&
      recordGap >= 0.15;

    const underdogPoints = isUpset
      ? Math.min(10, recordGap * 20)
      : 0;

    const greatnessScore = round(
      closenessPoints +
        scoringPoints +
        importancePoints +
        underdogPoints
    );

    results.push({
      season: game.season,
      week: game.week,
      phase: game.phase,
      rosterA: game.rosterA,
      rosterB: game.rosterB,
      scoreA: game.scoreA,
      scoreB: game.scoreB,
      winnerId,
      margin: round(margin),
      combinedScore: round(combinedScore),
      closenessPoints: round(closenessPoints),
      scoringPoints: round(scoringPoints),
      importancePoints,
      underdogPoints: round(underdogPoints),
      greatnessScore,
      pregameRecordA,
      pregameRecordB,
      isUpset,
    });

    // Update records only after scoring
    // the fixture, preventing future
    // results influencing the prediction.
    if (game.phase === "Regular Season") {
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
