
import type {
  HistoricalMatchup,
  HistoricalSeason,
} from "./sleeper";

export const MVP_SEASON = "2026";
export const MVP_TRADE_CUTOFF_WEEK = 9;
export const MVP_REGULAR_SEASON_WEEKS = 14;

const OBFC = [4, 6, 8, 7, 9];
const GPFC = [1, 2, 10, 3, 5];

/**
 * 2026 NFL bye-week lookup.
 *
 * Preserve the bye adjustment
 * already used by the homepage.
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

export type MVPCandidate = {
  playerId: string;

  totalPoints: number;
  gamesStarted: number;

  mvpRosterId: number | null;
  latestStartingRosterId: number | null;

  /**
   * True only if ownership at the
   * exact Week 9 cutoff has been
   * independently verified.
   *
   * A weekly matchup snapshot
   * alone does not guarantee that.
   */
  franchiseConfirmed: boolean;

  /**
   * Explains how the attributed
   * franchise was established.
   */
  franchiseSource:
    | "week9_roster"
    | "week9_starter"
    | "pre_cutoff_starter"
    | "current_starter"
    | "unresolved";

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
  source: MVPCandidate["franchiseSource"];
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
    starters.forEach(
      (playerId, index) => {
        if (
          !playerId ||
          playerId === "0"
        ) {
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
      }
    );
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
    const a = standings.get(
      game.rosterA
    );

    const b = standings.get(
      game.rosterB
    );

    if (!a || !b) continue;

    a.pointsFor += game.scoreA;
    b.pointsFor += game.scoreB;

    if (game.scoreA > game.scoreB) {
      a.wins++;
      b.losses++;
    } else if (
      game.scoreB > game.scoreA
    ) {
      b.wins++;
      a.losses++;
    } else {
      a.ties++;
      b.ties++;
    }
  }

  for (const conference of [
    OBFC,
    GPFC,
  ]) {
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
 * Build a lookup of players
 * appearing on the complete
 * Week 9 matchup rosters.
 *
 * This includes bench players.
 *
 * If a player appears on multiple
 * franchises' rosters, ownership
 * is ambiguous and no automatic
 * assignment is made.
 */
function buildWeekNineOwners(
  games: HistoricalMatchup[]
): Map<string, number> {
  const possibleOwners = new Map<
    string,
    Set<number>
  >();

  function addPlayers(
    rosterId: number,
    playerIds: string[]
  ) {
    for (const playerId of playerIds) {
      if (
        !playerId ||
        playerId === "0"
      ) {
        continue;
      }

      if (!possibleOwners.has(playerId)) {
        possibleOwners.set(
          playerId,
          new Set<number>()
        );
      }

      possibleOwners
        .get(playerId)!
        .add(rosterId);
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
      game.playersA ?? []
    );

    addPlayers(
      game.rosterB,
      game.playersB ?? []
    );
  }

  const owners = new Map<
    string,
    number
  >();

  for (const [
    playerId,
    rosters,
  ] of possibleOwners) {
    if (rosters.size === 1) {
      owners.set(
        playerId,
        [...rosters][0]
      );
    }
  }

  return owners;
}

/**
 * Establish the best available
 * MVP franchise attribution.
 *
 * Before Week 9:
 * Most recent starting franchise.
 *
 * From Week 9 onwards:
 * Prefer the Week 9 full roster,
 * including bench players.
 *
 * If that isn't available:
 * Use Week 9 starter evidence,
 * then the latest pre-cutoff start.
 *
 * Do not substitute a later
 * franchise for an unknown
 * Week 9 owner.
 */
function findMVPFranchise(
  weeks: MVPPlayerWeek[],
  throughWeek: number,
  playerId: string,
  weekNineOwners: Map<
    string,
    number
  >
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

  const rosterOwner =
    weekNineOwners.get(playerId);

  if (
    rosterOwner !== undefined
  ) {
    return {
      rosterId: rosterOwner,
      confirmed: false,
      source: "week9_roster",
    };
  }

  const cutoffStart = weeks.find(
    (item) =>
      item.week ===
      MVP_TRADE_CUTOFF_WEEK
  );

  if (cutoffStart) {
    return {
      rosterId: cutoffStart.rosterId,
      confirmed: false,
      source: "week9_starter",
    };
  }

  const beforeCutoff = weeks
    .filter(
      (item) =>
        item.week <
        MVP_TRADE_CUTOFF_WEEK
    )
    .at(-1);

  if (beforeCutoff) {
    return {
      rosterId:
        beforeCutoff.rosterId,
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

function completedByes(
  playerId: string,
  season: string,
  throughWeek: number,
  playerTeams: MVPPlayerTeams
): number {
  if (season !== "2026") {
    return 0;
  }

  const nflTeam =
    playerTeams[playerId]?.toUpperCase();

  if (!nflTeam) return 0;

  const byeWeek =
    NFL_BYES_2026[nflTeam];

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
  playerTeams: MVPPlayerTeams
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
        weekNineOwners
      );

    const standing =
      franchise.rosterId !== null
        ? standings.get(
            franchise.rosterId
          )
        : null;

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
        playerTeams
      );

    const eligibleWeeks = Math.max(
      1,
      throughWeek - byeWeeksCompleted
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

  /**
   * Enforce minimum participation.
   *
   * Once Week 14 is complete,
   * only players attributed to
   * playoff-qualified franchises
   * remain eligible.
   */
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

export function calculateMVPLeaderboard(
  historicalData: HistoricalSeason[],
  season = MVP_SEASON,
  throughWeek = MVP_REGULAR_SEASON_WEEKS,
  playerTeams: MVPPlayerTeams = {}
): MVPLeaderboard {
  const completedGames =
    collectGames(
      historicalData,
      season,
      throughWeek
    );

  const completedWeeks =
    completedGames.map(
      (game) => game.week
    );

  const latestWeek =
    completedWeeks.length > 0
      ? Math.max(
          ...completedWeeks
        )
      : 0;

  const candidates =
    calculateCandidates(
      completedGames,
      latestWeek,
      season,
      playerTeams
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
        playerTeams
      );

    const previousRanks =
      new Map(
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
