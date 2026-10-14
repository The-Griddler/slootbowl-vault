
import type { HistoricalMatchup } from "./sleeper";

/**
 * SLOOT NEWS EDITORIAL ENGINE
 *
 * Self-contained, deterministic journalism.
 * No AI API, subscriptions or external writing services.
 *
 * Sleeper provides the underlying scores and player names.
 * This module provides editorial judgement and prose.
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
  star: NewsPlayer | null;
  losingStar: NewsPlayer | null;
  collapse: NewsPlayer | null;
  surprise: NewsPlayer | null;
  rivalry: string | null;
  angle: StoryAngle;
  importance: number;
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

function points(n: number): string {
  return n.toFixed(2);
}

function hash(...values: number[]): number {
  let value = 2166136261;

  for (const n of values) {
    value = Math.imul(value ^ Math.trunc(n), 16777619);
  }

  return value >>> 0;
}

function choose<T>(
  choices: readonly T[],
  seed: number
): T {
  return choices[seed % choices.length];
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
      (r) =>
        (r.a === a && r.b === b) ||
        (r.a === b && r.b === a)
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
 * Historical averages use only completed SFL
 * regular-season starts before the target game.
 *
 * A player's previous appearances for other
 * franchises still count towards their SFL average.
 */
function previousScores(
  id: string,
  target: HistoricalMatchup,
  history: HistoricalMatchup[]
): number[] {
  const found: number[] = [];

  for (const game of history) {
    if (!completed(game)) continue;

    const earlier =
      Number(game.season) < Number(target.season) ||
      (
        game.season === target.season &&
        game.week < target.week
      );

    if (!earlier) continue;

    const sides = [
      [game.startersA, game.startersPointsA],
      [game.startersB, game.startersPointsB],
    ] as const;

    for (const [ids, scores] of sides) {
      const index = ids.indexOf(id);

      if (
        index !== -1 &&
        Number.isFinite(scores[index])
      ) {
        found.push(scores[index]);
      }
    }
  }

  return found;
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

  importance += Math.min(result.margin, 50) * 0.4;

  return {
    result,
    star,
    losingStar,
    collapse,
    surprise,
    rivalry,
    angle,
    importance,
  };
}

function evidence(intel: MatchIntel): string[] {
  const { result, star, collapse, surprise } = intel;
  const season = result.game.season;

  const lines = [
    `The official score was ${team(result.winner, season)} ${points(result.winnerScore)}, ${team(result.loser, season)} ${points(result.loserScore)}.`,
    `The winning margin was ${points(result.margin)} points.`,
  ];

  if (star) {
    lines.push(
      `${star.name} scored ${points(star.points)} points for the winning side, representing ${(star.contribution * 100).toFixed(1)}% of its total.`
    );
  }

  if (
    collapse &&
    collapse.average !== null
  ) {
    lines.push(
      `${collapse.name} scored ${points(collapse.points)} against a previous SFL starting average of ${points(collapse.average)} across ${collapse.previousStarts} starts.`
    );
  }

  if (
    surprise &&
    surprise.average !== null
  ) {
    lines.push(
      `${surprise.name} exceeded his previous SFL starting average by ${points(surprise.difference ?? 0)} points.`
    );
  }

  return lines;
}

/**
 * PEMBROKE:
 * Traditional match reporting.
 * Longer observations, restrained humour.
 */
function writePembroke(
  intel: MatchIntel,
  seed: number
): Pick<
  NewsArticle,
  "headline" | "standfirst" | "paragraphs"
