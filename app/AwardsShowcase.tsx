
import Link from "next/link";
import type { SeasonPlayerAwards } from "../lib/playerAwards";

type PlayerInfo = {
  name: string;
  position: string;
};

type Props = {
  season: string;
  revealed: boolean;
  awards?: SeasonPlayerAwards;
  playerInfo: Record<string, PlayerInfo>;
  preview?: boolean;
};

const GOLD = "#eab308";
const MUTED = "#9da7b3";
const CARD = "#151b23";
const BORDER = "1px solid #27303b";

type AwardKey = "mvp" | "opoy" | "roy" | "sbMvp";

const AWARD_TYPES: {
  key: AwardKey;
  title: string;
  abbreviation: string;
  description: string;
}[] = [
  {
    key: "mvp",
    title: "Most Valuable Player",
    abbreviation: "MVP",
    description: "The SFL's outstanding regular-season player.",
  },
  {
    key: "opoy",
    title: "Offensive Player of the Year",
    abbreviation: "OPOY",
    description: "Recognising exceptional offensive production.",
  },
  {
    key: "roy",
    title: "Rookie of the Year",
    abbreviation: "ROY",
    description: "Celebrating the season's leading rookie.",
  },
  {
    key: "sbMvp",
    title: "Slootbowl MVP",
    abbreviation: "SB MVP",
    description: "The standout performer in the championship game.",
  },
];

// Fictional names used only for preview.
// These are not real award results.
const DEMO_WINNERS: Record<
  AwardKey,
  {
    name: string;
    position: string;
  }
> = {
  mvp: {
    name: "Alex Morgan",
    position: "QB",
  },
  opoy: {
    name: "Jordan Ellis",
    position: "WR",
  },
  roy: {
    name: "Taylor Brooks",
    position: "RB",
  },
  sbMvp: {
    name: "Casey Parker",
    position: "TE",
  },
};

