const LEAGUE_ID = "1326512818865868800";

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

export async function getUsers(): Promise<SleeperUser[]> {
  const response = await fetch(
    `https://api.sleeper.app/v1/league/${LEAGUE_ID}/users`,
    {
      next: { revalidate: 300 },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to load Sleeper users");
  }

  return response.json();
}

export async function getRosters(): Promise<SleeperRoster[]> {
  const response = await fetch(
    `https://api.sleeper.app/v1/league/${LEAGUE_ID}/rosters`,
    {
      next: { revalidate: 300 },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to load Sleeper rosters");
  }

  return response.json();
}