
import type {
  FranchisePlayerCareer,
} from "./franchiseLegacy";

import type {
  HistoricalSeason,
} from "./sleeper";

import type {
  SFLPlayerSeasonGrade,
} from "./seasonGrades";

import type {
  AllSlootCareerPlayer,
} from "./allSlootCareer";

import type {
  FranchiseChampionship,
} from "./franchiseChampionships";

export const FRANCHISE_LEGACY_POINTS = {
  start: 5,
  starterFantasyPoint: 0.5,
  slootbowlChampionship: 150,

  seasonalGrades: {
    Legendary: 150,
    Elite: 90,
    Great: 45,
    Good: 15,
    Ordinary: 0,
    Unranked: 0,
  },

  allSlootHonours: {
    firstTeam: 100,
    secondTeam: 50,
    rookieTeam: 25,
  },
} as const;

export type FranchiseLegacyScore = {
  playerId: string;
  rosterId: number;

  rosterWeeks: number;
  seasonsRepresented: number;
  seasons: string[];

  starts: number;
  starterPoints: number;

  loyaltyPoints: number;
  startPoints: number;
  productionPoints: number;

  seasonalGradePoints: number;
  allSlootHonoursPoints: number;

  championships: number;
  championshipSeasons: string[];
  championshipPoints: number;

  achievementPoints: number;
  totalFranchiseLegacyPoints: number;
};

type SeasonalContribution = {
  playerId: string;
  season: string;
  rosterId: number;
  starts: number;
  points: number;
  rosterWeeks: number;
};

function buildSeasonalContributions(
  historicalSeasons: HistoricalSeason[],
  careers: FranchisePlayerCareer[]
): SeasonalContribution[] {
  const contributions = new Map<
    string,
    SeasonalContribution
  >();

  for (const career of careers) {
    for (const [
      season,
      rosterWeeks,
    ] of Object.entries(
      career.rosterWeeksBySeason
    )) {
      const key =
        `${season}:${career.rosterId}:${career.playerId}`;

      contributions.set(key, {
        playerId: career.playerId,
        season,
        rosterId: career.rosterId,
        starts: 0,
        points: 0,
        rosterWeeks,
      });
    }
  }

  for (const season of historicalSeasons) {
    for (const matchup of season.matchups) {
      if (
        matchup.phase !== "Regular Season" &&
        matchup.phase !== "Main Playoffs"
      ) {
        continue;
      }

      for (const side of ["A", "B"] as const) {
        const rosterId =
          side === "A"
            ? matchup.rosterA
            : matchup.rosterB;

        const starters =
          side === "A"
            ? matchup.startersA
            : matchup.startersB;

        const starterPoints =
          side === "A"
            ? matchup.startersPointsA
            : matchup.startersPointsB;

        starters.forEach((playerId, index) => {
          if (!playerId || playerId === "0") {
            return;
          }

          const key =
            `${season.league.season}:${rosterId}:${playerId}`;

          let contribution =
            contributions.get(key);

          if (!contribution) {
            contribution = {
              playerId,
              season: season.league.season,
              rosterId,
              starts: 0,
              points: 0,
              rosterWeeks: 0,
            };

            contributions.set(key, contribution);
          }

          contribution.starts++;

          const points = starterPoints[index];

          if (Number.isFinite(points)) {
            contribution.points += points;
          }
        });
      }
    }
  }

  return [...contributions.values()];
}

function findAwardFranchise(
  playerId: string,
  season: string,
  contributions: SeasonalContribution[]
): number | null {
  const candidates = contributions
    .filter(
      (entry) =>
        entry.playerId === playerId &&
        entry.season === season
    )
    .sort(
      (a, b) =>
        b.starts - a.starts ||
        b.points - a.points ||
        b.rosterWeeks - a.rosterWeeks ||
        a.rosterId - b.rosterId
    );

  return candidates[0]?.rosterId ?? null;
}

