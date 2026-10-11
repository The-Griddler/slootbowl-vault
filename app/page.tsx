
import Link from "next/link";
import {
  getHistoricalData,
  type HistoricalMatchup,
  type HistoricalSeason,
} from "../lib/sleeper";

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

const MANAGER_LORE: Record<number, string[]> = {
  1: [
    "The commissioner has demanded an independent investigation. He will, naturally, be conducting it himself.",
    "Ed Nelms has reportedly described this as a pivotal moment in the Ballbags dynasty. The newsroom has requested evidence that such a dynasty exists.",
    "The Ballbags' performance will be discussed at the next league meeting, assuming the commissioner can find a way to make it about himself.",
  ],
  2: [
    "Ben Smith has seen Cambridge reach the biggest stage before. The question is whether the Cum Sluts can remember how to get back there.",
    "Cambridge's former reputation as a GPFC heavyweight continues to do an extraordinary amount of unpaid labour.",
    "Ben Smith will be hoping the Cum Sluts can produce something more substantial than nostalgia.",
  ],
  3: [
    "Jake Greenwood has spent years building a reputation for reaching the playoffs. The trophy cabinet remains a considerably quieter subject.",
    "The Chode Chokers have once again provided compelling evidence that enthusiasm and competence are not necessarily related.",
    "Grimsby's supporters remain optimistic, a condition for which modern medicine has apparently found no cure.",
  ],
  4: [
    "George Pendleton has won a Slootbowl and still somehow finds new reasons to be furious about fantasy football.",
    "The Happy Endings remain one of the SFL's most decorated franchises, a fact George is unlikely to let anyone forget.",
    "Pendleton's relationship with the OBFC has long resembled an abusive marriage in which he keeps winning custody of the trophy.",
  ],
  5: [
    "Ryan Whiting's Fingerblasters have developed a habit of looking dangerous, which is not quite the same as actually finishing the job.",
    "Grays Town's ambitions remain enormous. Their tolerance for December disappointment is being tested.",
    "The Fingerblasters have promised that this time things will be different. Sloot News has heard that one before.",
  ],
  6: [
    "Garrett Etheridge has assembled some formidable Lincoln sides. Converting regular-season success into playoff glory remains an ongoing administrative issue.",
    "The Nonces continue to pursue the elusive combination of a strong roster and a functioning postseason.",
    "Lincoln's trophy ambitions remain intact, despite the inconvenient absence of the trophy itself.",
  ],
  7: [
    "Ollie Payne has survived enough public humiliation to qualify for diplomatic immunity.",
    "The Dirty Vegans continue their campaign to prove that unpredictability is a legitimate team-building strategy.",
    "Kalamata's relationship with consistency remains strictly casual.",
  ],
  8: [
    "Jack Brannigan's long-term planning has previously involved trading tomorrow's problems for today's slightly different problems.",
    "Weybiza's draft-pick history remains the sort of material best examined by a forensic accountant.",
    "The BAB's continue to insist that the grand plan is coming together. Nobody has been given a completion date.",
  ],
  9: [
    "Tarl Brayer has endured enough agonising postseason defeats to qualify as an expert witness in sporting cruelty.",
    "East Rutherford's history suggests that hope is a dangerous substance and should be handled with protective equipment.",
    "The Shitlickers have already demonstrated that a fraction of a fantasy point can ruin an entire winter.",
  ],
  10: [
    "Josh Thomas has previously demonstrated that the regular season is apparently an optional part of winning championships.",
    "Chad's back-to-back Slootbowl titles remain an insult to everyone who believes good teams should occasionally win games before December.",
    "The Moist Discharge have made a mockery of conventional sporting logic, which is frankly impressive in a league with such low standards.",
  ],
};

const RIVALRIES: {
  a: number;
  b: number;
  name: string;
  description: string;
}[] = [
  {
    a: 1,
    b: 3,
    name: "The Shotty Bowl",
    description:
      "Ed Nelms and Jake Greenwood have been making this personal since the early days of the SFL. Neither man's dignity has survived.",
  },
  {
    a: 4,
    b: 7,
    name: "The Paddletap Bowl",
    description:
      "George Pendleton and Ollie Payne have never needed a good reason to make a fantasy football fixture deeply unpleasant.",
  },
  {
    a: 4,
    b: 9,
    name: "The OBFC Grudge Match",
    description:
      "George Pendleton and Tarl Brayer have produced enough postseason trauma to keep the newsroom employed indefinitely.",
  },
  {
    a: 1,
    b: 10,
    name: "The Commissioner's Nightmare",
    description:
      "Josh Thomas has made an unfortunate habit of reminding the commissioner that regular-season records do not guarantee playoff survival.",
  },
];

