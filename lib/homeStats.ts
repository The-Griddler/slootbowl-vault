
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
type Scope = "SFL" | Conference | "franchise";
type Direction = "high" | "low";

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
  projected?: number;
  actual?: number;
  category?: string;
};

type Candidate = RecordHighlight & {
  group: string;
  categoryKey: string;
};

const WEEKS = 14;
const PLAYER_TARGET_STARTS = 13;

// Temporary testing mode.
// Change this to 3 when selection is final.
const TEST_AWARD_LIMIT = 15;

const MAX_RANK = 10;
const MIN_PLAYER_STARTS = 4;
const MIN_LOW_SEASON_STARTS = 8;
const MIN_TEAM_GAMES = 4;
const MIN_WIN_GAMES = 7;
const TOLERANCE = 0.02;

const POSITIONS: Position[] = [
  "QB",
  "RB",
  "WR",
  "TE",
];

const SHORT_NAMES: Record<number, string> = {
  1: "Mt Isa",
  2: "Cambridge",
  3: "Grimsby",
  4: "Isle of Wight",
  5: "Grays Town",
  6: "Lincoln",
  7: "Kalamata",
  8: "Weybiza",
  9: "East Rutherford",
  10: "Chad",
};

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

function teamName(id: number): string {
  return SHORT_NAMES[id] ?? `Team ${id}`;
}

function scopeName(
  scope: Scope,
  rosterId: number
): string {
  return scope === "franchise"
    ? teamName(rosterId)
    : scope;
}

function scopeHistory(
  scope: Scope,
  rosterId: number
): string {
  return `${scopeName(scope, rosterId)} history`;
}

function round2(value: number): number {
  return (
    Math.round(
      (value + Number.EPSILON) * 100
    ) / 100
  );
}

function ordinal(n: number): string {
  const suffix =
    n % 100 >= 11 && n % 100 <= 13
      ? "th"
      : n % 10 === 1
        ? "st"
        : n % 10 === 2
          ? "nd"
          : n % 10 === 3
            ? "rd"
            : "th";

  return `${n}${suffix}`;
}

function rankText(
  rank: number,
  direction: Direction,
  description: string
): string {
  const adjective =
    direction === "high"
      ? "highest"
      : "lowest";

  return (
    `${rank === 1
      ? adjective
      : `${ordinal(rank)}-${adjective}`
    } ${description}`
  );
}

function positionOf(
  player: SleeperPlayer | undefined
): Position | null {
  if (
    player?.position &&
    POSITIONS.includes(
      player.position as Position
    )
  ) {
    return player.position as Position;
  }

  for (
    const position of
    player?.fantasy_positions ?? []
  ) {
    if (
      POSITIONS.includes(
        position as Position
      )
    ) {
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
    Number.isFinite(game.scoreA) &&
    Number.isFinite(game.scoreB) &&
    game.scoreA >= 0 &&
    game.scoreB >= 0
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

function scopes(
  conference: Conference
): Scope[] {
  return [
    "SFL",
    conference,
    "franchise",
  ];
}

function rankOf(
  value: number,
  values: number[],
  direction: Direction
): number {
  return (
    1 +
    values.filter((other) =>
      direction === "high"
        ? other > value
        : other < value
    ).length
  );
}

function scopePriority(
  scope: Scope,
  rank: number,
  positional = false
): number {
  const base =
    scope === "SFL"
      ? 130
      : scope === "franchise"
        ? 105
        : 116;

  const penalty =
    rank === 1
      ? 0
      : (rank - 1) * 13 + 9;

  return (
    base -
    penalty -
    (positional ? 5 : 0)
  );
}

function sortedAchievements(
  items: Achievement[]
): Achievement[] {
  return [...items].sort(
    (a, b) =>
      b.priority - a.priority ||
      a.rank - b.rank
  );
}

function primaryAchievement(
  items: Achievement[]
): Achievement | null {
  return sortedAchievements(items)[0] ?? null;
}

function achievementDetail(
  items: Achievement[]
): string {
  const sorted = sortedAchievements(items);

  if (!sorted.length) return "";

  const result = [sorted[0]];

  const second = sorted.find(
    (item) =>
      item !== sorted[0] &&
      item.scope !== sorted[0].scope &&
      item.label !== sorted[0].label
  );

  if (second) result.push(second);

  return result
    .map((item) => item.label)
    .join(" · ");
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
      Math.abs(
        game.scoreA - game.scoreB
      )
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
        const pctA = a.gamesPlayed
          ? (a.wins + a.ties * 0.5) /
            a.gamesPlayed
          : 0;

        const pctB = b.gamesPlayed
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
        winPercentage: team.gamesPlayed
          ? (
              team.wins +
              team.ties * 0.5
            ) / team.gamesPlayed
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

    totalPoints +=
      game.scoreA + game.scoreB;

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
        side.points >
          highestTeamScore.points
      ) {
        highestTeamScore = {
          ...side,
          week: game.week,
        };
      }
    }
  }

  return {
    season,
    completedWeeks: weeks.size,
    latestCompletedWeek:
      weeks.size > 0
        ? Math.max(...weeks)
        : 0,
    gamesPlayed: games.length,
    totalPoints: round2(totalPoints),
    averageTeamScore: games.length
      ? round2(
          totalPoints /
            (games.length * 2)
        )
      : 0,
    highestTeamScore,
    closestGame:
      [...games].sort(
        (a, b) =>
          a.margin - b.margin ||
          b.combinedScore -
            a.combinedScore
      )[0] ?? null,
    biggestBlowout:
      [...games].sort(
        (a, b) =>
          b.margin - a.margin ||
          b.combinedScore -
            a.combinedScore
      )[0] ?? null,
    highestScoringGame:
      [...games].sort(
        (a, b) =>
          b.combinedScore -
          a.combinedScore
      )[0] ?? null,
  };
}

