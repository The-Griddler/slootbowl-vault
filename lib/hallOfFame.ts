
import type {
  PlayerRecords,
  PlayerWeeklyPerformance,
} from "./playerRecords";

import type {
  AllSlootCareerPlayer,
} from "./allSlootCareer";

export type HallOfFameScore = {
  playerId: string;
  name: string;
  position: string;
  careerProduction: number;
  peakDominance: number;
  allSlootHonours: number;
  playoffLegacy: number;
  totalScore: number;
  regularSeasonPoints: number;
  regularSeasonStarts: number;
  playoffPoints: number;
  playoffStarts: number;
  seasonsPlayed: number;
};

type PlayerInfo = {
  name: string;
  position: string | null;
};

type PlayerDirectory = Record<string, PlayerInfo>;

type PlayerStats = {
  playerId: string;
  position: string;
  regular: PlayerWeeklyPerformance[];
  playoffs: PlayerWeeklyPerformance[];
};

const WEIGHTS = {
  career: 35,
  peak: 30,
  honours: 20,
  playoffs: 15,
} as const;

function sumPoints(
  performances: PlayerWeeklyPerformance[]
): number {
  return performances.reduce(
    (total, game) => total + game.points,
    0
  );
}

function clamp(
  value: number,
  maximum: number
): number {
  return Math.max(
    0,
    Math.min(maximum, value)
  );
}

function percentileScore(
  value: number,
  comparison: number[],
  maximum: number
): number {
  if (comparison.length === 0) return 0;

  const below = comparison.filter(
    (other) => other < value
  ).length;

  const equal = comparison.filter(
    (other) => other === value
  ).length;

  // A zero-performance player receives no credit.
  if (value <= 0) return 0;

  const percentile =
    (below + equal / 2) / comparison.length;

  return clamp(
    percentile * maximum,
    maximum
  );
}

function seasonTotals(
  games: PlayerWeeklyPerformance[]
): number[] {
  const totals = new Map<string, number>();

  for (const game of games) {
    totals.set(
      game.season,
      (totals.get(game.season) ?? 0) + game.points
    );
  }

  return [...totals.values()].sort(
    (a, b) => b - a
  );
}

function groupPlayers(
  weekly: PlayerWeeklyPerformance[],
  directory: PlayerDirectory
): PlayerStats[] {
  const players = new Map<string, PlayerStats>();
  const seen = new Set<string>();

  for (const game of weekly) {
    if (
      !game.playerId ||
      game.playerId === "0" ||
      !Number.isFinite(game.points)
    ) {
      continue;
    }

    const position =
      directory[game.playerId]?.position;

    if (
      position !== "QB" &&
      position !== "RB" &&
      position !== "WR" &&
      position !== "TE"
    ) {
      continue;
    }

    // Prevent a duplicated historical matchup from
    // counting the same player twice in one week.
    const key =
      `${game.season}:${game.week}:${game.playerId}`;

    if (seen.has(key)) continue;
    seen.add(key);

    if (!players.has(game.playerId)) {
      players.set(game.playerId, {
        playerId: game.playerId,
        position,
        regular: [],
        playoffs: [],
      });
    }

    const player = players.get(game.playerId)!;

    if (game.phase === "Regular Season") {
      player.regular.push(game);
    } else if (game.phase === "Main Playoffs") {
      player.playoffs.push(game);
    }
  }

  return [...players.values()];
}

export function calculateHallOfFameScores(
  records: PlayerRecords,
  directory: PlayerDirectory,
  honours: AllSlootCareerPlayer[],
  completedThroughSeason?: number
): HallOfFameScore[] {
  const eligibleWeeks = records.weekly.filter(
    (game) =>
      completedThroughSeason === undefined ||
      Number(game.season) <= completedThroughSeason
  );

  const players = groupPlayers(
    eligibleWeeks,
    directory
  );

  const honoursById = new Map(
    honours.map((player) => [
      player.playerId,
      player,
    ])
  );

  const regularPoints = new Map<string, number>();
  const peakPoints = new Map<string, number>();
  const playoffPoints = new Map<string, number>();

  for (const player of players) {
    const totals = seasonTotals(player.regular);

    regularPoints.set(
      player.playerId,
      sumPoints(player.regular)
    );

    // Reward a player's best two seasons.
    // This recognises an exceptional peak without
    // requiring a long NFL career.
    peakPoints.set(
      player.playerId,
      totals.slice(0, 2).reduce(
        (sum, points) => sum + points,
        0
      )
    );

    playoffPoints.set(
      player.playerId,
      sumPoints(player.playoffs)
    );
  }

  return players.map((player) => {
    // Compare each player against their own position.
    const peers = players.filter(
      (other) =>
        other.position === player.position
    );

    const careerProduction = percentileScore(
      regularPoints.get(player.playerId) ?? 0,
      peers.map(
        (peer) =>
          regularPoints.get(peer.playerId) ?? 0
      ),
      WEIGHTS.career
    );

    const peakDominance = percentileScore(
      peakPoints.get(player.playerId) ?? 0,
      peers.map(
        (peer) =>
          peakPoints.get(peer.playerId) ?? 0
      ),
      WEIGHTS.peak
    );

    const award = honoursById.get(
      player.playerId
    );

    const rawHonours = award
      ? award.firstTeamSelections * 10 +
        award.secondTeamSelections * 5 +
        award.rookieTeamSelections * 3
      : 0;

    const allSlootHonours = clamp(
      rawHonours,
      WEIGHTS.honours
    );

    // Provisional playoff component.
    // Championship bonuses will be added after
    // connecting the Slootbowl winners bracket.
    const playoffLegacy = percentileScore(
      playoffPoints.get(player.playerId) ?? 0,
      peers.map(
        (peer) =>
          playoffPoints.get(peer.playerId) ?? 0
      ),
      WEIGHTS.playoffs
    );

    const seasonsPlayed = new Set(
      [...player.regular, ...player.playoffs].map(
        (game) => game.season
      )
    ).size;

    const totalScore =
      careerProduction +
      peakDominance +
      allSlootHonours +
      playoffLegacy;

    return {
      playerId: player.playerId,
      name:
        directory[player.playerId]?.name ??
        `Player ${player.playerId}`,
      position: player.position,
      careerProduction:
        Number(careerProduction.toFixed(2)),
      peakDominance:
        Number(peakDominance.toFixed(2)),
      allSlootHonours,
      playoffLegacy:
        Number(playoffLegacy.toFixed(2)),
      totalScore:
        Number(totalScore.toFixed(2)),
      regularSeasonPoints:
        Number(
          (regularPoints.get(player.playerId) ?? 0)
            .toFixed(2)
        ),
      regularSeasonStarts:
        player.regular.length,
      playoffPoints:
        Number(
          (playoffPoints.get(player.playerId) ?? 0)
            .toFixed(2)
        ),
      playoffStarts:
        player.playoffs.length,
      seasonsPlayed,
    };
  }).sort(
    (a, b) =>
      b.totalScore - a.totalScore ||
      b.regularSeasonPoints -
        a.regularSeasonPoints ||
      a.name.localeCompare(b.name)
  );
}
