
import type {
  HistoricalSeason,
  SleeperBracketMatch,
} from "./sleeper";

import type {
  SlootbowlResult,
} from "./legacyPlayoffs";

// Identify the official Slootbowl championship
// using Sleeper's winners bracket.
//
// Only completed seasons are eligible.
// Third-place and consolation matches are excluded.
//
// No championship result is returned unless
// the bracket and historical matchup agree.

async function fetchWinnersBracket(
  leagueId: string
): Promise<SleeperBracketMatch[]> {
  const response = await fetch(
    `https://api.sleeper.app/v1/league/${leagueId}/winners_bracket`,
    {
      next: {
        revalidate: 300,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to load winners bracket for ${leagueId}`
    );
  }

  return response.json();
}

function sameRosterPair(
  a: number,
  b: number,
  c: number,
  d: number
): boolean {
  return (
    (a === c && b === d) ||
    (a === d && b === c)
  );
}

export async function getSlootbowlResults(
  historicalSeasons: HistoricalSeason[],
  completedThroughSeason: number
): Promise<SlootbowlResult[]> {
  const completedSeasons =
    historicalSeasons.filter(
      (season) =>
        Number(season.league.season) <=
        completedThroughSeason
    );

  const results = await Promise.all(
    completedSeasons.map(async (season) => {
      const bracket = await fetchWinnersBracket(
        season.league.league_id
      );

      // The championship is the first-place match
      // in the highest winners-bracket round.
      const championshipCandidates = bracket.filter(
        (match) =>
          match.p === 1 &&
          match.t1 !== null &&
          match.t2 !== null &&
          match.w !== null &&
          match.l !== null
      );

      if (championshipCandidates.length === 0) {
        return null;
      }

      const highestRound = Math.max(
        ...championshipCandidates.map(
          (match) => match.r
        )
      );

      const finals = championshipCandidates.filter(
        (match) => match.r === highestRound
      );

      // Ambiguous championship results are skipped
      // rather than awarding incorrect Legacy Points.
      if (finals.length !== 1) {
        return null;
      }

      const final = finals[0];

      if (
        final.t1 === null ||
        final.t2 === null ||
        final.w === null ||
        final.l === null
      ) {
        return null;
      }

      if (
        final.w === final.l ||
        !sameRosterPair(
          final.t1,
          final.t2,
          final.w,
          final.l
        )
      ) {
        return null;
      }

      // Verify that the championship actually
      // appears in the recorded main playoffs.
      const matchingGames = season.matchups.filter(
        (matchup) =>
          matchup.phase === "Main Playoffs" &&
          sameRosterPair(
            matchup.rosterA,
            matchup.rosterB,
            final.t1!,
            final.t2!
          )
      );

      if (matchingGames.length !== 1) {
        return null;
      }

      const championshipGame = matchingGames[0];

      // Confirm the winning roster has the
      // higher fantasy score.
      const winnerScore =
        championshipGame.rosterA === final.w
          ? championshipGame.scoreA
          : championshipGame.scoreB;

      const loserScore =
        championshipGame.rosterA === final.l
          ? championshipGame.scoreA
          : championshipGame.scoreB;

      if (winnerScore <= loserScore) {
        return null;
      }

      return {
        season: season.league.season,
        week: championshipGame.week,
        championRosterId: final.w,
        runnerUpRosterId: final.l,
      };
    })
  );

  return results
    .filter(
      (result): result is SlootbowlResult =>
        result !== null
    )
    .sort(
      (a, b) =>
        Number(a.season) - Number(b.season)
    );
}
