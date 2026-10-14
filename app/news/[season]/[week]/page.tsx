
import Link from "next/link";
import { getHistoricalData } from "../../../../lib/sleeper";
import {
  buildNewsEdition,
  fetchNewsPlayers,
  type NewsArticle,
  type NewsResult,
} from "../../../../lib/newsroom";

type PageProps = {
  params: Promise<{
    season: string;
    week: string;
  }>;
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
  "The SFL Department of Questionable Decisions",
  "Jack Brannigan's Retirement Fund",
  "Tarl Brayer's Postseason Counselling Service",
  "The Garrett Etheridge Trophy Cabinet Company",
  "Ed Nelms' Independent Ethics Committee",
  "The Josh Thomas Regular Season Appreciation Society",
  "The Ollie Payne School of Financial Planning",
  "Grimsby Chode Chokers' Championship Museum",
];

const LORE: Record<number, string[]> = {
  1: [
    "The commissioner has requested an independent investigation. The proposed panel consists of Ed, his reflection and whichever member of the group chat agrees with him.",
    "The Ballbags remain on the verge of something special. Unfortunately, the verge appears to be several thousand miles long.",
  ],
  2: [
    "Ben Smith remains the inaugural Slootbowl champion, a fact Cambridge supporters are contractually obliged to mention whenever the present becomes uncomfortable.",
    "Cambridge have conquered the SFL before. Their attempts to recreate those glory days increasingly resemble a man microwaving the same disappointing leftovers.",
  ],
  3: [
    "Jake Greenwood has accumulated an impressive collection of postseason appearances and absolutely no Slootbowl trophies.",
    "The Chode Chokers continue pursuing a championship, which remains an unusually elaborate way of avoiding actually winning one.",
  ],
  4: [
    "George Pendleton has won the Slootbowl before and considers that sufficient evidence that every subsequent defeat is an administrative error.",
    "The Isle of Wight's championship history is a source of enormous pride, particularly to George, who will explain it without being asked.",
  ],
  5: [
    "Ryan Whiting has spent years trying to turn Grays Town into a serious contender. Unfortunately, serious contenders are expected to produce actual results.",
    "Grays Town's relationship with success remains complicated, although Ryan insists the paperwork is progressing nicely.",
  ],
  6: [
    "Garrett Etheridge's regular-season competence continues to raise questions about what precisely happens when the playoffs arrive.",
    "Lincoln's championship window remains open. Garrett is standing beneath it, wondering why nobody has thrown him a trophy.",
  ],
  7: [
    "Ollie Payne has developed an unusual talent for making Kalamata appear either extremely dangerous or completely unfit for organised sport.",
    "Kalamata's relationship with consistency remains about as stable as a kebab-shop toilet at four in the morning.",
  ],
  8: [
    "Jack Brannigan has historically treated future draft picks like loose change in a pub fruit machine.",
    "Weybiza supporters continue awaiting the promised return on Jack's investment strategy.",
  ],
  9: [
    "Tarl Brayer has suffered enough narrow postseason defeats to qualify for government-funded counselling.",
    "The Shitlickers have spent years flirting with greatness, only to discover that greatness has a boyfriend and his name is usually George Pendleton.",
  ],
  10: [
    "Josh Thomas has won consecutive Slootbowls despite previously treating the regular season like an optional warm-up exercise.",
    "Chad's ability to turn questionable regular-season performances into December glory remains deeply irritating to everyone else.",
  ],
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

function MatchScore({
  result,
  season,
  large = false,
}: {
  result: NewsResult;
  season: string;
  large?: boolean;
}) {
  return (
    <p
      style={{
        fontSize: large ? "17px" : "14px",
        fontWeight: 800,
        lineHeight: 1.6,
        margin: large
          ? "0 0 20px"
          : "0 0 14px",
      }}
    >
      {teamName(result.winner, season)}
      {" "}
      {pts(result.winnerScore)}
      {" — "}
      {pts(result.loserScore)}
      {" "}
      {teamName(result.loser, season)}
    </p>
  );
}

function JournalistByline({
  article,
}: {
  article: NewsArticle;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "5px 12px",
        alignItems: "center",
        margin: "0 0 18px",
        paddingBottom: "14px",
        borderBottom: "1px solid #27303b",
      }}
    >
      <span
        style={{
          color: "#ffffff",
          fontSize: "12px",
          fontWeight: 800,
        }}
      >
        By {article.byline}
      </span>

      <span
        style={{
          ...muted,
          fontSize: "11px",
          fontStyle: "italic",
        }}
      >
        {article.role}
      </span>
    </div>
  );
}

