
import Link from "next/link";

import {
  getHistoricalData,
  type HistoricalMatchup,
  type HistoricalSeason,
} from "../lib/sleeper";

const TEAM_NAMES: Record<number, string> = {
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

const panel: React.CSSProperties = {
  background: "#151b23",
  border: "1px solid #27303b",
  borderRadius: "18px",
  padding: "20px",
};

const muted: React.CSSProperties = {
  color: "#929eae",
};

function teamName(id: number): string {
  return TEAM_NAMES[id] ?? `Franchise ${id}`;
}

function completedGame(game: Game): boolean {
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
  if (!completedGame(game)) return null;

  if (game.scoreA === game.scoreB) {
    return null;
  }

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

function score(value: number): string {
  return value.toFixed(1);
}

function findEdition(
  seasons: HistoricalSeason[]
): {
  season: string;
  week: number;
  games: Game[];
} | null {
  const candidates: {
    season: string;
    week: number;
    games: Game[];
  }[] = [];

  for (const season of seasons) {
    for (let week = 1; week <= 14; week++) {
      const games = season.matchups.filter(
        (game) =>
          game.week === week &&
          completedGame(game)
      );

      // Publish only when all five regular-season
      // matchups have completed.
      const teams = new Set<number>();

      for (const game of games) {
        teams.add(game.rosterA);
        teams.add(game.rosterB);
      }

      if (games.length === 5 && teams.size === 10) {
        candidates.push({
          season: season.league.season,
          week,
          games,
        });
      }
    }
  }

  candidates.sort(
    (a, b) =>
      Number(b.season) - Number(a.season) ||
      b.week - a.week
  );

  return candidates[0] ?? null;
}

function buildHeadline(result: Result): {
  headline: string;
  intro: string;
} {
  const winner = teamName(result.winner);
  const loser = teamName(result.loser);

  if (result.margin <= 2) {
    return {
      headline:
        `${winner} Escape With Victory as ${loser} ` +
        "Discover New Depths of Misery",
      intro:
        `Just ${score(result.margin)} points separated ` +
        `these two organisations. ${winner} survived ` +
        `a contest that ${loser} will presumably ` +
        "describe as a moral victory, because actual " +
        "victories remain inconveniently difficult.",
    };
  }

  if (result.margin >= 50) {
    return {
      headline:
        `${winner} Publicly Dismantle ${loser} ` +
        "in Scenes Unfit for Broadcast",
      intro:
        `A ${score(result.margin)}-point demolition ` +
        `has left ${loser} with several difficult ` +
        "questions, most of which begin with " +
        '"why bother?"',
    };
  }

  return {
    headline:
      `${winner} Defeat ${loser}; ` +
      "League Officials Confirm This Counts as Sport",
    intro:
      `${winner} claimed a ${score(result.margin)}` +
      `-point victory over ${loser}, adding another ` +
      "unnecessarily unpleasant chapter to SFL history.",
  };
}

function report(result: Result): string {
  const winner = teamName(result.winner);
  const loser = teamName(result.loser);

  if (result.margin <= 5) {
    return (
      `${loser} fell short by ${score(result.margin)} ` +
      "points. An impressive commitment to doing " +
      "almost enough."
    );
  }

  if (result.margin >= 40) {
    return (
      `${winner} won by ${score(result.margin)} ` +
      "points. The losing franchise has been " +
      "advised to consider a different hobby."
    );
  }

  if (result.winningScore >= 160) {
    return (
      `${winner} put up ${score(result.winningScore)} ` +
      "points. The opposition's participation " +
      "was largely ceremonial."
    );
  }

  return (
    `${winner} took the win by ${score(result.margin)} ` +
    "points. Another perfectly ordinary result " +
    "treated with completely unreasonable importance."
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
          margin: 0,
          fontSize: "24px",
          lineHeight: 1.2,
        }}
      >
        {title}
      </h2>
    </div>
  );
}

