
export type SleeperPlayer = {
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  position?: string | null;
  team?: string | null;
};

export async function getPlayerNames(
  playerIds: string[]
): Promise<Record<string, string>> {
  const response = await fetch(
    "https://api.sleeper.app/v1/players/nfl",
    {
      next: {
        revalidate: 86400,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      "Failed to load Sleeper NFL player names"
    );
  }

  const players: Record<string, SleeperPlayer> =
    await response.json();

  const names: Record<string, string> = {};

  for (const id of new Set(playerIds)) {
    const player = players[id];

    if (!player) {
      names[id] = `Player ${id}`;
      continue;
    }

    const name =
      player.full_name ||
      [
        player.first_name,
        player.last_name,
      ]
        .filter(Boolean)
        .join(" ");

    names[id] = name || `Player ${id}`;
  }

  return names;
}
