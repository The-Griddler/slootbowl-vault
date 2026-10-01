import { getHistoricalData } from "../../lib/sleeper";
import { getPlayerRecords } from "../../lib/playerRecords";
import { getPlayers, getPlayerName } from "../../lib/players";
import { getFranchiseName } from "../../lib/franchises";

const SLOOTBOWLS = [
  { season: "2025", champion: 10, runnerUp: 9 },
  { season: "2024", champion: 10, runnerUp: 4 },
  { season: "2023", champion: 4, runnerUp: 2 },
  { season: "2022", champion: 2, runnerUp: 8 },
];

const CONFERENCE_CHAMPIONS = [
  {
    season: "2025",
    obfc: 9,
    gpfc: 10,
  },
  {
    season: "2024",
    obfc: 4,
    gpfc: 10,
  },
  {
    season: "2023",
    obfc: 4,
    gpfc: 2,
  },
  {
    season: "2022",
    obfc: 8,
    gpfc: 2,
  },
];

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

export default async function HistoryPage() {
  const [historicalData, playerRecords, players] =
    await Promise.all([
      getHistoricalData(),
      getPlayerRecords(),
      getPlayers(),
    ]);

  const mvpBySeason = new Map<
    string,
    {
      playerId: string;
      points: number;
      rosterId: number;
    }
  >();

  for (const season of historicalData) {
    const playoffTeams = new Set<number>();

    for (const matchup of season.matchups) {
      if (matchup.phase === "Main Playoffs") {
        playoffTeams.add(matchup.rosterA);
        playoffTeams.add(matchup.rosterB);
      }
    }

    const totals = new Map<
      string,
      {
        playerId: string;
        points: number;
        rosterId: number;
      }
    >();

    for (const performance of playerRecords.weekly) {
      if (
        performance.season !== season.league.season ||
        performance.phase !== "Regular Season"
      ) {
        continue;
      }

      const existing = totals.get(
        performance.playerId
      );

      if (!existing) {
        totals.set(performance.playerId, {
          playerId: performance.playerId,
          points: performance.points,
          rosterId: performance.rosterId,
        });
      } else {
        existing.points += performance.points;
        existing.rosterId = performance.rosterId;
      }
    }

    const eligible = Array.from(totals.values())
      .filter((record) => {
        const playerPerformances =
          playerRecords.weekly.filter(
            (performance) =>
              performance.season ===
                season.league.season &&
              performance.playerId ===
                record.playerId &&
              performance.phase ===
                "Regular Season"
          );

        return playerPerformances.some((performance) =>
          playoffTeams.has(performance.rosterId)
        );
      })
      .sort((a, b) => b.points - a.points);

    if (eligible[0]) {
      mvpBySeason.set(season.league.season, {
        playerId: eligible[0].playerId,
        points: eligible[0].points,
        rosterId: eligible[0].rosterId,
      });
    }
  }

  const seasons = historicalData
    .map((season) => season.league.season)
    .sort((a, b) => Number(b) - Number(a));

  const latestSeasons = seasons.slice(0, 5);

  return (
    <main>
      <header
        style={{
          marginBottom: "28px",
        }}
      >
        <p
          style={{
            ...labelStyle(),
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
          History
        </h1>

        <p
          style={{
            marginTop: "6px",
          }}
        >
          The official history of the Sluts Football League.
        </p>
      </header>

      {/* SLOOTBOWL */}

      <section>
        <div
          style={{
            marginBottom: "12px",
          }}
        >
          <p style={labelStyle()}>
            SLOOTBOWL
          </p>

          <h2
            style={{
              margin: "4px 0 0",
              fontSize: "22px",
            }}
          >
            Championship history
          </h2>
        </div>

        <article style={cardStyle()}>
          {latestSeasons.map((season) => {
            const result = SLOOTBOWLS.find(
              (item) => item.season === season
            );

            return (
              <div
                key={season}
                style={{
                  display: "grid",
                  gridTemplateColumns: "54px 1fr",
                  gap: "14px",
                  padding: "13px 0",
                  borderBottom:
                    "1px solid #27303b",
                }}
              >
                <strong>
                  {season}
                </strong>

                <div>
                  {result ? (
                    <>
                      <div
                        style={{
                          fontWeight: "700",
                        }}
                      >
                        🏆{" "}
                        {getFranchiseName(
                          result.champion
                        )}
                      </div>

                      <div
                        style={{
                          color: "#687384",
                          fontSize: "13px",
                          marginTop: "3px",
                        }}
                      >
                        vs{" "}
                        {getFranchiseName(
                          result.runnerUp
                        )}
                      </div>
                    </>
                  ) : (
                    <div
                      style={{
                        color: "#9da7b3",
                      }}
                    >
                      Slootbowl not yet played
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </article>
      </section>

      {/* CONFERENCE CHAMPIONS */}

      <section
        style={{
          marginTop: "30px",
        }}
      >
        <div
          style={{
            marginBottom: "12px",
          }}
        >
          <p style={labelStyle()}>
            CONFERENCE CHAMPIONS
          </p>

          <h2
            style={{
              margin: "4px 0 0",
              fontSize: "22px",
            }}
          >
            The road to the Slootbowl
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "1fr 1fr",
            gap: "10px",
          }}
        >
          {/* OBFC */}

          <article
            style={{
              ...cardStyle(),
              marginBottom: 0,
            }}
          >
            <p style={labelStyle()}>
              OBFC
            </p>

            <h3
              style={{
                margin:
                  "5px 0 4px",
                fontSize: "16px",
              }}
            >
              George Barnes Memorial Trophy
            </h3>

            {latestSeasons.map(
              (season) => {
                const result =
                  CONFERENCE_CHAMPIONS.find(
                    (item) =>
                      item.season ===
                      season
                  );

                return (
                  <div
                    key={season}
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      gap: "8px",
                      padding:
                        "10px 0",
                      borderBottom:
                        "1px solid #27303b",
                      fontSize:
                        "13px",
                    }}
                  >
                    <span
                      style={{
                        color:
                          "#687384",
                      }}
                    >
                      {season}
                    </span>

                    <strong
                      style={{
                        textAlign:
                          "right",
                      }}
                    >
                      {result
                        ? getFranchiseName(
                            result.obfc
                          )
                        : "TBD"}
                    </strong>
                  </div>
                );
              }
            )}
          </article>

          {/* GPFC */}

          <article
            style={{
              ...cardStyle(),
              marginBottom: 0,
            }}
          >
            <p style={labelStyle()}>
              GPFC
            </p>

            <h3
              style={{
                margin:
                  "5px 0 4px",
                fontSize: "16px",
              }}
            >
              Ryan Birr Memorial Shield
            </h3>

            {latestSeasons.map(
              (season) => {
                const result =
                  CONFERENCE_CHAMPIONS.find(
                    (item) =>
                      item.season ===
                      season
                  );

                return (
                  <div
                    key={season}
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      gap: "8px",
                      padding:
                        "10px 0",
                      borderBottom:
                        "1px solid #27303b",
                      fontSize:
                        "13px",
                    }}
                  >
                    <span
                      style={{
                        color:
                          "#687384",
                      }}
                    >
                      {season}
                    </span>

                    <strong
                      style={{
                        textAlign:
                          "right",
                      }}
                    >
                      {result
                        ? getFranchiseName(
                            result.gpfc
                          )
                        : "TBD"}
                    </strong>
                  </div>
                );
              }
            )}
          </article>
        </div>
      </section>

      {/* MVP */}

      <section
        style={{
          marginTop: "30px",
        }}
      >
        <div
          style={{
            marginBottom: "12px",
          }}
        >
          <p style={labelStyle()}>
            SFL MVP
          </p>

          <h2
            style={{
              margin: "4px 0 0",
              fontSize: "22px",
            }}
          >
            Regular-season MVP
          </h2>
        </div>

        <article style={cardStyle()}>
          {latestSeasons.map(
            (season) => {
              const mvp =
                mvpBySeason.get(
                  season
                );

              if (!mvp) {
                return (
                  <div
                    key={season}
                    style={{
                      padding:
                        "12px 0",
                      borderBottom:
                        "1px solid #27303b",
                    }}
                  >
                    <strong>
                      {season}
                    </strong>

                    <p
                      style={{
                        marginTop:
                          "4px",
                      }}
                    >
                      MVP data unavailable
                    </p>
                  </div>
                );
              }

              const player =
                players[
                  mvp.playerId
                ];

              return (
                <div
                  key={season}
                  style={{
                    display:
                      "grid",
                    gridTemplateColumns:
                      "54px 1fr auto",
                    gap: "12px",
                    alignItems:
                      "center",
                    padding:
                      "12px 0",
                    borderBottom:
                      "1px solid #27303b",
                  }}
                >
                  <strong>
                    {season}
                  </strong>

                  <div>
                    <div
                      style={{
                        fontWeight:
                          "700",
                      }}
                    >
                      👑{" "}
                      {getPlayerName(
                        player
                      )}
                    </div>

                    <div
                      style={{
                        color:
                          "#687384",
                        fontSize:
                          "13px",
                        marginTop:
                          "3px",
                      }}
                    >
                      {getFranchiseName(
                        mvp.rosterId
                      )}
                    </div>
                  </div>

                  <strong
                    style={{
                      whiteSpace:
                        "nowrap",
                    }}
                  >
                    {mvp.points.toFixed(
                      1
                    )}{" "}
                    pts
                  </strong>
                </div>
              );
            }
          )}
        </article>
      </section>

      {/* SEASONS */}

      <section
        style={{
          marginTop: "30px",
        }}
      >
        <div
          style={{
            marginBottom: "12px",
          }}
        >
          <p style={labelStyle()}>
            SEASONS
          </p>

          <h2
            style={{
              margin: "4px 0 0",
              fontSize: "22px",
            }}
          >
            SFL season archive
          </h2>
        </div>

        {latestSeasons.map(
          (season) => {
            const result =
              SLOOTBOWLS.find(
                (item) =>
                  item.season ===
                  season
              );

            return (
              <article
                key={season}
                style={cardStyle()}
              >
                <div
                  style={{
                    display:
                      "flex",
                    justifyContent:
                      "space-between",
                    gap: "12px",
                    alignItems:
                      "center",
                  }}
                >
                  <div>
                    <p
                      style={labelStyle()}
                    >
                      SEASON
                    </p>

                    <h3
                      style={{
                        margin:
                          "4px 0 0",
                        fontSize:
                          "21px",
                      }}
                    >
                      {season}
                    </h3>
                  </div>

                  <div
                    style={{
                      textAlign:
                        "right",
                    }}
                  >
                    {result ? (
                      <>
                        <div
                          style={{
                            fontSize:
                              "12px",
                            color:
                              "#687384",
                          }}
                        >
                          SLOOTBOWL
                          CHAMPION
                        </div>

                        <strong
                          style={{
                            display:
                              "block",
                            marginTop:
                              "3px",
                          }}
                        >
                          {getFranchiseName(
                            result.champion
                          )}
                        </strong>
                      </>
                    ) : (
                      <span
                        style={{
                          color:
                            "#687384",
                        }}
                      >
                        Current season
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          }
        )}
      </section>
    </main>
  );
}