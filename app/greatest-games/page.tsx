
import Link from "next/link";

import { FRANCHISES } from "../../lib/franchises";
import { getHistoricalData } from "../../lib/sleeper";
import { getSlootbowlResults } from "../../lib/slootbowlResults";
import {
  calculateGreatestGames,
  type GreatestGame,
} from "../../lib/greatestGames";

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

function commentary(
  game: GreatestGame,
  context: GameContext
): string {
  const winnerId = game.winnerId;

  if (winnerId === null) {
    return (
      `Neither side could finish the job, with ` +
      `${points(game.combinedScore)} combined points ` +
      `and absolutely nothing separating them.`
    );
  }

  const loserId =
    winnerId === game.rosterA
      ? game.rosterB
      : game.rosterA;

  const winner = shortName(winnerId);
  const loser = shortName(loserId);

  const winnerFull = teamName(winnerId);
  const loserFull = teamName(loserId);

  const winnerScore =
    winnerId === game.rosterA
      ? game.scoreA
      : game.scoreB;

  const loserScore =
    winnerId === game.rosterA
      ? game.scoreB
      : game.scoreA;

  const winnerRecord = recordShort(
    winnerId === game.rosterA
      ? game.pregameRecordA
      : game.pregameRecordB
  );

  const loserRecord = recordShort(
    winnerId === game.rosterA
      ? game.pregameRecordB
      : game.pregameRecordA
  );

  const margin = points(game.margin);
  const total = points(game.combinedScore);

  // SLOOTBOWL
  if (context.isSlootbowl) {
    if (
      winnerId === 10 &&
      loserId === 9 &&
      context.isHistoricClosestSlootbowl
    ) {
      return (
        `Chad Moist Discharge entered the Slootbowl ` +
        `at ${winnerRecord}, facing an East Rutherford ` +
        `side that had gone ${loserRecord}. Against ` +
        `the odds, Chad squeezed out a ` +
        `${points(winnerScore)}–${points(loserScore)} ` +
        `victory, claiming the championship by just ` +
        `${margin} points. Never has such a tiny ` +
        `margin produced such an enormous discharge.`
      );
    }

    if (
      winnerId === 10 &&
      loserId === 4 &&
      context.isHighestScoring
    ) {
      return (
        `The Happy Endings came looking for a climax, ` +
        `but Chad Moist Discharge had other ideas. ` +
        `In the highest-scoring game in SFL history, ` +
        `Chad prevailed ${points(winnerScore)}–` +
        `${points(loserScore)}, with both sides ` +
        `combining for a frankly indecent ${total} points.`
      );
    }

    if (context.isHistoricClosestSlootbowl) {
      return (
        `${winnerFull} claimed the Slootbowl over ` +
        `${loserFull} by an almost unbelievable ` +
        `${margin} points. The closest championship ` +
        `finish in SFL history left absolutely no ` +
        `room for premature celebration.`
      );
    }

    if (game.isUpset) {
      return (
        `${winnerFull} arrived at ${winnerRecord}, ` +
        `while ${loser} entered at ${loserRecord}. ` +
        `Form went out the window as ${winner} ` +
        `claimed the Slootbowl by ${margin} points. ` +
        `A glorious upset on the biggest stage.`
      );
    }

    if (game.margin <= 5) {
      return (
        `${winnerFull} held their nerve to defeat ` +
        `${loserFull} by ${margin} points in the ` +
        `Slootbowl. With ${total} points between ` +
        `them, this championship delivered a ` +
        `properly nerve-shredding finish.`
      );
    }

    return (
      `${winnerFull} defeated ${loserFull} ` +
      `${points(winnerScore)}–${points(loserScore)} ` +
      `to lift the Slootbowl. The championship ` +
      `produced ${total} combined points, with ` +
      `${winner} emerging as the last franchise standing.`
    );
  }

  // CONFERENCE CHAMPIONSHIP GAMES
  if (
    context.isConferenceChampionship &&
    context.conferenceName
  ) {
    const title = `${context.conferenceName} Championship Game`;

    if (game.margin <= 1) {
      if (winnerId === 4 && loserId === 9) {
        return (
          `The ${title} delivered ${total} points ` +
          `of absolute filth. Isle of Wight Happy ` +
          `Endings edged East Rutherford Shitlickers ` +
          `by just ${margin} points, leaving the ` +
          `Shitlickers with nothing to show for ` +
          `their efforts but a very sore exit. ` +
          `Isle of Wight booked their place in ` +
          `the Slootbowl.`
        );
      }

      return (
        `The ${title} went right down to the wire. ` +
        `${winnerFull} edged ${loserFull} by ` +
        `just ${margin} points after a ${total}-point ` +
        `contest, securing the conference crown ` +
        `and a place in the Slootbowl.`
      );
    }

    if (game.margin <= 5) {
      return (
        `${winnerFull} survived a fierce challenge ` +
        `from ${loserFull} in the ${title}. ` +
        `A ${margin}-point victory secured the ` +
        `conference crown and sent ${winner} ` +
        `through to the Slootbowl.`
      );
    }

    return (
      `${winnerFull} defeated ${loserFull} ` +
      `${points(winnerScore)}–${points(loserScore)} ` +
      `in the ${title}. ${winner} claimed the ` +
      `conference crown and punched their ticket ` +
      `to the Slootbowl.`
    );
  }

  // HISTORIC DEMOLITIONS
  if (context.isBiggestDemolition) {
    if (winnerId === 10 && loserId === 7) {
      return (
        `Kalamata Dirty Vegans were absolutely ` +
        `steamrolled by Chad Moist Discharge, ` +
        `who unloaded ${points(winnerScore)} points ` +
        `against their miserable ${points(loserScore)}. ` +
        `The ${margin}-point margin stands as the ` +
        `biggest demolition in SFL history. ` +
        `A performance that probably warrants ` +
        `an apology.`
      );
    }

    return (
      `${winnerFull} absolutely dismantled ` +
      `${loserFull}, winning by ${margin} points ` +
      `in the biggest demolition in SFL history. ` +
      `The scoreboard was ugly, and the loser ` +
      `will be hoping nobody saved a screenshot.`
    );
  }

  // OTHER PLAYOFF GAMES
  if (game.phase === "Main Playoffs") {
    if (game.margin >= 75) {
      return (
        `${winnerFull} gave ${loserFull} an ` +
        `absolute hiding in the playoffs, ` +
        `winning by ${margin} points. ` +
        `A postseason performance that was ` +
        `equal parts ruthless and deeply embarrassing.`
      );
    }

    if (game.margin <= 3) {
      return (
        `Only ${margin} points separated ` +
        `${winner} and ${loser} in a ${total}-point ` +
        `playoff thriller. ${winnerFull} survived ` +
        `the scare and kept their Slootbowl ` +
        `ambitions alive.`
      );
    }

    if (game.isUpset) {
      return (
        `${winnerFull} entered the playoffs at ` +
        `${winnerRecord}, but regular-season form ` +
        `counted for very little against ${loser}. ` +
        `${winner} pulled off a ${margin}-point ` +
        `upset to keep their championship hopes alive.`
      );
    }

    return (
      `${winnerFull} overcame ${loserFull} by ` +
      `${margin} points in a ${total}-point ` +
      `playoff clash, keeping their Slootbowl ` +
      `dreams very much alive.`
    );
  }

  // REGULAR-SEASON GAMES
  if (game.margin >= 75) {
    return (
      `${winnerFull} put ${loserFull} through ` +
      `the absolute wringer, winning ` +
      `${points(winnerScore)}–${points(loserScore)}. ` +
      `A ${margin}-point humiliation that ` +
      `won't be forgotten in the group chat.`
    );
  }

  if (game.margin >= 40) {
    return (
      `${winnerFull} piled on ${points(winnerScore)} ` +
      `points and left ${loserFull} trailing ` +
      `by ${margin}. A comprehensive spanking ` +
      `by any reasonable definition.`
    );
  }

  if (context.isHighestScoring) {
    return (
      `${winnerFull} came out on top against ` +
      `${loserFull} in the highest-scoring game ` +
      `in SFL history. The two franchises ` +
      `combined for an outrageous ${total} points.`
    );
  }

  if (game.isUpset && game.margin <= 5) {
    return (
      `${winner} entered at ${winnerRecord}, ` +
      `facing a ${loser} side sitting at ` +
      `${loserRecord}. The underdogs somehow ` +
      `squeezed out a ${margin}-point victory, ` +
      `leaving the favourites thoroughly unsatisfied.`
    );
  }

  if (game.isUpset) {
    return (
      `Despite entering at ${winnerRecord} ` +
      `against ${loser}'s ${loserRecord}, ` +
      `${winnerFull} turned the form book ` +
      `upside down. A ${margin}-point upset ` +
      `gave ${loser} a result they'd rather forget.`
    );
  }

  if (game.margin <= 0.5) {
    return (
      `${winnerFull} escaped with a victory ` +
      `over ${loserFull} by a microscopic ` +
      `${margin} points. After ${total} combined ` +
      `points, the difference was barely enough ` +
      `to measure. Absolute scenes.`
    );
  }

  if (game.margin <= 3) {
    return (
      `${winnerFull} edged ${loserFull} ` +
      `by just ${margin} points in a ` +
      `${total}-point nail-biter. ` +
      `One franchise celebrated; the other ` +
      `was left staring at the decimal places.`
    );
  }

  if (game.combinedScore >= 330) {
    return (
      `${winnerFull} outgunned ${loserFull} ` +
      `in a spectacular ${total}-point shootout. ` +
      `${winner} finished ${margin} points clear ` +
      `after both sides emptied the clip.`
    );
  }

  if (game.margin <= 8) {
    return (
      `${winnerFull} held off ${loserFull} ` +
      `by ${margin} points after a tightly ` +
      `contested ${total}-point matchup. ` +
      `A win worth celebrating and a loss ` +
      `worth complaining about all week.`
    );
  }

  return (
    `${winnerFull} defeated ${loserFull} ` +
    `${points(winnerScore)}–${points(loserScore)} ` +
    `in Week ${game.week} of the ${game.season} ` +
    `season. ${winner} took the bragging rights ` +
    `with a ${margin}-point victory.`
  );
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
        {commentary(game, context)}
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

          <span>Pregame record — {shortName(game.rosterA)}</span>
          <strong>{recordShort(game.pregameRecordA)}</strong>

          <span>Pregame record — {shortName(game.rosterB)}</span>
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

    // A Week 16 matchup is labelled a conference
    // championship only when both teams share
    // a conference and its winner is a verified
    // Slootbowl finalist that season.
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
