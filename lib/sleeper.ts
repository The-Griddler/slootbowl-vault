const LEAGUE_ID = "1326512818865868800";

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
};

export type HistoricalSeason = {
  league: SleeperLeague;
  matchups: HistoricalMatchup[];
};

async function fetchLeague(
  leagueId: string
): Promise<SleeperLeague> {
  const response = await fetch(
    `https://api.sleeper.app/v1/league/${leagueId}`,
    {
      next: { revalidate: 300 },
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
      next: { revalidate: 300 },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to load ${bracket} for league ${leagueId}`
    );
  }

  return response.json();
}

export async function getLeague(): Promise<SleeperLeague> {
  return fetchLeague(LEAGUE_ID);
}

export async function getLeagueHistory(): Promise<
  SleeperLeague[]
> {
  const history: SleeperLeague[] = [];

  let leagueId: string | null = LEAGUE_ID;

  while (leagueId) {
    const league = await fetchLeague(leagueId);

    history.push(league);

    leagueId = league.previous_league_id;
  }

  return history;
}

export async function getUsers(
  leagueId: string = LEAGUE_ID
): Promise<SleeperUser[]> {
  const response = await fetch(
    `https://api.sleeper.app/v1/league/${leagueId}/users`,
    {
      next: { revalidate: 300 },
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
      next: { revalidate: 300 },
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
      next: { revalidate: 300 },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to load Sleeper matchups for league ${leagueId}, week ${week}`
    );
  }

  return response.json();
}

function rosterPairKey(
  rosterA: number,
  rosterB: number
): string {
  return [rosterA, rosterB]
    .sort((a, b) => a - b)
    .join("-");
}

function buildBracketMap(
  bracket: SleeperBracketMatch[]
): Map<string, SleeperBracketMatch> {
  const map = new Map<string, SleeperBracketMatch>();

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
  const key = rosterPairKey(
    rosterA,
    rosterB
  );

  const winnersMatch =
    winnersMap.get(key);

  if (winnersMatch) {
    /*
     * p = 1 represents the championship.
     *
     * Other placement values such as p = 3
     * or p = 5 are consolation/placement
     * games and are excluded from official
     * playoff statistics.
     */
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
  league: SleeperLeague
): Promise<HistoricalSeason> {
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
    buildBracketMap(winnersBracket);

  const losersMap =
    buildBracketMap(losersBracket);

  const matchups: HistoricalMatchup[] = [];

  for (let week = 1; week <= 17; week++) {
    const weeklyMatchups =
      await getMatchups(
        week,
        league.league_id
      );

    const grouped = new Map<
      number,
      SleeperMatchup[]
    >();

    for (const matchup of weeklyMatchups) {
      if (matchup.matchup_id === null) {
        continue;
      }

      if (
        !grouped.has(matchup.matchup_id)
      ) {
        grouped.set(
          matchup.matchup_id,
          []
        );
      }

      grouped
        .get(matchup.matchup_id)!
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

      /*
       * Unplayed/future games should never
       * enter historical statistics.
       */
      if (
        scoreA === 0 &&
        scoreB === 0
      ) {
        continue;
      }

      const phase =
        week <= 14
          ? "Regular Season"
          : classifyPlayoffMatchup(
              teamA.roster_id,
              teamB.roster_id,
              winnersMap,
              losersMap
            );

      matchups.push({
        season: league.season,
        week,
        phase,
        rosterA: teamA.roster_id,
        rosterB: teamB.roster_id,
        scoreA,
        scoreB,
        startersA:
          teamA.starters ?? [],
        startersB:
          teamB.starters ?? [],
      });
    }
  }

  return {
    league,
    matchups,
  };
}

export async function getHistoricalData(): Promise<
  HistoricalSeason[]
> {
  const leagues =
    await getLeagueHistory();

  const seasons =
    await Promise.all(
      leagues.map((league) =>
        getHistoricalSeason(league)
      )
    );

  return seasons;
}