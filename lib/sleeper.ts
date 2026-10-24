
import {
  CURRENT_LEAGUE_ID,
} from "./seasons";

const LEAGUE_ID = CURRENT_LEAGUE_ID;

export type SleeperLeague = {
  league_id: string;
  name: string;
  season: string;
  previous_league_id: string | null;
};

export type SleeperUser = {
  user_id: string;
  display_name: string;
  avatar: string | null;
  metadata?: {
    team_name?: string;
  } | null;
};

export type SleeperRoster = {
  roster_id: number;
  owner_id: string;
  players: string[] | null;
  starters: string[] | null;
  settings: {
    wins: number;
    losses: number;
    ties: number;
    fpts: number;
    fpts_against: number;
  };
};

export type SleeperMatchup = {
  roster_id: number;
  matchup_id: number | null;
  points: number;
  custom_points: number | null;
  starters?: string[] | null;
  starters_points?: number[] | null;
  players?: string[] | null;
  players_points?: Record<
    string,
    number
  > | null;
};

export type SleeperBracketMatch = {
  m: number;
  r: number;
  t1: number | null;
  t2: number | null;
  w: number | null;
  l: number | null;
  p?: number;
  t1_from?: {
    w?: number;
    l?: number;
  };
  t2_from?: {
    w?: number;
    l?: number;
  };
};

export type HistoricalMatchupPhase =
  | "Regular Season"
  | "Main Playoffs"
  | "Toilet Bowl"
  | "Ignored";

export type HistoricalMatchup = {
  season: string;
  week: number;
  phase: HistoricalMatchupPhase;

  rosterA: number;
  rosterB: number;

  scoreA: number;
  scoreB: number;

  startersA: string[];
  startersB: string[];

  startersPointsA: number[];
  startersPointsB: number[];

  /**
   * Full Sleeper matchup rosters.
   *
   * These include starters and
   * bench players.
   *
   * They are historical roster
   * evidence, but Sleeper does not
   * guarantee that their snapshot
   * timestamp equals the exact
   * end-of-week MVP cutoff.
   */
  playersA?: string[];
  playersB?: string[];

  /**
   * Only completed fantasy weeks
   * count towards official records.
   */
  isComplete: boolean;
};

export type HistoricalSeason = {
  league: SleeperLeague;
  matchups: HistoricalMatchup[];
};

export type SleeperNFLState = {
  season: string;
  week: number;
  leg?: number;
  season_type: string;
  display_week?: number;
  league_season?: string;
  previous_season?: string;
};

/**
 * Sleeper transaction records.
 *
 * The adds/drops maps use:
 *
 * player ID -> roster ID
 *
 * Trades can include the same
 * player in both maps, showing
 * the roster they left and the
 * roster they joined.
 */
export type SleeperTransaction = {
  transaction_id: string;

  type:
    | "trade"
    | "waiver"
    | "free_agent"
    | string;

  status: string;

  /**
   * Sleeper timestamps are in
   * milliseconds since epoch.
   */
  created: number | null;
  status_updated: number | null;

  /**
   * Sleeper's transaction week.
   */
  leg: number | null;

  roster_ids: number[];

  adds: Record<
    string,
    number
  > | null;

  drops: Record<
    string,
    number
  > | null;

  creator?: string | null;
  metadata?: Record<
    string,
    unknown
  > | null;

  draft_picks?: unknown[];
};

/**
 * A transaction with its
 * originating Sleeper round.
 *
 * The round matters because
 * transaction weeks do not always
 * correspond exactly to the time
 * the move was completed.
 */
export type HistoricalTransaction =
  SleeperTransaction & {
    round: number;
  };

