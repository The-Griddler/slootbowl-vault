
import type {
  HistoricalSeason,
} from "./sleeper";

export type AllSlootPosition =
  | "QB"
  | "RB"
  | "WR"
  | "TE";

export type AllSlootSlot =
  | AllSlootPosition
  | "FLEX"
  | "SUPERFLEX";

export type AllSlootPlayer = {
  playerId: string;
  name: string;
  position: AllSlootPosition;
  points: number;
  gamesStarted: number;
  rosterIds: number[];
  rookieYear: number | null;
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

export type AllSlootPlayerDirectory =
  Record<string, AllSlootPlayerInfo>;

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
  if (slot === "SUPERFLEX") {
    return true;
  }

  if (slot === "FLEX") {
    return position !== "QB";
  }

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

export function getAllSlootPlayers(
  season: HistoricalSeason,
  directory: AllSlootPlayerDirectory
): AllSlootPlayer[] {
  const totals = new Map<
    string,
    {
      points: number;
      weeks: Set<number>;
      rosterIds: Set<number>;
    }
  >();

  // Prevent duplicate scoring in the same week.
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
      team.starters.forEach(
        (playerId, index) => {
          if (
            !playerId ||
            playerId === "0" ||
            !Number.isFinite(
              team.scores[index]
            )
          ) {
            return;
          }

          const key =
            `${playerId}:${matchup.week}`;

          // Count each player only once per week.
          if (seenStarts.has(key)) {
            return;
          }

          seenStarts.add(key);

          if (!totals.has(playerId)) {
            totals.set(playerId, {
              points: 0,
              weeks: new Set(),
              rosterIds: new Set(),
            });
          }

          const total = totals.get(
            playerId
          )!;

          total.points +=
            team.scores[index];

          total.weeks.add(
            matchup.week
          );

          total.rosterIds.add(
            team.rosterId
          );
        }
      );
    }
  }

  const players: AllSlootPlayer[] = [];

  for (const [playerId, total] of totals) {
    const info = directory[playerId];

    if (
      !info ||
      !isPosition(info.position)
    ) {
      continue;
    }

    players.push({
      playerId,
      name: info.name,
      position: info.position,
      points: total.points,
      gamesStarted: total.weeks.size,
      rosterIds: [
        ...total.rosterIds,
      ].sort((a, b) => a - b),
      rookieYear:
        info.rookieYear ?? null,
    });
  }

  return players.sort(comparePlayers);
}

function buildTeam(
  players: AllSlootPlayer[]
): AllSlootSelection[] {
  const available = [
    ...players,
  ].sort(comparePlayers);

  const selected =
    new Set<string>();

  const selections:
    AllSlootSelection[] = [];

  for (const slot of LINEUP) {
    const player = available.find(
      (candidate) =>
        !selected.has(
          candidate.playerId
        ) &&
        eligibleForSlot(
          candidate.position,
          slot
        )
    );

    if (!player) {
      continue;
    }

    selected.add(
      player.playerId
    );

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
  const players =
    getAllSlootPlayers(
      season,
      directory
    );

  const firstTeam =
    buildTeam(players);

  const firstTeamIds =
    new Set(
      firstTeam.map(
        (selection) =>
          selection.player.playerId
      )
    );

  const remainingPlayers =
    players.filter(
      (player) =>
        !firstTeamIds.has(
          player.playerId
        )
    );

  const secondTeam =
    buildTeam(
      remainingPlayers
    );

  const rookiePlayers =
    players.filter(
      (player) =>
        player.rookieYear !== null &&
        player.rookieYear ===
          Number(
            season.league.season
          )
    );

  const rookieTeam =
    buildTeam(
      rookiePlayers
    );

  return {
    season:
      season.league.season,
    firstTeam,
    secondTeam,
    rookieTeam,
  };
}
