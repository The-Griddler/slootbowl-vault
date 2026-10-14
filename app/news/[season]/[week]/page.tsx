
import Link from "next/link";
import {
  getHistoricalData,
  type HistoricalMatchup,
} from "../../../../lib/sleeper";

type PageProps = {
  params: Promise<{
    season: string;
    week: string;
  }>;
};

type Result = {
  game: HistoricalMatchup;
  winner: number;
  loser: number;
  winnerScore: number;
  loserScore: number;
  margin: number;
  total: number;
};

type PlayerInfo = {
  first_name?: string;
  last_name?: string;
  full_name?: string;
  position?: string;
};

type PlayerDatabase = Record<string, PlayerInfo>;

type Performance = {
  id: string;
  name: string;
  points: number;
  roster: number;
  average: number | null;
  starts: number;
  difference: number | null;
  share: number;
};

type Intelligence = {
  winningStar: Performance | null;
  losingStar: Performance | null;
  disappointment: Performance | null;
  surprise: Performance | null;
};

type Article = {
  title: string;
  paragraphs: string[];
};

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

const LORE: Record<number, string[]> = {
  1: [
    "Ed Nelms has requested an independent investigation. The proposed panel consists of Ed, his reflection and whichever member of the group chat agrees with him.",
    "The Ballbags remain on the verge of something special. Unfortunately, the verge appears to be several thousand miles long.",
    "Sloot News remains committed to providing the Ballbags with the favourable coverage their commissioner believes he deserves.",
  ],
  2: [
    "Ben Smith remains the inaugural Slootbowl champion, a fact Cambridge supporters are contractually obliged to mention whenever the present becomes uncomfortable.",
    "Cambridge have conquered the SFL before. Their attempts to recreate those glory days increasingly resemble a man microwaving the same disappointing leftovers.",
    "The Cum Sluts' championship pedigree is beyond dispute. Its usefulness in the present day is another matter.",
  ],
  3: [
    "Jake Greenwood has accumulated an impressive collection of postseason appearances and absolutely no Slootbowl trophies.",
    "Grimsby supporters have been promised progress so often that the word has effectively lost all meaning.",
    "The Chode Chokers continue pursuing a championship, which remains an unusually elaborate way of avoiding actually winning one.",
  ],
  4: [
    "George Pendleton has won the Slootbowl before and considers that sufficient evidence that every subsequent defeat is an administrative error.",
    "The Isle of Wight's championship history is a source of enormous pride, particularly to George, who will explain it without being asked.",
    "George's ability to build contenders remains impressive. His ability to behave normally about fantasy football does not.",
  ],
  5: [
    "Ryan Whiting has spent years trying to turn Grays Town into a serious contender. Unfortunately, serious contenders are expected to produce actual results.",
    "The Fingerblasters remain committed to pursuing glory, despite mounting evidence that glory has blocked their number.",
    "Grays Town's relationship with success remains complicated, although Ryan insists the paperwork is progressing nicely.",
  ],
  6: [
    "Garrett Etheridge's regular-season competence continues to raise questions about what precisely happens when the playoffs arrive.",
    "Lincoln's championship window remains open. Garrett is standing beneath it, wondering why nobody has thrown him a trophy.",
    "The Nonces have assembled plenty of talent. Whether talent can cure Garrett's traditional December difficulties remains unknown.",
  ],
  7: [
    "Ollie Payne has developed an unusual talent for making Kalamata appear either extremely dangerous or completely unfit for organised sport.",
    "The Dirty Vegans remain one of the league's least predictable institutions, occasionally including their own management.",
    "Kalamata's relationship with consistency remains about as stable as a kebab-shop toilet at four in the morning.",
  ],
  8: [
    "Jack Brannigan has historically treated future draft picks like loose change in a pub fruit machine.",
    "Weybiza supporters continue awaiting the promised return on Jack's investment strategy. Financial experts recommend patience and possibly a solicitor.",
    "The BAB's once looked like the future of the OBFC. Jack has since devoted considerable resources to locating that future.",
  ],
  9: [
    "Tarl Brayer has suffered enough narrow postseason defeats to qualify for government-funded counselling.",
    "East Rutherford supporters know better than most that a few fantasy points can separate eternal glory from several months of public humiliation.",
    "The Shitlickers have spent years flirting with greatness, only to discover that greatness has a boyfriend and his name is usually George Pendleton.",
  ],
  10: [
    "Josh Thomas has won consecutive Slootbowls despite previously treating the regular season like an optional warm-up exercise.",
    "Chad's ability to turn questionable regular-season performances into December glory remains deeply irritating to everyone else.",
    "The Moist Discharge have repeatedly demonstrated that the normal laws of sporting logic do not apply to Josh Thomas.",
  ],
};

