
import type {
  HistoricalMatchup,
  HistoricalSeason,
  HistoricalTransaction,
} from "./sleeper";

import type {
  MVPByeSchedule,
} from "./mvpSeasonConfig";

export const MVP_SEASON = "2026";
export const MVP_TRADE_CUTOFF_WEEK = 9;
export const MVP_REGULAR_SEASON_WEEKS = 14;

/**
 * Provisional 2026 cutoff.
 *
 * This is not a verified Sleeper
 * end-of-Week-9 timestamp.
 *
 * Future seasons must have their
 * own cutoff timestamps verified
 * before transaction ownership
 * reconciliation is enabled.
 */
export const MVP_CUTOFF_TIMESTAMP =
  Date.parse("2026-11-10T06:00:00Z");

const OBFC = [4, 6, 8, 7, 9];
const GPFC = [1, 2, 10, 3, 5];

/**
 * Existing 2026 bye-week data.
 *
 * Retained temporarily as a fallback
 * while the automatic Sleeper schedule
 * integration is validated.
 *
 * Future seasons never reuse this map.
 */
export const NFL_BYES_2026: Record<
  string,
  number
> = {
  CAR: 5,
  KC: 5,
  CIN: 6,
  DET: 6,
  MIA: 6,
  MIN: 6,
  BUF: 7,
  JAX: 7,
  LAC: 7,
  WAS: 7,
  HOU: 8,
  NO: 8,
  NYG: 8,
  SF: 8,
  PIT: 9,
  TEN: 9,
  CHI: 10,
  DEN: 10,
  PHI: 10,
  TB: 10,
  ATL: 11,
  CLE: 11,
  GB: 11,
  LAR: 11,
  NE: 11,
  SEA: 11,
  BAL: 13,
  IND: 13,
  LV: 13,
  NYJ: 13,
  ARI: 14,
  DAL: 14,
};

export type MVPPlayerTeams =
  Record<string, string | null>;

export type MVPPlayerWeek = {
  week: number;
  rosterId: number;
  points: number;
};

export type MVPFranchiseSource =
  | "week9_roster"
  | "week9_starter"
  | "pre_cutoff_starter"
  | "current_starter"
  | "transaction"
  | "unresolved";

export type MVPCandidate = {
  playerId: string;
  totalPoints: number;
  gamesStarted: number;

  mvpRosterId: number | null;
  latestStartingRosterId: number | null;

  franchiseConfirmed: boolean;
  franchiseSource: MVPFranchiseSource;

  inPlayoffPosition: boolean;
  conferenceRank: number | null;

  mvpScore: number;
  adjustedPoints: number;
  byeWeeksCompleted: number;
  eligibleWeeks: number;
  participationRate: number;
  meetsMinimumParticipation: boolean;

  rank: number;
  previousRank: number | null;
  rankChange: number | null;

  weeks: MVPPlayerWeek[];
};

export type MVPLeaderboard = {
  season: string;
  throughWeek: number;
  cutoffWeek: number;
  cutoffLocked: boolean;
  candidates: MVPCandidate[];
  topTen: MVPCandidate[];
};

type PlayerAccumulator = {
  playerId: string;
  weeks: MVPPlayerWeek[];
};

type TeamStanding = {
  rosterId: number;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  rank: number;
};

type FranchiseResult = {
  rosterId: number | null;
  confirmed: boolean;
  source: MVPFranchiseSource;
};

type TransactionEvent = {
  playerId: string;
  rosterId: number | null;
  timestamp: number;
  transactionId: string;
};

function collectGames(
  historicalData: HistoricalSeason[],
  season: string,
  throughWeek: number
): HistoricalMatchup[] {
  return historicalData
    .flatMap((item) => item.matchups)
    .filter(
      (game) =>
        game.season === season &&
        game.phase === "Regular Season" &&
        game.isComplete &&
        game.week >= 1 &&
        game.week <=
          Math.min(
            throughWeek,
            MVP_REGULAR_SEASON_WEEKS
          ) &&
        Number.isFinite(game.scoreA) &&
        Number.isFinite(game.scoreB)
    );
}

