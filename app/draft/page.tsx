
import Link from "next/link";

import {
  getLeague,
  getHistoricalData,
  getNFLState,
  getRosters,
  getTradedPicks,
  type SleeperBracketMatch,
} from "../../lib/sleeper";

import {
  calculateHomeStats,
} from "../../lib/homeStats";

import {
  buildDraftTracker,
  DRAFT_ROUNDS,
  type DraftPick,
  type DraftTeam,
} from "../../lib/draftTracker";

import {
  FRANCHISES,
  getFranchiseName,
} from "../../lib/franchises";

export const dynamic = "force-dynamic";

const GOLD = "#eab308";
const MUTED = "#9da7b3";
const CARD = "#151b23";
const BORDER = "#27303b";
const GREEN = "#4ade80";

type PageProps = {
  searchParams: Promise<{
    round?: string | string[];
  }>;
};

const franchiseMap = new Map(
  FRANCHISES.map((franchise) => [
    franchise.rosterId,
    franchise,
  ])
);

function formatMaxPF(
  value: number | null
): string {
  if (value === null) {
    return "—";
  }

  return value.toLocaleString(
    "en-AU",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );
}

function formatRecord(
  team: DraftTeam
): string {
  const base =
    `${team.wins}-${team.losses}`;

  return team.ties
    ? `${base}-${team.ties}`
    : base;
}

function shortTeamName(
  rosterId: number
): string {
  switch (rosterId) {
    case 1:
      return "Mt Isa";
    case 2:
      return "Cambridge";
    case 3:
      return "Grimsby";
    case 4:
      return "Isle of Wight";
    case 5:
      return "Grays Town";
    case 6:
      return "Lincoln";
    case 7:
      return "Kalamata";
    case 8:
      return "Weybiza";
    case 9:
      return "East Rutherford";
    case 10:
      return "Chad";
    default:
      return getFranchiseName(
        rosterId
      );
  }
}

function TeamLogo({
  rosterId,
  size = 32,
}: {
  rosterId: number;
  size?: number;
}) {
  const franchise =
    franchiseMap.get(rosterId);

  if (!franchise) {
    return null;
  }

  return (
    <img
      src={franchise.logo}
      alt={franchise.name}
      title={franchise.name}
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        flexShrink: 0,
      }}
    />
  );
}

function TradeArrow() {
  return (
    <span
      aria-label="Traded to"
      title="Traded to"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 20,
        height: 20,
        borderRadius: "50%",
        background: "#225c35",
        color: GREEN,
        fontSize: 15,
        fontWeight: 900,
        flexShrink: 0,
      }}
    >
      →
    </span>
  );
}

function RoundTabs({
  selectedRound,
}: {
  selectedRound: number;
}) {
  return (
    <nav
      aria-label="Draft round"
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(5, minmax(0, 1fr))",
        gap: 5,
        marginBottom: 14,
      }}
    >
      {Array.from(
        {
          length: DRAFT_ROUNDS,
        },
        (_, index) => index + 1
      ).map((round) => {
        const active =
          round === selectedRound;

        return (
          <Link
            key={round}
            href={`/draft?round=${round}`}
            aria-current={
              active
                ? "page"
                : undefined
            }
            style={{
              textDecoration: "none",
              textAlign: "center",
              padding: "11px 4px",
              borderRadius: 7,
              border: active
                ? `1px solid ${GOLD}`
                : `1px solid ${BORDER}`,
              background: active
                ? GOLD
                : "#1c2530",
              color: active
                ? "#111827"
                : "#cbd5e1",
              fontWeight: 900,
              fontSize: 12,
            }}
          >
            ROUND {round}
          </Link>
        );
      })}
    </nav>
  );
}

