
import type {
  HistoricalMatchup,
  HistoricalSeason,
} from "./sleeper";

import type {
  MVPByeSchedule,
} from "./mvpSeasonConfig";

export const MVP_SEASON = "2026";
export const MVP_REGULAR_SEASON_WEEKS = 14;

const OBFC = [4, 6, 8, 7, 9];
const GPFC = [1, 2, 10, 3, 5];

/**
 * Verified manually configured
 * 2026 bye-week fallback.
 *
 * Future seasons use their own
 * validated NFL schedules.
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
  | "latest_starter"
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
        game.week <= Math.min(
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
 * The player's entire season-long
 * MVP score follows them to the
 * franchise they most recently
 * started for.
 *
 * No trade cutoff applies.
 */
function findMVPFranchise(
  weeks: MVPPlayerWeek[]
): number | null {
  if (weeks.length === 0) {
    return null;
  }

  return weeks[weeks.length - 1]
    .rosterId;
}

/**
 * Calculate completed NFL bye weeks.
 *
 * Prefer validated automatic data.
 * Use the 2026 fallback only for 2026.
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
  byeSchedule?: MVPByeSchedule
): MVPCandidate[] {
  const players =
    collectPlayerStarts(games);

  const standings =
    calculateStandings(games);

  const candidates: MVPCandidate[] = [];

  for (const player of players.values()) {
    const latest =
      player.weeks.at(-1);

    const mvpRosterId =
      findMVPFranchise(
        player.weeks
      );

    const standing =
      mvpRosterId !== null
        ? standings.get(mvpRosterId)
        : null;

    /**
     * All points follow the player,
     * even after a midseason trade.
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
      minimumStarts(eligibleWeeks);

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

      mvpRosterId,

      latestStartingRosterId:
        latest?.rosterId ?? null,

      franchiseConfirmed:
        mvpRosterId !== null,

      franchiseSource:
        mvpRosterId !== null
          ? "latest_starter"
          : "unresolved",

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
 * MVP leaderboard calculation.
 *
 * Season-long scores follow players
 * across franchise trades.
 *
 * No ownership cutoff or transaction
 * history is required.
 */
export function calculateMVPLeaderboard(
  historicalData: HistoricalSeason[],
  season = MVP_SEASON,
  throughWeek = MVP_REGULAR_SEASON_WEEKS,
  playerTeams: MVPPlayerTeams = {},
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

  const candidates =
    calculateCandidates(
      completedGames,
      latestWeek,
      season,
      playerTeams,
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
    candidates,
    topTen:
      candidates.slice(0, 10),
  };
}