type Game = HistoricalMatchup;

type Result = {
  game: Game;
  winner: number;
  loser: number;
  winningScore: number;
  losingScore: number;
  margin: number;
  total: number;
};

type Edition = {
  season: string;
  week: number;
  games: Game[];
};

const panel: React.CSSProperties = {
  background: "#151b23",
  border: "1px solid #27303b",
  borderRadius: "18px",
  padding: "20px",
};

const muted: React.CSSProperties = {
  color: "#929eae",
};

function name(id: number, season: string): string {
  if (id === 1 && Number(season) < 2026) {
    return "Perth Ballbags";
  }

  return TEAMS[id] ?? `Franchise ${id}`;
}

function manager(id: number): string {
  return MANAGERS[id] ?? "Unknown Manager";
}

function points(value: number): string {
  return value.toFixed(2);
}

function pick<T>(items: T[], seed: number): T {
  return items[
    Math.abs(Math.trunc(seed)) % items.length
  ];
}

function completed(game: Game): boolean {
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

function resultOf(game: Game): Result | null {
  if (!completed(game)) return null;
  if (game.scoreA === game.scoreB) return null;

  const aWon = game.scoreA > game.scoreB;

  return {
    game,
    winner: aWon ? game.rosterA : game.rosterB,
    loser: aWon ? game.rosterB : game.rosterA,
    winningScore: aWon ? game.scoreA : game.scoreB,
    losingScore: aWon ? game.scoreB : game.scoreA,
    margin: Math.abs(game.scoreA - game.scoreB),
    total: game.scoreA + game.scoreB,
  };
}

function editionOf(
  seasons: HistoricalSeason[]
): Edition | null {
  const editions: Edition[] = [];

  for (const season of seasons) {
    for (let week = 1; week <= 14; week++) {
      const games = season.matchups.filter(
        (game) =>
          game.week === week && completed(game)
      );

      const rosters = new Set<number>();

      for (const game of games) {
        rosters.add(game.rosterA);
        rosters.add(game.rosterB);
      }

      if (games.length === 5 && rosters.size === 10) {
        editions.push({
          season: season.league.season,
          week,
          games,
        });
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

function storySeed(result: Result): number {
  return (
    Number(result.game.season) * 31 +
    result.game.week * 17 +
    result.winner * 11 +
    result.loser * 7
  );
}

function rivalryFor(
  a: number,
  b: number
) {
  return RIVALRIES.find(
    (rivalry) =>
      (rivalry.a === a && rivalry.b === b) ||
      (rivalry.a === b && rivalry.b === a)
  );
}

function headline(result: Result): string {
  const season = result.game.season;
  const winner = name(result.winner, season);
  const loser = name(result.loser, season);
  const seed = storySeed(result);
  const rivalry = rivalryFor(
    result.winner,
    result.loser
  );

  if (rivalry) {
    return pick(
      [
        `${rivalry.name} Descends Into Farce as ${winner} Claim Bragging Rights`,
        `${winner} Win ${rivalry.name}; ${loser} Left to Contemplate Their Life Choices`,
        `Bad Blood, Worse Decisions: ${winner} Take ${rivalry.name}`,
      ],
      seed
    );
  }

  if (result.margin <= 2) {
    return pick(
      [
        `${winner} Survive by ${points(result.margin)} as ${loser} Suffer Fresh Psychological Damage`,
        `${loser} Lose by a Pubic Hair; ${winner} Somehow Escape`,
        `Scenes of Absolute Misery as ${winner} Edge ${loser}`,
      ],
      seed
    );
  }

  if (result.margin >= 45) {
    return pick(
      [
        `${winner} Commit Football Atrocity Against Helpless ${loser}`,
        `${loser} Found Dead in Fantasy Football Massacre`,
        `${winner} Demolish ${loser}; Police Decline to Investigate`,
      ],
      seed
    );
  }

  if (result.winningScore >= 175) {
    return pick(
      [
        `${winner} Go Absolutely Feral in Victory Over ${loser}`,
        `${winner} Unleash ${points(result.winningScore)}-Point Nightmare`,
        `${loser} Powerless as ${winner} Put on Offensive Filth`,
      ],
      seed
    );
  }

  return pick(
    [
      `${winner} Beat ${loser}; Standards Across League Remain Abysmal`,
      `${loser} Fail to Prevent Entirely Predictable ${winner} Victory`,
      `${winner} Claim Win as ${loser} Offer Nothing But Excuses`,
      `${winner} Get the Job Done; ${loser} Get the Piss Taken`,
    ],
    seed
  );
}

function matchReport(result: Result): string {
  const season = result.game.season;
  const winner = name(result.winner, season);
  const loser = name(result.loser, season);
  const seed = storySeed(result);

  const opening =
    `${winner} defeated ${loser} ` +
    `${points(result.winningScore)}–` +
    `${points(result.losingScore)} in Week ` +
    `${result.game.week}, a margin of ` +
    `${points(result.margin)} points.`;

  let analysis: string;

  if (result.margin <= 2) {
    analysis = pick(
      [
        `For ${manager(result.loser)}, the defeat was narrow enough to be agonising and decisive enough to be completely irreversible.`,
        `The margin was so small that ${manager(result.loser)} may spend the next several days examining individual catches like a deranged forensic scientist.`,
        `${manager(result.winner)} will call it resilience. ${manager(result.loser)} will probably call it a fucking disgrace.`,
      ],
      seed
    );
  } else if (result.margin >= 45) {
    analysis = pick(
      [
        `At some point this stopped resembling a competitive fixture and became an elaborate public humiliation of ${manager(result.loser)}.`,
        `The losing side contributed admirably to the spectacle by providing absolutely no meaningful resistance.`,
        `${manager(result.winner)} enjoyed the sort of afternoon normally reserved for people playing video games against children.`,
      ],
      seed
    );
  } else if (result.winningScore >= 175) {
    analysis = pick(
      [
        `${manager(result.winner)} produced a scoring performance bordering on indecent. Unfortunately for ${manager(result.loser)}, the league has no mercy rule.`,
        `The winning total was outrageous. ${manager(result.loser)} may wish to check whether the opposition fielded more than the permitted number of players.`,
      ],
      seed
    );
  } else {
    analysis = pick(
      [
        `${manager(result.winner)} takes the points and the bragging rights. ${manager(result.loser)} takes another unwanted entry in the league archives.`,
        `It was a thoroughly respectable victory, which makes it all the more irritating for the losing manager.`,
        `The result will delight one dressing room and inspire several increasingly unconvincing excuses in the other.`,
      ],
      seed
    );
  }

  const rivalry = rivalryFor(
    result.winner,
    result.loser
  );

  const context = rivalry
    ? ` ${rivalry.description}`
    : "";

  const personal = pick(
    MANAGER_LORE[result.loser] ?? [
      "The losing manager declined to improve the result.",
    ],
    seed + 3
  );

  return `${opening} ${analysis}${context} ${personal}`;
}

function leadScore(result: Result): number {
  let score = result.margin * 0.45;

  if (result.margin <= 3) score += 35;
  if (result.margin >= 40) score += 25;
  if (result.winningScore >= 175) score += 20;
  if (result.total >= 330) score += 25;

  if (rivalryFor(result.winner, result.loser)) {
    score += 45;
  }

  return score;
}

function SectionHeading({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <p
        style={{
          ...muted,
          margin: "0 0 5px",
          fontSize: "11px",
          fontWeight: 800,
          letterSpacing: "2px",
          textTransform: "uppercase",
        }}
      >
        {eyebrow}
      </p>

      <h2
        style={{
          fontSize: "24px",
          lineHeight: 1.2,
          margin: 0,
        }}
      >
        {title}
      </h2>
    </div>
  );
}

export default async function Home() {
  const seasons = await getHistoricalData();
  const edition = editionOf(seasons);

  const results = edition
    ? edition.games
        .map(resultOf)
        .filter(
          (result): result is Result =>
            result !== null
        )
    : [];

  const ranked = [...results].sort(
    (a, b) =>
      leadScore(b) - leadScore(a) ||
      b.margin - a.margin
  );

  const lead = ranked[0];

  const biggestWin = [...results].sort(
    (a, b) => b.margin - a.margin
  )[0];

  const closest = [...results].sort(
    (a, b) => a.margin - b.margin
  )[0];

  const highestScoring = [...results].sort(
    (a, b) => b.winningScore - a.winningScore
  )[0];

  const flashbackCandidates = seasons
    .filter(
      (season) =>
        edition &&
        Number(season.league.season) <
          Number(edition.season)
    )
    .flatMap((season) => season.matchups)
    .filter(
      (game) =>
        edition &&
        game.week === edition.week &&
        completed(game)
    )
    .map(resultOf)
    .filter(
      (result): result is Result =>
        result !== null
    );

  const flashback = flashbackCandidates.sort(
    (a, b) =>
      leadScore(b) - leadScore(a)
  )[0];

  const rivalryResult = results.find(
    (result) =>
      rivalryFor(result.winner, result.loser)
  );

  const rivalry = rivalryResult
    ? rivalryFor(
        rivalryResult.winner,
        rivalryResult.loser
      )
    : null;

  return (
    <main style={{ paddingBottom: "32px" }}>
      <header
        style={{
          textAlign: "center",
          marginBottom: "28px",
          borderBottom: "2px solid #ffffff",
          paddingBottom: "20px",
        }}
      >
        <p
          style={{
            ...muted,
            fontSize: "11px",
            letterSpacing: "3px",
            fontWeight: 800,
            margin: "0 0 12px",
          }}
        >
          THE SFL CLUBHOUSE PRESENTS
        </p>

        <h1
          style={{
            fontSize: "clamp(36px, 10vw, 56px)",
            fontWeight: 900,
            letterSpacing: "-2px",
            lineHeight: 1,
            margin: 0,
          }}
        >
          SLOOT NEWS
        </h1>

        <p
          style={{
            margin: "12px 0 0",
            fontSize: "14px",
            fontWeight: 700,
          }}
        >
          Your Home of Sloot Sport
        </p>

        <div
          style={{
            marginTop: "20px",
            paddingTop: "12px",
            borderTop: "1px solid #27303b",
            display: "flex",
            justifyContent: "space-between",
            gap: "12px",
            fontSize: "11px",
            fontWeight: 800,
            letterSpacing: "1px",
            color: "#929eae",
          }}
        >
          <span>DYNASTY SLUTS</span>
          <span>
            {edition
              ? `${edition.season} · WEEK ${edition.week}`
              : "THE ARCHIVES"}
          </span>
        </div>
      </header>

      {!edition || !lead ? (
        <section style={panel}>
          <p
            style={{
              ...muted,
              fontSize: "11px",
              letterSpacing: "2px",
              fontWeight: 800,
            }}
          >
            NEWSROOM NOTICE
          </p>

          <h2 style={{ fontSize: "25px" }}>
            The Presses Are Temporarily Silent
          </h2>

          <p style={muted}>
            No fully completed regular-season
            matchweek is available yet.
            The editorial staff have been sent
            to the pub until further notice.
          </p>
        </section>
      ) : (
        <>
          <section
            style={{
              ...panel,
              marginBottom: "30px",
              borderTop: "4px solid #ffffff",
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
              FRONT PAGE EXCLUSIVE
            </p>

            <h2
              style={{
                fontSize: "clamp(26px, 7vw, 36px)",
                lineHeight: 1.12,
                letterSpacing: "-0.8px",
                margin: "0 0 16px",
              }}
            >
              {headline(lead)}
            </h2>

            <p
              style={{
                color: "#d2d8e0",
                lineHeight: 1.75,
                fontSize: "15px",
                margin: "0 0 18px",
              }}
            >
              {matchReport(lead)}
            </p>

            <div
              style={{
                borderTop: "1px solid #27303b",
                paddingTop: "15px",
              }}
            >
              <p
                style={{
                  ...muted,
                  fontSize: "11px",
                  fontWeight: 800,
                  letterSpacing: "1px",
                  margin: "0 0 8px",
                }}
              >
                THE FINAL SCORE
              </p>

              <p
                style={{
                  fontWeight: 800,
                  fontSize: "17px",
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                {name(lead.winner, edition.season)}
                {" "}
                {points(lead.winningScore)}
                <span style={muted}> — </span>
                {points(lead.losingScore)}
                {" "}
                {name(lead.loser, edition.season)}
              </p>
            </div>
          </section>

          <section style={{ marginBottom: "32px" }}>
            <SectionHeading
              eyebrow="Five Games. Ten Suspects."
              title="Around the SFL"
            />

            {ranked.map((result) => (
              <article
                key={
                  `${result.game.season}-` +
                  `${result.game.week}-` +
                  `${result.game.rosterA}-` +
                  `${result.game.rosterB}`
                }
                style={{
                  ...panel,
                  marginBottom: "10px",
                }}
              >
                <p
                  style={{
                    ...muted,
                    margin: "0 0 10px",
                    fontSize: "10px",
                    letterSpacing: "1.5px",
                    fontWeight: 800,
                  }}
                >
                  {rivalryFor(
                    result.winner,
                    result.loser
                  )
                    ? "RIVALRY REPORT"
                    : "MATCH REPORT"}
                </p>

                <h3
                  style={{
                    fontSize: "18px",
                    margin: "0 0 10px",
                    lineHeight: 1.3,
                  }}
                >
                  {headline(result)}
                </h3>

                <p
                  style={{
                    fontWeight: 800,
                    margin: "0 0 12px",
                  }}
                >
                  {points(result.winningScore)}
                  {" — "}
                  {points(result.losingScore)}
                </p>

                <p
                  style={{
                    ...muted,
                    lineHeight: 1.7,
                    margin: 0,
                    fontSize: "14px",
                  }}
                >
                  {matchReport(result)}
                </p>
              </article>
            ))}
          </section>

          {biggestWin && (
            <section
              style={{
                ...panel,
                marginBottom: "30px",
              }}
            >
              <SectionHeading
                eyebrow="Sloot News Investigates"
                title="The Fraud Watch"
              />

              <p
                style={{
                  fontSize: "20px",
                  fontWeight: 800,
                  lineHeight: 1.3,
                }}
              >
                {name(
                  biggestWin.loser,
                  edition.season
                )}
              </p>

              <p
                style={{
                  ...muted,
                  lineHeight: 1.7,
                  fontSize: "14px",
                }}
              >
                {manager(biggestWin.loser)}
                {" "}
                presided over the week's
                largest defeat, losing by
                {" "}
                {points(biggestWin.margin)}
                {" "}
                points to
                {" "}
                {name(
                  biggestWin.winner,
                  edition.season
                )}.
                {" "}
                {pick(
                  MANAGER_LORE[biggestWin.loser],
                  Number(edition.season) +
                    edition.week
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
              eyebrow="The Numbers Don't Lie"
              title="This Week's Disgrace"
            />

            {closest && (
              <p
                style={{
                  fontSize: "14px",
                  lineHeight: 1.7,
                }}
              >
                <strong>Closest contest:</strong>
                {" "}
                {name(closest.winner, edition.season)}
                {" "}
                over
                {" "}
                {name(closest.loser, edition.season)}
                {" "}
                by
                {" "}
                {points(closest.margin)}
                {" "}
                points.
              </p>
            )}

            {highestScoring && (
              <p
                style={{
                  fontSize: "14px",
                  lineHeight: 1.7,
                }}
              >
                <strong>Highest team score:</strong>
                {" "}
                {name(
                  highestScoring.winner,
                  edition.season
                )}
                {" "}
                with
                {" "}
                {points(
                  highestScoring.winningScore
                )}
                {" "}
                points.
              </p>
            )}

            {biggestWin && (
              <p
                style={{
                  fontSize: "14px",
                  lineHeight: 1.7,
                }}
              >
                <strong>Biggest demolition:</strong>
                {" "}
                {points(biggestWin.margin)}
                {" "}
                points.
                An entirely unnecessary
                amount of suffering.
              </p>
            )}
          </section>

          {rivalry && rivalryResult && (
            <section
              style={{
                ...panel,
                marginBottom: "30px",
              }}
            >
              <SectionHeading
                eyebrow="Bad Blood Department"
                title="Rivalry Watch"
              />

              <h3
                style={{
                  fontSize: "20px",
                  margin: "0 0 12px",
                }}
              >
                {rivalry.name}
              </h3>

              <p
                style={{
                  ...muted,
                  lineHeight: 1.7,
                  fontSize: "14px",
                }}
              >
                {rivalry.description}
                {" "}
                This week,
                {" "}
                {name(
                  rivalryResult.winner,
                  edition.season
                )}
                {" "}
                took the bragging rights
                with a
                {" "}
                {points(rivalryResult.margin)}
                -point victory.
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
                    fontSize: "20px",
                    lineHeight: 1.3,
                  }}
                >
                  {headline(flashback)}
                </h3>

                <p
                  style={{
                    ...muted,
                    lineHeight: 1.7,
                    fontSize: "14px",
                  }}
                >
                  {matchReport(flashback)}
                </p>

                <Link
                  href={
                    `/history/${flashback.game.season}`
                  }
                  style={{
                    color: "#ffffff",
                    fontWeight: 800,
                    fontSize: "13px",
                  }}
                >
                  Visit the Season Archive →
                </Link>
              </>
            ) : (
              <p style={muted}>
                No previous-season fixture
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
          paddingTop: "22px",
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
            marginTop: "7px",
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
          Accurate results. Questionable journalism.
          Absolutely no editorial oversight.
        </p>
      </footer>
    </main>
  );
}
