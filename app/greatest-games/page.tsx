
import Link from "next/link";

import {
  FRANCHISES,
  getHistoricalFranchiseName,
} from "../../lib/franchises";
import { getHistoricalData } from "../../lib/sleeper";
import { getSlootbowlResults } from "../../lib/slootbowlResults";
import {
  calculateGreatestGames,
  type GreatestGame,
} from "../../lib/greatestGames";
import { getGreatestGameCommentary } from "../../lib/greatestGamesCommentary";

const OBFC = new Set([4, 6, 8, 7, 9]);
const GPFC = new Set([1, 2, 3, 5, 10]);

const FRANCHISE_MAP = new Map(
  FRANCHISES.map((team) => [team.rosterId, team])
);

const SHORT_NAMES: Record<number, string> = {
  1: "Mt Isa",
  2: "Cambridge",
  3: "Grimsby",
  4: "Isle of Wight",
  5: "Grays Town",
  6: "Lincoln",
  7: "Kalamata",
  8: "Weybiza",
  9: "East Rutherford",
  10: "Chad",
};

const CATEGORIES = [
  {
    id: "greatest",
    label: "🏆 Greatest",
    title: "Top 25 Greatest Games",
    description:
      "The most extraordinary matchups in SFL history, ranked using the 100-point Greatness Score.",
  },
  {
    id: "closest",
    label: "🎯 Closest",
    title: "Closest Finishes",
    description:
      "The smallest winning margins ever recorded.",
  },
  {
    id: "shootouts",
    label: "🔥 Shootouts",
    title: "Highest-Scoring Shootouts",
    description:
      "The biggest combined fantasy scores in SFL history.",
  },
  {
    id: "demolitions",
    label: "💀 Demolitions",
    title: "Biggest Demolitions",
    description:
      "The most devastating defeats in SFL history.",
  },
  {
    id: "playoffs",
    label: "👑 Playoffs",
    title: "Playoff Classics",
    description:
      "The greatest battles from the SFL's main playoff bracket.",
  },
] as const;

type CategoryId = (typeof CATEGORIES)[number]["id"];

type GameContext = {
  isSlootbowl: boolean;
  isConferenceChampionship: boolean;
  conferenceName: string | null;
  isHistoricClosestSlootbowl: boolean;
  isHighestScoring: boolean;
  isBiggestDemolition: boolean;
};

function teamName(id: number, season: string) {
  return getHistoricalFranchiseName(id, season);
}

function shortName(id: number, season: string) {
  if (id === 1 && Number(season) < 2026) {
    return "Perth";
  }

  return SHORT_NAMES[id] ?? teamName(id, season);
}

function teamLogo(id: number) {
  return FRANCHISE_MAP.get(id)?.logo ?? null;
}

function conference(id: number) {
  if (OBFC.has(id)) return "OBFC";
  if (GPFC.has(id)) return "GPFC";
  return null;
}

function points(value: number) {
  return value.toFixed(2);
}

function recordShort(record: string) {
  const [wins, losses, ties] = record
    .split("-")
    .map(Number);

  return ties
    ? `${wins}-${losses}-${ties}`
    : `${wins}-${losses}`;
}

function gameKey(game: GreatestGame) {
  return [
    game.season,
    game.week,
    Math.min(game.rosterA, game.rosterB),
    Math.max(game.rosterA, game.rosterB),
  ].join(":");
}

function gameStage(
  game: GreatestGame,
  context: GameContext
) {
  if (context.isSlootbowl) {
    return "🏆 Slootbowl";
  }

  if (
    context.isConferenceChampionship &&
    context.conferenceName
  ) {
    return `${context.conferenceName} Championship`;
  }

  if (game.phase === "Main Playoffs") {
    return game.week === 15
      ? "First-Round Playoffs"
      : "Playoffs";
  }

  return "Regular Season";
}