function DraftRow({
  pick,
  team,
}: {
  pick: DraftPick;
  team: DraftTeam;
}) {
  const originalFranchise =
    franchiseMap.get(
      pick.originalRosterId
    );

  const accent =
    originalFranchise
      ?.primaryColour ??
    "#64748b";

  return (
    <tr
      style={{
        background: CARD,
        borderBottom:
          `1px solid ${BORDER}`,
      }}
    >
      <td
        style={{
          padding: "12px 8px",
          width: 46,
          textAlign: "center",
          color: GOLD,
          fontWeight: 900,
          fontSize: 17,
          fontVariantNumeric:
            "tabular-nums",
          borderLeft:
            `3px solid ${accent}`,
        }}
      >
        {pick.overallPick}
      </td>

      <td
        style={{
          padding: "8px 6px",
          minWidth: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            minWidth: 0,
          }}
        >
          <TeamLogo
            rosterId={
              pick.originalRosterId
            }
            size={33}
          />

          <span
            style={{
              color: pick.traded
                ? "#cbd5e1"
                : "#f4f5f7",
              fontWeight: 700,
              fontSize: 13,
              whiteSpace: "nowrap",
            }}
          >
            {shortTeamName(
              pick.originalRosterId
            )}
          </span>

          {pick.traded && (
            <>
              <TradeArrow />

              <TeamLogo
                rosterId={
                  pick.ownerRosterId
                }
                size={30}
              />
            </>
          )}
        </div>
      </td>

      <td
        style={{
          padding: "10px 9px",
          textAlign: "center",
          color: "#cbd5e1",
          fontSize: 12,
          fontWeight: 600,
          whiteSpace: "nowrap",
          fontVariantNumeric:
            "tabular-nums",
        }}
      >
        {formatRecord(team)}
      </td>

      <td
        style={{
          padding: "10px 11px",
          textAlign: "right",
          color: "#f4f5f7",
          fontSize: 12,
          fontWeight: 800,
          whiteSpace: "nowrap",
          fontVariantNumeric:
            "tabular-nums",
        }}
      >
        {formatMaxPF(
          team.maxPF
        )}
      </td>
    </tr>
  );
}

