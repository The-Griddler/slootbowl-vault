
import type {
  PlayerRecords,
  PlayerWeeklyPerformance,
} from "./playerRecords";

import type {
  AllSlootPlayerDirectory,
  AllSlootPosition,
} from "./allSloot";

export const PLAYOFF_LEGACY_POINTS = {
  championStarter: 500,
  runnerUpStarter: 150,
  slootbowlTopScorer: 250,
  playoffPositionLeader: 200,
} as const;

export type SlootbowlResult = {
  season: string;
  week: number;
  championRosterId: number;
  runnerUpRosterId: number;
};

export type PlayoffLegacyAward = {
  season: string;
  award:
    | "Slootbowl Champion"
    | "Slootbowl Runner-Up"
    | "Slootbowl Top Scorer"
    | "Playoff Position Leader";
  points: number;
};

export type PlayerPlayoffLegacy = {
  playerId: string;
  name: string;
  position: AllSlootPosition;
  awards: PlayoffLegacyAward[];
  totalPlayoffLegacyPoints: number;
};

function isSupportedPosition(
  position: string | null | undefined
): position is AllSlootPosition {
  return (
    position === "QB" ||
    position === "RB" ||
    position === "WR" ||
    position === "TE"
  );
}

export function calculatePlayoffLegacy(
  records: PlayerRecords,
  directory: AllSlootPlayerDirectory,
  completedThroughSeason: number,
  championshipResults: SlootbowlResult[] = []
): PlayerPlayoffLegacy[] {
  const performances: PlayerWeeklyPerformance[] = [];

  const seenStarts = new Set<string>();

  for (const performance of records.weekly) {
    if (
      performance.phase !== "Main Playoffs" ||
      Number(performance.season) >
        completedThroughSeason ||
      !Number.isFinite(performance.points)
    ) {
      continue;
    }

    const player = directory[performance.playerId];

    if (!player || !isSupportedPosition(player.position)) {
      continue;
    }

    const key = [
      performance.season,
      performance.week,
      performance.playerId,
    ].join(":");

    if (seenStarts.has(key)) {
      continue;
    }

    seenStarts.add(key);
    performances.push(performance);
  }

  const awardsByPlayer = new Map<
    string,
    PlayoffLegacyAward[]
  >();

  function addAward(
    playerId: string,
    award: PlayoffLegacyAward
  ) {
    const existing = awardsByPlayer.get(playerId) ?? [];
    existing.push(award);
    awardsByPlayer.set(playerId, existing);
  }

  const seasons = new Set(
    performances.map((performance) => performance.season)
  );

  for (const season of seasons) {
    const seasonPerformances = performances.filter(
      (performance) => performance.season === season
    );

    // Determine the highest cumulative postseason
    // scorer at each position.
    const positionTotals = new Map<
      string,
      {
        playerId: string;
        position: AllSlootPosition;
        points: number;
      }
    >();

    for (const performance of seasonPerformances) {
      const player = directory[performance.playerId];

      if (!player || !isSupportedPosition(player.position)) {
        continue;
      }

      const existing = positionTotals.get(
        performance.playerId
      );

      if (existing) {
        existing.points += performance.points;
      } else {
        positionTotals.set(performance.playerId, {
          playerId: performance.playerId,
          position: player.position,
          points: performance.points,
        });
      }
    }

    for (const position of ["QB", "RB", "WR", "TE"] as const) {
      const candidates = Array.from(
        positionTotals.values()
      ).filter((player) => player.position === position);

      if (candidates.length === 0) {
        continue;
      }

      const highestScore = Math.max(
        ...candidates.map((player) => player.points)
      );

      // Exact ties share the award.
      for (const candidate of candidates) {
        if (
          Math.abs(candidate.points - highestScore) < 0.005
        ) {
          addAward(candidate.playerId, {
            season,
            award: "Playoff Position Leader",
            points:
              PLAYOFF_LEGACY_POINTS.playoffPositionLeader,
          });
        }
      }
    }

    // Championship-specific awards require a
    // verified Slootbowl result.
    const championship = championshipResults.find(
      (result) => result.season === season
    );

    if (!championship) {
      continue;
    }

    const championshipPerformances =
      seasonPerformances.filter(
        (performance) =>
          performance.week === championship.week &&
          (
            performance.rosterId ===
              championship.championRosterId ||
            performance.rosterId ===
              championship.runnerUpRosterId
          )
      );

    if (championshipPerformances.length === 0) {
      continue;
    }

    for (const performance of championshipPerformances) {
      if (
        performance.rosterId ===
        championship.championRosterId
      ) {
        addAward(performance.playerId, {
          season,
          award: "Slootbowl Champion",
          points:
            PLAYOFF_LEGACY_POINTS.championStarter,
        });
      } else {
        addAward(performance.playerId, {
          season,
          award: "Slootbowl Runner-Up",
          points:
            PLAYOFF_LEGACY_POINTS.runnerUpStarter,
        });
      }
    }

    const highestChampionshipScore = Math.max(
      ...championshipPerformances.map(
        (performance) => performance.points
      )
    );

    // Tied highest scorers share the award.
    for (const performance of championshipPerformances) {
      if (
        Math.abs(
          performance.points - highestChampionshipScore
        ) < 0.005
      ) {
        addAward(performance.playerId, {
          season,
          award: "Slootbowl Top Scorer",
          points:
            PLAYOFF_LEGACY_POINTS.slootbowlTopScorer,
        });
      }
    }
  }

  const results: PlayerPlayoffLegacy[] = [];

  for (const [playerId, awards] of awardsByPlayer) {
    const player = directory[playerId];

    if (!player || !isSupportedPosition(player.position)) {
      continue;
    }

    results.push({
      playerId,
      name: player.name,
      position: player.position,
      awards,
      totalPlayoffLegacyPoints: awards.reduce(
        (total, award) => total + award.points,
        0
      ),
    });
  }

  return results.sort(
    (a, b) =>
      b.totalPlayoffLegacyPoints -
        a.totalPlayoffLegacyPoints ||
      a.name.localeCompare(b.name)
  );
}
