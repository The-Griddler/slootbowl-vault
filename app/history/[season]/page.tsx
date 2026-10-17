
import Image from "next/image";
import { notFound } from "next/navigation";
import { getHistoricalData } from "../../../lib/sleeper";
import { getFranchiseName } from "../../../lib/franchises";
import { getPlayers, getPlayerName } from "../../../lib/players";

const SLOOTBOWLS = [
  { season: "2025", champion: 10, runnerUp: 9 },
  { season: "2024", champion: 10, runnerUp: 4 },
  { season: "2023", champion: 4, runnerUp: 2 },
  { season: "2022", champion: 2, runnerUp: 8 },
];

const OBFC = [4, 6, 8, 7, 9];
const GPFC = [1, 2, 10, 3, 5];

const FRANCHISE_LOGOS: Record<number, string> = {
  1: "/logos/mt-isa-ballbags.PNG",
  2: "/logos/cambridge-cum-sluts.PNG",
  3: "/logos/grimsby-chode-chokers.PNG",
  4: "/logos/isle-of-wight-happy-endings.PNG",
  5: "/logos/grays-town-fingerblasters.PNG",
  6: "/logos/lincoln-nonces.PNG",
  7: "/logos/kalamata-dirty-vegans.PNG",
  8: "/logos/weybiza-babs.PNG",
  9: "/logos/east-rutherford-shitlickers.PNG",
  10: "/logos/chad-moist-discharge.PNG",
};