function DraftBoard({
  picks,
  teams,
}: {
  picks: DraftPick[];
  teams: DraftTeam[];
}) {
  const teamMap = new Map(
    teams.map((team) => [
      team.rosterId,
      team,
    ])
  );

  return (
    <div
      style={{
        border:
          `1px solid ${BORDER}`,
        borderRadius: 10,
        overflow: "hidden",
        background: CARD,
      }}
    >
      <div
        style={{
          overflowX: "auto",
          WebkitOverflowScrolling:
            "touch",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse:
              "collapse",
            minWidth: 420,
          }}
        >
          <thead>
            <tr
              style={{
                background: "#1c2530",
              }}
            >
              <th
                style={{
                  padding:
                    "12px 8px",
                  textAlign:
                    "center",
                  color: MUTED,
                  fontSize: 10,
                  letterSpacing: 0.8,
                  width: 46,
                }}
              >
                PICK
              </th>

              <th
                style={{
                  padding:
                    "12px 6px",
                  textAlign:
                    "left",
                  color: MUTED,
                  fontSize: 10,
                  letterSpacing: 0.8,
                }}
              >
                TEAM
              </th>

              <th
                style={{
                  padding:
                    "12px 9px",
                  textAlign:
                    "center",
                  color: MUTED,
                  fontSize: 10,
                  letterSpacing: 0.8,
                }}
              >
                REC
              </th>

              <th
                style={{
                  padding:
                    "12px 11px",
                  textAlign:
                    "right",
                  color: MUTED,
                  fontSize: 10,
                  letterSpacing: 0.8,
                }}
              >
                MAX PF
              </th>
            </tr>
          </thead>

          <tbody>
            {picks.map((pick) => {
              const team =
                teamMap.get(
                  pick.originalRosterId
                );

              if (!team) {
                return null;
              }

              return (
                <DraftRow
                  key={
                    pick.overallPick
                  }
                  pick={pick}
                  team={team}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

async function getWinnersBracket(
  leagueId: string
): Promise<SleeperBracketMatch[]> {
  const response = await fetch(
    `https://api.sleeper.app/v1/league/${leagueId}/winners_bracket`,
    {
      next: {
        revalidate: 300,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      "Unable to load Sleeper winners bracket."
    );
  }

  return response.json();
}

export default async function DraftPage({
  searchParams,
}: PageProps) {
  const params =
    await searchParams;

  const roundValue =
    Array.isArray(params.round)
      ? params.round[0]
      : params.round;

  const requestedRound =
    Number(roundValue ?? 1);

  const selectedRound =
    Number.isInteger(
      requestedRound
    ) &&
    requestedRound >= 1 &&
    requestedRound <= DRAFT_ROUNDS
      ? requestedRound
      : 1;

  const league =
    await getLeague();

  const [
    historicalData,
    nflState,
    rosters,
    tradedPicks,
    winnersBracket,
  ] = await Promise.all([
    getHistoricalData(),
    getNFLState(),
    getRosters(
      league.league_id
    ),
    getTradedPicks(
      league.league_id
    ),
    getWinnersBracket(
      league.league_id
    ),
  ]);

  const home =
    calculateHomeStats(
      historicalData,
      league.season
    );

  const tracker =
    buildDraftTracker({
      season:
        league.season,
      standings:
        home.standings,
      rosters,
      tradedPicks,
      winnersBracket,
      nflState,
    });

  const roundPicks =
    tracker.picks.filter(
      (pick) =>
        pick.round ===
        selectedRound
    );

  return (
    <main
      style={{
        color: "#f4f5f7",
        paddingBottom: 36,
      }}
    >
      <header
        style={{
          marginBottom: 20,
        }}
      >
        <p
          style={{
            color: GOLD,
            fontSize: 10,
            fontWeight: 900,
            letterSpacing: 1.5,
            margin: "0 0 8px",
          }}
        >
          SFL DRAFT CENTRAL
        </p>

        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize:
                "clamp(28px, 7vw, 38px)",
              fontWeight: 900,
              letterSpacing: -0.8,
            }}
          >
            {tracker.draftSeason}
            {" "}Draft
          </h1>

          <span
            style={{
              color:
                tracker.status ===
                "official"
                  ? GREEN
                  : GOLD,
              background: "#1c2530",
              border:
                `1px solid ${BORDER}`,
              borderRadius: 99,
              padding: "7px 10px",
              fontSize: 10,
              fontWeight: 900,
              whiteSpace: "nowrap",
            }}
          >
            {tracker.status ===
            "official"
              ? "OFFICIAL"
              : "PROJECTED"}
          </span>
        </div>
      </header>

      <RoundTabs
        selectedRound={
          selectedRound
        }
      />

      <DraftBoard
        picks={roundPicks}
        teams={tracker.teams}
      />

      <p
        style={{
          color: MUTED,
          fontSize: 11,
          lineHeight: 1.7,
          margin: "13px 2px 0",
        }}
      >
        Draft order follows conference
        finishing positions and Max PF.
        A green arrow indicates a
        traded pick, with the receiving
        franchise logo shown after it.
      </p>

      {tracker.warnings.length >
        0 && (
        <details
          style={{
            marginTop: 20,
            border:
              `1px solid ${BORDER}`,
            borderRadius: 9,
            background: CARD,
            padding: "12px 14px",
          }}
        >
          <summary
            style={{
              cursor: "pointer",
              color: MUTED,
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            Draft tracker notes
          </summary>

          <div
            style={{
              marginTop: 12,
            }}
          >
            {tracker.warnings.map(
              (
                warning,
                index
              ) => (
                <p
                  key={index}
                  style={{
                    color: MUTED,
                    fontSize: 11,
                    lineHeight: 1.7,
                    margin:
                      index === 0
                        ? 0
                        : "8px 0 0",
                  }}
                >
                  {warning}
                </p>
              )
            )}
          </div>
        </details>
      )}
    </main>
  );
}
