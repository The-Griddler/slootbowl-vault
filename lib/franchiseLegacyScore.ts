
import type {
  FranchisePlayerCareer,
} from "./franchiseLegacy";

export const FRANCHISE_LEGACY_POINTS = {
  start: 5,
  starterFantasyPoint: 0.5,

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
  achievementPoints: number;

  totalFranchiseLegacyPoints: number;
};

export function calculateFranchiseLegacyScores(
  careers: FranchisePlayerCareer[]
): FranchiseLegacyScore[] {
  return careers
    .map((career) => {
      const startPoints =
        career.starts *
        FRANCHISE_LEGACY_POINTS.start;

      const productionPoints =
        Math.round(
          career.starterPoints *
            FRANCHISE_LEGACY_POINTS.starterFantasyPoint
        );

      // Achievement attribution will be added
      // once seasonal honours can be linked to
      // the player's franchise in that season.
      const achievementPoints = 0;

      const totalFranchiseLegacyPoints =
        career.loyaltyPoints +
        startPoints +
        productionPoints +
        achievementPoints;

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
        achievementPoints,

        totalFranchiseLegacyPoints,
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
