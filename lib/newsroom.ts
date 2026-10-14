
import type { HistoricalMatchup } from "./sleeper";
import {
  selectStoryFormat,
  type EditorialEvidence,
  type StoryFormatDefinition,
} from "./newsroom/formats";

/**
 * SLOOT NEWS — EDITORIAL ENGINE V2
 *
 * Uses the 50-format editorial catalogue.
 *
 * - Five journalists, one match each.
 * - Ten formats per journalist.
 * - Historical format rotation.
 * - Evidence-led writing.
 * - Distinct article structures.
 * - No AI service or external writing API.
 *
 * The public interface remains compatible with
 * the existing Sloot News newspaper page.
 */

export type PlayerRecord = {
  first_name?: string;
  last_name?: string;
  full_name?: string;
  position?: string;
};

export type PlayerDatabase = Record<string, PlayerRecord>;

export type JournalistId =
  | "pembroke"
  | "graves"
  | "mcnulty"
  | "bellend"
  | "pissworth";

export type StoryAngle =
  | "rivalry"
  | "heartbreak"
  | "demolition"
  | "shootout"
  | "star"
  | "collapse"
  | "surprise"
  | "ordinary";

export type StoryFormat =
  | "match-report"
  | "case-file"
  | "tabloid"
  | "essay"
  | "column";

export type NewsPlayer = {
  id: string;
  name: string;
  points: number;
  roster: number;
  average: number | null;
  previousStarts: number;
  difference: number | null;
  contribution: number;
};

export type NewsResult = {
  game: HistoricalMatchup;
  winner: number;
  loser: number;
  winnerScore: number;
  loserScore: number;
  margin: number;
  total: number;
};

export type NewsArticle = {
  id: string;
  journalist: JournalistId;
  byline: string;
  role: string;
  format: StoryFormat;
  angle: StoryAngle;
  eyebrow: string;
  headline: string;
  standfirst: string;
  paragraphs: string[];
  featured: boolean;
  result: NewsResult;
};

export type NewsEdition = {
  season: string;
  week: number;
  articles: NewsArticle[];
  gameOfTheWeek: NewsArticle;
  biggestDefeat: NewsResult;
};

type Journalist = {
  id: JournalistId;
  name: string;
  role: string;
  format: StoryFormat;
};

type MatchIntel = {
  result: NewsResult;
  winners: NewsPlayer[];
  losers: NewsPlayer[];
  star: NewsPlayer | null;
  losingStar: NewsPlayer | null;
  collapse: NewsPlayer | null;
  surprise: NewsPlayer | null;
  rivalry: string | null;
  winnerStreak: number;
  loserStreak: number;
  previousMeeting: NewsResult | null;
  angle: StoryAngle;
  importance: number;
};

type WrittenStory = Pick<
  NewsArticle,
  "headline" | "standfirst" | "paragraphs"
>;

type StoryContext = {
  intel: MatchIntel;
  journalist: Journalist;
  definition: StoryFormatDefinition;
  seed: number;
};

const JOURNALISTS: Journalist[] = [
  {
    id: "pembroke",
    name: "Arthur Pembroke",
    role: "Chief Football Correspondent",
    format: "match-report",
  },
  {
    id: "graves",
    name: "Martin Graves",
    role: "Investigations Editor",
    format: "case-file",
  },
  {
    id: "mcnulty",
    name: "Baz McNulty",
    role: "Chief Tabloid Correspondent",
    format: "tabloid",
  },
  {
    id: "bellend",
    name: "Professor Hugo Bellend",
    role: "Senior Football Philosopher",
    format: "essay",
  },
  {
    id: "pissworth",
    name: "Derek Pissworth",
    role: "Former Manager & Opinion Columnist",
    format: "column",
  },
];

const TEAMS: Record<number, string> = {
  1: "Mt Isa Ballbags",
  2: "Cambridge Cum Sluts",
  3: "Grimsby Chode Chokers",
  4: "Isle of Wight Happy Endings",
  5: "Grays Town Fingerblasters",
  6: "Lincoln Nonces",
  7: "Kalamata Dirty Vegans",
  8: "Weybiza BAB’s",
  9: "East Rutherford Shitlickers",
  10: "Chad Moist Discharge",
};

const MANAGERS: Record<number, string> = {
  1: "Ed Nelms",
  2: "Ben Smith",
  3: "Jake Greenwood",
  4: "George Pendleton",
  5: "Ryan Whiting",
  6: "Garrett Etheridge",
  7: "Ollie Payne",
  8: "Jack Brannigan",
  9: "Tarl Brayer",
  10: "Josh Thomas",
};

const RIVALRIES = [
  { a: 1, b: 3, name: "The Shotty Bowl" },
  { a: 4, b: 7, name: "The Paddletap Bowl" },
  { a: 4, b: 9, name: "The OBFC Grudge Match" },
  { a: 1, b: 10, name: "The Commissioner's Nightmare" },
];

function team(id: number, season: string): string {
  if (id === 1 && Number(season) < 2026) {
    return "Perth Ballbags";
  }

  return TEAMS[id] ?? `Franchise ${id}`;
}

function manager(id: number): string {
  return MANAGERS[id] ?? "Unknown Manager";
}

function pts(value: number): string {
  return value.toFixed(2);
}

function hash(...values: number[]): number {
  let output = 2166136261;

  for (const value of values) {
    output = Math.imul(
      output ^ Math.trunc(value),
      16777619
    );
  }

  return output >>> 0;
}

function choose<T>(
  options: readonly T[],
  seed: number
): T {
  return options[seed % options.length];
}

function completed(game: HistoricalMatchup): boolean {
  return (
    game.isComplete === true &&
    game.phase === "Regular Season" &&
    Number.isFinite(game.scoreA) &&
    Number.isFinite(game.scoreB) &&
    game.scoreA >= 0 &&
    game.scoreB >= 0 &&
    (game.scoreA > 0 || game.scoreB > 0)
  );
}

function earlier(
  game: HistoricalMatchup,
  target: HistoricalMatchup
): boolean {
  return (
    Number(game.season) < Number(target.season) ||
    (
      game.season === target.season &&
      game.week < target.week
    )
  );
}

function resultOf(
  game: HistoricalMatchup
): NewsResult | null {
  if (!completed(game)) return null;
  if (game.scoreA === game.scoreB) return null;

  const aWon = game.scoreA > game.scoreB;

  return {
    game,
    winner: aWon ? game.rosterA : game.rosterB,
    loser: aWon ? game.rosterB : game.rosterA,
    winnerScore: aWon ? game.scoreA : game.scoreB,
    loserScore: aWon ? game.scoreB : game.scoreA,
    margin: Math.abs(game.scoreA - game.scoreB),
    total: game.scoreA + game.scoreB,
  };
}

function rivalryName(
  a: number,
  b: number
): string | null {
  return (
    RIVALRIES.find(
      (rivalry) =>
        (rivalry.a === a && rivalry.b === b) ||
        (rivalry.a === b && rivalry.b === a)
    )?.name ?? null
  );
}

function playerName(
  id: string,
  database: PlayerDatabase
): string {
  const player = database[id];

  return (
    player?.full_name ||
    [player?.first_name, player?.last_name]
      .filter(Boolean)
      .join(" ") ||
    `Player ${id}`
  );
}

