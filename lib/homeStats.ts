
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

// Temporary testing limit. Return to 3 later.
export const RECORD_WATCH_LIMIT = 15;

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
  text: string;
  priority: number;
  record: number;
  previousRecord: number | null;
  holderSeason: string | null;
  holderRosterId: number | null;
  isNew: boolean;
  positional: boolean;
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
  "QB", "RB", "WR", "TE",
];

const TEAM_NAMES: Record<number, string> = {
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

function round2(value: number): number {
  return Math.round(
    (value + Number.EPSILON) * 100
  ) / 100;
}

function teamName(rosterId: number): string {
  return TEAM_NAMES[rosterId] ??
    `Franchise ${rosterId}`;
}

function playerName(
  playerId: string,
  directory: Record<string, SleeperPlayer>
): string {
  const player = directory[playerId];

  return (
    player?.full_name ||
    [
      player?.first_name,
      player?.last_name,
    ].filter(Boolean).join(" ") ||
    `Player ${playerId}`
  );
}

function getPosition(
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

  for (const position of
    player?.fantasy_positions ?? []) {
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
    game.isComplete === true &&
    game.week >= 1 &&
    game.week <= WEEKS &&
    game.rosterA !== game.rosterB &&
    Number.isFinite(game.scoreA) &&
    Number.isFinite(game.scoreB) &&
    game.scoreA >= 0 &&
    game.scoreB >= 0
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
    Omit<
      HomeStanding,
      "rank" |
      "winPercentage" |
      "inPlayoffPosition"
    >
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
  let totalPoints = 0;

  let highestTeamScore:
    HomeSeasonStats["highestTeamScore"] = null;

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

  return {
    season,
    completedWeeks: weeks.size,
    latestCompletedWeek:
      weeks.size ? Math.max(...weeks) : 0,
    gamesPlayed: games.length,
    totalPoints: round2(totalPoints),
    averageTeamScore: games.length
      ? round2(
          totalPoints / (games.length * 2)
        )
      : 0,
    highestTeamScore,
    closestGame:
      [...games].sort(
        (a, b) =>
          a.margin - b.margin ||
          b.combinedScore - a.combinedScore
      )[0] ?? null,
    biggestBlowout:
      [...games].sort(
        (a, b) =>
          b.margin - a.margin ||
          b.combinedScore - a.combinedScore
      )[0] ?? null,
    highestScoringGame:
      [...games].sort(
        (a, b) =>
          b.combinedScore - a.combinedScore
      )[0] ?? null,
  };
}

/*
 * All player statistics come from
 * starters, never bench players.
 *
 * Overall season totals follow players
 * across trades.
 *
 * Conference and franchise season totals
 * count only starts at that level.
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
              !Number.isFinite(points)
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

            for (const entry of scopes) {
              const total =
                playerTotals.get(
                  entry.key
                ) ?? {
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

function ordinal(rank: number): string {
  const suffix =
    rank % 100 >= 11 &&
    rank % 100 <= 13
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

function rankingPhrase(
  rank: number,
  direction: Direction,
  noun: string
): string {
  const adjective =
    direction === "high"
      ? "highest"
      : "lowest";

  return rank === 1
    ? `${adjective} ${noun}`
    : `${ordinal(rank)}-${adjective} ${noun}`;
}

function rankOf(
  value: number,
  values: number[],
  direction: Direction
): number {
  return (
    values.filter(
      (other) =>
        direction === "high"
          ? other > value
          : other < value
    ).length + 1
  );
}

function recordValue(
  values: number[],
  direction: Direction
): number {
  return direction === "high"
    ? Math.max(...values)
    : Math.min(...values);
}

function isBetter(
  value: number,
  previous: number,
  direction: Direction
): boolean {
  return direction === "high"
    ? value > previous
    : value < previous;
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

function scopesFor(
  conference: Conference
): Scope[] {
  return [
    "SFL",
    conference,
    "franchise",
  ];
}

function scopeDescription(
  scope: Scope,
  rosterId: number
): string {
  return scope === "franchise"
    ? teamName(rosterId)
    : scope;
}

function scopeCategory(
  scope: Scope
): string {
  if (scope === "SFL") {
    return "SFL HISTORY";
  }

  if (scope === "franchise") {
    return "FRANCHISE HISTORY";
  }

  return `${scope} HISTORY`;
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

  return (
    base -
    (rank === 1
      ? 0
      : (rank - 1) * 13 + 9) -
    (positional ? 5 : 0)
  );
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

/*
 * The second achievement must add
 * something meaningful:
 *
 * - A different scope
 * - A genuine record or top-three mark
 * - Not a near-duplicate of the first
 *
 * Maximum two achievements per story.
 */
function achievementDetail(
  achievements: Achievement[]
): string {
  const sorted = [...achievements].sort(
    (a, b) =>
      b.priority - a.priority ||
      a.rank - b.rank
  );

  const primary = sorted[0];
  if (!primary) return "";

  const secondary = sorted.find(
    (item) =>
      item !== primary &&
      item.scope !== primary.scope &&
      item.rank <= 3 &&
      item.text !== primary.text
  );

  return [
    primary.text,
    ...(secondary ? [secondary.text] : []),
  ].join(" · ");
}

function previousGameRecord<T extends {
  season: string;
  week: number;
}>(
  history: T[],
  performance: T,
  direction: Direction,
  getValue: (item: T) => number
): number | null {
  const previous = history.filter(
    (item) =>
      Number(item.season) <
        Number(performance.season) ||
      (
        item.season === performance.season &&
        item.week < performance.week
      )
  );

  return previous.length
    ? recordValue(
        previous.map(getValue),
        direction
      )
    : null;
}

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
    noun: string;
    direction: Direction;
    tone: RecordHighlight["tone"];
    eligible: (
      item: TeamPerformance
    ) => boolean;
    value: (
      item: TeamPerformance
    ) => number;
  }[] = [
    {
      id: "score-high",
      noun: "weekly score",
      direction: "high",
      tone: "positive",
      eligible: () => true,
      value: (p) => p.points,
    },
    {
      id: "score-low",
      noun: "weekly score",
      direction: "low",
      tone: "negative",
      eligible: () => true,
      value: (p) => p.points,
    },
    {
      id: "winning-margin",
      noun: "winning margin",
      direction: "high",
      tone: "positive",
      eligible: (p) => p.won,
      value: (p) => p.margin,
    },
    {
      id: "losing-score",
      noun: "losing score",
      direction: "high",
      tone: "unusual",
      eligible: (p) => p.lost,
      value: (p) => p.points,
    },
    {
      id: "winning-score-low",
      noun: "winning score",
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

      const value =
        category.value(performance);

      const achievements: Achievement[] = [];

      for (const scope of scopesFor(
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

        if (
          rank >
          (scope === "franchise"
            ? 3
            : MAX_RANK)
        ) {
          continue;
        }

        const previous = previousGameRecord(
          history,
          performance,
          category.direction,
          category.value
        );

        const isNew =
          previous !== null &&
          isBetter(
            value,
            previous,
            category.direction
          );

        const description =
          scopeDescription(
            scope,
            performance.rosterId
          );

        achievements.push({
          scope,
          rank,
          text:
            `${rankingPhrase(
              rank,
              category.direction,
              category.noun
            )} in ${description} history`,
          record: recordValue(
            history.map(category.value),
            category.direction
          ),
          previousRecord: previous,
          holderSeason: null,
          holderRosterId: null,
          priority: scopePriority(
            scope,
            rank,
            false
          ),
          isNew,
          positional: false,
        });
      }

      const primary =
        bestAchievement(achievements);

      if (!primary) continue;

      const name = teamName(
        performance.rosterId
      );

      let headline: string;

      if (category.id === "losing-score") {
        headline = primary.rank === 1
          ? `${name} sets an unwanted scoring record`
          : `${name} suffers a historic high-scoring defeat`;
      } else if (
        category.id === "winning-score-low"
      ) {
        headline =
          `${name} wins despite a historically low score`;
      } else if (
        category.id === "winning-margin"
      ) {
        headline = primary.rank === 1
          ? `${name} delivers a record-breaking victory`
          : `${name} delivers one of the biggest wins in history`;
      } else if (
        category.id === "score-low"
      ) {
        headline =
          `${name} endures a historically poor scoring week`;
      } else {
        headline = primary.isNew
          ? `${name} sets a new scoring record`
          : `${name} delivers a historic scoring performance`;
      }

      candidates.push({
        id:
          `${season}-${week}-team-` +
          `${performance.rosterId}-` +
          category.id,
        kind: "game",
        subject: "franchise",
        tone: category.tone,
        label: scopeCategory(
          primary.scope
        ),
        headline,
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

function buildPlayerGameHighlights(
  performances: PlayerPerformance[],
  season: string,
  week: number,
  directory: Record<string, SleeperPlayer>
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

      for (const scope of scopesFor(
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

          if (
            rank >
            (scope === "franchise"
              ? 3
              : MAX_RANK)
          ) {
            continue;
          }

          const previous =
            previousGameRecord(
              history,
              performance,
              direction,
              (item) => item.points
            );

          const isNew =
            previous !== null &&
            isBetter(
              performance.points,
              previous,
              direction
            );

          const noun = positional
            ? `${performance.position} score`
            : "individual score";

          achievements.push({
            scope,
            rank,
            text:
              `${rankingPhrase(
                rank,
                direction,
                noun
              )} in ` +
              `${scopeDescription(
                scope,
                performance.rosterId
              )} history`,
            record: recordValue(
              values,
              direction
            ),
            previousRecord: previous,
            holderSeason: null,
            holderRosterId: null,
            priority: scopePriority(
              scope,
              rank,
              positional
            ),
            isNew,
            positional,
          });
        }
      }

      const primary =
        bestAchievement(achievements);

      if (!primary) continue;

      const name = playerName(
        performance.playerId,
        directory
      );

      const location = scopeDescription(
        primary.scope,
        performance.rosterId
      );

      let headline: string;

      if (isLow) {
        headline = primary.isNew
          ? `${name} sets an unwanted scoring record`
          : `${name} records a historically low score`;
      } else if (
        primary.isNew &&
        primary.positional
      ) {
        headline =
          `${name} sets ${location} ` +
          `${performance.position} scoring record`;
      } else if (primary.isNew) {
        headline =
          `${name} sets a new ` +
          `${location} scoring record`;
      } else if (primary.rank === 1) {
        headline =
          `${name} delivers a record-equalling performance`;
      } else {
        headline =
          `${name} produces a historic ` +
          `${performance.position} performance`;
      }

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
        label: scopeCategory(
          primary.scope
        ),
        headline,
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
          primary.priority -
          (isLow ? 4 : 0),
      });
    }
  }

  return candidates;
}

function projectedPlayerPoints(
  item: PlayerSeason,
  week: number
): number {
  const remainingWeeks = Math.max(
    0,
    WEEKS - week
  );

  const projectedStarts = Math.min(
    PLAYER_TARGET_STARTS,
    item.starts + remainingWeeks
  );

  return round2(
    (item.points / item.starts) *
      projectedStarts
  );
}

function buildPlayerSeasonHighlights(
  seasons: PlayerSeason[],
  season: string,
  week: number,
  directory: Record<string, SleeperPlayer>
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
    if (player.scope !== "SFL") {
      continue;
    }

    const samePlayerScopes =
      current.filter(
        (item) =>
          item.playerId ===
          player.playerId
      );

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

      const achievements: Achievement[] = [];

      for (const scoped of samePlayerScopes) {
        if (
          isLow &&
          scoped.starts <
            MIN_LOW_SEASON_STARTS
        ) {
          continue;
        }

        const projection =
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
                  scoped.scope ===
                    "franchise" ||
                  item.conference ===
                    scoped.conference
                ) &&
                (!positional ||
                  item.position ===
                    scoped.position) &&
                (!isLow ||
                  item.starts >=
                    MIN_LOW_SEASON_STARTS)
            );

          if (!history.length) continue;

          const holder = [...history]
            .sort(
              (a, b) =>
                isLow
                  ? a.points - b.points
                  : b.points - a.points
            )[0];

          const record = holder.points;

          const qualifies = isLow
            ? projection <=
              record * (1 + TOLERANCE)
            : projection >=
              record * (1 - TOLERANCE);

          if (!qualifies) continue;

          const onPace = isLow
            ? projection <= record
            : projection >= record;

          const location =
            scopeDescription(
              scoped.scope,
              scoped.rosterId ??
                scoped.latestRosterId
            );

          achievements.push({
            scope: scoped.scope,
            rank: onPace ? 1 : 2,
            text:
              `Chasing ${location}'s ` +
              `${positional
                ? `${scoped.position} `
                : ""}` +
              `season record of ` +
              `${record.toFixed(2)} pts`,
            priority:
              (scoped.scope === "SFL"
                ? 88
                : scoped.scope ===
                    "franchise"
                  ? 64
                  : 76) -
              (positional ? 4 : 0) -
              (onPace ? 0 : 18),
            record,
            previousRecord: record,
            holderSeason: holder.season,
            holderRosterId:
              holder.latestRosterId,
            isNew: false,
            positional,
          });
        }
      }

      const primary =
        bestAchievement(achievements);

      if (!primary) continue;

      const name = playerName(
        player.playerId,
        directory
      );

      const location =
        scopeDescription(
          primary.scope,
          player.latestRosterId
        );

      candidates.push({
        id:
          `${season}-${week}-player-season-` +
          `${player.playerId}-${direction}`,
        kind: "season",
        subject: "player",
        tone: isLow
          ? "negative"
          : "positive",
        label: scopeCategory(
          primary.scope
        ),
        headline: isLow
          ? `${name} is on pace for an unwanted season record`
          : primary.rank === 1
            ? `${name} threatens the ${location} season scoring record`
            : `${name} is closing in on a historic season`,
        detail: achievementDetail(
          achievements
        ),
        value: player.points,
        unit: "points",
        rosterId:
          player.latestRosterId,
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
        projectedValue:
          projectedPlayerPoints(
            player,
            week
          ),
        priority:
          primary.priority -
          (isLow ? 5 : 0),
      });
    }
  }

  return candidates;
}

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
    noun: string;
    direction: Direction;
    unit: "points" | "wins";
    value: (
      item: TeamSeason
    ) => number;
  }[] = [
    {
      id: "points-high",
      noun: "season points",
      direction: "high",
      unit: "points",
      value: (p) => p.points,
    },
    {
      id: "points-low",
      noun: "season points",
      direction: "low",
      unit: "points",
      value: (p) => p.points,
    },
    {
      id: "wins-high",
      noun: "season wins",
      direction: "high",
      unit: "wins",
      value: (p) => p.wins,
    },
    {
      id: "wins-low",
      noun: "season wins",
      direction: "low",
      unit: "wins",
      value: (p) => p.wins,
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

      for (const scope of scopesFor(
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

        const location =
          scopeDescription(
            scope,
            team.rosterId
          );

        achievements.push({
          scope,
          rank: onPace ? 1 : 2,
          text:
            `Chasing ${location}'s ` +
            `${category.noun} record of ` +
            `${round2(record)}`,
          record,
          previousRecord: record,
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
          isNew: false,
          positional: false,
        });
      }

      const primary =
        bestAchievement(achievements);

      if (!primary) continue;

      const name = teamName(
        team.rosterId
      );

      candidates.push({
        id:
          `${season}-${week}-team-season-` +
          `${team.rosterId}-` +
          category.id,
        kind: "season",
        subject: "franchise",
        tone: isLow
          ? "negative"
          : "positive",
        label: scopeCategory(
          primary.scope
        ),
        headline:
          primary.rank === 1
            ? `${name} is on pace for a season record`
            : `${name} is closing in on a season record`,
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
 * Debug mode:
 *
 * Show up to 15 meaningful stories.
 * Never invent filler.
 *
 * Prefer different performances.
 * The same player or team may feature
 * again only for a distinct achievement.
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
  const usedStories = new Set<string>();
  const usedSubjects = new Set<string>();

  function storyKey(
    item: RecordHighlight
  ): string {
    const identity =
      item.subject === "player"
        ? `player:${item.playerId}`
        : `team:${item.rosterId}`;

    return [
      identity,
      item.kind,
      item.week,
      item.season,
      item.value,
    ].join(":");
  }

  function subjectKey(
    item: RecordHighlight
  ): string {
    return item.subject === "player"
      ? `player:${item.playerId}`
      : `team:${item.rosterId}`;
  }

  // First pass: one story per subject.
  for (const item of sorted) {
    if (
      selected.length >=
      RECORD_WATCH_LIMIT
    ) {
      break;
    }

    const subject = subjectKey(item);
    const story = storyKey(item);

    if (
      usedSubjects.has(subject) ||
      usedStories.has(story)
    ) {
      continue;
    }

    selected.push(item);
    usedSubjects.add(subject);
    usedStories.add(story);
  }

  // Second pass: allow distinct stories.
  for (const item of sorted) {
    if (
      selected.length >=
      RECORD_WATCH_LIMIT
    ) {
      break;
    }

    const story = storyKey(item);

    if (usedStories.has(story)) {
      continue;
    }

    selected.push(item);
    usedStories.add(story);
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
      week,
      directory
    ),
    ...buildTeamSeasonHighlights(
      data.teamSeasons,
      season,
      week
    ),
    ...buildPlayerSeasonHighlights(
      data.playerSeasons,
      season,
      week,
      directory
    ),
  ]);
}

/*
 * Legacy recordWatch output retained
 * for compatibility.
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

    if (
      Number(year) >= Number(season)
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

    for (const [
      rosterId,
      total,
    ] of totals) {
      if (total.games !== WEEKS) {
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
        (currentTotals.get(
          side.rosterId
        ) ?? 0) + side.points
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
          (challenger / latestWeek) *
          WEEKS
        )
      : null;

  return [
    {
      category:
        "Single-season team scoring",
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
      (game) =>
        eligible(game, season)
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