> {
  const { result, star, collapse } = intel;
  const season = result.game.season;
  const w = team(result.winner, season);
  const l = team(result.loser, season);

  const headline = choose(
    [
      `${w} Overcome ${l} in Week ${result.game.week}`,
      `${w} Secure Victory as ${l} Fall Short`,
      `${w} Make Their Mark Against ${l}`,
    ],
    seed
  );

  const standfirst =
    `${w} emerged with a ${points(result.margin)}-point victory in a contest that offered rather more questions for the losing manager than the winner.`;

  const paragraphs = [
    `${w} defeated ${l} ${points(result.winnerScore)} to ${points(result.loserScore)}, a result that was ultimately decided by the difference in production across the two starting lineups. ${manager(result.winner)} will be satisfied with the outcome, although the performance itself deserves closer inspection.`,
  ];

  if (star) {
    paragraphs.push(
      `${star.name} was the outstanding contributor for ${w}, finishing with ${points(star.points)} points. That amounted to ${(star.contribution * 100).toFixed(1)} per cent of the team's total and provided the foundation on which the victory was built.`
    );
  }

  if (
    collapse &&
    collapse.average !== null
  ) {
    paragraphs.push(
      `For ${l}, the performance of ${collapse.name} was particularly disappointing. His ${points(collapse.points)} points fell below a previous SFL starting average of ${points(collapse.average)}. It would be unfair to attribute the entire defeat to one player, but the discrepancy was hardly helpful.`
    );
  } else {
    paragraphs.push(
      `${manager(result.loser)} must now assess a defeat by ${points(result.margin)} points. There will be opportunities to recover, although describing them as opportunities does rather depend on one's confidence in the management.`
    );
  }

  if (intel.rivalry) {
    paragraphs.push(
      `The significance of ${intel.rivalry} ensures that this result will be remembered longer than the average regular-season encounter. Neither manager has ever demonstrated much interest in letting these matters rest.`
    );
  }

  return { headline, standfirst, paragraphs };
}

/**
 * GRAVES:
 * Investigation and case-file structure.
 * Evidence first, absurd conclusions second.
 */
function writeGraves(
  intel: MatchIntel,
  seed: number
): Pick<
  NewsArticle,
  "headline" | "standfirst" | "paragraphs"
> {
  const { result, collapse } = intel;
  const season = result.game.season;
  const l = team(result.loser, season);

  const headline = choose(
    [
      `EXCLUSIVE: Inside the Collapse of ${l}`,
      `The ${l} Files: What the Numbers Reveal`,
      `Sloot News Investigates Another Disturbing Defeat`,
    ],
    seed
  );

  const standfirst =
    "Our investigations desk has reviewed the evidence. The findings are troubling, although nobody has requested an actual investigation.";

  const facts = evidence(intel);

  const paragraphs = [
    `CASE REFERENCE: SFL-${season}-${result.game.week}-${result.loser}. The subject of this inquiry is ${manager(result.loser)}, whose franchise has suffered a defeat requiring immediate scrutiny. The investigation is unofficial, unsolicited and almost certainly unwelcome.`,
    ...facts.map(
      (fact, index) =>
        `EXHIBIT ${String.fromCharCode(65 + index)} — ${fact}`
    ),
  ];

  if (collapse) {
    paragraphs.push(
      `PERSON OF INTEREST: ${collapse.name}. Investigators have identified a significant shortfall against the player's previous SFL form. This is not evidence of misconduct, but the newsroom has never allowed that distinction to obstruct a compelling headline.`
    );
  }

  paragraphs.push(
    choose(
      [
        `PRELIMINARY FINDING: The defeat appears to have resulted from scoring fewer points than the opposition. Investigators are exploring whether ${manager(result.loser)} was aware of this requirement before submitting a lineup.`,
        `RECOMMENDATION: An independent review of ${manager(result.loser)}'s decision-making is advised. The review will be chaired by whichever league member finds the situation funniest.`,
        `CASE STATUS: Open. The manager has not been charged with anything, largely because incompetence remains technically legal under SFL regulations.`,
      ],
      seed + 5
    )
  );

  return { headline, standfirst, paragraphs };
}

/**
 * MCNULTY:
 * Tabloid fury.
 * Short sentences and theatrical outrage.
 */
function writeMcNulty(
  intel: MatchIntel,
  seed: number
): Pick<
  NewsArticle,
  "headline" | "standfirst" | "paragraphs"