async function fetchLeague(
  leagueId: string
): Promise<SleeperLeague> {
  const response = await fetch(
    `https://api.sleeper.app/v1/league/${leagueId}`,
    {
      next: {
        revalidate: 300,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to load Sleeper league ${leagueId}`
    );
  }

  return response.json();
}

async function fetchBracket(
  leagueId: string,
  bracket:
    | "winners_bracket"
    | "losers_bracket"
): Promise<SleeperBracketMatch[]> {
  const response = await fetch(
    `https://api.sleeper.app/v1/league/${leagueId}/${bracket}`,
    {
      next: {
        revalidate: 300,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to load ${bracket} for league ${leagueId}`
    );
  }

  return response.json();
}

export async function getNFLState():
  Promise<SleeperNFLState> {
  const response = await fetch(
    "https://api.sleeper.app/v1/state/nfl",
    {
      next: {
        revalidate: 300,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      "Failed to load Sleeper NFL state"
    );
  }

  return response.json();
}

/**
 * Determine whether a fantasy
 * week has finished.
 */
export function isNFLWeekComplete(
  season: string,
  week: number,
  nflState: SleeperNFLState
): boolean {
  const matchupYear = Number(season);
  const nflYear = Number(
    nflState.season
  );

  if (
    !Number.isFinite(matchupYear) ||
    !Number.isFinite(nflYear) ||
    !Number.isInteger(week) ||
    week < 1 ||
    week > 17
  ) {
    return false;
  }

  if (matchupYear < nflYear) {
    return true;
  }

  if (matchupYear > nflYear) {
    return false;
  }

  const seasonType =
    nflState.season_type.toLowerCase();

  if (
    seasonType === "post" ||
    seasonType === "postseason"
  ) {
    return true;
  }

  if (
    seasonType === "pre" ||
    seasonType === "preseason"
  ) {
    return false;
  }

  if (
    seasonType !== "regular" &&
    seasonType !== "reg"
  ) {
    return false;
  }

  const currentWeek = Number(
    nflState.week
  );

  if (
    !Number.isInteger(currentWeek) ||
    currentWeek < 1
  ) {
    return false;
  }

  return week < currentWeek;
}

export async function getLeague():
  Promise<SleeperLeague> {
  return fetchLeague(LEAGUE_ID);
}

export async function getLeagueHistory():
  Promise<SleeperLeague[]> {
  const history: SleeperLeague[] = [];

  let leagueId: string | null =
    LEAGUE_ID;

  while (leagueId) {
    const league =
      await fetchLeague(leagueId);

    history.push(league);

    leagueId =
      league.previous_league_id;
  }

  return history;
}

export async function getUsers(
  leagueId: string = LEAGUE_ID
): Promise<SleeperUser[]> {
  const response = await fetch(
    `https://api.sleeper.app/v1/league/${leagueId}/users`,
    {
      next: {
        revalidate: 300,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to load Sleeper users for league ${leagueId}`
    );
  }

  return response.json();
}

export async function getRosters(
  leagueId: string = LEAGUE_ID
): Promise<SleeperRoster[]> {
  const response = await fetch(
    `https://api.sleeper.app/v1/league/${leagueId}/rosters`,
    {
      next: {
        revalidate: 300,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to load Sleeper rosters for league ${leagueId}`
    );
  }

  return response.json();
}

export async function getMatchups(
  week: number,
  leagueId: string = LEAGUE_ID
): Promise<SleeperMatchup[]> {
  const response = await fetch(
    `https://api.sleeper.app/v1/league/${leagueId}/matchups/${week}`,
    {
      next: {
        revalidate: 300,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to load Sleeper matchups for league ${leagueId}, week ${week}`
    );
  }

  return response.json();
}

/**
 * Fetch transactions for one
 * Sleeper round.
 *
 * Includes trades, waivers,
 * free agents and other moves.
 */
export async function getTransactions(
  round: number,
  leagueId: string = LEAGUE_ID
): Promise<SleeperTransaction[]> {
  if (
    !Number.isInteger(round) ||
    round < 0
  ) {
    throw new Error(
      `Invalid Sleeper transaction round: ${round}`
    );
  }

  const response = await fetch(
    `https://api.sleeper.app/v1/league/${leagueId}/transactions/${round}`,
    {
      next: {
        revalidate: 300,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to load Sleeper transactions for league ${leagueId}, round ${round}`
    );
  }

  return response.json();
}

/**
 * Retrieve completed transactions
 * across a range of rounds.
 *
 * Transactions are sorted by
 * completion timestamp.
 *
 * The function deliberately does
 * not assume a transaction's round
 * is the exact time it occurred.
 */
export async function getTransactionHistory(
  startRound: number,
  endRound: number,
  leagueId: string = LEAGUE_ID
): Promise<HistoricalTransaction[]> {
  if (
    !Number.isInteger(startRound) ||
    !Number.isInteger(endRound) ||
    startRound < 0 ||
    endRound < startRound
  ) {
    throw new Error(
      "Invalid transaction round range"
    );
  }

  const rounds = Array.from(
    {
      length:
        endRound - startRound + 1,
    },
    (_, index) =>
      startRound + index
  );

  const responses = await Promise.all(
    rounds.map(async (round) => {
      const transactions =
        await getTransactions(
          round,
          leagueId
        );

      return transactions.map(
        (transaction) => ({
          ...transaction,
          round,
        })
      );
    })
  );

  const unique = new Map<
    string,
    HistoricalTransaction
  >();

  for (const transaction of
    responses.flat()) {
    if (
      transaction.status !==
      "complete"
    ) {
      continue;
    }

    unique.set(
      transaction.transaction_id,
      transaction
    );
  }

  return [...unique.values()].sort(
    (a, b) =>
      (a.status_updated ??
        a.created ??
        0) -
        (b.status_updated ??
          b.created ??
          0) ||
      a.transaction_id.localeCompare(
        b.transaction_id
      )
  );
}

/**
 * Transactions relevant to the
 * Week 9 MVP franchise cutoff.
 *
 * Include round 0 (preseason)
 * through round 10 so that moves
 * near the week boundary are
 * available for timestamp-based
 * analysis.
 *
 * This helper retrieves evidence.
 * It does not independently decide
 * which side of the cutoff a
 * transaction belongs to.
 */
export async function getMVPTransactions(
  leagueId: string = LEAGUE_ID
): Promise<HistoricalTransaction[]> {
  return getTransactionHistory(
    0,
    10,
    leagueId
  );
}

function rosterPairKey(
  rosterA: number,
  rosterB: number
): string {
  return [
    rosterA,
    rosterB,
  ]
    .sort((a, b) => a - b)
    .join("-");
}

function buildBracketMap(
  bracket: SleeperBracketMatch[]
): Map<string, SleeperBracketMatch> {
  const map = new Map<
    string,
    SleeperBracketMatch
  >();

  for (const match of bracket) {
    if (
      match.t1 !== null &&
      match.t2 !== null
    ) {
      map.set(
        rosterPairKey(
          match.t1,
          match.t2
        ),
        match
      );
    }
  }

  return map;
}

function classifyPlayoffMatchup(
  rosterA: number,
  rosterB: number,
  winnersMap: Map<
    string,
    SleeperBracketMatch
  >,
  losersMap: Map<
    string,
    SleeperBracketMatch
  >
): HistoricalMatchupPhase {
  const key =
    rosterPairKey(
      rosterA,
      rosterB
    );

  const winnersMatch =
    winnersMap.get(key);

  if (winnersMatch) {
    if (
      winnersMatch.p === undefined ||
      winnersMatch.p === 1
    ) {
      return "Main Playoffs";
    }

    return "Ignored";
  }

  if (losersMap.has(key)) {
    return "Toilet Bowl";
  }

  return "Ignored";
}

export async function getHistoricalSeason(
  league: SleeperLeague,
  nflState?: SleeperNFLState
): Promise<HistoricalSeason> {
  const state =
    nflState ?? await getNFLState();

  const [
    winnersBracket,
    losersBracket,
  ] = await Promise.all([
    fetchBracket(
      league.league_id,
      "winners_bracket"
    ),
    fetchBracket(
      league.league_id,
      "losers_bracket"
    ),
  ]);

  const winnersMap =
    buildBracketMap(
      winnersBracket
    );

  const losersMap =
    buildBracketMap(
      losersBracket
    );

  const matchups: HistoricalMatchup[] =
    [];

  for (
    let week = 1;
    week <= 17;
    week++
  ) {
    const weeklyMatchups =
      await getMatchups(
        week,
        league.league_id
      );

    const grouped =
      new Map<
        number,
        SleeperMatchup[]
      >();

    for (const matchup of
      weeklyMatchups) {
      if (
        matchup.matchup_id === null
      ) {
        continue;
      }

      if (
        !grouped.has(
          matchup.matchup_id
        )
      ) {
        grouped.set(
          matchup.matchup_id,
          []
        );
      }

      grouped
        .get(
          matchup.matchup_id
        )!
        .push(matchup);
    }

    for (const [, teams] of grouped) {
      if (teams.length !== 2) {
        continue;
      }

      const teamA = teams[0];
      const teamB = teams[1];

      const scoreA =
        teamA.points ?? 0;

      const scoreB =
        teamB.points ?? 0;

      const phase =
        week <= 14
          ? "Regular Season"
          : classifyPlayoffMatchup(
              teamA.roster_id,
              teamB.roster_id,
              winnersMap,
              losersMap
            );

      const startersA =
        teamA.starters ?? [];

      const startersB =
        teamB.starters ?? [];

      const startersPointsA =
        teamA.starters_points ?? [];

      const startersPointsB =
        teamB.starters_points ?? [];

      /**
       * New: retain the full
       * historical matchup roster,
       * including bench players.
       */
      const playersA =
        teamA.players ?? [];

      const playersB =
        teamB.players ?? [];

      const isComplete =
        isNFLWeekComplete(
          league.season,
          week,
          state
        );

      matchups.push({
        season: league.season,
        week,
        phase,

        rosterA: teamA.roster_id,
        rosterB: teamB.roster_id,

        scoreA,
        scoreB,

        startersA,
        startersB,

        startersPointsA,
        startersPointsB,

        playersA,
        playersB,

        isComplete,
      });
    }
  }

  return {
    league,
    matchups,
  };
}

export async function getHistoricalData():
  Promise<HistoricalSeason[]> {
  const [
    leagues,
    nflState,
  ] = await Promise.all([
    getLeagueHistory(),
    getNFLState(),
  ]);

  const seasons =
    await Promise.all(
      leagues.map(
        (league) =>
          getHistoricalSeason(
            league,
            nflState
          )
      )
    );

  return seasons;
}
