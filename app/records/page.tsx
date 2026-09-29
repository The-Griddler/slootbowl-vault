import { getMatchups } from "../../lib/sleeper";

const OFFICIAL_TEAM_NAMES: Record<number, string> = {
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

type TeamPerformance = {
  rosterId: number;
  teamName: string;
  score: number;
  opponent: string;
  opponentScore: number;
  week: number;
};

function buildPerformances(
  week: number,
  matchups: Awaited<ReturnType<typeof getMatchups>>
): TeamPerformance[] {
  const groupedMatchups = new Map<
    number,
    typeof matchups
  >();

  matchups.forEach((matchup) => {
    if (!groupedMatchups.has(matchup.matchup_id)) {
      groupedMatchups.set(matchup.matchup_id, []);
    }

    groupedMatchups.get(matchup.matchup_id)!.push(matchup);
  });

  const performances: TeamPerformance[] = [];

  groupedMatchups.forEach((matchup) => {
    const first = matchup[0];
    const second = matchup[1];

    if (!first || !second) {
      return;
    }

    const firstScore = first.points ?? 0;
    const secondScore = second.points ?? 0;

    /*
      Sleeper can return matchup entries for future weeks
      with zero scores. We only treat a matchup as completed
      when there is an actual score recorded.
    */
    if (firstScore === 0 && secondScore === 0) {
      return;
    }

    const firstName =
      OFFICIAL_TEAM_NAMES[first.roster_id] ??
      `Team ${first.roster_id}`;

    const secondName =
      OFFICIAL_TEAM_NAMES[second.roster_id] ??
      `Team ${second.roster_id}`;

    performances.push({
      rosterId: first.roster_id,
      teamName: firstName,
      score: firstScore,
      opponent: secondName,
      opponentScore: secondScore,
      week,
    });

    performances.push({
      rosterId: second.roster_id,
      teamName: secondName,
      score: secondScore,
      opponent: firstName,
      opponentScore: firstScore,
      week,
    });
  });

  return performances;
}

function RecordCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article
      style={{
        background: "#151b23",
        border: "1px solid #27303b",
        borderRadius: "18px",
        padding: "18px",
        marginBottom: "10px",
      }}
    >
      <p
        style={{
          fontSize: "12px",
          fontWeight: "700",
          letterSpacing: "1px",
          color: "#687384",
        }}
      >
        {label}
      </p>

      <div
        style={{
          fontSize: "28px",
          fontWeight: "700",
          marginTop: "6px",
        }}
      >
        {value}
      </div>

      <p
        style={{
          marginTop: "5px",
          fontSize: "13px",
        }}
      >
        {detail}
      </p>
    </article>
  );
}