export default async function Home() {
  const seasons = await getHistoricalData();

  const edition = findEdition(seasons);

  const results = edition
    ? edition.games
        .map(resultOf)
        .filter((result): result is Result =>
          result !== null
        )
    : [];

  const biggestWin = [...results].sort(
    (a, b) => b.margin - a.margin
  )[0];

  const closestGame = [...results].sort(
    (a, b) => a.margin - b.margin
  )[0];

  const highestScoring = [...results].sort(
    (a, b) => b.winningScore - a.winningScore
  )[0];

  const lead = biggestWin ?? closestGame;
  const leadStory = lead
    ? buildHeadline(lead)
    : null;

  const previousGames = seasons
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
        completedGame(game)
    )
    .sort(
      (a, b) =>
        Number(b.season) - Number(a.season)
    );

  const flashback = previousGames
    .map(resultOf)
    .filter((result): result is Result =>
      result !== null
    )
    .sort((a, b) => b.margin - a.margin)[0];

  return (
    <main
      style={{
        paddingBottom: "32px",
      }}
    >
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

      {!edition || !lead || !leadStory ? (
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
            Sloot News refuses to declare
            winners before the games finish.
            An unusually responsible decision
            from this publication.
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
              {leadStory.headline}
            </h2>

            <p
              style={{
                color: "#d2d8e0",
                lineHeight: 1.7,
                fontSize: "15px",
                margin: "0 0 18px",
              }}
            >
              {leadStory.intro}
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
                {teamName(lead.winner)}
                {" "}
                {score(lead.winningScore)}
                <span style={muted}> — </span>
                {score(lead.losingScore)}
                {" "}
                {teamName(lead.loser)}
              </p>
            </div>
          </section>

          <section style={{ marginBottom: "32px" }}>
            <SectionHeading
              eyebrow="Five Games. Ten Suspects."
              title="Around the SFL"
            />

            {results
              .slice()
              .sort((a, b) => b.margin - a.margin)
              .map((result) => (
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
                    MATCH REPORT
                  </p>

                  <h3
                    style={{
                      fontSize: "18px",
                      margin: "0 0 8px",
                      lineHeight: 1.3,
                    }}
                  >
                    {teamName(result.winner)}
                    {" "}
                    Defeat
                    {" "}
                    {teamName(result.loser)}
                  </h3>

                  <p
                    style={{
                      fontWeight: 800,
                      margin: "0 0 10px",
                    }}
                  >
                    {score(result.winningScore)}
                    {" — "}
                    {score(result.losingScore)}
                  </p>

                  <p
                    style={{
                      ...muted,
                      lineHeight: 1.6,
                      margin: 0,
                      fontSize: "14px",
                    }}
                  >
                    {report(result)}
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
                {teamName(biggestWin.loser)}
              </p>

              <p
                style={{
                  ...muted,
                  lineHeight: 1.7,
                  fontSize: "14px",
                }}
              >
                This week's largest defeat
                belongs to
                {" "}
                {teamName(biggestWin.loser)},
                who lost by
                {" "}
                {score(biggestWin.margin)}
                {" "}
                points.
                The newsroom has reviewed
                the evidence and concluded
                that things could have
                gone considerably better.
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

            {closestGame && (
              <p
                style={{
                  fontSize: "14px",
                  lineHeight: 1.7,
                }}
              >
                <strong>Closest contest:</strong>
                {" "}
                {teamName(closestGame.winner)}
                {" "}
                over
                {" "}
                {teamName(closestGame.loser)}
                {" "}
                by
                {" "}
                {score(closestGame.margin)}
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
                {teamName(highestScoring.winner)}
                {" "}
                with
                {" "}
                {score(highestScoring.winningScore)}
                {" "}
                points.
              </p>
            )}
          </section>

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
                  {teamName(flashback.winner)}
                  {" "}
                  Humiliate
                  {" "}
                  {teamName(flashback.loser)}
                </h3>

                <p
                  style={{
                    ...muted,
                    lineHeight: 1.7,
                    fontSize: "14px",
                  }}
                >
                  A
                  {" "}
                  {score(flashback.margin)}
                  -point victory from the
                  archives. Time has passed.
                  The result remains
                  permanently embarrassing.
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
                The historical department
                has not found a previous
                edition for this week.
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
          Results sourced from completed
          SFL matchups. Editorial standards
          remain under investigation.
        </p>
      </footer>
    </main>
  );
}
