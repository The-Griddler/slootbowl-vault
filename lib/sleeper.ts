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
  matchup_id: number;
  points: number;
  custom_points: number | null;
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