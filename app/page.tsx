
import Link from "next/link";
import {
  getHistoricalData,
  getMVPTransactions,
} from "../lib/sleeper";
import {
  getPlayers,
  getPlayerName,
} from "../lib/players";
import {
  calculateHomeStats,
  type HomeStanding,
} from "../lib/homeStats";
import {
  calculateWeeklyRecaps,
} from "../lib/weeklyRecap";
import {
  calculateMVPLeaderboard,
  MVP_CUTOFF_TIMESTAMP,
  type MVPPlayerTeams,
} from "../lib/mvp";
import { FRANCHISES } from "../lib/franchises";
import WeeklyRecapSection from "./weeklyRecap";
import MVPLadder from "./MVPLadder";

const GOLD = "#eab308";
const MUTED = "#9da7b3";
const CARD = "#151b23";
const BORDER = "1px solid #27303b";

const LOGOS: Record<number, string> = {
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

const NAMES = new Map(
  FRANCHISES.map((team) => [
    team.rosterId,
    team.name,
  ])
);

function teamName(rosterId: number) {
  return NAMES.get(rosterId) ?? `Team ${rosterId}`;
}

function formatPoints(value: number) {
  return value.toFixed(2);
}

function TeamLogo({
  rosterId,
  size = 34,
}: {
  rosterId: number;
  size?: number;
}) {
  const logo = LOGOS[rosterId];

  if (!logo) return null;

  return (
    <img
      src={logo}
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

function ConferenceTable({
  title,
  standings,
  accent,
}: {
  title: string;
  standings: HomeStanding[];
  accent: string;
}) {
  return (
    <div
      style={{
        background: CARD,
        border: BORDER,
        borderRadius: 15,
        padding: 14,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        <h3
          style={{
            color: accent,
            fontSize: 17,
            margin: 0,
          }}
        >
          {title}
        </h3>

        <span
          style={{
            color: MUTED,
            fontSize: 10,
          }}
        >
          W–L–T · PF
        </span>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 5,
        }}
      >
        {standings.map((team) => (
          <Link
            key={team.rosterId}
            href={`/teams/${team.rosterId}`}
            style={{
              display: "grid",
              gridTemplateColumns:
                "15px 28px minmax(0, 1fr) auto",
              gap: 7,
              alignItems: "center",
              padding: "9px 6px",
              borderRadius: 9,
              background:
                team.inPlayoffPosition
                  ? "#202d2b"
                  : "transparent",
              textDecoration: "none",
              color: "#ffffff",
            }}
          >
            <span
              style={{
                color:
                  team.inPlayoffPosition
                    ? "#86efac"
                    : MUTED,
                fontSize: 11,
                fontWeight: 800,
              }}
            >
              {team.rank}
            </span>

            <TeamLogo
              rosterId={team.rosterId}
              size={28}
            />

            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                lineHeight: 1.35,
                minWidth: 0,
              }}
            >
              {teamName(team.rosterId)}
            </span>

            <div
              style={{
                textAlign: "right",
                whiteSpace: "nowrap",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                {team.wins}-{team.losses}
                {team.ties > 0
                  ? `-${team.ties}`
                  : ""}
              </div>

              <div
                style={{
                  color: MUTED,
                  fontSize: 10,
                  marginTop: 3,
                }}
              >
                {formatPoints(team.pointsFor)} PF
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default async function HomePage() {
  const [
    historicalData,
    players,
    transactions,
  ] = await Promise.all([
    getHistoricalData(),
    getPlayers(),
    getMVPTransactions(),
  ]);

  const home = calculateHomeStats(
    historicalData,
    "2026"
  );

  const weeklyRecaps =
    calculateWeeklyRecaps(
      historicalData,
      "2026"
    );

  const playerTeams: MVPPlayerTeams = {};

  for (const [
    playerId,
    player,
  ] of Object.entries(players)) {
    playerTeams[playerId] =
      player.team ?? null;
  }

  const mvpLeaderboard =
    calculateMVPLeaderboard(
      historicalData,
      "2026",
      14,
      playerTeams,
      transactions,
      MVP_CUTOFF_TIMESTAMP
    );

  const homepagePlayerIds =
    new Set<string>();

  for (const recap of weeklyRecaps.recaps) {
    if (recap.obfcPlayerOfTheWeek) {
      homepagePlayerIds.add(
        recap.obfcPlayerOfTheWeek.playerId
      );
    }

    if (recap.gpfcPlayerOfTheWeek) {
      homepagePlayerIds.add(
        recap.gpfcPlayerOfTheWeek.playerId
      );
    }
  }

  for (const candidate of mvpLeaderboard.topTen) {
    homepagePlayerIds.add(candidate.playerId);
  }

  const playerInfo: Record<
    string,
    {
      name: string;
      position: string;
    }
  > = {};

  for (const playerId of homepagePlayerIds) {
    const player = players[playerId] ?? null;

    playerInfo[playerId] = {
      name: getPlayerName(player),
      position: player?.position ?? "—",
    };
  }

  const record = home.recordWatch[0];

  return (
    <main
      style={{
        paddingBottom: 40,
        color: "#f4f5f7",
      }}
    >
      {/* Hero: aligned with Franchises and History */}

      <header
        style={{
          padding: "0 0 12px",
        }}
      >
        <p
          style={{
            color: "#737f91",
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: 2,
            margin: "0 0 12px",
          }}
        >
          SFL • 2026 SEASON
        </p>

        <h1
          style={{
            fontSize: "clamp(36px, 9vw, 52px)",
            fontWeight: 900,
            letterSpacing: -1.2,
            lineHeight: 1.1,
            margin: 0,
          }}
        >
          League Central
        </h1>

        <p
          style={{
            color: MUTED,
            fontSize: 15,
            lineHeight: 1.7,
            margin: "14px 0 0",
          }}
        >
          Your home for the latest SFL action,
          standings and standout performances.
        </p>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            background: "#1d2938",
            border: BORDER,
            borderRadius: 99,
            padding: "8px 12px",
            color: "#cbd5e1",
            fontSize: 11,
            marginTop: 14,
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              background: "#86efac",
              borderRadius: "50%",
            }}
          />

          {home.seasonStats.latestCompletedWeek > 0
            ? `Results through Week ${home.seasonStats.latestCompletedWeek}`
            : "Awaiting completed games"}
        </div>
      </header>

      {/* Weekly Recap */}

      <WeeklyRecapSection
        data={weeklyRecaps}
        playerInfo={playerInfo}
      />

      {/* MVP Ladder */}

      <MVPLadder
        leaderboard={mvpLeaderboard}
        playerInfo={playerInfo}
      />

      {/* Record Watch */}

      <section style={{ marginTop: 36 }}>
        <SectionHeading
          eyebrow="THE RECORD BOOK"
          title="SFL Record Watch"
          description="Tracking how the current season compares with the greatest in league history."
        />

        {record ? (
          <div
            style={{
              background: CARD,
              border: BORDER,
              borderRadius: 15,
              padding: 17,
            }}
          >
            <div
              style={{
                color: GOLD,
                fontSize: 11,
                fontWeight: 800,
                marginBottom: 10,
              }}
            >
              SINGLE-SEASON TEAM SCORING
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                marginBottom: 16,
              }}
            >
              {record.challengerRosterId !== null && (
                <TeamLogo
                  rosterId={record.challengerRosterId}
                  size={48}
                />
              )}

              <div>
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: 15,
                  }}
                >
                  {record.challengerRosterId !== null
                    ? teamName(record.challengerRosterId)
                    : "No challenger"}
                </div>

                <div
                  style={{
                    color: MUTED,
                    fontSize: 11,
                    marginTop: 5,
                  }}
                >
                  Leading 2026 challenger
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                fontSize: 12,
                marginBottom: 10,
              }}
            >
              <span>
                {formatPoints(record.challenger)}
              </span>

              <span
                style={{
                  color: GOLD,
                  fontWeight: 800,
                }}
              >
                {formatPoints(record.record)}
              </span>
            </div>

            <div
              style={{
                background: "#303a46",
                borderRadius: 99,
                height: 10,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  background: GOLD,
                  width: `${record.progressPercentage}%`,
                  height: "100%",
                  borderRadius: 99,
                }}
              />
            </div>

            <div
              style={{
                color: MUTED,
                fontSize: 11,
                lineHeight: 1.7,
                marginTop: 12,
              }}
            >
              Historical record:{" "}
              {record.recordRosterId !== null
                ? teamName(record.recordRosterId)
                : "Unknown franchise"}{" "}
              ({record.recordSeason})
            </div>

            {record.projectedTotal !== null && (
              <div
                style={{
                  background: "#202b38",
                  padding: 12,
                  borderRadius: 10,
                  marginTop: 13,
                  fontSize: 12,
                  lineHeight: 1.6,
                }}
              >
                <strong
                  style={{
                    color: record.onRecordPace
                      ? "#86efac"
                      : "#ffffff",
                  }}
                >
                  {record.onRecordPace
                    ? "🔥 On record pace"
                    : "Season projection"}
                </strong>

                <div
                  style={{
                    color: MUTED,
                    marginTop: 5,
                  }}
                >
                  Projected 14-week total:{" "}
                  {formatPoints(record.projectedTotal)}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              background: CARD,
              border: BORDER,
              borderRadius: 14,
              padding: 20,
              color: MUTED,
              fontSize: 13,
              lineHeight: 1.7,
            }}
          >
            Record Watch will appear once completed
            2026 results are available.
          </div>
        )}
      </section>

      {/* Conference standings */}

      <section style={{ marginTop: 36 }}>
        <SectionHeading
          eyebrow="THE PLAYOFF PICTURE"
          title="Conference Standings"
          description="Top three franchises in each conference currently occupy playoff positions. Ranked by record, then Points For."
        />

        <div
          style={{
            display: "grid",
            gap: 12,
          }}
        >
          <ConferenceTable
            title="OBFC"
            standings={home.conferences.OBFC}
            accent="#299DB9"
          />

          <ConferenceTable
            title="GPFC"
            standings={home.conferences.GPFC}
            accent="#C83E2F"
          />
        </div>

        <p
          style={{
            color: MUTED,
            fontSize: 11,
            lineHeight: 1.7,
            marginTop: 12,
          }}
        >
          Green-highlighted teams currently occupy
          playoff positions. Standings remain
          provisional until the regular season ends.
        </p>
      </section>

      {/* Archive highlights */}

      <section style={{ marginTop: 36 }}>
        <SectionHeading
          eyebrow="THE VAULT"
          title="2026 Archive Highlights"
          description="The standout games and moments already entering SFL history."
        />

        <div
          style={{
            display: "grid",
            gap: 10,
          }}
        >
          {[
            {
              title: "Greatest Games",
              description:
                "See how 2026 matchups rank against SFL history.",
              href: "/greatest-games",
              icon: "🏆",
            },
            {
              title: "Matchup Archive",
              description:
                "Revisit completed fixtures and starting lineups.",
              href: "/matchups",
              icon: "🏈",
            },
            {
              title: "SFL Records",
              description:
                "Explore the league's all-time statistical records.",
              href: "/records",
              icon: "📊",
            },
          ].map((item) => (
            <Link
              key={item.title}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: CARD,
                border: BORDER,
                borderRadius: 13,
                padding: 15,
                textDecoration: "none",
                color: "#ffffff",
              }}
            >
              <span
                style={{
                  fontSize: 24,
                  flexShrink: 0,
                }}
              >
                {item.icon}
              </span>

              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                  }}
                >
                  {item.title}
                </div>

                <div
                  style={{
                    color: MUTED,
                    fontSize: 11,
                    lineHeight: 1.6,
                    marginTop: 5,
                  }}
                >
                  {item.description}
                </div>
              </div>

              <span
                style={{
                  color: GOLD,
                  fontSize: 23,
                }}
              >
                ›
              </span>
            </Link>
          ))}
        </div>
      </section>

      <footer
        style={{
          color: "#687384",
          fontSize: 11,
          textAlign: "center",
          lineHeight: 1.7,
          marginTop: 38,
        }}
      >
        Slootbowl Vault · SFL Historical
        &amp; Statistical Archive
      </footer>
    </main>
  );
}
