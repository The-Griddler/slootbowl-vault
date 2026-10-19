
import type {
  HistoricalMatchup,
  HistoricalSeason,
} from "./sleeper";
import type { SleeperPlayer } from "./players";

export const HOME_SEASON = "2026";

export const HOME_CONFERENCES = [
  {
    id: "OBFC",
    name: "Osmington Bay Football Conference",
    rosterIds: [4, 6, 8, 7, 9],
  },
  {
    id: "GPFC",
    name: "Gloucester-Plymouth Football Conference",
    rosterIds: [1, 2, 10, 3, 5],
  },
] as const;

export type HomeStanding = {
  rosterId: number;
  conference: "OBFC" | "GPFC";
  rank: number;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  gamesPlayed: number;
  winPercentage: number;
  inPlayoffPosition: boolean;
};

export type HomeGame = HistoricalMatchup & {
  margin: number;
  combinedScore: number;
  winnerId: number | null;
  loserId: number | null;
};

export type HomeSeasonStats = {
  season: string;
  completedWeeks: number;
  latestCompletedWeek: number;
  gamesPlayed: number;
  totalPoints: number;
  averageTeamScore: number;
  highestTeamScore: {
    rosterId: number;
    points: number;
    week: number;
  } | null;
  closestGame: HomeGame | null;
  biggestBlowout: HomeGame | null;
  highestScoringGame: HomeGame | null;
};

export type HomeRecordWatch = {
  category: string;
  record: number;
  recordSeason: string;
  recordRosterId: number | null;
  challenger: number;
  challengerRosterId: number | null;
  progressPercentage: number;
  projectedTotal: number | null;
  onRecordPace: boolean;
};

export type RecordHighlight = {
  id: string;
  kind: "game" | "season";
  subject: "player" | "franchise";
  tone: "positive" | "negative" | "unusual";
  label: string;
  headline: string;
  detail: string;
  value: number;
  unit: "points" | "wins";
  rosterId: number | null;
  playerId: string | null;
  week: number;
  season: string;
  allTimeRank: number | null;
  historicalRecord: number | null;
  historicalSeason: string | null;
  historicalRosterId: number | null;
  projectedValue: number | null;
  priority: number;
};

export type HomeStats = {
  season: string;
  seasonStats: HomeSeasonStats;
  standings: HomeStanding[];
  conferences: {
    OBFC: HomeStanding[];
    GPFC: HomeStanding[];
  };
  playoffContenders: number[];
  completedGames: HomeGame[];
  recordWatch: HomeRecordWatch[];
  recordHighlights: RecordHighlight[];
};

type Position = "QB" | "RB" | "WR" | "TE";
type Conference = "OBFC" | "GPFC";
type Direction = "high" | "low";
type Scope = "SFL" | Conference | "franchise";

type MutableStanding = Omit<
  HomeStanding,
  "rank" | "winPercentage" | "inPlayoffPosition"
>;

type TeamPerformance = {
  season: string;
  week: number;
  rosterId: number;
  conference: Conference;
  points: number;
  opponentPoints: number;
  margin: number;
  won: boolean;
  lost: boolean;
};

type PlayerPerformance = {
  season: string;
  week: number;
  rosterId: number;
  conference: Conference;
  playerId: string;
  position: Position;
  points: number;
};

type TeamSeason = {
  season: string;
  rosterId: number;
  conference: Conference;
  points: number;
  wins: number;
  losses: number;
  games: number;
};

type PlayerSeason = {
  season: string;
  playerId: string;
  position: Position;
  scope: Scope;
  rosterId: number | null;
  conference: Conference | null;
  points: number;
  starts: number;
  latestRosterId: number;
};

type RecordData = {
  teams: TeamPerformance[];
  players: PlayerPerformance[];
  teamSeasons: TeamSeason[];
  playerSeasons: PlayerSeason[];
};

type Achievement = {
  scope: Scope;
  rank: number;
  label: string;
  record: number;
  holderSeason: string | null;
  holderRosterId: number | null;
  priority: number;
};

const WEEKS = 14;
const PLAYER_TARGET_STARTS = 13;
const MAX_RANK = 10;
const MIN_PLAYER_STARTS = 4;
const MIN_LOW_SEASON_STARTS = 8;
const MIN_TEAM_GAMES = 4;
const MIN_WIN_GAMES = 7;
const EARLY_STREAK = 6;
const TOLERANCE = 0.02;

const POSITIONS: Position[] = [
  "QB",
  "RB",
  "WR",
  "TE",
];

const CONFERENCES: Conference[] = [
  "OBFC",
  "GPFC",
];

const ROSTER_CONFERENCE = new Map<
  number,
  Conference
>();

