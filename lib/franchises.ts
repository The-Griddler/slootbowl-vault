
export type Franchise = {
  rosterId: number;
  name: string;
};

export const FRANCHISES: Franchise[] = [
  {
    rosterId: 1,
    name: "Mt Isa Ballbags",
  },
  {
    rosterId: 2,
    name: "Cambridge Cum Sluts",
  },
  {
    rosterId: 3,
    name: "Grimsby Chode Chokers",
  },
  {
    rosterId: 4,
    name: "Isle of Wight Happy Endings",
  },
  {
    rosterId: 5,
    name: "Grays Town Fingerblasters",
  },
  {
    rosterId: 6,
    name: "Lincoln Nonces",
  },
  {
    rosterId: 7,
    name: "Kalamata Dirty Vegans",
  },
  {
    rosterId: 8,
    name: "Weybiza BAB’s",
  },
  {
    rosterId: 9,
    name: "East Rutherford Shitlickers",
  },
  {
    rosterId: 10,
    name: "Chad Moist Discharge",
  },
];

export function getFranchiseName(
  rosterId: number
): string {
  return (
    FRANCHISES.find(
      (franchise) =>
        franchise.rosterId === rosterId
    )?.name ??
    `Roster ${rosterId}`
  );
}

/**
 * Returns the name a franchise used
 * during a particular SFL season.
 *
 * Historical name changes belong here.
 * The roster ID never changes.
 *
 * Other pages can continue using
 * getFranchiseName() for current names.
 */
export function getHistoricalFranchiseName(
  rosterId: number,
  season: string | number
): string {
  const year = Number(season);

  // The Ballbags relocated/renamed
  // ahead of the 2026 SFL season.
  if (rosterId === 1 && year <= 2025) {
    return "Perth Ballbags";
  }

  return getFranchiseName(rosterId);
}
