import {
  getHistoricalData,
  HistoricalSeason,
} from "./sleeper";

import {
  getPlayers,
  SleeperPlayer,
} from "./players";

export type PlayerWeeklyPerformance = {
  season: string;
  week: number;
  phase:
    | "Regular Season"
    | "Main Playoffs";
  rosterId: number;
  playerId: string;
  points: number;
};

export type PlayerSeasonRecord = {
  season: string;
  playerId: string;
  points: number;
  starts: number;
  weeks: PlayerWeeklyPerformance[];
};

export type PlayerCareerRecord = {
  playerId: string;
  points: number;
  starts: number;
  seasons: string[];
  weeks: PlayerWeeklyPerformance[];
};

export type FranchisePlayerRecord = {
  rosterId: number;
  playerId: string;
  points: number;
  starts: number;
  weeks: PlayerWeeklyPerformance[];
};

export type PlayerGameRecord = {
  season: string;
  week: number;
  phase:
    | "Regular Season"
    | "Main Playoffs";
  playerId: string;
  rosterId: number;
  points: number;
};

export type PlayerRecords = {
  weekly: PlayerWeeklyPerformance[];
  games: PlayerGameRecord[];
  seasons: PlayerSeasonRecord[];
  careers: PlayerCareerRecord[];
  franchises: FranchisePlayerRecord[];
};

function buildWeeklyPerformances(
  historicalData: HistoricalSeason[]
): PlayerWeeklyPerformance[] {
  const performances: PlayerWeeklyPerformance[] = [];

  for (const season of historicalData) {
    for (const matchup of season.matchups) {
      /*
       * Official player records only use:
       *
       * - Regular Season
       * - Main Playoffs
       *
       * Toilet Bowl and ignored games
       * are deliberately excluded.
       */
      if (
        matchup.phase !==
          "Regular Season" &&
        matchup.phase !==
          "Main Playoffs"
      ) {
        continue;
      }

      /*
       * Team A starters
       */
      for (
        let index = 0;
        index <
        matchup.startersA.length;
        index++
      ) {
        const playerId =
          matchup.startersA[index];

        const points =
          matchup.startersPointsA[
            index
          ] ?? 0;

        performances.push({
          season:
            matchup.season,
          week:
            matchup.week,
          phase:
            matchup.phase,
          rosterId:
            matchup.rosterA,
          playerId,
          points,
        });
      }

      /*
       * Team B starters
       */
      for (
        let index = 0;
        index <
        matchup.startersB.length;
        index++
      ) {
        const playerId =
          matchup.startersB[index];

        const points =
          matchup.startersPointsB[
            index
          ] ?? 0;

        performances.push({
          season:
            matchup.season,
          week:
            matchup.week,
          phase:
            matchup.phase,
          rosterId:
            matchup.rosterB,
          playerId,
          points,
        });
      }
    }
  }

  return performances;
}

function buildGameRecords(
  weekly: PlayerWeeklyPerformance[]
): PlayerGameRecord[] {
  return weekly.map(
    (performance) => ({
      season:
        performance.season,
      week:
        performance.week,
      phase:
        performance.phase,
      playerId:
        performance.playerId,
      rosterId:
        performance.rosterId,
      points:
        performance.points,
    })
  );
}

function buildSeasonRecords(
  weekly: PlayerWeeklyPerformance[]
): PlayerSeasonRecord[] {
  const records = new Map<
    string,
    PlayerSeasonRecord
  >();

  for (const performance of weekly) {
    const key =
      `${performance.season}-${performance.playerId}`;

    const existing =
      records.get(key);

    if (!existing) {
      records.set(key, {
        season:
          performance.season,
        playerId:
          performance.playerId,
        points:
          performance.points,
        starts: 1,
        weeks: [
          performance,
        ],
      });

      continue;
    }

    existing.points +=
      performance.points;

    existing.starts += 1;

    existing.weeks.push(
      performance
    );
  }

  return Array.from(
    records.values()
  );
}

function buildCareerRecords(
  weekly: PlayerWeeklyPerformance[]
): PlayerCareerRecord[] {
  const records = new Map<
    string,
    PlayerCareerRecord
  >();

  for (const performance of weekly) {
    const existing =
      records.get(
        performance.playerId
      );

    if (!existing) {
      records.set(
        performance.playerId,
        {
          playerId:
            performance.playerId,
          points:
            performance.points,
          starts: 1,
          seasons: [
            performance.season,
          ],
          weeks: [
            performance,
          ],
        }
      );

      continue;
    }

    existing.points +=
      performance.points;

    existing.starts += 1;

    existing.weeks.push(
      performance
    );

    if (
      !existing.seasons.includes(
        performance.season
      )
    ) {
      existing.seasons.push(
        performance.season
      );
    }
  }

  return Array.from(
    records.values()
  );
}

function buildFranchiseRecords(
  weekly: PlayerWeeklyPerformance[]
): FranchisePlayerRecord[] {
  const records = new Map<
    string,
    FranchisePlayerRecord
  >();

  for (const performance of weekly) {
    const key =
      `${performance.rosterId}-${performance.playerId}`;

    const existing =
      records.get(key);

    if (!existing) {
      records.set(key, {
        rosterId:
          performance.rosterId,
        playerId:
          performance.playerId,
        points:
          performance.points,
        starts: 1,
        weeks: [
          performance,
        ],
      });

      continue;
    }

    existing.points +=
      performance.points;

    existing.starts += 1;

    existing.weeks.push(
      performance
    );
  }

  return Array.from(
    records.values()
  );
}

export async function getPlayerRecords(): Promise<PlayerRecords> {
  /*
   * Load both historical fantasy data
   * and the Sleeper player database.
   *
   * The player database is loaded here so
   * future record calculations can safely
   * use names, positions and other metadata.
   */
  await getPlayers();

  const historicalData =
    await getHistoricalData();

  const weekly =
    buildWeeklyPerformances(
      historicalData
    );

  const games =
    buildGameRecords(
      weekly
    );

  const seasons =
    buildSeasonRecords(
      weekly
    );

  const careers =
    buildCareerRecords(
      weekly
    );

  const franchises =
    buildFranchiseRecords(
      weekly
    );

  return {
    weekly,
    games,
    seasons,
    careers,
    franchises,
  };
}