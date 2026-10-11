
import Link from "next/link";
import {
  getHistoricalData,
  type HistoricalMatchup,
  type HistoricalSeason,
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
    "The commissioner has requested that the result be reviewed by an independent panel consisting of himself, his reflection and whichever member of the league group chat agrees with him.",
    "Ed Nelms has always maintained that the Ballbags are on the verge of something special. Unfortunately, the verge appears to be several thousand miles long.",
    "Sloot News remains the only publication willing to provide the Ballbags with the glowing coverage their commissioner believes they deserve. Even that relationship is beginning to look strained.",
  ],
  2: [
    "Ben Smith once guided Cambridge to the inaugural Slootbowl title. These days, memories of that championship are doing more heavy lifting than several members of his starting lineup.",
    "The Cum Sluts have previously occupied the summit of SFL football. Ben's attempts to recreate those glory days are beginning to resemble a man repeatedly microwaving the same disappointing leftovers.",
    "Cambridge's championship pedigree is beyond dispute. Whether it remains useful in the present day is another matter entirely.",
  ],
  3: [
    "Jake Greenwood has made a habit of turning up for the postseason, although the concept of actually winning the whole thing continues to elude him.",
    "Grimsby supporters have been promised progress so many times that the word has effectively lost all meaning.",
    "The Chode Chokers have built an impressive collection of playoff appearances and absolutely no Slootbowl trophies. At this stage, Jake may be collecting the wrong things.",
  ],
  4: [
    "George Pendleton's Happy Endings have already conquered the SFL once, which is apparently sufficient justification for George to treat every subsequent defeat as a personal insult from God.",
    "The Isle of Wight has a proud championship history, and George is more than happy to explain it to anyone unfortunate enough to make eye contact.",
    "George's ability to build a contender remains impressive. His ability to remain normal about fantasy football is considerably less developed.",
  ],
  5: [
    "Ryan Whiting has worked hard to turn Grays Town into a genuine contender. The problem with becoming respectable is that people start expecting you to actually win something.",
    "The Fingerblasters continue their pursuit of SFL glory. Whether this ends in a championship parade or another deeply uncomfortable December remains to be seen.",
    "Grays Town have spent years building a side capable of frightening opponents. Occasionally they even remember to frighten them on the scoreboard.",
  ],
  6: [
    "Garrett Etheridge has demonstrated an extraordinary talent for building strong regular-season teams and an equally extraordinary talent for watching them achieve fuck all in the playoffs.",
    "Lincoln's championship window remains open. Garrett is currently standing beneath it, wondering why nobody has thrown him a trophy.",
    "The Nonces have assembled enough talent to threaten the entire OBFC. Unfortunately, talent has never been a guaranteed cure for whatever the fuck happens to Garrett in December.",
  ],
  7: [
    "Ollie Payne remains one of the league's great mysteries. Every time Kalamata look finished, they produce a performance that forces everyone to acknowledge their existence again.",
    "The Dirty Vegans have spent their SFL careers alternating between genuine promise and performances that should come with a public health warning.",
    "Kalamata's relationship with consistency remains about as stable as the average kebab-shop toilet at four in the morning.",
  ],
  8: [
    "Jack Brannigan's long-term strategy has previously involved treating future draft picks like the loose change in a pub fruit machine.",
    "Weybiza's supporters continue to await the return on Jack's investment strategy. Financial experts have advised them not to hold their breath.",
    "The BAB's once looked like the future of the OBFC. Jack has since spent a considerable amount of time attempting to explain where that future went.",
  ],
  9: [
    "Tarl Brayer has suffered enough narrow postseason defeats to qualify for a government-funded counselling programme.",
    "East Rutherford's supporters know better than most that a few fantasy points can be the difference between eternal glory and several months of being called a useless cunt.",
    "The Shitlickers have spent years flirting with greatness, only to discover that greatness has a boyfriend and his name is usually George Pendleton.",
  ],
  10: [
    "Josh Thomas has won consecutive Slootbowls despite previously treating large portions of the regular season like an optional warm-up exercise.",
    "Chad's ability to turn mediocrity into December glory remains one of the most irritating phenomena in professional pretend football.",
    "The Moist Discharge have repeatedly demonstrated that the usual laws of sporting logic do not apply to Josh Thomas. The rest of the league would quite like an explanation.",
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
      "Ed Nelms and Jake Greenwood have been treating this fixture like a personal vendetta since the league's earliest days.",
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
      "The history between George Pendleton and Tarl Brayer is littered with heartbreak, narrow margins and a frankly unhealthy amount of resentment.",
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
    (rivalry) =>
      (rivalry.a === a && rivalry.b === b) ||
      (rivalry.a === b && rivalry.b === a)
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

function toResult(
  game: HistoricalMatchup
): Result | null {
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

function storyImportance(result: Result) {
  let importance = result.margin * 0.4;

  if (result.margin <= 3) importance += 40;
  if (result.margin >= 40) importance += 20;
  if (result.winnerScore >= 175) importance += 25;
  if (result.total >= 330) importance += 30;
  if (rivalryFor(result.winner, result.loser)) {
    importance += 45;
  }

  return importance;
}

function headline(result: Result) {
  const winner = teamName(
    result.winner,
    result.game.season
  );
  const loser = teamName(
    result.loser,
    result.game.season
  );
  const seed = seedFor(result);
  const rivalry = rivalryFor(
    result.winner,
    result.loser
  );

  if (rivalry) {
    return pick(
      [
        `${rivalry.title} Ends in Tears as ${winner} Claim the Spoils`,
        `${winner} Win ${rivalry.title}; ${loser} Left Holding Their Own Bollocks`,
        `Another Chapter of Absolute Filth as ${winner} Conquer ${loser}`,
      ],
      seed
    );
  }

  if (result.margin <= 2) {
    return pick(
      [
        `${winner} Escape by ${pts(result.margin)} Points in Outrageous SFL Shitshow`,
        `${loser} Lose by a Pubic Hair; Local Supporters Demand Answers`,
        `Heartbreak, Bollocks and Bad Decisions: ${winner} Survive`,
      ],
      seed
    );
  }

  if (result.margin >= 45) {
    return pick(
      [
        `${winner} Batter ${loser} Into Next Fucking Week`,
        `${loser} Absolutely Annihilated; Funeral Arrangements Underway`,
        `Authorities Called as ${winner} Commit Unholy Act of Football Violence`,
      ],
      seed
    );
  }

  if (result.winnerScore >= 175) {
    return pick(
      [
        `${winner} Unleash Offensive Filth on Helpless ${loser}`,
        `${winner} Produce ${pts(result.winnerScore)}-Point Masterclass in Being a Bastard`,
        `${loser} Powerless to Stop ${winner} Scoring Like a Man Possessed`,
      ],
      seed
    );
  }

  return pick(
    [
      `${winner} Defeat ${loser} in Another Week of Questionable Football`,
      `${loser} Come Up Short as ${winner} Take the Piss`,
      `${winner} Claim the Points; ${loser} Claim Absolutely Fuck All`,
    ],
    seed
  );
}

function openingParagraph(result: Result) {
  const winner = teamName(
    result.winner,
    result.game.season
  );
  const loser = teamName(
    result.loser,
    result.game.season
  );

  const seed = seedFor(result);

  if (result.margin <= 2) {
    return pick(
      [
        `Ladies and gentlemen, we have witnessed another absolute bastard of a finish. ${winner} scraped past ${loser} ${pts(result.winnerScore)}–${pts(result.loserScore)}, leaving just ${pts(result.margin)} points between joy and a week spent staring blankly at the ceiling.`,
        `Some defeats hurt. Others crawl into your brain, unpack their bags and spend the next six months reminding you what a useless cunt you are. Unfortunately for ${manager(result.loser)}, this ${pts(result.margin)}-point defeat to ${winner} belongs firmly in the second category.`,
      ],
      seed
    );
  }

  if (result.margin >= 45) {
    return pick(
      [
        `There are beatings, there are demolitions, and then there is whatever the fuck ${winner} just did to ${loser}. A ${pts(result.margin)}-point margin suggests that one of these franchises may have accidentally brought a children's birthday party to a professional sporting event.`,
        `Sloot News would like to extend its condolences to the friends, family and remaining supporters of ${loser}, following a ${pts(result.winnerScore)}–${pts(result.loserScore)} dismantling at the hands of ${winner}. The match was technically competitive for several seconds.`,
      ],
      seed
    );
  }

  return pick(
    [
      `Another week, another collection of grown men allowing American footballers to dictate their emotional wellbeing. This particular episode saw ${winner} beat ${loser} ${pts(result.winnerScore)}–${pts(result.loserScore)}, leaving ${manager(result.loser)} with precious little to celebrate.`,
      `${winner} walked away with a ${pts(result.margin)}-point victory over ${loser}, continuing the SFL tradition of one man having a wonderful weekend at the direct expense of another man's mental health.`,
      `Week ${result.game.week} brought plenty of misery to the SFL, but ${loser} made a particularly generous contribution, losing ${pts(result.winnerScore)}–${pts(result.loserScore)} to ${winner}.`,
    ],
    seed
  );
}

function analysisParagraph(result: Result) {
  const winner = teamName(
    result.winner,
    result.game.season
  );
  const loser = teamName(
    result.loser,
    result.game.season
  );
  const seed = seedFor(result);

  if (result.margin <= 3) {
    return pick(
      [
        `For ${manager(result.loser)}, the next few days will involve an extensive investigation into every missed reception, every questionable lineup decision and every moment in which the universe could have intervened but instead decided to be a massive prick.`,
        `A margin this small is a cruel reminder that the difference between tactical genius and public humiliation can be one meaningless reception from a bloke who wasn't even expected to play.`,
      ],
      seed + 2
    );
  }

  if (result.margin >= 40) {
    return pick(
      [
        `The losing side offered about as much resistance as a wet paper bag in a hurricane. By the time the final scores were confirmed, ${manager(result.loser)} was left contemplating whether the franchise could legally be dissolved before next Sunday.`,
        `The result was so one-sided that the SFL's imaginary governing body briefly considered introducing a mercy rule. The proposal was rejected because humiliating your mates is essentially the entire point of the competition.`,
      ],
      seed + 2
    );
  }

  if (result.total >= 320) {
    return pick(
      [
        `The two sides combined for ${pts(result.total)} points, a scoring spectacle that would normally leave both managers delighted. Unfortunately, only one of them gets to enjoy it, while the other has to explain how scoring that many points still wasn't fucking enough.`,
        `With ${pts(result.total)} points between them, this was hardly a quiet afternoon. ${manager(result.loser)} can at least take comfort in having contributed to a wonderful spectacle, which is precisely the sort of consolation nobody wants.`,
      ],
      seed + 2
    );
  }

  return pick(
    [
      `${manager(result.winner)} will understandably be delighted. ${manager(result.loser)}, meanwhile, must return to the drawing board, assuming it hasn't already been thrown through a window.`,
      `It was the sort of result that looks perfectly straightforward on a spreadsheet and considerably less pleasant when you're the poor bastard on the wrong end of it.`,
      `Both managers will take lessons from this encounter. One will learn how to win. The other will probably learn absolutely nothing and repeat the entire exercise next week.`,
    ],
    seed + 2
  );
}

function personalParagraph(result: Result) {
  const seed = seedFor(result);

  const loserLore = pick(
    LORE[result.loser],
    seed + 5
  );

  const winnerLore = pick(
    LORE[result.winner],
    seed + 8
  );

  const rivalry = rivalryFor(
    result.winner,
    result.loser
  );

  if (rivalry) {
    return (
      `${rivalry.description} ` +
      `${loserLore}`
    );
  }

  return pick(
    [
      loserLore,
      winnerLore,
      `${loserLore} ${winnerLore}`,
    ],
    seed + 11
  );
}

function closingParagraph(result: Result) {
  const winner = teamName(
    result.winner,
    result.game.season
  );
  const loser = teamName(
    result.loser,
    result.game.season
  );

  return pick(
    [
      `So congratulations to ${winner}. Commiserations to ${loser}. And to everybody else in the SFL: remember that no matter how badly your weekend went, there is always someone in this league making an even bigger fucking mess of things.`,
      `Where do the two franchises go from here? ${winner} will be looking upwards, ${loser} will be looking for excuses, and Sloot News will be watching both with the sort of morbid fascination normally reserved for motorway pile-ups.`,
      `The result goes into the record books, the bragging rights go to ${winner}, and ${loser} get the privilege of reading about their own humiliation in a publication they never asked to subscribe to.`,
    ],
    seedFor(result) + 17
  );
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
  const seasons = await getHistoricalData();

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

  const sorted = [...results].sort(
    (a, b) =>
      storyImportance(b) - storyImportance(a) ||
      b.margin - a.margin
  );

  const lead = sorted[0];
  const roundups = sorted.slice(1);

  const fraud = [...results].sort(
    (a, b) => b.margin - a.margin
  )[0];

  const flashback = seasons
    .filter(
      (item) =>
        Number(item.league.season) <
        Number(season)
    )
    .flatMap((item) => item.matchups)
    .filter(
      (game) =>
        game.week === weekNumber &&
        isComplete(game)
    )
    .map(toResult)
    .filter(
      (result): result is Result =>
        result !== null
    )
    .sort(
      (a, b) =>
        storyImportance(b) -
        storyImportance(a)
    )[0];

  const sponsor = pick(
    SPONSORS,
    Number(season) + weekNumber
  );

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

      {!lead ? (
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
              {headline(lead)}
            </h2>

            <p
              style={{
                fontSize: "17px",
                fontWeight: 800,
                lineHeight: 1.5,
                margin: "0 0 20px",
              }}
            >
              {teamName(lead.winner, season)}
              {" "}
              {pts(lead.winnerScore)}
              {" — "}
              {pts(lead.loserScore)}
              {" "}
              {teamName(lead.loser, season)}
            </p>

            {[
              openingParagraph(lead),
              analysisParagraph(lead),
              personalParagraph(lead),
              closingParagraph(lead),
            ].map((paragraph, index) => (
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
            ))}
          </article>

          <section style={{ marginBottom: "32px" }}>
            <SectionHeading
              eyebrow="Four More Crimes Against Football"
              title="Around the SFL"
            />

            {roundups.map((result) => (
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
                  {headline(result)}
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

                <p
                  style={{
                    ...muted,
                    fontSize: "14px",
                    lineHeight: 1.75,
                    margin: "0 0 12px",
                  }}
                >
                  {openingParagraph(result)}
                </p>

                <p
                  style={{
                    ...muted,
                    fontSize: "14px",
                    lineHeight: 1.75,
                    margin: 0,
                  }}
                >
                  {analysisParagraph(result)}
                  {" "}
                  {personalParagraph(result)}
                </p>
              </article>
            ))}
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
            <SectionHeading
              eyebrow="The Historical Department"
              title="From the Vault"
            />

            {flashback ? (
              <>
                <p
                  style={{
                    ...muted,
                    fontSize: "11px",
                    fontWeight: 800,
                    letterSpacing: "1px",
                  }}
                >
                  {flashback.game.season}
                  {" · "}
                  WEEK {flashback.game.week}
                </p>

                <h3
                  style={{
                    fontSize: "21px",
                    lineHeight: 1.3,
                    margin: "0 0 14px",
                  }}
                >
                  {headline(flashback)}
                </h3>

                <p
                  style={{
                    ...muted,
                    fontSize: "14px",
                    lineHeight: 1.8,
                  }}
                >
                  {openingParagraph(flashback)}
                  {" "}
                  {personalParagraph(flashback)}
                </p>

                <Link
                  href={
                    `/history/${flashback.game.season}`
                  }
                  style={{
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: 800,
                  }}
                >
                  Visit the Season Archive →
                </Link>
              </>
            ) : (
              <p style={muted}>
                No earlier completed fixture
                is available for this week.
              </p>
            )}
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
