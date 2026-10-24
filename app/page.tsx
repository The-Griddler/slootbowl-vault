
import Link from "next/link";
import {
  getHistoricalData,
  getMVPTransactions,
  getNFLState,
  isNFLWeekComplete,
} from "../lib/sleeper";
import {
  getPlayers,
  getPlayerName,
} from "../lib/players";
import {
  calculateHomeStats,
  RECORD_WATCH_LIMIT,
  type HomeStanding,
  type RecordHighlight,
} from "../lib/homeStats";
import {
  calculateWeeklyRecaps,
} from "../lib/weeklyRecap";
import {
  calculateMVPLeaderboard,
  MVP_CUTOFF_TIMESTAMP,
  type MVPPlayerTeams,
} from "../lib/mvp";
import {
  calculateSeasonPlayerAwards,
} from "../lib/playerAwards";
import { FRANCHISES } from "../lib/franchises";
import WeeklyRecapSection from "./weeklyRecap";
import MVPLadder from "./MVPLadder";
import AwardsShowcase from "./AwardsShowcase";

export const dynamic = "force-dynamic";

const SEASON = "2026";
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

function teamName(rosterId: number): string {
  return NAMES.get(rosterId) ?? `Team ${rosterId}`;
}

function formatPoints(value: number): string {
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

type RecordPlayerInfo = Record<
  string,
  {
    name: string;
    position: string;
  }
>;

function recordAccent(
  record: RecordHighlight
): string {
  if (record.tone === "negative") {
    return "#f87171";
  }

  if (record.tone === "unusual") {
    return "#60a5fa";
  }

  return GOLD;
}

function recordSubjectName(
  record: RecordHighlight,
  playerInfo: RecordPlayerInfo
): string {
  if (record.subject === "player") {
    return record.playerId
      ? playerInfo[record.playerId]?.name ??
          `Player ${record.playerId}`
      : "Unknown player";
  }

  return record.rosterId !== null
    ? teamName(record.rosterId)
    : "Unknown franchise";
}

function recordValueText(
  record: RecordHighlight
): string {
  if (record.unit === "wins") {
    return `${Math.round(record.value)} wins`;
  }

  return `${formatPoints(record.value)} pts`;
}

function recordScope(
  record: RecordHighlight
): "SFL" | "OBFC" | "GPFC" | "FRANCHISE" {
  const label = record.label.toUpperCase();

  if (label.includes("FRANCHISE")) {
    return "FRANCHISE";
  }

  if (label.includes("OBFC")) {
    return "OBFC";
  }

  if (label.includes("GPFC")) {
    return "GPFC";
  }

  return "SFL";
}

function recordScopeText(
  record: RecordHighlight
): string {
  const scope = recordScope(record);

  if (record.kind === "season") {
    if (scope === "FRANCHISE") {
      return "FRANCHISE RECORD CHASE";
    }

    return `${scope} RECORD CHASE`;
  }

  if (scope === "FRANCHISE") {
    return "FRANCHISE HISTORY";
  }

  return `${scope} HISTORY`;
}

function RecordIdentity({
  record,
  playerInfo,
  large = false,
}: {
  record: RecordHighlight;
  playerInfo: RecordPlayerInfo;
  large?: boolean;
}) {
  const name = recordSubjectName(
    record,
    playerInfo
  );

  const position =
    record.playerId !== null
      ? playerInfo[record.playerId]?.position
      : null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: large ? 12 : 9,
        minWidth: 0,
      }}
    >
      {record.rosterId !== null && (
        <TeamLogo
          rosterId={record.rosterId}
          size={large ? 44 : 31}
        />
      )}

      <div style={{ minWidth: 0 }}>
        <div
          style={{
            color: "#ffffff",
            fontSize: large ? 15 : 12,
            fontWeight: 800,
            lineHeight: 1.4,
          }}
        >
          {name}
        </div>

        <div
          style={{
            color: MUTED,
            fontSize: 10,
            lineHeight: 1.6,
            marginTop: 3,
          }}
        >
          {record.subject === "player"
            ? [
                position,
                record.rosterId !== null
                  ? teamName(record.rosterId)
                  : null,
              ]
                .filter(Boolean)
                .join(" · ")
            : record.kind === "game"
              ? `Week ${record.week}, ${record.season}`
              : `${record.season} regular season`}
        </div>
      </div>
    </div>
  );
}

