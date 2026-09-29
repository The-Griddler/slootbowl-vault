import { getMatchups, getRosters } from "../../lib/sleeper";

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

type TeamRecord = {
  rosterId: number;
  teamName: string;
  score: number;
  opponent: string;
  opponentScore: number;
  week: number;
};

export default async function RecordsPage() {
  const rosters = await getRosters();

  const rosterMap = new Map(
    rosters.map((roster) => [roster.roster_id, roster])
  );

  const allTeamPerformances: TeamRecord[] = [];

  for (let week = 1; week <= 14; week++) {
    const matchups = await getMatchups(week);

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

    groupedMatchups.forEach((matchup) => {
      const first = matchup[0];
      const second = matchup[1];

      if (!first || !second) {
        return;
      }

      const firstName =
        OFFICIAL_TEAM_NAMES[first.roster_id] ??
        `Team ${first.roster_id}`;

      const secondName =
        OFFICIAL_TEAM_NAMES[second.roster_id] ??
        `Team ${second.roster_id}`;

      allTeamPerformances.push({
        rosterId: first.roster_id,
        teamName: firstName,
        score: first.points ?? 0,
        opponent: secondName,
        opponentScore: second.points ?? 0,
        week,
      });

      allTeamPerformances.push({
        rosterId: second.roster_id,
        teamName: secondName,
        score: second.points ?? 0,
        opponent: firstName,
        opponentScore: first.points ?? 0,
        week,
      });
    });
  }

  const highestScore = [...allTeamPerformances].sort(
    (a, b) => b.score - a.score
  )[0];

  const lowestScore = [...allTeamPerformances].sort(
    (a, b) => a.score - b.score
  )[0];

  const biggestWin = [...allTeamPerformances].sort(
    (a, b) =>
      b.score -
      b.opponentScore -
      (a.score - a.opponentScore)
  )[0];

  const closestGame = [...allTeamPerformances].sort(
    (a, b) =>
      Math.abs(a.score - a.opponentScore) -
      Math.abs(b.score - b.opponentScore)
  )[0];

  const teamWins = new Map<number, number>();

  allTeamPerformances.forEach((performance) => {
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

  const records = [
    {
      label: "Highest Team Score",
      value: highestScore
        ? highestScore.score.toFixed(1)
        : "—",
      detail: highestScore
        ? `${highestScore.teamName} · Week ${highestScore.week}`
        : "No data",
    },
    {
      label: "Lowest Team Score",
      value: lowestScore
        ? lowestScore.score.toFixed(1)
        : "—",
      detail: lowestScore
        ? `${lowestScore.teamName} · Week ${lowestScore.week}`
        : "No data",
    },
    {
      label: "Biggest Winning Margin",
      value: biggestWin
        ? `${(
            biggestWin.score -
            biggestWin.opponentScore
          ).toFixed(1)} pts`
        : "—",
      detail: biggestWin
        ? `${biggestWin.teamName} over ${biggestWin.opponent} · Week ${biggestWin.week}`
        : "No data",
    },
    {
      label: "Closest Game",
      value: closestGame
        ? `${Math.abs(
            closestGame.score -
              closestGame.opponentScore
          ).toFixed(1)} pts`
        : "—",
      detail: closestGame
        ? `${closestGame.teamName} vs ${closestGame.opponent} · Week ${closestGame.week}`
        : "No data",
    },
    {
      label: "Most Wins",
      value: mostWinsTeam
        ? mostWinsTeam.wins.toString()
        : "—",
      detail: mostWinsTeam
        ? mostWinsTeam.teamName
        : "No data",
    },
  ];

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

      <section
        style={{
          marginBottom: "28px",
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
          LEAGUE RECORDS
        </div>

        {records.map((record) => (
          <article
            key={record.label}
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
              {record.label}
            </p>

            <div
              style={{
                fontSize: "28px",
                fontWeight: "700",
                marginTop: "6px",
              }}
            >
              {record.value}
            </div>

            <p
              style={{
                marginTop: "5px",
                fontSize: "13px",
              }}
            >
              {record.detail}
            </p>
          </article>
        ))}
      </section>

      <section>
        <div
          style={{
            fontSize: "11px",
            fontWeight: "700",
            letterSpacing: "1.5px",
            color: "#687384",
            marginBottom: "12px",
          }}
        >
          COMING SOON
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
            historical performances.
          </p>
        </article>
      </section>
    </main>
  );
}