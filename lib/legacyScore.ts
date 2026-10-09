
import type {
  SFLPlayerGradeCareer,
  SFLSeasonGrade,
} from "./seasonGrades";

import type {
  AllSlootCareerPlayer,
} from "./allSlootCareer";

import type {
  AllSlootPlayerDirectory,
} from "./allSloot";

import type {
  PlayerRecords,
} from "./playerRecords";

import {
  calculateLegacyMilestones,
  type LegacyMilestone,
} from "./legacyMilestones";

// SFL Legacy Points
//
// Points accumulate through career achievements.
// Poor seasons do not deduct previously earned points.
//
// Current categories:
// 1. Seasonal grades
// 2. All-Sloot honours
// 3. Career scoring milestones
//
// Playoff legacy will be added separately.

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

  // Legacy Points breakdown
  seasonalGradePoints: number;
  allSlootHonoursPoints: number;
  careerMilestonePoints: number;
  playoffLegacyPoints: number;

  totalLegacyPoints: number;

  // Seasonal achievements
  legendarySeasons: number;
  eliteSeasons: number;
  greatSeasons: number;
  goodSeasons: number;
  ordinarySeasons: number;

  qualifyingGreatSeasons: number;

  // All-Sloot honours
  firstTeamSelections: number;
  secondTeamSelections: number;
  rookieTeamSelections: number;

  // Career production
  regularSeasonPoints: number;
  regularSeasonStarts: number;
  seasonsPlayed: number;

  // Milestone achievements
  milestones: LegacyMilestone[];

  // Seasonal history
  seasonalGrades: {
    season: string;
    grade: SFLSeasonGrade;
    rank: number;
    points: number;
  }[];
};

export function calculateLegacyScores(
  gradeCareers: SFLPlayerGradeCareer[],
  allSlootCareers: AllSlootCareerPlayer[],
  records?: PlayerRecords,
  directory?: AllSlootPlayerDirectory,
  completedThroughSeason?: number
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

  // Calculate milestones only when the required
  // records and player directory are supplied.
  const milestoneCareers =
    records &&
    directory &&
    completedThroughSeason !== undefined
      ? calculateLegacyMilestones(
          records,
          directory,
          completedThroughSeason
        )
      : [];

  const milestonesByPlayer = new Map(
    milestoneCareers.map((player) => [
      player.playerId,
      player,
    ])
  );

  // Include anyone with at least one recorded
  // seasonal grade, honour or milestone career.
  const playerIds = new Set<string>([
    ...gradesByPlayer.keys(),
    ...honoursByPlayer.keys(),
    ...milestonesByPlayer.keys(),
  ]);

  const results: LegacyScore[] = [];

  for (const playerId of playerIds) {
    const grades = gradesByPlayer.get(playerId);
    const honours = honoursByPlayer.get(playerId);
    const milestoneCareer =
      milestonesByPlayer.get(playerId);

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

    const careerMilestonePoints =
      milestoneCareer?.totalMilestonePoints ?? 0;

    // Reserved for the playoff scoring engine.
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
        milestoneCareer?.name ??
        playerId,

      position:
        grades?.position ??
        honours?.position ??
        milestoneCareer?.position ??
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

      regularSeasonPoints:
        milestoneCareer?.regularSeasonPoints ?? 0,

      regularSeasonStarts:
        milestoneCareer?.regularSeasonStarts ?? 0,

      seasonsPlayed:
        milestoneCareer?.seasonsPlayed ??
        grades?.seasons.length ??
        0,

      milestones:
        milestoneCareer?.milestones ?? [],

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
