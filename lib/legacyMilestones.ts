
import type {
  PlayerRecords,
  PlayerWeeklyPerformance,
} from "./playerRecords";

import type {
  AllSlootPlayerDirectory,
  AllSlootPosition,
} from "./allSloot";

// Provisional thresholds.
// These will be calibrated against real SFL
// career totals before official induction.

export const LEGACY_MILESTONES: Record<
  AllSlootPosition,
  readonly number[]
> = {
  QB: [750, 1500, 2500, 3500, 5000],
  RB: [500, 1000, 1750, 2500, 3500],
  WR: [500, 1000, 1750, 2500, 3500],
  TE: [300, 650, 1100, 1600, 2250],
};

export const MILESTONE_BONUSES = [
  100,
  200,
  300,
  450,
  650,
] as const;

export type LegacyMilestone = {
  tier: number;
  requiredPoints: number;
  legacyPoints: number;
};

export type PlayerLegacyMilestones = {
  playerId: string;
  name: string;
  position: AllSlootPosition;
  regularSeasonPoints: number;
  regularSeasonStarts: number;
  seasonsPlayed: number;
  milestones: LegacyMilestone[];
  totalMilestonePoints: number;
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

function isValidPerformance(
  performance: PlayerWeeklyPerformance,
  completedThroughSeason: number
): boolean {
  const season = Number(performance.season);

  return (
    performance.phase === "Regular Season" &&
    Number.isInteger(season) &&
    season <= completedThroughSeason &&
    performance.week >= 1 &&
    performance.week <= 14 &&
    typeof performance.playerId === "string" &&
    performance.playerId.length > 0 &&
    Number.isFinite(performance.points)
  );
}

export function calculateLegacyMilestones(
  records: PlayerRecords,
  directory: AllSlootPlayerDirectory,
  completedThroughSeason: number
): PlayerLegacyMilestones[] {
  const careerTotals = new Map<
    string,
    {
      points: number;
      starts: number;
      seasons: Set<string>;
    }
  >();

  // Prevent duplicate historical matchup records
  // from awarding the same start twice.
  const seenStarts = new Set<string>();

  for (const performance of records.weekly) {
    if (
      !isValidPerformance(
        performance,
        completedThroughSeason
      )
    ) {
      continue;
    }

    const player = directory[performance.playerId];

    if (!player || !isSupportedPosition(player.position)) {
      continue;
    }

    const startKey = [
      performance.season,
      performance.week,
      performance.playerId,
    ].join(":");

    if (seenStarts.has(startKey)) {
      continue;
    }

    seenStarts.add(startKey);

    const existing = careerTotals.get(
      performance.playerId
    );

    if (existing) {
      existing.points += performance.points;
      existing.starts += 1;
      existing.seasons.add(performance.season);
    } else {
      careerTotals.set(performance.playerId, {
        points: performance.points,
        starts: 1,
        seasons: new Set([performance.season]),
      });
    }
  }

  const results: PlayerLegacyMilestones[] = [];

  for (const [playerId, totals] of careerTotals) {
    const player = directory[playerId];

    if (!player || !isSupportedPosition(player.position)) {
      continue;
    }

    const thresholds = LEGACY_MILESTONES[player.position];

    const milestones: LegacyMilestone[] = [];

    thresholds.forEach((requiredPoints, index) => {
      if (totals.points >= requiredPoints) {
        milestones.push({
          tier: index + 1,
          requiredPoints,
          legacyPoints: MILESTONE_BONUSES[index],
        });
      }
    });

    const totalMilestonePoints = milestones.reduce(
      (sum, milestone) =>
        sum + milestone.legacyPoints,
      0
    );

    results.push({
      playerId,
      name: player.name,
      position: player.position,
      regularSeasonPoints: Number(
        totals.points.toFixed(2)
      ),
      regularSeasonStarts: totals.starts,
      seasonsPlayed: totals.seasons.size,
      milestones,
      totalMilestonePoints,
    });
  }

  return results.sort(
    (a, b) =>
      b.totalMilestonePoints -
        a.totalMilestonePoints ||
      b.regularSeasonPoints -
        a.regularSeasonPoints ||
      a.name.localeCompare(b.name)
  );
}