function AchievementSummary({
  record,
  accent,
}: {
  record: RecordHighlight;
  accent: string;
}) {
  const achievements = record.detail
    .split(" · ")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (achievements.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        marginTop: 13,
        paddingTop: 12,
        borderTop: "1px solid #34404d",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 8,
        }}
      >
        <span
          style={{
            color: accent,
            fontSize: 15,
            flexShrink: 0,
            lineHeight: 1.5,
          }}
        >
          ★
        </span>

        <div
          style={{
            display: "grid",
            gap: 5,
            minWidth: 0,
          }}
        >
          {achievements.map(
            (achievement, index) => (
              <p
                key={`${index}-${achievement}`}
                style={{
                  color:
                    index === 0
                      ? "#f4f5f7"
                      : MUTED,
                  fontSize: index === 0
                    ? 12
                    : 11,
                  fontWeight:
                    index === 0
                      ? 800
                      : 500,
                  lineHeight: 1.6,
                  margin: 0,
                  overflowWrap: "anywhere",
                }}
              >
                {achievement}
              </p>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function RecordCard({
  record,
  playerInfo,
  featured = false,
  index,
}: {
  record: RecordHighlight;
  playerInfo: RecordPlayerInfo;
  featured?: boolean;
  index: number;
}) {
  const accent = recordAccent(record);
  const isSeason = record.kind === "season";
  const isPlayer = record.subject === "player";

  const projectionLabel = isPlayer
    ? "Projected player season total"
    : "Projected 14-week total";

  return (
    <article
      style={{
        background: featured
          ? "#19232e"
          : CARD,
        border: featured
          ? "1px solid #394653"
          : BORDER,
        borderRadius: 15,
        padding: featured ? 18 : 14,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          marginBottom: 12,
        }}
      >
        <span
          style={{
            color: accent,
            fontSize: 10,
            fontWeight: 900,
            letterSpacing: 1,
            lineHeight: 1.5,
          }}
        >
          {recordScopeText(record)}
        </span>

        <span
          style={{
            color: MUTED,
            fontSize: 10,
            fontWeight: 800,
            whiteSpace: "nowrap",
          }}
        >
          #{index + 1}
        </span>
      </div>

      <div
        style={{
          color: MUTED,
          fontSize: 10,
          fontWeight: 700,
          lineHeight: 1.5,
          marginBottom: 7,
        }}
      >
        {isSeason
          ? record.tone === "negative"
            ? "Unwanted season record pace"
            : "Season record pace"
          : record.tone === "negative"
            ? "Historic scoring low"
            : record.tone === "unusual"
              ? "Unusual historical performance"
              : record.allTimeRank === 1
                ? "Record-book performance"
                : "Historic performance"}
      </div>

      <h3
        style={{
          color: "#ffffff",
          fontSize: featured ? 20 : 15,
          lineHeight: 1.35,
          fontWeight: 900,
          margin: "0 0 14px",
        }}
      >
        {record.headline}
      </h3>

      <RecordIdentity
        record={record}
        playerInfo={playerInfo}
        large={featured}
      />

      <div
        style={{
          marginTop: 14,
          paddingTop: 13,
          borderTop: "1px solid #34404d",
        }}
      >
        <div
          style={{
            color: accent,
            fontSize: featured ? 29 : 23,
            fontWeight: 900,
            letterSpacing: -0.6,
            lineHeight: 1.2,
          }}
        >
          {recordValueText(record)}
        </div>

        <div
          style={{
            color: MUTED,
            fontSize: 10,
            lineHeight: 1.6,
            marginTop: 5,
          }}
        >
          {isSeason
            ? isPlayer
              ? "Points from SFL starts this season"
              : "Current franchise season total"
            : isPlayer
              ? `Week ${record.week} starter score`
              : `Week ${record.week} franchise performance`}
        </div>
      </div>

      {isSeason &&
        record.projectedValue !== null && (
          <div
            style={{
              background: "#253240",
              borderRadius: 9,
              padding: 11,
              marginTop: 12,
            }}
          >
            <div
              style={{
                color: accent,
                fontSize: 10,
                fontWeight: 800,
              }}
            >
              {projectionLabel}
            </div>

            <div
              style={{
                color: "#ffffff",
                fontSize: featured ? 20 : 17,
                fontWeight: 900,
                marginTop: 5,
              }}
            >
              {record.unit === "wins"
                ? record.projectedValue.toFixed(1)
                : formatPoints(
                    record.projectedValue
                  )}
              {record.unit === "wins"
                ? " wins"
                : " pts"}
            </div>

            {record.historicalRecord !== null && (
              <div
                style={{
                  color: MUTED,
                  fontSize: 10,
                  lineHeight: 1.6,
                  marginTop: 7,
                }}
              >
                Record to beat:{" "}
                {record.unit === "wins"
                  ? record.historicalRecord.toFixed(0)
                  : formatPoints(
                      record.historicalRecord
                    )}
                {record.unit === "wins"
                  ? " wins"
                  : " pts"}
                {record.historicalSeason
                  ? ` (${record.historicalSeason})`
                  : ""}
              </div>
            )}
          </div>
        )}

      <AchievementSummary
        record={record}
        accent={accent}
      />
    </article>
  );
}

function RecordWatchSection({
  highlights,
  playerInfo,
  week,
}: {
  highlights: RecordHighlight[];
  playerInfo: RecordPlayerInfo;
  week: number;
}) {
  const visible = highlights.slice(
    0,
    RECORD_WATCH_LIMIT
  );

  const featured = visible[0] ?? null;
  const supporting = visible.slice(1);

  return (
    <section style={{ marginTop: 36 }}>
      <SectionHeading
        eyebrow="THE RECORD BOOK"
        title="SFL Record Watch"
        description="Historic performances and season-record chases across the SFL, OBFC, GPFC and individual franchises."
      />

      {week > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <span
            style={{
              display: "inline-flex",
              color: "#cbd5e1",
              background: "#1d2938",
              border: BORDER,
              borderRadius: 99,
              padding: "7px 11px",
              fontSize: 10,
              fontWeight: 800,
            }}
          >
            WEEK {week}
          </span>
        </div>
      )}

      {featured ? (
        <div
          style={{
            display: "grid",
            gap: 11,
          }}
        >
          <RecordCard
            record={featured}
            playerInfo={playerInfo}
            featured
            index={0}
          />

          {supporting.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
                gap: 11,
                alignItems: "stretch",
              }}
            >
              {supporting.map(
                (record, index) => (
                  <RecordCard
                    key={record.id}
                    record={record}
                    playerInfo={playerInfo}
                    index={index + 1}
                  />
                )
              )}
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
          No historically significant
          performances or serious record
          chases have qualified this week.
          Record Watch will update as
          completed results come in.
        </div>
      )}

      <p
        style={{
          color: MUTED,
          fontSize: 10,
          lineHeight: 1.7,
          marginTop: 12,
        }}
      >
        Awards are ranked by the record
        engine&apos;s editorial priority,
        not by raw fantasy points.
        Only regular-season results and
        started QB, RB, WR and TE
        performances count. Season
        projections are estimates.
      </p>
    </section>
  );
}

export default async function HomePage() {
  const [
    historicalData,
    players,
    transactions,
    nflState,
  ] = await Promise.all([
    getHistoricalData(),
    getPlayers(),
    getMVPTransactions(),
    getNFLState(),
  ]);

  const home = calculateHomeStats(
    historicalData,
    SEASON,
    players
  );

  const weeklyRecaps =
    calculateWeeklyRecaps(
      historicalData,
      SEASON
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
      SEASON,
      14,
      playerTeams,
      transactions,
      MVP_CUTOFF_TIMESTAMP
    );

  // The ladder stays visible until
  // NFL Week 14 has finished.
  const regularSeasonFinished =
    isNFLWeekComplete(
      SEASON,
      14,
      nflState
    );

  // Annual award winners are not
  // revealed until Week 17 ends.
  const week17Finished =
    isNFLWeekComplete(
      SEASON,
      17,
      nflState
    );

  const seasonData =
    historicalData.find(
      (item) =>
        item.league.season === SEASON
    );

  // Calculate official winners only
  // after the Week 17 reveal.
  const officialAwards =
    week17Finished && seasonData
      ? calculateSeasonPlayerAwards(
          seasonData,
          historicalData,
          players
        )
      : undefined;

  // If historical results have not
  // fully populated, keep the teaser
  // visible rather than showing
  // incomplete awards.
  const awardsRevealed =
    week17Finished &&
    officialAwards?.regularSeasonComplete === true &&
    officialAwards.mvp !== undefined &&
    officialAwards.opoy !== undefined &&
    officialAwards.roy !== undefined &&
    officialAwards.sbMvp !== undefined;

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
    homepagePlayerIds.add(
      candidate.playerId
    );
  }

  for (const record of home.recordHighlights) {
    if (record.playerId !== null) {
      homepagePlayerIds.add(
        record.playerId
      );
    }
  }

  if (awardsRevealed && officialAwards) {
    for (const award of [
      officialAwards.mvp,
      officialAwards.opoy,
      officialAwards.roy,
      officialAwards.sbMvp,
    ]) {
      if (award) {
        homepagePlayerIds.add(
          award.playerId
        );
      }
    }
  }

  const playerInfo: RecordPlayerInfo = {};

  for (const playerId of homepagePlayerIds) {
    const player =
      players[playerId] ?? null;

    playerInfo[playerId] = {
      name: getPlayerName(player),
      position:
        player?.position ?? "—",
    };
  }

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

      {/* Seasonal Awards */}

      {!regularSeasonFinished ? (
        <MVPLadder
          leaderboard={mvpLeaderboard}
          playerInfo={playerInfo}
        />
      ) : (
        <AwardsShowcase
          season={SEASON}
          revealed={awardsRevealed}
          awards={
            awardsRevealed
              ? officialAwards
              : undefined
          }
          playerInfo={playerInfo}
        />
      )}

      {/* SFL Record Watch */}

      <RecordWatchSection
        highlights={home.recordHighlights}
        playerInfo={playerInfo}
        week={
          home.seasonStats.latestCompletedWeek
        }
      />

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
