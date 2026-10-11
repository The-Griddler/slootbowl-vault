
import Link from "next/link";
import {
  getHistoricalData,
  type HistoricalMatchup,
  type HistoricalSeason,
} from "../lib/sleeper";

type Result = {
  game: HistoricalMatchup;
  winner: number;
  loser: number;
  winnerScore: number;
  loserScore: number;
  margin: number;
  total: number;
};

type Edition = {
  season: string;
  week: number;
  results: Result[];
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

const RIVALRIES = [
  {
    a: 1,
    b: 3,
    title: "The Shotty Bowl",
  },
  {
    a: 4,
    b: 7,
    title: "The Paddletap Bowl",
  },
  {
    a: 4,
    b: 9,
    title: "The OBFC Grudge Match",
  },
  {
    a: 1,
    b: 10,
    title: "The Commissioner's Nightmare",
  },
];

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

// This is deliberately identical to the
// Game of the Week scoring on the edition page.
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

// These headline rules match the edition page.
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

function teaser(result: Result) {
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
        `Old grudges, new humiliations. ${winner} emerged victorious against ${loser}, and the SFL's least healthy relationship has somehow become even more unpleasant.`,
        `The ${rivalry.title} delivered another chapter of competitive hostility, with ${winner} claiming the points and ${loser} claiming the right to be absolutely fucking furious.`,
      ],
      seed
    );
  }

  if (result.margin <= 3) {
    return pick(
      [
        `Just ${pts(result.margin)} points separated the two sides. ${manager(result.loser)} is expected to spend the next several days conducting a forensic investigation into every single lineup decision.`,
        `${loser} came within ${pts(result.margin)} points of victory. Unfortunately, fantasy football does not award consolation trophies for almost managing not to fuck it up.`,
      ],
      seed
    );
  }

  if (result.margin >= 40) {
    return pick(
      [
        `${winner} inflicted a ${pts(result.margin)}-point demolition on ${loser}. Sloot News has contacted the losing franchise for comment but understands the manager may currently be hiding beneath a duvet.`,
        `An absolute massacre. ${loser} were dismantled by ${pts(result.margin)} points, raising serious questions about whether ${manager(result.loser)} should be permitted near a starting lineup next Sunday.`,
      ],
      seed
    );
  }

  if (result.total >= 320) {
    return pick(
      [
        `A combined ${pts(result.total)} points made this one of the week's great scoring spectacles. ${manager(result.loser)} contributed admirably before discovering that losing while scoring loads is still fucking losing.`,
        `${winner} and ${loser} combined for ${pts(result.total)} points. Only one manager got to enjoy it, which is precisely why this league is such a magnificent little cesspit.`,
      ],
      seed
    );
  }

  return pick(
    [
      `${winner} took the points, ${loser} took the emotional damage, and another entirely avoidable fantasy football argument entered the SFL history books.`,
      `${manager(result.winner)} will be celebrating. ${manager(result.loser)} will be searching for excuses. Sloot News will be giving both the respect they deserve, which is very little.`,
      `${winner} came out on top in a fixture that leaves ${loser} with another week of soul-searching and absolutely no sympathy from the rest of the league.`,
    ],
    seed
  );
}

function editionFrom(
  season: HistoricalSeason,
  week: number
): Edition | null {
  const games = season.matchups.filter(
    (game) =>
      game.week === week &&
      isComplete(game)
  );

  const teams = new Set<number>();

  for (const game of games) {
    teams.add(game.rosterA);
    teams.add(game.rosterB);
  }

  // All five fixtures must be complete.
  if (games.length !== 5 || teams.size !== 10) {
    return null;
  }

  const results = games
    .map(toResult)
    .filter(
      (result): result is Result =>
        result !== null
    );

  if (results.length !== 5) {
    return null;
  }

  return {
    season: season.league.season,
    week,
    results,
  };
}

