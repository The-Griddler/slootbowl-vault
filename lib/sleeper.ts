export type SleeperMatchup = {
  roster_id: number;
  matchup_id: number;
  points: number;
  custom_points: number | null;
};

export async function getMatchups(
  week: number
): Promise<SleeperMatchup[]> {
  const response = await fetch(
    `https://api.sleeper.app/v1/league/${LEAGUE_ID}/matchups/${week}`,
    {
      next: { revalidate: 300 },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to load Sleeper matchups");
  }

  return response.json();
}