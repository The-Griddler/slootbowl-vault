
import {
  getLeagueHistory,
  getMatchups,
  getHistoricalData,
  type SleeperMatchup,
} from "./sleeper";

type WeeklyRoster = SleeperMatchup & {
  players?: string[] | null;
};

export type FranchisePlayerCareer = {
  playerId: string;
  rosterId: number;
  rosterWeeks: number;
  seasonsRepresented: number;
  seasons: string[];
  starts: number;
  starterPoints: number;
  loyaltyPoints: number;
};

type CareerAccumulator = {
  playerId: string;
  rosterId: number;
  weeks: Set<string>;
  seasons: Set<string>;
};

function calculateLoyaltyPoints(
  rosterWeeks: number
): number {
  let total = 0;

  for (let week = 1; week <= rosterWeeks; week++) {
    if (week <= 17) total += 10;
    else if (week <= 34) total += 15;
    else if (week <= 51) total += 20;
    else if (week <= 68) total += 25;
    else total += 30;
  }

  return total;
}

function hasRecordedResult(
  roster: SleeperMatchup
): boolean {
  return (
    typeof roster.points === "number" &&
    Number.isFinite(roster.points) &&
    roster.points > 0
  );
}

function isLeagueWeekComplete(
  rosters: SleeperMatchup[]
): boolean {
  // Require a recorded result for all 10 teams,
  // not just one or two early score updates.
  return (
    rosters.length === 10 &&
    rosters.every(hasRecordedResult)
  );
}

export async function getFranchisePlayerCareers():
  Promise<FranchisePlayerCareer[]> {
  const [leagues, historicalData] =
    await Promise.all([
      getLeagueHistory(),
      getHistoricalData(),
    ]);

  if (leagues.length === 0) return [];

  const latestSeason = Math.max(
    ...leagues.map((league) =>
      Number(league.season)
    )
  );

  const careers = new Map<
    string,
    CareerAccumulator
  >();

  // Process weekly membership.
  for (const league of leagues) {
    const year = Number(league.season);

    const weeklyData = await Promise.all(
      Array.from({ length: 17 }, (_, index) =>
        getMatchups(index + 1, league.league_id)
      )
    );

    for (
      let weekIndex = 0;
      weekIndex < weeklyData.length;
      weekIndex++
    ) {
      const week = weekIndex + 1;
      const rosters = weeklyData[weekIndex];

      // Historical completed seasons:
      // count all available Weeks 1-17.
      //
      // Latest season:
      // require all 10 teams to have a score.
      if (
        year === latestSeason &&
        !isLeagueWeekComplete(rosters)
      ) {
        continue;
      }

      const weekKey = `${league.season}-${week}`;

      for (const rawRoster of rosters) {
        const roster = rawRoster as WeeklyRoster;

        if (!Array.isArray(roster.players)) {
          continue;
        }

        const uniquePlayers = new Set(
          roster.players.filter(
            (id) => id && id !== "0"
          )
        );

        for (const playerId of uniquePlayers) {
          const key =
            `${roster.roster_id}:${playerId}`;

          let career = careers.get(key);

          if (!career) {
            career = {
              playerId,
              rosterId: roster.roster_id,
              weeks: new Set<string>(),
              seasons: new Set<string>(),
            };

            careers.set(key, career);
          }

          career.weeks.add(weekKey);
          career.seasons.add(league.season);
        }
      }
    }
  }

  // Count official starts and points separately.
  const officialPerformance = new Map<
    string,
    { starts: number; points: number }
  >();

  for (const season of historicalData) {
    for (const matchup of season.matchups) {
      if (
        matchup.phase !== "Regular Season" &&
        matchup.phase !== "Main Playoffs"
      ) {
        continue;
      }

      for (const side of ["A", "B"] as const) {
        const rosterId =
          side === "A"
            ? matchup.rosterA
            : matchup.rosterB;

        const starters =
          side === "A"
            ? matchup.startersA
            : matchup.startersB;

        const points =
          side === "A"
            ? matchup.startersPointsA
            : matchup.startersPointsB;

        starters.forEach((playerId, index) => {
          if (!playerId || playerId === "0") {
            return;
          }

          const value = points[index];

          if (!Number.isFinite(value)) {
            return;
          }

          const key =
            `${rosterId}:${playerId}`;

          const previous =
            officialPerformance.get(key) ?? {
              starts: 0,
              points: 0,
            };

          officialPerformance.set(key, {
            starts: previous.starts + 1,
            points: previous.points + value,
          });
        });
      }
    }
  }

  return [...careers.values()]
    .map((career) => {
      const rosterWeeks = career.weeks.size;

      const performance =
        officialPerformance.get(
          `${career.rosterId}:${career.playerId}`
        );

      return {
        playerId: career.playerId,
        rosterId: career.rosterId,
        rosterWeeks,
        seasonsRepresented:
          career.seasons.size,
        seasons: [...career.seasons].sort(),
        starts: performance?.starts ?? 0,
        starterPoints: performance?.points ?? 0,
        loyaltyPoints:
          calculateLoyaltyPoints(rosterWeeks),
      };
    })
    .sort(
      (a, b) =>
        b.loyaltyPoints - a.loyaltyPoints ||
        b.starts - a.starts ||
        b.starterPoints - a.starterPoints
    );
}
