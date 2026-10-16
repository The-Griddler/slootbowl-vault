
export type Franchise = {
  rosterId: number;
  name: string;
  manager: string;
  primaryColour: string;
  secondaryColour: string;
  supportingColour?: string;
  logo: string;
};

export const FRANCHISES: Franchise[] = [
  {
    rosterId: 1,
    name: "Mt Isa Ballbags",
    manager: "Ed Nelms",
    primaryColour: "#43080B",
    secondaryColour: "#B84B1B",
    supportingColour: "#D5A052",
    logo: "/logos/mt-isa-ballbags.png",
  },
  {
    rosterId: 2,
    name: "Cambridge Cum Sluts",
    manager: "Ben Smith",
    primaryColour: "#BD1425",
    secondaryColour: "#F8F7EE",
    supportingColour: "#081D3D",
    logo: "/logos/cambridge-cum-sluts.png",
  },
  {
    rosterId: 3,
    name: "Grimsby Chode Chokers",
    manager: "Jake Greenwood",
    primaryColour: "#8051A5",
    secondaryColour: "#241440",
    logo: "/logos/grimsby-chode-chokers.png",
  },
  {
    rosterId: 4,
    name: "Isle of Wight Happy Endings",
    manager: "George Pendleton",
    primaryColour: "#F4BB49",
    secondaryColour: "#B66A2B",
    logo: "/logos/isle-of-wight-happy-endings.png",
  },
  {
    rosterId: 5,
    name: "Grays Town Fingerblasters",
    manager: "Ryan Whiting",
    primaryColour: "#06234B",
    secondaryColour: "#F47512",
    logo: "/logos/grays-town-fingerblasters.png",
  },
  {
    rosterId: 6,
    name: "Lincoln Nonces",
    manager: "Garrett Etheridge",
    primaryColour: "#570B20",
    secondaryColour: "#F4F0E7",
    logo: "/logos/lincoln-nonces.png",
  },
  {
    rosterId: 7,
    name: "Kalamata Dirty Vegans",
    manager: "Ollie Payne",
    primaryColour: "#F87F0A",
    secondaryColour: "#455318",
    logo: "/logos/kalamata-dirty-vegans.png",
  },
  {
    rosterId: 8,
    name: "Weybiza BAB’s",
    manager: "Jack Brannigan",
    primaryColour: "#2789D3",
    secondaryColour: "#743715",
    supportingColour: "#F28C16",
    logo: "/logos/weybiza-babs.png",
  },
  {
    rosterId: 9,
    name: "East Rutherford Shitlickers",
    manager: "Tarl Brayer",
    primaryColour: "#97521F",
    secondaryColour: "#103D59",
    logo: "/logos/east-rutherford-shitlickers.png",
  },
  {
    rosterId: 10,
    name: "Chad Moist Discharge",
    manager: "Josh Thomas",
    primaryColour: "#071011",
    secondaryColour: "#B50D1B",
    logo: "/logos/chad-moist-discharge.png",
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

  if (rosterId === 1 && year <= 2025) {
    return "Perth Ballbags";
  }

  return getFranchiseName(rosterId);
}
