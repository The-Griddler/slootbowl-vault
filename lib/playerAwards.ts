
import type {
  HistoricalMatchup,
  HistoricalSeason,
} from "./sleeper";

type PlayerInfo = {
  position?: string | null;
  fantasy_positions?: string[] | null;
  years_exp?: number | null;
};

type PlayerDatabase = Record<
  string,
  PlayerInfo
>;

export type PlayerAwardWinner = {
  playerId: string;
  rosterId: number;
  points: number;
};

export type SeasonPlayerAwards = {
  season: string;
  regularSeasonComplete: boolean;
  mvp?: PlayerAwardWinner;
  opoy?: PlayerAwardWinner;
  roy?: PlayerAwardWinner;
  sbMvp?: PlayerAwardWinner;
};

type PlayerTotal = {
  playerId: string;
  points: number;
  rosters: Set<number>;
};

function isCompletedRegularMatchup(
  matchup: HistoricalMatchup
): boolean {
  return (
    matchup.phase === "Regular Season" &&
    matchup.isComplete === true &&
    Number.isFinite(matchup.scoreA) &&
    Number.isFinite(matchup.scoreB) &&
    matchup.scoreA >= 0 &&
    matchup.scoreB >= 0 &&
    (matchup.scoreA > 0 || matchup.scoreB > 0)
  );
}

function isCompletedPlayoffMatchup(
  matchup: HistoricalMatchup
): boolean {
  return (
    matchup.phase === "Main Playoffs" &&
    matchup.isComplete === true &&
    Number.isFinite(matchup.scoreA) &&
    Number.isFinite(matchup.scoreB) &&
    (matchup.scoreA > 0 || matchup.scoreB > 0)
  );
}

function isRegularSeasonComplete(
  completedMatchups: HistoricalMatchup[]
): boolean {
  return Array.from(
    { length: 14 },
    (_, index) => index + 1
  ).every((week) => {
    const weekly = completedMatchups.filter(
      (matchup) => matchup.week === week
    );

    if (weekly.length !== 5) {
      return false;
    }

    const rosterIds = new Set<number>();

    for (const matchup of weekly) {
      rosterIds.add(matchup.rosterA);
      rosterIds.add(matchup.rosterB);
    }

    return rosterIds.size === 10;
  });
}

function getAwardRosterId(
  player: PlayerTotal,
  eligibleRosters?: Set<number>
): number {
  const rosterIds = Array.from(player.rosters);

  if (eligibleRosters) {
    const eligible = rosterIds.find(
      (rosterId) =>
        eligibleRosters.has(rosterId)
    );

    if (eligible !== undefined) {
      return eligible;
    }
  }

  return rosterIds[0];
}

function toAwardWinner(
  player: PlayerTotal | undefined,
  eligibleRosters?: Set<number>
): PlayerAwardWinner | undefined {
  if (!player) {
    return undefined;
  }

  return {
    playerId: player.playerId,
    rosterId: getAwardRosterId(
      player,
      eligibleRosters
    ),
    points: player.points,
  };
}

/**
 * Calculates all four SFL Player Awards
 * using the existing Season Archive rules.
 *
 * MVP:
 * Highest regular-season starter points
 * among players who represented a
 * main-playoff franchise.
 *
 * OPOY:
 * Highest eligible scorer playing a
 * different position from the MVP.
 *
 * ROY:
 * Highest-scoring rookie based on
 * Sleeper's years_exp field.
 *
 * Slootbowl MVP:
 * Highest-scoring starter on the
 * winning team in Week 17.
 */