function ArticleBody({
  article,
  featured = false,
}: {
  article: NewsArticle;
  featured?: boolean;
}) {
  return (
    <div>
      {article.paragraphs.map(
        (paragraph, index) => {
          const isEvidence =
            article.format === "case-file" &&
            (
              paragraph.startsWith("CASE REFERENCE:") ||
              paragraph.startsWith("EXHIBIT ") ||
              paragraph.startsWith("PERSON OF INTEREST:") ||
              paragraph.startsWith("PRELIMINARY FINDING:") ||
              paragraph.startsWith("RECOMMENDATION:") ||
              paragraph.startsWith("CASE STATUS:")
            );

          return (
            <p
              key={index}
              style={{
                color: isEvidence
                  ? "#e3e7ed"
                  : featured
                    ? "#d2d8e0"
                    : "#aeb9c7",
                fontSize: featured
                  ? "15px"
                  : "14px",
                lineHeight:
                  article.format === "tabloid"
                    ? 1.65
                    : article.format === "essay"
                      ? 1.95
                      : 1.8,
                fontWeight: isEvidence
                  ? 650
                  : 400,
                borderLeft: isEvidence
                  ? "2px solid #657184"
                  : undefined,
                paddingLeft: isEvidence
                  ? "12px"
                  : undefined,
                margin:
                  index === article.paragraphs.length - 1
                    ? 0
                    : featured
                      ? "0 0 18px"
                      : "0 0 14px",
              }}
            >
              {paragraph}
            </p>
          );
        }
      )}
    </div>
  );
}

function FeaturedArticle({
  article,
  season,
}: {
  article: NewsArticle;
  season: string;
}) {
  return (
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
        {article.eyebrow}
      </p>

      <h2
        style={{
          fontSize: "clamp(27px, 7vw, 38px)",
          lineHeight: 1.12,
          letterSpacing: "-0.7px",
          margin: "0 0 16px",
        }}
      >
        {article.headline}
      </h2>

      <p
        style={{
          fontSize: "16px",
          fontWeight: 600,
          lineHeight: 1.65,
          color: "#c1cad6",
          margin: "0 0 18px",
          fontStyle:
            article.format === "essay"
              ? "italic"
              : "normal",
        }}
      >
        {article.standfirst}
      </p>

      <JournalistByline article={article} />

      <MatchScore
        result={article.result}
        season={season}
        large
      />

      <ArticleBody
        article={article}
        featured
      />
    </article>
  );
}

function RoundupArticle({
  article,
  season,
}: {
  article: NewsArticle;
  season: string;
}) {
  return (
    <article
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
        {article.eyebrow}
      </p>

      <h3
        style={{
          fontSize: "21px",
          lineHeight: 1.25,
          margin: "0 0 12px",
        }}
      >
        {article.headline}
      </h3>

      <p
        style={{
          color: "#c1cad6",
          fontSize: "13px",
          lineHeight: 1.7,
          margin: "0 0 14px",
          fontStyle:
            article.format === "essay"
              ? "italic"
              : "normal",
        }}
      >
        {article.standfirst}
      </p>

      <JournalistByline article={article} />

      <MatchScore
        result={article.result}
        season={season}
      />

      <ArticleBody article={article} />
    </article>
  );
}

export default async function NewsEditionPage({
  params,
}: PageProps) {
  const { season, week } = await params;
  const weekNumber = Number(week);

  const [seasons, playerDatabase] =
    await Promise.all([
      getHistoricalData(),
      fetchNewsPlayers(),
    ]);

  const selectedSeason = seasons.find(
    (item) => item.league.season === season
  );

  const history = seasons.flatMap(
    (item) => item.matchups
  );

  const edition = buildNewsEdition(
    season,
    weekNumber,
    selectedSeason?.matchups ?? [],
    history,
    playerDatabase
  );

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

      {!edition ? (
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
          <FeaturedArticle
            article={edition.gameOfTheWeek}
            season={season}
          />

          <section style={{ marginBottom: "32px" }}>
            <SectionHeading
              eyebrow="Four More Crimes Against Football"
              title="Around the SFL"
            />

            {edition.articles
              .filter((article) => !article.featured)
              .map((article) => (
                <RoundupArticle
                  key={article.id}
                  article={article}
                  season={season}
                />
              ))}
          </section>

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
              {manager(edition.biggestDefeat.loser)}
            </h3>

            <p
              style={{
                ...muted,
                fontSize: "14px",
                lineHeight: 1.8,
              }}
            >
              Congratulations to{" "}
              {manager(edition.biggestDefeat.loser)},
              whose{" "}
              {teamName(
                edition.biggestDefeat.loser,
                season
              )}{" "}
              suffered the week's largest defeat,
              losing by{" "}
              {pts(edition.biggestDefeat.margin)}{" "}
              points to{" "}
              {teamName(
                edition.biggestDefeat.winner,
                season
              )}.
              {" "}The awards committee considered
              several candidates before concluding
              that this particular display of
              incompetence deserved to be
              recognised publicly.
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
                LORE[edition.biggestDefeat.loser] ??
                  ["The manager was unavailable for comment."],
                Number(season) + weekNumber
              )}
            </p>
          </section>

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
              The Sloot News investigative desk
              has reopened a historical case
              connected to this week's events.
              Old scores, fresh embarrassment
              and another manager wishing the
              league had never discovered
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