/**
 * Only previous completed regular-season starts.
 * Averages follow the player across franchises.
 */
function previousScores(
  id: string,
  target: HistoricalMatchup,
  history: HistoricalMatchup[]
): number[] {
  const output: number[] = [];

  for (const game of history) {
    if (!completed(game) || !earlier(game, target)) {
      continue;
    }

    const sides = [
      [game.startersA, game.startersPointsA],
      [game.startersB, game.startersPointsB],
    ] as const;

    for (const [ids, scores] of sides) {
      const index = ids.indexOf(id);

      if (
        index >= 0 &&
        Number.isFinite(scores[index])
      ) {
        output.push(scores[index]);
      }
    }
  }

  return output;
}

function analysePlayers(
  result: NewsResult,
  history: HistoricalMatchup[],
  database: PlayerDatabase
): {
  winners: NewsPlayer[];
  losers: NewsPlayer[];
} {
  const output: NewsPlayer[] = [];

  const sides = [
    {
      roster: result.game.rosterA,
      ids: result.game.startersA,
      scores: result.game.startersPointsA,
      total: result.game.scoreA,
    },
    {
      roster: result.game.rosterB,
      ids: result.game.startersB,
      scores: result.game.startersPointsB,
      total: result.game.scoreB,
    },
  ];

  for (const side of sides) {
    side.ids.forEach((id, index) => {
      const score = side.scores[index];

      if (
        !id ||
        id === "0" ||
        !Number.isFinite(score)
      ) {
        return;
      }

      const previous = previousScores(
        id,
        result.game,
        history
      );

      const average = previous.length
        ? previous.reduce((a, b) => a + b, 0) /
          previous.length
        : null;

      output.push({
        id,
        name: playerName(id, database),
        points: score,
        roster: side.roster,
        average,
        previousStarts: previous.length,
        difference:
          average === null ? null : score - average,
        contribution:
          side.total > 0 ? score / side.total : 0,
      });
    });
  }

  return {
    winners: output
      .filter((p) => p.roster === result.winner)
      .sort((a, b) => b.points - a.points),
    losers: output
      .filter((p) => p.roster === result.loser)
      .sort((a, b) => b.points - a.points),
  };
}

function previousResults(
  roster: number,
  target: HistoricalMatchup,
  history: HistoricalMatchup[]
): NewsResult[] {
  return history
    .filter(
      (game) =>
        completed(game) &&
        earlier(game, target) &&
        (
          game.rosterA === roster ||
          game.rosterB === roster
        )
    )
    .map(resultOf)
    .filter((r): r is NewsResult => r !== null)
    .sort(
      (a, b) =>
        Number(b.game.season) -
          Number(a.game.season) ||
        b.game.week - a.game.week
    );
}

function streak(
  roster: number,
  target: HistoricalMatchup,
  history: HistoricalMatchup[],
  wantWins: boolean
): number {
  const games = previousResults(
    roster,
    target,
    history
  );

  let count = 0;

  for (const result of games) {
    const won = result.winner === roster;

    if (won !== wantWins) break;

    count++;
  }

  return count;
}

function lastMeeting(
  result: NewsResult,
  history: HistoricalMatchup[]
): NewsResult | null {
  return (
    history
      .filter(
        (game) =>
          completed(game) &&
          earlier(game, result.game) &&
          (
            (
              game.rosterA === result.winner &&
              game.rosterB === result.loser
            ) ||
            (
              game.rosterA === result.loser &&
              game.rosterB === result.winner
            )
          )
      )
      .map(resultOf)
      .filter(
        (r): r is NewsResult => r !== null
      )
      .sort(
        (a, b) =>
          Number(b.game.season) -
            Number(a.game.season) ||
          b.game.week - a.game.week
      )[0] ?? null
  );
}

function investigate(
  result: NewsResult,
  history: HistoricalMatchup[],
  database: PlayerDatabase
): MatchIntel {
  const { winners, losers } = analysePlayers(
    result,
    history,
    database
  );

  const star = winners[0] ?? null;
  const losingStar = losers[0] ?? null;

  const collapse =
    [...losers]
      .filter(
        (p) =>
          p.previousStarts >= 3 &&
          p.difference !== null &&
          p.difference <= -8
      )
      .sort(
        (a, b) =>
          (a.difference ?? 0) -
          (b.difference ?? 0)
      )[0] ?? null;

  const surprise =
    [...winners]
      .filter(
        (p) =>
          p.previousStarts >= 3 &&
          p.difference !== null &&
          p.difference >= 12 &&
          p.points >= 18
      )
      .sort(
        (a, b) =>
          (b.difference ?? 0) -
          (a.difference ?? 0)
      )[0] ?? null;

  const rivalry = rivalryName(
    result.winner,
    result.loser
  );

  const winnerStreak = streak(
    result.winner,
    result.game,
    history,
    true
  );

  const loserStreak = streak(
    result.loser,
    result.game,
    history,
    false
  );

  const previousMeeting = lastMeeting(
    result,
    history
  );

  const angle: StoryAngle =
    rivalry
      ? "rivalry"
      : result.margin <= 3
        ? "heartbreak"
        : result.margin >= 40
          ? "demolition"
          : result.total >= 310
            ? "shootout"
            : collapse &&
                Math.abs(collapse.difference ?? 0) >
                  result.margin
              ? "collapse"
              : surprise
                ? "surprise"
                : (star?.points ?? 0) >= 30
                  ? "star"
                  : "ordinary";

  let importance = 0;

  if (rivalry) importance += 55;
  if (result.margin <= 3) importance += 40;
  if (result.margin >= 40) importance += 25;
  if (result.total >= 310) importance += 25;
  if ((star?.points ?? 0) >= 35) importance += 18;
  if (surprise) importance += 12;
  if (collapse) importance += 10;

  importance +=
    Math.min(result.margin, 50) * 0.4;

  return {
    result,
    winners,
    losers,
    star,
    losingStar,
    collapse,
    surprise,
    rivalry,
    winnerStreak,
    loserStreak,
    previousMeeting,
    angle,
    importance,
  };
}

/**
 * Match evidence for the format selector.
 *
 * A completed result makes all ten formats
 * eligible. Specialist evidence improves
 * their relevance.
 */
function editorialEvidence(
  intel: MatchIntel,
  weeklyResults: NewsResult[]
): EditorialEvidence {
  const { result } = intel;

  const scores = weeklyResults.flatMap(
    (r) => [r.winnerScore, r.loserScore]
  );

  const average = scores.length
    ? scores.reduce((a, b) => a + b, 0) /
      scores.length
    : 0;

  return {
    result: true,
    star: intel.star !== null,
    collapse: intel.collapse !== null,
    surprise: intel.surprise !== null,
    rivalry: intel.rivalry !== null,
    closeGame: result.margin <= 5,
    blowout: result.margin >= 30,
    shootout: result.total >= 310,
    winningStreak: intel.winnerStreak >= 2,
    losingStreak: intel.loserStreak >= 2,
    highScoringLoss:
      result.loserScore >= average + 15,
    lowScoringWin:
      result.winnerScore < average,
    historicalMeeting:
      intel.previousMeeting !== null,
  };
}

