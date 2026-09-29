import {
  getLeagueHistory,
  getMatchups,
} from "../../lib/sleeper";

export default async function HistoryTestPage() {
  const leagues = await getLeagueHistory();

  const seasonData = await Promise.all(
    leagues.map(async (league) => {
      const weeklyData = await Promise.all(
        Array.from({ length: 17 }, async (_, index) => {
          const week = index + 1;
          const matchups = await getMatchups(
            week,
            league.league_id
          );

          const completedMatchups = new Set<number>();

          matchups.forEach((matchup) => {
            if ((matchup.points ?? 0) > 0) {
              completedMatchups.add(matchup.matchup_id);
            }
          });

          return {
            week,
            completedMatchups: completedMatchups.size,
          };
        })
      );

      return {
        league,
        weeklyData,
      };
    })
  );

  return (
    <main>
      <h1>Historical Matchup Test</h1>

      <p
        style={{
          marginTop: "10px",
          marginBottom: "24px",
        }}
      >
        Checking Weeks 1–17 across all five seasons.
      </p>

      {seasonData.map(({ league, weeklyData }) => (
        <article
          key={league.league_id}
          style={{
            background: "#151b23",
            border: "1px solid #27303b",
            borderRadius: "18px",
            padding: "18px",
            marginBottom: "16px",
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
            SEASON
          </p>

          <h2
            style={{
              margin: "6px 0 0",
              fontSize: "22px",
            }}
          >
            {league.season}
          </h2>

          <div
            style={{
              height: "1px",
              background: "#27303b",
              margin: "16px 0",
            }}
          />

          {weeklyData.map((week) => (
            <div
              key={week.week}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "7px 0",
                borderBottom:
                  "1px solid #27303b",
              }}
            >
              <span>Week {week.week}</span>

              <span
                style={{
                  color: "#9da7b3",
                }}
              >
                {week.completedMatchups} matchups
              </span>
            </div>
          ))}
        </article>
      ))}
    </main>
  );
}