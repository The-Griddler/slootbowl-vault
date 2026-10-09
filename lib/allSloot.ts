
import type { HistoricalSeason } from "./sleeper";

export type AllSlootPosition = "QB" | "RB" | "WR" | "TE";

export type AllSlootSlot =
  | AllSlootPosition
  | "FLEX"
  | "SUPERFLEX";

export type AllSlootFranchise = {
  rosterId: number;
  points: number;
  gamesStarted: number;
};

export type AllSlootPlayer = {
  playerId: string;
  name: string;
  position: AllSlootPosition;
  points: number;
  gamesStarted: number;
  rosterIds: number[];
  rookieYear: number | null;

  // All franchises represented, ordered by points scored.
  franchises: AllSlootFranchise[];

  // Franchise where the player scored the most starter points.
  primaryRosterId: number | null;
};

export type AllSlootSelection = {
  slot: AllSlootSlot;
  player: AllSlootPlayer;
};

export type AllSlootSeason = {
  season: string;
  firstTeam: AllSlootSelection[];
  secondTeam: AllSlootSelection[];
  rookieTeam: AllSlootSelection[];
};

export type AllSlootPlayerInfo = {
  name: string;
  position: string | null;
  rookieYear?: number | null;
};

export type AllSlootPlayerDirectory = Record<
  string,
  AllSlootPlayerInfo
>;

const LINEUP: AllSlootSlot[] = [
  "QB",
  "RB",
  "RB",
  "WR",
  "WR",
  "WR",
  "TE",
  "FLEX",
  "FLEX",
  "FLEX",
  "SUPERFLEX",
];

function isPosition(
  value: string | null
): value is AllSlootPosition {
  return (
    value === "QB" ||
    value === "RB" ||
    value === "WR" ||
    value === "TE"
  );
}

function eligibleForSlot(
  position: AllSlootPosition,
  slot: AllSlootSlot
): boolean {
  if (slot === "SUPERFLEX") return true;
  if (slot === "FLEX") return position !== "QB";
  return position === slot;
}

function comparePlayers(
  a: AllSlootPlayer,
  b: AllSlootPlayer
): number {
  return (
    b.points - a.points ||
    b.gamesStarted - a.gamesStarted ||
    a.playerId.localeCompare(b.playerId)
  );
}

type FranchiseAccumulator = {
  points: number;
  weeks: Set<number>;
};

type PlayerAccumulator = {
  points: number;
  weeks: Set<number>;
  franchises: Map<number, FranchiseAccumulator>;
};

export function getAllSlootPlayers(
  season: HistoricalSeason,
  directory: AllSlootPlayerDirectory
): AllSlootPlayer[] {
  const totals = new Map<
    string,
    PlayerAccumulator
  >();

  // Prevent a player being counted twice in one week.
  const seenStarts = new Set<string>();

  for (const matchup of season.matchups) {
    if (
      matchup.phase !== "Regular Season" ||
      matchup.week < 1 ||
      matchup.week > 14
    ) {
      continue;
    }

    const teams = [
      {
        rosterId: matchup.rosterA,
        starters: matchup.startersA,
        scores: matchup.startersPointsA,
      },
      {
        rosterId: matchup.rosterB,
        starters: matchup.startersB,
        scores: matchup.startersPointsB,
      },
    ];

    for (const team of teams) {
      team.starters.forEach((playerId, index) => {
        if (
          !playerId ||
          playerId === "0" ||
          !Number.isFinite(team.scores[index])
        ) {
          return;
        }

        const key = `${playerId}:${matchup.week}`;

        if (seenStarts.has(key)) return;
        seenStarts.add(key);

        if (!totals.has(playerId)) {
          totals.set(playerId, {
            points: 0,
            weeks: new Set<number>(),
            franchises: new Map<
              number,
              FranchiseAccumulator
            >(),
          });
        }

        const total = totals.get(playerId)!;
        const points = team.scores[index];

        total.points += points;
        total.weeks.add(matchup.week);

        if (!total.franchises.has(team.rosterId)) {
          total.franchises.set(team.rosterId, {
            points: 0,
            weeks: new Set<number>(),
          });
        }

        const franchise = total.franchises.get(
          team.rosterId
        )!;

        franchise.points += points;
        franchise.weeks.add(matchup.week);
      });
    }
  }

  const players: AllSlootPlayer[] = [];

  for (const [playerId, total] of totals) {
    const info = directory[playerId];

    if (!info || !isPosition(info.position)) {
      continue;
    }

    const franchises: AllSlootFranchise[] = [
      ...total.franchises.entries(),
    ]
      .map(([rosterId, stats]) => ({
        rosterId,
        points: stats.points,
        gamesStarted: stats.weeks.size,
      }))
      .sort(
        (a, b) =>
          b.points - a.points ||
          b.gamesStarted - a.gamesStarted ||
          a.rosterId - b.rosterId
      );

    players.push({
      playerId,
      name: info.name,
      position: info.position,
      points: total.points,
      gamesStarted: total.weeks.size,
      rosterIds: [...total.franchises.keys()].sort(
        (a, b) => a - b
      ),
      rookieYear: info.rookieYear ?? null,
      franchises,
      primaryRosterId:
        franchises[0]?.rosterId ?? null,
    });
  }

  return players.sort(comparePlayers);
}

function buildTeam(
  players: AllSlootPlayer[]
): AllSlootSelection[] {
  const available = [...players].sort(comparePlayers);
  const selected = new Set<string>();
  const selections: AllSlootSelection[] = [];

  for (const slot of LINEUP) {
    const player = available.find(
      (candidate) =>
        !selected.has(candidate.playerId) &&
        eligibleForSlot(candidate.position, slot)
    );

    if (!player) continue;

    selected.add(player.playerId);

    selections.push({
      slot,
      player,
    });
  }

  return selections;
}

export function calculateAllSloot(
  season: HistoricalSeason,
  directory: AllSlootPlayerDirectory
): AllSlootSeason {
  const players = getAllSlootPlayers(
    season,
    directory
  );

  const firstTeam = buildTeam(players);

  const firstTeamIds = new Set(
    firstTeam.map(
      (selection) => selection.player.playerId
    )
  );

  const secondTeam = buildTeam(
    players.filter(
      (player) => !firstTeamIds.has(player.playerId)
    )
  );

  const rookieTeam = buildTeam(
    players.filter(
      (player) =>
        player.rookieYear !== null &&
        player.rookieYear ===
          Number(season.league.season)
    )
  );

  return {
    season: season.league.season,
    firstTeam,
    secondTeam,
    rookieTeam,
  };
}
