const LEAGUE_ID = "1326512818865868800";
const WEEK = 1;

async function getMatchups() {
  const response = await fetch(
    `https://api.sleeper.app/v1/league/${LEAGUE_ID}/matchups/${WEEK}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch matchups");
  }

  return response.json();
}

async function getStats() {
  const season = "2026";

  const response = await fetch(
    `https://api.sleeper.app/v1/stats/nfl/${season}/${WEEK}?season_type=regular`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch player stats");
  }

  return response.json();
}

async function main() {
  const matchups = await getMatchups();
  const stats = await getStats();

  console.log("MATCHUPS FOUND:", matchups.length);
  console.log(
    "PLAYER STATS FOUND:",
    Object.keys(stats).length
  );

  for (const matchup of matchups) {
    console.log("\n--------------------------------");
    console.log(
      "Roster:",
      matchup.roster_id
    );
    console.log(
      "Official Sleeper score:",
      matchup.points
    );
    console.log(
      "Starters:",
      matchup.starters
    );

    let calculatedScore = 0;

    for (const playerId of matchup.starters ?? []) {
      const playerStats = stats[playerId];

      if (!playerStats) {
        console.log(
          "NO STATS FOUND:",
          playerId
        );
        continue;
      }

      const points =
        playerStats.fantasy_points ??
        playerStats.pts_ppr ??
        0;

      calculatedScore += points;

      console.log(
        playerId,
        "=>",
        points
      );
    }

    console.log(
      "Calculated starter total:",
      calculatedScore
    );
  }
}

main().catch((error) => {
  console.error(error);
});