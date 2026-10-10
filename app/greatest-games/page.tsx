
import Link from "next/link";

import { FRANCHISES } from "../../lib/franchises";
import { getHistoricalData } from "../../lib/sleeper";
import { getSlootbowlResults } from "../../lib/slootbowlResults";
import {
  calculateGreatestGames,
  type GreatestGame,
} from "../../lib/greatestGames";
import { getGreatestGameCommentary } from "../../lib/greatestGamesCommentary";

const franchiseNames = new Map(
  FRANCHISES.map((team) => [team.rosterId, team.name])
);

const OBFC = new Set([4, 6, 8, 7, 9]);
const GPFC = new Set([1, 2, 3, 5, 10]);

function teamName(id: number) {
  return franchiseNames.get(id) ?? `Franchise ${id}`;
}

function shortName(id: number) {
  const names: Record<number, string> = {
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

  return names[id] ?? teamName(id);
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
  const [wins, losses, ties] = record.split("-").map(Number);
  return ties ? `${wins}-${losses}-${ties}` : `${wins}-${losses}`;
}

function gameKey(game: GreatestGame) {
  return [
    game.season,
    game.week,
    Math.min(game.rosterA, game.rosterB),
    Math.max(game.rosterA, game.rosterB),
  ].join(":");
}

type GameContext = {
  isSlootbowl: boolean;
  isConferenceChampionship: boolean;
  conferenceName: string | null;
  isHistoricClosestSlootbowl: boolean;
  isHighestScoring: boolean;
  isBiggestDemolition: boolean;
};

function gameStage(game: GreatestGame, context: GameContext) {
  if (context.isSlootbowl) return "🏆 Slootbowl";

  if (
    context.isConferenceChampionship &&
    context.conferenceName
  ) {
    return `${context.conferenceName} Championship Game`;
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
  const report = getGreatestGameCommentary(game, context);

  return (
    <article
      style={{
        background: "#151b23",
        border: "1px solid #27303b",
        borderRadius: 16,
        padding: 18,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div>
          <div
            style={{
              color: "#9da7b3",
              fontSize: 11,
              fontWeight: 700,
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
            }}
          >
            Week {game.week} · {gameStage(game, context)}
          </div>
        </div>

        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div
            style={{
              color: "#eab308",
              fontSize: 25,
              fontWeight: 900,
            }}
          >
            {game.greatnessScore.toFixed(1)}
          </div>

          <div
            style={{
              color: "#9da7b3",
              fontSize: 10,
              fontWeight: 700,
            }}
          >
            GREATNESS / 100
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: 12,
          alignItems: "center",
        }}
      >
        <div
          style={{
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {[game.rosterA, game.rosterB].map((id) => (
            <div
              key={id}
              style={{
                color:
                  game.winnerId === id
                    ? "#ffffff"
                    : "#9da7b3",
                fontWeight: game.winnerId === id ? 800 : 500,
                fontSize: 13,
              }}
            >
              {teamName(id)}
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            textAlign: "right",
            fontSize: 17,
            fontWeight: 800,
          }}
        >
          <div>{points(game.scoreA)}</div>
          <div>{points(game.scoreB)}</div>
        </div>
      </div>

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
          }}
        >
          Combined: {points(game.combinedScore)}
        </span>

        {game.isUpset && (
          <span
            style={{
              background: "#49311c",
              color: "#fbbf24",
              padding: "6px 9px",
              borderRadius: 8,
              fontSize: 11,
            }}
          >
            ⚡ Underdog Victory
          </span>
        )}
      </div>

      <p
        style={{
          color: "#c5cbd3",
          fontSize: 13,
          lineHeight: 1.75,
          marginTop: 16,
        }}
      >
        {report}
      </p>

      <details style={{ marginTop: 16 }}>
        <summary
          style={{
            color: "#9da7b3",
            fontSize: 12,
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          View greatness breakdown
        </summary>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 10,
            marginTop: 14,
            fontSize: 12,
          }}
        >
          <span>Closeness (max 40)</span>
          <strong>{game.closenessPoints}</strong>

          <span>Scoring quality (max 25)</span>
          <strong>{game.scoringPoints}</strong>

          <span>Match importance (max 25)</span>
          <strong>{game.importancePoints}</strong>

          <span>Underdog drama (max 10)</span>
          <strong>{game.underdogPoints}</strong>

          <span>
            Pregame record — {shortName(game.rosterA)}
          </span>
          <strong>{recordShort(game.pregameRecordA)}</strong>

          <span>
            Pregame record — {shortName(game.rosterB)}
          </span>
          <strong>{recordShort(game.pregameRecordB)}</strong>
        </div>
      </details>
    </article>
  );
}

export default async function GreatestGamesPage() {
  const historicalData = await getHistoricalData();

  const championships = await getSlootbowlResults(
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

  const greatestGames = calculateGreatestGames(
    historicalData.flatMap((season) => season.matchups)
  );

  const highestCombined = Math.max(
    0,
    ...greatestGames.map((game) => game.combinedScore)
  );

  const biggestMargin = Math.max(
    0,
    ...greatestGames.map((game) => game.margin)
  );

  const slootbowls = greatestGames.filter((game) =>
    championshipKeys.has(gameKey(game))
  );

  const closestSlootbowlMargin =
    slootbowls.length > 0
      ? Math.min(...slootbowls.map((game) => game.margin))
      : null;

  function getContext(game: GreatestGame): GameContext {
    const isSlootbowl = championshipKeys.has(
      gameKey(game)
    );

    const confA = conference(game.rosterA);
    const confB = conference(game.rosterB);

    const sameConference =
      confA !== null && confA === confB;

    const finalists = championshipFinalists.get(
      game.season
    );

    const winnerReachedSlootbowl =
      game.winnerId !== null &&
      finalists?.has(game.winnerId) === true;

    const isConferenceChampionship =
      game.phase === "Main Playoffs" &&
      game.week === 16 &&
      sameConference &&
      winnerReachedSlootbowl;

    return {
      isSlootbowl,
      isConferenceChampionship,
      conferenceName: isConferenceChampionship
        ? confA
        : null,
      isHistoricClosestSlootbowl:
        isSlootbowl &&
        closestSlootbowlMargin !== null &&
        game.margin === closestSlootbowlMargin,
      isHighestScoring:
        game.combinedScore === highestCombined,
      isBiggestDemolition:
        game.margin === biggestMargin,
    };
  }

  const categories = [
    {
      title: "🏆 Top 25 Greatest Games",
      description:
        "The most extraordinary matchups in SFL history.",
      games: greatestGames.slice(0, 25),
    },
    {
      title: "🎯 Closest Finishes",
      description:
        "The smallest winning margins ever recorded.",
      games: [...greatestGames]
        .sort(
          (a, b) =>
            a.margin - b.margin ||
            b.combinedScore - a.combinedScore
        )
        .slice(0, 5),
    },
    {
      title: "🔥 Highest-Scoring Shootouts",
      description:
        "The biggest combined fantasy scores.",
      games: [...greatestGames]
        .sort(
          (a, b) =>
            b.combinedScore - a.combinedScore
        )
        .slice(0, 5),
    },
    {
      title: "💀 Biggest Demolitions",
      description:
        "The most devastating defeats in SFL history.",
      games: [...greatestGames]
        .sort((a, b) => b.margin - a.margin)
        .slice(0, 5),
    },
    {
      title: "👑 Playoff Classics",
      description:
        "The greatest postseason battles.",
      games: greatestGames
        .filter(
          (game) => game.phase === "Main Playoffs"
        )
        .slice(0, 5),
    },
  ];

  return (
    <main>
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

      <header style={{ marginTop: 28 }}>
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

        <h1 style={{ marginTop: 10, fontSize: 29 }}>
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
          The closest finishes, biggest shootouts,
          historic championships and most
          humiliating defeats in SFL history.
          Ranked using our 100-point Greatness Score.
        </p>
      </header>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 10,
          marginTop: 24,
        }}
      >
        <div
          style={{
            background: "#151b23",
            border: "1px solid #27303b",
            borderRadius: 14,
            padding: 16,
          }}
        >
          <div style={{ fontSize: 23, fontWeight: 800 }}>
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
            border: "1px solid #27303b",
            borderRadius: 14,
            padding: 16,
          }}
        >
          <div style={{ fontSize: 23, fontWeight: 800 }}>
            {greatestGames.length
              ? greatestGames[0].greatnessScore.toFixed(1)
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

      {categories.map((category) => (
        <section
          key={category.title}
          style={{ marginTop: 38 }}
        >
          <h2 style={{ fontSize: 20 }}>
            {category.title}
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
            {category.description}
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {category.games.map((game, index) => (
              <GameCard
                key={gameKey(game)}
                game={game}
                rank={index + 1}
                context={getContext(game)}
              />
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