for (const conference of HOME_CONFERENCES) {
  for (const rosterId of conference.rosterIds) {
    ROSTER_CONFERENCE.set(
      rosterId,
      conference.id
    );
  }
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function validTeamScore(n: number): boolean {
  return Number.isFinite(n) && n >= 0;
}

function validPlayerScore(n: number): boolean {
  return Number.isFinite(n);
}

function getPosition(
  player: SleeperPlayer | undefined
): Position | null {
  if (
    player?.position &&
    POSITIONS.includes(player.position as Position)
  ) {
    return player.position as Position;
  }

  for (const position of player?.fantasy_positions ?? []) {
    if (POSITIONS.includes(position as Position)) {
      return position as Position;
    }
  }

  return null;
}

function eligible(
  game: HistoricalMatchup,
  season: string
): boolean {
  return (
    game.season === season &&
    game.phase === "Regular Season" &&
    game.isComplete &&
    game.week >= 1 &&
    game.week <= WEEKS &&
    game.rosterA !== game.rosterB &&
    validTeamScore(game.scoreA) &&
    validTeamScore(game.scoreB)
  );
}

function toHomeGame(
  game: HistoricalMatchup
): HomeGame {
  const winnerId =
    game.scoreA > game.scoreB
      ? game.rosterA
      : game.scoreB > game.scoreA
        ? game.rosterB
        : null;

  return {
    ...game,
    margin: round2(
      Math.abs(game.scoreA - game.scoreB)
    ),
    combinedScore: round2(
      game.scoreA + game.scoreB
    ),
    winnerId,
    loserId:
      winnerId === game.rosterA
        ? game.rosterB
        : winnerId === game.rosterB
          ? game.rosterA
          : null,
  };
}

export function calculateHomeStandings(
  games: HomeGame[]
): HomeStanding[] {
  const totals = new Map<
    number,
    MutableStanding
  >();

  for (const conference of HOME_CONFERENCES) {
    for (const rosterId of conference.rosterIds) {
      totals.set(rosterId, {
        rosterId,
        conference: conference.id,
        wins: 0,
        losses: 0,
        ties: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        gamesPlayed: 0,
      });
    }
  }

  for (const game of games) {
    const a = totals.get(game.rosterA);
    const b = totals.get(game.rosterB);

    if (!a || !b) continue;

    a.gamesPlayed++;
    b.gamesPlayed++;

    a.pointsFor += game.scoreA;
    a.pointsAgainst += game.scoreB;
    b.pointsFor += game.scoreB;
    b.pointsAgainst += game.scoreA;

    if (game.scoreA > game.scoreB) {
      a.wins++;
      b.losses++;
    } else if (game.scoreB > game.scoreA) {
      b.wins++;
      a.losses++;
    } else {
      a.ties++;
      b.ties++;
    }
  }

  const result: HomeStanding[] = [];

  for (const conference of HOME_CONFERENCES) {
    const sorted = [...totals.values()]
      .filter(
        (team) =>
          team.conference === conference.id
      )
      .sort((a, b) => {
        const pctA =
          a.gamesPlayed > 0
            ? (a.wins + a.ties * 0.5) /
              a.gamesPlayed
            : 0;

        const pctB =
          b.gamesPlayed > 0
            ? (b.wins + b.ties * 0.5) /
              b.gamesPlayed
            : 0;

        return (
          pctB - pctA ||
          b.pointsFor - a.pointsFor ||
          a.rosterId - b.rosterId
        );
      });

    sorted.forEach((team, index) => {
      result.push({
        ...team,
        rank: index + 1,
        pointsFor: round2(team.pointsFor),
        pointsAgainst: round2(
          team.pointsAgainst
        ),
        winPercentage:
          team.gamesPlayed > 0
            ? (team.wins + team.ties * 0.5) /
              team.gamesPlayed
            : 0,
        inPlayoffPosition: index < 3,
      });
    });
  }

  return result;
}

function calculateSeasonStats(
  games: HomeGame[],
  season: string
): HomeSeasonStats {
  const weeks = new Set<number>();

  let highestTeamScore:
    HomeSeasonStats["highestTeamScore"] = null;

  let totalPoints = 0;

  for (const game of games) {
    weeks.add(game.week);
    totalPoints += game.scoreA + game.scoreB;

    for (const side of [
      {
        rosterId: game.rosterA,
        points: game.scoreA,
      },
      {
        rosterId: game.rosterB,
        points: game.scoreB,
      },
    ]) {
      if (
        !highestTeamScore ||
        side.points > highestTeamScore.points
      ) {
        highestTeamScore = {
          ...side,
          week: game.week,
        };
      }
    }
  }

  const closestGame =
    [...games].sort(
      (a, b) =>
        a.margin - b.margin ||
        b.combinedScore - a.combinedScore
    )[0] ?? null;

  const biggestBlowout =
    [...games].sort(
      (a, b) =>
        b.margin - a.margin ||
        b.combinedScore - a.combinedScore
    )[0] ?? null;

  const highestScoringGame =
    [...games].sort(
      (a, b) =>
        b.combinedScore - a.combinedScore
    )[0] ?? null;

  return {
    season,
    completedWeeks: weeks.size,
    latestCompletedWeek:
      weeks.size > 0
        ? Math.max(...weeks)
        : 0,
    gamesPlayed: games.length,
    totalPoints: round2(totalPoints),
    averageTeamScore:
      games.length > 0
        ? round2(
            totalPoints / (games.length * 2)
          )
        : 0,
    highestTeamScore,
    closestGame,
    biggestBlowout,
    highestScoringGame,
  };
}

/*
 * Build historical data once.
 *
 * Conference memberships are permanent.
 *
 * Player weekly performances belong
 * to the franchise that started them.
 *
 * Player season totals are built at
 * three levels:
 *
 * SFL: all starts across all franchises
 * Conference: starts in that conference
 * Franchise: starts for that franchise
 */
function buildRecordData(
  historicalData: HistoricalSeason[],
  currentSeason: string,
  directory: Record<string, SleeperPlayer>
): RecordData {
  const teams: TeamPerformance[] = [];
  const players: PlayerPerformance[] = [];
  const teamSeasons: TeamSeason[] = [];
  const playerSeasons: PlayerSeason[] = [];

  for (const historical of historicalData) {
    const season = historical.league.season;

    if (Number(season) > Number(currentSeason)) {
      continue;
    }

    const games = historical.matchups
      .filter((game) => eligible(game, season))
      .sort((a, b) => a.week - b.week);

    const teamTotals = new Map<
      number,
      TeamSeason
    >();

    const playerTotals = new Map<
      string,
      PlayerSeason
    >();

    for (const game of games) {
      const sides = [
        {
          rosterId: game.rosterA,
          points: game.scoreA,
          opponentPoints: game.scoreB,
          starters: game.startersA,
          starterPoints: game.startersPointsA,
        },
        {
          rosterId: game.rosterB,
          points: game.scoreB,
          opponentPoints: game.scoreA,
          starters: game.startersB,
          starterPoints: game.startersPointsB,
        },
      ];

      for (const side of sides) {
        const conference =
          ROSTER_CONFERENCE.get(side.rosterId);

        if (!conference) continue;

        const margin = round2(
          side.points - side.opponentPoints
        );

        teams.push({
          season,
          week: game.week,
          rosterId: side.rosterId,
          conference,
          points: round2(side.points),
          opponentPoints: round2(
            side.opponentPoints
          ),
          margin,
          won: margin > 0,
          lost: margin < 0,
        });

        const teamTotal =
          teamTotals.get(side.rosterId) ?? {
            season,
            rosterId: side.rosterId,
            conference,
            points: 0,
            wins: 0,
            losses: 0,
            games: 0,
          };

        teamTotal.points += side.points;
        teamTotal.games++;

        if (margin > 0) teamTotal.wins++;
        if (margin < 0) teamTotal.losses++;

        teamTotals.set(
          side.rosterId,
          teamTotal
        );

        side.starters.forEach(
          (playerId, index) => {
            const points =
              side.starterPoints[index];

            if (
              !playerId ||
              playerId === "0" ||
              !validPlayerScore(points)
            ) {
              return;
            }

            const position = getPosition(
              directory[playerId]
            );

            if (!position) return;

            players.push({
              season,
              week: game.week,
              rosterId: side.rosterId,
              conference,
              playerId,
              position,
              points: round2(points),
            });

            const scopes: {
              key: string;
              scope: Scope;
              rosterId: number | null;
              conference: Conference | null;
            }[] = [
              {
                key: `${playerId}:SFL`,
                scope: "SFL",
                rosterId: null,
                conference: null,
              },
              {
                key: `${playerId}:${conference}`,
                scope: conference,
                rosterId: null,
                conference,
              },
              {
                key:
                  `${playerId}:franchise:` +
                  side.rosterId,
                scope: "franchise",
                rosterId: side.rosterId,
                conference,
              },
            ];

            for (const entry of scopes) {
              const total =
                playerTotals.get(entry.key) ?? {
                  season,
                  playerId,
                  position,
                  scope: entry.scope,
                  rosterId: entry.rosterId,
                  conference: entry.conference,
                  points: 0,
                  starts: 0,
                  latestRosterId:
                    side.rosterId,
                };

              total.points += points;
              total.starts++;
              total.latestRosterId =
                side.rosterId;

              playerTotals.set(
                entry.key,
                total
              );
            }
          }
        );
      }
    }

    for (const total of teamTotals.values()) {
      teamSeasons.push({
        ...total,
        points: round2(total.points),
      });
    }

    for (const total of playerTotals.values()) {
      playerSeasons.push({
        ...total,
        points: round2(total.points),
      });
    }
  }

  return {
    teams,
    players,
    teamSeasons,
    playerSeasons,
  };
}

function rankOf(
  value: number,
  values: number[],
  direction: Direction
): number {
  return (
    values.filter((other) =>
      direction === "high"
        ? other > value
        : other < value
    ).length + 1
  );
}

function ordinal(rank: number): string {
  const suffix =
    rank % 100 >= 11 && rank % 100 <= 13
      ? "th"
      : rank % 10 === 1
        ? "st"
        : rank % 10 === 2
          ? "nd"
          : rank % 10 === 3
            ? "rd"
            : "th";

  return `${rank}${suffix}`;
}

function scopeName(
  scope: Scope
): string {
  if (scope === "SFL") return "SFL";
  if (scope === "franchise") {
    return "franchise";
  }
  return scope;
}

function scopePriority(
  scope: Scope,
  rank: number,
  positional: boolean
): number {
  const base =
    scope === "SFL"
      ? 130
      : scope === "franchise"
        ? 105
        : 116;

  const rankPenalty =
    rank === 1
      ? 0
      : (rank - 1) * 13 + 9;

  return (
    base -
    rankPenalty -
    (positional ? 5 : 0)
  );
}

function scopeMatches(
  item: {
    rosterId: number;
    conference: Conference;
  },
  scope: Scope,
  rosterId: number
): boolean {
  if (scope === "SFL") return true;

  if (scope === "franchise") {
    return item.rosterId === rosterId;
  }

  return item.conference === scope;
}

function scopeList(
  conference: Conference
): Scope[] {
  return [
    "SFL",
    conference,
    "franchise",
  ];
}

function bestAchievement(
  achievements: Achievement[]
): Achievement | null {
  return (
    [...achievements].sort(
      (a, b) =>
        b.priority - a.priority ||
        a.rank - b.rank
    )[0] ?? null
  );
}

function achievementDetail(
  achievements: Achievement[]
): string {
  return [...achievements]
    .sort(
      (a, b) =>
        b.priority - a.priority
    )
    .slice(0, 4)
    .map((item) => item.label)
    .join(" · ");
}

/*
 * Franchise weekly records.
 *
 * Five categories at SFL, conference
 * and franchise level.
 *
 * Multiple records achieved by one
 * performance become one story.
 */
function buildTeamGameHighlights(
  performances: TeamPerformance[],
  season: string,
  week: number
): RecordHighlight[] {
  const weekly = performances.filter(
    (item) =>
      item.season === season &&
      item.week === week
  );

  const categories: {
    id: string;
    title: string;
    direction: Direction;
    tone: RecordHighlight["tone"];
    eligible: (p: TeamPerformance) => boolean;
    value: (p: TeamPerformance) => number;
  }[] = [
    {
      id: "score-high",
      title: "highest weekly team score",
      direction: "high",
      tone: "positive",
      eligible: () => true,
      value: (p) => p.points,
    },
    {
      id: "score-low",
      title: "lowest weekly team score",
      direction: "low",
      tone: "negative",
      eligible: () => true,
      value: (p) => p.points,
    },
    {
      id: "winning-margin",
      title: "biggest winning margin",
      direction: "high",
      tone: "positive",
      eligible: (p) => p.won,
      value: (p) => p.margin,
    },
    {
      id: "losing-score",
      title: "highest score in a loss",
      direction: "high",
      tone: "unusual",
      eligible: (p) => p.lost,
      value: (p) => p.points,
    },
    {
      id: "winning-score-low",
      title: "lowest score in a win",
      direction: "low",
      tone: "unusual",
      eligible: (p) => p.won,
      value: (p) => p.points,
    },
  ];

  const candidates: RecordHighlight[] = [];

  for (const performance of weekly) {
    for (const category of categories) {
      if (!category.eligible(performance)) {
        continue;
      }

      const value = category.value(
        performance
      );

      const achievements: Achievement[] = [];

      for (const scope of scopeList(
        performance.conference
      )) {
        const history = performances.filter(
          (item) =>
            category.eligible(item) &&
            scopeMatches(
              item,
              scope,
              performance.rosterId
            )
        );

        if (!history.length) continue;

        const rank = rankOf(
          value,
          history.map(category.value),
          category.direction
        );

        /*
         * SFL and conference top tens
         * are meaningful.
         *
         * Franchise results need to
         * reach the top three.
         */
        const limit =
          scope === "franchise"
            ? 3
            : MAX_RANK;

        if (rank > limit) continue;

        const record =
          category.direction === "high"
            ? Math.max(
                ...history.map(
                  category.value
                )
              )
            : Math.min(
                ...history.map(
                  category.value
                )
              );

        achievements.push({
          scope,
          rank,
          label:
            `${ordinal(rank)} ` +
            `${category.title} in ` +
            `${scopeName(scope)} history`,
          record,
          holderSeason: null,
          holderRosterId: null,
          priority: scopePriority(
            scope,
            rank,
            false
          ),
        });
      }

      const primary = bestAchievement(
        achievements
      );

      if (!primary) continue;

      candidates.push({
        id:
          `${season}-${week}-team-` +
          `${performance.rosterId}-` +
          category.id,
        kind: "game",
        subject: "franchise",
        tone: category.tone,
        label:
          primary.scope === "franchise"
            ? "Franchise record watch"
            : `${primary.scope} record watch`,
        headline:
          primary.rank === 1
            ? `New ${scopeName(primary.scope)} record: ${category.title}`
            : `${ordinal(primary.rank)} in ${scopeName(primary.scope)} history`,
        detail: achievementDetail(
          achievements
        ),
        value: round2(value),
        unit: "points",
        rosterId: performance.rosterId,
        playerId: null,
        week,
        season,
        allTimeRank: primary.rank,
        historicalRecord:
          primary.record,
        historicalSeason: null,
        historicalRosterId: null,
        projectedValue: null,
        priority:
          primary.priority +
          (category.tone === "unusual"
            ? 2
            : 0),
      });
    }
  }

  return candidates;
}

/*
 * Player weekly records.
 *
 * Each game is compared with:
 *
 * Overall SFL players
 * SFL players at same position
 * Conference players
 * Conference players at position
 * Franchise players
 * Franchise players at position
 *
 * Low scores include negatives.
 */
function buildPlayerGameHighlights(
  performances: PlayerPerformance[],
  season: string,
  week: number
): RecordHighlight[] {
  const weekly = performances.filter(
    (item) =>
      item.season === season &&
      item.week === week
  );

  const candidates: RecordHighlight[] = [];

  for (const performance of weekly) {
    for (const direction of [
      "high",
      "low",
    ] as const) {
      const isLow = direction === "low";
      const achievements: Achievement[] = [];

      for (const scope of scopeList(
        performance.conference
      )) {
        for (const positional of [
          false,
          true,
        ]) {
          const history = performances.filter(
            (item) =>
              scopeMatches(
                item,
                scope,
                performance.rosterId
              ) &&
              (!positional ||
                item.position ===
                  performance.position)
          );

          if (!history.length) continue;

          const values = history.map(
            (item) => item.points
          );

          const rank = rankOf(
            performance.points,
            values,
            direction
          );

          const limit =
            scope === "franchise"
              ? 3
              : MAX_RANK;

          if (rank > limit) continue;

          const record = isLow
            ? Math.min(...values)
            : Math.max(...values);

          const category = positional
            ? `${performance.position} games`
            : "all player games";

          achievements.push({
            scope,
            rank,
            label:
              `${ordinal(rank)} ` +
              `${isLow ? "lowest" : "highest"} ` +
              `${category} in ` +
              `${scopeName(scope)} history`,
            record,
            holderSeason: null,
            holderRosterId: null,
            priority: scopePriority(
              scope,
              rank,
              positional
            ),
          });
        }
      }

      const primary = bestAchievement(
        achievements
      );

      if (!primary) continue;

      const position = performance.position;

      candidates.push({
        id:
          `${season}-${week}-player-` +
          `${performance.playerId}-` +
          direction,
        kind: "game",
        subject: "player",
        tone: isLow
          ? "negative"
          : "positive",
        label:
          `${scopeName(primary.scope)} ` +
          `${position} performance`,
        headline:
          primary.rank === 1
            ? isLow
              ? `A new ${scopeName(primary.scope)} scoring low`
              : `A new ${scopeName(primary.scope)} player scoring record`
            : `${ordinal(primary.rank)} ${isLow ? "lowest" : "highest"} ${scopeName(primary.scope)} performance`,
        detail: achievementDetail(
          achievements
        ),
        value: performance.points,
        unit: "points",
        rosterId: performance.rosterId,
        playerId: performance.playerId,
        week,
        season,
        allTimeRank: primary.rank,
        historicalRecord:
          primary.record,
        historicalSeason: null,
        historicalRosterId: null,
        projectedValue: null,
        priority:
          primary.priority +
          (isLow ? -4 : 0),
      });
    }
  }

  return candidates;
}

function projectedPlayerPoints(
  item: PlayerSeason,
  currentWeek: number
): number {
  /*
   * A player cannot add more starts
   * than the remaining SFL weeks.
   *
   * This matters for traded players:
   * a franchise cannot project 13
   * starts if it only has five weeks
   * remaining to use that player.
   */
  const remainingWeeks = Math.max(
    0,
    WEEKS - currentWeek
  );

  const possibleStarts = Math.min(
    PLAYER_TARGET_STARTS,
    item.starts + remainingWeeks
  );

  return round2(
    (item.points / item.starts) *
      possibleStarts
  );
}

/*
 * Player season record chases.
 *
 * Actual historical totals are used.
 *
 * Overall SFL points follow the player
 * across franchises.
 *
 * Conference and franchise points
 * count only relevant starts.
 *
 * Position-specific and all-position
 * records are both checked.
 */
function buildPlayerSeasonHighlights(
  seasons: PlayerSeason[],
  season: string,
  week: number
): RecordHighlight[] {
  if (week < MIN_PLAYER_STARTS) {
    return [];
  }

  const historical = seasons.filter(
    (item) =>
      Number(item.season) <
      Number(season)
  );

  const current = seasons.filter(
    (item) =>
      item.season === season &&
      item.starts >= MIN_PLAYER_STARTS
  );

  const candidates: RecordHighlight[] = [];

  for (const player of current) {
    for (const direction of [
      "high",
      "low",
    ] as const) {
      const isLow = direction === "low";

      if (
        isLow &&
        player.starts <
          MIN_LOW_SEASON_STARTS
      ) {
        continue;
      }

      const projection =
        projectedPlayerPoints(
          player,
          week
        );

      const achievements: Achievement[] = [];

      /*
       * The playerSeasons array contains
       * three separately scoped totals.
       *
       * Each total is evaluated only
       * against the same scope.
       */
      const samePlayerScopes = current.filter(
        (item) =>
          item.playerId === player.playerId
      );

      /*
       * Process only once per player,
       * using the SFL aggregate entry.
       */
      if (player.scope !== "SFL") {
        continue;
      }

      for (const scoped of samePlayerScopes) {
        if (
          scoped.starts <
          MIN_PLAYER_STARTS
        ) {
          continue;
        }

        if (
          isLow &&
          scoped.starts <
            MIN_LOW_SEASON_STARTS
        ) {
          continue;
        }

        const scopedProjection =
          scoped.scope === "SFL"
            ? projection
            : projectedPlayerPoints(
                scoped,
                week
              );

        for (const positional of [
          false,
          true,
        ]) {
          const history = historical.filter(
            (item) =>
              item.scope === scoped.scope &&
              (
                scoped.scope !==
                  "franchise" ||
                item.rosterId ===
                  scoped.rosterId
              ) &&
              (!(
                scoped.scope === "OBFC" ||
                scoped.scope === "GPFC"
              ) ||
                item.conference ===
                  scoped.conference) &&
              (!positional ||
                item.position ===
                  scoped.position) &&
              (!isLow ||
                item.starts >=
                  MIN_LOW_SEASON_STARTS)
          );

          if (!history.length) continue;

          const holder = [...history].sort(
            (a, b) =>
              isLow
                ? a.points - b.points
                : b.points - a.points
          )[0];

          const record = holder.points;

          const qualifies = isLow
            ? scopedProjection <=
              record * (1 + TOLERANCE)
            : scopedProjection >=
              record * (1 - TOLERANCE);

          if (!qualifies) continue;

          const onPace = isLow
            ? scopedProjection <= record
            : scopedProjection >= record;

          const category = positional
            ? `${scoped.position} season`
            : "player season";

          const scope = scoped.scope;

          achievements.push({
            scope,
            rank: onPace ? 1 : 2,
            label:
              `${scopeName(scope)} ` +
              `${category} record: ` +
              `${record.toFixed(2)} pts`,
            record,
            holderSeason: holder.season,
            holderRosterId:
              holder.latestRosterId,
            priority:
              (scope === "SFL"
                ? 88
                : scope === "franchise"
                  ? 64
                  : 76) -
              (positional ? 4 : 0) -
              (onPace ? 0 : 18),
          });
        }
      }

      const primary = bestAchievement(
        achievements
      );

      if (!primary) continue;

      const primaryOnPace =
        primary.rank === 1;

      candidates.push({
        id:
          `${season}-${week}-player-season-` +
          `${player.playerId}-${direction}`,
        kind: "season",
        subject: "player",
        tone: isLow
          ? "negative"
          : "positive",
        label:
          `${scopeName(primary.scope)} ` +
          `${player.position} season record watch`,
        headline: primaryOnPace
          ? isLow
            ? "An infamous player season is brewing"
            : `A ${scopeName(primary.scope)} season record is under threat`
          : "Closing in on a historic player season",
        detail: achievementDetail(
          achievements
        ),
        value: player.points,
        unit: "points",
        rosterId: player.latestRosterId,
        playerId: player.playerId,
        week,
        season,
        allTimeRank: null,
        historicalRecord:
          primary.record,
        historicalSeason:
          primary.holderSeason,
        historicalRosterId:
          primary.holderRosterId,
        projectedValue: projection,
        priority:
          primary.priority -
          (isLow ? 5 : 0),
      });
    }
  }

  return candidates;
}

/*
 * Franchise season record chases.
 *
 * Compare every franchise against:
 * - All SFL franchises
 * - Its own conference
 * - Its own historical seasons
 *
 * Team scoring uses 14 weeks.
 */
function buildTeamSeasonHighlights(
  seasons: TeamSeason[],
  season: string,
  week: number
): RecordHighlight[] {
  if (week < MIN_TEAM_GAMES) {
    return [];
  }

  const historical = seasons.filter(
    (item) =>
      Number(item.season) <
        Number(season) &&
      item.games === WEEKS
  );

  const current = seasons.filter(
    (item) =>
      item.season === season &&
      item.games >= MIN_TEAM_GAMES
  );

  const categories: {
    id: string;
    title: string;
    direction: Direction;
    unit: "points" | "wins";
    value: (item: TeamSeason) => number;
  }[] = [
    {
      id: "points-high",
      title: "most season points",
      direction: "high",
      unit: "points",
      value: (item) => item.points,
    },
    {
      id: "points-low",
      title: "fewest season points",
      direction: "low",
      unit: "points",
      value: (item) => item.points,
    },
    {
      id: "wins-high",
      title: "most season wins",
      direction: "high",
      unit: "wins",
      value: (item) => item.wins,
    },
    {
      id: "wins-low",
      title: "fewest season wins",
      direction: "low",
      unit: "wins",
      value: (item) => item.wins,
    },
  ];

  const candidates: RecordHighlight[] = [];

  for (const team of current) {
    for (const category of categories) {
      const isLow =
        category.direction === "low";

      const isWins =
        category.unit === "wins";

      if (isWins) {
        const earlyStreak =
          team.games >= EARLY_STREAK &&
          (
            isLow
              ? team.wins === 0
              : team.wins === team.games
          );

        if (
          team.games < MIN_WIN_GAMES &&
          !earlyStreak
        ) {
          continue;
        }
      }

      const value =
        category.value(team);

      const projection =
        (value / team.games) * WEEKS;

      const achievements: Achievement[] = [];

      for (const scope of scopeList(
        team.conference
      )) {
        const history = historical.filter(
          (item) =>
            scopeMatches(
              item,
              scope,
              team.rosterId
            )
        );

        if (!history.length) continue;

        const holder = [...history].sort(
          (a, b) =>
            isLow
              ? category.value(a) -
                category.value(b)
              : category.value(b) -
                category.value(a)
        )[0];

        const record =
          category.value(holder);

        const qualifies = isWins
          ? isLow
            ? projection <= record
            : projection >= record
          : isLow
            ? projection <=
              record * (1 + TOLERANCE)
            : projection >=
              record * (1 - TOLERANCE);

        if (!qualifies) continue;

        const onPace = isLow
          ? projection <= record
          : projection >= record;

        achievements.push({
          scope,
          rank: onPace ? 1 : 2,
          label:
            `${scopeName(scope)} ` +
            `${category.title}: ` +
            `${round2(record)}`,
          record,
          holderSeason: holder.season,
          holderRosterId:
            holder.rosterId,
          priority:
            (scope === "SFL"
              ? 79
              : scope === "franchise"
                ? 59
                : 70) -
            (onPace ? 0 : 19) -
            (isWins ? 4 : 0),
        });
      }

      const primary = bestAchievement(
        achievements
      );

      if (!primary) continue;

      candidates.push({
        id:
          `${season}-${week}-team-season-` +
          `${team.rosterId}-${category.id}`,
        kind: "season",
        subject: "franchise",
        tone: isLow
          ? "negative"
          : "positive",
        label:
          `${scopeName(primary.scope)} ` +
          category.title,
        headline:
          primary.rank === 1
            ? `On pace for a ${scopeName(primary.scope)} season record`
            : "Closing in on a season record",
        detail: achievementDetail(
          achievements
        ),
        value: round2(value),
        unit: category.unit,
        rosterId: team.rosterId,
        playerId: null,
        week,
        season,
        allTimeRank: null,
        historicalRecord:
          primary.record,
        historicalSeason:
          primary.holderSeason,
        historicalRosterId:
          primary.holderRosterId,
        projectedValue:
          round2(projection),
        priority: primary.priority,
      });
    }
  }

  return candidates;
}

/*
 * Editorial selection.
 *
 * Only three stories at most.
 *
 * Prefer exceptional all-time records,
 * then conference records, then
 * franchise records.
 *
 * Avoid repeating the same player.
 *
 * Avoid filling slots with weak
 * achievements.
 */
function selectHighlights(
  candidates: RecordHighlight[]
): RecordHighlight[] {
  const sorted = [...candidates]
    .filter(
      (item) =>
        item.priority >= 50
    )
    .sort(
      (a, b) =>
        b.priority - a.priority ||
        a.id.localeCompare(b.id)
    );

  const selected: RecordHighlight[] = [];
  const subjects = new Set<string>();
  const labels = new Set<string>();

  function subjectKey(
    item: RecordHighlight
  ): string {
    return item.subject === "player"
      ? `player:${item.playerId}`
      : `team:${item.rosterId}`;
  }

  for (const item of sorted) {
    if (selected.length >= 3) break;

    const subject = subjectKey(item);

    if (
      subjects.has(subject) ||
      labels.has(item.label)
    ) {
      continue;
    }

    selected.push(item);
    subjects.add(subject);
    labels.add(item.label);
  }

  /*
   * A franchise can feature twice
   * only if another significant,
   * distinct achievement qualifies.
   */
  for (const item of sorted) {
    if (selected.length >= 3) break;

    if (
      selected.some(
        (existing) =>
          existing.id === item.id
      ) ||
      labels.has(item.label)
    ) {
      continue;
    }

    if (
      item.subject === "player" &&
      subjects.has(subjectKey(item))
    ) {
      continue;
    }

    selected.push(item);
    labels.add(item.label);
    subjects.add(subjectKey(item));
  }

  return selected;
}

function calculateRecordHighlights(
  historicalData: HistoricalSeason[],
  season: string,
  week: number,
  directory: Record<string, SleeperPlayer>
): RecordHighlight[] {
  if (week < 1) return [];

  const data = buildRecordData(
    historicalData,
    season,
    directory
  );

  return selectHighlights([
    ...buildTeamGameHighlights(
      data.teams,
      season,
      week
    ),
    ...buildPlayerGameHighlights(
      data.players,
      season,
      week
    ),
    ...buildTeamSeasonHighlights(
      data.teamSeasons,
      season,
      week
    ),
    ...buildPlayerSeasonHighlights(
      data.playerSeasons,
      season,
      week
    ),
  ]);
}

/*
 * Legacy recordWatch output.
 *
 * Kept for compatibility with
 * existing app components.
 */
function calculateRecordWatch(
  historicalData: HistoricalSeason[],
  currentGames: HomeGame[],
  season: string,
  latestWeek: number
): HomeRecordWatch[] {
  const historicalTotals: {
    season: string;
    rosterId: number;
    points: number;
  }[] = [];

  for (const historical of historicalData) {
    const year = historical.league.season;

    if (Number(year) >= Number(season)) {
      continue;
    }

    const totals = new Map<number, {
      points: number;
      games: number;
    }>();

    for (const game of historical.matchups) {
      if (!eligible(game, year)) continue;

      for (const side of [
        {
          rosterId: game.rosterA,
          points: game.scoreA,
        },
        {
          rosterId: game.rosterB,
          points: game.scoreB,
        },
      ]) {
        const total =
          totals.get(side.rosterId) ?? {
            points: 0,
            games: 0,
          };

        total.points += side.points;
        total.games++;

        totals.set(
          side.rosterId,
          total
        );
      }
    }

    for (const [rosterId, total] of totals) {
      if (total.games !== WEEKS) continue;

      historicalTotals.push({
        season: year,
        rosterId,
        points: round2(total.points),
      });
    }
  }

  historicalTotals.sort(
    (a, b) => b.points - a.points
  );

  const record = historicalTotals[0];

  const currentTotals = new Map<
    number,
    number
  >();

  for (const game of currentGames) {
    for (const side of [
      {
        rosterId: game.rosterA,
        points: game.scoreA,
      },
      {
        rosterId: game.rosterB,
        points: game.scoreB,
      },
    ]) {
      currentTotals.set(
        side.rosterId,
        (currentTotals.get(
          side.rosterId
        ) ?? 0) + side.points
      );
    }
  }

  const leader = [
    ...currentTotals.entries(),
  ].sort((a, b) => b[1] - a[1])[0];

  if (!record || !leader) return [];

  const challenger = round2(leader[1]);

  const projectedTotal =
    latestWeek > 0
      ? round2(
          (challenger / latestWeek) *
            WEEKS
        )
      : null;

  return [
    {
      category: "Single-season team scoring",
      record: record.points,
      recordSeason: record.season,
      recordRosterId: record.rosterId,
      challenger,
      challengerRosterId: leader[0],
      progressPercentage:
        record.points > 0
          ? Math.min(
              100,
              round2(
                (challenger /
                  record.points) *
                  100
              )
            )
          : 0,
      projectedTotal,
      onRecordPace:
        projectedTotal !== null &&
        projectedTotal > record.points,
    },
  ];
}

export function calculateHomeStats(
  historicalData: HistoricalSeason[],
  season: string = HOME_SEASON,
  playerDirectory: Record<
    string,
    SleeperPlayer
  > = {}
): HomeStats {
  const currentSeason =
    historicalData.find(
      (item) =>
        item.league.season === season
    );

  const completedGames = (
    currentSeason?.matchups ?? []
  )
    .filter(
      (game) => eligible(game, season)
    )
    .map(toHomeGame)
    .sort(
      (a, b) =>
        a.week - b.week ||
        a.rosterA - b.rosterA
    );

  const standings =
    calculateHomeStandings(
      completedGames
    );

  const seasonStats =
    calculateSeasonStats(
      completedGames,
      season
    );

  const conferences = {
    OBFC: standings.filter(
      (team) =>
        team.conference === "OBFC"
    ),
    GPFC: standings.filter(
      (team) =>
        team.conference === "GPFC"
    ),
  };

  const playoffContenders = standings
    .filter(
      (team) =>
        team.inPlayoffPosition
    )
    .map((team) => team.rosterId);

  return {
    season,
    seasonStats,
    standings,
    conferences,
    playoffContenders,
    completedGames,
    recordWatch: calculateRecordWatch(
      historicalData,
      completedGames,
      season,
      seasonStats.latestCompletedWeek
    ),
    recordHighlights:
      calculateRecordHighlights(
        historicalData,
        season,
        seasonStats.latestCompletedWeek,
        playerDirectory
      ),
  };
}

export function isHomePlayoffContender(
  rosterId: number,
  standings: HomeStanding[]
): boolean {
  return (
    standings.find(
      (team) =>
        team.rosterId === rosterId
    )?.inPlayoffPosition ?? false
  );
}