function matchSummary(
  intel: MatchIntel
): string {
  const { result } = intel;
  const season = result.game.season;

  return (
    `${team(result.winner, season)} defeated ` +
    `${team(result.loser, season)} ` +
    `${pts(result.winnerScore)} to ` +
    `${pts(result.loserScore)}, a margin of ` +
    `${pts(result.margin)} points.`
  );
}

function starSummary(
  intel: MatchIntel
): string {
  if (!intel.star) {
    return (
      "The winning lineup accumulated enough " +
      "points to settle the contest."
    );
  }

  const p = intel.star;

  return (
    `${p.name} supplied ${pts(p.points)} points, ` +
    `${(p.contribution * 100).toFixed(1)}% of ` +
    "the winning team's total."
  );
}

function losingSummary(
  intel: MatchIntel
): string {
  if (
    intel.collapse &&
    intel.collapse.average !== null
  ) {
    const p = intel.collapse;

    return (
      `${p.name} managed ${pts(p.points)} ` +
      `points against a previous SFL starting ` +
      `average of ${pts(p.average)} across ` +
      `${p.previousStarts} starts.`
    );
  }

  if (intel.losingStar) {
    return (
      `${intel.losingStar.name} led the defeated ` +
      `lineup with ${pts(intel.losingStar.points)} ` +
      "points, but it was not enough."
    );
  }

  return (
    `The defeated franchise finished ` +
    `${pts(intel.result.margin)} points short.`
  );
}

function historicalSummary(
  intel: MatchIntel
): string {
  const { result } = intel;
  const season = result.game.season;
  const pieces: string[] = [];

  if (intel.winnerStreak >= 2) {
    pieces.push(
      `${team(result.winner, season)} entered ` +
      `the fixture on ${intel.winnerStreak} ` +
      "consecutive regular-season wins"
    );
  }

  if (intel.loserStreak >= 2) {
    pieces.push(
      `${team(result.loser, season)} arrived ` +
      `having lost ${intel.loserStreak} ` +
      "consecutive regular-season games"
    );
  }

  if (intel.previousMeeting) {
    const previous = intel.previousMeeting;

    pieces.push(
      `their previous regular-season meeting ` +
      `in ${previous.game.season} Week ` +
      `${previous.game.week} was won by ` +
      `${team(previous.winner, previous.game.season)}`
    );
  }

  if (intel.rivalry) {
    pieces.push(
      `the fixture is known as ${intel.rivalry}`
    );
  }

  return pieces.length
    ? pieces.join("; ") + "."
    : "The available record offers no stronger historical claim than the result itself.";
}

function secondPlayer(
  intel: MatchIntel
): string {
  const player = intel.winners[1];

  return player
    ? `${player.name} added ${pts(player.points)} points.`
    : "The remainder of the winning total came from the starting lineup.";
}

function writerObservation(
  journalist: JournalistId,
  intel: MatchIntel,
  seed: number
): string {
  const r = intel.result;
  const w = manager(r.winner);
  const l = manager(r.loser);

  const observations: Record<
    JournalistId,
    string[]
  > = {
    pembroke: [
      `The result rewards ${w}, but a single fixture is rarely sufficient evidence of lasting progress.`,
      `${l} will be disappointed, although the performance deserves examination rather than theatrical condemnation.`,
      `The scoreboard settles the sporting question. It does not settle every question about either franchise.`,
      `There is a distinction between earning a victory and proving oneself a contender. ${w} has achieved the former.`,
    ],
    graves: [
      `Investigators have found no evidence of a conspiracy. They have found considerable evidence that ${l} lost.`,
      `The newsroom requested an explanation from nobody and will nevertheless interpret the silence as significant.`,
      `No disciplinary proceedings are proposed. The figures themselves are sufficiently embarrassing.`,
      `The investigation remains open, chiefly because ${l} might do something even funnier next week.`,
    ],
    mcnulty: [
      `${l.toUpperCase()} MUST ANSWER FOR THIS. Preferably in front of a hostile crowd and several television cameras.`,
      `The group chat has been handed a gift. ${l} has handed it over personally.`,
      `${w.toUpperCase()} IS A GENIUS! Or very lucky. We haven't had time to establish which.`,
      `Nobody has resigned. Nobody has apologised. Frankly, the lack of consequences is disgusting.`,
    ],
    bellend: [
      `One must distinguish the empirical result from the entirely imaginary prestige attached to managerial competence.`,
      `The victorious manager will claim agency; the defeated manager will invoke contingency. Both positions are convenient.`,
      `This episode invites a question of profound insignificance: can a fantasy manager ever truly deserve happiness?`,
      `The academic community remains divided, primarily because the academic community has not been consulted.`,
    ],
    pissworth: [
      `I've seen people celebrate less after winning actual trophies. ${w} needs to get a grip.`,
      `${l} can call it bad luck all he likes. I've heard that excuse from better managers.`,
      `Everyone wants a clever explanation. Sometimes the explanation is that somebody's team was rubbish.`,
      `I don't dislike ${w}. I dislike the suggestion that pressing a button on a phone makes him a visionary.`,
    ],
  };

  return choose(observations[journalist], seed);
}

function writerOpening(
  journalist: JournalistId,
  intel: MatchIntel,
  seed: number
): string {
  const r = intel.result;
  const season = r.game.season;
  const w = team(r.winner, season);
  const l = team(r.loser, season);

  const openings: Record<
    JournalistId,
    string[]
  > = {
    pembroke: [
      `Week ${r.game.week} brought an instructive meeting between ${w} and ${l}.`,
      `The latest chapter in the SFL regular season belongs to ${w}.`,
      `For ${w}, this was a useful victory. For ${l}, an uncomfortable afternoon.`,
    ],
    graves: [
      `The facts surrounding ${l}'s defeat have been secured by the investigations desk.`,
      `At the centre of this inquiry stands ${manager(r.loser)}, a man with questions to answer.`,
      `A routine review of Week ${r.game.week} uncovered a deeply suspicious occurrence: ${l} lost.`,
    ],
    mcnulty: [
      `STOP THE PRESSES. ${w.toUpperCase()} HAVE WON AND ${l.toUpperCase()} ARE IN TROUBLE.`,
      `SCENES! ABSOLUTE SCENES! Another SFL manager has been publicly embarrassed.`,
      `THIS LEAGUE IS OUT OF CONTROL. And the latest evidence comes courtesy of ${l}.`,
    ],
    bellend: [
      `Before considering ${w}'s victory, we must interrogate what victory actually means.`,
      `The SFL has once again provided a laboratory for the study of human delusion.`,
      `A football score is a number. A manager's interpretation of it is an existential event.`,
    ],
    pissworth: [
      `I'll tell you what annoys me about this result. The reaction.`,
      `Apparently we're all supposed to be impressed by ${w}. Well, I'm not signing up to the fan club.`,
      `I've been asked to analyse ${l}'s defeat. As though it requires a bloody dissertation.`,
    ],
  };

  return choose(openings[journalist], seed);
}