function RecordSection({
  title,
  performances,
}: {
  title: string;
  performances: TeamPerformance[];
}) {
  if (performances.length === 0) {
    return (
      <section
        style={{
          marginBottom: "32px",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            fontWeight: "700",
            letterSpacing: "1.5px",
            color: "#687384",
            marginBottom: "12px",
          }}
        >
          {title}
        </div>

        <div
          style={{
            background: "#151b23",
            border: "1px solid #27303b",
            borderRadius: "18px",
            padding: "20px",
          }}
        >
          <p>No completed games yet.</p>
        </div>
      </section>
    );
  }

  const highestScore = [...performances].sort(
    (a, b) => b.score - a.score
  )[0];

  const lowestScore = [...performances].sort(
    (a, b) => a.score - b.score
  )[0];

  const biggestWin = [...performances]
    .filter((performance) => {
      return performance.score > performance.opponentScore;
    })
    .sort(
      (a, b) =>
        b.score -
        b.opponentScore -
        (a.score - a.opponentScore)
    )[0];

  const closestGame = [...performances].sort(
    (a, b) =>
      Math.abs(a.score - a.opponentScore) -
      Math.abs(b.score - b.opponentScore)
  )[0];

  const teamWins = new Map<number, number>();

  performances.forEach((performance) => {
    if (performance.score > performance.opponentScore) {
      teamWins.set(
        performance.rosterId,
        (teamWins.get(performance.rosterId) ?? 0) + 1
      );
    }
  });

  const mostWins = [...teamWins.entries()].sort(
    (a, b) => b[1] - a[1]
  )[0];

  const mostWinsTeam = mostWins
    ? {
        teamName:
          OFFICIAL_TEAM_NAMES[mostWins[0]] ??
          `Team ${mostWins[0]}`,
        wins: mostWins[1],
      }
    : null;

  return (
    <section
      style={{
        marginBottom: "32px",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          fontWeight: "700",
          letterSpacing: "1.5px",
          color: "#687384",
          marginBottom: "12px",
        }}
      >
        {title}
      </div>

      <RecordCard
        label="Highest Team Score"
        value={
          highestScore
            ? highestScore.score.toFixed(1)
            : "—"
        }
        detail={
          highestScore
            ? `${highestScore.teamName} · Week ${highestScore.week}`
            : "No data"
        }
      />

      <RecordCard
        label="Lowest Team Score"
        value={
          lowestScore
            ? lowestScore.score.toFixed(1)
            : "—"
        }
        detail={
          lowestScore
            ? `${lowestScore.teamName} · Week ${lowestScore.week}`
            : "No data"
        }
      />

      <RecordCard
        label="Biggest Winning Margin"
        value={
          biggestWin
            ? `${(
                biggestWin.score -
                biggestWin.opponentScore
              ).toFixed(1)} pts`
            : "—"
        }
        detail={
          biggestWin
            ? `${biggestWin.teamName} over ${biggestWin.opponent} · Week ${biggestWin.week}`
            : "No completed wins"
        }
      />

      <RecordCard
        label="Closest Game"
        value={
          closestGame
            ? `${Math.abs(
                closestGame.score -
                  closestGame.opponentScore
              ).toFixed(1)} pts`
            : "—"
        }
        detail={
          closestGame
            ? `${closestGame.teamName} vs ${closestGame.opponent} · Week ${closestGame.week}`
            : "No data"
        }
      />

      <RecordCard
        label="Most Wins"
        value={
          mostWinsTeam
            ? mostWinsTeam.wins.toString()
            : "—"
        }
        detail={
          mostWinsTeam
            ? mostWinsTeam.teamName
            : "No completed wins"
        }
      />
    </section>
  );
}

export default async function RecordsPage() {
  /*
    Current 2026 season status:

    Weeks 1–14 = Regular Season
    Weeks 15–17 = Playoffs
    Week 18 = No fantasy

    Week 3 is currently live, so we only process
    Weeks 1–3 for the current season.
  */
  const currentWeek = 3;

  const completedRegularSeasonWeeks = Array.from(
    { length: currentWeek },
    (_, index) => index + 1
  );

  const playoffWeeks = Array.from(
    { length: 3 },
    (_, index) => index + 15
  );

  const regularSeasonResults = await Promise.all(
    completedRegularSeasonWeeks.map(async (week) => {
      const matchups = await getMatchups(week);

      return buildPerformances(week, matchups);
    })
  );

  const playoffResults = await Promise.all(
    playoffWeeks.map(async (week) => {
      const matchups = await getMatchups(week);

      return buildPerformances(week, matchups);
    })
  );

  const regularSeasonPerformances =
    regularSeasonResults.flat();

  const playoffPerformances =
    playoffResults.flat();

  return (
    <main>
      <header
        style={{
          marginBottom: "28px",
        }}
      >
        <p
          style={{
            fontSize: "12px",
            fontWeight: "700",
            letterSpacing: "2px",
            color: "#687384",
            marginBottom: "6px",
          }}
        >
          DYNASTY SLUTS
        </p>

        <h1
          style={{
            fontSize: "34px",
            margin: 0,
          }}
        >
          Records
        </h1>

        <p
          style={{
            marginTop: "6px",
          }}
        >
          2026 Season
        </p>
      </header>

      <RecordSection
        title="REGULAR SEASON"
        performances={regularSeasonPerformances}
      />

      <RecordSection
        title="PLAYOFFS"
        performances={playoffPerformances}
      />

      <section
        style={{
          marginBottom: "32px",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            fontWeight: "700",
            letterSpacing: "1.5px",
            color: "#687384",
            marginBottom: "12px",
          }}
        >
          ALL-TIME
        </div>

        <article
          style={{
            background: "#151b23",
            border: "1px solid #27303b",
            borderRadius: "18px",
            padding: "18px",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "18px",
            }}
          >
            The Dynasty Sluts Record Book
          </h2>

          <p
            style={{
              marginTop: "8px",
              fontSize: "14px",
              lineHeight: 1.5,
            }}
          >
            All-time league records, player records,
            franchise records, playoff records and
            historical performances will live here.
          </p>
        </article>
      </section>
    </main>
  );
}