function collectPlayerStarts(
  games: HistoricalMatchup[]
): Map<string, PlayerAccumulator> {
  const players = new Map<
    string,
    PlayerAccumulator
  >();

  function addStarters(
    week: number,
    rosterId: number,
    starters: string[],
    points: number[]
  ) {
    starters.forEach((playerId, index) => {
      if (!playerId || playerId === "0") {
        return;
      }

      const value = points[index];

      if (
        typeof value !== "number" ||
        !Number.isFinite(value)
      ) {
        return;
      }

      if (!players.has(playerId)) {
        players.set(playerId, {
          playerId,
          weeks: [],
        });
      }

      players.get(playerId)!.weeks.push({
        week,
        rosterId,
        points: value,
      });
    });
  }

  for (const game of games) {
    addStarters(
      game.week,
      game.rosterA,
      game.startersA,
      game.startersPointsA
    );

    addStarters(
      game.week,
      game.rosterB,
      game.startersB,
      game.startersPointsB
    );
  }

  for (const player of players.values()) {
    player.weeks.sort(
      (a, b) => a.week - b.week
    );
  }

  return players;
}

function calculateStandings(
  games: HistoricalMatchup[]
): Map<number, TeamStanding> {
  const standings = new Map<
    number,
    TeamStanding
  >();

  for (const rosterId of [
    ...OBFC,
    ...GPFC,
  ]) {
    standings.set(rosterId, {
      rosterId,
      wins: 0,
      losses: 0,
      ties: 0,
      pointsFor: 0,
      rank: 0,
    });
  }

  for (const game of games) {
    const a = standings.get(game.rosterA);
    const b = standings.get(game.rosterB);

    if (!a || !b) continue;

    a.pointsFor += game.scoreA;
    b.pointsFor += game.scoreB;

    if (game.scoreA > game.scoreB) {
      a.wins++;
      b.losses++;
    } else if (game.scoreB > game.scoreA) {
      b.wins++;
      a.losses++;
    } else {
      a.ties++;
      b.ties++;
    }
  }

  for (const conference of [OBFC, GPFC]) {
    const teams = conference
      .map((id) => standings.get(id)!)
      .sort((a, b) => {
        const gamesA =
          a.wins + a.losses + a.ties;

        const gamesB =
          b.wins + b.losses + b.ties;

        const pctA =
          gamesA > 0
            ? (a.wins + a.ties / 2) /
              gamesA
            : 0;

        const pctB =
          gamesB > 0
            ? (b.wins + b.ties / 2) /
              gamesB
            : 0;

        return (
          pctB - pctA ||
          b.pointsFor - a.pointsFor ||
          a.rosterId - b.rosterId
        );
      });

    teams.forEach((team, index) => {
      team.rank = index + 1;
    });
  }

  return standings;
}

/**
 * Week 9 full-roster evidence.
 *
 * Ambiguous ownership is recorded
 * as null rather than assigning
 * an arbitrary franchise.
 */
function buildWeekNineOwners(
  games: HistoricalMatchup[]
): Map<string, number | null> {
  const possible = new Map<
    string,
    Set<number>
  >();

  function addPlayers(
    rosterId: number,
    ids: string[]
  ) {
    for (const playerId of ids) {
      if (!playerId || playerId === "0") {
        continue;
      }

      if (!possible.has(playerId)) {
        possible.set(
          playerId,
          new Set<number>()
        );
      }

      possible.get(playerId)!.add(
        rosterId
      );
    }
  }

  for (const game of games) {
    if (
      game.week !==
      MVP_TRADE_CUTOFF_WEEK
    ) {
      continue;
    }

    addPlayers(
      game.rosterA,
      game.playersA ?? game.startersA
    );

    addPlayers(
      game.rosterB,
      game.playersB ?? game.startersB
    );
  }

  const owners = new Map<
    string,
    number | null
  >();

  for (const [
    playerId,
    rosters,
  ] of possible) {
    owners.set(
      playerId,
      rosters.size === 1
        ? [...rosters][0]
        : null
    );
  }

  return owners;
}

/**
 * Convert completed Sleeper moves
 * into chronological player events.
 *
 * A drop without a later addition
 * leaves the player unowned.
 *
 * Transactions without a reliable
 * completion timestamp cannot prove
 * cutoff ownership.
 */
