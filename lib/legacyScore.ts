
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

import type {
  HistoricalSeason,
} from "./sleeper";

import {
  calculateLegacyMilestones,
  type LegacyMilestone,
} from "./legacyMilestones";

import {
  calculatePlayoffLegacy,
  type PlayoffLegacyAward,
  type SlootbowlResult,
} from "./legacyPlayoffs";

import {
  calculateConferencePlayerOfTheWeek,
  type WeeklyPlayerAward,
} from "./weeklyRecap";

// SFL Legacy Points
//
// Points accumulate through career achievements.
// Poor seasons never deduct previously earned points.
//
// Categories:
// 1. Seasonal grades
// 2. All-Sloot honours
// 3. Career scoring milestones
// 4. Playoff achievements
// 5. Conference Player of the Week

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
  weeklyAwards: {
    conferencePlayerOfTheWeek: 25,
  },
} as const;

export type LegacyWeeklyAward = WeeklyPlayerAward & {
  season: string;
};

export type LegacyScore = {
  playerId: string;
  name: string;
  position: string;

  // Legacy Points breakdown
  seasonalGradePoints: number;
  allSlootHonoursPoints: number;
  careerMilestonePoints: number;
  playoffLegacyPoints: number;
  weeklyAwardPoints: number;

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

  // Weekly honours
  conferencePlayerOfTheWeekAwards: number;
  obfcPlayerOfTheWeekAwards: number;
  gpfcPlayerOfTheWeekAwards: number;
  weeklyAwards: LegacyWeeklyAward[];

  // Career production
  regularSeasonPoints: number;
  regularSeasonStarts: number;
  seasonsPlayed: number;

  // Detailed achievements
  milestones: LegacyMilestone[];
  playoffAwards: PlayoffLegacyAward[];

  seasonalGrades: {
    season: string;
    grade: SFLSeasonGrade;
    rank: number;
    points: number;
  }[];
};

/**
 * Calculate all Conference Player of the Week
 * awards across historical SFL seasons.
 *
 * Each season uses the existing Weekly Recap
 * calculation, preserving the same winner
 * selection and completed-week validation.
 */
function calculateHistoricalWeeklyAwards(
  historicalData: HistoricalSeason[],
  completedThroughSeason?: number
): Map<string, LegacyWeeklyAward[]> {
  const awardsByPlayer = new Map<
    string,
    LegacyWeeklyAward[]
  >();

  for (const seasonData of historicalData) {
    const season = seasonData.league.season;

    // Exclude seasons beyond the selected cutoff.
    if (
      completedThroughSeason !== undefined &&
      Number(season) > completedThroughSeason
    ) {
      continue;
    }

    const weeklyResults =
      calculateConferencePlayerOfTheWeek(
        historicalData,
        season
      );

    for (const result of weeklyResults) {
      const winners = [
        result.obfcPlayerOfTheWeek,
        result.gpfcPlayerOfTheWeek,
      ];

      for (const winner of winners) {
        if (!winner) continue;

        const existing =
          awardsByPlayer.get(winner.playerId) ?? [];

        existing.push({
          ...winner,
          season,
        });

        awardsByPlayer.set(
          winner.playerId,
          existing
        );
      }
    }
  }

  for (const awards of awardsByPlayer.values()) {
    awards.sort(
      (a, b) =>
        Number(a.season) - Number(b.season) ||
        a.week - b.week
    );
  }

  return awardsByPlayer;
}

export function calculateLegacyScores(
  gradeCareers: SFLPlayerGradeCareer[],
  allSlootCareers: AllSlootCareerPlayer[],
  records?: PlayerRecords,
  directory?: AllSlootPlayerDirectory,
  completedThroughSeason?: number,
  championshipResults: SlootbowlResult[] = [],
  historicalData: HistoricalSeason[] = []
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

  const hasPlayerData =
    records !== undefined &&
    directory !== undefined &&
    completedThroughSeason !== undefined;

  const milestoneCareers = hasPlayerData
    ? calculateLegacyMilestones(
        records,
        directory,
        completedThroughSeason
      )
    : [];

  const playoffCareers = hasPlayerData
    ? calculatePlayoffLegacy(
        records,
        directory,
        completedThroughSeason,
        championshipResults
      )
    : [];

  const milestonesByPlayer = new Map(
    milestoneCareers.map((player) => [
      player.playerId,
      player,
    ])
  );

  const playoffsByPlayer = new Map(
    playoffCareers.map((player) => [
      player.playerId,
      player,
    ])
  );

  const weeklyAwardsByPlayer =
    calculateHistoricalWeeklyAwards(
      historicalData,
      completedThroughSeason
    );

  // Include players with at least one SFL record.
  const playerIds = new Set<string>([
    ...gradesByPlayer.keys(),
    ...honoursByPlayer.keys(),
    ...milestonesByPlayer.keys(),
    ...playoffsByPlayer.keys(),
    ...weeklyAwardsByPlayer.keys(),
  ]);

  const results: LegacyScore[] = [];

  for (const playerId of playerIds) {
    const grades = gradesByPlayer.get(playerId);
    const honours = honoursByPlayer.get(playerId);
    const milestoneCareer =
      milestonesByPlayer.get(playerId);
    const playoffCareer =
      playoffsByPlayer.get(playerId);

    const weeklyAwards =
      weeklyAwardsByPlayer.get(playerId) ?? [];

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

    const playoffLegacyPoints =
      playoffCareer?.totalPlayoffLegacyPoints ?? 0;

    const conferencePlayerOfTheWeekAwards =
      weeklyAwards.length;

    const obfcPlayerOfTheWeekAwards =
      weeklyAwards.filter(
        (award) => award.conference === "OBFC"
      ).length;

    const gpfcPlayerOfTheWeekAwards =
      weeklyAwards.filter(
        (award) => award.conference === "GPFC"
      ).length;

    const weeklyAwardPoints =
      conferencePlayerOfTheWeekAwards *
      LEGACY_POINTS.weeklyAwards
        .conferencePlayerOfTheWeek;

    const totalLegacyPoints =
      seasonalGradePoints +
      allSlootHonoursPoints +
      careerMilestonePoints +
      playoffLegacyPoints +
      weeklyAwardPoints;

    results.push({
      playerId,

      name:
        grades?.name ??
        honours?.name ??
        milestoneCareer?.name ??
        playoffCareer?.name ??
        playerId,

      position:
        grades?.position ??
        honours?.position ??
        milestoneCareer?.position ??
        playoffCareer?.position ??
        "Unknown",

      seasonalGradePoints,
      allSlootHonoursPoints,
      careerMilestonePoints,
      playoffLegacyPoints,
      weeklyAwardPoints,
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

      conferencePlayerOfTheWeekAwards,
      obfcPlayerOfTheWeekAwards,
      gpfcPlayerOfTheWeekAwards,
      weeklyAwards,

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

      playoffAwards:
        playoffCareer?.awards ?? [],

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
