
import Link from "next/link";
import type { CSSProperties } from "react";
import {
  getHistoricalData,
  type HistoricalMatchup,
} from "../../../../../lib/sleeper";

type PageProps = {
  params: Promise<{
    season: string;
    week: string;
  }>;
};

type Fixture = {
  a: number;
  b: number;
  game: HistoricalMatchup;
};

type Prediction = {
  a: number;
  b: number;
  winner: number;
};

type Pundit = {
  id: number;
  name: string;
  title: string;
  character: string;
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

const PUNDITS: Pundit[] = [
  {
    id: 1,
    name: "Professor Hugh Jass",
    title: "Head of Advanced Bollocks",
    character:
      "Claims to operate a proprietary predictive model. It is understood to be a spreadsheet with three broken formulas.",
  },
  {
    id: 2,
    name: "Big Kev",
    title: "Former Pub Darts Champion",
    character:
      "Believes every contest will be settled by at least forty points. Has never knowingly predicted a close game.",
  },
  {
    id: 3,
    name: "Mystic Margaret",
    title: "Astrologer & Football Medium",
    character:
      "Consults the stars, the spirits and occasionally the league table. Only one of these methods has produced useful information.",
  },
  {
    id: 4,
    name: "Sir Reginald Bellend III",
    title: "Traditional Football Correspondent",
    character:
      "Educated at an expensive institution where the concept of fantasy football was considered a disciplinary offence.",
  },
  {
    id: 5,
    name: "Darren from the Pub",
    title: "Independent Football Expert",
    character:
      "Hasn't watched an entire NFL game in years. Remains convinced that this makes him more objective.",
  },
  {
    id: 6,
    name: "ChadGPT",
    title: "Artificially Unintelligent Analyst",
    character:
      "An experimental football intelligence system trained on league gossip, championship propaganda and several corrupted PDFs.",
  },
  {
    id: 7,
    name: "The Commissioner's Solicitor",
    title: "Legal & Ballbags Affairs",
    character:
      "Maintains that all predictions are entirely independent, provided the Ballbags are given the respect they deserve.",
  },
  {
    id: 8,
    name: "The Grim Reaper",
    title: "Senior Misfortune Correspondent",
    character:
      "Specialises in identifying promising teams and predicting that something terrible is about to happen to them.",
  },
];

const PANEL: CSSProperties = {
  background: "#151b23",
  border: "1px solid #27303b",
  borderRadius: 16,
  padding: 18,
};

const MUTED = "#929eae";

function teamName(id: number, season: string) {
  if (id === 1 && Number(season) < 2026) {
    return "Perth Ballbags";
  }

  return TEAMS[id] ?? `Franchise ${id}`;
}

function completed(game: HistoricalMatchup) {
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

function validWeek(
  games: HistoricalMatchup[],
  week: number
) {
  const matches = games.filter(
    (game) =>
      game.week === week &&
      completed(game)
  );

  const teams = new Set<number>();

  for (const game of matches) {
    teams.add(game.rosterA);
    teams.add(game.rosterB);
  }

  return matches.length === 5 && teams.size === 10;
}

function fixturesFor(
  games: HistoricalMatchup[],
  week: number
): Fixture[] {
  const matches = games.filter(
    (game) =>
      game.week === week &&
      game.phase === "Regular Season" &&
      game.rosterA >= 1 &&
      game.rosterA <= 10 &&
      game.rosterB >= 1 &&
      game.rosterB <= 10 &&
      game.rosterA !== game.rosterB
  );

  const teams = new Set<number>();

  for (const game of matches) {
    teams.add(game.rosterA);
    teams.add(game.rosterB);
  }

  if (matches.length !== 5 || teams.size !== 10) {
    return [];
  }

  return matches.map((game) => ({
    a: game.rosterA,
    b: game.rosterB,
    game,
  }));
}

function averageBefore(
  games: HistoricalMatchup[],
  team: number,
  week: number
) {
  const scores: number[] = [];

  for (let w = 1; w < week; w++) {
    if (!validWeek(games, w)) continue;

    for (const game of games) {
      if (game.week !== w || !completed(game)) {
        continue;
      }

      if (game.rosterA === team) {
        scores.push(game.scoreA);
      } else if (game.rosterB === team) {
        scores.push(game.scoreB);
      }
    }
  }

  if (!scores.length) return 115;

  const seasonAverage =
    scores.reduce((sum, score) => sum + score, 0) /
    scores.length;

  const recent = scores.slice(-3);

  const recentAverage =
    recent.reduce((sum, score) => sum + score, 0) /
    recent.length;

  return seasonAverage * 0.6 + recentAverage * 0.4;
}

// A repeatable pseudo-random number, not a live
// random call. Old editions stay unchanged.
function noise(seed: number) {
  const x = Math.sin(seed * 12.9898 + 78.233) *
    43758.5453;

  return (x - Math.floor(x)) * 2 - 1;
}

function predict(
  games: HistoricalMatchup[],
  season: string,
  week: number,
  fixture: Fixture,
  pundit: Pundit
): Prediction {
  const baseA = averageBefore(games, fixture.a, week);
  const baseB = averageBefore(games, fixture.b, week);

  const seed =
    Number(season) * 100003 +
    week * 1009 +
    fixture.a * 97 +
    fixture.b * 31 +
    pundit.id * 271;

  const n1 = noise(seed);
  const n2 = noise(seed + 19);

  let a = baseA;
  let b = baseB;

  switch (pundit.id) {
    case 1:
      // Professor: conservative statistical model.
      a += n1 * 7;
      b += n2 * 7;
      break;

    case 2:
      // Big Kev: everything is a demolition.
      if (a + n1 * 15 >= b + n2 * 15) {
        a += 29;
        b -= 19;
      } else {
        b += 29;
        a -= 19;
      }
      break;

    case 3:
      // Margaret: stars over statistics.
      a = 121 + n1 * 34;
      b = 121 + n2 * 34;
      break;

    case 4:
      // Reginald: values the establishment.
      a += fixture.a === 4 || fixture.a === 8
        ? 12
        : n1 * 12;

      b += fixture.b === 4 || fixture.b === 8
        ? 12
        : n2 * 12;
      break;

    case 5:
      // Darren: almost completely winging it.
      a = 112 + n1 * 40;
      b = 112 + n2 * 40;
      break;

    case 6:
      // ChadGPT: unreasonably bullish on Chad.
      a += fixture.a === 10 ? 38 : n1 * 15;
      b += fixture.b === 10 ? 38 : n2 * 15;
      break;

    case 7:
      // Commissioner's solicitor: a slight
      // conflict of interest.
      a += fixture.a === 1 ? 30 : n1 * 10;
      b += fixture.b === 1 ? 30 : n2 * 10;
      break;

    case 8:
      // Grim Reaper: expects strong teams to
      // suffer catastrophic disappointment.
      a += baseA > baseB ? -25 : n1 * 16;
      b += baseB > baseA ? -25 : n2 * 16;
      break;
  }

  a = Math.max(55, Math.round(a));
  b = Math.max(55, Math.round(b));

  // Every pundit must actually pick a winner.
  if (a === b) {
    if (n1 >= n2) a += 1;
    else b += 1;
  }

  return {
    a,
    b,
    winner: a > b ? fixture.a : fixture.b,
  };
}

function punditVerdict(
  pundit: Pundit,
  prediction: Prediction,
  fixture: Fixture,
  season: string
) {
  const winner = teamName(prediction.winner, season);

  switch (pundit.id) {
    case 1:
      return `The model favours ${winner}. The professor insists the mathematics is beyond the understanding of ordinary men.`;
    case 2:
      return `${winner} by a fucking mile. Big Kev has also backed them to win the Grand National.`;
    case 3:
      return `Mercury is behaving suspiciously. Margaret believes ${winner} will benefit from a favourable cosmic alignment.`;
    case 4:
      return `Sir Reginald expects ${winner} to demonstrate the sort of discipline he has not witnessed since his boarding-school days.`;
    case 5:
      return `Darren has gone with ${winner}, having mistaken one of the managers for a bloke he once met in Tenerife.`;
    case 6:
      return `ChadGPT selects ${winner}. System diagnostics report a 94% probability of complete fucking nonsense.`;
    case 7:
      return `Legal counsel backs ${winner}. Any suggestion of editorial interference is defamatory and will be dealt with accordingly.`;
    default:
      return `The Reaper has chosen ${winner}, although he remains more interested in the emotional devastation awaiting the loser.`;
  }
}

function leaderboard(
  games: HistoricalMatchup[],
  season: string,
  throughWeek: number
) {
  return PUNDITS.map((pundit) => {
    let correct = 0;
    let total = 0;
    let error = 0;

    // Week 1 has no completed same-season week
    // on which to base a preview. Score previews
    // for Weeks 2 onward only.
    for (let week = 2; week <= throughWeek; week++) {
      if (
        !validWeek(games, week - 1) ||
        !validWeek(games, week)
      ) {
        continue;
      }

      const fixtures = fixturesFor(games, week);

      for (const fixture of fixtures) {
        const prediction = predict(
          games,
          season,
          week,
          fixture,
          pundit
        );

        const actualWinner =
          fixture.game.scoreA > fixture.game.scoreB
            ? fixture.a
            : fixture.game.scoreB > fixture.game.scoreA
              ? fixture.b
              : null;

        if (actualWinner === null) continue;

        total += 1;

        if (prediction.winner === actualWinner) {
          correct += 1;
        }

        error +=
          Math.abs(prediction.a - fixture.game.scoreA) +
          Math.abs(prediction.b - fixture.game.scoreB);
      }
    }

    return {
      ...pundit,
      correct,
      total,
      error,
    };
  }).sort(
    (a, b) =>
      b.correct - a.correct ||
      a.error - b.error ||
      a.id - b.id
  );
}

function SectionTitle({
  eyebrow,
  children,
}: {
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 18 }}>
      <p
        style={{
          color: MUTED,
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: 2,
          textTransform: "uppercase",
          margin: "0 0 8px",
        }}
      >
        {eyebrow}
      </p>

      <h2
        style={{
          fontSize: 25,
          lineHeight: 1.2,
          margin: 0,
        }}
      >
        {children}
      </h2>
    </div>
  );
}

