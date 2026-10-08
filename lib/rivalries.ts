
export type OfficialRivalry = {
  id: string;
  name: string;
  teams: [number, number];
  series: "standalone" | "love-triangle";
};

export const OFFICIAL_RIVALRIES: OfficialRivalry[] = [
  {
    id: "jai-ho-bowl",
    name: "The Jai Ho Bowl",
    teams: [5, 1],
    series: "standalone",
  },
  {
    id: "flobageddon",
    name: "Flobageddon",
    teams: [2, 10],
    series: "standalone",
  },
  {
    id: "jelly-legs-bowl",
    name: "Jelly Legs Bowl",
    teams: [9, 8],
    series: "standalone",
  },
  {
    id: "shotty-bowl",
    name: "The Shotty Bowl",
    teams: [1, 3],
    series: "standalone",
  },
  {
    id: "texas-bowl",
    name: "The Texas Bowl",
    teams: [4, 6],
    series: "love-triangle",
  },
  {
    id: "paddletap-bowl",
    name: "The Paddletap Bowl",
    teams: [7, 4],
    series: "love-triangle",
  },
  {
    id: "trash-bowl",
    name: "The Trash Bowl",
    teams: [6, 7],
    series: "love-triangle",
  },
];

export const LOVE_TRIANGLE_SERIES = {
  id: "love-triangle",
  name: "Love Triangle Bowl Series",
  teams: [4, 6, 7] as const,
  startSeason: 2022,
  qualifyingPhase: "Regular Season" as const,
  tiebreakers: [
    "Winning Percentage",
    "Point Differential",
    "Points Scored",
  ] as const,
};

export function getOfficialRivalry(
  rosterA: number,
  rosterB: number
): OfficialRivalry | undefined {
  return OFFICIAL_RIVALRIES.find(
    (rivalry) =>
      rivalry.teams.includes(rosterA) &&
      rivalry.teams.includes(rosterB) &&
      rosterA !== rosterB
  );
}

export function getFranchiseRivalries(
  rosterId: number
): OfficialRivalry[] {
  return OFFICIAL_RIVALRIES.filter(
    (rivalry) => rivalry.teams.includes(rosterId)
  );
}

export function isLoveTriangleTeam(
  rosterId: number
): boolean {
  return LOVE_TRIANGLE_SERIES.teams.some(
    (teamId) => teamId === rosterId
  );
}
