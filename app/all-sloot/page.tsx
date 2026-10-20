
import {
  getHistoricalData,
  getNFLState,
  isNFLWeekComplete,
} from "../../lib/sleeper";
import { getAllSlootPlayerDirectory } from "../../lib/players";
import { FRANCHISES } from "../../lib/franchises";
import {
  calculateAllSloot,
  type AllSlootSelection,
} from "../../lib/allSloot";
import { calculateAllSlootCareers } from "../../lib/allSlootCareer";
import CareerHonours from "./CareerHonours";

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

const FRANCHISE_MAP = new Map(
  FRANCHISES.map((team) => [team.rosterId, team])
);

const BORDER = "1px solid #263244";
const MUTED = "#9da7b3";

function franchiseName(id: number) {
  return FRANCHISE_MAP.get(id)?.name ?? `Roster ${id}`;
}

function franchiseLogo(id: number) {
  return FRANCHISE_MAP.get(id)?.logo ?? null;
}

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
    return (
      <p>No eligible players were found for this team.</p>
    );
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
                  {player.position} ·{" "}
                  {player.gamesStarted} starts
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
                  gap: "10px",
                }}
              >
                {player.franchises.map((franchise) => {
                  const isPrimary =
                    franchise.rosterId ===
                    player.primaryRosterId;

                  const logo = franchiseLogo(
                    franchise.rosterId
                  );

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
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "9px",
                          minWidth: 0,
                          flex: 1,
                        }}
                      >
                        <div
                          style={{
                            width: "30px",
                            height: "30px",
                            flexShrink: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {logo ? (
                            <img
                              src={logo}
                              alt=""
                              width={30}
                              height={30}
                              style={{
                                width: "30px",
                                height: "30px",
                                objectFit: "contain",
                              }}
                            />
                          ) : (
                            <span
                              style={{
                                fontSize: "18px",
                                opacity: 0.5,
                              }}
                            >
                              🏈
                            </span>
                          )}
                        </div>

                        <div
                          style={{
                            minWidth: 0,
                          }}
                        >
                          <div
                            style={{
                              fontWeight: isPrimary
                                ? "700"
                                : "400",
                              lineHeight: 1.4,
                            }}
                          >
                            {franchiseName(
                              franchise.rosterId
                            )}
                          </div>

                          {isPrimary &&
                            player.franchises.length > 1 && (
                              <div
                                style={{
                                  color: MUTED,
                                  marginTop: "3px",
                                  fontSize: "10px",
                                  fontWeight: "700",
                                  letterSpacing: "0.5px",
                                }}
                              >
                                PRIMARY
                              </div>
                            )}
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
                            fontWeight: "700",
                          }}
                        >
                          {formatPoints(franchise.points)}
                        </div>

                        <div
                          style={{
                            color: MUTED,
                            marginTop: "3px",
                            fontSize: "11px",
                          }}
                        >
                          {franchise.gamesStarted} starts
                        </div>
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

  const [
    historicalData,
    playerDirectory,
    nflState,
  ] = await Promise.all([
    getHistoricalData(),
    getAllSlootPlayerDirectory(),
    getNFLState(),
  ]);

  // A season's All-Sloot honours are only
  // available after fantasy Week 17 is complete.
  //
  // This uses Sleeper's existing week-completion
  // logic rather than the calendar year.
  const completedSeasonIds = new Set(
    historicalData
      .filter((season) =>
        isNFLWeekComplete(
          season.league.season,
          17,
          nflState
        )
      )
      .map((season) => season.league.season)
  );

  // Only calculate publicly available
  // annual selections for completed seasons.
  // This also keeps unfinished seasons out
  // of the career honours calculations.
  const seasons = historicalData
    .filter((season) =>
      completedSeasonIds.has(
        season.league.season
      )
    )
    .map((season) =>
      calculateAllSloot(season, playerDirectory)
    )
    .sort(
      (a, b) =>
        Number(b.season) - Number(a.season)
    );

  // Keep all seasons in the navigation,
  // including seasons whose teams are locked.
  const availableSeasonIds = historicalData
    .map((season) => season.league.season)
    .sort(
      (a, b) => Number(b) - Number(a)
    );

  const careers =
    calculateAllSlootCareers(seasons);

  const selectedSeasonId =
    availableSeasonIds.includes(
      params.season ?? ""
    )
      ? (params.season as string)
      : availableSeasonIds[0] ?? "";

  const selectedSeason =
    seasons.find(
      (season) =>
        season.season === selectedSeasonId
    );

  const isSeasonUnlocked =
    completedSeasonIds.has(
      selectedSeasonId
    );

  const selectedTeam = TEAM_OPTIONS.some(
    (option) => option.id === params.team
  )
    ? params.team
    : "first";

  const view =
    params.view === "career"
      ? "career"
      : "annual";

  const selections =
    selectedTeam === "second"
      ? selectedSeason?.secondTeam ?? []
      : selectedTeam === "rookie"
        ? selectedSeason?.rookieTeam ?? []
        : selectedSeason?.firstTeam ?? [];

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
          href={`/all-sloot?view=annual&season=${selectedSeasonId}&team=${selectedTeam}`}
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
            {availableSeasonIds.map((season) => (
              <NavLink
                key={season}
                href={`/all-sloot?view=annual&season=${season}&team=${selectedTeam}`}
                active={
                  selectedSeasonId === season
                }
              >
                {season}
              </NavLink>
            ))}
          </div>

          {!isSeasonUnlocked ? (
            <div
              style={{
                padding: "28px 20px",
                border: BORDER,
                borderRadius: "14px",
                textAlign: "center",
                marginBottom: "24px",
              }}
            >
              <div
                style={{
                  fontSize: "34px",
                  marginBottom: "14px",
                }}
              >
                🏆
              </div>

              <h2
                style={{
                  marginTop: 0,
                  marginBottom: "12px",
                  fontSize: "21px",
                }}
              >
                {selectedSeasonId} All-Sloot Honours
              </h2>

              <p
                style={{
                  color: MUTED,
                  fontSize: "14px",
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                The {selectedSeasonId} All-Sloot
                Teams will be revealed following
                the conclusion of the SFL fantasy
                season.
              </p>

              <p
                style={{
                  color: MUTED,
                  fontSize: "12px",
                  lineHeight: 1.6,
                  marginTop: "14px",
                  marginBottom: 0,
                }}
              >
                First Team, Second Team and Rookie
                Team selections will become
                available automatically once
                Week 17 is complete.
              </p>
            </div>
          ) : (
            <>
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
                  Rookie eligibility is estimated
                  from Sleeper experience data and
                  should be independently verified.
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
                    href={`/all-sloot?view=annual&season=${selectedSeasonId}&team=${option.id}`}
                    active={
                      selectedTeam === option.id
                    }
                  >
                    {option.label}
                  </NavLink>
                ))}
              </div>

              <h2
                style={{
                  marginBottom: "16px",
                }}
              >
                {selectedSeasonId}{" "}
                {
                  TEAM_OPTIONS.find(
                    (option) =>
                      option.id === selectedTeam
                  )?.label
                }
              </h2>

              <TeamTable selections={selections} />
            </>
          )}
        </>
      ) : (
        <CareerHonours careers={careers} />
      )}
    </main>
  );
}
