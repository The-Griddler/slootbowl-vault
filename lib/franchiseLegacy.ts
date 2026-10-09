
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
  starts: number;
  starterPoints: number;
};

function calculateLoyaltyPoints(
  rosterWeeks: number
): number {
  let total = 0;

  for (let week = 1; week <= rosterWeeks; week++) {
    if (week <= 17) {
      total += 10;
    } else if (week <= 34) {
      total += 15;
    } else if (week <= 51) {
      total += 20;
    } else if (week <= 68) {
      total += 25;
    } else {
      total += 30;
    }
  }

  return total;
}

function isPlayed(
  matchup: SleeperMatchup
): boolean {
  return (
    typeof matchup.points === "number" &&
    Number.isFinite(matchup.points) &&
    matchup.points !== 0
  );
}

export async function getFranchisePlayerCareers():
  Promise<FranchisePlayerCareer[]> {
  const [leagues, historicalData] =
    await Promise.all([
      getLeagueHistory(),
      getHistoricalData(),
    ]);

  const currentSeason = Math.max(
    ...leagues.map((league) =>
      Number(league.season)
    )
  );

  // Official starting appearances are taken
  // from the existing historical classification.
  // This excludes Toilet Bowl, placement and
  // consolation performances.
  const officialStarts = new Map<
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

          const key = `${rosterId}:${playerId}`;
          const previous = officialStarts.get(key) ?? {
            starts: 0,
            points: 0,
          };

          officialStarts.set(key, {
            starts: previous.starts + 1,
            points: previous.points + value,
          });
        });
      }
    }
  }

  const careers = new Map<
    string,
    CareerAccumulator
  >();

  for (const league of leagues) {
    const year = Number(league.season);
    const completedSeason = year < currentSeason;

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

      // Completed historical seasons count
      // Weeks 1-17. Current season weeks
      // must contain actual recorded scores.
      if (
        !completedSeason &&
        !rosters.some(isPlayed)
      ) {
        continue;
      }

      const weekKey = `${league.season}-${week}`;

      for (const rawRoster of rosters) {
        const roster = rawRoster as WeeklyRoster;

        // For the ongoing season, only credit
        // teams with a recorded matchup result.
        if (
          !completedSeason &&
          !isPlayed(roster)
        ) {
          continue;
        }

        if (!Array.isArray(roster.players)) {
          continue;
        }

        for (const playerId of new Set(
          roster.players
        )) {
          if (!playerId || playerId === "0") {
            continue;
          }

          const key =
            `${roster.roster_id}:${playerId}`;

          let career = careers.get(key);

          if (!career) {
            career = {
              playerId,
              rosterId: roster.roster_id,
              weeks: new Set<string>(),
              seasons: new Set<string>(),
              starts: 0,
              starterPoints: 0,
            };

            careers.set(key, career);
          }

          career.weeks.add(weekKey);
          career.seasons.add(league.season);
        }
      }
    }
  }

  return [...careers.values()]
    .map((career) => {
      const rosterWeeks = career.weeks.size;

      const performance =
        officialStarts.get(
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