function writerVerdict(
  journalist: JournalistId,
  intel: MatchIntel,
  seed: number
): string {
  const r = intel.result;

  const verdicts: Record<
    JournalistId,
    string[]
  > = {
    pembroke: [
      `The points are banked. ${manager(r.winner)} must now demonstrate that the performance was more than an isolated success.`,
      `For ${manager(r.loser)}, the immediate task is recovery rather than explanation.`,
    ],
    graves: [
      `CASE STATUS: The result is confirmed. The competence of ${manager(r.loser)} remains under review.`,
      `RECOMMENDATION: Retain all scoring records. They may be required at the next disciplinary hearing, which we have invented.`,
    ],
    mcnulty: [
      `THE VERDICT: OUTRAGE. DISGRACE. MORE OUTRAGE. SEE YOU NEXT WEEK.`,
      `OUR DEMAND: EXPLANATIONS. APOLOGIES. AND SOMEONE PLEASE CHECK ON THE GROUP CHAT.`,
    ],
    bellend: [
      `Thus the contest ends, while the philosophical problem of managerial self-importance remains unresolved.`,
      `Further research is recommended. Funding is unlikely, given the quality of the subject matter.`,
    ],
    pissworth: [
      `Anyway, well done to the winner. That's as much praise as you're getting out of me.`,
      `I've said my piece. Nobody will listen, and next week they'll all make the same mistakes again.`,
    ],
  };

  return choose(verdicts[journalist], seed);
}

function writerTitle(
  journalist: JournalistId,
  definition: StoryFormatDefinition,
  intel: MatchIntel
): string {
  const r = intel.result;
  const season = r.game.season;
  const w = team(r.winner, season);
  const l = team(r.loser, season);

  switch (journalist) {
    case "pembroke":
      return `${definition.name}: ${w} Against ${l}`;

    case "graves":
      return `${definition.name}: The ${l} Investigation`;

    case "mcnulty":
      return `${definition.name.toUpperCase()}! ${l.toUpperCase()} EXPOSED!`;

    case "bellend":
      return `${definition.name}: On the Nature of ${w}'s Victory`;

    case "pissworth":
      return `${definition.name}: I've Had Enough of ${manager(r.winner)}`;
  }
}

/**
 * Build ten different article structures.
 *
 * Each journalist supplies a distinct voice.
 * The selected format supplies the structure,
 * sequence, framing and presentation.
 *
 * This is deliberately not five fixed templates
 * with ten interchangeable headlines.
 */
