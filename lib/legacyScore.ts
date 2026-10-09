
import type {
  SFLPlayerGradeCareer,
  SFLSeasonGrade,
} from "./seasonGrades";

import type {
  AllSlootCareerPlayer,
} from "./allSlootCareer";

// SFL Legacy Points — Version 1
//
// Legacy Points accumulate through achievements.
// Players never lose points for poor seasons.
//
// This initial version awards points for:
// 1. Seasonal grades
// 2. All-Sloot selections
//
// Career milestones and playoff achievements
// will be added in subsequent versions.

export const LEGACY_POINTS = {
  seasonalGrades: {
    Legendary: 1000,
    Elite: 600,
    Great: 300,
    Good: 75,
    Ordinary: 0,
    Unranked: 0,
  },
  allSlootHonours: {
    firstTeam: 400,
    secondTeam: 200,
    rookieTeam: 100,
  },
} as const;

export type LegacyScore = {
  playerId: string;
  name: string;
  position: string;

  // Points by category
  seasonalGradePoints: number;
  allSlootHonoursPoints: number;
  careerMilestonePoints: number;
  playoffLegacyPoints: number;

  totalLegacyPoints: number;

  // Career achievements
  legendarySeasons: number;
  eliteSeasons: number;
  greatSeasons: number;
  goodSeasons: number;
  ordinarySeasons: number;

  qualifyingGreatSeasons: number;

  firstTeamSelections: number;
  secondTeamSelections: number;
  rookieTeamSelections: number;

  // Detailed seasonal history
  seasonalGrades: {
    season: string;
    grade: SFLSeasonGrade;
    rank: number;
    points: number;
  }[];
};

export function calculateLegacyScores(
  gradeCareers: SFLPlayerGradeCareer[],
  allSlootCareers: AllSlootCareerPlayer[]
): LegacyScore[] {
  const honoursByPlayer = new Map(
    allSlootCareers.map((player) => [
      player.playerId,
      player,
    ])
  );

  const gradesByPlayer = new Map(
    gradeCareers.map((player) => [
      player.playerId,
      player,
    ])
  );

  // Include players with grades, honours, or both.
  const playerIds = new Set<string>([
    ...gradesByPlayer.keys(),
    ...honoursByPlayer.keys(),
  ]);

  const results: LegacyScore[] = [];

  for (const playerId of playerIds) {
    const grades = gradesByPlayer.get(playerId);
    const honours = honoursByPlayer.get(playerId);

    const seasonalGrades =
      grades?.seasons.map((season) => ({
        season: season.season,
        grade: season.grade,
        rank: season.rank,
        points: season.points,
      })) ?? [];

    const seasonalGradePoints =
      seasonalGrades.reduce(
        (total, season) =>
          total +
          LEGACY_POINTS.seasonalGrades[season.grade],
        0
      );

    const firstTeamSelections =
      honours?.firstTeamSelections ?? 0;

    const secondTeamSelections =
      honours?.secondTeamSelections ?? 0;

    const rookieTeamSelections =
      honours?.rookieTeamSelections ?? 0;

    const allSlootHonoursPoints =
      firstTeamSelections *
        LEGACY_POINTS.allSlootHonours.firstTeam +
      secondTeamSelections *
        LEGACY_POINTS.allSlootHonours.secondTeam +
      rookieTeamSelections *
        LEGACY_POINTS.allSlootHonours.rookieTeam;

    // Reserved for upcoming scoring features.
    const careerMilestonePoints = 0;
    const playoffLegacyPoints = 0;

    const totalLegacyPoints =
      seasonalGradePoints +
      allSlootHonoursPoints +
      careerMilestonePoints +
      playoffLegacyPoints;

    results.push({
      playerId,
      name:
        grades?.name ??
        honours?.name ??
        playerId,
      position:
        grades?.position ??
        honours?.position ??
        "Unknown",

      seasonalGradePoints,
      allSlootHonoursPoints,
      careerMilestonePoints,
      playoffLegacyPoints,
      totalLegacyPoints,

      legendarySeasons: grades?.legendary ?? 0,
      eliteSeasons: grades?.elite ?? 0,
      greatSeasons: grades?.great ?? 0,
      goodSeasons: grades?.good ?? 0,
      ordinarySeasons: grades?.ordinary ?? 0,

      qualifyingGreatSeasons:
        grades?.qualifyingSeasons ?? 0,

      firstTeamSelections,
      secondTeamSelections,
      rookieTeamSelections,

      seasonalGrades,
    });
  }

  return results.sort(
    (a, b) =>
      b.totalLegacyPoints -
        a.totalLegacyPoints ||
      b.qualifyingGreatSeasons -
        a.qualifyingGreatSeasons ||
      a.name.localeCompare(b.name)
  );
}
