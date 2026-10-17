
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

type Champion = {
  season: string;
  champion: number;
  runnerUp: number;
};

type ConferenceChampion = {
  season: string;
  obfc: number;
  gpfc: number;
};

type MVPRecord = {
  season: string;
  playerName: string;
  franchiseName: string;
  points: number;
};

export type PlayerAwardRecord = {
  season: string;
  awardId: string;
  playerName: string;
  franchiseName: string;
  points: number;
};

export type GMAwardRecord = {
  season: string;
  awardId: string;
  winnerName: string;
  franchiseName: string;
  detail?: string;
};

type HistoryTabsProps = {
  seasons: string[];
  champions: Champion[];
  conferenceChampions: ConferenceChampion[];
  mvpRecords: MVPRecord[];
  franchiseNames: Record<number, string>;
  gmAwards?: GMAwardRecord[];
  playerAwards?: PlayerAwardRecord[];
};

// ============================================
// FRANCHISE LOGOS
// ============================================

const FRANCHISE_LOGOS: Record<number, string> = {
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

const GM_AWARDS = [
  {
    id: "gm",
    icon: "🏆",
    title: "GM of the Year",
  },
  {
    id: "improved",
    icon: "📈",
    title: "Most Improved GM",
  },
  {
    id: "lubed",
    icon: "💀",
    title: "The Lubed Up, Dicked Down Award",
  },
  {
    id: "wonder",
    icon: "⚡",
    title: "One Week Wonder of the Year",
  },
  {
    id: "shitcunt",
    icon: "🚽",
    title: "Shitcunt of the Year",
  },
];

const PLAYER_AWARDS = [
  {
    id: "mvp",
    icon: "👑",
    title: "SFL MVP",
  },
  {
    id: "opoy",
    icon: "⭐",
    title: "SFL OPOY",
  },
  {
    id: "roy",
    icon: "🏅",
    title: "SFL ROY",
  },
  {
    id: "sbmvp",
    icon: "🏆",
    title: "Slootbowl MVP",
  },
];

function cardStyle(): React.CSSProperties {
  return {
    background: "#151b23",
    border: "1px solid #27303b",
    borderRadius: "20px",
    padding: "18px",
  };
}

function labelStyle(): React.CSSProperties {
  return {
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "1.5px",
    color: "#687384",
    margin: 0,
  };
}

// ============================================
// LOGO COMPONENT
// ============================================

function FranchiseLogo({
  rosterId,
  size = 38,
}: {
  rosterId: number | undefined;
  size?: number;
}) {
  if (
    rosterId === undefined ||
    !FRANCHISE_LOGOS[rosterId]
  ) {
    return null;
  }

  return (
    <span
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Image
        src={FRANCHISE_LOGOS[rosterId]}
        alt=""
        width={size}
        height={size}
        style={{
          width: size,
          height: size,
          objectFit: "contain",
        }}
      />
    </span>
  );
}

// ============================================
// HISTORY TABS
// ============================================

export default function HistoryTabs({
  seasons,
  champions,
  conferenceChampions,
  mvpRecords,
  franchiseNames,
  gmAwards = [],
  playerAwards = [],
}: HistoryTabsProps) {
  const [activeTab, setActiveTab] = useState<
    "champions" | "gm" | "players"
  >("champions");

  const [expandedAward, setExpandedAward] =
    useState<string | null>(null);

  const getFranchise = (rosterId: number) =>
    franchiseNames[rosterId] ??
    `Franchise ${rosterId}`;

  const getRosterId = (franchiseName: string) => {
    const entry = Object.entries(
      franchiseNames
    ).find(
      ([, name]) =>
        name === franchiseName
    );

    return entry
      ? Number(entry[0])
      : undefined;
  };

  const toggleAward = (awardId: string) => {
    setExpandedAward((previous) =>
      previous === awardId ? null : awardId
    );
  };

  const awardRow = (
    award: {
      id: string;
      icon: string;
      title: string;
    },
    type: "gm" | "players"
  ) => {
    const awardKey = `${type}-${award.id}`;
    const isExpanded = expandedAward === awardKey;

    return (
      <div
        key={award.id}
        style={{
          ...cardStyle(),
          padding: 0,
          marginBottom: "10px",
          overflow: "hidden",
        }}
      >
        <button
          type="button"
          onClick={() => toggleAward(awardKey)}
          aria-expanded={isExpanded}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            width: "100%",
            padding: "16px",
            background: "transparent",
            color: "inherit",
            border: "none",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <span style={{ fontSize: "23px" }}>
            {award.icon}
          </span>

          <span style={{ flex: 1 }}>
            <strong
              style={{
                display: "block",
                fontSize: "14px",
              }}
            >
              {award.title}
            </strong>
          </span>

          <span style={{ color: "#9da7b3" }}>
            {isExpanded ? "⌃" : "⌄"}
          </span>
        </button>

        {isExpanded && (
          <div
            style={{
              padding: "0 16px 16px",
              borderTop: "1px solid #27303b",
            }}
          >
            {seasons.map((season, index) => {
              const gmWinner =
                type === "gm"
                  ? gmAwards.find(
                      (item) =>
                        item.season === season &&
                        item.awardId === award.id
                    )
                  : undefined;

              const playerWinner =
                type === "players"
                  ? playerAwards.find(
                      (item) =>
                        item.season === season &&
                        item.awardId === award.id
                    )
                  : undefined;

              const legacyMvp =
                type === "players" &&
                award.id === "mvp" &&
                !playerWinner
                  ? mvpRecords.find(
                      (item) =>
                        item.season === season
                    )
                  : undefined;

              const honoraryImproved =
                type === "gm" &&
                award.id === "improved" &&
                season === "2022";

              const displayedPlayer =
                playerWinner ?? legacyMvp;

              const winnerFranchise =
                gmWinner?.franchiseName ??
                displayedPlayer?.franchiseName ??
                (honoraryImproved
                  ? getFranchise(7)
                  : undefined);

              const winnerRosterId =
                winnerFranchise
                  ? getRosterId(winnerFranchise)
                  : undefined;

              return (
                <div
                  key={season}
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "48px minmax(0, 1fr)",
                    gap: "12px",
                    padding: "13px 0",
                    borderBottom:
                      index === seasons.length - 1
                        ? "none"
                        : "1px solid #27303b",
                  }}
                >
                  <strong
                    style={{
                      color: "#9da7b3",
                      fontSize: "13px",
                    }}
                  >
                    {season}
                  </strong>

                  {gmWinner ||
                  honoraryImproved ||
                  displayedPlayer ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        minWidth: 0,
                      }}
                    >
                      <FranchiseLogo
                        rosterId={winnerRosterId}
                        size={40}
                      />

                      <div
                        style={{
                          minWidth: 0,
                          flex: 1,
                        }}
                      >
                        <strong
                          style={{
                            display: "block",
                            fontSize: "14px",
                          }}
                        >
                          {gmWinner
                            ? gmWinner.winnerName
                            : honoraryImproved &&
                              !displayedPlayer
                            ? "Ollie Payne"
                            : displayedPlayer?.playerName}
                        </strong>

                        <div
                          style={{
                            marginTop: "4px",
                            fontSize: "12px",
                            color: "#687384",
                          }}
                        >
                          {winnerFranchise}
                        </div>

                        {gmWinner?.detail && (
                          <div
                            style={{
                              marginTop: "4px",
                              fontSize: "12px",
                              color: "#9da7b3",
                            }}
                          >
                            {gmWinner.detail}
                          </div>
                        )}

                        {honoraryImproved &&
                          !gmWinner && (
                            <div
                              style={{
                                marginTop: "4px",
                                fontSize: "12px",
                                color: "#9da7b3",
                              }}
                            >
                              Inaugural honorary winner
                            </div>
                          )}

                        {displayedPlayer &&
                          !gmWinner && (
                            <div
                              style={{
                                marginTop: "4px",
                                fontSize: "12px",
                                color: "#9da7b3",
                              }}
                            >
                              {displayedPlayer.points.toFixed(1)} pts
                            </div>
                          )}
                      </div>
                    </div>
                  ) : (
                    <span
                      style={{
                        color: "#9da7b3",
                        fontSize: "13px",
                      }}
                    >
                      {season === seasons[0]
                        ? "TBD"
                        : "Winner not yet connected"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <main>
      <header style={{ marginBottom: "26px" }}>
        <p
          style={{
            ...labelStyle(),
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
          History
        </h1>

        <p style={{ marginTop: "6px" }}>
          The official history of the Sluts Football League.
        </p>
      </header>

      <nav
        aria-label="History categories"
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(3, minmax(0, 1fr))",
          gap: "6px",
          padding: "5px",
          background: "#151b23",
          border: "1px solid #27303b",
          borderRadius: "14px",
          marginBottom: "24px",
        }}
      >
        {[
          {
            id: "champions",
            label: "Champions",
          },
          {
            id: "gm",
            label: "GM Awards",
          },
          {
            id: "players",
            label: "Player Awards",
          },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(
                tab.id as
                  | "champions"
                  | "gm"
                  | "players"
              );
              setExpandedAward(null);
            }}
            style={{
              border: "none",
              borderRadius: "10px",
              padding: "12px 5px",
              background:
                activeTab === tab.id
                  ? "#27303b"
                  : "transparent",
              color:
                activeTab === tab.id
                  ? "#f5f7fa"
                  : "#9da7b3",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === "champions" && (
        <section>
          <div style={{ marginBottom: "12px" }}>
            <p style={labelStyle()}>
              SLOOTBOWL
            </p>

            <h2
              style={{
                margin: "4px 0 0",
                fontSize: "22px",
              }}
            >
              Championship history
            </h2>
          </div>

          <article style={cardStyle()}>
            {seasons.map((season, index) => {
              const result = champions.find(
                (item) =>
                  item.season === season
              );

              return (
                <div
                  key={season}
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "54px minmax(0, 1fr)",
                    gap: "14px",
                    padding: "13px 0",
                    borderBottom:
                      index === seasons.length - 1
                        ? "none"
                        : "1px solid #27303b",
                  }}
                >
                  <strong>{season}</strong>

                  {result ? (
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        <FranchiseLogo
                          rosterId={result.champion}
                          size={48}
                        />

                        <div
                          style={{
                            minWidth: 0,
                          }}
                        >
                          <strong
                            style={{
                              display: "block",
                              fontSize: "14px",
                            }}
                          >
                            🏆{" "}
                            {getFranchise(
                              result.champion
                            )}
                          </strong>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "7px",
                              marginTop: "6px",
                              color: "#687384",
                              fontSize: "12px",
                            }}
                          >
                            <span>vs</span>

                            <FranchiseLogo
                              rosterId={result.runnerUp}
                              size={22}
                            />

                            <span>
                              {getFranchise(
                                result.runnerUp
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        color: "#9da7b3",
                        fontSize: "13px",
                      }}
                    >
                      Slootbowl not yet played
                    </div>
                  )}
                </div>
              );
            })}
          </article>

          <div
            style={{
              marginTop: "30px",
              marginBottom: "12px",
            }}
          >
            <p style={labelStyle()}>
              CONFERENCE CHAMPIONS
            </p>

            <h2
              style={{
                margin: "4px 0 0",
                fontSize: "22px",
              }}
            >
              The road to the Slootbowl
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "1fr 1fr",
              gap: "10px",
            }}
          >
            {[
              {
                conference: "OBFC",
                trophy:
                  "George Barnes Memorial Trophy",
                key: "obfc" as const,
              },
              {
                conference: "GPFC",
                trophy:
                  "Ryan Birr Memorial Shield",
                key: "gpfc" as const,
              },
            ].map((item) => (
              <article
                key={item.conference}
                style={{
                  ...cardStyle(),
                  padding: "14px",
                  minWidth: 0,
                }}
              >
                <p style={labelStyle()}>
                  {item.conference}
                </p>

                <h3
                  style={{
                    margin: "5px 0 4px",
                    fontSize: "16px",
                  }}
                >
                  {item.trophy}
                </h3>

                {seasons.map(
                  (season, index) => {
                    const result =
                      conferenceChampions.find(
                        (entry) =>
                          entry.season ===
                          season
                      );

                    const rosterId = result
                      ? result[item.key]
                      : undefined;

                    return (
                      <div
                        key={season}
                        style={{
                          padding: "10px 0",
                          borderBottom:
                            index ===
                            seasons.length - 1
                              ? "none"
                              : "1px solid #27303b",
                        }}
                      >
                        <div
                          style={{
                            color: "#687384",
                            fontSize: "12px",
                            marginBottom: "5px",
                          }}
                        >
                          {season}
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "7px",
                            minWidth: 0,
                          }}
                        >
                          <FranchiseLogo
                            rosterId={rosterId}
                            size={30}
                          />

                          <strong
                            style={{
                              fontSize: "12px",
                              overflowWrap: "anywhere",
                            }}
                          >
                            {rosterId
                              ? getFranchise(
                                  rosterId
                                )
                              : "TBD"}
                          </strong>
                        </div>
                      </div>
                    );
                  }
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {activeTab === "gm" && (
        <section>
          <div
            style={{
              marginBottom: "16px",
            }}
          >
            <p style={labelStyle()}>
              GENERAL MANAGERS
            </p>

            <h2
              style={{
                margin: "4px 0 0",
                fontSize: "22px",
              }}
            >
              GM Awards
            </h2>

            <p
              style={{
                marginTop: "6px",
                color: "#9da7b3",
                fontSize: "13px",
              }}
            >
              The best, the worst and the
              downright unfortunate.
            </p>
          </div>

          {GM_AWARDS.map((award) =>
            awardRow(award, "gm")
          )}
        </section>
      )}

      {activeTab === "players" && (
        <section>
          <div
            style={{
              marginBottom: "16px",
            }}
          >
            <p style={labelStyle()}>
              INDIVIDUAL HONOURS
            </p>

            <h2
              style={{
                margin: "4px 0 0",
                fontSize: "22px",
              }}
            >
              Player Awards
            </h2>

            <p
              style={{
                marginTop: "6px",
                color: "#9da7b3",
                fontSize: "13px",
              }}
            >
              The finest individual performances
              in SFL history.
            </p>
          </div>

          {PLAYER_AWARDS.map((award) =>
            awardRow(award, "players")
          )}
        </section>
      )}

      <section
        style={{
          marginTop: "34px",
        }}
      >
        <div
          style={{
            marginBottom: "12px",
          }}
        >
          <p style={labelStyle()}>
            SEASONS
          </p>

          <h2
            style={{
              margin: "4px 0 0",
              fontSize: "22px",
            }}
          >
            SFL season archive
          </h2>
        </div>

        {seasons.map((season) => {
          const result = champions.find(
            (item) =>
              item.season === season
          );

          return (
            <Link
              key={season}
              href={`/history/${season}`}
              style={{
                display: "block",
                color: "inherit",
                textDecoration: "none",
                marginBottom: "14px",
              }}
            >
              <article
                style={{
                  ...cardStyle(),
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    gap: "12px",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <p style={labelStyle()}>
                      SEASON
                    </p>

                    <h3
                      style={{
                        margin: "4px 0 0",
                        fontSize: "21px",
                      }}
                    >
                      {season}
                    </h3>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      minWidth: 0,
                    }}
                  >
                    {result && (
                      <FranchiseLogo
                        rosterId={result.champion}
                        size={44}
                      />
                    )}

                    <div
                      style={{
                        textAlign: "right",
                        minWidth: 0,
                      }}
                    >
                      {result ? (
                        <>
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#687384",
                            }}
                          >
                            SLOOTBOWL CHAMPION
                          </div>

                          <strong
                            style={{
                              display: "block",
                              marginTop: "3px",
                              fontSize: "13px",
                            }}
                          >
                            {getFranchise(
                              result.champion
                            )}
                          </strong>
                        </>
                      ) : (
                        <span
                          style={{
                            color: "#687384",
                          }}
                        >
                          Current season
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            </Link>
          );
        })}
      </section>
    </main>
  );
}