export function calculateSeasonPlayerAwards(
  seasonData: HistoricalSeason,
  historicalData: HistoricalSeason[],
  players: PlayerDatabase
): SeasonPlayerAwards {
  const season = seasonData.league.season;

  const completedRegularMatchups =
    seasonData.matchups.filter(
      isCompletedRegularMatchup
    );

  const regularSeasonComplete =
    isRegularSeasonComplete(
      completedRegularMatchups
    );

  const completedPlayoffMatchups =
    seasonData.matchups.filter(
      isCompletedPlayoffMatchup
    );

  const playoffTeams = new Set<number>();

  for (const matchup of completedPlayoffMatchups) {
    playoffTeams.add(matchup.rosterA);
    playoffTeams.add(matchup.rosterB);
  }

  // ========================================
  // REGULAR SEASON PLAYER TOTALS
  // ========================================

  const playerTotals = new Map<
    string,
    PlayerTotal
  >();

  for (const matchup of completedRegularMatchups) {
    const performances = [
      ...matchup.startersA.map(
        (playerId, index) => ({
          playerId,
          rosterId: matchup.rosterA,
          points:
            matchup.startersPointsA[index] ?? 0,
        })
      ),
      ...matchup.startersB.map(
        (playerId, index) => ({
          playerId,
          rosterId: matchup.rosterB,
          points:
            matchup.startersPointsB[index] ?? 0,
        })
      ),
    ];

    for (const performance of performances) {
      if (
        !performance.playerId ||
        performance.playerId === "0" ||
        !Number.isFinite(
          performance.points
        )
      ) {
        continue;
      }

      const existing = playerTotals.get(
        performance.playerId
      );

      if (existing) {
        existing.points +=
          performance.points;

        existing.rosters.add(
          performance.rosterId
        );
      } else {
        playerTotals.set(
          performance.playerId,
          {
            playerId: performance.playerId,
            points: performance.points,
            rosters: new Set([
              performance.rosterId,
            ]),
          }
        );
      }
    }
  }

  // ========================================
  // MVP
  // ========================================

  const mvpCandidates = Array.from(
    playerTotals.values()
  )
    .filter((player) =>
      Array.from(player.rosters).some(
        (rosterId) =>
          playoffTeams.has(rosterId)
      )
    )
    .sort(
      (a, b) =>
        b.points - a.points
    );

  const mvp = regularSeasonComplete
    ? mvpCandidates[0]
    : undefined;

  const mvpPlayer = mvp
    ? players[mvp.playerId]
    : null;

  const mvpPosition =
    mvpPlayer?.position ??
    mvpPlayer?.fantasy_positions?.[0] ??
    null;

  // ========================================
  // OPOY
  // ========================================

  const opoy = regularSeasonComplete
    ? mvpCandidates.find((candidate) => {
        const player =
          players[candidate.playerId];

        const position =
          player?.position ??
          player?.fantasy_positions?.[0] ??
          null;

        return (
          position &&
          position !== mvpPosition
        );
      })
    : undefined;

  // ========================================
  // ROY
  // ========================================

  const seasonNumber = Number(season);

  const currentPlayerDataSeason = Math.max(
    ...historicalData.map((item) =>
      Number(item.league.season)
    )
  );

  const rookieCandidates = Array.from(
    playerTotals.values()
  )
    .filter((candidate) => {
      const player =
        players[candidate.playerId];

      if (
        player?.years_exp === null ||
        player?.years_exp === undefined
      ) {
        return false;
      }

      const rookieSeason =
        currentPlayerDataSeason -
        player.years_exp;

      return rookieSeason === seasonNumber;
    })
    .sort(
      (a, b) =>
        b.points - a.points
    );

  const roy = regularSeasonComplete
    ? rookieCandidates[0]
    : undefined;

  // ========================================
  // SLOOTBOWL MVP
  // ========================================

  const slootbowl =
    completedPlayoffMatchups.find(
      (matchup) =>
        matchup.week === 17
    );

  let sbMvp:
    | PlayerAwardWinner
    | undefined;

  if (slootbowl) {
    const winningRosterId =
      slootbowl.scoreA >
      slootbowl.scoreB
        ? slootbowl.rosterA
        : slootbowl.scoreB >
          slootbowl.scoreA
        ? slootbowl.rosterB
        : null;

    if (winningRosterId !== null) {
      const winningStarters =
        winningRosterId ===
        slootbowl.rosterA
          ? slootbowl.startersA
          : slootbowl.startersB;

      const winningStarterPoints =
        winningRosterId ===
        slootbowl.rosterA
          ? slootbowl.startersPointsA
          : slootbowl.startersPointsB;

      const candidates = winningStarters
        .map((playerId, index) => ({
          playerId,
          rosterId: winningRosterId,
          points:
            winningStarterPoints[index] ?? 0,
        }))
        .filter(
          (candidate) =>
            candidate.playerId &&
            candidate.playerId !== "0" &&
            Number.isFinite(
              candidate.points
            )
        );

      sbMvp = candidates.sort(
        (a, b) =>
          b.points - a.points
      )[0];
    }
  }

  // ========================================
  // RETURN ALL FOUR AWARDS
  // ========================================

  return {
    season,
    regularSeasonComplete,
    mvp: toAwardWinner(
      mvp,
      playoffTeams
    ),
    opoy: toAwardWinner(
      opoy,
      playoffTeams
    ),
    roy: toAwardWinner(roy),
    sbMvp,
  };
}