export default async function PredictionsPage({
  params,
}: PageProps) {
  const { season, week } = await params;
  const editionWeek = Number(week);
  const previewWeek = editionWeek + 1;

  const history = await getHistoricalData();

  const selected = history.find(
    (item) => item.league.season === season
  );

  const games = selected?.matchups ?? [];

  const editionReady =
    Number.isInteger(editionWeek) &&
    editionWeek >= 1 &&
    editionWeek <= 14 &&
    validWeek(games, editionWeek);

  const previewSupported = previewWeek <= 14;

  const fixtures =
    editionReady && previewSupported
      ? fixturesFor(games, previewWeek)
      : [];

  const ranks = editionReady
    ? leaderboard(games, season, editionWeek)
    : [];

  const hasResults = ranks.some(
    (pundit) => pundit.total > 0
  );

  return (
    <main
      style={{
        color: "#f4f5f7",
        paddingBottom: 40,
      }}
    >
      <header
        style={{
          textAlign: "center",
          borderBottom: "2px solid #f4f5f7",
          paddingBottom: 20,
          marginBottom: 28,
        }}
      >
        <Link
          href={`/news/${season}/${week}`}
          style={{
            color: MUTED,
            fontSize: 12,
            textDecoration: "none",
            fontWeight: 700,
          }}
        >
          ← Back to the Weekly Edition
        </Link>

        <h1
          style={{
            fontSize: "clamp(36px, 10vw, 56px)",
            letterSpacing: -2,
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
            fontSize: 14,
            margin: "0 0 18px",
          }}
        >
          Your Home of Sloot Sport
        </p>

        <div
          style={{
            borderTop: "1px solid #27303b",
            paddingTop: 12,
            display: "flex",
            justifyContent: "space-between",
            gap: 10,
            color: MUTED,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 1,
          }}
        >
          <span>{season} SEASON</span>
          <span>
            WEEK {Number.isInteger(editionWeek)
              ? editionWeek
              : "—"} EDITION
          </span>
        </div>
      </header>

      <section
        style={{
          ...PANEL,
          borderTop: "4px solid #f4f5f7",
          marginBottom: 28,
        }}
      >
        <p
          style={{
            color: MUTED,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 2,
            margin: "0 0 12px",
          }}
        >
          THE SLOOT NEWS PREDICTION PANEL
        </p>

        <h2
          style={{
            fontSize: "clamp(28px, 7vw, 40px)",
            lineHeight: 1.12,
            letterSpacing: -1,
            margin: "0 0 16px",
          }}
        >
          Eight Experts. Five Games.
          Zero Accountability.
        </h2>

        <p
          style={{
            color: "#d2d8e0",
            lineHeight: 1.85,
            fontSize: 15,
            margin: "0 0 14px",
          }}
        >
          With Week {editionWeek} in the books,
          the SFL turns its attention to
          {previewSupported
            ? ` Week ${previewWeek}.`
            : " the postseason."}
          {" "}
          Sloot News has assembled eight
          individuals whose collective
          qualifications include a pub darts
          trophy, several restraining orders
          and a suspiciously close relationship
          with the commissioner.
        </p>

        <p
          style={{
            color: "#d2d8e0",
            lineHeight: 1.85,
            fontSize: 15,
            margin: 0,
          }}
        >
          Every expert must predict both teams'
          scores. Their forecasts are based
          on information available at the
          time of the edition, with varying
          degrees of statistical competence.
          Absolutely none should be used
          for financial decisions.
        </p>
      </section>

      {!editionReady ? (
        <section style={PANEL}>
          <SectionTitle eyebrow="Broadcast Notice">
            Predictions Under Embargo
          </SectionTitle>

          <p
            style={{
              color: MUTED,
              lineHeight: 1.8,
              margin: 0,
            }}
          >
            The prediction panel opens only
            after all five fixtures from the
            selected regular-season week
            have officially finished.
          </p>
        </section>
      ) : !previewSupported ? (
        <section style={PANEL}>
          <SectionTitle eyebrow="End of Regular Season">
            Playoff Preview Coming Later
          </SectionTitle>

          <p
            style={{
              color: MUTED,
              lineHeight: 1.8,
              margin: 0,
            }}
          >
            Week 14 has concluded. The next
            fixtures belong to the playoffs,
            which require a separate bracket
            preview rather than the normal
            five-game regular-season panel.
          </p>
        </section>
      ) : fixtures.length !== 5 ? (
        <section style={PANEL}>
          <SectionTitle eyebrow="Fixture Desk">
            The Schedule Has Gone Missing
          </SectionTitle>

          <p
            style={{
              color: MUTED,
              lineHeight: 1.8,
              margin: 0,
            }}
          >
            Sleeper hasn't supplied a complete
            set of five Week {previewWeek}
            regular-season fixtures in the
            historical data available to this
            page. The newsroom refuses to
            invent opponents, despite
            considerable pressure from
            Darren from the Pub.
          </p>
        </section>
      ) : (
        <>
          <section style={{ marginBottom: 32 }}>
            <SectionTitle eyebrow="The Fixtures">
              Week {previewWeek}: The Picks Are In
            </SectionTitle>

            {fixtures.map((fixture, fixtureIndex) => (
              <article
                key={`${fixture.a}-${fixture.b}`}
                style={{
                  ...PANEL,
                  marginBottom: 20,
                  overflow: "hidden",
                }}
              >
                <p
                  style={{
                    color: MUTED,
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: 2,
                    margin: "0 0 15px",
                  }}
                >
                  MATCHUP {fixtureIndex + 1} OF 5
                </p>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto 1fr",
                    alignItems: "center",
                    gap: 10,
                    textAlign: "center",
                    marginBottom: 18,
                  }}
                >
                  <h3
                    style={{
                      fontSize: 17,
                      lineHeight: 1.3,
                      margin: 0,
                    }}
                  >
                    {teamName(fixture.a, season)}
                  </h3>

                  <span
                    style={{
                      color: MUTED,
                      fontSize: 12,
                      fontWeight: 900,
                    }}
                  >
                    VS
                  </span>

                  <h3
                    style={{
                      fontSize: 17,
                      lineHeight: 1.3,
                      margin: 0,
                    }}
                  >
                    {teamName(fixture.b, season)}
                  </h3>
                </div>

                <div
                  style={{
                    borderTop: "1px solid #27303b",
                    borderBottom: "1px solid #27303b",
                  }}
                >
                  {PUNDITS.map((pundit) => {
                    const prediction = predict(
                      games,
                      season,
                      previewWeek,
                      fixture,
                      pundit
                    );

                    return (
                      <div
                        key={pundit.id}
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "minmax(0, 1fr) 55px 20px 55px",
                          alignItems: "center",
                          gap: 7,
                          padding: "13px 0",
                          borderBottom:
                            pundit.id === 8
                              ? "none"
                              : "1px solid #27303b",
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <p
                            style={{
                              fontSize: 13,
                              fontWeight: 800,
                              margin: "0 0 3px",
                            }}
                          >
                            {pundit.name}
                          </p>

                          <p
                            style={{
                              color: MUTED,
                              fontSize: 10,
                              margin: 0,
                            }}
                          >
                            {pundit.title}
                          </p>
                        </div>

                        <div
                          style={{
                            textAlign: "center",
                            fontWeight: 900,
                            fontSize: 20,
                            color:
                              prediction.winner === fixture.a
                                ? "#ffffff"
                                : MUTED,
                            background:
                              prediction.winner === fixture.a
                                ? "#344052"
                                : "#202731",
                            borderRadius: 7,
                            padding: "9px 3px",
                          }}
                        >
                          {prediction.a}
                        </div>

                        <span
                          style={{
                            color: MUTED,
                            textAlign: "center",
                          }}
                        >
                          –
                        </span>

                        <div
                          style={{
                            textAlign: "center",
                            fontWeight: 900,
                            fontSize: 20,
                            color:
                              prediction.winner === fixture.b
                                ? "#ffffff"
                                : MUTED,
                            background:
                              prediction.winner === fixture.b
                                ? "#344052"
                                : "#202731",
                            borderRadius: 7,
                            padding: "9px 3px",
                          }}
                        >
                          {prediction.b}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div
                  style={{
                    marginTop: 17,
                    display: "grid",
                    gap: 10,
                  }}
                >
                  {[PUNDITS[0], PUNDITS[4]].map(
                    (pundit) => {
                      const prediction = predict(
                        games,
                        season,
                        previewWeek,
                        fixture,
                        pundit
                      );

                      return (
                        <p
                          key={pundit.id}
                          style={{
                            color: "#c4ccd6",
                            fontSize: 13,
                            lineHeight: 1.7,
                            margin: 0,
                          }}
                        >
                          <strong>
                            {pundit.name}:
                          </strong>
                          {" "}
                          {punditVerdict(
                            pundit,
                            prediction,
                            fixture,
                            season
                          )}
                        </p>
                      );
                    }
                  )}
                </div>
              </article>
            ))}
          </section>

          <section
            style={{
              ...PANEL,
              marginBottom: 28,
            }}
          >
            <SectionTitle eyebrow="Meet the Experts">
              The Rogues' Gallery
            </SectionTitle>

            <div
              style={{
                display: "grid",
                gap: 15,
              }}
            >
              {PUNDITS.map((pundit) => (
                <div
                  key={pundit.id}
                  style={{
                    borderBottom: "1px solid #27303b",
                    paddingBottom: 14,
                  }}
                >
                  <h3
                    style={{
                      fontSize: 16,
                      margin: "0 0 4px",
                    }}
                  >
                    {pundit.name}
                  </h3>

                  <p
                    style={{
                      color: MUTED,
                      fontSize: 11,
                      fontWeight: 800,
                      margin: "0 0 8px",
                    }}
                  >
                    {pundit.title}
                  </p>

                  <p
                    style={{
                      color: "#d2d8e0",
                      fontSize: 13,
                      lineHeight: 1.75,
                      margin: 0,
                    }}
                  >
                    {pundit.character}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section
            style={{
              ...PANEL,
              marginBottom: 28,
            }}
          >
            <SectionTitle eyebrow="The Accountability Department">
              Pundit League Table
            </SectionTitle>

            <p
              style={{
                color: MUTED,
                fontSize: 13,
                lineHeight: 1.75,
                margin: "0 0 18px",
              }}
            >
              Predictions are scored against
              completed fixtures from Weeks 2
              through {editionWeek}. Correct
              winners determine the rankings;
              total score-prediction error
              breaks ties. Smaller error is
              better.
            </p>

            {!hasResults ? (
              <p
                style={{
                  color: MUTED,
                  lineHeight: 1.7,
                }}
              >
                No predictions have been
                settled yet. All eight
                experts remain undefeated,
                a situation Darren has
                described as historic.
              </p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: 12,
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        color: MUTED,
                        textAlign: "left",
                        borderBottom:
                          "1px solid #445061",
                      }}
                    >
                      <th style={{ padding: "10px 5px" }}>
                        #
                      </th>
                      <th style={{ padding: "10px 5px" }}>
                        Expert
                      </th>
                      <th style={{ padding: "10px 5px" }}>
                        Correct
                      </th>
                      <th style={{ padding: "10px 5px" }}>
                        Error
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {ranks.map((pundit, index) => (
                      <tr
                        key={pundit.id}
                        style={{
                          borderBottom:
                            "1px solid #27303b",
                        }}
                      >
                        <td
                          style={{
                            padding: "13px 5px",
                            fontWeight: 900,
                          }}
                        >
                          {index + 1}
                        </td>

                        <td
                          style={{
                            padding: "13px 5px",
                            fontWeight: 700,
                          }}
                        >
                          {pundit.name}
                        </td>

                        <td
                          style={{
                            padding: "13px 5px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {pundit.correct}/{pundit.total}
                        </td>

                        <td
                          style={{
                            padding: "13px 5px",
                          }}
                        >
                          {Math.round(pundit.error)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <p
              style={{
                color: MUTED,
                fontSize: 11,
                lineHeight: 1.7,
                margin: "16px 0 0",
              }}
            >
              All pundits are fictional.
              Their predictions use fixed
              formulas and historical data
              available before each game.
              No actual game results are
              used to generate predictions
              for that game.
            </p>
          </section>

          <section style={PANEL}>
            <SectionTitle eyebrow="Final Word">
              The Panel Has Spoken
            </SectionTitle>

            <p
              style={{
                color: "#d2d8e0",
                lineHeight: 1.8,
                fontSize: 14,
                margin: 0,
              }}
            >
              Forty predictions have now been
              committed to the public record.
              By next week, at least one
              member of the panel will be
              claiming they were misquoted.
              The commissioner has already
              instructed the legal department
              to prepare a statement in the
              event of a Ballbags defeat.
            </p>
          </section>
        </>
      )}

      <footer
        style={{
          textAlign: "center",
          borderTop: "1px solid #27303b",
          paddingTop: 24,
          marginTop: 32,
        }}
      >
        <p
          style={{
            fontWeight: 900,
            letterSpacing: 2,
            margin: 0,
          }}
        >
          SLOOT NEWS
        </p>

        <p
          style={{
            color: MUTED,
            fontSize: 12,
            marginTop: 8,
          }}
        >
          Your Home of Sloot Sport
        </p>

        <p
          style={{
            color: MUTED,
            fontSize: 11,
            marginTop: 12,
          }}
        >
          Eight experts. One brain cell.
          Shared custody.
        </p>
      </footer>
    </main>
  );
}
