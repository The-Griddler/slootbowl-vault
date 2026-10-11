
import Link from "next/link";
import type { CSSProperties } from "react";
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

const SPONSORS = [
  "Aaron Hernandez Memorial Foundation",
  "Tom Brady's Missing Rings",
  "Need For Speed: The Henry Ruggs Edition",
  "Michael Vick's Society of Good Boys",
  "Houston School of Massage",
  "Stefon Diggs & Boston Culinary School",
  "The Ryan Whiting Football Academy",
  "Garrett Etheridge's Playoff Preparation Centre",
  "The Commissioner's Independent Ethics Committee",
  "The Ballbags Ministry of Information",
];

const MUTED = "#929eae";

const PANEL: CSSProperties = {
  background: "#151b23",
  border: "1px solid #27303b",
  borderRadius: 16,
  padding: 20,
};

function teamName(id: number, season: string) {
  if (id === 1 && Number(season) < 2026) {
    return "Perth Ballbags";
  }

  return TEAMS[id] ?? `Franchise ${id}`;
}

function score(value: number) {
  return value.toFixed(2);
}

function isComplete(game: HistoricalMatchup) {
  return (
    game.phase === "Regular Season" &&
    game.isComplete === true &&
    game.week >= 1 &&
    game.week <= 14 &&
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

  if (game.scoreA === game.scoreB) {
    return null;
  }

  const aWon = game.scoreA > game.scoreB;

  const winner = aWon
    ? game.rosterA
    : game.rosterB;

  const loser = aWon
    ? game.rosterB
    : game.rosterA;

  const winnerScore = aWon
    ? game.scoreA
    : game.scoreB;

  const loserScore = aWon
    ? game.scoreB
    : game.scoreA;

  return {
    game,
    winner,
    loser,
    winnerScore,
    loserScore,
    margin: winnerScore - loserScore,
    total: winnerScore + loserScore,
  };
}

function rivalry(a: number, b: number) {
  const ids = [a, b].sort((x, y) => x - y);
  const key = ids.join("-");

  const names: Record<string, string> = {
    "1-3": "The Shotty Bowl",
    "4-7": "The Paddletap Bowl",
    "4-9": "The OBFC Grudge Match",
    "1-10": "The Commissioner's Nightmare",
  };

  return names[key] ?? null;
}

function importance(result: Result) {
  let value = result.margin * 0.4;

  if (result.margin <= 3) value += 40;
  if (result.margin >= 40) value += 20;
  if (result.winnerScore >= 175) value += 25;
  if (result.total >= 330) value += 30;

  if (rivalry(result.winner, result.loser)) {
    value += 45;
  }

  return value;
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

  if (games.length !== 5) return null;

  const teams = new Set<number>();

  for (const game of games) {
    if (
      game.rosterA < 1 ||
      game.rosterA > 10 ||
      game.rosterB < 1 ||
      game.rosterB > 10 ||
      game.rosterA === game.rosterB
    ) {
      return null;
    }

    teams.add(game.rosterA);
    teams.add(game.rosterB);
  }

  if (teams.size !== 10) return null;

  const results = games.map(toResult);

  if (results.some((result) => !result)) {
    return null;
  }

  return {
    season: season.league.season,
    week,
    results: (results as Result[]).sort(
      (a, b) =>
        importance(b) - importance(a) ||
        b.margin - a.margin
    ),
  };
}

function allEditions(
  seasons: HistoricalSeason[]
) {
  const editions: Edition[] = [];

  for (const season of seasons) {
    for (let week = 1; week <= 14; week++) {
      const edition = editionFrom(season, week);

      if (edition) {
        editions.push(edition);
      }
    }
  }

  return editions.sort(
    (a, b) =>
      Number(b.season) - Number(a.season) ||
      b.week - a.week
  );
}

function pick(
  choices: string[],
  season: string,
  week: number,
  salt = 0
) {
  const seed =
    Number(season) * 17 +
    week * 31 +
    salt * 13;

  return choices[
    Math.abs(seed) % choices.length
  ];
}

function headline(
  result: Result,
  season: string
) {
  const winner = teamName(
    result.winner,
    season
  );

  const loser = teamName(
    result.loser,
    season
  );

  const derby = rivalry(
    result.winner,
    result.loser
  );

  if (derby) {
    return `${derby} Descends Into Absolute Fucking Chaos`;
  }

  if (result.margin <= 2) {
    return `${winner} Escape With Their Lives as ${loser} Suffer Heartbreak`;
  }

  if (result.margin >= 45) {
    return `${winner} Accused of War Crimes Following ${loser} Massacre`;
  }

  if (result.winnerScore >= 175) {
    return `${winner} Go Nuclear in Offensive Exhibition`;
  }

  if (result.winner === 1) {
    return "BALLBAGS VICTORY DECLARED NATIONAL HOLIDAY";
  }

  if (result.loser === 5) {
    return "WHITING'S LATEST DISASTER PROMPTS PUBLIC INQUIRY";
  }

  if (result.loser === 6) {
    return "GARRETT FACES QUESTIONS AFTER LINCOLN SETBACK";
  }

  return `${winner} Put ${loser} to the Sword`;
}

function leadTeaser(
  result: Result,
  season: string,
  week: number
) {
  const winner = teamName(
    result.winner,
    season
  );

  const loser = teamName(
    result.loser,
    season
  );

  if (result.margin <= 3) {
    return `${winner} survived a ${score(result.margin)}-point thriller against ${loser}. Sloot News investigates the collapse, the controversy and the manager currently pretending everything is fine.`;
  }

  if (result.margin >= 40) {
    return `${loser} suffered a ${score(result.margin)}-point demolition at the hands of ${winner}. The newsroom has seen enough to recommend an independent investigation.`;
  }

  if (result.winnerScore >= 175) {
    return `${winner} exploded for ${score(result.winnerScore)} points. The opposition has requested anonymity, while the editorial department prepares a full report on the carnage.`;
  }

  return pick(
    [
      `${winner} emerged victorious over ${loser}, but the final score only tells part of the story. Our correspondents have been examining the damage.`,
      `${winner} took the points against ${loser}. Behind the result lies a week of questionable decisions and deeply unfortunate consequences.`,
      `Another week, another SFL manager forced to explain himself. ${winner} beat ${loser}, and the newsroom has several questions.`,
    ],
    season,
    week,
    result.winner
  );
}

function shitcunt(
  results: Result[],
  season: string
) {
  const worst = [...results].sort(
    (a, b) =>
      b.margin - a.margin ||
      a.loserScore - b.loserScore
  )[0];

  if (!worst) return null;

  return {
    manager: MANAGERS[worst.loser],
    team: teamName(worst.loser, season),
    margin: worst.margin,
  };
}

function vaultTeaser(
  season: string,
  week: number
) {
  return pick(
    [
      "An old result has resurfaced, and at least one SFL manager is desperately hoping nobody remembers the details. Our investigative desk has other ideas.",
      "A forgotten humiliation. A fresh connection. And a historical scoreboard that refuses to keep its fucking mouth shut. The Sloot News archives have been reopened.",
      "Some managers believe time heals all wounds. Unfortunately, Sloot News has retained the original scores and has absolutely no intention of letting anybody move on.",
      "An incident from the SFL's past has become suspiciously relevant again. The newsroom has uncovered the evidence, and somebody's reputation is about to take another kicking.",
      "The commissioner's office has reportedly requested that several historical documents be destroyed. Our investigators have instead decided to publish an article about them.",
    ],
    season,
    week,
    47
  );
}

function ArticleLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      style={{
        color: "#f4f5f7",
        fontSize: 12,
        fontWeight: 900,
        letterSpacing: 0.5,
        textDecoration: "none",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 0",
      }}
    >
      {children} →
    </Link>
  );
}