function latestEdition(
  seasons: HistoricalSeason[]
): Edition | null {
  const editions: Edition[] = [];

  for (const season of seasons) {
    for (let week = 1; week <= 14; week++) {
      const edition = editionFrom(
        season,
        week
      );

      if (edition) {
        editions.push(edition);
      }
    }
  }

  editions.sort(
    (a, b) =>
      Number(b.season) - Number(a.season) ||
      b.week - a.week
  );

  return editions[0] ?? null;
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

function Scoreline({
  result,
}: {
  result: Result;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "7px",
        padding: "14px 0",
        borderTop: "1px solid #27303b",
        borderBottom: "1px solid #27303b",
        margin: "18px 0",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: "12px",
        }}
      >
        <span
          style={{
            fontWeight: 800,
            fontSize: "14px",
          }}
        >
          {teamName(
            result.winner,
            result.game.season
          )}
        </span>

        <span
          style={{
            fontWeight: 900,
            fontSize: "17px",
            whiteSpace: "nowrap",
          }}
        >
          {pts(result.winnerScore)}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: "12px",
        }}
      >
        <span
          style={{
            ...muted,
            fontWeight: 700,
            fontSize: "14px",
          }}
        >
          {teamName(
            result.loser,
            result.game.season
          )}
        </span>

        <span
          style={{
            ...muted,
            fontWeight: 800,
            fontSize: "17px",
            whiteSpace: "nowrap",
          }}
        >
          {pts(result.loserScore)}
        </span>
      </div>
    </div>
  );
}