const SPONSORS = [
  "The SFL Department of Questionable Decisions",
  "Jack Brannigan's Retirement Fund",
  "Tarl Brayer's Postseason Counselling Service",
  "The Garrett Etheridge Trophy Cabinet Company",
  "Ed Nelms' Independent Ethics Committee",
  "The Josh Thomas Regular Season Appreciation Society",
  "The Ollie Payne School of Financial Planning",
  "Grimsby Chode Chokers' Championship Museum",
];

const RIVALRIES = [
  {
    a: 1,
    b: 3,
    title: "The Shotty Bowl",
    description:
      "Ed Nelms and Jake Greenwood have treated this fixture like a personal vendetta since the league's earliest days.",
  },
  {
    a: 4,
    b: 7,
    title: "The Paddletap Bowl",
    description:
      "George Pendleton and Ollie Payne share a rivalry that has never required good football to become deeply unpleasant.",
  },
  {
    a: 4,
    b: 9,
    title: "The OBFC Grudge Match",
    description:
      "George Pendleton and Tarl Brayer share a history littered with heartbreak, narrow margins and an unhealthy amount of resentment.",
  },
  {
    a: 1,
    b: 10,
    title: "The Commissioner's Nightmare",
    description:
      "Ed Nelms and Josh Thomas have history, including Chad's deeply irritating habit of producing its best football when the Ballbags would prefer otherwise.",
  },
];

const panel: React.CSSProperties = {
  background: "#151b23",
  border: "1px solid #27303b",
  borderRadius: "18px",
  padding: "20px",
};

const muted: React.CSSProperties = {
  color: "#929eae",
};

function teamName(id: number, season: string) {
  if (id === 1 && Number(season) < 2026) {
    return "Perth Ballbags";
  }
  return TEAMS[id] ?? `Franchise ${id}`;
}

function manager(id: number) {
  return MANAGERS[id] ?? "Unknown Manager";
}

function pts(value: number) {
  return value.toFixed(2);
}

function pick<T>(items: T[], seed: number): T {
  return items[
    Math.abs(Math.trunc(seed)) % items.length
  ];
}

function seedFor(result: Result) {
  return (
    Number(result.game.season) * 31 +
    result.game.week * 17 +
    result.winner * 13 +
    result.loser * 7
  );
}

function rivalryFor(a: number, b: number) {
  return RIVALRIES.find(
    (r) =>
      (r.a === a && r.b === b) ||
      (r.a === b && r.b === a)
  );
}

