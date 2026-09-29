import {
  getLeagueHistory,
  getRosters,
} from "../../lib/sleeper";

export default async function HistoryTestPage() {
  const leagues = await getLeagueHistory();

  const seasonData = await Promise.all(
    leagues.map(async (league) => {
      const rosters = await getRosters(league.league_id);

      return {
        league,
        rosterCount: rosters.length,
      };
    })
  );

  return (
    <main>
      <h1>Historical Season Test</h1>

      <p
        style={{
          marginTop: "10px",
          marginBottom: "24px",
        }}
      >
        Successfully loaded {seasonData.length} seasons.
      </p>

      {seasonData.map(({ league, rosterCount }) => (
        <article
          key={league.league_id}
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

          <p
            style={{
              marginTop: "6px",
            }}
          >
            {league.name}
          </p>

          <div
            style={{
              height: "1px",
              background: "#27303b",
              margin: "16px 0",
            }}
          />

          <p>
            Franchises found:{" "}
            <strong>{rosterCount}</strong>
          </p>

          <p
            style={{
              marginTop: "6px",
              fontSize: "12px",
              color: "#687384",
              wordBreak: "break-all",
            }}
          >
            League ID: {league.league_id}
          </p>
        </article>
      ))}
    </main>
  );
}