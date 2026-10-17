
import { getHistoricalData } from "../../lib/sleeper";
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

  const [historicalData, playerDirectory] =
    await Promise.all([
      getHistoricalData(),
      getAllSlootPlayerDirectory(),
    ]);

  const seasons = historicalData
    .map((season) =>
      calculateAllSloot(season, playerDirectory)
    )
    .sort(
      (a, b) =>
        Number(b.season) - Number(a.season)
    );

  const currentYear = new Date().getUTCFullYear();

  // Only completed seasons count towards
  // official career honours.
  const completedSeasons = seasons.filter(
    (season) =>
      Number(season.season) < currentYear
  );

  const careers =
    calculateAllSlootCareers(completedSeasons);

  const selectedSeason =
    seasons.find(
      (season) =>
        season.season === params.season
    ) ?? seasons[0];

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

  const isCurrentSeason =
    Number(selectedSeason?.season) ===
    currentYear;

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
                  selectedSeason?.season ===
                  season.season
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
              Current season: selections are
              provisional until the regular
              season finishes.
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
                href={`/all-sloot?view=annual&season=${
                  selectedSeason?.season ?? ""
                }&team=${option.id}`}
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
            {selectedSeason?.season}{" "}
            {
              TEAM_OPTIONS.find(
                (option) =>
                  option.id === selectedTeam
              )?.label
            }
          </h2>

          <TeamTable selections={selections} />
        </>
      ) : (
        <CareerHonours careers={careers} />
      )}
    </main>
  );
}
