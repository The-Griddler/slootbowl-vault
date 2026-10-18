
import type {
  HistoricalMatchup,
  HistoricalSeason,
} from "./sleeper";

export const MVP_SEASON = "2026";
export const MVP_TRADE_CUTOFF_WEEK = 9;
export const MVP_REGULAR_SEASON_WEEKS = 14;

const OBFC = [4, 6, 8, 7, 9];
const GPFC = [1, 2, 10, 3, 5];

export type MVPPlayerWeek = {
  week: number;
  rosterId: number;
  points: number;
};

export type MVPCandidate = {
  playerId: string;

  /**
   * All completed regular-season
   * points earned while started,
   * regardless of franchise.
   */
  totalPoints: number;

  gamesStarted: number;

  /**
   * The franchise attributed
   * to this player's MVP campaign.
   */
  mvpRosterId: number | null;

  /**
   * Most recent franchise to
   * start the player.
   */
  latestStartingRosterId: number | null;

  /**
   * True when the Week 9 franchise
   * can be established from the
   * available matchup history.
   */
  franchiseConfirmed: boolean;

  /**
   * Whether the player's attributed
   * franchise currently occupies
   * a playoff position.
   */
  inPlayoffPosition: boolean;

  /**
   * Current rank among all
   * franchises in its conference.
   */
  conferenceRank: number | null;

  /**
   * Internal ranking score.
   * Never displayed on the site.
   */
  mvpScore: number;

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

function conferenceOf(
  rosterId: number
): "OBFC" | "GPFC" | null {
  if (OBFC.includes(rosterId)) {
    return "OBFC";
  }

  if (GPFC.includes(rosterId)) {
    return "GPFC";
  }

  return null;
}

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
        game.scoreA > 0 &&
        game.scoreB > 0
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

        players
          .get(playerId)!
          .weeks.push({
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

    teams.forEach(
      (team, index) => {
        team.rank = index + 1;
      }
    );
  }

  return standings;
}

function findMVPFranchise(
  weeks: MVPPlayerWeek[],
  throughWeek: number
): {
  rosterId: number | null;
  confirmed: boolean;
} {
  if (weeks.length === 0) {
    return {
      rosterId: null,
      confirmed: false,
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
    };
  }

  const cutoffStart = weeks.find(
    (item) =>
      item.week ===
      MVP_TRADE_CUTOFF_WEEK
  );

  if (cutoffStart) {
    return {
      rosterId:
        cutoffStart.rosterId,
      confirmed: true,
    };
  }

  const beforeCutoff = weeks
    .filter(
      (item) =>
        item.week <
        MVP_TRADE_CUTOFF_WEEK
    )
    .at(-1);

  return {
    rosterId:
      beforeCutoff?.rosterId ??
      null,
    confirmed: false,
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

function calculateCandidates(
  games: HistoricalMatchup[],
  throughWeek: number
): MVPCandidate[] {
  const players =
    collectPlayerStarts(games);

  const standings =
    calculateStandings(games);

  const candidates: MVPCandidate[] =
    [];

  for (const player of players.values()) {
    const latest =
      player.weeks.at(-1);

    const franchise =
      findMVPFranchise(
        player.weeks,
        throughWeek
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

    const mvpScore =
      totalPoints *
      playoffAdjustment(
        conferenceRank
      );

    candidates.push({
      playerId: player.playerId,
      totalPoints,
      gamesStarted:
        player.weeks.length,
      mvpRosterId:
        franchise.rosterId,
      latestStartingRosterId:
        latest?.rosterId ?? null,
      franchiseConfirmed:
        franchise.confirmed,
      inPlayoffPosition,
      conferenceRank,
      mvpScore,
      rank: 0,
      previousRank: null,
      rankChange: null,
      weeks: player.weeks,
    });
  }

  candidates.sort(
    (a, b) =>
      b.mvpScore - a.mvpScore ||
      b.totalPoints -
        a.totalPoints ||
      a.playerId.localeCompare(
        b.playerId
      )
  );

  candidates.forEach(
    (candidate, index) => {
      candidate.rank = index + 1;
    }
  );

  return candidates;
}

export function calculateMVPLeaderboard(
  historicalData: HistoricalSeason[],
  season = MVP_SEASON,
  throughWeek = MVP_REGULAR_SEASON_WEEKS
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
      ? Math.max(...completedWeeks)
      : 0;

  const candidates =
    calculateCandidates(
      completedGames,
      latestWeek
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
        latestWeek - 1
      );

    const previousRanks =
      new Map(
        previousCandidates.map(
          (player) => [
            player.playerId,
            player.rank,
          ]
        )
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