function buildTransactionEvents(
  transactions: HistoricalTransaction[],
  cutoffTimestamp: number
): Map<string, TransactionEvent[]> {
  const events = new Map<
    string,
    TransactionEvent[]
  >();

  const seen = new Set<string>();

  for (const transaction of transactions) {
    if (
      transaction.status !== "complete"
    ) {
      continue;
    }

    if (
      seen.has(
        transaction.transaction_id
      )
    ) {
      continue;
    }

    seen.add(
      transaction.transaction_id
    );

    const timestamp =
      transaction.status_updated;

    if (
      typeof timestamp !== "number" ||
      !Number.isFinite(timestamp) ||
      timestamp > cutoffTimestamp
    ) {
      continue;
    }

    const additions =
      transaction.adds ?? {};

    const drops =
      transaction.drops ?? {};

    const affected = new Set([
      ...Object.keys(additions),
      ...Object.keys(drops),
    ]);

    for (const playerId of affected) {
      const addedTo =
        additions[playerId];

      const droppedFrom =
        drops[playerId];

      if (
        addedTo === undefined &&
        droppedFrom === undefined
      ) {
        continue;
      }

      const rosterId =
        typeof addedTo === "number" &&
        Number.isInteger(addedTo) &&
        addedTo > 0
          ? addedTo
          : null;

      const event: TransactionEvent = {
        playerId,
        rosterId,
        timestamp,
        transactionId:
          transaction.transaction_id,
      };

      if (!events.has(playerId)) {
        events.set(playerId, []);
      }

      events.get(playerId)!.push(
        event
      );
    }
  }

  for (const playerEvents of
    events.values()) {
    playerEvents.sort(
      (a, b) =>
        a.timestamp - b.timestamp ||
        a.transactionId.localeCompare(
          b.transactionId
        )
    );
  }

  return events;
}

/**
 * Resolve a player's SFL franchise.
 *
 * Transactions are chronological.
 *
 * Conflicting roster snapshots
 * and transaction history remain
 * unresolved rather than guessing.
 *
 * Ownership remains provisional
 * until the cutoff is verified.
 */
function findMVPFranchise(
  weeks: MVPPlayerWeek[],
  throughWeek: number,
  playerId: string,
  weekNineOwners: Map<
    string,
    number | null
  >,
  transactionEvents: Map<
    string,
    TransactionEvent[]
  >,
  useTransactions: boolean
): FranchiseResult {
  if (weeks.length === 0) {
    return {
      rosterId: null,
      confirmed: false,
      source: "unresolved",
    };
  }

  if (
    throughWeek <
    MVP_TRADE_CUTOFF_WEEK
  ) {
    return {
      rosterId:
        weeks[weeks.length - 1]
          .rosterId,
      confirmed: false,
      source: "current_starter",
    };
  }

  const hasSnapshot =
    weekNineOwners.has(playerId);

  const snapshotOwner =
    weekNineOwners.get(playerId);

  const playerEvents =
    useTransactions
      ? transactionEvents.get(
          playerId
        ) ?? []
      : [];

  const latestEvent =
    playerEvents.at(-1);

  if (latestEvent) {
    if (
      latestEvent.rosterId === null
    ) {
      return {
        rosterId: null,
        confirmed: false,
        source: "unresolved",
      };
    }

    if (
      hasSnapshot &&
      snapshotOwner !==
        latestEvent.rosterId
    ) {
      return {
        rosterId: null,
        confirmed: false,
        source: "unresolved",
      };
    }

    return {
      rosterId:
        latestEvent.rosterId,
      confirmed: false,
      source: "transaction",
    };
  }

  if (hasSnapshot) {
    return {
      rosterId:
        snapshotOwner ?? null,
      confirmed: false,
      source:
        snapshotOwner === null
          ? "unresolved"
          : "week9_roster",
    };
  }

  const weekNineStart = weeks.find(
    (item) =>
      item.week ===
      MVP_TRADE_CUTOFF_WEEK
  );

  if (weekNineStart) {
    return {
      rosterId:
        weekNineStart.rosterId,
      confirmed: false,
      source: "week9_starter",
    };
  }

  if (useTransactions) {
    return {
      rosterId: null,
      confirmed: false,
      source: "unresolved",
    };
  }

  const previousStart = weeks
    .filter(
      (item) =>
        item.week <
        MVP_TRADE_CUTOFF_WEEK
    )
    .at(-1);

  if (previousStart) {
    return {
      rosterId:
        previousStart.rosterId,
      confirmed: false,
      source: "pre_cutoff_starter",
    };
  }

  return {
    rosterId: null,
    confirmed: false,
    source: "unresolved",
  };
}

