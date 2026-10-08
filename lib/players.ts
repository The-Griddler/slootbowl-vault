
export type SleeperPlayer = {
  player_id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  position: string | null;
  fantasy_positions: string[] | null;
  team: string | null;
  years_exp: number | null;
  status: string | null;
};

const PLAYERS_URL =
  "https://api.sleeper.app/v1/players/nfl";

let playersCache:
  | Record<string, SleeperPlayer>
  | null = null;

export async function getPlayers(): Promise<
  Record<string, SleeperPlayer>
> {
  if (playersCache) {
    return playersCache;
  }

  const response = await fetch(
    PLAYERS_URL,
    {
      next: {
        revalidate: 86400,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      "Failed to load Sleeper player data"
    );
  }

  const data =
    (await response.json()) as Record<
      string,
      SleeperPlayer
    >;

  playersCache = data;

  return data;
}

export async function getPlayer(
  playerId: string
): Promise<SleeperPlayer | null> {
  const players = await getPlayers();

  return players[playerId] ?? null;
}

export function getPlayerName(
  player: SleeperPlayer | null
): string {
  if (!player) {
    return "Unknown Player";
  }

  if (player.full_name) {
    return player.full_name;
  }

  return [
    player.first_name,
    player.last_name,
  ]
    .filter(Boolean)
    .join(" ") || "Unknown Player";
}

export function getPlayerPosition(
  player: SleeperPlayer | null
): string {
  return player?.position ?? "Unknown";
}

// Franchise Player Legends lookup.
// Reuses the existing cached player directory.

export async function getPlayerNames(
  playerIds: string[]
): Promise<Record<string, string>> {
  const players = await getPlayers();

  const names: Record<string, string> = {};

  for (const playerId of new Set(playerIds)) {
    const player = players[playerId];

    names[playerId] = player
      ? getPlayerName(player)
      : `Player ${playerId}`;
  }

  return names;
}