function writeFormat(
  context: StoryContext
): WrittenStory {
  const {
    intel,
    journalist,
    definition,
    seed,
  } = context;

  const r = intel.result;
  const season = r.game.season;
  const w = team(r.winner, season);
  const l = team(r.loser, season);
  const wm = manager(r.winner);
  const lm = manager(r.loser);

  const id = journalist.id;

  const opening = writerOpening(
    id,
    intel,
    seed
  );

  const observation = writerObservation(
    id,
    intel,
    seed + 1
  );

  const alternative = writerObservation(
    id,
    intel,
    seed + 2
  );

  const verdict = writerVerdict(
    id,
    intel,
    seed + 3
  );

  const score = matchSummary(intel);
  const star = starSummary(intel);
  const loser = losingSummary(intel);
  const history = historicalSummary(intel);
  const support = secondPlayer(intel);

  const headline = writerTitle(
    id,
    definition,
    intel
  );

  const standfirst =
    `${journalist.name} presents "${definition.name}", ` +
    `examining ${w}'s ${pts(r.margin)}-point ` +
    `victory over ${l}.`;

  const formatIndex = Number(
    definition.id.split("-").length
  );

  // Every format has its own authored treatment
  // below, selected by its exact catalogue ID.
  // The fallback uses a conventional report.

  let paragraphs: string[];

  switch (definition.id) {

    // ==========================================
    // ARTHUR PEMBROKE — TEN FORMATS
    // ==========================================

    case "pembroke-match-report":
      paragraphs = [
        `${opening} ${score}`,
        `${star} ${support}`,
        `${loser} ${observation}`,
        verdict,
      ];
      break;

    case "pembroke-tactical":
      paragraphs = [
        `THE SCORING BALANCE — ${score}`,
        `THE PRIMARY CONTRIBUTOR — ${star}`,
        `THE SUPPORTING LINEUP — ${support}`,
        `THE DEFEATED SIDE — ${loser}`,
        `THE ASSESSMENT — ${observation} ${verdict}`,
      ];
      break;

    case "pembroke-profile":
      paragraphs = [
        intel.star
          ? `${intel.star.name} is the central figure in this week's examination of ${w}. His ${pts(intel.star.points)} points represented ${(intel.star.contribution * 100).toFixed(1)} per cent of the winning total.`
          : `${w}'s victory was secured through the production of its starting lineup.`,
        intel.star?.average !== null &&
        intel.star?.average !== undefined &&
        intel.star.previousStarts >= 3
          ? `Across ${intel.star.previousStarts} previous SFL regular-season starts, ${intel.star.name} averaged ${pts(intel.star.average)} points. His latest performance therefore provides a measurable comparison with established form.`
          : `The available starting history does not establish a sufficiently substantial baseline for the leading player.`,
        `${score} ${support}`,
        `${observation} ${verdict}`,
      ];
      break;

    case "pembroke-comeback":
      paragraphs = [
        `THE POSITION BEFORE THE MATCH — ${history}`,
        `THE RESPONSE — ${score}`,
        `THE INDIVIDUAL CONTRIBUTION — ${star}`,
        `THE QUESTION AHEAD — ${observation} ${verdict}`,
      ];
      break;

    case "pembroke-five-factors":
      paragraphs = [
        `1. THE OUTCOME — ${score}`,
        `2. THE LEADING PERFORMANCE — ${star}`,
        `3. THE SUPPORTING CONTRIBUTION — ${support}`,
        `4. THE LOSING LINEUP — ${loser}`,
        `5. THE BROADER CONTEXT — ${history} ${verdict}`,
      ];
      break;

    case "pembroke-losing-side":
      paragraphs = [
        `The story of this contest begins with ${l}, not ${w}. ${lm} must account for a defeat by ${pts(r.margin)} points.`,
        `${loser}`,
        `The opposition's achievement should not be overlooked. ${star} ${score}`,
        `${observation} ${verdict}`,
      ];
      break;

    case "pembroke-form-guide":
      paragraphs = [
        `CURRENT POSITION — ${score}`,
        `RECENT EVIDENCE — ${history}`,
        `PERSONNEL — ${star} ${loser}`,
        `EDITORIAL ASSESSMENT — ${observation}`,
        verdict,
      ];
      break;

    case "pembroke-rivalry":
      paragraphs = [
        intel.rivalry
          ? `${intel.rivalry} has supplied another result for the record books. ${score}`
          : `Whatever the wider significance of this fixture, ${w} has added another victory over ${l}. ${score}`,
        `${history}`,
        `${star} ${loser}`,
        `${observation} ${verdict}`,
      ];
      break;

    case "pembroke-pressure":
      paragraphs = [
        `QUESTION: What exactly went wrong for ${lm}?`,
        `ANSWER: ${score} ${loser}`,
        `QUESTION: Was the opposition simply too strong?`,
        `ANSWER: ${star} ${support}`,
        `QUESTION: What happens now?`,
        `ANSWER: ${observation} ${verdict}`,
      ];
      break;

    case "pembroke-numbers":
      paragraphs = [
        `${pts(r.winnerScore)} — Points scored by ${w}.`,
        `${pts(r.loserScore)} — Points scored by ${l}.`,
        `${pts(r.margin)} — The final margin.`,
        intel.star
          ? `${pts(intel.star.points)} — The contribution from ${intel.star.name}.`
          : `The winning lineup provided the decisive total.`,
        `${observation}`,
      ];
      break;

    // ==========================================
    // MARTIN GRAVES — TEN FORMATS
    // ==========================================

    case "graves-case-file":
      paragraphs = [
        `CASE REFERENCE: SFL-${season}-${r.game.week}-${r.loser}. SUBJECT: ${lm}.`,
        `EXHIBIT A — ${score}`,
        `EXHIBIT B — ${loser}`,
        `EXHIBIT C — ${star}`,
        `PRELIMINARY FINDING: ${observation}`,
        `CASE STATUS: ${verdict}`,
      ];
      break;

    case "graves-audit":
      paragraphs = [
        `AUDIT NOTICE: The fantasy-point accounts of ${l} have been selected for an entirely unsolicited inspection.`,
        `ACCOUNT 01 — WINNING REVENUE: ${pts(r.winnerScore)} points credited to ${w}.`,
        `ACCOUNT 02 — LOSING REVENUE: ${pts(r.loserScore)} points credited to ${l}.`,
        `ACCOUNT 03 — PERFORMANCE EXPOSURE: ${loser}`,
        `ACCOUNT 04 — COMPARATIVE PRODUCTIVITY: ${star}`,
        `AUDITOR'S OPINION: ${observation} ${verdict}`,
      ];
      break;

    case "graves-witnesses":
      paragraphs = [
        `FICTIONAL WITNESS HEARING — The following testimony is satire, not a real interview.`,
        `INVESTIGATOR: State the result for the record. SCOREBOARD: ${score}`,
        `INVESTIGATOR: Was there a significant contribution from the winning side? STATISTICAL WITNESS: ${star}`,
        `INVESTIGATOR: What can the defeated side offer in its defence? STATISTICAL WITNESS: ${loser}`,
        `INVESTIGATOR: Are we alleging actual misconduct? WITNESS: Absolutely not. ${observation}`,
        `HEARING ADJOURNED. ${verdict}`,
      ];
      break;

    case "graves-autopsy":
      paragraphs = [
        `FORENSIC REPORT — SUBJECT: The defeat of ${l}.`,
        `OBSERVED CONDITION — ${score}`,
        `PRIMARY EVIDENCE — ${loser}`,
        `COMPARATIVE EVIDENCE — ${star}`,
        `HISTORICAL RECORD — ${history}`,
        `CAUSE OF DEFEAT — ${l} finished ${pts(r.margin)} points behind the opposition. No unrecorded in-game events have been assumed.`,
        `FINAL FINDING — ${verdict}`,
      ];
      break;

    case "graves-timeline":
      paragraphs = [
        `HISTORICAL RECORD: ${history}`,
        `WEEK ${r.game.week}, ${season}: ${score}`,
        `PERFORMANCE REVIEW: ${loser}`,
        `AFTERMATH: ${observation}`,
        `INVESTIGATOR'S NOTE: This chronology concerns completed fixtures, not an invented minute-by-minute account of the game.`,
      ];
      break;

    case "graves-memo":
      paragraphs = [
        `FICTIONAL INTERNAL MEMORANDUM — TO: ${lm}. FROM: Department of Unwelcome Scrutiny. SUBJECT: The ${l} problem.`,
        `Management is advised that ${score}`,
        `The department has identified the following personnel concern: ${loser}`,
        `A competing organisation appears to have benefited from the following: ${star}`,
        `Proposed action: ${observation}`,
        `This document is satirical. No genuine internal communication has been obtained. ${verdict}`,
      ];
      break;

    case "graves-inquiry":
      paragraphs = [
        `FICTIONAL PUBLIC INQUIRY — CHAIR: This hearing will examine the affairs of ${l}.`,
        `CLERK: The confirmed facts are as follows. ${score}`,
        `CHAIR: Does the record identify any noteworthy individual performances? CLERK: ${star}`,
        `CHAIR: And the evidence concerning the defeated franchise? CLERK: ${loser}`,
        `CHAIR: What is the broader background? CLERK: ${history}`,
        `CHAIR: The committee's conclusion is recorded. ${observation}`,
        `HEARING CLOSED — ${verdict}`,
      ];
      break;

    case "graves-anomaly":
      paragraphs = [
        `QUESTION ONE: Why has this result attracted attention? ${score}`,
        `QUESTION TWO: Is the winning contribution unusually concentrated? ${star}`,
        `QUESTION THREE: Is there evidence of underperformance? ${loser}`,
        `QUESTION FOUR: Does the historical record explain anything? ${history}`,
        `FINDING: ${observation}`,
        `No wrongdoing is alleged. ${verdict}`,
      ];
      break;

    case "graves-management":
      paragraphs = [
        `THE PEOPLE VERSUS ${lm} — A fictional sporting prosecution.`,
        `CHARGE ONE: Losing to ${w}. EVIDENCE: ${score}`,
        `CHARGE TWO: Failing to prevent the opposition's production. EVIDENCE: ${star}`,
        `CHARGE THREE: Allowing the losing lineup to finish behind. EVIDENCE: ${loser}`,
        `THE DEFENCE: Fantasy football contains chance, and no specific lineup error has been established.`,
        `VERDICT: ${observation} ${verdict}`,
      ];
      break;

    case "graves-cold-case":
      paragraphs = [
        `ARCHIVE REOPENED — ${history}`,
        intel.previousMeeting
          ? `The previous meeting ended with ${team(intel.previousMeeting.winner, intel.previousMeeting.game.season)} defeating ${team(intel.previousMeeting.loser, intel.previousMeeting.game.season)} ${pts(intel.previousMeeting.winnerScore)} to ${pts(intel.previousMeeting.loserScore)}.`
          : `The investigations desk has found no earlier completed regular-season meeting in the supplied record.`,
        `NEW EVIDENCE — ${score}`,
        `PERSONNEL FINDINGS — ${star} ${loser}`,
        `CASE DISPOSITION — ${observation} ${verdict}`,
      ];
      break;

    // ==========================================
    // BAZ MCNULTY — TEN FORMATS
    // ==========================================

    case "mcnulty-scandal":
      paragraphs = [
        `${opening}`,
        `THE SHOCKING FACTS: ${score}`,
        `THE PLAYER AT THE CENTRE OF IT ALL: ${star}`,
        `${observation}`,
        verdict,
      ];
      break;

    case "mcnulty-hero":
      paragraphs = [
        `BUILD THE STATUE! The newsroom has identified the leading performer in ${w}'s victory.`,
        `${star}`,
        `${support}`,
        `And what did ${wm} contribute? A few taps on a phone, presumably. The athlete deserves the headlines.`,
        `${observation} ${verdict}`,
      ];
      break;

    case "mcnulty-outrage":
      paragraphs = [
        `QUESTION ONE: ${lm}, HOW DO YOU EXPLAIN THIS? ${score}`,
        `QUESTION TWO: WHAT HAPPENED TO THE LOSING LINEUP? ${loser}`,
        `QUESTION THREE: HOW DID THE OTHER LOT GET AWAY WITH IT? ${star}`,
        `QUESTION FOUR: WILL THERE BE CONSEQUENCES? ${observation}`,
        verdict,
      ];
      break;

    case "mcnulty-crisis":
      paragraphs = [
        `CRISIS LEVEL FIVE — THE SCOREBOARD. ${score}`,
        `CRISIS LEVEL FOUR — THE OPPOSITION. ${star}`,
        `CRISIS LEVEL THREE — THE LOSING SIDE. ${loser}`,
        `CRISIS LEVEL TWO — THE HISTORY. ${history}`,
        `CRISIS LEVEL ONE — THE MANAGER. ${observation}`,
        `EMERGENCY BROADCAST ENDS. ${verdict}`,
      ];
      break;

    case "mcnulty-humiliation":
      paragraphs = [
        `THE OFFICIAL HUMILIATION CHART — Compiled by a newsroom with no governing authority.`,
        `THIRD PLACE: ${loser}`,
        `SECOND PLACE: ${star}`,
        `FIRST PLACE: ${lm}, for presiding over the following scoreline: ${score}`,
        `SPECIAL DISHONOURABLE MENTION: ${observation}`,
      ];
      break;

    case "mcnulty-interview":
      paragraphs = [
        `EXCLUSIVE FICTIONAL INTERVIEW — No real manager was interviewed.`,
        `BAZ: ${wm}, WHAT HAPPENED? IMAGINARY MANAGER: We scored more points. ${score}`,
        `BAZ: WHO DESERVES THE CREDIT? IMAGINARY MANAGER: ${star}`,
        `BAZ: ANY MESSAGE FOR ${lm}? IMAGINARY MANAGER: ${loser}`,
        `BAZ: SO YOU'RE SAYING YOU'RE UNSTOPPABLE? IMAGINARY MANAGER: I didn't say that. BAZ: EXCLUSIVE CONFIRMATION OF TOTAL DOMINANCE.`,
        `${verdict}`,
      ];
      break;

    case "mcnulty-overreaction":
      paragraphs = [
        `IT'S OVER. THE LEAGUE IS FINISHED. ${w.toUpperCase()} HAVE WON A GAME.`,
        `${score}`,
        `Naturally, we are drawing conclusions about the entire future of the competition from this single result.`,
        `${star}`,
        `${observation} ${verdict}`,
      ];
      break;

    case "mcnulty-market":
      paragraphs = [
        `TRANSFER PANIC! Should ${lm} rip up the entire roster?`,
        `${score}`,
        `THE EVIDENCE: ${loser}`,
        `THE QUESTION: Could a hypothetical change help? Possibly. But the available data does not establish a specific bench alternative.`,
        `No trade, waiver move or negotiation is being reported here. This is pure tabloid agitation.`,
        `${observation} ${verdict}`,
      ];
      break;

    case "mcnulty-blame":
      paragraphs = [
        `WHO IS TO BLAME? THE SLOOT NEWS INVESTIGATION NOBODY WANTED.`,
        `SUSPECT THREE: The scoreboard. ${score}`,
        `SUSPECT TWO: The losing lineup. ${loser}`,
        `SUSPECT ONE: ${lm}. He is the manager, so naturally we're making this his problem.`,
        `THE ACQUITTED PARTY: ${star}`,
        `${observation} ${verdict}`,
      ];
      break;

    case "mcnulty-coronation":
      paragraphs = [
        `EMERGENCY PROCLAMATION FROM THE OFFICE OF BAZ MCNULTY.`,
        `By the completely imaginary authority vested in this newspaper, ${w} are hereby declared champions of Week ${r.game.week}.`,
        `The justification is overwhelming: ${score}`,
        `Further evidence of greatness: ${star}`,
        `DISCLAIMER: This is not an actual Slootbowl championship, playoff qualification or prediction of future results.`,
        `${observation} ${verdict}`,
      ];
      break;

    // ==========================================
    // PROFESSOR HUGO BELLEND — TEN FORMATS
    // ==========================================

    case "bellend-philosophy":
      paragraphs = [
        `${opening}`,
        `The empirical foundation is uncomplicated. ${score}`,
        `Yet the individual contribution raises questions of agency. ${star}`,
        `The defeated franchise offers an alternative meditation on suffering. ${loser}`,
        `${observation} ${verdict}`,
      ];
      break;

    case "bellend-research":
      paragraphs = [
        `ABSTRACT — This paper examines the relationship between scoring more fantasy points and winning a fantasy football match.`,
        `METHODOLOGY — The study uses one completed SFL regular-season fixture, with no claim that the sample is representative.`,
        `RESULTS — ${score} ${star}`,
        `ADDITIONAL OBSERVATIONS — ${loser}`,
        `LIMITATIONS — The research cannot establish whether managerial intelligence caused the result.`,
        `CONCLUSION — ${observation} ${verdict}`,
      ];
      break;

    case "bellend-theorem":
      paragraphs = [
        `THEOREM: A franchise that finishes with more fantasy points than its opponent will be recorded as the winner.`,
        `PREMISE I: ${w} accumulated ${pts(r.winnerScore)} points.`,
        `PREMISE II: ${l} accumulated ${pts(r.loserScore)} points.`,
        `PROOF: ${pts(r.winnerScore)} exceeds ${pts(r.loserScore)} by ${pts(r.margin)}. Therefore ${w} won. QED.`,
        `COROLLARY: ${star}`,
        `ACADEMIC SIGNIFICANCE: ${observation} ${verdict}`,
      ];
      break;

    case "bellend-history":
      paragraphs = [
        `History is littered with conflicts that participants considered world-changing. This was a fantasy football match, so the comparison must remain metaphorical.`,
        `${history}`,
        `The latest engagement ended as follows: ${score}`,
        `Its principal sporting contribution was this: ${star}`,
        `Unlike the great conflicts of antiquity, nobody's empire has fallen. ${observation}`,
        verdict,
      ];
      break;

    case "bellend-psychology":
      paragraphs = [
        `SPORTING PSYCHOLOGY — This is a satirical discussion of managerial reactions, not a clinical assessment.`,
        `${score}`,
        `The victorious manager may interpret the outcome as evidence of skill. ${star}`,
        `The defeated manager may emphasise chance. ${loser}`,
        `${observation} ${verdict}`,
      ];
      break;

    case "bellend-economics":
      paragraphs = [
        `ECONOMIC MODEL — Let one fantasy point represent one unit of wholly imaginary sporting capital.`,
        `GROSS OUTPUT — ${w}: ${pts(r.winnerScore)} units. ${l}: ${pts(r.loserScore)} units.`,
        `PRODUCTION CONCENTRATION — ${star}`,
        `PRODUCTIVITY CONCERNS — ${loser}`,
        `MARKET COMMENTARY — ${observation}`,
        `POLICY CONCLUSION — ${verdict}`,
      ];
      break;

    case "bellend-morality":
      paragraphs = [
        `IS IT JUST for one manager to celebrate while another suffers?`,
        `${score}`,
        `The argument for celebration: ${star}`,
        `The argument for sympathy: ${loser}`,
        `The counterargument: Nobody is entitled to win merely because defeat feels unfair.`,
        `${observation} ${verdict}`,
      ];
      break;

    case "bellend-lecture":
      paragraphs = [
        `FICTIONAL UNIVERSITY LECTURE — PROFESSOR BELLEND: Today we consider the tragedy of ${l}.`,
        `STUDENT: What actually happened? PROFESSOR: ${score}`,
        `STUDENT: Was there a standout player? PROFESSOR: ${star}`,
        `STUDENT: And the losing side? PROFESSOR: ${loser}`,
        `STUDENT: Why are we studying this? PROFESSOR: An excellent question. ${observation}`,
        `EXAMINATION QUESTION: Discuss whether ${lm} possesses free will, using only the final score.`,
      ];
      break;

    case "bellend-existential":
      paragraphs = [
        `What is a manager? A person who selects players. What is a defeat? ${score}`,
        `And what is control, when the outcome depends on athletes far beyond one's influence? ${star}`,
        `Perhaps ${lm} is not merely losing a match. Perhaps he is confronting the terrifying indifference of the universe.`,
        `${verdict}`,
      ];
      break;

    case "bellend-debate":
      paragraphs = [
        `FICTIONAL SCHOLARLY DEBATE — PROFESSOR A: ${w} deserved the victory because ${score}`,
        `PROFESSOR B: Deserved? A dangerous term. Consider the individual evidence: ${star}`,
        `PROFESSOR A: The losing side was simply inferior on the day. ${loser}`,
        `PROFESSOR B: But the historical context complicates your argument. ${history}`,
        `MODERATOR: Can either of you reach a useful conclusion?`,
        `BOTH PROFESSORS: No. ${verdict}`,
      ];
      break;

    // ==========================================
    // DEREK PISSWORTH — TEN FORMATS
    // ==========================================

    case "pissworth-opinion":
      paragraphs = [
        `${opening}`,
        `${score}`,
        `${star}`,
        `${observation}`,
        verdict,
      ];
      break;

    case "pissworth-letter":
      paragraphs = [
        `Dear ${lm},`,
        `I see you've lost again. Or at least you've lost this particular match. ${score}`,
        `Before you start sending excuses around, consider this: ${loser}`,
        `And look at what the other lot managed: ${star}`,
        `${observation}`,
        `Yours with very limited sympathy, Derek Pissworth.`,
      ];
      break;

    case "pissworth-old-days":
      paragraphs = [
        `BACK IN MY DAY, we didn't need a committee to tell us who'd won. We looked at the bloody scoreboard.`,
        `${score}`,
        `People nowadays will spend hours explaining why ${wm} is a genius. ${star}`,
        `I'm not claiming the old days were statistically better. I'm claiming everyone was less insufferable.`,
        `${observation} ${verdict}`,
      ];
      break;

    case "pissworth-advice":
      paragraphs = [
        `Nobody asked me for advice. That's never stopped me before.`,
        `RULE ONE: Score more points than the opposition. ${score}`,
        `RULE TWO: Pay attention when your players underperform. ${loser}`,
        `RULE THREE: Notice when the opposition has a proper performer. ${star}`,
        `RULE FOUR: Stop making excuses. ${observation}`,
        `RULE FIVE: Don't thank me. ${verdict}`,
      ];
      break;

    case "pissworth-grudge":
      paragraphs = [
        `I'm not holding a grudge. I'm merely remembering everything.`,
        `${history}`,
        `And now we have this latest nonsense: ${score}`,
        `I'll give credit where it's due. ${star}`,
        `But don't expect me to forget the rest of it. ${observation}`,
        verdict,
      ];
      break;

    case "pissworth-pub":
      paragraphs = [
        `FICTIONAL CONVERSATION DOWN THE PUB.`,
        `MATE: Derek, did you see ${w} beat ${l}? DEREK: Unfortunately. ${score}`,
        `MATE: Some performance from the winning side, though. DEREK: ${star}`,
        `MATE: Bit harsh on ${lm}, aren't you? DEREK: ${loser}`,
        `MATE: Another pint? DEREK: Finally, a sensible suggestion.`,
        `${observation} ${verdict}`,
      ];
      break;

    case "pissworth-truths":
      paragraphs = [
        `TRUTH ONE: Winning doesn't automatically make ${wm} a genius. ${score}`,
        `TRUTH TWO: Players deserve more credit than managers. ${star}`,
        `TRUTH THREE: Losing managers don't get to rewrite the score. ${loser}`,
        `TRUTH FOUR: The past doesn't disappear because the latest result is convenient. ${history}`,
        `TRUTH FIVE: ${observation}`,
        verdict,
      ];
      break;

    case "pissworth-review":
      paragraphs = [
        `MANAGERIAL PERFORMANCE APPRAISAL — EMPLOYEE: ${lm}.`,
        `RESULTS CATEGORY — ${score}`,
        `PLAYER PRODUCTION — ${loser}`,
        `COMPETITOR BENCHMARK — ${star}`,
        `PREVIOUS PERFORMANCE CONTEXT — ${history}`,
        `MANAGER'S DEVELOPMENT PLAN — ${observation}`,
        `FINAL APPRAISAL — ${verdict}`,
      ];
      break;

    case "pissworth-predictions":
      paragraphs = [
        `UNPOPULAR PREDICTION NUMBER THREE: Somebody will claim this result proves far more than it does.`,
        `THE EVIDENCE: ${score}`,
        `UNPOPULAR PREDICTION NUMBER TWO: ${wm} will take credit for a performance like this. ${star}`,
        `UNPOPULAR PREDICTION NUMBER ONE: ${lm} will have an explanation ready before anyone asks. ${loser}`,
        `These are opinions, not confirmed future events. ${observation}`,
        verdict,
      ];
      break;

    case "pissworth-apology":
      paragraphs = [
        `Dear ${wm},`,
        `Apparently I owe you some credit. ${score}`,
        `I'll admit this much: ${star}`,
        `That doesn't mean I approve of the celebrations, the smugness or the inevitable group-chat nonsense.`,
        `${observation}`,
        `Consider this my apology. It's the only one you're getting. Derek.`,
      ];
      break;

    default:
      paragraphs = [
        `${opening} ${score}`,
        `${star} ${support}`,
        `${loser} ${history}`,
        `${observation} ${verdict}`,
      ];
      break;
  }

  // Stable optional variation in the supporting
  // commentary, without changing the format.
  if (
    paragraphs.length >= 4 &&
    seed % 4 === 0 &&
    alternative !== observation
  ) {
    const insertAt = paragraphs.length - 1;

    paragraphs.splice(insertAt, 0, alternative);
  }

  // Silence an unused-index warning while
  // keeping catalogue IDs as the source of truth.
  void formatIndex;

  return {
    headline,
    standfirst,
    paragraphs,
  };
}

