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
    week?: string;
  }>;
};

export default async function MatchupsPage({
  searchParams,
}: MatchupsPageProps) {
  const params = await searchParams;

  const requestedWeek = Number(params.week);

  const currentWeek =
    Number.isInteger(requestedWeek) &&
    requestedWeek >= 1 &&
    requestedWeek <= 18
      ? requestedWeek
      : 3;

  const [matchups, rosters] = await Promise.all([
    getMatchups(currentWeek),
    getRosters(),
  ]);

  const rosterMap = new Map(
    rosters.map((roster) => [roster.roster_id, roster])
  );

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

  const matchupsList = Array.from(groupedMatchups.values());

  return (
    <main>
      <header
        style={{
          marginBottom: "24px",
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
          Matchups
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
              href={`/matchups?week=${currentWeek - 1}`}
              style={{
                textDecoration: "none",
                color: "#ffffff",
                fontSize: "24px",
                width: "44px",
                height: "44px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ←
            </a>
          ) : (
            <div style={{ width: "44px" }} />
          )}

          <div
            style={{
              textAlign: "center",
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
              SELECTED WEEK
            </div>

            <div
              style={{
                fontSize: "22px",
                fontWeight: "700",
                marginTop: "2px",
              }}
            >
              Week {currentWeek}
            </div>
          </div>

          {currentWeek < 18 ? (
            <a
              href={`/matchups?week=${currentWeek + 1}`}
              style={{
                textDecoration: "none",
                color: "#ffffff",
                fontSize: "24px",
                width: "44px",
                height: "44px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              →
            </a>
          ) : (
            <div style={{ width: "44px" }} />
          )}
        </div>

        <div
          style={{
            fontSize: "11px",
            fontWeight: "700",
            letterSpacing: "1.5px",
            color: "#687384",
            marginBottom: "10px",
          }}
        >
          JUMP TO WEEK
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: "8px",
          }}
        >
          {Array.from({ length: 18 }, (_, index) => {
            const week = index + 1;
            const selected = week === currentWeek;

            return (
              <a
                key={week}
                href={`/matchups?week=${week}`}
                style={{
                  textDecoration: "none",
                  color: selected ? "#ffffff" : "#9da7b3",
                  background: selected
                    ? "#27303b"
                    : "#0b0f14",
                  border: selected
                    ? "1px solid #687384"
                    : "1px solid #27303b",
                  borderRadius: "10px",
                  height: "42px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "14px",
                  fontWeight: selected ? "700" : "500",
                }}
              >
                {week}
              </a>
            );
          })}
        </div>
      </section>

      {matchupsList.length === 0 ? (
        <div
          style={{
            background: "#151b23",
            border: "1px solid #27303b",
            borderRadius: "18px",
            padding: "24px",
            textAlign: "center",
          }}
        >
          <p>
            No matchup data available for Week {currentWeek}.
          </p>
        </div>
      ) : (
        matchupsList.map((matchup, index) => {
          const first = matchup[0];
          const second = matchup[1];

          if (!first || !second) {
            return null;
          }

          const firstRoster = rosterMap.get(first.roster_id);
          const secondRoster = rosterMap.get(second.roster_id);

          const firstPoints = first.points ?? 0;
          const secondPoints = second.points ?? 0;

          const firstWon = firstPoints > secondPoints;
          const secondWon = secondPoints > firstPoints;

          const division =
            TEAM_DIVISIONS[first.roster_id] ?? "GPFC";

          return (
            <article
              key={first.matchup_id ?? index}
              style={{
                background: "#151b23",
                border: "1px solid #27303b",
                borderRadius: "20px",
                padding: "18px",
                marginBottom: "14px",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  letterSpacing: "1.5px",
                  color: "#687384",
                  marginBottom: "16px",
                }}
              >
                {division}
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: firstWon ? "700" : "500",
                      lineHeight: 1.25,
                    }}
                  >
                    {OFFICIAL_TEAM_NAMES[first.roster_id] ??
                      firstRoster?.roster_id ??
                      "Unknown Team"}
                  </div>

                  <div
                    style={{
                      fontSize: "12px",
                      color: "#687384",
                      marginTop: "5px",
                    }}
                  >
                    {firstWon
                      ? "WIN"
                      : secondWon
                      ? "LOSS"
                      : "TIE"}
                  </div>
                </div>

                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: "700",
                    minWidth: "65px",
                    textAlign: "right",
                  }}
                >
                  {firstPoints.toFixed(1)}
                </div>
              </div>

              <div
                style={{
                  height: "1px",
                  background: "#27303b",
                  margin: "16px 0",
                }}
              />

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: secondWon ? "700" : "500",
                      lineHeight: 1.25,
                    }}
                  >
                    {OFFICIAL_TEAM_NAMES[second.roster_id] ??
                      secondRoster?.roster_id ??
                      "Unknown Team"}
                  </div>

                  <div
                    style={{
                      fontSize: "12px",
                      color: "#687384",
                      marginTop: "5px",
                    }}
                  >
                    {secondWon
                      ? "WIN"
                      : firstWon
                      ? "LOSS"
                      : "TIE"}
                  </div>
                </div>

                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: "700",
                    minWidth: "65px",
                    textAlign: "right",
                  }}
                >
                  {secondPoints.toFixed(1)}
                </div>
              </div>
            </article>
          );
        })
      )}
    </main>
  );
}