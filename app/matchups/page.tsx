
import { getHistoricalData } from "../../lib/sleeper";

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

const TEAM_DIVISIONS: Record<number, "OBFC" | "GPFC"> = {
  1: "GPFC",
  2: "GPFC",
  3: "GPFC",
  4: "OBFC",
  5: "GPFC",
  6: "OBFC",
  7: "OBFC",
  8: "OBFC",
  9: "OBFC",
  10: "GPFC",
};

type MatchupsPageProps = {
  searchParams: Promise<{
    season?: string;
    week?: string;
  }>;
};

function formatScore(score: number): string {
  return score.toFixed(2);
}

function formatMargin(
  firstScore: number,
  secondScore: number
): string {
  return Math.abs(firstScore - secondScore).toFixed(2);
}

function getWeekLabel(week: number): string {
  if (week === 15) return "Playoff Week 15";
  if (week === 16) return "Playoff Week 16";
  if (week === 17) return "Slootbowl Week";
  return `Week ${week}`;
}

export default async function MatchupsPage({
  searchParams,
}: MatchupsPageProps) {
  const params = await searchParams;

  const historicalData = await getHistoricalData();

  const completedThroughSeason =
    new Date().getUTCFullYear() - 1;

  const completedSeasons = historicalData
    .filter(
      (season) =>
        Number(season.league.season) <=
        completedThroughSeason
    )
    .sort(
      (a, b) =>
        Number(b.league.season) -
        Number(a.league.season)
    );

  const availableSeasons = completedSeasons.map(
    (season) => String(season.league.season)
  );

  const selectedSeason =
    params.season &&
    availableSeasons.includes(params.season)
      ? params.season
      : availableSeasons[0];

  const seasonData = completedSeasons.find(
    (season) =>
      String(season.league.season) === selectedSeason
  );

  const requestedWeek = Number(params.week);

  const currentWeek =
    Number.isInteger(requestedWeek) &&
    requestedWeek >= 1 &&
    requestedWeek <= 17
      ? requestedWeek
      : 1;

  // Only official regular-season and main-playoff
  // games belong in the historical archive.
  const matchups = (seasonData?.matchups ?? [])
    .filter(
      (matchup) =>
        matchup.week === currentWeek &&
        (matchup.phase === "Regular Season" ||
          matchup.phase === "Main Playoffs")
    )
    .sort((a, b) => a.rosterA - b.rosterA);

  const regularSeasonCount = (
    seasonData?.matchups ?? []
  ).filter(
    (matchup) =>
      matchup.phase === "Regular Season"
  ).length;

  const playoffCount = (
    seasonData?.matchups ?? []
  ).filter(
    (matchup) =>
      matchup.phase === "Main Playoffs"
  ).length;

  function weekUrl(week: number): string {
    return `/matchups?season=${selectedSeason}&week=${week}`;
  }

  return (
    <main
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "24px 16px 110px",
      }}
    >
      <header style={{ marginBottom: "24px" }}>
        <p
          style={{
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "2px",
            color: "#687384",
            marginBottom: "6px",
          }}
        >
          DYNASTY SLUTS · SFL ARCHIVES
        </p>

        <h1
          style={{
            fontSize: "30px",
            margin: 0,
            fontWeight: 800,
          }}
        >
          Matchup Archive
        </h1>

        <p
          style={{
            color: "#9da7b3",
            fontSize: "13px",
            lineHeight: 1.6,
            marginTop: "10px",
          }}
        >
          Relive every official SFL regular-season
          and main-playoff matchup. Explore historic
          results, winning margins and championship
          games from completed seasons.
        </p>
      </header>

      {availableSeasons.length === 0 ? (
        <section
          style={{
            padding: "24px",
            background: "#151b23",
            border: "1px solid #27303b",
            borderRadius: "16px",
          }}
        >
          No completed SFL seasons are available.
        </section>
      ) : (
        <>
          <section
            style={{
              background: "#151b23",
              border: "1px solid #27303b",
              borderRadius: "18px",
              padding: "16px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "1.5px",
                color: "#687384",
                marginBottom: "12px",
              }}
            >
              SELECT SEASON
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(75px, 1fr))",
                gap: "8px",
              }}
            >
              {availableSeasons.map((season) => {
                const selected =
                  season === selectedSeason;

                return (
                  <a
                    key={season}
                    href={`/matchups?season=${season}&week=1`}
                    style={{
                      textDecoration: "none",
                      color: selected
                        ? "#ffffff"
                        : "#9da7b3",
                      background: selected
                        ? "#27303b"
                        : "#0b0f14",
                      border: selected
                        ? "1px solid #687384"
                        : "1px solid #27303b",
                      borderRadius: "10px",
                      padding: "12px 8px",
                      textAlign: "center",
                      fontSize: "14px",
                      fontWeight: selected ? 800 : 500,
                    }}
                  >
                    {season}
                  </a>
                );
              })}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
                marginTop: "16px",
              }}
            >
              <div
                style={{
                  background: "#202833",
                  borderRadius: "10px",
                  padding: "12px",
                }}
              >
                <div
                  style={{
                    color: "#9da7b3",
                    fontSize: "11px",
                    marginBottom: "5px",
                  }}
                >
                  Regular-Season Games
                </div>

                <div
                  style={{
                    fontSize: "21px",
                    fontWeight: 800,
                  }}
                >
                  {regularSeasonCount}
                </div>
              </div>

              <div
                style={{
                  background: "#202833",
                  borderRadius: "10px",
                  padding: "12px",
                }}
              >
                <div
                  style={{
                    color: "#9da7b3",
                    fontSize: "11px",
                    marginBottom: "5px",
                  }}
                >
                  Main-Playoff Games
                </div>

                <div
                  style={{
                    fontSize: "21px",
                    fontWeight: 800,
                  }}
                >
                  {playoffCount}
                </div>
              </div>
            </div>
          </section>

          <section
            style={{
              background: "#151b23",
              border: "1px solid #27303b",
              borderRadius: "18px",
              padding: "16px",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "16px",
              }}
            >
              {currentWeek > 1 ? (
                <a
                  href={weekUrl(currentWeek - 1)}
                  style={{
                    color: "#ffffff",
                    textDecoration: "none",
                    fontSize: "24px",
                    padding: "8px",
                  }}
                >
                  ←
                </a>
              ) : (
                <div style={{ width: "40px" }} />
              )}

              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    color: "#687384",
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "1.5px",
                  }}
                >
                  {selectedSeason} SEASON
                </div>

                <div
                  style={{
                    fontSize: "21px",
                    fontWeight: 800,
                    marginTop: "4px",
                  }}
                >
                  {getWeekLabel(currentWeek)}
                </div>
              </div>

              {currentWeek < 17 ? (
                <a
                  href={weekUrl(currentWeek + 1)}
                  style={{
                    color: "#ffffff",
                    textDecoration: "none",
                    fontSize: "24px",
                    padding: "8px",
                  }}
                >
                  →
                </a>
              ) : (
                <div style={{ width: "40px" }} />
              )}
            </div>

            <div
              style={{
                color: "#687384",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "1.5px",
                marginBottom: "10px",
              }}
            >
              REGULAR SEASON
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(7, minmax(0, 1fr))",
                gap: "7px",
                marginBottom: "20px",
              }}
            >
              {Array.from(
                { length: 14 },
                (_, index) => index + 1
              ).map((week) => {
                const selected =
                  week === currentWeek;

                return (
                  <a
                    key={week}
                    href={weekUrl(week)}
                    style={{
                      textDecoration: "none",
                      color: selected
                        ? "#ffffff"
                        : "#9da7b3",
                      background: selected
                        ? "#27303b"
                        : "#0b0f14",
                      border: selected
                        ? "1px solid #687384"
                        : "1px solid #27303b",
                      borderRadius: "9px",
                      height: "40px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "13px",
                      fontWeight: selected
                        ? 800
                        : 500,
                    }}
                  >
                    {week}
                  </a>
                );
              })}
            </div>

            <div
              style={{
                color: "#687384",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "1.5px",
                marginBottom: "10px",
              }}
            >
              MAIN PLAYOFFS
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(3, minmax(0, 1fr))",
                gap: "8px",
              }}
            >
              {[15, 16, 17].map((week) => {
                const selected =
                  week === currentWeek;

                return (
                  <a
                    key={week}
                    href={weekUrl(week)}
                    style={{
                      textDecoration: "none",
                      color: selected
                        ? "#ffffff"
                        : "#9da7b3",
                      background: selected
                        ? "#27303b"
                        : "#0b0f14",
                      border: selected
                        ? "1px solid #687384"
                        : "1px solid #27303b",
                      borderRadius: "9px",
                      height: "42px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "13px",
                      fontWeight: selected
                        ? 800
                        : 500,
                    }}
                  >
                    Week {week}
                  </a>
                );
              })}
            </div>
          </section>

          <div
            style={{
              marginBottom: "14px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <h2
              style={{
                fontSize: "19px",
                fontWeight: 800,
                margin: 0,
              }}
            >
              {selectedSeason} · {getWeekLabel(currentWeek)}
            </h2>

            <span
              style={{
                fontSize: "12px",
                color: "#9da7b3",
                whiteSpace: "nowrap",
              }}
            >
              {matchups.length} games
            </span>
          </div>

          {matchups.length === 0 ? (
            <div
              style={{
                background: "#151b23",
                border: "1px solid #27303b",
                borderRadius: "18px",
                padding: "24px",
                color: "#9da7b3",
                textAlign: "center",
                fontSize: "13px",
              }}
            >
              No official matchups recorded for
              this week.
            </div>
          ) : (
            matchups.map((matchup, index) => {
              const firstPoints = matchup.scoreA;
              const secondPoints = matchup.scoreB;

              const firstWon =
                firstPoints > secondPoints;
              const secondWon =
                secondPoints > firstPoints;

              const margin = formatMargin(
                firstPoints,
                secondPoints
              );

              const divisionA =
                TEAM_DIVISIONS[matchup.rosterA];

              const divisionB =
                TEAM_DIVISIONS[matchup.rosterB];

              const divisionLabel =
                divisionA === divisionB
                  ? divisionA
                  : "INTERCONFERENCE";

              const isSlootbowl =
                matchup.phase === "Main Playoffs" &&
                currentWeek === 17;

              return (
                <article
                  key={`${selectedSeason}-${currentWeek}-${matchup.rosterA}-${matchup.rosterB}-${index}`}
                  style={{
                    background: "#151b23",
                    border: "1px solid #27303b",
                    borderRadius: "18px",
                    padding: "17px",
                    marginBottom: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "16px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        letterSpacing: "1px",
                        color: "#9da7b3",
                      }}
                    >
                      {isSlootbowl
                        ? "SLOOTBOWL WEEK"
                        : matchup.phase ===
                          "Main Playoffs"
                        ? "MAIN PLAYOFFS"
                        : divisionLabel}
                    </span>

                    <span
                      style={{
                        color: "#9da7b3",
                        fontSize: "11px",
                      }}
                    >
                      Final
                    </span>
                  </div>

                  {[
                    {
                      rosterId: matchup.rosterA,
                      score: firstPoints,
                      won: firstWon,
                    },
                    {
                      rosterId: matchup.rosterB,
                      score: secondPoints,
                      won: secondWon,
                    },
                  ].map((team, teamIndex) => (
                    <div
                      key={team.rosterId}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent:
                          "space-between",
                        gap: "12px",
                        padding:
                          teamIndex === 0
                            ? "0 0 14px"
                            : "14px 0 0",
                        borderBottom:
                          teamIndex === 0
                            ? "1px solid #27303b"
                            : "none",
                      }}
                    >
                      <div
                        style={{
                          minWidth: 0,
                          flex: 1,
                        }}
                      >
                        <div
                          style={{
                            fontSize: "15px",
                            fontWeight: team.won
                              ? 800
                              : 500,
                            lineHeight: 1.35,
                          }}
                        >
                          {OFFICIAL_TEAM_NAMES[
                            team.rosterId
                          ] ??
                            `Roster ${team.rosterId}`}
                        </div>

                        <div
                          style={{
                            color: team.won
                              ? "#d6e6d8"
                              : "#687384",
                            fontSize: "11px",
                            marginTop: "4px",
                          }}
                        >
                          {firstPoints === secondPoints
                            ? "TIE"
                            : team.won
                            ? "WIN"
                            : "LOSS"}
                        </div>
                      </div>

                      <div
                        style={{
                          fontSize: "23px",
                          fontWeight: team.won
                            ? 800
                            : 600,
                          fontVariantNumeric:
                            "tabular-nums",
                          textAlign: "right",
                        }}
                      >
                        {formatScore(team.score)}
                      </div>
                    </div>
                  ))}

                  <div
                    style={{
                      marginTop: "16px",
                      paddingTop: "12px",
                      borderTop: "1px solid #27303b",
                      display: "flex",
                      justifyContent:
                        "space-between",
                      gap: "10px",
                      fontSize: "12px",
                      color: "#9da7b3",
                    }}
                  >
                    <span>
                      {matchup.phase ===
                      "Main Playoffs"
                        ? "Official playoff game"
                        : "Regular-season game"}
                    </span>

                    <strong
                      style={{
                        color: "#ffffff",
                      }}
                    >
                      {firstPoints === secondPoints
                        ? "Draw"
                        : `Margin: ${margin}`}
                    </strong>
                  </div>
                </article>
              );
            })
          )}

          <p
            style={{
              color: "#687384",
              fontSize: "12px",
              lineHeight: 1.6,
              marginTop: "24px",
            }}
          >
            Historical results are sourced from
            Sleeper. Only completed SFL seasons
            are displayed. Toilet Bowl and
            consolation matchups are excluded
            from official records.
          </p>
        </>
      )}
    </main>
  );
}