/**
 * Every journalist receives exactly one match.
 *
 * Assignment is deterministic and independent
 * of which newspaper edition was opened first.
 */
function assignJournalists(
  stories: MatchIntel[],
  season: string,
  week: number
): Journalist[] {
  const offset =
    hash(Number(season), week) %
    JOURNALISTS.length;

  const available = [
    ...JOURNALISTS.slice(offset),
    ...JOURNALISTS.slice(0, offset),
  ];

  const assigned: Array<Journalist | null> =
    Array(stories.length).fill(null);

  const priorities: {
    id: JournalistId;
    index: number;
    strength: number;
  }[] = [];

  stories.forEach((story, index) => {
    if (story.collapse) {
      priorities.push({
        id: "graves",
        index,
        strength:
          Math.abs(story.collapse.difference ?? 0),
      });
    }

    if (story.result.margin >= 30) {
      priorities.push({
        id: "mcnulty",
        index,
        strength: story.result.margin,
      });
    }

    if (story.angle === "ordinary") {
      priorities.push({
        id: "pissworth",
        index,
        strength: 5,
      });
    }
  });

  priorities.sort(
    (a, b) => b.strength - a.strength
  );

  const used = new Set<JournalistId>();

  for (const priority of priorities) {
    if (
      assigned[priority.index] ||
      used.has(priority.id)
    ) {
      continue;
    }

    const journalist = JOURNALISTS.find(
      (j) => j.id === priority.id
    );

    if (!journalist) continue;

    assigned[priority.index] = journalist;
    used.add(journalist.id);
  }

  const remaining = available.filter(
    (j) => !used.has(j.id)
  );

  let next = 0;

  return assigned.map(
    (journalist) =>
      journalist ?? remaining[next++]
  );
}

