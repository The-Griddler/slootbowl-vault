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