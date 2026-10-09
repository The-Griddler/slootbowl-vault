
import type { AllSlootSeason } from "./allSloot";

export type AllSlootCareerAward = {
  season: string;
  team: "First Team" | "Second Team" | "Rookie Team";
};

export type AllSlootCareerPlayer = {
  playerId: string;
  name: string;
  position: string;

  firstTeamSelections: number;
  secondTeamSelections: number;
  rookieTeamSelections: number;

  totalHonours: number;
  seasonsHonoured: number;

  awards: AllSlootCareerAward[];
};

export function calculateAllSlootCareers(
  seasons: AllSlootSeason[]
): AllSlootCareerPlayer[] {
  const careers = new Map<
    string,
    AllSlootCareerPlayer
  >();

  for (const season of seasons) {
    const teams = [
      {
        name: "First Team" as const,
        selections: season.firstTeam,
      },
      {
        name: "Second Team" as const,
        selections: season.secondTeam,
      },
      {
        name: "Rookie Team" as const,
        selections: season.rookieTeam,
      },
    ];

    for (const team of teams) {
      for (const selection of team.selections) {
        const player = selection.player;

        if (!careers.has(player.playerId)) {
          careers.set(player.playerId, {
            playerId: player.playerId,
            name: player.name,
            position: player.position,
            firstTeamSelections: 0,
            secondTeamSelections: 0,
            rookieTeamSelections: 0,
            totalHonours: 0,
            seasonsHonoured: 0,
            awards: [],
          });
        }

        const career = careers.get(player.playerId)!;

        // Prevent the same award being counted twice.
        const alreadyAwarded = career.awards.some(
          (award) =>
            award.season === season.season &&
            award.team === team.name
        );

        if (alreadyAwarded) continue;

        career.awards.push({
          season: season.season,
          team: team.name,
        });

        if (team.name === "First Team") {
          career.firstTeamSelections++;
        } else if (team.name === "Second Team") {
          career.secondTeamSelections++;
        } else {
          career.rookieTeamSelections++;
        }
      }
    }
  }

  for (const career of careers.values()) {
    career.totalHonours =
      career.firstTeamSelections +
      career.secondTeamSelections +
      career.rookieTeamSelections;

    career.seasonsHonoured = new Set(
      career.awards.map((award) => award.season)
    ).size;

    career.awards.sort(
      (a, b) =>
        Number(b.season) - Number(a.season) ||
        ["First Team", "Second Team", "Rookie Team"].indexOf(
          a.team
        ) -
          ["First Team", "Second Team", "Rookie Team"].indexOf(
            b.team
          )
    );
  }

  return [...careers.values()].sort(
    (a, b) =>
      b.firstTeamSelections - a.firstTeamSelections ||
      b.secondTeamSelections - a.secondTeamSelections ||
      b.totalHonours - a.totalHonours ||
      a.name.localeCompare(b.name)
  );
}