function FranchiseLogo({
  rosterId,
  size = 40,
}: {
  rosterId: number | undefined;
  size?: number;
}) {
  if (
    rosterId === undefined ||
    !FRANCHISE_LOGOS[rosterId]
  ) {
    return null;
  }

  return (
    <span
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Image
        src={FRANCHISE_LOGOS[rosterId]}
        alt=""
        width={size}
        height={size}
        style={{
          width: size,
          height: size,
          objectFit: "contain",
        }}
      />
    </span>
  );
}

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

  const [historicalData, players] = await Promise.all([
    getHistoricalData(),
    getPlayers(),
  ]);

  const seasonData = historicalData.find(
    (item) => item.league.season === season
  );

  if (!seasonData) {
    notFound();
  }

  const championship = SLOOTBOWLS.find(
    (item) => item.season === season
  );

  // Only completed NFL weeks count towards
  // official SFL results and statistics.
  const completedRegularMatchups =
    seasonData.matchups.filter(
      (matchup) =>
        matchup.phase === "Regular Season" &&
        matchup.isComplete === true &&
        Number.isFinite(matchup.scoreA) &&
        Number.isFinite(matchup.scoreB) &&
        matchup.scoreA >= 0 &&
        matchup.scoreB >= 0 &&
        (matchup.scoreA > 0 || matchup.scoreB > 0)
    );

  // All 14 weeks must have five valid games
  // involving all ten franchises.
  const regularSeasonComplete = Array.from(
    { length: 14 },
    (_, index) => index + 1
  ).every((week) => {
    const weekly = completedRegularMatchups.filter(
      (matchup) => matchup.week === week
    );

    if (weekly.length !== 5) {
      return false;
    }

    const rosterIds = new Set<number>();

    for (const matchup of weekly) {
      rosterIds.add(matchup.rosterA);
      rosterIds.add(matchup.rosterB);
    }

    return rosterIds.size === 10;
  });

  const standingsLabel = regularSeasonComplete
    ? "FINAL STANDINGS"
    : "CURRENT STANDINGS";

  // Regular-season standings.
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

  for (const rosterId of [...OBFC, ...GPFC]) {
    standings.set(rosterId, {
      rosterId,
      wins: 0,
      losses: 0,
      ties: 0,
      points: 0,
    });
  }

  for (const matchup of completedRegularMatchups) {
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

  // Only completed main-bracket games
  // establish official playoff results.
  const playoffMatchups = seasonData.matchups
    .filter(
      (matchup) =>
        matchup.phase === "Main Playoffs"
    )
    .sort((a, b) => a.week - b.week);

  const completedPlayoffMatchups =
    playoffMatchups.filter(
      (matchup) =>
        matchup.isComplete === true &&
        Number.isFinite(matchup.scoreA) &&
        Number.isFinite(matchup.scoreB) &&
        (matchup.scoreA > 0 || matchup.scoreB > 0)
    );

  const playoffTeams = new Set<number>();

  for (const matchup of completedPlayoffMatchups) {
    playoffTeams.add(matchup.rosterA);
    playoffTeams.add(matchup.rosterB);
  }

  // Player awards use completed
  // regular-season starter performances.
  const regularSeasonPerformances =
    completedRegularMatchups.flatMap(
      (matchup) => [
        ...matchup.startersA.map(
          (playerId, index) => ({
            playerId,
            rosterId: matchup.rosterA,
            points:
              matchup.startersPointsA[index] ?? 0,
          })
        ),
        ...matchup.startersB.map(
          (playerId, index) => ({
            playerId,
            rosterId: matchup.rosterB,
            points:
              matchup.startersPointsB[index] ?? 0,
          })
        ),
      ]
    );

  const playerTotals = new Map<
    string,
    {
      playerId: string;
      points: number;
      rosters: Set<number>;
    }
  >();

  for (const performance of regularSeasonPerformances) {
    if (
      !performance.playerId ||
      performance.playerId === "0" ||
      !Number.isFinite(performance.points)
    ) {
      continue;
    }

    const existing = playerTotals.get(
      performance.playerId
    );

    if (!existing) {
      playerTotals.set(performance.playerId, {
        playerId: performance.playerId,
        points: performance.points,
        rosters: new Set([performance.rosterId]),
      });
    } else {
      existing.points += performance.points;
      existing.rosters.add(performance.rosterId);
    }
  }

  // SFL MVP.
  const mvpCandidates = Array.from(
    playerTotals.values()
  )
    .filter((player) =>
      Array.from(player.rosters).some(
        (rosterId) => playoffTeams.has(rosterId)
      )
    )
    .sort((a, b) => b.points - a.points);

  const mvp = regularSeasonComplete
    ? mvpCandidates[0]
    : undefined;

  // SFL OPOY.
  const mvpPlayer = mvp
    ? players[mvp.playerId]
    : null;

  const mvpPosition =
    mvpPlayer?.position ??
    mvpPlayer?.fantasy_positions?.[0] ??
    null;

  const opoy = regularSeasonComplete
    ? mvpCandidates.find((candidate) => {
        const player = players[candidate.playerId];

        const position =
          player?.position ??
          player?.fantasy_positions?.[0] ??
          null;

        return (
          position &&
          position !== mvpPosition
        );
      })
    : undefined;

  // SFL ROY.
  const seasonNumber = Number(season);

  const currentPlayerDataSeason = Math.max(
    ...historicalData.map((item) =>
      Number(item.league.season)
    )
  );

  const rookieCandidates = Array.from(
    playerTotals.values()
  )
    .filter((candidate) => {
      const player = players[candidate.playerId];

      if (
        player?.years_exp === null ||
        player?.years_exp === undefined
      ) {
        return false;
      }

      const rookieSeason =
        currentPlayerDataSeason -
        player.years_exp;

      return rookieSeason === seasonNumber;
    })
    .sort((a, b) => b.points - a.points);

  const roy = regularSeasonComplete
    ? rookieCandidates[0]
    : undefined;

  // Slootbowl MVP.
  const slootbowl =
    completedPlayoffMatchups.find(
      (matchup) => matchup.week === 17
    );

  let sbMvp:
    | {
        playerId: string;
        rosterId: number;
        points: number;
      }
    | undefined;

  if (slootbowl) {
    const winningRosterId =
      slootbowl.scoreA > slootbowl.scoreB
        ? slootbowl.rosterA
        : slootbowl.scoreB > slootbowl.scoreA
        ? slootbowl.rosterB
        : null;

    if (winningRosterId !== null) {
      const winningStarters =
        winningRosterId === slootbowl.rosterA
          ? slootbowl.startersA
          : slootbowl.startersB;

      const winningStarterPoints =
        winningRosterId === slootbowl.rosterA
          ? slootbowl.startersPointsA
          : slootbowl.startersPointsB;

      const candidates = winningStarters
        .map((playerId, index) => ({
          playerId,
          rosterId: winningRosterId,
          points:
            winningStarterPoints[index] ?? 0,
        }))
        .filter(
          (candidate) =>
            candidate.playerId &&
            candidate.playerId !== "0" &&
            Number.isFinite(candidate.points)
        );

      sbMvp = candidates.sort(
        (a, b) => b.points - a.points
      )[0];
    }
  }

  // Identify the player's franchise
  // using the same rule as before.
  const getAwardRosterId = (
    result:
      | {
          playerId: string;
          points: number;
          rosters: Set<number>;
        }
      | {
          playerId: string;
          points: number;
          rosterId: number;
        }
  ) =>
    "rosterId" in result
      ? result.rosterId
      : Array.from(result.rosters)[0];

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

      {/* SLOOTBOWL CHAMPION */}

      <section style={cardStyle()}>
        <p style={labelStyle()}>SLOOTBOWL</p>

        {championship ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginTop: "12px",
            }}
          >
            <FranchiseLogo
              rosterId={championship.champion}
              size={80}
            />

            <div style={{ minWidth: 0, flex: 1 }}>
              <h2
                style={{
                  margin: "0 0 8px",
                  fontSize: "20px",
                }}
              >
                🏆{" "}
                {getFranchiseName(
                  championship.champion
                )}
              </h2>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "#9da7b3",
                  fontSize: "13px",
                }}
              >
                <span>Defeated</span>

                <FranchiseLogo
                  rosterId={championship.runnerUp}
                  size={30}
                />

                <span>
                  {getFranchiseName(
                    championship.runnerUp
                  )}
                </span>
              </div>
            </div>
          </div>
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

            <p>
              {season} season is still underway.
            </p>
          </>
        )}
      </section>

      {/* CONFERENCE STANDINGS */}

      {[
        {
          name: "OBFC",
          teams: obfcStandings,
        },
        {
          name: "GPFC",
          teams: gpfcStandings,
        },
      ].map((conference) => (
        <section
          key={conference.name}
          style={{ marginTop: "30px" }}
        >
          <div style={{ marginBottom: "12px" }}>
            <p style={labelStyle()}>
              {standingsLabel}
            </p>

            <h2
              style={{
                margin: "4px 0 0",
                fontSize: "22px",
              }}
            >
              {conference.name}
            </h2>
          </div>

          <article style={cardStyle()}>
            {conference.teams.map(
              (team, index) => (
                <div
                  key={team.rosterId}
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "20px 44px minmax(0, 1fr) auto",
                    gap: "9px",
                    alignItems: "center",
                    padding: "12px 0",
                    borderBottom:
                      index ===
                      conference.teams.length - 1
                        ? "none"
                        : "1px solid #27303b",
                  }}
                >
                  <strong
                    style={{
                      color:
                        index === 0
                          ? "#f5f7fa"
                          : "#687384",
                    }}
                  >
                    {index + 1}
                  </strong>

                  <FranchiseLogo
                    rosterId={team.rosterId}
                    size={44}
                  />

                  <strong
                    style={{
                      fontSize: "13px",
                      minWidth: 0,
                      overflowWrap: "break-word",
                    }}
                  >
                    {getFranchiseName(
                      team.rosterId
                    )}
                  </strong>

                  <div
                    style={{
                      textAlign: "right",
                      fontSize: "13px",
                      whiteSpace: "nowrap",
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
                        fontSize: "11px",
                      }}
                    >
                      {team.points.toFixed(1)} PF
                    </div>
                  </div>
                </div>
              )
            )}
          </article>
        </section>
      ))}

      {/* INDIVIDUAL AWARDS */}

      <section style={{ marginTop: "30px" }}>
        <div style={{ marginBottom: "12px" }}>
          <p style={labelStyle()}>
            INDIVIDUAL AWARDS
          </p>

          <h2
            style={{
              margin: "4px 0 0",
              fontSize: "22px",
            }}
          >
            SFL honours
          </h2>
        </div>

        <article style={cardStyle()}>
          {[
            {
              award: "SFL MVP",
              icon: "👑",
              result: mvp,
            },
            {
              award: "SFL OPOY",
              icon: "⭐",
              result: opoy,
            },
            {
              award: "SFL ROY",
              icon: "🏅",
              result: roy,
            },
            {
              award: "Slootbowl MVP",
              icon: "🏆",
              result: sbMvp,
            },
          ].map((award, index, awards) => {
            const result = award.result;

            const player = result
              ? players[result.playerId]
              : null;

            return (
              <div
                key={award.award}
                style={{
                  padding: "14px 0",
                  borderBottom:
                    index === awards.length - 1
                      ? "none"
                      : "1px solid #27303b",
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: "700",
                    letterSpacing: "1.5px",
                    color: "#687384",
                  }}
                >
                  {award.icon} {award.award}
                </div>

                {result && player ? (
                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems: "center",
                      gap: "12px",
                      marginTop: "10px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      <FranchiseLogo
                        rosterId={getAwardRosterId(
                          result
                        )}
                        size={48}
                      />

                      <div style={{ minWidth: 0 }}>
                        <strong
                          style={{
                            display: "block",
                            fontSize: "16px",
                          }}
                        >
                          {getPlayerName(player)}
                        </strong>

                        <span
                          style={{
                            display: "block",
                            color: "#687384",
                            fontSize: "13px",
                            marginTop: "3px",
                          }}
                        >
                          {getFranchiseName(
                            getAwardRosterId(result)
                          )}
                        </span>
                      </div>
                    </div>

                    <strong
                      style={{
                        whiteSpace: "nowrap",
                        fontSize: "13px",
                      }}
                    >
                      {result.points.toFixed(1)} pts
                    </strong>
                  </div>
                ) : (
                  <p style={{ marginTop: "6px" }}>
                    Award not available
                  </p>
                )}
              </div>
            );
          })}
        </article>
      </section>

      {/* PLAYOFFS */}

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
              style={cardStyle()}
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
                  matchup.isComplete &&
                  matchup.scoreA > matchup.scoreB;

                const bWon =
                  matchup.isComplete &&
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
                    {!matchup.isComplete && (
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#9da7b3",
                          marginBottom: "8px",
                        }}
                      >
                        PROVISIONAL RESULT
                      </div>
                    )}

                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          minWidth: 0,
                          flex: 1,
                        }}
                      >
                        <FranchiseLogo
                          rosterId={matchup.rosterA}
                          size={42}
                        />

                        <strong
                          style={{
                            fontWeight: aWon ? 700 : 400,
                            fontSize: "13px",
                          }}
                        >
                          {getFranchiseName(
                            matchup.rosterA
                          )}
                        </strong>
                      </div>

                      <strong
                        style={{
                          whiteSpace: "nowrap",
                        }}
                      >
                        {matchup.scoreA.toFixed(1)}
                      </strong>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        alignItems: "center",
                        gap: "12px",
                        marginTop: "10px",
                        color: bWon
                          ? "#f5f7fa"
                          : "#687384",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          minWidth: 0,
                          flex: 1,
                        }}
                      >
                        <FranchiseLogo
                          rosterId={matchup.rosterB}
                          size={42}
                        />

                        <strong
                          style={{
                            fontWeight: bWon ? 700 : 400,
                            fontSize: "13px",
                          }}
                        >
                          {getFranchiseName(
                            matchup.rosterB
                          )}
                        </strong>
                      </div>

                      <strong
                        style={{
                          whiteSpace: "nowrap",
                        }}
                      >
                        {matchup.scoreB.toFixed(1)}
                      </strong>
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