function validResults(
  games: HistoricalMatchup[],
  season: string,
  week: number
): NewsResult[] | null {
  const selected = games.filter(
    (game) =>
      game.season === season &&
      game.week === week &&
      completed(game)
  );

  if (selected.length !== 5) return null;

  const rosters = new Set<number>();

  for (const game of selected) {
    rosters.add(game.rosterA);
    rosters.add(game.rosterB);
  }

  if (rosters.size !== 10) return null;

  const results = selected.map(resultOf);

  if (results.some((r) => r === null)) {
    return null;
  }

  return results as NewsResult[];
}

function orderedStories(
  results: NewsResult[],
  history: HistoricalMatchup[],
  players: PlayerDatabase
): MatchIntel[] {
  return results
    .map((result) =>
      investigate(result, history, players)
    )
    .sort(
      (a, b) =>
        b.importance - a.importance ||
        b.result.margin - a.result.margin ||
        a.result.winner - b.result.winner
    );
}

type FormatHistory = Record<
  JournalistId,
  string[]
>;

function emptyFormatHistory(): FormatHistory {
  return {
    pembroke: [],
    graves: [],
    mcnulty: [],
    bellend: [],
    pissworth: [],
  };
}

/**
 * Reconstruct the format history by replaying
 * earlier completed editions chronologically.
 *
 * No storage required. Every edition will make
 * the same choices regardless of navigation order.
 *
 * The history spans seasons, so Week 1 doesn't
 * automatically reset a journalist's rotation.
 */
