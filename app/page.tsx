
import Link from "next/link";
import { getHistoricalData } from "../lib/sleeper";
import {
  calculateHomeStats,
  type HomeGame,
  type HomeStanding,
} from "../lib/homeStats";
import { FRANCHISES } from "../lib/franchises";

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

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div
      style={{
        background: CARD,
        border: BORDER,
        borderRadius: 14,
        padding: 15,
        minWidth: 0,
      }}
    >
      <div
        style={{
          color: MUTED,
          fontSize: 11,
          lineHeight: 1.4,
        }}
      >
        {label}
      </div>

      <div
        style={{
          color: "#ffffff",
          fontSize: 25,
          fontWeight: 900,
          marginTop: 9,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>

      {detail && (
        <div
          style={{
            color: MUTED,
            fontSize: 11,
            lineHeight: 1.5,
            marginTop: 7,
          }}
        >
          {detail}
        </div>
      )}
    </div>
  );
}

function GameSummary({
  game,
}: {
  game: HomeGame;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 9,
      }}
    >
      <div
        style={{
          color: MUTED,
          fontSize: 11,
          fontWeight: 700,
        }}
      >
        WEEK {game.week}
      </div>

      {[
        {
          id: game.rosterA,
          score: game.scoreA,
        },
        {
          id: game.rosterB,
          score: game.scoreB,
        },
      ].map((team) => (
        <div
          key={team.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
          }}
        >
          <TeamLogo
            rosterId={team.id}
            size={28}
          />

          <span
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: 12,
              fontWeight:
                game.winnerId === team.id
                  ? 800
                  : 500,
              lineHeight: 1.4,
            }}
          >
            {teamName(team.id)}
          </span>

          <strong
            style={{
              fontSize: 13,
              whiteSpace: "nowrap",
              fontVariantNumeric:
                "tabular-nums",
            }}
          >
            {formatPoints(team.score)}
          </strong>
        </div>
      ))}
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
              background: team.inPlayoffPosition
                ? "#202d2b"
                : "transparent",
              textDecoration: "none",
              color: "#ffffff",
            }}
          >
            <span
              style={{
                color: team.inPlayoffPosition
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
  const historicalData =
    await getHistoricalData();

  const home = calculateHomeStats(
    historicalData,
    "2026"
  );

  const stats = home.seasonStats;
  const record = home.recordWatch[0];

  return (
    <main
      style={{
        paddingBottom: 40,
        color: "#f4f5f7",
      }}
    >
      {/* Hero */}

      <header
        style={{
          padding: "26px 0 12px",
        }}
      >
        <p
          style={{
            color: GOLD,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 1.5,
            margin: "0 0 10px",
          }}
        >
          SLOOTBOWL VAULT
        </p>

        <h1
          style={{
            fontSize: "clamp(29px, 7vw, 42px)",
            fontWeight: 900,
            letterSpacing: -1.2,
            lineHeight: 1.1,
            margin: 0,
          }}
        >
          2026 Season Tracker
        </h1>

        <p
          style={{
            color: MUTED,
            fontSize: 13,
            lineHeight: 1.7,
            marginTop: 13,
          }}
        >
          The season as it happens.
          The history as it&apos;s made.
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
            marginTop: 9,
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

          {stats.latestCompletedWeek > 0
            ? `Results through Week ${stats.latestCompletedWeek}`
            : "Awaiting completed games"}
        </div>
      </header>

      {/* Season statistics */}

      <section style={{ marginTop: 28 }}>
        <SectionHeading
          eyebrow="THE SEASON SO FAR"
          title="2026 at a Glance"
          description="Statistics from completed regular-season matchups."
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(2, minmax(0, 1fr))",
            gap: 10,
          }}
        >
          <StatCard
            label="Games completed"
            value={String(stats.gamesPlayed)}
            detail={`${stats.completedWeeks} weeks represented`}
          />

          <StatCard
            label="Highest team score"
            value={
              stats.highestTeamScore
                ? formatPoints(
                    stats.highestTeamScore.points
                  )
                : "—"
            }
            detail={
              stats.highestTeamScore
                ? `${teamName(
                    stats.highestTeamScore.rosterId
                  )} · Week ${
                    stats.highestTeamScore.week
                  }`
                : "No completed games"
            }
          />

          <StatCard
            label="Closest finish"
            value={
              stats.closestGame
                ? formatPoints(
                    stats.closestGame.margin
                  )
                : "—"
            }
            detail={
              stats.closestGame
                ? `Week ${stats.closestGame.week} · Winning margin`
                : "No completed games"
            }
          />

          <StatCard
            label="Biggest demolition"
            value={
              stats.biggestBlowout
                ? formatPoints(
                    stats.biggestBlowout.margin
                  )
                : "—"
            }
            detail={
              stats.biggestBlowout
                ? `Week ${stats.biggestBlowout.week} · Winning margin`
                : "No completed games"
            }
          />
        </div>

        {stats.highestScoringGame && (
          <div
            style={{
              background: CARD,
              border: BORDER,
              borderRadius: 14,
              padding: 16,
              marginTop: 10,
            }}
          >
            <div
              style={{
                color: GOLD,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 0.7,
                marginBottom: 12,
              }}
            >
              🔥 HIGHEST-SCORING MATCHUP
            </div>

            <GameSummary
              game={stats.highestScoringGame}
            />

            <div
              style={{
                borderTop: BORDER,
                paddingTop: 12,
                marginTop: 14,
                color: MUTED,
                fontSize: 12,
              }}
            >
              Combined score:{" "}
              <strong
                style={{ color: "#ffffff" }}
              >
                {formatPoints(
                  stats.highestScoringGame
                    .combinedScore
                )}
              </strong>
            </div>
          </div>
        )}
      </section>

      {/* MVP Ladder preview */}

      <section style={{ marginTop: 36 }}>
        <SectionHeading
          eyebrow="2026 SFL AWARDS"
          title="🏆 MVP Ladder"
          description="Ten contenders. One MVP. Rankings shaped by individual production and the playoff race."
        />

        <div
          style={{
            background: CARD,
            border: "1px solid #665221",
            borderRadius: 16,
            padding: 20,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 37,
              marginBottom: 10,
            }}
          >
            🏆
          </div>

          <div
            style={{
              color: "#ffffff",
              fontSize: 17,
              fontWeight: 800,
            }}
          >
            The MVP Race Is Coming
          </div>

          <p
            style={{
              color: MUTED,
              fontSize: 12,
              lineHeight: 1.8,
              margin: "10px 0 0",
            }}
          >
            Our top-10 MVP Ladder will
            feature a frontrunner,
            two leading challengers
            and the chasing pack.
            Weekly movement will be
            tracked without revealing
            fantasy points or ratings.
          </p>
        </div>
      </section>

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
                  rosterId={
                    record.challengerRosterId
                  }
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
                    ? teamName(
                        record.challengerRosterId
                      )
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
                  {formatPoints(
                    record.projectedTotal
                  )}
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
            Record Watch will appear
            once completed 2026 results
            are available.
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
          Green-highlighted teams currently
          occupy playoff positions.
          Standings remain provisional
          until the regular season ends.
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
        & Statistical Archive
      </footer>
    </main>
  );
}