> {
  const { result, star, collapse } = intel;
  const season = result.game.season;
  const w = team(result.winner, season);
  const l = team(result.loser, season);

  const headline = choose(
    [
      `${l} HUMILIATED! QUESTIONS MUST BE ASKED!`,
      `${w} WIN! ${l} IN BITS!`,
      `${manager(result.loser).toUpperCase()} HAS SOME EXPLAINING TO DO`,
    ],
    seed
  );

  const standfirst =
    `${points(result.margin)} points separated the sides. The consequences for group-chat dignity may be considerably greater.`;

  const paragraphs = [
    `${points(result.winnerScore)} to ${points(result.loserScore)}. Read it again. That's the score. ${w} have won. ${l} have not. Absolutely devastating developments for anyone foolish enough to support the latter.`,
  ];

  if (star) {
    paragraphs.push(
      `${star.name}. ${points(star.points)} POINTS. One man doing an extraordinary amount of damage while ${manager(result.loser)} watched the disaster unfold.`
    );
  }

  if (
    collapse &&
    collapse.average !== null
  ) {
    paragraphs.push(
      `AND WHAT ABOUT ${collapse.name.toUpperCase()}? ${points(collapse.points)} points! Previous SFL average: ${points(collapse.average)}! Somebody get ${manager(result.loser)} a chair. Preferably one facing away from the television.`
    );
  } else {
    paragraphs.push(
      `${manager(result.loser)} will have explanations. Excuses, probably. Charts, possibly. None of them change the result.`
    );
  }

  paragraphs.push(
    choose(
      [
        `This is a football emergency. Not a real one, obviously. But the kind that demands immediate, wildly disproportionate attention.`,
        `There are defeats. There are disasters. And then there are results that should require a written apology to everyone who bothered checking the scores.`,
        `The SFL deserves answers. Failing that, we'll settle for screenshots of the losing manager having a meltdown.`,
      ],
      seed + 9
    )
  );

  return { headline, standfirst, paragraphs };
}

/**
 * BELLEND:
 * Academic essay.
 * Pompous analysis of deeply trivial events.
 */
function writeBellend(
  intel: MatchIntel,
  seed: number
): Pick<
  NewsArticle,
  "headline" | "standfirst" | "paragraphs"
> {
  const { result, star } = intel;
  const season = result.game.season;
  const w = team(result.winner, season);
  const l = team(result.loser, season);

  const headline = choose(
    [
      `On the Philosophical Bankruptcy of ${l}`,
      `A Study in Victory, Failure and ${manager(result.loser)}`,
      `The ${w} Paradox: An Essay on Competitive Suffering`,
    ],
    seed
  );

  const standfirst =
    "Professor Hugo Bellend considers the metaphysical implications of a sporting result nobody asked him to analyse.";

  const paragraphs = [
    `To understand the events of Week ${result.game.week}, we must first interrogate the very concept of success. Is victory merely the accumulation of fantasy points? Or is it, as the ancient philosophers might have argued had they possessed smartphones, the triumph of one deeply flawed individual over another?`,
    `The empirical evidence is straightforward. ${w} scored ${points(result.winnerScore)} points. ${l} scored ${points(result.loserScore)}. The resulting difference of ${points(result.margin)} points appears small when measured against the infinite vastness of the universe, yet has acquired enormous significance in the mind of ${manager(result.loser)}.`,
  ];

  if (star) {
    paragraphs.push(
      `${star.name}, who produced ${points(star.points)} points, occupies an intriguing position within this philosophical framework. Was his contribution the product of managerial agency, athletic excellence or simply the cruel indifference of chance? The distinction is especially uncomfortable for ${manager(result.winner)}, who would prefer the first explanation.`
    );
  }

  paragraphs.push(
    choose(
      [
        `We are left with a fundamental paradox: the winner believes the result proves his intelligence, while the loser believes it disproves the legitimacy of the competition. Both positions cannot be correct. It is entirely possible that neither is.`,
        `Perhaps the true tragedy is not that ${l} lost, but that ${manager(result.loser)} will spend the coming week constructing a narrative in which this was somehow inevitable and therefore not his responsibility.`,
        `In conclusion, this result offers a valuable contribution to the study of human delusion. The university has declined to fund further research, citing a complete absence of academic merit.`,
      ],
      seed + 11
    )
  );

  return { headline, standfirst, paragraphs };
}

/**
 * PISSWORTH:
 * Bitter former manager.
 * Opinionated, conversational and easily distracted.
 */
function writePissworth(
  intel: MatchIntel,
  seed: number
): Pick<
  NewsArticle,
  "headline" | "standfirst" | "paragraphs"