function playoffAdjustment(
  conferenceRank: number | null
): number {
  switch (conferenceRank) {
    case 1:
      return 1.06;
    case 2:
      return 1.04;
    case 3:
      return 1.02;
    case 4:
      return 0.97;
    case 5:
      return 0.92;
    default:
      return 0;
  }
}

/**
 * Calculate completed NFL bye weeks.
 *
 * Prefer validated automatic data.
 *
 * For 2026 only, retain the
 * existing manually configured
 * bye weeks as a fallback.
 *
 * Future seasons never use
 * the 2026 schedule.
 */
function completedByes(
  playerId: string,
  season: string,
  throughWeek: number,
  playerTeams: MVPPlayerTeams,
  byeSchedule?: MVPByeSchedule
): number {
  const nflTeam =
    playerTeams[playerId]?.toUpperCase();

  if (!nflTeam) return 0;

  let byeWeek: number | undefined;

  if (
    byeSchedule?.available &&
    byeSchedule.season === season
  ) {
    byeWeek =
      byeSchedule.byeWeeks[nflTeam];
  } else if (season === "2026") {
    byeWeek =
      NFL_BYES_2026[nflTeam];
  }

  if (!byeWeek) return 0;

  return byeWeek <= throughWeek
    ? 1
    : 0;
}

function calculateAdjustedPoints(
  totalPoints: number,
  throughWeek: number,
  byeWeeksCompleted: number
): number {
  if (
    throughWeek >=
    MVP_REGULAR_SEASON_WEEKS
  ) {
    return totalPoints;
  }

  const availableWeeks = Math.max(
    1,
    throughWeek - byeWeeksCompleted
  );

  return (
    totalPoints *
    (throughWeek / availableWeeks)
  );
}

function minimumStarts(
  availableWeeks: number
): number {
  return Math.max(
    1,
    Math.ceil(
      availableWeeks * 0.6
    )
  );
}

function calculateCandidates(
  games: HistoricalMatchup[],
  throughWeek: number,
  season: string,
  playerTeams: MVPPlayerTeams,
  transactionEvents: Map<
    string,
    TransactionEvent[]
  >,
  useTransactions: boolean,
  byeSchedule?: MVPByeSchedule
): MVPCandidate[] {
  const players =
    collectPlayerStarts(games);

  const standings =
    calculateStandings(games);

  const weekNineOwners =
    buildWeekNineOwners(games);

  const candidates: MVPCandidate[] =
    [];

  for (const player of players.values()) {
    const latest =
      player.weeks.at(-1);

    const franchise =
      findMVPFranchise(
        player.weeks,
        throughWeek,
        player.playerId,
        weekNineOwners,
        transactionEvents,
        useTransactions
      );

    const standing =
      franchise.rosterId !== null
        ? standings.get(
            franchise.rosterId
          )
        : null;

    /**
     * Points follow the player
     * across SFL franchises.
     */
    const totalPoints =
      player.weeks.reduce(
        (sum, item) =>
          sum + item.points,
        0
      );

    const conferenceRank =
      standing?.rank ?? null;

    const inPlayoffPosition =
      conferenceRank !== null &&
      conferenceRank <= 3;

    const byeWeeksCompleted =
      completedByes(
        player.playerId,
        season,
        throughWeek,
        playerTeams,
        byeSchedule
      );

    const eligibleWeeks = Math.max(
      1,
      throughWeek -
        byeWeeksCompleted
    );

    const gamesStarted =
      player.weeks.length;

    const participationRate =
      gamesStarted / eligibleWeeks;

    const meetsMinimumParticipation =
      gamesStarted >=
      minimumStarts(
        eligibleWeeks
      );

    const adjustedPoints =
      calculateAdjustedPoints(
        totalPoints,
        throughWeek,
        byeWeeksCompleted
      );

    const mvpScore =
      meetsMinimumParticipation
        ? adjustedPoints *
          playoffAdjustment(
            conferenceRank
          )
        : 0;

    candidates.push({
      playerId: player.playerId,
      totalPoints,
      gamesStarted,

      mvpRosterId:
        franchise.rosterId,

      latestStartingRosterId:
        latest?.rosterId ?? null,

      franchiseConfirmed:
        franchise.confirmed,

      franchiseSource:
        franchise.source,

      inPlayoffPosition,
      conferenceRank,

      mvpScore,
      adjustedPoints,
      byeWeeksCompleted,
      eligibleWeeks,
      participationRate,
      meetsMinimumParticipation,

      rank: 0,
      previousRank: null,
      rankChange: null,

      weeks: player.weeks,
    });
  }

  const eligibleCandidates =
    candidates.filter(
      (candidate) => {
        if (
          !candidate
            .meetsMinimumParticipation
        ) {
          return false;
        }

        if (
          throughWeek >=
            MVP_REGULAR_SEASON_WEEKS &&
          !candidate.inPlayoffPosition
        ) {
          return false;
        }

        return true;
      }
    );

  eligibleCandidates.sort(
    (a, b) =>
      b.mvpScore - a.mvpScore ||
      b.totalPoints -
        a.totalPoints ||
      a.playerId.localeCompare(
        b.playerId
      )
  );

  eligibleCandidates.forEach(
    (candidate, index) => {
      candidate.rank = index + 1;
    }
  );

  return eligibleCandidates;
}

