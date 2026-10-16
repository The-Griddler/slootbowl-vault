
"use client";

import { useState } from "react";
import Link from "next/link";

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

type HistoryTabsProps = {
  seasons: string[];
  champions: Champion[];
  conferenceChampions: ConferenceChampion[];
  mvpRecords: MVPRecord[];
  franchiseNames: Record<number, string>;
};

const GM_AWARDS = [
  {
    id: "gm",
    icon: "🏆",
    title: "GM of the Year",
    description: "Most regular-season points scored",
  },
  {
    id: "improved",
    icon: "📈",
    title: "Most Improved GM of the Year",
    description: "Largest increase in regular-season wins",
  },
  {
    id: "lubed",
    icon: "💀",
    title: "The Lubed Up, Dicked Down Award",
    description: "Most regular-season points conceded",
  },
  {
    id: "wonder",
    icon: "⚡",
    title: "One Week Wonder of the Year",
    description: "Highest single-week regular-season team score",
  },
  {
    id: "shitcunt",
    icon: "🚽",
    title: "Shitcunt of the Year",
    description: "Toilet Bowl loser",
  },
];

const PLAYER_AWARDS = [
  {
    id: "mvp",
    icon: "👑",
    title: "SFL MVP",
    description: "Most Valuable Player",
  },
  {
    id: "opoy",
    icon: "⭐",
    title: "SFL OPOY",
    description: "Offensive Player of the Year",
  },
  {
    id: "roy",
    icon: "🏅",
    title: "SFL ROY",
    description: "Rookie of the Year",
  },
  {
    id: "sbmvp",
    icon: "🏆",
    title: "Slootbowl MVP",
    description: "Championship game MVP",
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

export default function HistoryTabs({
  seasons,
  champions,
  conferenceChampions,
  mvpRecords,
  franchiseNames,
}: HistoryTabsProps) {
  const [activeTab, setActiveTab] = useState<
    "champions" | "gm" | "players"
  >("champions");

  const [expandedAward, setExpandedAward] =
    useState<string | null>(null);

  const getFranchise = (rosterId: number) =>
    franchiseNames[rosterId] ?? `Franchise ${rosterId}`;

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
      description: string;
    },
    type: "gm" | "players"
  ) => {
    const isExpanded = expandedAward === award.id;

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
          onClick={() => toggleAward(award.id)}
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

            <span
              style={{
                display: "block",
                marginTop: "4px",
                fontSize: "12px",
                color: "#687384",
              }}
            >
              {award.description}
            </span>
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
              const mvp =
                type === "players" &&
                award.id === "mvp"
                  ? mvpRecords.find(
                      (item) => item.season === season
                    )
                  : undefined;

              const honoraryImproved =
                type === "gm" &&
                award.id === "improved" &&
                season === "2022";

              return (
                <div
                  key={season}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "48px 1fr",
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

                  {mvp ? (
                    <div>
                      <strong
                        style={{
                          display: "block",
                          fontSize: "14px",
                        }}
                      >
                        {mvp.playerName}
                      </strong>

                      <div
                        style={{
                          marginTop: "4px",
                          fontSize: "12px",
                          color: "#687384",
                        }}
                      >
                        {mvp.franchiseName}
                      </div>

                      <div
                        style={{
                          marginTop: "4px",
                          fontSize: "12px",
                          color: "#9da7b3",
                        }}
                      >
                        {mvp.points.toFixed(1)} pts
                      </div>
                    </div>
                  ) : honoraryImproved ? (
                    <div>
                      <strong
                        style={{
                          display: "block",
                          fontSize: "14px",
                        }}
                      >
                        Ollie Payne
                      </strong>

                      <div
                        style={{
                          marginTop: "4px",
                          fontSize: "12px",
                          color: "#687384",
                        }}
                      >
                        Kalamata Dirty Vegans
                      </div>

                      <div
                        style={{
                          marginTop: "4px",
                          fontSize: "12px",
                          color: "#9da7b3",
                        }}
                      >
                        Inaugural honorary winner
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
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: "6px",
          padding: "5px",
          background: "#151b23",
          border: "1px solid #27303b",
          borderRadius: "14px",
          marginBottom: "24px",
        }}
      >
        {[
          { id: "champions", label: "Champions" },
          { id: "gm", label: "GM Awards" },
          { id: "players", label: "Player Awards" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(
                tab.id as "champions" | "gm" | "players"
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
            <p style={labelStyle()}>SLOOTBOWL</p>

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
                (item) => item.season === season
              );

              return (
                <div
                  key={season}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "54px 1fr",
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
                      <div style={{ fontWeight: 700 }}>
                        🏆{" "}
                        {getFranchise(result.champion)}
                      </div>

                      <div
                        style={{
                          color: "#687384",
                          fontSize: "13px",
                          marginTop: "3px",
                        }}
                      >
                        vs{" "}
                        {getFranchise(result.runnerUp)}
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
              gridTemplateColumns: "1fr 1fr",
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
                style={cardStyle()}
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

                {seasons.map((season, index) => {
                  const result =
                    conferenceChampions.find(
                      (entry) =>
                        entry.season === season
                    );

                  return (
                    <div
                      key={season}
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        gap: "8px",
                        padding: "10px 0",
                        borderBottom:
                          index === seasons.length - 1
                            ? "none"
                            : "1px solid #27303b",
                        fontSize: "13px",
                      }}
                    >
                      <span
                        style={{
                          color: "#687384",
                        }}
                      >
                        {season}
                      </span>

                      <strong
                        style={{
                          textAlign: "right",
                        }}
                      >
                        {result
                          ? getFranchise(
                              result[item.key]
                            )
                          : "TBD"}
                      </strong>
                    </div>
                  );
                })}
              </article>
            ))}
          </div>
        </section>
      )}

      {activeTab === "gm" && (
        <section>
          <div style={{ marginBottom: "16px" }}>
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
          <div style={{ marginBottom: "16px" }}>
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

      <section style={{ marginTop: "34px" }}>
        <div style={{ marginBottom: "12px" }}>
          <p style={labelStyle()}>SEASONS</p>

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
            (item) => item.season === season
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
                      textAlign: "right",
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
              </article>
            </Link>
          );
        })}
      </section>
    </main>
  );
}
