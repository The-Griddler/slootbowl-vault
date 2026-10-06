import { notFound } from "next/navigation";
import { getHistoricalData } from "../../../lib/sleeper";
import { getFranchiseName } from "../../../lib/franchises";
const SLOOTBOWLS = [
  { season: "2025", champion: 10, runnerUp: 9 },
  { season: "2024", champion: 10, runnerUp: 4 },
  { season: "2023", champion: 4, runnerUp: 2 },
  { season: "2022", champion: 2, runnerUp: 8 },
];
const OBFC = [4, 6, 8, 7, 9];
const GPFC = [1, 2, 10, 3, 5];
function cardStyle() {
  return {
    background: "#151b23",
    border: "1px solid #27303b",
    borderRadius: "20px",
    padding: "18px",
    marginBottom: "14px",
  } as const;
}
function labelStyle() {
  return {
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "1.5px",
    color: "#687384",
  } as const;
}
export default async function SeasonPage({
  params,
}: {
  params: Promise<{ season: string }>;
}) {
  const { season } = await params;
  const historicalData = await getHistoricalData();
  const seasonData = historicalData.find(
    (item) => item.league.season === season
  );
  if (!seasonData) {
    notFound();
  }
  const championship = SLOOTBOWLS.find(
    (item) => item.season === season
  );
  const standings = new Map<
    number,
    {
      rosterId: number;
      wins: number;
      losses: number;
      ties: number;
      points: number;
    }
  >();
  for (const rosterId of [
    ...OBFC,
    ...GPFC,
  ]) {
    standings.set(rosterId, {
      rosterId,
      wins: 0,
      losses: 0,
      ties: 0,
      points: 0,
    });
  }
  for (const matchup of seasonData.matchups) {
    if (matchup.phase !== "Regular Season") {
      continue;
    }
    const teamA = standings.get(matchup.rosterA);
    const teamB = standings.get(matchup.rosterB);
    if (!teamA || !teamB) {
      continue;
    }
    teamA.points += matchup.scoreA;
    teamB.points += matchup.scoreB;
    if (matchup.scoreA > matchup.scoreB) {
      teamA.wins++;
      teamB.losses++;
    } else if (matchup.scoreB > matchup.scoreA) {
      teamB.wins++;
      teamA.losses++;
    } else {
      teamA.ties++;
      teamB.ties++;
    }
  }
  const sortStandings = (rosterIds: number[]) =>
    rosterIds
      .map((rosterId) => standings.get(rosterId)!)
      .sort((a, b) => {
        if (b.wins !== a.wins) {
          return b.wins - a.wins;
        }
        if (b.ties !== a.ties) {
          return b.ties - a.ties;
        }
        return b.points - a.points;
      });
  const obfcStandings = sortStandings(OBFC);
  const gpfcStandings = sortStandings(GPFC);
  const playoffMatchups = seasonData.matchups
    .filter((matchup) => matchup.phase === "Main Playoffs")
    .sort((a, b) => a.week - b.week);
  const playoffWeeks = [15, 16, 17];
  return (
    <main>
      <header style={{ marginBottom: "28px" }}>
        <p
          style={{
            ...labelStyle(),
            marginBottom: "6px",
          }}
        >
          SFL HISTORY
        </p>
        <h1>{season} Season</h1>
        <p style={{ marginTop: "6px" }}>
          The Sluts Football League {season} season.
        </p>
      </header>
      <section style={cardStyle()}>
        <p style={labelStyle()}>SLOOTBOWL</p>
        {championship ? (
          <>
            <h2
              style={{
                margin: "6px 0 4px",
                fontSize: "22px",
              }}
            >
              🏆 {getFranchiseName(championship.champion)}
            </h2>
            <p>
              Defeated {getFranchiseName(championship.runnerUp)}
            </p>
          </>
        ) : (
          <>
            <h2
              style={{
                margin: "6px 0 4px",
                fontSize: "20px",
              }}
            >
              Slootbowl not yet played
            </h2>
            <p>2026 season is still underway.</p>
          </>
        )}
      </section>
      <section style={{ marginTop: "30px" }}>
        <div style={{ marginBottom: "12px" }}>
          <p style={labelStyle()}>Final Standings</p>
          <h2
            style={{
              margin: "4px 0 0",
              fontSize: "22px",
            }}
          >
            OBFC
          </h2>
        </div>
        <article style={cardStyle()}>
          {obfcStandings.map((team, index) => (
            <div
              key={team.rosterId}
              style={{
                display: "grid",
                gridTemplateColumns: "30px 1fr auto",
                gap: "10px",
                alignItems: "center",
                padding: "12px 0",
                borderBottom:
                  index === obfcStandings.length - 1
                    ? "none"
                    : "1px solid #27303b",
              }}
            >
              <strong
                style={{
                  color:
                    index === 0 ? "#f5f7fa" : "#687384",
                }}
              >
                {index + 1}
              </strong>
              <strong>
                {getFranchiseName(team.rosterId)}
              </strong>
              <div
                style={{
                  textAlign: "right",
                  fontSize: "13px",
                }}
              >
                <strong>
                  {team.wins}-{team.losses}
                  {team.ties > 0
                    ? `-${team.ties}`
                    : ""}
                </strong>
                <div
                  style={{
                    color: "#687384",
                    marginTop: "3px",
                  }}
                >
                  {team.points.toFixed(1)} PF
                </div>
              </div>
            </div>
          ))}
        </article>
      </section>
      <section style={{ marginTop: "30px" }}>
        <div style={{ marginBottom: "12px" }}>
          <p style={labelStyle()}>Final Standings</p>
          <h2
            style={{
              margin: "4px 0 0",
              fontSize: "22px",
            }}
          >
            GPFC
          </h2>
        </div>
        <article style={cardStyle()}>
          {gpfcStandings.map((team, index) => (
            <div
              key={team.rosterId}
              style={{
                display: "grid",
                gridTemplateColumns: "30px 1fr auto",
                gap: "10px",
                alignItems: "center",
                padding: "12px 0",
                borderBottom:
                  index === gpfcStandings.length - 1
                    ? "none"
                    : "1px solid #27303b",
              }}
            >
              <strong
                style={{
                  color:
                    index === 0 ? "#f5f7fa" : "#687384",
                }}
              >
                {index + 1}
              </strong>
              <strong>
                {getFranchiseName(team.rosterId)}
              </strong>
              <div
                style={{
                  textAlign: "right",
                  fontSize: "13px",
                }}
              >
                <strong>
                  {team.wins}-{team.losses}
                  {team.ties > 0
                    ? `-${team.ties}`
                    : ""}
                </strong>
                <div
                  style={{
                    color: "#687384",
                    marginTop: "3px",
                  }}
                >
                  {team.points.toFixed(1)} PF
                </div>
              </div>
            </div>
          ))}
        </article>
      </section>
      <section style={{ marginTop: "30px" }}>
        <div style={{ marginBottom: "12px" }}>
          <p style={labelStyle()}>PLAYOFFS</p>
          <h2
            style={{
              margin: "4px 0 0",
              fontSize: "22px",
            }}
          >
            Road to the Slootbowl
          </h2>
        </div>
        {playoffWeeks.map((week) => {
          const games = playoffMatchups.filter(
            (matchup) => matchup.week === week
          );
          if (games.length === 0) {
            return null;
          }
          const title =
            week === 15
              ? "Week 15 — First Round"
              : week === 16
              ? "Week 16 — Conference Championships"
              : "Week 17 — Slootbowl";
          return (
            <article
              key={week}
              style={{
                ...cardStyle(),
                marginBottom: "14px",
              }}
            >
              <h3
                style={{
                  margin: "0 0 12px",
                  fontSize: "17px",
                }}
              >
                {title}
              </h3>
              {games.map((matchup, index) => {
                const aWon =
                  matchup.scoreA > matchup.scoreB;
                const bWon =
                  matchup.scoreB > matchup.scoreA;
                return (
                  <div
                    key={`${matchup.rosterA}-${matchup.rosterB}-${index}`}
                    style={{
                      padding: "12px 0",
                      borderBottom:
                        index === games.length - 1
                          ? "none"
                          : "1px solid #27303b",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "12px",
                      }}
                    >
                      <strong
                        style={{
                          fontWeight: aWon ? 700 : 400,
                        }}
                      >
                        {getFranchiseName(
                          matchup.rosterA
                        )}
                      </strong>
                      <strong>{matchup.scoreA.toFixed(1)}</strong>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "12px",
                        marginTop: "7px",
                        color: bWon
                          ? "#f5f7fa"
                          : "#687384",
                      }}
                    >
                      <strong
                        style={{
                          fontWeight: bWon ? 700 : 400,
                        }}
                      >
                        {getFranchiseName(
                          matchup.rosterB
                        )}
                      </strong>
                      <strong>{matchup.scoreB.toFixed(1)}</strong>
                    </div>
                  </div>
                );
              })}
            </article>
          );
        })}
      </section>
    </main>
  );
}