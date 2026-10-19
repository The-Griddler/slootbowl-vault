
import type {
  HistoricalMatchup,
  HistoricalSeason,
} from "./sleeper";

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

type MutableStanding = Omit<
  HomeStanding,
  "rank" | "winPercentage" | "inPlayoffPosition"
>;

type TeamPerformance = {
  season: string;
  week: number;
  rosterId: number;
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
  playerId: string;
  points: number;
};

type SeasonTotal = {
  season: string;
  rosterId: number;
  points: number;
  wins: number;
  losses: number;
  games: number;
};

const REGULAR_SEASON_WEEKS = 14;

function round2(value: number): number {
  return (
    Math.round(
      (value + Number.EPSILON) * 100
    ) / 100
  );
}

function validScore(value: number): boolean {
  return (
    Number.isFinite(value) &&
    value >= 0
  );
}

function isEligibleGame(
  game: HistoricalMatchup,
  season: string
): boolean {
  return (
    game.season === season &&
    game.phase === "Regular Season" &&
    game.isComplete === true &&
    game.week >= 1 &&
    game.week <= REGULAR_SEASON_WEEKS &&
    game.rosterA !== game.rosterB &&
    validScore(game.scoreA) &&
    validScore(game.scoreB)
  );
}

function toHomeGame(
  game: HistoricalMatchup
): HomeGame {
  const margin = Math.abs(
    game.scoreA - game.scoreB
  );

  const winnerId =
    game.scoreA > game.scoreB
      ? game.rosterA
      : game.scoreB > game.scoreA
        ? game.rosterB
        : null;

  const loserId =
    winnerId === game.rosterA
      ? game.rosterB
      : winnerId === game.rosterB
        ? game.rosterA
        : null;

  return {
    ...game,
    margin: round2(margin),
    combinedScore: round2(
      game.scoreA + game.scoreB
    ),
    winnerId,
    loserId,
  };
}

function compareStandings(
  a: MutableStanding,
  b: MutableStanding
): number {
  const aWinPercentage =
    a.gamesPlayed > 0
      ? (a.wins + a.ties * 0.5) /
        a.gamesPlayed
      : 0;

  const bWinPercentage =
    b.gamesPlayed > 0
      ? (b.wins + b.ties * 0.5) /
        b.gamesPlayed
      : 0;

  return (
    bWinPercentage - aWinPercentage ||
    b.pointsFor - a.pointsFor ||
    a.rosterId - b.rosterId
  );
}

