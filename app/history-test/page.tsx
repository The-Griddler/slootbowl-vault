import {
  getLeagueHistory,
  getRosters,
  getUsers,
} from "../../lib/sleeper";

export default async function HistoryTestPage() {
  const leagues = await getLeagueHistory();

  const historicalTeams = await Promise.all(
    leagues.map(async (league) => {
      const [rosters, users] = await Promise.all([
        getRosters(league.league_id),
        getUsers(league.league_id),
      ]);

      const teams = rosters
        .sort((a, b) => a.roster_id - b.roster_id)
        .map((roster) => {
          const user = users.find(
            (user) =>
              user.user_id === roster.owner_id
          );

          return {
            rosterId: roster.roster_id,
            teamName:
              user?.metadata?.team_name ||
              "No team name",
            manager:
              user?.display_name ||
              "Unknown manager",
          };
        });

      return {
        season: league.season,
        leagueId: league.league_id,
        teams,
      };
    })
  );

  return (
    <main>
      <p
        style={{
          fontSize: "12px",
          fontWeight: "700",
          letterSpacing: "1.5px",
          color: "#687384",
          marginBottom: "8px",
        }}
      >
        DYNASTY SLUTS
      </p>

      <h1>Historical Teams</h1>

      <p
        style={{
          marginTop: "8px",
          marginBottom: "28px",
        }}
      >
        Sleeper team names and managers across every
        historical season.
      </p>

      {historicalTeams.map((season) => (
        <section
          key={season.leagueId}
          style={{
            marginBottom: "36px",
          }}
        >
          <h2
            style={{
              fontSize: "24px",
              margin: "0 0 6px",
            }}
          >
            {season.season}
          </h2>

          <p
            style={{
              fontSize: "12px",
              marginBottom: "14px",
              color: "#687384",
            }}
          >
            League ID: {season.leagueId}
          </p>

          {season.teams.map((team) => (
            <article
              key={team.rosterId}
              style={{
                background: "#151b23",
                border: "1px solid #27303b",
                borderRadius: "14px",
                padding: "14px",
                marginBottom: "8px",
              }}
            >
              <p
                style={{
                  color: "#ffffff",
                  fontWeight: "700",
                }}
              >
                Roster {team.rosterId}
              </p>

              <p
                style={{
                  marginTop: "5px",
                  color: "#ffffff",
                }}
              >
                {team.teamName}
              </p>

              <p
                style={{
                  marginTop: "4px",
                  fontSize: "13px",
                }}
              >
                Manager: {team.manager}
              </p>
            </article>
          ))}
        </section>
      ))}
    </main>
  );
}