> {
  const { result, star, losingStar } = intel;
  const season = result.game.season;
  const w = team(result.winner, season);
  const l = team(result.loser, season);

  const headline = choose(
    [
      `Don't Tell Me ${w} Are Suddenly Brilliant`,
      `I've Seen Better Management in a Pub Car Park`,
      `${manager(result.winner)} Wins Again. Wonderful.`,
    ],
    seed
  );

  const standfirst =
    "Derek Pissworth has opinions. The editors have once again failed to prevent him from publishing them.";

  const paragraphs = [
    `I've been around this league long enough to know that a ${points(result.winnerScore)}–${points(result.loserScore)} victory doesn't automatically make ${manager(result.winner)} some kind of tactical genius. It means his players scored more points. That's it. Apparently we're supposed to throw a parade.`,
  ];

  if (star) {
    paragraphs.push(
      `Look at ${star.name}. ${points(star.points)} points. Excellent performance. Absolutely fair play to the lad. But why exactly is ${manager(result.winner)} taking the congratulations? Did he catch the passes? Did he score the touchdowns? No. He pressed a button on his phone.`
    );
  }

  if (
    losingStar &&
    losingStar.points >= 25
  ) {
    paragraphs.push(
      `And spare a thought for ${losingStar.name}, who managed ${points(losingStar.points)} points for ${l} and still ended up on the losing side. I've worked with people like that. You put in a proper shift and the rest of the organisation lets you down. Usually management.`
    );
  } else {
    paragraphs.push(
      `${manager(result.loser)} will be disappointed. Good. He should be. Losing by ${points(result.margin)} points isn't something you fix by posting a motivational message in the group chat.`
    );
  }

  paragraphs.push(
    choose(
      [
        `Back in my day we didn't need elaborate analytics to tell us who was rubbish. We looked at the scores and used our eyes. Nobody wants to hear that anymore.`,
        `Anyway, congratulations to ${w}. Enjoy it. I've seen enough false dawns in this competition to know how quickly everyone starts calling themselves a contender.`,
        `They'll call this analysis old-fashioned. Fine. At least old-fashioned analysis doesn't require me to pretend ${manager(result.winner)} has reinvented the sport.`,
      ],
      seed + 13
    )
  );

  return { headline, standfirst, paragraphs };
}

const WRITERS: Record<
  JournalistId,
  (
    intel: MatchIntel,
    seed: number
  ) => Pick<
    NewsArticle,
    "headline" | "standfirst" | "paragraphs"
  >
> = {
  pembroke: writePembroke,
  graves: writeGraves,
  mcnulty: writeMcNulty,
  bellend: writeBellend,
  pissworth: writePissworth,
};

/**
 * Assigns every journalist exactly one match.
 *
 * Assignment changes deterministically across
 * seasons and weeks. The strongest story is not
 * permanently assigned to the same journalist.
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

  // Prefer the investigator for genuine collapses,
  // and the tabloid writer for particularly ugly
  // defeats, while preserving one writer per game.
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
    (journalist) => journalist ?? remaining[next++]
  );
}

/**
 * Public entry point.
 *
 * Returns null unless the edition contains
 * exactly five completed, non-tied matches
 * involving ten distinct franchises.
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

  const games = currentGames.filter(
    (game) =>
      game.season === season &&
      game.week === week &&
      completed(game)
  );

  if (games.length !== 5) return null;

  const rosters = new Set<number>();

  for (const game of games) {
    rosters.add(game.rosterA);
    rosters.add(game.rosterB);
  }

  if (rosters.size !== 10) return null;

  const results = games.map(resultOf);

  if (results.some((result) => result === null)) {
    return null;
  }

  const stories = (
    results as NewsResult[]
  ).map((result) =>
    investigate(result, history, players)
  );

  stories.sort(
    (a, b) =>
      b.importance - a.importance ||
      b.result.margin - a.result.margin ||
      a.result.winner - b.result.winner
  );

  const journalists = assignJournalists(
    stories,
    season,
    week
  );

  const articles: NewsArticle[] = stories.map(
    (story, index) => {
      const journalist = journalists[index];

      const seed = hash(
        Number(season),
        week,
        story.result.winner,
        story.result.loser,
        index
      );

      const written = WRITERS[journalist.id](
        story,
        seed
      );

      return {
        id:
          `${season}-${week}-` +
          `${story.result.winner}-` +
          `${story.result.loser}`,
        journalist: journalist.id,
        byline: journalist.name,
        role: journalist.role,
        format: journalist.format,
        angle: story.angle,
        eyebrow:
          index === 0
            ? "GAME OF THE WEEK"
            : journalist.format === "case-file"
              ? "SPECIAL INVESTIGATION"
              : journalist.format === "essay"
                ? "THE LONG READ"
                : journalist.format === "column"
                  ? "OPINION"
                  : journalist.format === "tabloid"
                    ? "EXCLUSIVE"
                    : "MATCH REPORT",
        headline: written.headline,
        standfirst: written.standfirst,
        paragraphs: written.paragraphs,
        featured: index === 0,
        result: story.result,
      };
    }
  );

  const biggestDefeat = [...stories]
    .sort(
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
