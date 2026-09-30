import { fetchBracketForPage, getMatchups } from "@/lib/sleeper";

const LEAGUE_ID = "1194916402053423104"; // 2025

export default async function HistoryDebugPage() {
  const losersBracket = await fetchBracketForPage(
    LEAGUE_ID,
    "losers_bracket"
  );

  const weeks = await Promise.all(
    [15, 16, 17].map(async (week) => {
      const matchups = await getMatchups(week, LEAGUE_ID);

      const grouped = new Map<number, typeof matchups>();

      for (const matchup of matchups) {
        if (matchup.matchup_id === null) continue;

        if (!grouped.has(matchup.matchup_id)) {
          grouped.set(matchup.matchup_id, []);
        }

        grouped.get(matchup.matchup_id)!.push(matchup);
      }

      return {
        week,
        matchups: Array.from(grouped.entries()).map(
          ([matchupId, teams]) => ({
            matchupId,
            teams: teams.map((team) => ({
              rosterId: team.roster_id,
              points: team.points,
              starters: team.starters,
              startersPoints: team.starters_points,
            })),
          })
        ),
      };
    })
  );

  return (
    <main
      style={{
        padding: "24px",
        fontFamily: "monospace",
        maxWidth: "1000px",
        margin: "0 auto",
      }}
    >
      <h1>2025 Playoff Diagnostic</h1>

      <h2>Losers Bracket — Raw Sleeper Data</h2>

      <pre
        style={{
          whiteSpace: "pre-wrap",
          overflowX: "auto",
          background: "#111",
          color: "#fff",
          padding: "16px",
          borderRadius: "12px",
        }}
      >
        {JSON.stringify(losersBracket, null, 2)}
      </pre>

      <h2>Weeks 15–17 Matchups</h2>

      {weeks.map((week) => (
        <section key={week.week}>
          <h3>Week {week.week}</h3>

          <pre
            style={{
              whiteSpace: "pre-wrap",
              overflowX: "auto",
              background: "#111",
              color: "#fff",
              padding: "16px",
              borderRadius: "12px",
            }}
          >
            {JSON.stringify(week.matchups, null, 2)}
          </pre>
        </section>
      ))}
    </main>
  );
}