function PlayerPortrait({
  playerId,
  name,
}: {
  playerId?: string;
  name: string;
}) {
  return (
    <div
      style={{
        width: 65,
        height: 65,
        flexShrink: 0,
        borderRadius: "50%",
        background: "#273445",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {playerId ? (
        <img
          src={`https://sleepercdn.com/content/nfl/players/${playerId}.jpg`}
          alt={name}
          width={65}
          height={65}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      ) : (
        <span
          style={{
            color: "#cbd5e1",
            fontSize: 27,
            fontWeight: 900,
          }}
        >
          ?
        </span>
      )}
    </div>
  );
}

export default function AwardsShowcase({
  season,
  revealed,
  awards,
  playerInfo,
  preview = false,
}: Props) {
  return (
    <section style={{ marginTop: 36 }}>
      <div style={{ marginBottom: 16 }}>
        <p
          style={{
            color: GOLD,
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: 1.2,
            margin: "0 0 7px",
          }}
        >
          {season} SFL AWARDS
        </p>

        <h2
          style={{
            fontSize: 23,
            margin: 0,
            lineHeight: 1.25,
          }}
        >
          {revealed
            ? "🏆 SFL Award Winners"
            : "🏆 SFL Awards Night"}
        </h2>

        <p
          style={{
            color: MUTED,
            fontSize: 12,
            lineHeight: 1.7,
            margin: "9px 0 0",
          }}
        >
          {revealed
            ? `Celebrating the outstanding performers of the ${season} SFL season.`
            : "The regular season is over. The awards are waiting to be revealed."}
        </p>
      </div>

      {preview && (
        <div
          style={{
            background: "#263243",
            border: "1px solid #475569",
            borderRadius: 11,
            padding: "11px 13px",
            color: "#cbd5e1",
            fontSize: 11,
            fontWeight: 700,
            lineHeight: 1.6,
            marginBottom: 15,
          }}
        >
          PREVIEW MODE — This is a demonstration
          of the future awards display.
          {revealed
            ? " All names shown are fictional placeholders."
            : " No winners or finalists are being revealed."}
        </div>
      )}

      {!revealed ? (
        <div
          style={{
            background:
              "linear-gradient(135deg, #302718 0%, #1b2533 55%, #151b23 100%)",
            border: "1px solid #866b29",
            borderRadius: 17,
            padding: "30px 20px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 48,
              marginBottom: 14,
            }}
          >
            🏆
          </div>

          <p
            style={{
              color: GOLD,
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: 2,
              margin: "0 0 12px",
            }}
          >
            THE AWARDS ARE COMING
          </p>

          <h3
            style={{
              color: "#ffffff",
              fontSize: 24,
              fontWeight: 900,
              lineHeight: 1.25,
              margin: "0 0 12px",
            }}
          >
            The winners are under wraps.
          </h3>

          <p
            style={{
              color: MUTED,
              fontSize: 13,
              lineHeight: 1.8,
              maxWidth: 400,
              margin: "0 auto 22px",
            }}
          >
            The race is over, but the honours
            are still to be awarded. The SFL&apos;s
            finest performers will be
            recognised after Week 17.
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 8,
              marginBottom: 24,
            }}
          >
            {AWARD_TYPES.map((award) => (
              <span
                key={award.key}
                style={{
                  color: "#e5e7eb",
                  background: "#27303b",
                  border: BORDER,
                  borderRadius: 99,
                  padding: "8px 11px",
                  fontSize: 10,
                  fontWeight: 800,
                }}
              >
                {award.abbreviation}
              </span>
            ))}
          </div>

          <div
            style={{
              borderTop: "1px solid #4c432f",
              paddingTop: 19,
              color: GOLD,
              fontSize: 12,
              fontWeight: 800,
              lineHeight: 1.7,
            }}
          >
            WINNERS REVEALED AFTER WEEK 17
          </div>
        </div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
              gap: 11,
            }}
          >
            {AWARD_TYPES.map((award) => {
              const winner =
                !preview
                  ? awards?.[award.key]
                  : undefined;

              const demo =
                preview
                  ? DEMO_WINNERS[award.key]
                  : null;

              const name = demo
                ? demo.name
                : winner
                  ? playerInfo[winner.playerId]?.name ??
                    `Player ${winner.playerId}`
                  : null;

              const position = demo
                ? demo.position
                : winner
                  ? playerInfo[winner.playerId]?.position ??
                    "—"
                  : null;

              return (
                <article
                  key={award.key}
                  style={{
                    background: CARD,
                    border: BORDER,
                    borderRadius: 15,
                    padding: 17,
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      color: GOLD,
                      fontSize: 10,
                      fontWeight: 900,
                      letterSpacing: 1.1,
                      marginBottom: 8,
                    }}
                  >
                    {award.abbreviation}
                  </div>

                  <h3
                    style={{
                      color: "#ffffff",
                      fontSize: 16,
                      fontWeight: 900,
                      lineHeight: 1.35,
                      margin: "0 0 7px",
                    }}
                  >
                    {award.title}
                  </h3>

                  <p
                    style={{
                      color: MUTED,
                      fontSize: 11,
                      lineHeight: 1.6,
                      margin: "0 0 16px",
                    }}
                  >
                    {award.description}
                  </p>

                  {name ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        paddingTop: 14,
                        borderTop: BORDER,
                      }}
                    >
                      <PlayerPortrait
                        playerId={
                          preview
                            ? undefined
                            : winner?.playerId
                        }
                        name={name}
                      />

                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            color: GOLD,
                            fontSize: 10,
                            fontWeight: 900,
                            marginBottom: 5,
                          }}
                        >
                          {preview
                            ? "DEMO WINNER"
                            : "AWARD WINNER"}
                        </div>

                        <div
                          style={{
                            color: "#ffffff",
                            fontSize: 15,
                            fontWeight: 900,
                            lineHeight: 1.35,
                          }}
                        >
                          {name}
                        </div>

                        <div
                          style={{
                            color: MUTED,
                            fontSize: 11,
                            marginTop: 5,
                          }}
                        >
                          {position}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        color: MUTED,
                        fontSize: 12,
                        lineHeight: 1.6,
                        paddingTop: 14,
                        borderTop: BORDER,
                      }}
                    >
                      Winner unavailable
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          {preview ? (
            <div
              style={{
                marginTop: 14,
                padding: 15,
                textAlign: "center",
                background: "#253240",
                border: BORDER,
                borderRadius: 12,
                color: MUTED,
                fontSize: 12,
                lineHeight: 1.7,
              }}
            >
              Demo only. The real award winners
              and archive links will become
              available after Week 17.
            </div>
          ) : (
            <Link
              href={`/history/${season}`}
              style={{
                display: "block",
                marginTop: 14,
                padding: 15,
                textAlign: "center",
                background: "#302718",
                border: "1px solid #866b29",
                borderRadius: 12,
                color: GOLD,
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 900,
              }}
            >
              Explore the {season} Season Awards →
            </Link>
          )}
        </>
      )}
    </section>
  );
}