function isComplete(game: HistoricalMatchup) {
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

function toResult(game: HistoricalMatchup): Result | null {
  if (!isComplete(game)) return null;
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

async function getPlayerDatabase(): Promise<PlayerDatabase> {
  try {
    const response = await fetch(
      "https://api.sleeper.app/v1/players/nfl",
      { next: { revalidate: 86400 } }
    );

    if (!response.ok) return {};

    return (await response.json()) as PlayerDatabase;
  } catch {
    return {};
  }
}

function historicalScores(
  playerId: string,
  game: HistoricalMatchup,
  history: HistoricalMatchup[]
): number[] {
  const scores: number[] = [];

  for (const previous of history) {
    if (!isComplete(previous)) continue;

    const earlier =
      Number(previous.season) < Number(game.season) ||
      (
        previous.season === game.season &&
        previous.week < game.week
      );

    if (!earlier) continue;

    const sides = [
      {
        starters: previous.startersA,
        points: previous.startersPointsA,
      },
      {
        starters: previous.startersB,
        points: previous.startersPointsB,
      },
    ];

    for (const side of sides) {
      const index = side.starters.indexOf(playerId);

      if (
        index >= 0 &&
        Number.isFinite(side.points[index])
      ) {
        scores.push(side.points[index]);
      }
    }
  }

  return scores;
}

function getIntelligence(
  result: Result,
  history: HistoricalMatchup[],
  database: PlayerDatabase
): Intelligence {
  const performances: Performance[] = [];

  const sides = [
    {
      roster: result.game.rosterA,
      starters: result.game.startersA,
      scores: result.game.startersPointsA,
      total: result.game.scoreA,
    },
    {
      roster: result.game.rosterB,
      starters: result.game.startersB,
      scores: result.game.startersPointsB,
      total: result.game.scoreB,
    },
  ];

  for (const side of sides) {
    side.starters.forEach((id, index) => {
      const points = side.scores[index];

      if (
        !id ||
        id === "0" ||
        !Number.isFinite(points)
      ) {
        return;
      }

      const player = database[id];

      const name =
        player?.full_name ||
        [player?.first_name, player?.last_name]
          .filter(Boolean)
          .join(" ") ||
        `Player ${id}`;

      const previous = historicalScores(
        id,
        result.game,
        history
      );

      const average =
        previous.length
          ? previous.reduce(
              (sum, score) => sum + score,
              0
            ) / previous.length
          : null;

      performances.push({
        id,
        name,
        points,
        roster: side.roster,
        average,
        starts: previous.length,
        difference:
          average === null ? null : points - average,
        share: side.total > 0 ? points / side.total : 0,
      });
    });
  }

  const winners = performances
    .filter((p) => p.roster === result.winner)
    .sort((a, b) => b.points - a.points);

  const losers = performances
    .filter((p) => p.roster === result.loser)
    .sort((a, b) => b.points - a.points);

  const disappointment =
    [...losers]
      .filter(
        (p) =>
          p.starts >= 3 &&
          p.difference !== null &&
          p.difference <= -8
      )
      .sort(
        (a, b) =>
          (a.difference ?? 0) - (b.difference ?? 0)
      )[0] ?? null;

  const surprise =
    [...winners]
      .filter(
        (p) =>
          p.starts >= 3 &&
          p.difference !== null &&
          p.difference >= 12 &&
          p.points >= 18
      )
      .sort(
        (a, b) =>
          (b.difference ?? 0) - (a.difference ?? 0)
      )[0] ?? null;

  return {
    winningStar: winners[0] ?? null,
    losingStar: losers[0] ?? null,
    disappointment,
    surprise,
  };
}

function importance(
  result: Result,
  intel: Intelligence
) {
  let score = result.margin * 0.4;

  if (result.margin <= 3) score += 40;
  if (result.margin >= 40) score += 20;
  if (result.winnerScore >= 175) score += 25;
  if (result.total >= 330) score += 30;
  if (rivalryFor(result.winner, result.loser)) score += 45;
  if ((intel.winningStar?.points ?? 0) >= 35) score += 12;

  return score;
}

function playerParagraph(
  result: Result,
  intel: Intelligence
): string | null {
  const seed = seedFor(result);
  const options: string[] = [];

  const star = intel.winningStar;
  const poor = intel.disappointment;
  const surprise = intel.surprise;

  if (star && star.points >= 25) {
    options.push(
      pick(
        [
          `${star.name} delivered ${pts(star.points)} fantasy points for ${teamName(result.winner, result.game.season)}, accounting for ${(star.share * 100).toFixed(1)}% of the winning total. ${manager(result.winner)} will doubtless call this a tactical masterstroke, although the player did most of the actual work.`,
          `${star.name} supplied ${pts(star.points)} points for the winning side. It was a substantial individual contribution, and ${manager(result.winner)} has already begun the difficult task of explaining why he deserves the credit.`,
          `Among the more useful employees of ${teamName(result.winner, result.game.season)} this week was ${star.name}, whose ${pts(star.points)}-point performance made his manager look considerably cleverer than usual.`,
        ],
        seed
      )
    );
  }

  if (
    poor &&
    poor.average !== null
  ) {
    options.push(
      pick(
        [
          `${poor.name} managed ${pts(poor.points)} points for the defeated side, compared with an average of ${pts(poor.average)} across ${poor.starts} previous SFL starts. The shortfall of ${pts(Math.abs(poor.difference ?? 0))} points will not be pleasant reading for ${manager(result.loser)}.`,
          `Questions are being asked of ${poor.name}, whose ${pts(poor.points)}-point contribution fell well short of his previous SFL starting average of ${pts(poor.average)}. Sloot News understands a strongly worded letter is being prepared for a man who has absolutely no idea this league exists.`,
        ],
        seed + 3
      )
    );
  }

  if (
    surprise &&
    surprise.average !== null
  ) {
    options.push(
      `${surprise.name} chose this particular week to produce ${pts(surprise.points)} points, compared with a previous SFL starting average of ${pts(surprise.average)}. ${manager(result.winner)} insists he saw it coming. The newsroom has found no supporting evidence.`
    );
  }

  if (
    !options.length &&
    intel.losingStar &&
    intel.losingStar.points >= 25
  ) {
    options.push(
      `${intel.losingStar.name} contributed ${pts(intel.losingStar.points)} points for ${teamName(result.loser, result.game.season)}, only to discover that personal excellence offers no protection against the incompetence of one's fantasy colleagues.`
    );
  }

  return options.length
    ? pick(options, seed + 7)
    : null;
}

function buildArticle(
  result: Result,
  intel: Intelligence,
  featured: boolean
): Article {
  const season = result.game.season;
  const winner = teamName(result.winner, season);
  const loser = teamName(result.loser, season);
  const winnerManager = manager(result.winner);
  const loserManager = manager(result.loser);
  const seed = seedFor(result);

  const score =
    `${pts(result.winnerScore)}–${pts(result.loserScore)}`;

  const rivalry = rivalryFor(
    result.winner,
    result.loser
  );

  const star = intel.winningStar;
  const poor = intel.disappointment;

  const angles: string[] = [];

  if (rivalry) angles.push("rivalry", "rivalry");
  if (result.margin <= 3) angles.push("heartbreak", "heartbreak");
  if (result.margin >= 40) angles.push("demolition", "demolition");
  if (result.total >= 300) angles.push("shootout");
  if ((star?.points ?? 0) >= 28) angles.push("star");
  if (poor && result.margin <= 15) angles.push("inquest");
  if (intel.surprise) angles.push("surprise");

  angles.push("manager", "investigation", "report");

  const angle = pick(angles, seed + 23);

  let title = "";
  let paragraphs: string[] = [];

  if (angle === "rivalry" && rivalry) {
    title = pick(
      [
        `${rivalry.title}: ${winner} Take the Spoils as Old Wounds Reopen`,
        `Hostilities Resume as ${winner} Win ${rivalry.title}`,
        `${loser} Lose the Match and the Argument in ${rivalry.title}`,
      ],
      seed
    );

    paragraphs = [
      `There was never much prospect of a civilised afternoon when ${winnerManager} and ${loserManager} met again. The latest instalment of ${rivalry.title} ended ${score} in favour of ${winner}, adding another grievance to a relationship already beyond repair.`,
      rivalry.description,
      `The decisive difference was ${pts(result.margin)} points. In an ordinary fixture that might be regarded as a statistic. In this rivalry, it will almost certainly become evidence in an argument lasting several years.`,
    ];
  } else if (angle === "heartbreak") {
    title = pick(
      [
        `${loser} Lose by ${pts(result.margin)} Points; Emergency Counselling Requested`,
        `A Margin of ${pts(result.margin)} Points and a Lifetime of Regret`,
        `${winner} Survive as ${loser} Discover New Depths of Misery`,
      ],
      seed
    );

    paragraphs = [
      `At some point in the coming days, ${loserManager} will revisit this ${score} defeat and begin identifying tiny moments that could have changed everything. It is unlikely to improve his mental health.`,
      `Only ${pts(result.margin)} points separated ${winner} and ${loser}. That is a margin small enough to inspire several hours of furious arithmetic and at least one deeply unreasonable complaint about the scoring system.`,
      `For ${winnerManager}, the same numbers represent tactical brilliance. Such is the extraordinary power of being on the correct side of a decimal point.`,
    ];
  } else if (angle === "demolition") {
    title = pick(
      [
        `Authorities Investigate ${pts(result.margin)}-Point Massacre of ${loser}`,
        `${winner} Dismantle ${loser}; Structural Engineers Called`,
        `${loser} Reportedly Still Looking for Their Defence`,
      ],
      seed
    );

    paragraphs = [
      `Sloot News regrets to report that ${loser} have suffered an incident of considerable sporting violence. ${winner} won ${score}, a margin of ${pts(result.margin)} points, and there are now serious questions about whether the defeated franchise should be permitted to operate heavy machinery.`,
      `This was not the sort of defeat that can be explained away by a missed reception. The gap between the teams was substantial enough to require its own postcode.`,
      `${loserManager} is entitled to demand improvements. Whether any of his players are still answering his calls is another matter.`,
    ];
  } else if (angle === "shootout") {
    title = pick(
      [
        `${pts(result.total)} Points of Absolute Filth as ${winner} Prevail`,
        `${loser} Score Plenty, Win Fuck All`,
        `Offensive Explosion Leaves ${loserManager} Empty-Handed`,
      ],
      seed
    );

    paragraphs = [
      `The SFL scoring department recorded ${pts(result.total)} combined points as ${winner} defeated ${loser} ${score}. Both franchises contributed handsomely to the spectacle. Only one was rewarded.`,
      `${loserManager} might ordinarily celebrate a score of ${pts(result.loserScore)}. Unfortunately, ${winnerManager} had the spectacularly inconsiderate idea of scoring ${pts(result.winnerScore)}.`,
      `It is difficult to know what more the losing side could reasonably have demanded from its attack. A functioning defence would have been an excellent start.`,
    ];
  } else if (angle === "star" && star) {
    title = pick(
      [
        `${star.name} Takes Control as ${winner} Beat ${loser}`,
        `${star.name} Delivers ${pts(star.points)}-Point Statement`,
        `${winnerManager} Claims Credit for ${star.name}'s Heroics`,
      ],
      seed
    );

    paragraphs = [
      `The official result reads ${winner} ${pts(result.winnerScore)}, ${loser} ${pts(result.loserScore)}. But the more interesting number belongs to ${star.name}, who contributed ${pts(star.points)} points to the winning effort.`,
      `That represents ${(star.share * 100).toFixed(1)}% of ${winner}'s total. ${winnerManager} may have assembled the lineup, but ${star.name} provided a persuasive argument that the players should receive some credit.`,
      `The victory margin was ${pts(result.margin)} points. ${loserManager} must now work out how to prevent another performance like this while resisting the urge to throw his phone into the sea.`,
    ];
  } else if (angle === "inquest" && poor) {
    title = pick(
      [
        `${poor.name} Summoned to Explain ${loser}'s Defeat`,
        `Questions Asked After ${loser} Fall Short Against ${winner}`,
        `${loserManager} Opens Inquiry into Missing Fantasy Points`,
      ],
      seed
    );

    paragraphs = [
      `The investigation into ${loser}'s ${score} defeat has identified several persons of interest. Among them is ${poor.name}, whose ${pts(poor.points)}-point contribution fell below his established SFL form.`,
      `The player averaged ${pts(poor.average ?? 0)} points across ${poor.starts} previous starts. This week's shortfall was ${pts(Math.abs(poor.difference ?? 0))} points. With the team losing by ${pts(result.margin)}, the arithmetic is uncomfortable, although it cannot tell us how an alternative performance would have unfolded.`,
      `${loserManager} has declined to comment, possibly because nobody has actually asked him. Sloot News nevertheless expects a full explanation.`,
    ];
  } else if (angle === "surprise" && intel.surprise) {
    const hero = intel.surprise;

    title = pick(
      [
        `${hero.name} Apparently Good at Football After All`,
        `Unexpected Hero Rescues ${winner} from Potential Embarrassment`,
        `${winnerManager} Insists ${hero.name}'s Explosion Was Always the Plan`,
      ],
      seed
    );

    paragraphs = [
      `For reasons that remain unclear, ${hero.name} chose Week ${result.game.week} to become an extremely useful fantasy footballer. His ${pts(hero.points)} points helped ${winner} defeat ${loser} ${score}.`,
      `Across ${hero.starts} previous SFL starts, ${hero.name} averaged ${pts(hero.average ?? 0)}. This performance exceeded that mark by ${pts(hero.difference ?? 0)} points, prompting ${winnerManager} to declare himself a visionary.`,
      `The newsroom has requested evidence that this was planned rather than an extremely fortunate accident. None has yet been supplied.`,
    ];
  } else if (angle === "manager") {
    title = pick(
      [
        `${winnerManager} Enjoys Peaceful Weekend at ${loserManager}'s Expense`,
        `${loserManager} Left Searching for Answers After ${winner} Win`,
        `${winner} Win; Two Managers Offer Very Different Interpretations`,
      ],
      seed
    );

    paragraphs = [
      `${winnerManager} and ${loserManager} spent the weekend watching essentially the same collection of NFL games. Remarkably, only one emerged with anything resembling happiness. ${winner} won ${score}.`,
      `The difference of ${pts(result.margin)} points will be presented by the winner as evidence of excellent preparation. The loser will almost certainly regard it as proof that fantasy football is fundamentally dishonest.`,
      `Both interpretations are convenient. Only one comes with a victory.`,
    ];
  } else if (angle === "investigation") {
    title = pick(
      [
        `Sloot News Opens Formal Inquiry into ${loser}'s Defeat`,
        `What Exactly Happened to ${loser}?`,
        `A ${pts(result.margin)}-Point Mystery and Two Questionable Franchises`,
      ],
      seed
    );

    paragraphs = [
      `Investigators have confirmed that ${winner} defeated ${loser} ${score}. The result is not in dispute. Everything else, including the competence of those involved, remains under examination.`,
      `The winning margin of ${pts(result.margin)} points is now the central exhibit. ${winnerManager} maintains that victory was deserved. ${loserManager} is expected to pursue alternative theories.`,
      `Sloot News will continue its investigation until a satisfactory explanation emerges or somebody offers the editorial staff a pint.`,
    ];
  } else {
    title = pick(
      [
        `${winner} Claim the Points; ${loser} Claim Absolutely Fuck All`,
        `${loser} Come Up Short in Latest SFL Misadventure`,
        `${winner} Prevail as Another Manager Questions His Life Choices`,
      ],
      seed
    );

    paragraphs = [
      `${winner} secured a ${score} victory over ${loser}, handing ${winnerManager} another result to celebrate and ${loserManager} another reason to avoid the league group chat.`,
      `The final margin stood at ${pts(result.margin)} points. Not every contest becomes an instant classic, but the SFL has never required exceptional football to produce an exceptional amount of complaining.`,
      `For the winners, the result provides useful momentum. For the losers, it provides several days in which to pretend the next fixture will be different.`,
    ];
  }

  const player = playerParagraph(result, intel);

  const playerAlreadyCentral =
    angle === "star" ||
    angle === "inquest" ||
    angle === "surprise";

  if (player && !playerAlreadyCentral) {
    const position = Math.min(
      1 + Math.abs(seed % 2),
      paragraphs.length
    );
    paragraphs.splice(position, 0, player);
  }

  if (
    featured &&
    poor &&
    poor.average !== null &&
    result.margin <= 15 &&
    Math.abs(poor.difference ?? 0) > result.margin &&
    angle !== "inquest"
  ) {
    paragraphs.push(
      `One particularly uncomfortable detail concerns ${poor.name}. His shortfall against his previous SFL starting average was ${pts(Math.abs(poor.difference ?? 0))} points, exceeding the ${pts(result.margin)}-point losing margin. That does not prove he cost ${loser} the match, but it certainly gives the post-match inquiry somewhere to begin.`
    );
  }

  if (featured) {
    const loreTeam =
      seed % 3 === 0
        ? result.winner
        : result.loser;

    const lore = pick(
      LORE[loreTeam],
      seed + 9
    );

    const lorePosition =
      1 + Math.abs((seed + 5) % (paragraphs.length + 1));

    paragraphs.splice(
      Math.min(lorePosition, paragraphs.length),
      0,
      lore
    );
  }

  if (!featured) {
    const selected = paragraphs.slice(0, 2);

    if (
      player &&
      !playerAlreadyCentral &&
      !selected.includes(player)
    ) {
      selected[1] = player;
    }

    paragraphs = selected;
  }

  return { title, paragraphs };
}

function SectionHeading({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div style={{ marginBottom: "18px" }}>
      <p
        style={{
          ...muted,
          fontSize: "11px",
          fontWeight: 800,
          letterSpacing: "2px",
          margin: "0 0 6px",
          textTransform: "uppercase",
        }}
      >
        {eyebrow}
      </p>

      <h2
        style={{
          fontSize: "25px",
          lineHeight: 1.2,
          margin: 0,
        }}
      >
        {title}
      </h2>
    </div>
  );
}

export default async function NewsEdition({
  params,
}: PageProps) {
  const { season, week } = await params;

  const weekNumber = Number(week);

  const [seasons, playerDatabase] =
    await Promise.all([
      getHistoricalData(),
      getPlayerDatabase(),
    ]);

  const selectedSeason = seasons.find(
    (item) => item.league.season === season
  );

  const games =
    selectedSeason &&
    Number.isInteger(weekNumber) &&
    weekNumber >= 1 &&
    weekNumber <= 14
      ? selectedSeason.matchups.filter(
          (game) =>
            game.week === weekNumber &&
            isComplete(game)
        )
      : [];

  const uniqueTeams = new Set<number>();

  for (const game of games) {
    uniqueTeams.add(game.rosterA);
    uniqueTeams.add(game.rosterB);
  }

  const ready =
    games.length === 5 &&
    uniqueTeams.size === 10;

  const results = ready
    ? games
        .map(toResult)
        .filter(
          (result): result is Result =>
            result !== null
        )
    : [];

  const history = seasons.flatMap(
    (item) => item.matchups
  );

  const enriched = results.map((result) => {
    const intel = getIntelligence(
      result,
      history,
      playerDatabase
    );

    return {
      result,
      intel,
      importance: importance(result, intel),
    };
  });

  enriched.sort(
    (a, b) =>
      b.importance - a.importance ||
      b.result.margin - a.result.margin
  );

  const lead = enriched[0];
  const roundups = enriched.slice(1);

  const fraud = [...results].sort(
    (a, b) => b.margin - a.margin
  )[0];

  const sponsor = pick(
    SPONSORS,
    Number(season) + weekNumber
  );

  const leadArticle = lead
    ? buildArticle(
        lead.result,
        lead.intel,
        true
      )
    : null;

  return (
    <main style={{ paddingBottom: "40px" }}>
      <header
        style={{
          textAlign: "center",
          borderBottom: "2px solid #ffffff",
          paddingBottom: "20px",
          marginBottom: "28px",
        }}
      >
        <Link
          href="/"
          style={{
            color: "#929eae",
            fontSize: "12px",
            textDecoration: "none",
            fontWeight: 700,
          }}
        >
          ← Back to Sloot News
        </Link>

        <h1
          style={{
            fontSize: "clamp(36px, 10vw, 56px)",
            letterSpacing: "-2px",
            fontWeight: 900,
            lineHeight: 1,
            margin: "24px 0 8px",
          }}
        >
          SLOOT NEWS
        </h1>

        <p
          style={{
            fontWeight: 700,
            fontSize: "14px",
            margin: "0 0 18px",
          }}
        >
          Your Home of Sloot Sport
        </p>

        <div
          style={{
            borderTop: "1px solid #27303b",
            paddingTop: "12px",
            display: "flex",
            justifyContent: "space-between",
            gap: "10px",
            color: "#929eae",
            fontSize: "11px",
            fontWeight: 800,
            letterSpacing: "1px",
          }}
        >
          <span>{season} SEASON</span>
          <span>WEEK {weekNumber}</span>
        </div>

        <p
          style={{
            ...muted,
            fontSize: "11px",
            margin: "14px 0 0",
            fontStyle: "italic",
          }}
        >
          This edition sponsored by {sponsor}
        </p>
      </header>

      {!lead || !leadArticle ? (
        <section style={panel}>
          <SectionHeading
            eyebrow="Newsroom Notice"
            title="The Presses Are Silent"
          />

          <p
            style={{
              ...muted,
              lineHeight: 1.7,
            }}
          >
            This edition is not available.
            Either the week has not finished,
            the results are incomplete,
            or the newsroom has suffered
            another entirely avoidable
            administrative disaster.
          </p>

          <Link
            href="/"
            style={{
              color: "#ffffff",
              fontWeight: 800,
            }}
          >
            Return to the Front Page →
          </Link>
        </section>
      ) : (
        <>
          <article
            style={{
              ...panel,
              borderTop: "4px solid #ffffff",
              marginBottom: "32px",
            }}
          >
            <p
              style={{
                ...muted,
                fontSize: "11px",
                fontWeight: 800,
                letterSpacing: "2px",
                margin: "0 0 14px",
              }}
            >
              GAME OF THE WEEK
            </p>

            <h2
              style={{
                fontSize: "clamp(27px, 7vw, 38px)",
                lineHeight: 1.12,
                letterSpacing: "-0.7px",
                margin: "0 0 18px",
              }}
            >
              {leadArticle.title}
            </h2>

            <p
              style={{
                fontSize: "17px",
                fontWeight: 800,
                lineHeight: 1.5,
                margin: "0 0 20px",
              }}
            >
              {teamName(lead.result.winner, season)}
              {" "}
              {pts(lead.result.winnerScore)}
              {" — "}
              {pts(lead.result.loserScore)}
              {" "}
              {teamName(lead.result.loser, season)}
            </p>

            {leadArticle.paragraphs.map(
              (paragraph, index) => (
                <p
                  key={index}
                  style={{
                    color: "#d2d8e0",
                    lineHeight: 1.85,
                    fontSize: "15px",
                    margin: "0 0 18px",
                  }}
                >
                  {paragraph}
                </p>
              )
            )}
          </article>

          <section style={{ marginBottom: "32px" }}>
            <SectionHeading
              eyebrow="Four More Crimes Against Football"
              title="Around the SFL"
            />

            {roundups.map(({ result, intel }) => {
              const article = buildArticle(
                result,
                intel,
                false
              );

              return (
                <article
                  key={
                    `${result.game.season}-` +
                    `${result.game.week}-` +
                    `${result.game.rosterA}-` +
                    `${result.game.rosterB}`
                  }
                  style={{
                    ...panel,
                    marginBottom: "12px",
                  }}
                >
                  <p
                    style={{
                      ...muted,
                      fontSize: "10px",
                      fontWeight: 800,
                      letterSpacing: "1.5px",
                      margin: "0 0 10px",
                    }}
                  >
                    MATCH REPORT
                  </p>

                  <h3
                    style={{
                      fontSize: "21px",
                      lineHeight: 1.25,
                      margin: "0 0 12px",
                    }}
                  >
                    {article.title}
                  </h3>

                  <p
                    style={{
                      fontWeight: 800,
                      margin: "0 0 14px",
                    }}
                  >
                    {pts(result.winnerScore)}
                    {" — "}
                    {pts(result.loserScore)}
                  </p>

                  {article.paragraphs.map(
                    (paragraph, index) => (
                      <p
                        key={index}
                        style={{
                          ...muted,
                          fontSize: "14px",
                          lineHeight: 1.75,
                          margin:
                            index ===
                            article.paragraphs.length - 1
                              ? 0
                              : "0 0 12px",
                        }}
                      >
                        {paragraph}
                      </p>
                    )
                  )}
                </article>
              );
            })}
          </section>

          {fraud && (
            <section
              style={{
                ...panel,
                marginBottom: "30px",
              }}
            >
              <SectionHeading
                eyebrow="The Awards Committee"
                title="Shitcunt of the Week"
              />

              <h3
                style={{
                  fontSize: "23px",
                  margin: "0 0 14px",
                }}
              >
                {manager(fraud.loser)}
              </h3>

              <p
                style={{
                  ...muted,
                  fontSize: "14px",
                  lineHeight: 1.8,
                }}
              >
                Congratulations to
                {" "}
                {manager(fraud.loser)},
                whose
                {" "}
                {teamName(fraud.loser, season)}
                {" "}
                suffered the week's largest
                defeat, losing by
                {" "}
                {pts(fraud.margin)}
                {" "}
                points to
                {" "}
                {teamName(fraud.winner, season)}.
                {" "}
                The awards committee considered
                several candidates before
                concluding that this particular
                display of incompetence deserved
                to be recognised publicly.
              </p>

              <p
                style={{
                  ...muted,
                  fontSize: "14px",
                  lineHeight: 1.8,
                  marginBottom: 0,
                }}
              >
                {pick(
                  LORE[fraud.loser],
                  Number(season) + weekNumber
                )}
              </p>
            </section>
          )}

          <section
            style={{
              ...panel,
              marginBottom: "30px",
            }}
          >
            <p
              style={{
                ...muted,
                fontSize: "11px",
                fontWeight: 800,
                letterSpacing: "2px",
                margin: "0 0 10px",
              }}
            >
              MORE FROM THIS EDITION
            </p>

            <h2
              style={{
                fontSize: "23px",
                margin: "0 0 12px",
              }}
            >
              From the Vault
            </h2>

            <p
              style={{
                ...muted,
                fontSize: "14px",
                lineHeight: 1.8,
                margin: "0 0 16px",
              }}
            >
              The Sloot News investigative
              desk has reopened a historical
              case connected to this week's
              events. Old scores, fresh
              embarrassment and another
              manager wishing the league
              had never discovered
              record keeping.
            </p>

            <Link
              href={
                `/news/${season}/${week}` +
                `/from-the-vault`
              }
              style={{
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: 800,
                textDecoration: "none",
              }}
            >
              READ FROM THE VAULT →
            </Link>
          </section>
        </>
      )}

      <footer
        style={{
          textAlign: "center",
          borderTop: "1px solid #27303b",
          paddingTop: "24px",
          marginTop: "32px",
        }}
      >
        <p
          style={{
            fontWeight: 900,
            letterSpacing: "2px",
            margin: 0,
          }}
        >
          SLOOT NEWS
        </p>

        <p
          style={{
            ...muted,
            fontSize: "12px",
            marginTop: "8px",
          }}
        >
          Your Home of Sloot Sport
        </p>

        <p
          style={{
            ...muted,
            fontSize: "11px",
            lineHeight: 1.6,
            marginTop: "12px",
          }}
        >
          Real scores. Questionable journalism.
          No refunds.
        </p>
      </footer>
    </main>
  );
}