export function calculateFranchiseLegacyScores(
  careers: FranchisePlayerCareer[],
  historicalSeasons: HistoricalSeason[] = [],
  seasonalGrades: SFLPlayerSeasonGrade[] = [],
  allSlootCareers: AllSlootCareerPlayer[] = [],
  franchiseChampionships: FranchiseChampionship[] = []
): FranchiseLegacyScore[] {
  const contributions =
    buildSeasonalContributions(
      historicalSeasons,
      careers
    );

  const gradePoints = new Map<string, number>();
  const honoursPoints = new Map<string, number>();

  // Explicit string keys prevent the
  // TypeScript template-literal key error.
  const championshipMap = new Map<
    string,
    FranchiseChampionship
  >(
    franchiseChampionships.map(
      (championship) => [
        `${championship.rosterId}:${championship.playerId}`,
        championship,
      ]
    )
  );

  for (const grade of seasonalGrades) {
    const rosterId = findAwardFranchise(
      grade.playerId,
      grade.season,
      contributions
    );

    if (rosterId === null) continue;

    const key = `${rosterId}:${grade.playerId}`;

    const value =
      FRANCHISE_LEGACY_POINTS.seasonalGrades[
        grade.grade
      ];

    gradePoints.set(
      key,
      (gradePoints.get(key) ?? 0) + value
    );
  }

  for (const player of allSlootCareers) {
    for (const award of player.awards) {
      const rosterId = findAwardFranchise(
        player.playerId,
        award.season,
        contributions
      );

      if (rosterId === null) continue;

      const key = `${rosterId}:${player.playerId}`;

      const value =
        award.team === "First Team"
          ? FRANCHISE_LEGACY_POINTS
              .allSlootHonours.firstTeam
          : award.team === "Second Team"
          ? FRANCHISE_LEGACY_POINTS
              .allSlootHonours.secondTeam
          : FRANCHISE_LEGACY_POINTS
              .allSlootHonours.rookieTeam;

      honoursPoints.set(
        key,
        (honoursPoints.get(key) ?? 0) + value
      );
    }
  }

  return careers
    .map((career) => {
      const key =
        `${career.rosterId}:${career.playerId}`;

      const startPoints =
        career.starts *
        FRANCHISE_LEGACY_POINTS.start;

      const productionPoints = Math.round(
        career.starterPoints *
          FRANCHISE_LEGACY_POINTS.starterFantasyPoint
      );

      const seasonalGradePoints =
        gradePoints.get(key) ?? 0;

      const allSlootHonoursPoints =
        honoursPoints.get(key) ?? 0;

      const championship =
        championshipMap.get(key);

      const championships =
        championship?.championships ?? 0;

      const championshipSeasons =
        championship?.championshipSeasons ?? [];

      const championshipPoints =
        championships *
        FRANCHISE_LEGACY_POINTS.slootbowlChampionship;

      const achievementPoints =
        seasonalGradePoints +
        allSlootHonoursPoints +
        championshipPoints;

      return {
        playerId: career.playerId,
        rosterId: career.rosterId,

        rosterWeeks: career.rosterWeeks,
        seasonsRepresented:
          career.seasonsRepresented,
        seasons: career.seasons,

        starts: career.starts,
        starterPoints: career.starterPoints,

        loyaltyPoints: career.loyaltyPoints,
        startPoints,
        productionPoints,

        seasonalGradePoints,
        allSlootHonoursPoints,

        championships,
        championshipSeasons,
        championshipPoints,

        achievementPoints,

        totalFranchiseLegacyPoints:
          career.loyaltyPoints +
          startPoints +
          productionPoints +
          achievementPoints,
      };
    })
    .sort(
      (a, b) =>
        b.totalFranchiseLegacyPoints -
          a.totalFranchiseLegacyPoints ||
        b.rosterWeeks - a.rosterWeeks ||
        b.starts - a.starts
    );
}