export default async function Home() {
  const seasons = await getHistoricalData();

  const edition = latestEdition(seasons);

  const sorted = edition
    ? [...edition.results].sort(
        (a, b) =>
          storyImportance(b) -
            storyImportance(a) ||
          b.margin - a.margin
      )
    : [];

  const lead = sorted[0];
  const roundups = sorted.slice(1);

  const fraud = edition
    ? [...edition.results].sort(
        (a, b) => b.margin - a.margin
      )[0]
    : null;

  const flashback = edition
    ? seasons
        .filter(
          (season) =>
            Number(season.league.season) <
            Number(edition.season)
        )
        .flatMap(
          (season) => season.matchups
        )
        .filter(
          (game) =>
            game.week === edition.week &&
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
        )[0]
    : null;

  const editionUrl = edition
    ? `/news/${edition.season}/${edition.week}`
    : null;

  const sponsor = edition
    ? pick(
        SPONSORS,
        Number(edition.season) +
          edition.week
      )
    : null;

  return (
    <main
      style={{
        paddingBottom: "40px",
      }}
    >
      <header
        style={{
          textAlign: "center",
          borderBottom: "2px solid #ffffff",
          paddingBottom: "20px",
          marginBottom: "28px",
        }}
      >
        <p
          style={{
            ...muted,
            fontSize: "10px",
            fontWeight: 800,
            letterSpacing: "2px",
            margin: "0 0 12px",
          }}
        >
          THE OFFICIAL UNOFFICIAL VOICE
          OF THE SFL
        </p>

        <h1
          style={{
            fontSize:
              "clamp(36px, 10vw, 56px)",
            letterSpacing: "-2px",
            fontWeight: 900,
            lineHeight: 1,
            margin: "0 0 8px",
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
            borderTop:
              "1px solid #27303b",
            paddingTop: "12px",
            display: "flex",
            justifyContent:
              "space-between",
            gap: "10px",
            color: "#929eae",
            fontSize: "11px",
            fontWeight: 800,
            letterSpacing: "1px",
          }}
        >
          <span>
            {edition
              ? `${edition.season} SEASON`
              : "SFL NEWSROOM"}
          </span>

          <span>
            {edition
              ? `WEEK ${edition.week}`
              : "AWAITING RESULTS"}
          </span>
        </div>

        {sponsor && (
          <p
            style={{
              ...muted,
              fontSize: "11px",
              margin: "14px 0 0",
              fontStyle: "italic",
            }}
          >
            This edition sponsored by{" "}
            {sponsor}
          </p>
        )}
      </header>

      {!edition || !lead || !editionUrl ? (
        <section style={panel}>
          <SectionHeading
            eyebrow="Newsroom Notice"
            title="Nothing to Report. Yet."
          />

          <p
            style={{
              ...muted,
              fontSize: "14px",
              lineHeight: 1.8,
              marginBottom: 0,
            }}
          >
            Sloot News is waiting for
            the first fully completed
            regular-season week.
            Once all five fixtures
            are final, the presses
            will start rolling.
          </p>
        </section>
      ) : (
        <>
          <article
            style={{
              ...panel,
              borderTop:
                "4px solid #ffffff",
              marginBottom: "30px",
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
              FRONT-PAGE EXCLUSIVE
            </p>

            <h2
              style={{
                fontSize:
                  "clamp(28px, 7vw, 40px)",
                lineHeight: 1.12,
                letterSpacing: "-0.7px",
                margin: "0 0 14px",
              }}
            >
              <Link
                href={editionUrl}
                style={{
                  color: "inherit",
                  textDecoration: "none",
                }}
              >
                {headline(lead)}
              </Link>
            </h2>

            <Scoreline result={lead} />

            <p
              style={{
                color: "#d2d8e0",
                lineHeight: 1.85,
                fontSize: "15px",
                margin: "0 0 20px",
              }}
            >
              {teaser(lead)}
            </p>

            <Link
              href={editionUrl}
              style={{
                display: "inline-block",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: 900,
                textDecoration: "none",
                borderBottom:
                  "2px solid #ffffff",
                paddingBottom: "4px",
              }}
            >
              READ THE FULL STORY →
            </Link>
          </article>

          <section
            style={{
              marginBottom: "30px",
            }}
          >
            <SectionHeading
              eyebrow="The Rest of the Carnage"
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
                  <Link
                    href={editionUrl}
                    style={{
                      color: "inherit",
                      textDecoration: "none",
                    }}
                  >
                    {headline(result)}
                  </Link>
                </h3>

                <p
                  style={{
                    fontSize: "13px",
                    fontWeight: 800,
                    margin: "0 0 12px",
                  }}
                >
                  {teamName(
                    result.winner,
                    result.game.season
                  )}
                  {" "}
                  {pts(result.winnerScore)}
                  {" — "}
                  {pts(result.loserScore)}
                  {" "}
                  {teamName(
                    result.loser,
                    result.game.season
                  )}
                </p>

                <p
                  style={{
                    ...muted,
                    fontSize: "14px",
                    lineHeight: 1.75,
                    margin: "0 0 14px",
                  }}
                >
                  {teaser(result)}
                </p>

                <Link
                  href={editionUrl}
                  style={{
                    color: "#ffffff",
                    fontSize: "12px",
                    fontWeight: 800,
                    textDecoration: "none",
                  }}
                >
                  Read the Weekly Roundup →
                </Link>
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
                  fontSize: "25px",
                  margin: "0 0 12px",
                }}
              >
                {manager(fraud.loser)}
              </h3>

              <p
                style={{
                  ...muted,
                  fontSize: "14px",
                  lineHeight: 1.8,
                  margin: "0 0 16px",
                }}
              >
                This week's prestigious
                dishonour goes to{" "}
                {manager(fraud.loser)},
                after{" "}
                {teamName(
                  fraud.loser,
                  edition.season
                )}{" "}
                suffered the largest
                defeat of the round:
                a{" "}
                {pts(fraud.margin)}-point
                hiding at the hands of{" "}
                {teamName(
                  fraud.winner,
                  edition.season
                )}.
              </p>

              <Link
                href={editionUrl}
                style={{
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 800,
                  textDecoration: "none",
                }}
              >
                Read the Full Award Citation →
              </Link>
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
                    margin: "0 0 10px",
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
                    margin: "0 0 16px",
                  }}
                >
                  {teaser(flashback)}
                </p>

                <Link
                  href={
                    `/news/` +
                    `${flashback.game.season}/` +
                    `${flashback.game.week}`
                  }
                  style={{
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: 800,
                    textDecoration: "none",
                  }}
                >
                  Revisit the Old Edition →
                </Link>
              </>
            ) : (
              <p
                style={{
                  ...muted,
                  fontSize: "14px",
                  lineHeight: 1.8,
                  margin: 0,
                }}
              >
                The archives are
                suspiciously quiet.
                No completed historical
                fixture is available
                for this week.
              </p>
            )}
          </section>

          <section
            style={{
              ...panel,
              marginBottom: "30px",
              textAlign: "center",
            }}
          >
            <p
              style={{
                ...muted,
                fontSize: "11px",
                fontWeight: 800,
                letterSpacing: "2px",
                margin: "0 0 12px",
              }}
            >
              THE COMPLETE EDITION
            </p>

            <h2
              style={{
                fontSize: "24px",
                lineHeight: 1.25,
                margin: "0 0 14px",
              }}
            >
              All Five Games.
              One Absolutely Disgraceful
              Newspaper.
            </h2>

            <p
              style={{
                ...muted,
                fontSize: "14px",
                lineHeight: 1.75,
                margin: "0 0 20px",
              }}
            >
              The main scandal,
              four more match reports,
              this week's award-winning
              incompetence and a trip
              through the SFL archives.
            </p>

            <Link
              href={editionUrl}
              style={{
                display: "inline-block",
                background: "#ffffff",
                color: "#151b23",
                borderRadius: "10px",
                padding: "12px 18px",
                fontSize: "13px",
                fontWeight: 900,
                textDecoration: "none",
              }}
            >
              READ WEEK {edition.week} →
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
          Real scores.
          Questionable journalism.
          No refunds.
        </p>
      </footer>
    </main>
  );
}
