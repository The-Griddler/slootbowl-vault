
import { getHistoricalData } from "../../lib/sleeper";
import { getAllSlootPlayerDirectory } from "../../lib/players";
import {
  calculateAllSloot,
  type AllSlootSelection,
} from "../../lib/allSloot";
import {
  calculateAllSlootCareers,
} from "../../lib/allSlootCareer";

type PageProps = {
  searchParams: Promise<{
    view?: string;
    season?: string;
    team?: string;
  }>;
};

const TEAM_OPTIONS = [
  { id: "first", label: "First Team" },
  { id: "second", label: "Second Team" },
  { id: "rookie", label: "Rookie Team" },
];

const FRANCHISE_NAMES: Record<number, string> = {
  1: "Mt Isa Ballbags",
  2: "Cambridge Cum Sluts",
  3: "Grimsby Chode Chokers",
  4: "Isle of Wight Happy Endings",
  5: "Grays Town Fingerblasters",
  6: "Lincoln Nonces",
  7: "Kalamata Dirty Vegans",
  8: "Weybiza BAB's",
  9: "East Rutherford Shitlickers",
  10: "Chad Moist Discharge",
};

const BORDER = "1px solid #263244";
const MUTED = "#9da7b3";

function formatPoints(points: number): string {
  return points.toFixed(2);
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      style={{
        display: "inline-block",
        padding: "10px 14px",
        borderRadius: "10px",
        border: BORDER,
        background: active ? "#263244" : "transparent",
        color: "inherit",
        textDecoration: "none",
        fontWeight: "700",
        fontSize: "13px",
      }}
    >
      {children}
    </a>
  );
}