function reconstructFormatHistory(
  season: string,
  week: number,
  history: HistoricalMatchup[],
  players: PlayerDatabase
): FormatHistory {
  const formatHistory = emptyFormatHistory();

  const editions = new Map<
    string,
    {
      season: string;
      week: number;
      games: HistoricalMatchup[];
    }
  >();

  for (const game of history) {
    if (!completed(game)) continue;

    const beforeTarget =
      Number(game.season) < Number(season) ||
      (
        game.season === season &&
        game.week < week
      );

    if (!beforeTarget) continue;

    const key = `${game.season}-${game.week}`;

    if (!editions.has(key)) {
      editions.set(key, {
        season: game.season,
        week: game.week,
        games: [],
      });
    }

    editions.get(key)!.games.push(game);
  }

  const ordered = [...editions.values()].sort(
    (a, b) =>
      Number(a.season) - Number(b.season) ||
      a.week - b.week
  );

  for (const edition of ordered) {
    const results = validResults(
      edition.games,
      edition.season,
      edition.week
    );

    if (!results) continue;

    const stories = orderedStories(
      results,
      history,
      players
    );

    const journalists = assignJournalists(
      stories,
      edition.season,
      edition.week
    );

    stories.forEach((story, index) => {
      const journalist = journalists[index];
      const published =
        formatHistory[journalist.id];

      const selected = selectStoryFormat(
        journalist.id,
        published.length,
        editorialEvidence(story, results),
        published
      );

      published.push(selected.id);
    });
  }

  return formatHistory;
}

/**
 * PUBLIC ENTRY POINT
 */
export function buildNewsEdition(
  season: string,
  week: number,
  currentGames: HistoricalMatchup[],
  history: HistoricalMatchup[],
  players: PlayerDatabase
): NewsEdition | null {
  if (
    !Number.isInteger(week) ||
    week < 1 ||
    week > 14
  ) {
    return null;
  }

  const results = validResults(
    currentGames,
    season,
    week
  );

  if (!results) return null;

  const stories = orderedStories(
    results,
    history,
    players
  );

  const journalists = assignJournalists(
    stories,
    season,
    week
  );

  const formatHistory = reconstructFormatHistory(
    season,
    week,
    history,
    players
  );

  const articles: NewsArticle[] = stories.map(
    (story, index) => {
      const journalist = journalists[index];

      const published =
        formatHistory[journalist.id];

      const definition = selectStoryFormat(
        journalist.id,
        published.length,
        editorialEvidence(story, results),
        published
      );

      published.push(definition.id);

      const seed = hash(
        Number(season),
        week,
        story.result.winner,
        story.result.loser,
        index
      );

      const written = writeFormat({
        intel: story,
        journalist,
        definition,
        seed,
      });

      const category =
        journalist.id === "graves"
          ? "SPECIAL INVESTIGATION"
          : journalist.id === "bellend"
            ? "THE LONG READ"
            : journalist.id === "pissworth"
              ? "OPINION"
              : journalist.id === "mcnulty"
                ? "EXCLUSIVE"
                : "MATCH REPORT";

      return {
        id:
          `${season}-${week}-` +
          `${story.result.winner}-` +
          `${story.result.loser}`,
        journalist: journalist.id,
        byline: journalist.name,
        role: journalist.role,

        // Keep existing page styling intact.
        format: journalist.format,

        angle: story.angle,

        eyebrow:
          index === 0
            ? `GAME OF THE WEEK · ${definition.name.toUpperCase()}`
            : `${category} · ${definition.name.toUpperCase()}`,

        headline: written.headline,
        standfirst: written.standfirst,
        paragraphs: written.paragraphs,
        featured: index === 0,
        result: story.result,
      };
    }
  );

  const biggestDefeat = [...stories].sort(
    (a, b) =>
      b.result.margin - a.result.margin
  )[0].result;

  return {
    season,
    week,
    articles,
    gameOfTheWeek: articles[0],
    biggestDefeat,
  };
}

export async function fetchNewsPlayers():
  Promise<PlayerDatabase> {
  try {
    const response = await fetch(
      "https://api.sleeper.app/v1/players/nfl",
      {
        next: {
          revalidate: 86400,
        },
      }
    );

    if (!response.ok) return {};

    return (
      await response.json()
    ) as PlayerDatabase;
  } catch {
    return {};
  }
}
