
import Link from "next/link";

import { FRANCHISES } from "../../lib/franchises";
import { getHistoricalData } from "../../lib/sleeper";
import {
  calculateGreatestGames,
  type GreatestGame,
} from "../../lib/greatestGames";

const franchiseNames = new Map(
  FRANCHISES.map((team) => [
    team.rosterId,
    team.name,
  ])
);

function teamName(rosterId: number) {
  return (
    franchiseNames.get(rosterId) ??
    `Franchise ${rosterId}`
  );
}

function points(value: number) {
  return value.toFixed(2);
}

function GameCard({
  game,
  rank,
}: {
  game: GreatestGame;
  rank: number;
}) {
  const isSlootbowl =
    game.phase === "Main Playoffs" &&
    game.week === 17;

  const stage = isSlootbowl
    ? "🏆 Slootbowl"
    : game.phase === "Main Playoffs"
      ? "Playoffs"
      : "Regular Season";

  return (
    <article
      style={{
        background: "#151b23",
        border: "1px solid #27303b",
        borderRadius: "16px",
        padding: "18px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        <div>
          <div
            style={{
              color: "#9da7b3",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.5px",
            }}
          >
            #{rank} GREATEST GAME
          </div>

          <div
            style={{
              fontSize: "12px",
              marginTop: "6px",
              color: "#ffffff",
            }}
          >
            {game.season} · Week {game.week}
            {" · "}
            {stage}
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
              fontSize: "25px",
              fontWeight: 900,
            }}
          >
            {game.greatnessScore.toFixed(1)}
          </div>

          <div
            style={{
              color: "#9da7b3",
              fontSize: "10px",
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
          gap: "12px",
          alignItems: "center",
        }}
      >
        <div
          style={{
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <div
            style={{
              color:
                game.winnerId === game.rosterA
                  ? "#ffffff"
                  : "#9da7b3",
              fontWeight:
                game.winnerId === game.rosterA
                  ? 800
                  : 500,
              fontSize: "13px",
            }}
          >
            {teamName(game.rosterA)}
          </div>

          <div
            style={{
              color:
                game.winnerId === game.rosterB
                  ? "#ffffff"
                  : "#9da7b3",
              fontWeight:
                game.winnerId === game.rosterB
                  ? 800
                  : 500,
              fontSize: "13px",
            }}
          >
            {teamName(game.rosterB)}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            textAlign: "right",
            fontSize: "17px",
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
          gap: "8px",
          marginTop: "18px",
        }}
      >
        <span
          style={{
            background: "#26313d",
            padding: "6px 9px",
            borderRadius: "8px",
            fontSize: "11px",
          }}
        >
          Margin: {points(game.margin)}
        </span>

        <span
          style={{
            background: "#26313d",
            padding: "6px 9px",
            borderRadius: "8px",
            fontSize: "11px",
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
              borderRadius: "8px",
              fontSize: "11px",
            }}
          >
            ⚡ Underdog Victory
          </span>
        )}
      </div>

      <details style={{ marginTop: "16px" }}>
        <summary
          style={{
            color: "#9da7b3",
            fontSize: "12px",
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
            gap: "10px",
            marginTop: "14px",
            fontSize: "12px",
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

          <span>Pregame record — Team A</span>
          <strong>{game.pregameRecordA}</strong>

          <span>Pregame record — Team B</span>
          <strong>{game.pregameRecordB}</strong>
        </div>
      </details>
    </article>
  );
}

export default async function GreatestGamesPage() {
  const historicalData =
    await getHistoricalData();

  const allMatchups = historicalData.flatMap(
    (season) => season.matchups
  );

  const greatestGames =
    calculateGreatestGames(allMatchups);

  const top25 = greatestGames.slice(0, 25);

  const closestGames = [...greatestGames]
    .sort(
      (a, b) =>
        a.margin - b.margin ||
        b.combinedScore - a.combinedScore
    )
    .slice(0, 5);

  const highestScoring = [...greatestGames]
    .sort(
      (a, b) =>
        b.combinedScore - a.combinedScore
    )
    .slice(0, 5);

  const biggestBlowouts = [...greatestGames]
    .sort(
      (a, b) =>
        b.margin - a.margin
    )
    .slice(0, 5);

  const playoffClassics = greatestGames
    .filter(
      (game) =>
        game.phase === "Main Playoffs"
    )
    .slice(0, 5);

  const categories = [
    {
      title: "🏆 Top 25 Greatest Games",
      description:
        "The most extraordinary matchups in SFL history.",
      games: top25,
    },
    {
      title: "🎯 Closest Finishes",
      description:
        "The smallest winning margins ever recorded.",
      games: closestGames,
    },
    {
      title: "🔥 Highest-Scoring Shootouts",
      description:
        "The biggest combined fantasy scores.",
      games: highestScoring,
    },
    {
      title: "💀 Biggest Demolitions",
      description:
        "The most devastating defeats in SFL history.",
      games: biggestBlowouts,
    },
    {
      title: "👑 Playoff Classics",
      description:
        "The greatest postseason battles.",
      games: playoffClassics,
    },
  ];

  return (
    <main>
      <Link
        href="/"
        style={{
          color: "#9da7b3",
          fontSize: "13px",
          textDecoration: "none",
        }}
      >
        ← Back to Vault
      </Link>

      <header style={{ marginTop: "28px" }}>
        <p
          style={{
            color: "#eab308",
            fontSize: "12px",
            fontWeight: 800,
            letterSpacing: "1.5px",
          }}
        >
          THE SFL ARCHIVES
        </p>

        <h1
          style={{
            marginTop: "10px",
            fontSize: "29px",
          }}
        >
          Greatest Games
        </h1>

        <p
          style={{
            color: "#9da7b3",
            fontSize: "13px",
            lineHeight: 1.7,
            marginTop: "12px",
          }}
        >
          Five seasons of legendary matchups,
          unforgettable finishes and complete
          demolitions. Ranked using our
          100-point Greatness Score.
        </p>
      </header>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "10px",
          marginTop: "24px",
        }}
      >
        <div
          style={{
            background: "#151b23",
            border: "1px solid #27303b",
            borderRadius: "14px",
            padding: "16px",
          }}
        >
          <div
            style={{
              fontSize: "23px",
              fontWeight: 800,
            }}
          >
            {greatestGames.length}
          </div>

          <div
            style={{
              color: "#9da7b3",
              fontSize: "11px",
              marginTop: "6px",
            }}
          >
            Eligible games
          </div>
        </div>

        <div
          style={{
            background: "#151b23",
            border: "1px solid #27303b",
            borderRadius: "14px",
            padding: "16px",
          }}
        >
          <div
            style={{
              fontSize: "23px",
              fontWeight: 800,
            }}
          >
            {greatestGames.length > 0
              ? greatestGames[0].greatnessScore.toFixed(1)
              : "—"}
          </div>

          <div
            style={{
              color: "#9da7b3",
              fontSize: "11px",
              marginTop: "6px",
            }}
          >
            Highest greatness score
          </div>
        </div>
      </section>

      {categories.map((category) => (
        <section
          key={category.title}
          style={{ marginTop: "38px" }}
        >
          <h2 style={{ fontSize: "20px" }}>
            {category.title}
          </h2>

          <p
            style={{
              color: "#9da7b3",
              fontSize: "12px",
              marginTop: "8px",
              marginBottom: "16px",
              lineHeight: 1.6,
            }}
          >
            {category.description}
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {category.games.map((game, index) => (
              <GameCard
                key={`${game.season}-${game.week}-${game.rosterA}-${game.rosterB}`}
                game={game}
                rank={index + 1}
              />
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
