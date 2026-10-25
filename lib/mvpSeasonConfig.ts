
/**
 * NFL bye-week configuration for
 * the SFL MVP Ladder.
 *
 * Derives bye weeks from Sleeper's
 * regular-season NFL schedule.
 *
 * Invalid or incomplete schedules
 * are rejected rather than guessed.
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
] as const;

const TEAM_SET = new Set<string>(
  NFL_TEAMS
);

const TOTAL_WEEKS = 18;
const GAMES_PER_TEAM = 17;
const TOTAL_GAMES = 272;

/**
 * Normalise alternative NFL team
 * abbreviations to the identifiers
 * used in our MVP system.
 */
function normaliseTeam(
  value: unknown
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const team = value
    .trim()
    .toUpperCase();

  const aliases: Record<
    string,
    string
  > = {
    JAC: "JAX",
    WSH: "WAS",
    OAK: "LV",
    SD: "LAC",
    STL: "LAR",
  };

  const normalised =
    aliases[team] ?? team;

  return TEAM_SET.has(normalised)
    ? normalised
    : null;
}

/**
 * A matchup is uniquely identified
 * by its week and two teams.
 *
 * This deliberately ignores home/
 * away order so duplicate entries
 * cannot inflate game totals.
 */
function gameKey(
  week: number,
  home: string,
  away: string
): string {
  const teams = [home, away]
    .sort()
    .join("-");

  return `${week}:${teams}`;
}

/**
 * Return a clearly unavailable
 * result when validation fails.
 */
function unavailableSchedule(
  season: string
): MVPByeSchedule {
  return {
    season,
    byeWeeks: {},
    available: false,
    source: "unavailable",
  };
}

export async function getMVPByeSchedule(
  season: string
): Promise<MVPByeSchedule> {
  const unavailable =
    unavailableSchedule(season);

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

    const responseData: unknown =
      await response.json();

    if (!Array.isArray(responseData)) {
      return unavailable;
    }

    /**
     * Track unique NFL matchups.
     *
     * Duplicate records are allowed
     * but only counted once.
     */
    const uniqueGames = new Set<string>();

    /**
     * Track which teams played in
     * each of the 18 NFL weeks.
     */
    const playingByWeek =
      new Map<number, Set<string>>();

    for (
      let week = 1;
      week <= TOTAL_WEEKS;
      week++
    ) {
      playingByWeek.set(
        week,
        new Set<string>()
      );
    }

    /**
     * Count distinct games played
     * by each NFL team.
     */
    const gamesPerTeam =
      new Map<string, number>();

    for (const team of NFL_TEAMS) {
      gamesPerTeam.set(team, 0);
    }

    for (const item of responseData) {
      if (
        !item ||
        typeof item !== "object"
      ) {
        return unavailable;
      }

      const game =
        item as SleeperScheduleGame;

      const week = game.week;

      const home =
        normaliseTeam(game.home);

      const away =
        normaliseTeam(game.away);

      if (
        typeof week !== "number" ||
        !Number.isInteger(week) ||
        week < 1 ||
        week > TOTAL_WEEKS ||
        home === null ||
        away === null ||
        home === away
      ) {
        return unavailable;
      }

      const key = gameKey(
        week,
        home,
        away
      );

      /**
       * Ignore a duplicate record
       * for the same matchup.
       */
      if (uniqueGames.has(key)) {
        continue;
      }

      uniqueGames.add(key);

      const playing =
        playingByWeek.get(week)!;

      /**
       * An NFL team cannot play
       * two different opponents
       * in the same regular-
       * season week.
       */
      if (
        playing.has(home) ||
        playing.has(away)
      ) {
        return unavailable;
      }

      playing.add(home);
      playing.add(away);

      gamesPerTeam.set(
        home,
        gamesPerTeam.get(home)! + 1
      );

      gamesPerTeam.set(
        away,
        gamesPerTeam.get(away)! + 1
      );
    }

    /**
     * The complete NFL regular
     * season contains exactly
     * 272 distinct matchups.
     */
    if (
      uniqueGames.size !==
      TOTAL_GAMES
    ) {
      return unavailable;
    }

    const byeWeeks:
      Record<string, number> = {};

    for (const team of NFL_TEAMS) {
      /**
       * Each team must play
       * exactly 17 games.
       */
      if (
        gamesPerTeam.get(team) !==
        GAMES_PER_TEAM
      ) {
        return unavailable;
      }

      const missingWeeks: number[] =
        [];

      for (
        let week = 1;
        week <= TOTAL_WEEKS;
        week++
      ) {
        const playing =
          playingByWeek.get(week)!;

        if (!playing.has(team)) {
          missingWeeks.push(week);
        }
      }

      /**
       * Every team must have
       * exactly one bye week.
       */
      if (missingWeeks.length !== 1) {
        return unavailable;
      }

      byeWeeks[team] =
        missingWeeks[0];
    }

    /**
     * All checks passed.
     *
     * The resulting bye weeks
     * can now be used by the
     * MVP calculation engine.
     */
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
