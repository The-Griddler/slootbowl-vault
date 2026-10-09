
import {
  getLeagueHistory,
  getMatchups,
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

export async function getFranchisePlayerCareers():
  Promise<FranchisePlayerCareer[]> {
  const leagues = await getLeagueHistory();

  const careers = new Map<
    string,
    CareerAccumulator
  >();

  for (const league of leagues) {
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
      const weekKey = `${league.season}-${week}`;

      for (const rawRoster of weeklyData[weekIndex]) {
        const roster = rawRoster as WeeklyRoster;

        const players = roster.players;

        // Never infer missing roster membership
        // from a team's final season roster.
        if (!Array.isArray(players)) {
          continue;
        }

        const starters = new Set(
          (roster.starters ?? []).filter(
            (id) => id && id !== "0"
          )
        );

        const starterPoints = new Map<
          string,
          number
        >();

        (roster.starters ?? []).forEach(
          (playerId, index) => {
            const points =
              roster.starters_points?.[index];

            if (
              playerId &&
              playerId !== "0" &&
              typeof points === "number" &&
              Number.isFinite(points)
            ) {
              starterPoints.set(playerId, points);
            }
          }
        );

        for (const playerId of new Set(players)) {
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

          if (career.weeks.has(weekKey)) {
            continue;
          }

          career.weeks.add(weekKey);
          career.seasons.add(league.season);

          if (starters.has(playerId)) {
            career.starts++;

            career.starterPoints +=
              starterPoints.get(playerId) ?? 0;
          }
        }
      }
    }
  }

  return [...careers.values()]
    .map((career) => {
      const rosterWeeks = career.weeks.size;

      return {
        playerId: career.playerId,
        rosterId: career.rosterId,
        rosterWeeks,
        seasonsRepresented:
          career.seasons.size,
        seasons: [...career.seasons].sort(),
        starts: career.starts,
        starterPoints: career.starterPoints,
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