function TeamTable({
  selections,
}: {
  selections: AllSlootSelection[];
}) {
  if (selections.length === 0) {
    return <p>No eligible players were found for this team.</p>;
  }

  return (
    <div style={{ display: "grid", gap: "10px" }}>
      {selections.map((selection) => {
        const player = selection.player;

        return (
          <div
            key={`${selection.slot}-${player.playerId}`}
            style={{
              padding: "14px",
              border: BORDER,
              borderRadius: "12px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "12px",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "11px",
                    color: MUTED,
                    fontWeight: "700",
                    letterSpacing: "1px",
                    marginBottom: "5px",
                  }}
                >
                  {selection.slot}
                </div>

                <div
                  style={{
                    fontWeight: "700",
                    fontSize: "16px",
                  }}
                >
                  {player.name}
                </div>

                <div
                  style={{
                    fontSize: "12px",
                    color: MUTED,
                    marginTop: "4px",
                  }}
                >
                  {player.position} · {player.gamesStarted} starts
                </div>
              </div>

              <div
                style={{
                  textAlign: "right",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    fontWeight: "800",
                    fontSize: "18px",
                  }}
                >
                  {formatPoints(player.points)}
                </div>

                <div
                  style={{
                    fontSize: "11px",
                    color: MUTED,
                  }}
                >
                  SFL points
                </div>
              </div>
            </div>

            {player.franchises.length > 0 && (
              <div
                style={{
                  marginTop: "14px",
                  paddingTop: "12px",
                  borderTop: BORDER,
                  display: "grid",
                  gap: "8px",
                }}
              >
                {player.franchises.map((franchise) => {
                  const isPrimary =
                    franchise.rosterId === player.primaryRosterId;

                  return (
                    <div
                      key={franchise.rosterId}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "10px",
                        fontSize: "12px",
                      }}
                    >
                      <div>
                        <span
                          style={{
                            fontWeight: isPrimary ? "700" : "400",
                          }}
                        >
                          {FRANCHISE_NAMES[franchise.rosterId] ??
                            `Roster ${franchise.rosterId}`}
                        </span>

                        {isPrimary &&
                          player.franchises.length > 1 && (
                            <span
                              style={{
                                color: MUTED,
                                marginLeft: "6px",
                                fontSize: "10px",
                              }}
                            >
                              PRIMARY
                            </span>
                          )}
                      </div>

                      <div
                        style={{
                          textAlign: "right",
                          flexShrink: 0,
                        }}
                      >
                        <span style={{ fontWeight: "700" }}>
                          {formatPoints(franchise.points)}
                        </span>

                        <span
                          style={{
                            color: MUTED,
                            marginLeft: "6px",
                          }}
                        >
                          ({franchise.gamesStarted} starts)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default async function AllSlootPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  const [historicalData, playerDirectory] = await Promise.all([
    getHistoricalData(),
    getAllSlootPlayerDirectory(),
  ]);

  const seasons = historicalData
    .map((season) =>
      calculateAllSloot(season, playerDirectory)
    )
    .sort(
      (a, b) => Number(b.season) - Number(a.season)
    );

  const currentYear = new Date().getUTCFullYear();

  // Career honours only include completed seasons.
  // Current-season awards remain provisional.
  const completedSeasons = seasons.filter(
    (season) => Number(season.season) < currentYear
  );

  const careers = calculateAllSlootCareers(completedSeasons);

  const selectedSeason =
    seasons.find(
      (season) => season.season === params.season
    ) ?? seasons[0];

  const selectedTeam = TEAM_OPTIONS.some(
    (option) => option.id === params.team
  )
    ? params.team
    : "first";

  const view =
    params.view === "career" ? "career" : "annual";

  const selections =
    selectedTeam === "second"
      ? selectedSeason?.secondTeam ?? []
      : selectedTeam === "rookie"
        ? selectedSeason?.rookieTeam ?? []
        : selectedSeason?.firstTeam ?? [];

  const isCurrentSeason =
    Number(selectedSeason?.season) === currentYear;

  const latestCompletedYear = completedSeasons[0]?.season;

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

      <h1>All-Sloot Honours</h1>

      <p
        style={{
          marginTop: "8px",
          marginBottom: "24px",
        }}
      >
        Celebrating the SFL&apos;s best performers,
        season by season and across their careers.
      </p>

      <div
        style={{
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
          marginBottom: "24px",
        }}
      >
        <NavLink
          href={`/all-sloot?view=annual&season=${
            selectedSeason?.season ?? ""
          }&team=${selectedTeam}`}
          active={view === "annual"}
        >
          Annual Teams
        </NavLink>

        <NavLink
          href="/all-sloot?view=career"
          active={view === "career"}
        >
          Career Honours
        </NavLink>
      </div>

      {view === "annual" ? (
        <>
          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
              marginBottom: "20px",
            }}
          >
            {seasons.map((season) => (
              <NavLink
                key={season.season}
                href={`/all-sloot?view=annual&season=${season.season}&team=${selectedTeam}`}
                active={
                  selectedSeason?.season === season.season
                }
              >
                {season.season}
              </NavLink>
            ))}
          </div>

          {isCurrentSeason && (
            <p
              style={{
                padding: "12px",
                borderRadius: "10px",
                background: "#263244",
                marginBottom: "20px",
                fontSize: "13px",
              }}
            >
              Current season: selections are provisional
              until the regular season finishes.
            </p>
          )}

          {selectedTeam === "rookie" && (
            <p
              style={{
                padding: "12px",
                borderRadius: "10px",
                border: BORDER,
                marginBottom: "20px",
                fontSize: "13px",
              }}
            >
              Rookie eligibility is estimated from Sleeper
              experience data and should be independently
              verified.
            </p>
          )}

          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
              marginBottom: "20px",
            }}
          >
            {TEAM_OPTIONS.map((option) => (
              <NavLink
                key={option.id}
                href={`/all-sloot?view=annual&season=${
                  selectedSeason?.season ?? ""
                }&team=${option.id}`}
                active={selectedTeam === option.id}
              >
                {option.label}
              </NavLink>
            ))}
          </div>

          <h2 style={{ marginBottom: "16px" }}>
            {selectedSeason?.season}{" "}
            {
              TEAM_OPTIONS.find(
                (option) => option.id === selectedTeam
              )?.label
            }
          </h2>

          <TeamTable selections={selections} />
        </>
      ) : (
        <>
          <h2 style={{ marginBottom: "8px" }}>
            SFL Career Honours
          </h2>

          <p
            style={{
              fontSize: "13px",
              color: MUTED,
              marginBottom: "20px",
            }}
          >
            All-time All-Sloot selections
            {latestCompletedYear
              ? ` through ${latestCompletedYear}`
              : ""}
            . Current-season selections are excluded
            until the season is complete.
          </p>

          <div
            style={{
              display: "grid",
              gap: "12px",
            }}
          >
            {careers.map((player, index) => (
              <div
                key={player.playerId}
                style={{
                  padding: "16px",
                  border: BORDER,
                  borderRadius: "12px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "12px",
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: "700",
                        color: MUTED,
                        marginBottom: "5px",
                      }}
                    >
                      RANK #{index + 1} · {player.position}
                    </div>

                    <div
                      style={{
                        fontWeight: "800",
                        fontSize: "17px",
                      }}
                    >
                      {player.name}
                    </div>

                    <div
                      style={{
                        color: MUTED,
                        fontSize: "12px",
                        marginTop: "5px",
                      }}
                    >
                      {player.seasonsHonoured} seasons honoured
                    </div>
                  </div>

                  <div
                    style={{
                      textAlign: "right",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        fontSize: "24px",
                        fontWeight: "800",
                      }}
                    >
                      {player.totalHonours}
                    </div>

                    <div
                      style={{
                        color: MUTED,
                        fontSize: "11px",
                      }}
                    >
                      Total honours
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "8px",
                    marginTop: "16px",
                  }}
                >
                  {[
                    {
                      label: "First Team",
                      value: player.firstTeamSelections,
                    },
                    {
                      label: "Second Team",
                      value: player.secondTeamSelections,
                    },
                    {
                      label: "Rookie Team",
                      value: player.rookieTeamSelections,
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      style={{
                        background: "#202833",
                        padding: "10px 6px",
                        borderRadius: "8px",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: "800",
                          fontSize: "20px",
                        }}
                      >
                        {stat.value}
                      </div>

                      <div
                        style={{
                          fontSize: "10px",
                          color: MUTED,
                          marginTop: "4px",
                        }}
                      >
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    borderTop: BORDER,
                    marginTop: "14px",
                    paddingTop: "12px",
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "6px",
                  }}
                >
                  {player.awards.map((award) => (
                    <span
                      key={`${award.season}-${award.team}`}
                      style={{
                        fontSize: "11px",
                        padding: "6px 8px",
                        borderRadius: "7px",
                        background: "#263244",
                      }}
                    >
                      {award.season} · {award.team}
                    </span>
                  ))}
                </div>
              </div>
            ))}

            {careers.length === 0 && (
              <p>No completed-season honours found.</p>
            )}
          </div>
        </>
      )}
    </main>
  );
}