export function calculateHomeStandings(
  games: HomeGame[]
): HomeStanding[] {
  const standings = new Map<
    number,
    MutableStanding
  >();

  for (const conference of HOME_CONFERENCES) {
    for (const rosterId of conference.rosterIds) {
      standings.set(rosterId, {
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
    const teamA = standings.get(game.rosterA);
    const teamB = standings.get(game.rosterB);

    if (!teamA || !teamB) {
      continue;
    }

    teamA.gamesPlayed++;
    teamB.gamesPlayed++;

    teamA.pointsFor += game.scoreA;
    teamA.pointsAgainst += game.scoreB;

    teamB.pointsFor += game.scoreB;
    teamB.pointsAgainst += game.scoreA;

    if (game.scoreA > game.scoreB) {
      teamA.wins++;
      teamB.losses++;
    } else if (game.scoreB > game.scoreA) {
      teamB.wins++;
      teamA.losses++;
    } else {
      teamA.ties++;
      teamB.ties++;
    }
  }

  const result: HomeStanding[] = [];

  for (const conference of HOME_CONFERENCES) {
    const conferenceStandings = [
      ...standings.values(),
    ]
      .filter(
        (team) =>
          team.conference === conference.id
      )
      .sort(compareStandings);

    conferenceStandings.forEach(
      (team, index) => {
        const winPercentage =
          team.gamesPlayed > 0
            ? (
                team.wins +
                team.ties * 0.5
              ) / team.gamesPlayed
            : 0;

        result.push({
          ...team,
          rank: index + 1,
          pointsFor: round2(team.pointsFor),
          pointsAgainst: round2(
            team.pointsAgainst
          ),
          winPercentage,
          inPlayoffPosition: index < 3,
        });
      }
    );
  }

  return result;
}

function calculateSeasonStats(
  games: HomeGame[],
  season: string
): HomeSeasonStats {
  const weeks = new Set(
    games.map((game) => game.week)
  );

  let highestTeamScore:
    HomeSeasonStats["highestTeamScore"] = null;

  for (const game of games) {
    const performances = [
      {
        rosterId: game.rosterA,
        points: game.scoreA,
      },
      {
        rosterId: game.rosterB,
        points: game.scoreB,
      },
    ];

    for (const performance of performances) {
      if (
        !highestTeamScore ||
        performance.points >
          highestTeamScore.points
      ) {
        highestTeamScore = {
          ...performance,
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

  const totalPoints = games.reduce(
    (sum, game) =>
      sum + game.scoreA + game.scoreB,
    0
  );

  return {
    season,
    completedWeeks: weeks.size,
    latestCompletedWeek:
      games.length > 0
        ? Math.max(
            ...games.map((game) => game.week)
          )
        : 0,
    gamesPlayed: games.length,
    totalPoints: round2(totalPoints),
    averageTeamScore:
      games.length > 0
        ? round2(
            totalPoints /
              (games.length * 2)
          )
        : 0,
    highestTeamScore,
    closestGame,
    biggestBlowout,
    highestScoringGame,
  };
}

/*
 * Build historical performance lists.
 *
 * Only started players are included.
 * Only completed regular-season games
 * are used for this first version.
 */
function buildRecordData(
  historicalData: HistoricalSeason[],
  currentSeason: string
): {
  teams: TeamPerformance[];
  players: PlayerPerformance[];
  seasons: SeasonTotal[];
} {
  const teams: TeamPerformance[] = [];
  const players: PlayerPerformance[] = [];
  const seasons: SeasonTotal[] = [];

  for (const historicalSeason of historicalData) {
    const season = historicalSeason.league.season;

    if (Number(season) > Number(currentSeason)) {
      continue;
    }

    const games = historicalSeason.matchups.filter(
      (game) => isEligibleGame(game, season)
    );

    const totals = new Map<number, SeasonTotal>();

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
        const margin = round2(
          side.points - side.opponentPoints
        );

        teams.push({
          season,
          week: game.week,
          rosterId: side.rosterId,
          points: round2(side.points),
          opponentPoints: round2(
            side.opponentPoints
          ),
          margin,
          won: margin > 0,
          lost: margin < 0,
        });

        const total = totals.get(side.rosterId) ?? {
          season,
          rosterId: side.rosterId,
          points: 0,
          wins: 0,
          losses: 0,
          games: 0,
        };

        total.points += side.points;
        total.games++;

        if (margin > 0) total.wins++;
        if (margin < 0) total.losses++;

        totals.set(side.rosterId, total);

        /*
         * Sleeper starters and starter points
         * use matching array positions.
         */
        side.starters.forEach((playerId, index) => {
          const points = side.starterPoints[index];

          if (
            !playerId ||
            playerId === "0" ||
            !validScore(points)
          ) {
            return;
          }

          players.push({
            season,
            week: game.week,
            rosterId: side.rosterId,
            playerId,
            points: round2(points),
          });
        });
      }
    }

    for (const total of totals.values()) {
      seasons.push({
        ...total,
        points: round2(total.points),
      });
    }
  }

  return { teams, players, seasons };
}

/*
 * Competition ranking:
 *
 * 1st, 2nd, 2nd, 4th.
 *
 * An equal record receives equal rank.
 */
function historicalRank(
  value: number,
  values: number[],
  direction: "high" | "low"
): number {
  const better = values.filter((other) =>
    direction === "high"
      ? other > value
      : other < value
  ).length;

  return better + 1;
}

function recordValue(
  values: number[],
  direction: "high" | "low"
): number | null {
  if (values.length === 0) return null;

  return direction === "high"
    ? Math.max(...values)
    : Math.min(...values);
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

/*
 * Generate noteworthy weekly performances.
 *
 * The historical rank includes all eligible
 * completed games, including the current
 * season, but not future weeks.
 */
function buildGameHighlights(
  teams: TeamPerformance[],
  players: PlayerPerformance[],
  season: string,
  week: number
): RecordHighlight[] {
  const candidates: RecordHighlight[] = [];

  const weeklyTeams = teams.filter(
    (item) =>
      item.season === season &&
      item.week === week
  );

  const weeklyPlayers = players.filter(
    (item) =>
      item.season === season &&
      item.week === week
  );

  const categories: {
    id: string;
    label: string;
    direction: "high" | "low";
    tone: RecordHighlight["tone"];
    eligible: (item: TeamPerformance) => boolean;
    value: (item: TeamPerformance) => number;
  }[] = [
    {
      id: "highest-team-score",
      label: "Highest weekly franchise score",
      direction: "high",
      tone: "positive",
      eligible: () => true,
      value: (item) => item.points,
    },
    {
      id: "lowest-team-score",
      label: "Lowest weekly franchise score",
      direction: "low",
      tone: "negative",
      eligible: () => true,
      value: (item) => item.points,
    },
    {
      id: "biggest-win",
      label: "Biggest winning margin",
      direction: "high",
      tone: "positive",
      eligible: (item) => item.won,
      value: (item) => item.margin,
    },
    {
      id: "unluckiest-loss",
      label: "Highest-scoring losing franchise",
      direction: "high",
      tone: "unusual",
      eligible: (item) => item.lost,
      value: (item) => item.points,
    },
    {
      id: "lowest-winning-score",
      label: "Lowest-scoring winning franchise",
      direction: "low",
      tone: "unusual",
      eligible: (item) => item.won,
      value: (item) => item.points,
    },
  ];

  for (const category of categories) {
    const all = teams.filter(category.eligible);
    const recent = weeklyTeams.filter(
      category.eligible
    );

    if (!all.length || !recent.length) continue;

    const values = all.map(category.value);

    const best = [...recent].sort((a, b) =>
      category.direction === "high"
        ? category.value(b) - category.value(a)
        : category.value(a) - category.value(b)
    )[0];

    const value = category.value(best);
    const rank = historicalRank(
      value,
      values,
      category.direction
    );

    if (rank > 10) continue;

    const record = recordValue(
      values,
      category.direction
    );

    candidates.push({
      id: `${season}-${week}-${category.id}`,
      kind: "game",
      subject: "franchise",
      tone: category.tone,
      label: category.label,
      headline:
        rank === 1
          ? "An all-time SFL performance"
          : `${ordinal(rank)} in SFL history`,
      detail:
        `${ordinal(rank)} all-time in ` +
        category.label.toLowerCase(),
      value: round2(value),
      unit: "points",
      rosterId: best.rosterId,
      playerId: null,
      week,
      season,
      allTimeRank: rank,
      historicalRecord: record,
      historicalSeason: null,
      historicalRosterId: null,
      projectedValue: null,
      priority:
        rank === 1
          ? 120
          : Math.max(15, 100 - rank * 11),
    });
  }

  /*
   * Individual starter performances.
   * This is an overall player-game ranking.
   * Position-specific rankings can be added
   * once player metadata is passed in.
   */
  if (weeklyPlayers.length && players.length) {
    const bestPlayer = [...weeklyPlayers].sort(
      (a, b) => b.points - a.points
    )[0];

    const allScores = players.map(
      (item) => item.points
    );

    const rank = historicalRank(
      bestPlayer.points,
      allScores,
      "high"
    );

    if (rank <= 10) {
      candidates.push({
        id:
          `${season}-${week}-player-` +
          bestPlayer.playerId,
        kind: "game",
        subject: "player",
        tone: "positive",
        label: "Individual player game score",
        headline:
          rank === 1
            ? "The greatest player game in SFL history"
            : `${ordinal(rank)} highest player score ever`,
        detail:
          `${ordinal(rank)} all-time among ` +
          "started player performances",
        value: bestPlayer.points,
        unit: "points",
        rosterId: bestPlayer.rosterId,
        playerId: bestPlayer.playerId,
        week,
        season,
        allTimeRank: rank,
        historicalRecord: recordValue(
          allScores,
          "high"
        ),
        historicalSeason: null,
        historicalRosterId: null,
        projectedValue: null,
        priority:
          rank === 1
            ? 125
            : Math.max(15, 105 - rank * 11),
      });
    }
  }

  return candidates;
}

/*
 * Season chases compare projected 14-game
 * regular-season totals against previous
 * seasons with 14 completed games.
 *
 * Projections begin in Week 4.
 */
function buildSeasonHighlights(
  seasons: SeasonTotal[],
  season: string,
  week: number
): RecordHighlight[] {
  if (week < 4) return [];

  const historical = seasons.filter(
    (item) =>
      Number(item.season) < Number(season) &&
      item.games === REGULAR_SEASON_WEEKS
  );

  const current = seasons.filter(
    (item) =>
      item.season === season &&
      item.games >= 4
  );

  if (!historical.length || !current.length) {
    return [];
  }

  const categories: {
    id: string;
    label: string;
    direction: "high" | "low";
    tone: RecordHighlight["tone"];
    unit: "points" | "wins";
    value: (item: SeasonTotal) => number;
  }[] = [
    {
      id: "season-points-high",
      label: "Most franchise points in a season",
      direction: "high",
      tone: "positive",
      unit: "points",
      value: (item) => item.points,
    },
    {
      id: "season-points-low",
      label: "Fewest franchise points in a season",
      direction: "low",
      tone: "negative",
      unit: "points",
      value: (item) => item.points,
    },
    {
      id: "season-wins-high",
      label: "Most regular-season wins",
      direction: "high",
      tone: "positive",
      unit: "wins",
      value: (item) => item.wins,
    },
    {
      id: "season-wins-low",
      label: "Fewest regular-season wins",
      direction: "low",
      tone: "negative",
      unit: "wins",
      value: (item) => item.wins,
    },
  ];

  const candidates: RecordHighlight[] = [];

  for (const category of categories) {
    const sortedHistory = [...historical].sort(
      (a, b) =>
        category.direction === "high"
          ? category.value(b) - category.value(a)
          : category.value(a) - category.value(b)
    );

    const holder = sortedHistory[0];
    const record = category.value(holder);

    const projected = current
      .map((item) => ({
        item,
        projection:
          (category.value(item) / item.games) *
          REGULAR_SEASON_WEEKS,
      }))
      .sort((a, b) =>
        category.direction === "high"
          ? b.projection - a.projection
          : a.projection - b.projection
      )[0];

    if (!projected) continue;

    const difference =
      category.direction === "high"
        ? projected.projection - record
        : record - projected.projection;

    const tolerance =
      category.unit === "wins"
        ? 1.5
        : Math.abs(record) * 0.05;

    /*
     * Only serious record chases qualify.
     * This includes projected ties and
     * performances close to record pace.
     */
    if (difference < -tolerance) continue;

    const onPace = difference >= 0;

    candidates.push({
      id: `${season}-${week}-${category.id}`,
      kind: "season",
      subject: "franchise",
      tone: category.tone,
      label: category.label,
      headline: onPace
        ? "On historic season pace"
        : "Closing in on a season record",
      detail: onPace
        ? "Projected to match or surpass the historical mark"
        : "Projected to finish close to the historical mark",
      value: round2(
        category.value(projected.item)
      ),
      unit: category.unit,
      rosterId: projected.item.rosterId,
      playerId: null,
      week,
      season,
      allTimeRank: null,
      historicalRecord: round2(record),
      historicalSeason: holder.season,
      historicalRosterId: holder.rosterId,
      projectedValue: round2(
        projected.projection
      ),
      priority: onPace ? 65 : 40,
    });
  }

  return candidates;
}

/*
 * Select one headline and up to two
 * supporting stories.
 *
 * Game performances receive preference
 * over recurring season projections.
 *
 * A season chase is never repeated across
 * multiple cards in the same selection.
 */
function calculateRecordHighlights(
  historicalData: HistoricalSeason[],
  season: string,
  latestWeek: number
): RecordHighlight[] {
  if (latestWeek < 1) return [];

  const data = buildRecordData(
    historicalData,
    season
  );

  const gameCandidates = buildGameHighlights(
    data.teams,
    data.players,
    season,
    latestWeek
  );

  const seasonCandidates = buildSeasonHighlights(
    data.seasons,
    season,
    latestWeek
  );

  const candidates = [
    ...gameCandidates,
    ...seasonCandidates,
  ].sort(
    (a, b) =>
      b.priority - a.priority ||
      a.id.localeCompare(b.id)
  );

  const selected: RecordHighlight[] = [];
  const usedLabels = new Set<string>();
  const usedSubjects = new Set<string>();

  /*
   * First select the strongest headline.
   */
  if (candidates.length) {
    const first = candidates[0];

    selected.push(first);
    usedLabels.add(first.label);

    usedSubjects.add(
      first.playerId ??
        `franchise-${first.rosterId}`
    );
  }

  /*
   * Then prefer variety, avoiding
   * repeatedly featuring the same
   * player or franchise.
   */
  for (const candidate of candidates.slice(1)) {
    if (selected.length >= 3) break;

    const subjectKey =
      candidate.playerId ??
      `franchise-${candidate.rosterId}`;

    if (
      usedLabels.has(candidate.label) ||
      usedSubjects.has(subjectKey)
    ) {
      continue;
    }

    selected.push(candidate);
    usedLabels.add(candidate.label);
    usedSubjects.add(subjectKey);
  }

  /*
   * If fewer than three qualify, allow
   * another category from an already
   * featured franchise.
   */
  for (const candidate of candidates) {
    if (selected.length >= 3) break;

    if (
      selected.some(
        (item) => item.id === candidate.id
      ) ||
      usedLabels.has(candidate.label)
    ) {
      continue;
    }

    selected.push(candidate);
    usedLabels.add(candidate.label);
  }

  return selected;
}

/*
 * Existing record calculation retained
 * for compatibility with app/page.tsx.
 */
function calculateRecordWatch(
  historicalData: HistoricalSeason[],
  currentGames: HomeGame[],
  season: string,
  latestCompletedWeek: number
): HomeRecordWatch[] {
  const historicalTotals: {
    season: string;
    rosterId: number;
    points: number;
  }[] = [];

  for (const historicalSeason of historicalData) {
    const historicalYear = Number(
      historicalSeason.league.season
    );

    if (
      !Number.isFinite(historicalYear) ||
      historicalYear >= Number(season)
    ) {
      continue;
    }

    const seasonGames =
      historicalSeason.matchups.filter(
        (game) =>
          isEligibleGame(
            game,
            historicalSeason.league.season
          )
      );

    const totals = new Map<number, number>();

    for (const game of seasonGames) {
      totals.set(
        game.rosterA,
        (totals.get(game.rosterA) ?? 0) +
          game.scoreA
      );

      totals.set(
        game.rosterB,
        (totals.get(game.rosterB) ?? 0) +
          game.scoreB
      );
    }

    for (const [rosterId, points] of totals) {
      historicalTotals.push({
        season: historicalSeason.league.season,
        rosterId,
        points: round2(points),
      });
    }
  }

  historicalTotals.sort(
    (a, b) => b.points - a.points
  );

  const record = historicalTotals[0];

  const currentTotals = new Map<number, number>();

  for (const game of currentGames) {
    currentTotals.set(
      game.rosterA,
      (currentTotals.get(game.rosterA) ?? 0) +
        game.scoreA
    );

    currentTotals.set(
      game.rosterB,
      (currentTotals.get(game.rosterB) ?? 0) +
        game.scoreB
    );
  }

  const currentLeader = [
    ...currentTotals.entries(),
  ].sort((a, b) => b[1] - a[1])[0];

  if (!record || !currentLeader) {
    return [];
  }

  const challengerPoints = round2(
    currentLeader[1]
  );

  const projectedTotal =
    latestCompletedWeek > 0
      ? round2(
          (challengerPoints /
            latestCompletedWeek) *
            REGULAR_SEASON_WEEKS
        )
      : null;

  return [
    {
      category: "Single-season team scoring",
      record: record.points,
      recordSeason: record.season,
      recordRosterId: record.rosterId,
      challenger: challengerPoints,
      challengerRosterId: currentLeader[0],
      progressPercentage:
        record.points > 0
          ? Math.min(
              100,
              round2(
                (challengerPoints /
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
  season: string = HOME_SEASON
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
        isEligibleGame(game, season)
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

  const recordWatch =
    calculateRecordWatch(
      historicalData,
      completedGames,
      season,
      seasonStats.latestCompletedWeek
    );

  const recordHighlights =
    calculateRecordHighlights(
      historicalData,
      season,
      seasonStats.latestCompletedWeek
    );

  return {
    season,
    seasonStats,
    standings,
    conferences,
    playoffContenders,
    completedGames,
    recordWatch,
    recordHighlights,
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
