
/**
 * Season-specific NFL bye weeks for the
 * SFL MVP Ladder.
 *
 * Data is derived automatically from
 * Sleeper's NFL regular-season schedule.
 */

export type MVPByeSchedule = {
  season: string;
  byeWeeks: Record<string, number>;
  available: boolean;
  source: "sleeper" | "unavailable";
};

type SleeperScheduleGame = {
  week?: number;
  home?: string;
  away?: string;
};

const NFL_TEAMS = [
  "ARI", "ATL", "BAL", "BUF",
  "CAR", "CHI", "CIN", "CLE",
  "DAL", "DEN", "DET", "GB",
  "HOU", "IND", "JAX", "KC",
  "LAC", "LAR", "LV", "MIA",
  "MIN", "NE", "NO", "NYG",
  "NYJ", "PHI", "PIT", "SEA",
  "SF", "TB", "TEN", "WAS",
];

export async function getMVPByeSchedule(
  season: string
): Promise<MVPByeSchedule> {
  const unavailable: MVPByeSchedule = {
    season,
    byeWeeks: {},
    available: false,
    source: "unavailable",
  };

  if (!/^\d{4}$/.test(season)) {
    return unavailable;
  }

  try {
    const response = await fetch(
      `https://api.sleeper.app/schedule/nfl/regular/${season}`,
      {
        next: {
          revalidate: 86400,
        },
      }
    );

    if (!response.ok) {
      return unavailable;
    }

    const games: unknown =
      await response.json();

    if (!Array.isArray(games)) {
      return unavailable;
    }

    const playingByWeek =
      new Map<number, Set<string>>();

    for (let week = 1; week <= 18; week++) {
      playingByWeek.set(
        week,
        new Set<string>()
      );
    }

    for (const item of games) {
      if (
        !item ||
        typeof item !== "object"
      ) {
        return unavailable;
      }

      const game =
        item as SleeperScheduleGame;

      const { week, home, away } = game;

      if (
        !Number.isInteger(week) ||
        week === undefined ||
        week < 1 ||
        week > 18 ||
        typeof home !== "string" ||
        typeof away !== "string" ||
        !NFL_TEAMS.includes(home) ||
        !NFL_TEAMS.includes(away) ||
        home === away
      ) {
        return unavailable;
      }

      playingByWeek.get(week)!.add(home);
      playingByWeek.get(week)!.add(away);
    }

    // A complete 18-week NFL regular
    // season contains 272 games.
    if (games.length !== 272) {
      return unavailable;
    }

    const byeWeeks:
      Record<string, number> = {};

    for (const team of NFL_TEAMS) {
      const missingWeeks: number[] = [];

      for (
        let week = 1;
        week <= 18;
        week++
      ) {
        if (
          !playingByWeek
            .get(week)!
            .has(team)
        ) {
          missingWeeks.push(week);
        }
      }

      // Each team should have exactly
      // one bye during the 18 weeks.
      if (missingWeeks.length !== 1) {
        return unavailable;
      }

      byeWeeks[team] = missingWeeks[0];
    }

    return {
      season,
      byeWeeks,
      available: true,
      source: "sleeper",
    };
  } catch {
    return unavailable;
  }
}
