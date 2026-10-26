
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
  type DraftStage,
  type DraftTeam,
  type DraftPick,
} from "../../lib/draftTracker";

import {
  FRANCHISES,
  getFranchiseName,
} from "../../lib/franchises";

export const dynamic = "force-dynamic";

const GOLD = "#eab308";
const MUTED = "#9da7b3";
const CARD = "#151b23";
const BORDER = "1px solid #27303b";

type PageProps = {
  searchParams: Promise<{
    round?: string | string[];
  }>;
};

const FRANCHISE_MAP = new Map(
  FRANCHISES.map((franchise) => [
    franchise.rosterId,
    franchise,
  ])
);

function formatPF(
  value: number | null
): string {
  return value === null
    ? "—"
    : value.toLocaleString("en-AU", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
}

function stageLabel(
  stage: DraftStage
): string {
  switch (stage) {
    case "missed_playoffs":
      return "Miss playoffs";
    case "week_15":
      return "Wildcard exit";
    case "week_16":
      return "Conference exit";
    case "runner_up":
      return "Slootbowl runner-up";
    case "champion":
      return "Slootbowl champion";
  }
}

function stageColour(
  stage: DraftStage
): string {
  switch (stage) {
    case "missed_playoffs":
      return "#f87171";
    case "week_15":
      return "#fb923c";
    case "week_16":
      return "#60a5fa";
    case "runner_up":
      return "#cbd5e1";
    case "champion":
      return GOLD;
  }
}

function TeamLogo({
  rosterId,
  size = 38,
}: {
  rosterId: number;
  size?: number;
}) {
  const franchise =
    FRANCHISE_MAP.get(rosterId);

  if (!franchise) return null;

  return (
    <img
      src={franchise.logo}
      alt=""
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

function TeamIdentity({
  rosterId,
  subtitle,
  size = 38,
}: {
  rosterId: number;
  subtitle?: string;
  size?: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        minWidth: 0,
      }}
    >
      <TeamLogo
        rosterId={rosterId}
        size={size}
      />

      <div style={{ minWidth: 0 }}>
        <div
          style={{
            color: "#f4f5f7",
            fontSize: 12,
            fontWeight: 800,
            lineHeight: 1.4,
            overflowWrap: "anywhere",
          }}
        >
          {getFranchiseName(rosterId)}
        </div>

        {subtitle && (
          <div
            style={{
              color: MUTED,
              fontSize: 10,
              marginTop: 4,
              lineHeight: 1.5,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <p
        style={{
          color: GOLD,
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: 1.3,
          margin: "0 0 7px",
        }}
      >
        {eyebrow}
      </p>

      <h2
        style={{
          fontSize: 23,
          fontWeight: 900,
          margin: 0,
          lineHeight: 1.25,
        }}
      >
        {title}
      </h2>

      {description && (
        <p
          style={{
            color: MUTED,
            fontSize: 12,
            lineHeight: 1.7,
            margin: "9px 0 0",
          }}
        >
          {description}
        </p>
      )}
    </div>
  );
}

function DraftOrderRow({
  team,
}: {
  team: DraftTeam;
}) {
  const accent =
    stageColour(team.stage);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "34px minmax(0, 1fr) auto",
        alignItems: "center",
        gap: 10,
        padding: "14px 12px",
        borderBottom: BORDER,
      }}
    >
      <div
        style={{
          color:
            team.draftPosition <= 4
              ? GOLD
              : "#f4f5f7",
          fontSize: 23,
          fontWeight: 900,
          textAlign: "center",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {team.draftPosition}
      </div>

      <div style={{ minWidth: 0 }}>
        <TeamIdentity
          rosterId={team.rosterId}
          subtitle={
            `${team.conference} #${team.conferenceRank}` +
            ` · ${team.wins}-${team.losses}` +
            (team.ties
              ? `-${team.ties}`
              : "")
          }
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 6,
            marginTop: 9,
            marginLeft: 48,
          }}
        >
          <span
            style={{
              color: accent,
              fontSize: 10,
              fontWeight: 800,
            }}
          >
            {stageLabel(team.stage)}
          </span>

          {team.confirmed && (
            <span
              style={{
                color: "#86efac",
                fontSize: 9,
                fontWeight: 800,
              }}
            >
              · CONFIRMED
            </span>
          )}
        </div>
      </div>

      <div
        style={{
          textAlign: "right",
          whiteSpace: "nowrap",
        }}
      >
        <div
          style={{
            color: "#ffffff",
            fontSize: 14,
            fontWeight: 900,
            fontVariantNumeric:
              "tabular-nums",
          }}
        >
          {formatPF(team.maxPF)}
        </div>

        <div
          style={{
            color: MUTED,
            fontSize: 10,
            marginTop: 5,
          }}
        >
          MAX PF
        </div>
      </div>
    </div>
  );
}

function DraftOrder({
  teams,
}: {
  teams: DraftTeam[];
}) {
  return (
    <section style={{ marginTop: 32 }}>
      <SectionHeading
        eyebrow="THE TANK RACE"
        title="Projected Draft Order"
        description="Draft positions based on current conference standings, Max PF and completed playoff results."
      />

      <div
        style={{
          background: CARD,
          border: BORDER,
          borderRadius: 15,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            gap: 10,
            background: "#1c2530",
            padding: "12px 14px",
          }}
        >
          <span
            style={{
              color: MUTED,
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: 1,
            }}
          >
            DRAFT POSITION
          </span>

          <span
            style={{
              color: MUTED,
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: 1,
            }}
          >
            POTENTIAL POINTS
          </span>
        </div>

        {teams.map((team) => (
          <DraftOrderRow
            key={team.rosterId}
            team={team}
          />
        ))}
      </div>
    </section>
  );
}

function PickCard({
  pick,
}: {
  pick: DraftPick;
}) {
  const owner =
    FRANCHISE_MAP.get(
      pick.ownerRosterId
    );

  return (
    <article
      style={{
        background: CARD,
        border: pick.traded
          ? "1px solid #7b6327"
          : BORDER,
        borderRadius: 13,
        padding: 14,
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          gap: 10,
          marginBottom: 13,
        }}
      >
        <div>
          <span
            style={{
              color: GOLD,
              fontSize: 20,
              fontWeight: 900,
            }}
          >
            #{pick.overallPick}
          </span>

          <span
            style={{
              color: MUTED,
              fontSize: 10,
              marginLeft: 9,
            }}
          >
            ROUND {pick.round}
            {" · "}
            PICK {pick.pickInRound}
          </span>
        </div>

        {pick.traded && (
          <span
            style={{
              color: "#facc15",
              background: "#30291a",
              borderRadius: 99,
              padding: "5px 8px",
              fontSize: 9,
              fontWeight: 900,
              whiteSpace: "nowrap",
            }}
          >
            TRADED
          </span>
        )}
      </div>

      <TeamIdentity
        rosterId={pick.ownerRosterId}
        subtitle="Current pick owner"
        size={42}
      />

      {pick.traded && (
        <div
          style={{
            borderTop: BORDER,
            marginTop: 13,
            paddingTop: 11,
          }}
        >
          <div
            style={{
              color: MUTED,
              fontSize: 10,
              marginBottom: 7,
            }}
          >
            Originally owned by
          </div>

          <TeamIdentity
            rosterId={
              pick.originalRosterId
            }
            size={25}
          />
        </div>
      )}

      {!pick.traded && (
        <div
          style={{
            color: MUTED,
            fontSize: 10,
            marginTop: 12,
          }}
        >
          Original selection
        </div>
      )}

      <div
        style={{
          height: 3,
          borderRadius: 99,
          background:
            owner?.primaryColour ??
            "#64748b",
          marginTop: 13,
        }}
      />
    </article>
  );
}

function RoundSelector({
  selected,
}: {
  selected: number;
}) {
  return (
    <nav
      aria-label="Draft round"
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(5, minmax(0, 1fr))",
        gap: 6,
        marginBottom: 16,
      }}
    >
      {Array.from(
        { length: DRAFT_ROUNDS },
        (_, index) => index + 1
      ).map((round) => (
        <Link
          key={round}
          href={`/draft?round=${round}#round-picks`}
          aria-current={
            selected === round
              ? "page"
              : undefined
          }
          style={{
            textAlign: "center",
            padding: "12px 5px",
            borderRadius: 9,
            background:
              selected === round
                ? GOLD
                : "#1d2938",
            color:
              selected === round
                ? "#10151c"
                : "#cbd5e1",
            border:
              selected === round
                ? "1px solid #eab308"
                : BORDER,
            textDecoration: "none",
            fontSize: 12,
            fontWeight: 900,
          }}
        >
          R{round}
        </Link>
      ))}
    </nav>
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

  const rawRound =
    Array.isArray(params.round)
      ? params.round[0]
      : params.round;

  const parsedRound =
    Number(rawRound ?? 1);

  const selectedRound =
    Number.isInteger(parsedRound) &&
    parsedRound >= 1 &&
    parsedRound <= DRAFT_ROUNDS
      ? parsedRound
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
    getRosters(league.league_id),
    getTradedPicks(league.league_id),
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
      season: league.season,
      standings: home.standings,
      rosters,
      tradedPicks,
      winnersBracket,
      nflState,
    });

  const roundPicks =
    tracker.picks.filter(
      (pick) =>
        pick.round === selectedRound
    );

  const tradedCount =
    tracker.picks.filter(
      (pick) => pick.traded
    ).length;

  return (
    <main
      style={{
        color: "#f4f5f7",
        paddingBottom: 40,
      }}
    >
      <header>
        <p
          style={{
            color: GOLD,
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: 2,
            margin: "0 0 12px",
          }}
        >
          SFL · DRAFT CENTRAL
        </p>

        <h1
          style={{
            fontSize:
              "clamp(34px, 9vw, 50px)",
            fontWeight: 900,
            letterSpacing: -1.2,
            lineHeight: 1.1,
            margin: 0,
          }}
        >
          {tracker.draftSeason}
          {" "}Draft
        </h1>

        <p
          style={{
            color: MUTED,
            fontSize: 14,
            lineHeight: 1.7,
            margin: "14px 0 0",
          }}
        >
          The road to the next SFL
          championship starts here.
          Follow the live draft order,
          the tank race and every
          traded selection.
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginTop: 16,
          }}
        >
          <span
            style={{
              color:
                tracker.status ===
                "official"
                  ? "#86efac"
                  : GOLD,
              background: "#1d2938",
              border: BORDER,
              borderRadius: 99,
              padding: "8px 12px",
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: 0.5,
            }}
          >
            {tracker.status ===
            "official"
              ? "● OFFICIAL ORDER"
              : "● LIVE PROJECTION"}
          </span>

          <span
            style={{
              color: "#cbd5e1",
              background: "#1d2938",
              border: BORDER,
              borderRadius: 99,
              padding: "8px 12px",
              fontSize: 10,
              fontWeight: 800,
            }}
          >
            {tracker.picks.length}
            {" "}TOTAL PICKS
          </span>

          <span
            style={{
              color: "#cbd5e1",
              background: "#1d2938",
              border: BORDER,
              borderRadius: 99,
              padding: "8px 12px",
              fontSize: 10,
              fontWeight: 800,
            }}
          >
            {tradedCount}
            {" "}TRADED PICKS
          </span>
        </div>
      </header>

      <DraftOrder
        teams={tracker.teams}
      />

      <section
        id="round-picks"
        style={{
          marginTop: 36,
          scrollMarginTop: 20,
        }}
      >
        <SectionHeading
          eyebrow="ON THE CLOCK"
          title="Draft Pick Ownership"
          description="Select a round to see who currently owns each selection. Traded picks retain their original franchise's draft position."
        />

        <RoundSelector
          selected={selectedRound}
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
            gap: 10,
          }}
        >
          {roundPicks.map((pick) => (
            <PickCard
              key={pick.overallPick}
              pick={pick}
            />
          ))}
        </div>
      </section>

      <section
        style={{
          marginTop: 36,
        }}
      >
        <SectionHeading
          eyebrow="THE RULEBOOK"
          title="How the Order Works"
        />

        <div
          style={{
            background: CARD,
            border: BORDER,
            borderRadius: 15,
            padding: 16,
            display: "grid",
            gap: 13,
          }}
        >
          {[
            {
              range: "01–04",
              title: "Missed playoffs",
              detail:
                "The four non-playoff teams, ordered by lowest regular-season Max PF.",
            },
            {
              range: "05–06",
              title: "Wildcard exits",
              detail:
                "The two Week 15 losers, ordered by lowest regular-season Max PF.",
            },
            {
              range: "07–08",
              title: "Conference exits",
              detail:
                "The two Week 16 losers, ordered by lowest regular-season Max PF.",
            },
            {
              range: "09",
              title: "Slootbowl runner-up",
              detail:
                "The losing Slootbowl finalist.",
            },
            {
              range: "10",
              title: "Slootbowl champion",
              detail:
                "The SFL champion selects last in each round.",
            },
          ].map((rule) => (
            <div
              key={rule.range}
              style={{
                display: "grid",
                gridTemplateColumns:
                  "52px minmax(0, 1fr)",
                gap: 12,
                alignItems: "start",
              }}
            >
              <span
                style={{
                  color: GOLD,
                  fontSize: 16,
                  fontWeight: 900,
                  fontVariantNumeric:
                    "tabular-nums",
                }}
              >
                {rule.range}
              </span>

              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 900,
                  }}
                >
                  {rule.title}
                </div>

                <p
                  style={{
                    color: MUTED,
                    fontSize: 11,
                    lineHeight: 1.7,
                    margin: "4px 0 0",
                  }}
                >
                  {rule.detail}
                </p>
              </div>
            </div>
          ))}
        </div>

        <p
          style={{
            color: MUTED,
            fontSize: 11,
            lineHeight: 1.7,
            marginTop: 13,
          }}
        >
          Before playoff results are
          confirmed, conference ranks
          determine projected finishing
          positions. Higher Max PF
          projects the Slootbowl
          champion. Regular-season
          Max PF should be frozen
          after Week 14; this data
          source is still being
          verified for postseason use.
        </p>
      </section>

      {tracker.warnings.length > 0 && (
        <section
          style={{
            marginTop: 28,
            background: "#1c2530",
            border: BORDER,
            borderRadius: 13,
            padding: 15,
          }}
        >
          <div
            style={{
              color: GOLD,
              fontSize: 11,
              fontWeight: 900,
              marginBottom: 9,
            }}
          >
            DRAFT TRACKER STATUS
          </div>

          {tracker.warnings.map(
            (warning, index) => (
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
        </section>
      )}

      <footer
        style={{
          color: "#687384",
          fontSize: 11,
          textAlign: "center",
          lineHeight: 1.7,
          marginTop: 38,
        }}
      >
        Slootbowl Vault · SFL Draft
        Central
      </footer>
    </main>
  );
}
