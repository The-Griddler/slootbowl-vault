
import {
  getLeagueHistory,
  type SleeperMatchup,
} from "../../lib/sleeper";

type WeeklyRoster = SleeperMatchup & {
  players?: string[] | null;
};

type AuditRow = {
  season: string;
  week: number;
  rosterId: number;
  rosterPlayers: number;
  starters: number;
  benchPlayers: number;
  sampleBenchIds: string[];
  status: string;
};

async function fetchWeeklyRosters(
  leagueId: string,
  week: number
): Promise<WeeklyRoster[]> {
  const response = await fetch(
    `https://api.sleeper.app/v1/league/${leagueId}/matchups/${week}`,
    { next: { revalidate: 300 } }
  );

  if (!response.ok) {
    throw new Error(
      `Unable to load Week ${week} for league ${leagueId}`
    );
  }

  return response.json();
}

export default async function RosterAuditPage() {
  const leagues = await getLeagueHistory();

  // Sample early, middle and late weeks
  // across the completed SFL seasons.
  const completedLeagues = leagues.filter(
    (league) =>
      Number(league.season) <
      new Date().getUTCFullYear()
  );

  const weeksToCheck = [1, 7, 14, 15, 17];

  const results = await Promise.all(
    completedLeagues.flatMap((league) =>
      weeksToCheck.map(async (week) => {
        const rosters = await fetchWeeklyRosters(
          league.league_id,
          week
        );

        return rosters.map((roster): AuditRow => {
          const players = roster.players;
          const starters = (roster.starters ?? [])
            .filter((id) => id && id !== "0");

          const benchPlayers = Array.isArray(players)
            ? players.filter(
                (id) => !starters.includes(id)
              )
            : [];

          return {
            season: league.season,
            week,
            rosterId: roster.roster_id,
            rosterPlayers: players?.length ?? 0,
            starters: starters.length,
            benchPlayers: benchPlayers.length,
            sampleBenchIds: benchPlayers.slice(0, 3),
            status: Array.isArray(players)
              ? "AVAILABLE"
              : "MISSING",
          };
        });
      })
    )
  );

  const rows = results
    .flat()
    .sort(
      (a, b) =>
        Number(a.season) - Number(b.season) ||
        a.week - b.week ||
        a.rosterId - b.rosterId
    );

  const available = rows.filter(
    (row) => row.status === "AVAILABLE"
  ).length;

  const missing = rows.length - available;

  return (
    <main style={{ padding: "24px 12px 110px" }}>
      <h1>Historical Roster Audit</h1>

      <p style={{ color: "#9da7b3" }}>
        Temporary diagnostic page for Franchise Legends.
        Tests whether Sleeper provides historical
        roster membership, including bench players.
      </p>

      <div
        style={{
          background: "#151b23",
          border: "1px solid #27303b",
          borderRadius: "14px",
          padding: "16px",
          margin: "20px 0",
        }}
      >
        <p>Roster-week samples: {rows.length}</p>
        <p>Available: {available}</p>
        <p>Missing: {missing}</p>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "12px",
          }}
        >
          <thead>
            <tr>
              {[
                "Season",
                "Week",
                "Team",
                "Players",
                "Starters",
                "Bench",
                "Status",
              ].map((heading) => (
                <th
                  key={heading}
                  style={{
                    textAlign: "left",
                    padding: "10px 8px",
                    borderBottom: "1px solid #27303b",
                  }}
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr
                key={`${row.season}-${row.week}-${row.rosterId}`}
              >
                <td style={{ padding: "9px 8px" }}>
                  {row.season}
                </td>
                <td style={{ padding: "9px 8px" }}>
                  {row.week}
                </td>
                <td style={{ padding: "9px 8px" }}>
                  {row.rosterId}
                </td>
                <td style={{ padding: "9px 8px" }}>
                  {row.rosterPlayers}
                </td>
                <td style={{ padding: "9px 8px" }}>
                  {row.starters}
                </td>
                <td style={{ padding: "9px 8px" }}>
                  {row.benchPlayers}
                </td>
                <td style={{ padding: "9px 8px" }}>
                  {row.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
