
import type { HistoricalSeason } from "./sleeper";

import {
  getAllSlootPlayers,
  type AllSlootPlayerDirectory,
  type AllSlootPosition,
} from "./allSloot";

export type SFLSeasonGrade =
  | "Legendary"
  | "Elite"
  | "Great"
  | "Good"
  | "Ordinary"
  | "Unranked";

export type SFLPlayerSeasonGrade = {
  season: string;
  playerId: string;
  name: string;
  position: AllSlootPosition;
  rank: number;
  points: number;
  starts: number;
  grade: SFLSeasonGrade;
};

export type SFLPlayerGradeCareer = {
  playerId: string;
  name: string;
  position: AllSlootPosition;
  seasons: SFLPlayerSeasonGrade[];
  legendary: number;
  elite: number;
  great: number;
  good: number;
  ordinary: number;
  qualifyingSeasons: number;
};

const GRADE_LIMITS = {
  QB: [1, 3, 6, 12, 18],
  RB: [2, 6, 12, 24, 36],
  WR: [2, 6, 12, 24, 36],
  TE: [1, 3, 6, 12, 18],
} as const;

export function getSeasonGrade(
  position: AllSlootPosition,
  rank: number
): SFLSeasonGrade {
  const limits = GRADE_LIMITS[position];

  if (rank <= 0) return "Unranked";
  if (rank <= limits[0]) return "Legendary";
  if (rank <= limits[1]) return "Elite";
  if (rank <= limits[2]) return "Great";
  if (rank <= limits[3]) return "Good";
  if (rank <= limits[4]) return "Ordinary";

  return "Unranked";
}

export function calculateSeasonGrades(
  season: HistoricalSeason,
  directory: AllSlootPlayerDirectory
): SFLPlayerSeasonGrade[] {
  const players = getAllSlootPlayers(
    season,
    directory
  );

  const positions: AllSlootPosition[] = [
    "QB",
    "RB",
    "WR",
    "TE",
  ];

  const results: SFLPlayerSeasonGrade[] = [];

  for (const position of positions) {
    const ranked = players
      .filter(
        (player) => player.position === position
      )
      .sort(
        (a, b) =>
          b.points - a.points ||
          a.playerId.localeCompare(b.playerId)
      );

    let previousPoints: number | null = null;
    let currentRank = 0;

    ranked.forEach((player, index) => {
      // Competition ranking:
      // 1, 2, 2, 4 rather than 1, 2, 3, 4.
      //
      // Fantasy scores are rounded to two
      // decimal places for tie comparisons.
      const points = Number(
        player.points.toFixed(2)
      );

      if (
        previousPoints === null ||
        points !== previousPoints
      ) {
        currentRank = index + 1;
      }

      previousPoints = points;

      results.push({
        season: season.league.season,
        playerId: player.playerId,
        name: player.name,
        position,
        rank: currentRank,
        points,
        starts: player.gamesStarted,
        grade: getSeasonGrade(
          position,
          currentRank
        ),
      });
    });
  }

  return results;
}

export function calculateGradeCareers(
  grades: SFLPlayerSeasonGrade[]
): SFLPlayerGradeCareer[] {
  const careers = new Map<
    string,
    SFLPlayerGradeCareer
  >();

  for (const grade of grades) {
    if (!careers.has(grade.playerId)) {
      careers.set(grade.playerId, {
        playerId: grade.playerId,
        name: grade.name,
        position: grade.position,
        seasons: [],
        legendary: 0,
        elite: 0,
        great: 0,
        good: 0,
        ordinary: 0,
        qualifyingSeasons: 0,
      });
    }

    const career = careers.get(grade.playerId)!;

    // Prevent duplicate historical seasons.
    if (
      career.seasons.some(
        (existing) =>
          existing.season === grade.season
      )
    ) {
      continue;
    }

    career.seasons.push(grade);

    if (grade.grade === "Legendary") {
      career.legendary++;
      career.qualifyingSeasons++;
    } else if (grade.grade === "Elite") {
      career.elite++;
      career.qualifyingSeasons++;
    } else if (grade.grade === "Great") {
      career.great++;
      career.qualifyingSeasons++;
    } else if (grade.grade === "Good") {
      career.good++;
    } else if (grade.grade === "Ordinary") {
      career.ordinary++;
    }
  }

  for (const career of careers.values()) {
    career.seasons.sort(
      (a, b) =>
        Number(a.season) - Number(b.season)
    );
  }

  return [...careers.values()].sort(
    (a, b) =>
      b.qualifyingSeasons -
        a.qualifyingSeasons ||
      b.legendary - a.legendary ||
      b.elite - a.elite ||
      a.name.localeCompare(b.name)
  );
}

export function calculateHistoricalSeasonGrades(
  seasons: HistoricalSeason[],
  directory: AllSlootPlayerDirectory,
  completedThroughSeason: number
): SFLPlayerSeasonGrade[] {
  return seasons
    .filter(
      (season) =>
        Number(season.league.season) <=
        completedThroughSeason
    )
    .flatMap(
      (season) =>
        calculateSeasonGrades(
          season,
          directory
        )
    );
}
