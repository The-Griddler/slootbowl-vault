
import type {
  PlayerRecords,
  PlayerWeeklyPerformance,
} from "./playerRecords";

import type {
  AllSlootPlayerDirectory,
  AllSlootPosition,
} from "./allSloot";

// SFL career scoring milestones.
//
// Points count only when a player was
// selected in a starting lineup.
//
// Eligible competitions:
// - Regular Season (Weeks 1-14)
// - Main Playoffs (Weeks 15-17)
//
// Excluded:
// - Toilet Bowl
// - Consolation and placement games
// - Incomplete seasons
// - Duplicate player-week performances
//
// Milestone bonuses accumulate across tiers.
//
// Maximum milestone Legacy Points: 3,000.

export const LEGACY_MILESTONES: Record<
  AllSlootPosition,
  readonly number[]
> = {
  QB: [
    110, 215, 325, 490, 650,
    815, 975, 1140, 1300, 1625,
    1950, 2275, 2600, 2925, 3250,
  ],

  RB: [
    90, 185, 275, 415, 550,
    690, 825, 965, 1100, 1375,
    1650, 1925, 2200, 2475, 2750,
  ],

  WR: [
    85, 175, 260, 390, 520,
    650, 780, 910, 1040, 1300,
    1560, 1820, 2080, 2340, 2600,
  ],

  TE: [
    75, 155, 230, 345, 460,
    575, 690, 805, 920, 1150,
    1380, 1610, 1840, 2070, 2300,
  ],
};

// Rewards increase through the early and
// middle milestones, then plateau.
//
// Sum of all 15 bonuses = 3,000 LP.

export const MILESTONE_BONUSES = [
  50,
  75,
  100,
  125,
  150,
  175,
  200,
  225,
  250,
  275,
  275,
  275,
  275,
  275,
  275,
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

  // Regular-season statistics remain separate.
  regularSeasonPoints: number;
  regularSeasonStarts: number;

  // Additional playoff and career statistics.
  playoffPoints: number;
  playoffStarts: number;
  careerPoints: number;
  careerStarts: number;

  seasonsPlayed: number;

  milestones: LegacyMilestone[];
  totalMilestonePoints: number;
};

type CareerTotals = {
  regularPoints: number;
  playoffPoints: number;
  regularStarts: number;
  playoffStarts: number;
  seasons: Set<string>;
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
  completedThroughSeason: number,
  phase: "Regular Season" | "Main Playoffs"
): boolean {
  const season = Number(performance.season);

  const validWeek =
    phase === "Regular Season"
      ? performance.week >= 1 &&
        performance.week <= 14
      : performance.week >= 15 &&
        performance.week <= 17;

  return (
    performance.phase === phase &&
    Number.isInteger(season) &&
    season <= completedThroughSeason &&
    validWeek &&
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
    CareerTotals
  >();

  // Only fully completed regular seasons
  // are eligible for regular-season points.
  const completedRegularSeasons = new Set(
    records.completedSeasons.regularSeason.filter(
      (season) =>
        Number(season) <= completedThroughSeason
    )
  );

  // Only completed main-playoff seasons
  // are eligible for playoff points.
  const completedPlayoffSeasons = new Set(
    records.completedSeasons.mainPlayoffs.filter(
      (season) =>
        Number(season) <= completedThroughSeason
    )
  );

  // Prevent the same player-week start
  // from being counted more than once.
  const seenStarts = new Set<string>();

  function processPerformances(
    performances: PlayerWeeklyPerformance[],
    phase: "Regular Season" | "Main Playoffs",
    completedSeasons: Set<string>
  ) {
    for (const performance of performances) {
      if (
        !completedSeasons.has(performance.season)
      ) {
        continue;
      }

      if (
        !isValidPerformance(
          performance,
          completedThroughSeason,
          phase
        )
      ) {
        continue;
      }

      const player =
        directory[performance.playerId];

      if (
        !player ||
        !isSupportedPosition(player.position)
      ) {
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
      ) ?? {
        regularPoints: 0,
        playoffPoints: 0,
        regularStarts: 0,
        playoffStarts: 0,
        seasons: new Set<string>(),
      };

      if (phase === "Regular Season") {
        existing.regularPoints +=
          performance.points;

        existing.regularStarts += 1;
      } else {
        existing.playoffPoints +=
          performance.points;

        existing.playoffStarts += 1;
      }

      existing.seasons.add(
        performance.season
      );

      careerTotals.set(
        performance.playerId,
        existing
      );
    }
  }

  processPerformances(
    records.competitions.regularSeason.weekly,
    "Regular Season",
    completedRegularSeasons
  );

  processPerformances(
    records.competitions.mainPlayoffs.weekly,
    "Main Playoffs",
    completedPlayoffSeasons
  );

  const results: PlayerLegacyMilestones[] = [];

  for (const [playerId, totals] of careerTotals) {
    const player = directory[playerId];

    if (
      !player ||
      !isSupportedPosition(player.position)
    ) {
      continue;
    }

    const careerPoints =
      totals.regularPoints +
      totals.playoffPoints;

    const thresholds =
      LEGACY_MILESTONES[player.position];

    const milestones: LegacyMilestone[] = [];

    thresholds.forEach(
      (requiredPoints, index) => {
        if (
          careerPoints + 0.000001 >=
          requiredPoints
        ) {
          milestones.push({
            tier: index + 1,
            requiredPoints,
            legacyPoints:
              MILESTONE_BONUSES[index],
          });
        }
      }
    );

    const totalMilestonePoints =
      milestones.reduce(
        (sum, milestone) =>
          sum + milestone.legacyPoints,
        0
      );

    results.push({
      playerId,
      name: player.name,
      position: player.position,

      regularSeasonPoints: Number(
        totals.regularPoints.toFixed(2)
      ),

      regularSeasonStarts:
        totals.regularStarts,

      playoffPoints: Number(
        totals.playoffPoints.toFixed(2)
      ),

      playoffStarts:
        totals.playoffStarts,

      careerPoints: Number(
        careerPoints.toFixed(2)
      ),

      careerStarts:
        totals.regularStarts +
        totals.playoffStarts,

      seasonsPlayed:
        totals.seasons.size,

      milestones,
      totalMilestonePoints,
    });
  }

  return results.sort(
    (a, b) =>
      b.totalMilestonePoints -
        a.totalMilestonePoints ||
      b.careerPoints -
        a.careerPoints ||
      a.name.localeCompare(b.name)
  );
}