/*
 * Build regular-season records.
 *
 * Only starters count.
 *
 * Player SFL totals follow the player
 * across trades.
 *
 * Conference and franchise totals
 * count only starts in that scope.
 */
function buildRecordData(
  historicalData: HistoricalSeason[],
  currentSeason: string,
  directory: Record<
    string,
    SleeperPlayer
  >
): RecordData {
  const teams: TeamPerformance[] = [];
  const players: PlayerPerformance[] = [];
  const teamSeasons: TeamSeason[] = [];
  const playerSeasons: PlayerSeason[] = [];

  for (const historical of historicalData) {
    const season =
      historical.league.season;

    if (
      Number(season) >
      Number(currentSeason)
    ) {
      continue;
    }

    const games = historical.matchups
      .filter(
        (game) => eligible(game, season)
      )
      .sort(
        (a, b) => a.week - b.week
      );

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
          starterPoints:
            game.startersPointsA,
        },
        {
          rosterId: game.rosterB,
          points: game.scoreB,
          opponentPoints: game.scoreA,
          starters: game.startersB,
          starterPoints:
            game.startersPointsB,
        },
      ];

      for (const side of sides) {
        const conference =
          ROSTER_CONFERENCE.get(
            side.rosterId
          );

        if (!conference) continue;

        const margin = round2(
          side.points -
            side.opponentPoints
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

        const total =
          teamTotals.get(
            side.rosterId
          ) ?? {
            season,
            rosterId: side.rosterId,
            conference,
            points: 0,
            wins: 0,
            losses: 0,
            games: 0,
          };

        total.points += side.points;
        total.games++;

        if (margin > 0) total.wins++;
        if (margin < 0) total.losses++;

        teamTotals.set(
          side.rosterId,
          total
        );

        (side.starters ?? []).forEach(
          (playerId, index) => {
            const points =
              side.starterPoints?.[
                index
              ];

            if (
              !playerId ||
              playerId === "0" ||
              !Number.isFinite(points)
            ) {
              return;
            }

            const position = positionOf(
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

            const entries: {
              key: string;
              scope: Scope;
              rosterId: number | null;
              conference:
                Conference | null;
            }[] = [
              {
                key: `${playerId}:SFL`,
                scope: "SFL",
                rosterId: null,
                conference: null,
              },
              {
                key:
                  `${playerId}:` +
                  conference,
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

            for (const entry of entries) {
              const playerTotal =
                playerTotals.get(
                  entry.key
                ) ?? {
                  season,
                  playerId,
                  position,
                  scope: entry.scope,
                  rosterId:
                    entry.rosterId,
                  conference:
                    entry.conference,
                  points: 0,
                  starts: 0,
                  latestRosterId:
                    side.rosterId,
                };

              playerTotal.points +=
                points;

              playerTotal.starts++;

              playerTotal.latestRosterId =
                side.rosterId;

              playerTotals.set(
                entry.key,
                playerTotal
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

function buildTeamGameHighlights(
  performances: TeamPerformance[],
  season: string,
  week: number
): Candidate[] {
  const categories: {
    id: string;
    description: string;
    direction: Direction;
    tone: RecordHighlight["tone"];
    eligible: (
      p: TeamPerformance
    ) => boolean;
    value: (
      p: TeamPerformance
    ) => number;
    headline: (
      name: string,
      rank: number
    ) => string;
  }[] = [
    {
      id: "score-high",
      description: "team score",
      direction: "high",
      tone: "positive",
      eligible: () => true,
      value: (p) => p.points,
      headline: (name, rank) =>
        rank === 1
          ? `${name} posts a record weekly score`
          : `${name} posts its ${ordinal(rank)}-highest weekly score`,
    },
    {
      id: "score-low",
      description: "team score",
      direction: "low",
      tone: "negative",
      eligible: () => true,
      value: (p) => p.points,
      headline: (name, rank) =>
        rank === 1
          ? `${name} posts a record-low weekly score`
          : `${name} posts its ${ordinal(rank)}-lowest weekly score`,
    },
    {
      id: "winning-margin",
      description: "winning margin",
      direction: "high",
      tone: "positive",
      eligible: (p) => p.won,
      value: (p) => p.margin,
      headline: (name, rank) =>
        rank === 1
          ? `${name} records its biggest win`
          : `${name} records its ${ordinal(rank)}-biggest win`,
    },
    {
      id: "losing-score",
      description: "score in a loss",
      direction: "high",
      tone: "unusual",
      eligible: (p) => p.lost,
      value: (p) => p.points,
      headline: (name, rank) =>
        rank === 1
          ? `${name} sets a record for points in a loss`
          : `${name} posts its ${ordinal(rank)}-highest score in a loss`,
    },
    {
      id: "winning-score-low",
      description: "score in a win",
      direction: "low",
      tone: "unusual",
      eligible: (p) => p.won,
      value: (p) => p.points,
      headline: (name, rank) =>
        rank === 1
          ? `${name} records its lowest-scoring win`
          : `${name} records its ${ordinal(rank)}-lowest scoring win`,
    },
  ];

  const candidates: Candidate[] = [];

  const weekly = performances.filter(
    (p) =>
      p.season === season &&
      p.week === week
  );

  for (const performance of weekly) {
    for (const category of categories) {
      if (!category.eligible(performance)) {
        continue;
      }

      const value =
        category.value(performance);

      const achievements: Achievement[] = [];

      for (const scope of scopes(
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

        const values =
          history.map(category.value);

        const rank = rankOf(
          value,
          values,
          category.direction
        );

        const limit =
          scope === "franchise"
            ? 3
            : MAX_RANK;

        if (rank > limit) continue;

        if (
          scope === "franchise" &&
          rank === 3 &&
          category.id !== "losing-score"
        ) {
          continue;
        }

        const record =
          category.direction === "high"
            ? Math.max(...values)
            : Math.min(...values);

        achievements.push({
          scope,
          rank,
          label:
            `${rankText(
              rank,
              category.direction,
              category.description
            )} in ` +
            scopeHistory(
              scope,
              performance.rosterId
            ),
          record,
          holderSeason: null,
          holderRosterId: null,
          priority: scopePriority(
            scope,
            rank
          ),
        });
      }

      const primary =
        primaryAchievement(achievements);

      if (!primary) continue;

      const name = teamName(
        performance.rosterId
      );

      const headline =
        primary.scope === "SFL" &&
        category.id === "losing-score"
          ? `${name}: ${rankText(
              primary.rank,
              "high",
              "losing score"
            )} in SFL history`
          : category.headline(
              name,
              primary.rank
            );

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
            ? "Franchise history"
            : `${primary.scope} history`,
        headline,
        detail:
          achievementDetail(achievements),
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
          (category.id === "losing-score"
            ? 6
            : 0) -
          (category.id === "score-low"
            ? 7
            : 0) -
          (category.id ===
          "winning-score-low"
            ? 11
            : 0),
        group:
          `team:${performance.rosterId}`,
        categoryKey: category.id,
      });
    }
  }

  return candidates;
}

function buildPlayerGameHighlights(
  performances: PlayerPerformance[],
  season: string,
  week: number
): Candidate[] {
  const candidates: Candidate[] = [];

  const weekly = performances.filter(
    (p) =>
      p.season === season &&
      p.week === week
  );

  for (const performance of weekly) {
    for (const direction of [
      "high",
      "low",
    ] as const) {
      const isLow =
        direction === "low";

      // A zero-point WR/RB/TE game
      // is not automatically notable.
      if (
        isLow &&
        performance.points >= 0
      ) {
        continue;
      }

      const achievements: Achievement[] = [];

      for (const scope of scopes(
        performance.conference
      )) {
        for (const positional of [
          false,
          true,
        ]) {
          const history =
            performances.filter(
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
              ? 2
              : MAX_RANK;

          if (rank > limit) continue;

          const record = isLow
            ? Math.min(...values)
            : Math.max(...values);

          achievements.push({
            scope,
            rank,
            label:
              `${rankText(
                rank,
                direction,
                positional
                  ? `${performance.position} score`
                  : "individual score"
              )} in ` +
              scopeHistory(
                scope,
                performance.rosterId
              ),
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

      const primary =
        primaryAchievement(achievements);

      if (!primary) continue;

      const scope = scopeName(
        primary.scope,
        performance.rosterId
      );

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
          primary.scope === "franchise"
            ? "Franchise history"
            : `${scope} history`,
        headline:
          primary.rank === 1
            ? `${performance.position} scoring record in ${scope} history`
            : `${rankText(
                primary.rank,
                direction,
                `${performance.position} performance`
              )} in ${scope} history`,
        detail:
          achievementDetail(achievements),
        value: performance.points,
        unit: "points",
        rosterId:
          performance.rosterId,
        playerId:
          performance.playerId,
        week,
        season,
        allTimeRank: primary.rank,
        historicalRecord:
          primary.record,
        historicalSeason: null,
        historicalRosterId: null,
        projectedValue: null,
        priority:
          primary.priority -
          (isLow ? 13 : 0),
        group:
          `player:${performance.playerId}`,
        categoryKey: isLow
          ? "player-low"
          : "player-high",
      });
    }
  }

  return candidates;
}

function projectedPlayerPoints(
  item: PlayerSeason,
  currentWeek: number
): number {
  const remaining = Math.max(
    0,
    WEEKS - currentWeek
  );

  const possibleStarts = Math.min(
    PLAYER_TARGET_STARTS,
    item.starts + remaining
  );

  return item.starts > 0
    ? round2(
        (item.points / item.starts) *
          possibleStarts
      )
    : 0;
}

function buildPlayerSeasonHighlights(
  seasons: PlayerSeason[],
  season: string,
  week: number
): Candidate[] {
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

  const candidates: Candidate[] = [];

  const overallPlayers = current.filter(
    (item) =>
      item.scope === "SFL"
  );

  for (const player of overallPlayers) {
    for (const direction of [
      "high",
      "low",
    ] as const) {
      const isLow =
        direction === "low";

      if (
        isLow &&
        player.starts <
          MIN_LOW_SEASON_STARTS
      ) {
        continue;
      }

      const achievements: Achievement[] = [];

      const playerScopes = current.filter(
        (item) =>
          item.playerId ===
          player.playerId
      );

      for (const scoped of playerScopes) {
        if (
          isLow &&
          scoped.starts <
            MIN_LOW_SEASON_STARTS
        ) {
          continue;
        }

        const projected =
          projectedPlayerPoints(
            scoped,
            week
          );

        for (const positional of [
          false,
          true,
        ]) {
          const history =
            historical.filter(
              (item) =>
                item.scope ===
                  scoped.scope &&
                (
                  scoped.scope !==
                    "franchise" ||
                  item.rosterId ===
                    scoped.rosterId
                ) &&
                (
                  scoped.scope === "SFL" ||
                  scoped.scope === "franchise" ||
                  item.conference ===
                    scoped.conference
                ) &&
                (
                  !positional ||
                  item.position ===
                    scoped.position
                ) &&
                (
                  !isLow ||
                  item.starts >=
                    MIN_LOW_SEASON_STARTS
                )
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
            ? projected <=
              record * (1 + TOLERANCE)
            : projected >=
              record * (1 - TOLERANCE);

          if (!qualifies) continue;

          const onPace = isLow
            ? projected <= record
            : projected >= record;

          const scope = scoped.scope;

          const name = scopeName(
            scope,
            scoped.rosterId ??
              scoped.latestRosterId
          );

          const category = positional
            ? `${scoped.position} season`
            : "overall season";

          achievements.push({
            scope,
            rank: onPace ? 1 : 2,
            label:
              `Chasing ${name} ` +
              `${positional
                ? `${scoped.position} `
                : ""}` +
              `season scoring record: ` +
              `${record.toFixed(2)} pts`,
            record,
            holderSeason:
              holder.season,
            holderRosterId:
              holder.latestRosterId,
            projected,
            actual: scoped.points,
            category,
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

      const primary =
        primaryAchievement(achievements);

      if (!primary) continue;

      const scope = scopeName(
        primary.scope,
        player.latestRosterId
      );

      const position =
        primary.category ===
        `${player.position} season`
          ? `${player.position} `
          : "";

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
          primary.scope === "franchise"
            ? "Franchise record chase"
            : `${scope} record chase`,
        headline:
          `${scope} ${position}` +
          "season scoring record chase",
        detail:
          achievementDetail(achievements),
        value: round2(
          primary.actual ??
            player.points
        ),
        unit: "points",
        rosterId:
          player.latestRosterId,
        playerId:
          player.playerId,
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
          primary.projected ?? null,
        priority:
          primary.priority -
          (isLow ? 12 : 0),
        group:
          `player:${player.playerId}`,
        categoryKey:
          `player-season-${direction}`,
      });
    }
  }

  return candidates;
}

function buildTeamSeasonHighlights(
  seasons: TeamSeason[],
  season: string,
  week: number
): Candidate[] {
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
    value: (
      item: TeamSeason
    ) => number;
  }[] = [
    {
      id: "points-high",
      title: "season points",
      direction: "high",
      unit: "points",
      value: (item) => item.points,
    },
    {
      id: "points-low",
      title: "season points",
      direction: "low",
      unit: "points",
      value: (item) => item.points,
    },
    {
      id: "wins-high",
      title: "season wins",
      direction: "high",
      unit: "wins",
      value: (item) => item.wins,
    },
    {
      id: "wins-low",
      title: "season wins",
      direction: "low",
      unit: "wins",
      value: (item) => item.wins,
    },
  ];

  const candidates: Candidate[] = [];

  for (const team of current) {
    for (const category of categories) {
      const isLow =
        category.direction === "low";

      const isWins =
        category.unit === "wins";

      if (isWins) {
        const earlyStreak =
          team.games >= 6 &&
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
        (value / team.games) *
        WEEKS;

      const achievements: Achievement[] = [];

      for (const scope of scopes(
        team.conference
      )) {
        const history =
          historical.filter(
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
            `Chasing ${scopeName(
              scope,
              team.rosterId
            )} ${category.title} ` +
            `record: ${round2(record)}` +
            (isWins ? " wins" : " pts"),
          record,
          holderSeason:
            holder.season,
          holderRosterId:
            holder.rosterId,
          projected:
            round2(projection),
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

      const primary =
        primaryAchievement(achievements);

      if (!primary) continue;

      const scope = scopeName(
        primary.scope,
        team.rosterId
      );

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
          primary.scope === "franchise"
            ? "Franchise record chase"
            : `${scope} record chase`,
        headline:
          `${teamName(team.rosterId)}: ` +
          `${scope} ${category.title} ` +
          "record chase",
        detail:
          achievementDetail(achievements),
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
        priority:
          primary.priority,
        group:
          `team:${team.rosterId}`,
        categoryKey:
          `team-season-${category.id}`,
      });
    }
  }

  return candidates;
}

/*
 * First pass: different subjects and
 * a variety of record categories.
 *
 * Second pass: fill remaining testing
 * slots without repeating players.
 *
 * The same engine can later return
 * only three awards by changing
 * TEST_AWARD_LIMIT.
 */
function selectHighlights(
  candidates: Candidate[]
): RecordHighlight[] {
  const sorted = [...candidates]
    .filter(
      (item) => item.priority >= 50
    )
    .sort(
      (a, b) =>
        b.priority - a.priority ||
        a.id.localeCompare(b.id)
    );

  const selected: Candidate[] = [];

  const subjects = new Set<string>();

  const categories = new Map<
    string,
    number
  >();

  for (const item of sorted) {
    if (
      selected.length >=
      TEST_AWARD_LIMIT
    ) {
      break;
    }

    if (
      subjects.has(item.group) ||
      (
        categories.get(
          item.categoryKey
        ) ?? 0
      ) >= 2
    ) {
      continue;
    }

    selected.push(item);
    subjects.add(item.group);

    categories.set(
      item.categoryKey,
      (
        categories.get(
          item.categoryKey
        ) ?? 0
      ) + 1
    );
  }

  for (const item of sorted) {
    if (
      selected.length >=
      TEST_AWARD_LIMIT
    ) {
      break;
    }

    if (
      selected.some(
        (existing) =>
          existing.id === item.id
      )
    ) {
      continue;
    }

    if (
      item.subject === "player" &&
      subjects.has(item.group)
    ) {
      continue;
    }

    if (
      (
        categories.get(
          item.categoryKey
        ) ?? 0
      ) >= 4
    ) {
      continue;
    }

    if (
      selected.filter(
        (existing) =>
          existing.group ===
          item.group
      ).length >= 2
    ) {
      continue;
    }

    selected.push(item);
    subjects.add(item.group);

    categories.set(
      item.categoryKey,
      (
        categories.get(
          item.categoryKey
        ) ?? 0
      ) + 1
    );
  }

  return selected;
}

function calculateRecordHighlights(
  historicalData: HistoricalSeason[],
  season: string,
  week: number,
  directory: Record<
    string,
    SleeperPlayer
  >
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
 * Legacy record watch output.
 * Retained for compatibility.
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
    const year =
      historical.league.season;

    if (
      Number(year) >=
      Number(season)
    ) {
      continue;
    }

    const totals = new Map<
      number,
      {
        points: number;
        games: number;
      }
    >();

    for (const game of historical.matchups) {
      if (!eligible(game, year)) {
        continue;
      }

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
          totals.get(
            side.rosterId
          ) ?? {
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

    for (
      const [rosterId, total]
      of totals
    ) {
      if (
        total.games !== WEEKS
      ) {
        continue;
      }

      historicalTotals.push({
        season: year,
        rosterId,
        points: round2(
          total.points
        ),
      });
    }
  }

  historicalTotals.sort(
    (a, b) =>
      b.points - a.points
  );

  const record =
    historicalTotals[0];

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
        (
          currentTotals.get(
            side.rosterId
          ) ?? 0
        ) + side.points
      );
    }
  }

  const leader = [
    ...currentTotals.entries(),
  ].sort(
    (a, b) => b[1] - a[1]
  )[0];

  if (!record || !leader) {
    return [];
  }

  const challenger =
    round2(leader[1]);

  const projectedTotal =
    latestWeek > 0
      ? round2(
          (
            challenger /
            latestWeek
          ) * WEEKS
        )
      : null;

  return [
    {
      category:
        "Single-season team scoring",
      record: record.points,
      recordSeason:
        record.season,
      recordRosterId:
        record.rosterId,
      challenger,
      challengerRosterId:
        leader[0],
      progressPercentage:
        record.points > 0
          ? Math.min(
              100,
              round2(
                (
                  challenger /
                  record.points
                ) * 100
              )
            )
          : 0,
      projectedTotal,
      onRecordPace:
        projectedTotal !== null &&
        projectedTotal >
          record.points,
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

  const playoffContenders =
    standings
      .filter(
        (team) =>
          team.inPlayoffPosition
      )
      .map(
        (team) => team.rosterId
      );

  return {
    season,
    seasonStats,
    standings,
    conferences,
    playoffContenders,
    completedGames,
    recordWatch:
      calculateRecordWatch(
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