/**
 * Backwards-compatible MVP entrypoint.
 *
 * Argument 5: Transaction history.
 * Argument 6: Week 9 cutoff timestamp.
 * Argument 7: NFL bye-week schedule.
 *
 * Existing callers remain valid.
 */
export function calculateMVPLeaderboard(
  historicalData: HistoricalSeason[],
  season = MVP_SEASON,
  throughWeek = MVP_REGULAR_SEASON_WEEKS,
  playerTeams: MVPPlayerTeams = {},
  transactions: HistoricalTransaction[] = [],
  cutoffTimestamp: number | null = null,
  byeSchedule?: MVPByeSchedule
): MVPLeaderboard {
  const completedGames =
    collectGames(
      historicalData,
      season,
      throughWeek
    );

  const latestWeek =
    completedGames.length > 0
      ? Math.max(
          ...completedGames.map(
            (game) => game.week
          )
        )
      : 0;

  const useTransactions =
    transactions.length > 0 &&
    cutoffTimestamp !== null &&
    Number.isFinite(
      cutoffTimestamp
    );

  const transactionEvents =
    useTransactions
      ? buildTransactionEvents(
          transactions,
          cutoffTimestamp!
        )
      : new Map<
          string,
          TransactionEvent[]
        >();

  const candidates =
    calculateCandidates(
      completedGames,
      latestWeek,
      season,
      playerTeams,
      transactionEvents,
      useTransactions,
      byeSchedule
    );

  if (latestWeek > 1) {
    const previousGames =
      collectGames(
        historicalData,
        season,
        latestWeek - 1
      );

    const previousCandidates =
      calculateCandidates(
        previousGames,
        latestWeek - 1,
        season,
        playerTeams,
        transactionEvents,
        useTransactions,
        byeSchedule
      );

    const previousRanks = new Map(
      previousCandidates.map(
        (player) => [
          player.playerId,
          player.rank,
        ])
    );

    for (const candidate of candidates) {
      const previousRank =
        previousRanks.get(
          candidate.playerId
        );

      candidate.previousRank =
        previousRank ?? null;

      candidate.rankChange =
        previousRank === undefined
          ? null
          : previousRank -
            candidate.rank;
    }
  }

  return {
    season,
    throughWeek: latestWeek,
    cutoffWeek:
      MVP_TRADE_CUTOFF_WEEK,

    cutoffLocked:
      latestWeek >=
      MVP_TRADE_CUTOFF_WEEK,

    candidates,
    topTen:
      candidates.slice(0, 10),
  };
}