function GameCard({
  game,
  rank,
  context,
}: {
  game: GreatestGame;
  rank: number;
  context: GameContext;
}) {
  const report = getGreatestGameCommentary(
    game,
    context
  );

  const teams = [
    {
      id: game.rosterA,
      score: game.scoreA,
    },
    {
      id: game.rosterB,
      score: game.scoreB,
    },
  ];

  const isChampionship = context.isSlootbowl;

  return (
    <article
      style={{
        background: "#151b23",
        border: isChampionship
          ? "1px solid #a17b28"
          : "1px solid #27303b",
        borderRadius: 16,
        padding: 16,
        overflow: "hidden",
      }}
    >
      {/* Game heading */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          marginBottom: 18,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              color: isChampionship
                ? "#eab308"
                : "#9da7b3",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 0.5,
            }}
          >
            #{rank} · {game.season}
          </div>

          <div
            style={{
              fontSize: 12,
              marginTop: 6,
              color: "#ffffff",
              lineHeight: 1.5,
            }}
          >
            Week {game.week} ·{" "}
            {gameStage(game, context)}
          </div>
        </div>

        <div
          style={{
            textAlign: "right",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              color: "#eab308",
              fontSize: 26,
              fontWeight: 900,
              lineHeight: 1.1,
            }}
          >
            {game.greatnessScore.toFixed(1)}
          </div>

          <div
            style={{
              color: "#9da7b3",
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: 0.4,
              marginTop: 5,
            }}
          >
            GREATNESS / 100
          </div>
        </div>
      </div>

      {/* Teams and scores */}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {teams.map((team) => {
          const logo = teamLogo(team.id);
          const isWinner =
            game.winnerId === team.id;

          return (
            <div
              key={team.id}
              style={{
                display: "grid",
                gridTemplateColumns:
                  "38px minmax(0, 1fr) auto",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {logo ? (
                  <img
                    src={logo}
                    alt=""
                    width={38}
                    height={38}
                    style={{
                      width: 38,
                      height: 38,
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  <span
                    style={{
                      fontSize: 20,
                      opacity: 0.5,
                    }}
                  >
                    🏈
                  </span>
                )}
              </div>

              <div
                style={{
                  minWidth: 0,
                  color: isWinner
                    ? "#ffffff"
                    : "#9da7b3",
                  fontWeight: isWinner
                    ? 800
                    : 500,
                  fontSize: 13,
                  lineHeight: 1.4,
                }}
              >
                {teamName(
                  team.id,
                  game.season
                )}
              </div>

              <div
                style={{
                  fontSize: 18,
                  fontWeight: 900,
                  color: isWinner
                    ? "#ffffff"
                    : "#9da7b3",
                  fontVariantNumeric:
                    "tabular-nums",
                  whiteSpace: "nowrap",
                }}
              >
                {points(team.score)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Game statistics */}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          marginTop: 18,
        }}
      >
        <span
          style={{
            background: "#26313d",
            padding: "6px 9px",
            borderRadius: 8,
            fontSize: 11,
            color: "#dce2e9",
          }}
        >
          Margin: {points(game.margin)}
        </span>

        <span
          style={{
            background: "#26313d",
            padding: "6px 9px",
            borderRadius: 8,
            fontSize: 11,
            color: "#dce2e9",
          }}
        >
          Combined:{" "}
          {points(game.combinedScore)}
        </span>

        {game.isUpset && (
          <span
            style={{
              background: "#49311c",
              color: "#fbbf24",
              padding: "6px 9px",
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            ⚡ Underdog Victory
          </span>
        )}
      </div>

      {/* Historical match report */}

      <div
        style={{
          borderTop: "1px solid #27303b",
          marginTop: 18,
          paddingTop: 16,
        }}
      >
        <div
          style={{
            color: "#eab308",
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: 1,
            marginBottom: 9,
          }}
        >
          MATCH REPORT
        </div>

        <p
          style={{
            color: "#c5cbd3",
            fontSize: 13,
            lineHeight: 1.8,
            margin: 0,
          }}
        >
          {report}
        </p>
      </div>

      {/* Greatness breakdown */}

      <details
        style={{
          marginTop: 18,
          borderTop: "1px solid #27303b",
          paddingTop: 14,
        }}
      >
        <summary
          style={{
            color: "#eab308",
            fontSize: 12,
            cursor: "pointer",
            fontWeight: 800,
          }}
        >
          View greatness breakdown
        </summary>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(0, 1fr) auto",
            gap: 12,
            marginTop: 16,
            fontSize: 12,
            color: "#c5cbd3",
          }}
        >
          <span>Closeness (max 40)</span>
          <strong>
            {game.closenessPoints.toFixed(1)}
          </strong>

          <span>
            Scoring quality (max 25)
          </span>
          <strong>
            {game.scoringPoints.toFixed(1)}
          </strong>

          <span>
            Match importance (max 25)
          </span>
          <strong>
            {game.importancePoints.toFixed(1)}
          </strong>

          <span>
            Underdog drama (max 10)
          </span>
          <strong>
            {game.underdogPoints.toFixed(1)}
          </strong>

          <div
            style={{
              gridColumn: "1 / -1",
              borderTop:
                "1px solid #27303b",
              marginTop: 2,
            }}
          />

          <span>
            Pregame record —{" "}
            {shortName(
              game.rosterA,
              game.season
            )}
          </span>
          <strong>
            {recordShort(
              game.pregameRecordA
            )}
          </strong>

          <span>
            Pregame record —{" "}
            {shortName(
              game.rosterB,
              game.season
            )}
          </span>
          <strong>
            {recordShort(
              game.pregameRecordB
            )}
          </strong>
        </div>
      </details>
    </article>
  );
}

type PageProps = {
  searchParams?: Promise<{
    category?: string | string[];
  }>;
};

export default async function GreatestGamesPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  const requestedCategory =
    typeof params?.category === "string"
      ? params.category
      : "greatest";

  const activeCategory: CategoryId =
    CATEGORIES.some(
      (category) =>
        category.id === requestedCategory
    )
      ? (requestedCategory as CategoryId)
      : "greatest";

  const historicalData =
    await getHistoricalData();

  const championships =
    await getSlootbowlResults(
      historicalData,
      new Date().getUTCFullYear() - 1
    );

  const championshipKeys = new Set(
    championships.map((result) =>
      [
        result.season,
        result.week,
        Math.min(
          result.championRosterId,
          result.runnerUpRosterId
        ),
        Math.max(
          result.championRosterId,
          result.runnerUpRosterId
        ),
      ].join(":")
    )
  );

  const championshipFinalists = new Map<
    string,
    Set<number>
  >();

  for (const result of championships) {
    championshipFinalists.set(
      result.season,
      new Set([
        result.championRosterId,
        result.runnerUpRosterId,
      ])
    );
  }

  const greatestGames =
    calculateGreatestGames(
      historicalData.flatMap(
        (season) => season.matchups
      )
    );

  const highestCombined = Math.max(
    0,
    ...greatestGames.map(
      (game) => game.combinedScore
    )
  );

  const biggestMargin = Math.max(
    0,
    ...greatestGames.map(
      (game) => game.margin
    )
  );

  const slootbowls = greatestGames.filter(
    (game) =>
      championshipKeys.has(
        gameKey(game)
      )
  );

  const closestSlootbowlMargin =
    slootbowls.length > 0
      ? Math.min(
          ...slootbowls.map(
            (game) => game.margin
          )
        )
      : null;

  function getContext(
    game: GreatestGame
  ): GameContext {
    const isSlootbowl =
      championshipKeys.has(
        gameKey(game)
      );

    const confA = conference(
      game.rosterA
    );

    const confB = conference(
      game.rosterB
    );

    const sameConference =
      confA !== null &&
      confA === confB;

    const finalists =
      championshipFinalists.get(
        game.season
      );

    const winnerReachedSlootbowl =
      game.winnerId !== null &&
      finalists?.has(
        game.winnerId
      ) === true;

    const isConferenceChampionship =
      game.phase === "Main Playoffs" &&
      game.week === 16 &&
      sameConference &&
      winnerReachedSlootbowl;

    return {
      isSlootbowl,
      isConferenceChampionship,
      conferenceName:
        isConferenceChampionship
          ? confA
          : null,
      isHistoricClosestSlootbowl:
        isSlootbowl &&
        closestSlootbowlMargin !== null &&
        game.margin ===
          closestSlootbowlMargin,
      isHighestScoring:
        game.combinedScore ===
        highestCombined,
      isBiggestDemolition:
        game.margin ===
        biggestMargin,
    };
  }

  const gamesByCategory: Record<
    CategoryId,
    GreatestGame[]
  > = {
    greatest: greatestGames.slice(
      0,
      25
    ),

    closest: [...greatestGames]
      .sort(
        (a, b) =>
          a.margin - b.margin ||
          b.combinedScore -
            a.combinedScore
      )
      .slice(0, 5),

    shootouts: [...greatestGames]
      .sort(
        (a, b) =>
          b.combinedScore -
          a.combinedScore
      )
      .slice(0, 5),

    demolitions: [...greatestGames]
      .sort(
        (a, b) =>
          b.margin - a.margin
      )
      .slice(0, 5),

    playoffs: greatestGames
      .filter(
        (game) =>
          game.phase ===
          "Main Playoffs"
      )
      .slice(0, 5),
  };

  const selectedCategory =
    CATEGORIES.find(
      (category) =>
        category.id === activeCategory
    )!;

  const selectedGames =
    gamesByCategory[
      activeCategory
    ];

  return (
    <main
      style={{
        paddingBottom: 36,
      }}
    >
      <Link
        href="/"
        style={{
          color: "#9da7b3",
          fontSize: 13,
          textDecoration: "none",
        }}
      >
        ← Back to Vault
      </Link>

      <header
        style={{
          marginTop: 28,
        }}
      >
        <p
          style={{
            color: "#eab308",
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: 1.5,
          }}
        >
          THE SFL ARCHIVES
        </p>

        <h1
          style={{
            marginTop: 10,
            fontSize: 29,
          }}
        >
          Greatest Games
        </h1>

        <p
          style={{
            color: "#9da7b3",
            fontSize: 13,
            lineHeight: 1.7,
            marginTop: 12,
          }}
        >
          The closest finishes,
          biggest shootouts,
          historic championships
          and most humiliating
          defeats in SFL history.
          Ranked using our
          100-point Greatness Score.
        </p>
      </header>

      {/* Archive statistics */}

      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(2, minmax(0, 1fr))",
          gap: 10,
          marginTop: 24,
        }}
      >
        <div
          style={{
            background: "#151b23",
            border:
              "1px solid #27303b",
            borderRadius: 14,
            padding: 16,
          }}
        >
          <div
            style={{
              fontSize: 23,
              fontWeight: 800,
            }}
          >
            {greatestGames.length}
          </div>

          <div
            style={{
              color: "#9da7b3",
              fontSize: 11,
              marginTop: 6,
            }}
          >
            Games in the archives
          </div>
        </div>

        <div
          style={{
            background: "#151b23",
            border:
              "1px solid #27303b",
            borderRadius: 14,
            padding: 16,
          }}
        >
          <div
            style={{
              fontSize: 23,
              fontWeight: 800,
              color: "#eab308",
            }}
          >
            {greatestGames.length
              ? greatestGames[0].greatnessScore.toFixed(
                  1
                )
              : "—"}
          </div>

          <div
            style={{
              color: "#9da7b3",
              fontSize: 11,
              marginTop: 6,
            }}
          >
            Highest greatness score
          </div>
        </div>
      </section>

      {/* Horizontally scrollable category tabs */}

      <nav
        aria-label="Greatest Games categories"
        style={{
          display: "flex",
          gap: 8,
          overflowX: "auto",
          paddingTop: 6,
          paddingBottom: 12,
          marginTop: 28,
          WebkitOverflowScrolling:
            "touch",
          scrollbarWidth: "none",
        }}
      >
        {CATEGORIES.map(
          (category) => {
            const active =
              category.id ===
              activeCategory;

            return (
              <Link
                key={category.id}
                href={
                  category.id ===
                  "greatest"
                    ? "/greatest-games"
                    : `/greatest-games?category=${category.id}`
                }
                scroll={false}
                aria-current={
                  active
                    ? "page"
                    : undefined
                }
                style={{
                  flexShrink: 0,
                  whiteSpace:
                    "nowrap",
                  padding:
                    "11px 14px",
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 800,
                  textDecoration:
                    "none",
                  background: active
                    ? "#eab308"
                    : "#1b2530",
                  color: active
                    ? "#111827"
                    : "#c5cbd3",
                  border: active
                    ? "1px solid #eab308"
                    : "1px solid #334155",
                }}
              >
                {category.label}
              </Link>
            );
          }
        )}
      </nav>

      {/* Active category */}

      <section
        style={{
          marginTop: 16,
        }}
      >
        <h2
          style={{
            fontSize: 20,
          }}
        >
          {selectedCategory.title}
        </h2>

        <p
          style={{
            color: "#9da7b3",
            fontSize: 12,
            marginTop: 8,
            marginBottom: 16,
            lineHeight: 1.6,
          }}
        >
          {selectedCategory.description}
        </p>

        {selectedGames.length === 0 ? (
          <div
            style={{
              background: "#151b23",
              border:
                "1px solid #27303b",
              borderRadius: 14,
              padding: 24,
              color: "#9da7b3",
              fontSize: 13,
              textAlign: "center",
            }}
          >
            No completed games
            available in this
            category yet.
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection:
                "column",
              gap: 12,
            }}
          >
            {selectedGames.map(
              (game, index) => (
                <GameCard
                  key={gameKey(
                    game
                  )}
                  game={game}
                  rank={index + 1}
                  context={getContext(
                    game
                  )}
                />
              )
            )}
          </div>
        )}
      </section>
    </main>
  );
}