function FeatureCard({
  eyebrow,
  title,
  description,
  href,
  linkText,
}: {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  linkText: string;
}) {
  return (
    <article
      style={{
        ...PANEL,
        display: "flex",
        flexDirection: "column",
        minHeight: 215,
      }}
    >
      <p
        style={{
          color: MUTED,
          fontSize: 10,
          fontWeight: 900,
          letterSpacing: 1.5,
          margin: "0 0 12px",
        }}
      >
        {eyebrow}
      </p>

      <h3
        style={{
          fontSize: 22,
          lineHeight: 1.18,
          margin: "0 0 13px",
        }}
      >
        {title}
      </h3>

      <p
        style={{
          color: "#b9c3d0",
          fontSize: 13,
          lineHeight: 1.7,
          margin: "0 0 14px",
          flex: 1,
        }}
      >
        {description}
      </p>

      <ArticleLink href={href}>
        {linkText}
      </ArticleLink>
    </article>
  );
}

export default async function HomePage() {
  const seasons = await getHistoricalData();
  const editions = allEditions(seasons);
  const latest = editions[0];

  const base = latest
    ? `/news/${latest.season}/${latest.week}`
    : null;

  const lead = latest?.results[0];
  const otherGames =
    latest?.results.slice(1) ?? [];

  const worst = latest
    ? shitcunt(latest.results, latest.season)
    : null;

  const sponsor = latest
    ? pick(
        SPONSORS,
        latest.season,
        latest.week
      )
    : "The Commissioner's Independent Ethics Committee";

  return (
    <main
      style={{
        color: "#f4f5f7",
        paddingBottom: 42,
      }}
    >
      <header
        style={{
          textAlign: "center",
          borderBottom: "3px double #f4f5f7",
          paddingBottom: 20,
          marginBottom: 27,
        }}
      >
        <p
          style={{
            color: MUTED,
            fontSize: 10,
            fontWeight: 900,
            letterSpacing: 2,
            margin: "0 0 13px",
          }}
        >
          THE OFFICIAL UNOFFICIAL VOICE OF THE SFL
        </p>

        <h1
          style={{
            fontSize: "clamp(43px, 12vw, 76px)",
            letterSpacing: -3,
            fontWeight: 950,
            lineHeight: 0.98,
            margin: "0 0 12px",
          }}
        >
          SLOOT NEWS
        </h1>

        <p
          style={{
            fontSize: 14,
            fontWeight: 800,
            margin: "0 0 18px",
          }}
        >
          Your Home of Sloot Sport
        </p>

        <div
          style={{
            borderTop: "1px solid #364150",
            borderBottom: "1px solid #364150",
            padding: "10px 0",
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            color: MUTED,
            fontSize: 10,
            fontWeight: 900,
            letterSpacing: 0.7,
          }}
        >
          <span>
            {latest
              ? `${latest.season} SEASON`
              : "SFL NEWSROOM"}
          </span>

          <span>
            {latest
              ? `WEEK ${latest.week} EDITION`
              : "AWAITING RESULTS"}
          </span>
        </div>

        <p
          style={{
            color: MUTED,
            fontSize: 10,
            lineHeight: 1.6,
            margin: "12px 0 0",
          }}
        >
          This edition is brought to you by
          {" "}
          <strong>{sponsor}</strong>.
          No questions, please.
        </p>
      </header>

      {!latest || !lead || !base ? (
        <section style={PANEL}>
          <h2
            style={{
              fontSize: 25,
              margin: "0 0 13px",
            }}
          >
            The Newsroom Is Awaiting Its First Edition
          </h2>

          <p
            style={{
              color: MUTED,
              fontSize: 14,
              lineHeight: 1.8,
              margin: 0,
            }}
          >
            Sloot News publishes its weekly
            front page after all five
            regular-season matchups are
            officially complete. No
            provisional scores, no invented
            results and absolutely no
            journalistic integrity.
          </p>
        </section>
      ) : (
        <>
          <section
            style={{
              ...PANEL,
              marginBottom: 27,
            }}
          >
            <p
              style={{
                color: MUTED,
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: 2,
                margin: "0 0 13px",
              }}
            >
              FRONT PAGE · THE WEEKLY SHITSHOW
            </p>

            <h2
              style={{
                fontSize: "clamp(30px, 8vw, 45px)",
                lineHeight: 1.1,
                letterSpacing: -1,
                margin: "0 0 18px",
              }}
            >
              {headline(lead, latest.season)}
            </h2>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 8,
                marginBottom: 18,
              }}
            >
              <span
                style={{
                  background: "#27303b",
                  borderRadius: 7,
                  padding: "7px 10px",
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                {teamName(
                  lead.winner,
                  latest.season
                )}
                {" "}
                {score(lead.winnerScore)}
              </span>

              <span
                style={{
                  color: MUTED,
                  fontSize: 11,
                }}
              >
                DEFEATS
              </span>

              <span
                style={{
                  background: "#27303b",
                  borderRadius: 7,
                  padding: "7px 10px",
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                {teamName(
                  lead.loser,
                  latest.season
                )}
                {" "}
                {score(lead.loserScore)}
              </span>
            </div>

            <p
              style={{
                color: "#d2d8e0",
                fontSize: 15,
                lineHeight: 1.8,
                margin: "0 0 14px",
              }}
            >
              {leadTeaser(
                lead,
                latest.season,
                latest.week
              )}
            </p>

            <p
              style={{
                color: MUTED,
                fontSize: 12,
                lineHeight: 1.7,
                margin: "0 0 14px",
              }}
            >
              Plus: the other four fixtures,
              questionable management
              decisions and the complete
              weekly roundup.
            </p>

            <ArticleLink href={base}>
              READ THE FULL WEEKLY SHITSHOW
            </ArticleLink>
          </section>

          <section
            style={{
              marginBottom: 29,
            }}
          >
            <div
              style={{
                borderBottom:
                  "1px solid #445061",
                marginBottom: 16,
                paddingBottom: 10,
              }}
            >
              <p
                style={{
                  color: MUTED,
                  fontSize: 10,
                  fontWeight: 900,
                  letterSpacing: 2,
                  margin: "0 0 5px",
                }}
              >
                THE REST OF THE FRONT PAGE
              </p>

              <h2
                style={{
                  fontSize: 25,
                  margin: 0,
                }}
              >
                More From the Newsroom
              </h2>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
                gap: 13,
              }}
            >
              <FeatureCard
                eyebrow="ANALYSIS · POWER RANKINGS"
                title="The Sloot Power Index"
                description="Ten franchises. Four ridiculous tiers. One editorial board with a deeply suspicious relationship to the Ballbags. Find out who's rising and who's been shafted."
                href={`${base}/power-rankings`}
                linkText="VIEW THE RANKINGS"
              />

              <FeatureCard
                eyebrow="COMING UP · PREDICTIONS"
                title="Eight Experts. Zero Accountability."
                description={`The Sloot News panel turns its attention to Week ${latest.week + 1}. Forty exact-score predictions, several personal vendettas and one expert who may not understand the sport.`}
                href={`${base}/predictions`}
                linkText="SEE THE PUNDIT PICKS"
              />

              <FeatureCard
                eyebrow="THE AWARDS · OBFC & GPFC"
                title="The Conference Honours"
                description="Who produced the week's finest individual performances? And which manager managed to waste an absolute masterpiece? The awards committee has reached its verdict."
                href={`${base}/awards`}
                linkText="MEET THE WINNERS"
              />
            </div>
          </section>

          <section
            style={{
              ...PANEL,
              marginBottom: 27,
            }}
          >
            <p
              style={{
                color: MUTED,
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: 2,
                margin: "0 0 10px",
              }}
            >
              THE SHITCUNT OF THE WEEK
            </p>

            <h2
              style={{
                fontSize: 25,
                lineHeight: 1.2,
                margin: "0 0 12px",
              }}
            >
              An Honour Nobody Wants
            </h2>

            <p
              style={{
                color: "#d2d8e0",
                fontSize: 14,
                lineHeight: 1.8,
                margin: "0 0 12px",
              }}
            >
              {worst
                ? `One manager has emerged from Week ${latest.week} with a particularly difficult set of questions to answer. A ${score(worst.margin)}-point defeat has caught the attention of our disciplinary correspondents.`
                : "The disciplinary committee is reviewing the week's events."}
            </p>

            <p
              style={{
                color: MUTED,
                fontSize: 12,
                lineHeight: 1.7,
                margin: "0 0 12px",
              }}
            >
              The full report, including the
              unfortunate identity of the
              accused, appears in this
              week's main article.
            </p>

            <ArticleLink href={base}>
              DISCOVER THE ACCUSED
            </ArticleLink>
          </section>

          <section
            style={{
              ...PANEL,
              marginBottom: 27,
            }}
          >
            <p
              style={{
                color: MUTED,
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: 2,
                margin: "0 0 10px",
              }}
            >
              FROM THE VAULT · SFL HISTORY
            </p>

            <h2
              style={{
                fontSize: 25,
                lineHeight: 1.2,
                margin: "0 0 12px",
              }}
            >
              The Past Refuses to Stay Buried
            </h2>

            <p
              style={{
                color: "#d2d8e0",
                fontSize: 14,
                lineHeight: 1.8,
                margin: "0 0 12px",
              }}
            >
              {vaultTeaser(
                latest.season,
                latest.week
              )}
            </p>

            <ArticleLink
              href={`${base}/from-the-vault`}
            >
              OPEN THE HISTORICAL INVESTIGATION
            </ArticleLink>
          </section>

          <section
            style={{
              ...PANEL,
              marginBottom: 28,
            }}
          >
            <p
              style={{
                color: MUTED,
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: 2,
                margin: "0 0 12px",
              }}
            >
              THE WEEK AT A GLANCE
            </p>

            <h2
              style={{
                fontSize: 23,
                margin: "0 0 16px",
              }}
            >
              Five Games. Plenty of Damage.
            </h2>

            <p
              style={{
                color: MUTED,
                fontSize: 13,
                lineHeight: 1.75,
                margin: "0 0 16px",
              }}
            >
              The lead story wasn't the
              only fixture worth talking
              about. Here's who else
              featured this week.
            </p>

            {otherGames.map((result) => (
              <div
                key={`${result.winner}-${result.loser}`}
                style={{
                  borderTop: "1px solid #27303b",
                  padding: "14px 0",
                }}
              >
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    lineHeight: 1.5,
                    margin: "0 0 5px",
                  }}
                >
                  {teamName(
                    result.winner,
                    latest.season
                  )}
                  {" "}
                  vs
                  {" "}
                  {teamName(
                    result.loser,
                    latest.season
                  )}
                </p>

                <p
                  style={{
                    color: MUTED,
                    fontSize: 12,
                    lineHeight: 1.65,
                    margin: 0,
                  }}
                >
                  Another result, another
                  manager with something
                  to explain.
                </p>
              </div>
            ))}

            <ArticleLink href={base}>
              READ ALL FIVE MATCH REPORTS
            </ArticleLink>
          </section>

          <section
            style={{
              borderTop: "1px solid #445061",
              paddingTop: 20,
              textAlign: "center",
            }}
          >
            <p
              style={{
                color: MUTED,
                fontSize: 11,
                lineHeight: 1.8,
                margin: "0 0 12px",
              }}
            >
              Want to revisit an older
              edition? Each weekly article
              has its own permanent
              season-and-week URL.
            </p>

            <ArticleLink href={base}>
              OPEN THE LATEST WEEKLY EDITION
            </ArticleLink>
          </section>
        </>
      )}

      <footer
        style={{
          borderTop: "2px solid #f4f5f7",
          textAlign: "center",
          marginTop: 34,
          paddingTop: 22,
        }}
      >
        <p
          style={{
            fontSize: 18,
            fontWeight: 900,
            letterSpacing: 2,
            margin: "0 0 7px",
          }}
        >
          SLOOT NEWS
        </p>

        <p
          style={{
            color: MUTED,
            fontSize: 12,
            margin: "0 0 12px",
          }}
        >
          Your Home of Sloot Sport
        </p>

        <p
          style={{
            color: MUTED,
            fontSize: 11,
            lineHeight: 1.7,
            margin: 0,
          }}
        >
          Independent journalism.
          Dependent on the commissioner's
          continued financial support.
        </p>
      </footer>
    </main>
  );
}
