
import Image from "next/image";
import type { CSSProperties } from "react";

import {
  getHistoricalData,
  type HistoricalMatchup,
} from "../../lib/sleeper";

import { getPlayerRecords } from "../../lib/playerRecords";

import {
  FRANCHISES,
  getHistoricalFranchiseName,
} from "../../lib/franchises";

const TEAM_DIVISIONS: Record<
  number,
  "OBFC" | "GPFC"
> = {
  1: "GPFC",
  2: "GPFC",
  3: "GPFC",
  4: "OBFC",
  5: "GPFC",
  6: "OBFC",
  7: "OBFC",
  8: "OBFC",
  9: "OBFC",
  10: "GPFC",
};

type MatchupsPageProps = {
  searchParams: Promise<{
    season?: string;
    week?: string;
  }>;
};

type PlayerDirectory = Record<
  string,
  {
    name?: string;
    position?: string;
  }
>;

type Starter = {
  id: string;
  name: string;
  position: string;
  points: number | null;
};

function formatScore(score: number) {
  return score.toFixed(2);
}

function formatMargin(
  firstScore: number,
  secondScore: number
) {
  return Math.abs(
    firstScore - secondScore
  ).toFixed(2);
}

function getWeekLabel(week: number) {
  if (week === 15) {
    return "Playoff Week 15";
  }

  if (week === 16) {
    return "Playoff Week 16";
  }

  if (week === 17) {
    return "Slootbowl Week";
  }

  return `Week ${week}`;
}

function teamName(
  rosterId: number,
  season: string
) {
  return getHistoricalFranchiseName(
    rosterId,
    season
  );
}

function teamLogo(rosterId: number) {
  return FRANCHISES.find(
    franchise =>
      franchise.rosterId === rosterId
  )?.logo;
}

function getStarters(
  ids: string[],
  points: number[],
  directory: PlayerDirectory
): Starter[] {
  return ids
    .filter(
      id =>
        id &&
        id !== "0" &&
        id !== "null"
    )
    .map((id, index) => {
      const player = directory[id];

      // Sleeper's starters_points array
      // corresponds to starters by index.
      // Filter placeholders only after
      // matching their original positions.
      const originalIndex =
        ids.indexOf(id, 0);

      const score =
        points[originalIndex];

      return {
        id,
        name:
          player?.name ??
          `Player ${id}`,
        position:
          player?.position ??
          "—",
        points:
          typeof score === "number" &&
          Number.isFinite(score)
            ? score
            : null,
      };
    });
}

function getTopScore(
  starters: Starter[]
) {
  const scores = starters
    .map(player => player.points)
    .filter(
      (score): score is number =>
        score !== null
    );

  return scores.length
    ? Math.max(...scores)
    : null;
}

function TeamLogo({
  rosterId,
  size = 48,
}: {
  rosterId: number;
  size?: number;
}) {
  const logo = teamLogo(rosterId);

  if (!logo) {
    return (
      <div
        style={{
          width: size,
          height: size,
          flexShrink: 0,
          borderRadius: 10,
          background: "#27303b",
        }}
      />
    );
  }

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        flexShrink: 0,
      }}
    >
      <Image
        src={logo}
        alt={`${rosterId} franchise logo`}
        fill
        sizes={`${size}px`}
        style={{
          objectFit: "contain",
        }}
      />
    </div>
  );
}

function TeamScoreRow({
  rosterId,
  season,
  score,
  won,
  tied,
  first,
}: {
  rosterId: number;
  season: string;
  score: number;
  won: boolean;
  tied: boolean;
  first: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: first
          ? "0 0 15px"
          : "15px 0 0",
        borderBottom: first
          ? "1px solid #27303b"
          : "none",
      }}
    >
      <TeamLogo
        rosterId={rosterId}
        size={50}
      />

      <div
        style={{
          flex: 1,
          minWidth: 0,
        }}
      >
        <div
          style={{
            color: "#ffffff",
            fontSize: 14,
            fontWeight: won ? 800 : 600,
            lineHeight: 1.35,
          }}
        >
          {teamName(
            rosterId,
            season
          )}
        </div>

        <div
          style={{
            marginTop: 5,
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: 0.7,
            color: won
              ? "#8ed3a2"
              : "#8793a3",
          }}
        >
          {tied
            ? "TIE"
            : won
            ? "WINNER"
            : "LOSS"}
        </div>
      </div>

      <div
        style={{
          flexShrink: 0,
          fontSize: 23,
          fontWeight: won ? 900 : 650,
          color: won
            ? "#ffffff"
            : "#aeb8c5",
          fontVariantNumeric:
            "tabular-nums",
          letterSpacing: -0.7,
        }}
      >
        {formatScore(score)}
      </div>
    </div>
  );
}

function StarterCell({
  player,
  topScore,
  align,
}: {
  player?: Starter;
  topScore: number | null;
  align: "left" | "right";
}) {
  if (!player) {
    return (
      <div
        style={{
          minHeight: 53,
          background: "#111720",
          borderRadius: 9,
        }}
      />
    );
  }

  const isTop =
    player.points !== null &&
    topScore !== null &&
    player.points === topScore;

  return (
    <div
      style={{
        minWidth: 0,
        minHeight: 53,
        padding: "9px 7px",
        background: isTop
          ? "#263629"
          : "#202833",
        border: isTop
          ? "1px solid #54765d"
          : "1px solid transparent",
        borderRadius: 9,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 5,
        textAlign: align,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent:
            align === "left"
              ? "flex-start"
              : "flex-end",
          gap: 5,
          minWidth: 0,
        }}
      >
        {align === "left" && (
          <span style={positionStyle}>
            {player.position}
          </span>
        )}

        <span
          title={player.name}
          style={{
            color: "#ffffff",
            fontSize: 11,
            fontWeight: 700,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {player.name}
        </span>

        {align === "right" && (
          <span style={positionStyle}>
            {player.position}
          </span>
        )}
      </div>

      <div
        style={{
          fontSize: 14,
          fontWeight: 800,
          color: isTop
            ? "#a8e4b3"
            : "#ffffff",
          fontVariantNumeric:
            "tabular-nums",
        }}
      >
        {player.points === null
          ? "—"
          : formatScore(player.points)}
      </div>
    </div>
  );
}

function StartingLineups({
  matchup,
  directory,
}: {
  matchup: HistoricalMatchup;
  directory: PlayerDirectory;
}) {
  const startersA = getStarters(
    matchup.startersA,
    matchup.startersPointsA,
    directory
  );

  const startersB = getStarters(
    matchup.startersB,
    matchup.startersPointsB,
    directory
  );

  const topA =
    getTopScore(startersA);

  const topB =
    getTopScore(startersB);

  const rowCount = Math.max(
    startersA.length,
    startersB.length
  );

  if (rowCount === 0) {
    return (
      <p
        style={{
          color: "#8793a3",
          fontSize: 12,
          lineHeight: 1.6,
        }}
      >
        Starting lineup data is not
        available for this matchup.
      </p>
    );
  }

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(0, 1fr) minmax(0, 1fr)",
          gap: 8,
          marginBottom: 10,
        }}
      >
        {[
          matchup.rosterA,
          matchup.rosterB,
        ].map(rosterId => (
          <div
            key={rosterId}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: 6,
              minWidth: 0,
            }}
          >
            <TeamLogo
              rosterId={rosterId}
              size={38}
            />

            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: "#ffffff",
                lineHeight: 1.35,
                overflowWrap: "anywhere",
              }}
            >
              {teamName(
                rosterId,
                matchup.season
              )}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(0, 1fr) minmax(0, 1fr)",
          gap: 8,
          marginBottom: 8,
        }}
      >
        <div style={lineupTotalStyle}>
          {formatScore(matchup.scoreA)}
        </div>

        <div style={lineupTotalStyle}>
          {formatScore(matchup.scoreB)}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          gap: 8,
          marginBottom: 10,
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: 1,
          color: "#8793a3",
        }}
      >
        <span>STARTERS</span>
        <span>STARTERS</span>
      </div>

      {Array.from(
        { length: rowCount },
        (_, index) => (
          <div
            key={index}
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(0, 1fr) minmax(0, 1fr)",
              gap: 8,
              marginBottom: 7,
            }}
          >
            <StarterCell
              player={startersA[index]}
              topScore={topA}
              align="left"
            />

            <StarterCell
              player={startersB[index]}
              topScore={topB}
              align="right"
            />
          </div>
        )
      )}

      <p
        style={{
          color: "#687384",
          fontSize: 11,
          lineHeight: 1.6,
          marginTop: 14,
          marginBottom: 0,
        }}
      >
        Starters are shown in their
        recorded Sleeper lineup order.
        Highlighted players are each
        team's highest-scoring starters.
        Team totals use Sleeper's official
        matchup scores.
      </p>
    </div>
  );
}

function MatchupCard({
  matchup,
  directory,
}: {
  matchup: HistoricalMatchup;
  directory: PlayerDirectory;
}) {
  const firstWon =
    matchup.scoreA >
    matchup.scoreB;

  const secondWon =
    matchup.scoreB >
    matchup.scoreA;

  const tied =
    matchup.scoreA ===
    matchup.scoreB;

  const divisionA =
    TEAM_DIVISIONS[
      matchup.rosterA
    ];

  const divisionB =
    TEAM_DIVISIONS[
      matchup.rosterB
    ];

  const divisionLabel =
    divisionA === divisionB
      ? divisionA ?? "SFL"
      : "INTERCONFERENCE";

  const isSlootbowl =
    matchup.phase ===
      "Main Playoffs" &&
    matchup.week === 17;

  const label = isSlootbowl
    ? "SLOOTBOWL"
    : matchup.phase ===
      "Main Playoffs"
    ? "MAIN PLAYOFFS"
    : divisionLabel;

  const hasLineups =
    matchup.startersA.length > 0 ||
    matchup.startersB.length > 0;

  return (
    <article
      style={{
        background: "#151b23",
        border: isSlootbowl
          ? "1px solid #a88746"
          : "1px solid #27303b",
        borderRadius: 18,
        padding: 17,
        marginBottom: 12,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent:
            "space-between",
          gap: 10,
          marginBottom: 17,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 1,
            color: isSlootbowl
              ? "#d7b774"
              : "#9da7b3",
          }}
        >
          {isSlootbowl && (
            <span
              aria-hidden="true"
            >
              ★
            </span>
          )}

          {label}
        </div>

        <span
          style={{
            color: "#8793a3",
            fontSize: 11,
          }}
        >
          {matchup.isComplete
            ? "Final"
            : "Not Final"}
        </span>
      </div>

      <TeamScoreRow
        rosterId={matchup.rosterA}
        season={matchup.season}
        score={matchup.scoreA}
        won={firstWon}
        tied={tied}
        first
      />

      <TeamScoreRow
        rosterId={matchup.rosterB}
        season={matchup.season}
        score={matchup.scoreB}
        won={secondWon}
        tied={tied}
        first={false}
      />

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          gap: 10,
          borderTop:
            "1px solid #27303b",
          paddingTop: 13,
          marginTop: 17,
          fontSize: 12,
        }}
      >
        <span
          style={{
            color: "#8793a3",
          }}
        >
          {isSlootbowl
            ? "Championship Game"
            : matchup.phase ===
              "Main Playoffs"
            ? "Official Playoff Game"
            : "Regular-Season Game"}
        </span>

        <strong
          style={{
            color: "#ffffff",
            whiteSpace: "nowrap",
          }}
        >
          {tied
            ? "Draw"
            : `Margin: ${formatMargin(
                matchup.scoreA,
                matchup.scoreB
              )}`}
        </strong>
      </div>

      {hasLineups && (
        <details
          style={{
            marginTop: 16,
            borderTop:
              "1px solid #27303b",
          }}
        >
          <summary
            style={{
              padding:
                "15px 2px 4px",
              color: "#ffffff",
              fontSize: 13,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            View Starting Lineups
          </summary>

          <div
            style={{
              marginTop: 17,
              borderTop:
                "1px solid #27303b",
              paddingTop: 17,
            }}
          >
            <StartingLineups
              matchup={matchup}
              directory={directory}
            />
          </div>
        </details>
      )}
    </article>
  );
}

function WeekLink({
  week,
  currentWeek,
  selectedSeason,
  label,
}: {
  week: number;
  currentWeek: number;
  selectedSeason: string;
  label: string;
}) {
  const selected =
    week === currentWeek;

  return (
    <a
      href={`/matchups?season=${selectedSeason}&week=${week}`}
      aria-current={
        selected
          ? "page"
          : undefined
      }
      style={{
        textDecoration: "none",
        color: selected
          ? "#ffffff"
          : "#9da7b3",
        background: selected
          ? "#27303b"
          : "#0b0f14",
        border: selected
          ? "1px solid #687384"
          : "1px solid #27303b",
        borderRadius: 9,
        minHeight: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 13,
        fontWeight: selected
          ? 800
          : 500,
      }}
    >
      {label}
    </a>
  );
}

export default async function MatchupsPage({
  searchParams,
}: MatchupsPageProps) {
  const params =
    await searchParams;

  const [
    historicalData,
    playerRecords,
  ] = await Promise.all([
    getHistoricalData(),
    getPlayerRecords(),
  ]);

  const directory: PlayerDirectory =
    playerRecords.players;

  const completedThroughSeason =
    new Date().getUTCFullYear() -
    1;

  const completedSeasons =
    historicalData
      .filter(
        season =>
          Number(
            season.league.season
          ) <=
          completedThroughSeason
      )
      .sort(
        (a, b) =>
          Number(
            b.league.season
          ) -
          Number(
            a.league.season
          )
      );

  const availableSeasons =
    completedSeasons.map(
      season =>
        String(
          season.league.season
        )
    );

  const selectedSeason =
    params.season &&
    availableSeasons.includes(
      params.season
    )
      ? params.season
      : availableSeasons[0];

  const seasonData =
    completedSeasons.find(
      season =>
        String(
          season.league.season
        ) ===
        selectedSeason
    );

  const requestedWeek =
    Number(params.week);

  const currentWeek =
    Number.isInteger(
      requestedWeek
    ) &&
    requestedWeek >= 1 &&
    requestedWeek <= 17
      ? requestedWeek
      : 1;

  const matchups = (
    seasonData?.matchups ?? []
  )
    .filter(
      matchup =>
        matchup.week ===
          currentWeek &&
        matchup.isComplete &&
        (
          matchup.phase ===
            "Regular Season" ||
          matchup.phase ===
            "Main Playoffs"
        )
    )
    .sort(
      (a, b) =>
        a.rosterA -
        b.rosterA
    );

  const officialMatchups = (
    seasonData?.matchups ?? []
  ).filter(
    matchup =>
      matchup.isComplete &&
      (
        matchup.phase ===
          "Regular Season" ||
        matchup.phase ===
          "Main Playoffs"
      )
  );

  const regularSeasonCount =
    officialMatchups.filter(
      matchup =>
        matchup.phase ===
        "Regular Season"
    ).length;

  const playoffCount =
    officialMatchups.filter(
      matchup =>
        matchup.phase ===
        "Main Playoffs"
    ).length;

  function weekUrl(
    week: number
  ) {
    return (
      `/matchups?season=${selectedSeason}` +
      `&week=${week}`
    );
  }

  return (
    <main
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding:
          "24px 16px 110px",
      }}
    >
      <header
        style={{
          marginBottom: 24,
        }}
      >
        <p
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 2,
            color: "#687384",
            marginBottom: 6,
          }}
        >
          DYNASTY SLUTS · SFL ARCHIVES
        </p>

        <h1
          style={{
            fontSize: 30,
            margin: 0,
            fontWeight: 800,
          }}
        >
          Matchup Archive
        </h1>

        <p
          style={{
            color: "#9da7b3",
            fontSize: 13,
            lineHeight: 1.6,
            marginTop: 10,
          }}
        >
          Relive official SFL
          matchups, explore historical
          results and compare the
          starting lineups behind
          every victory.
        </p>
      </header>

      {availableSeasons.length ===
      0 ? (
        <section
          style={panelStyle}
        >
          No completed SFL seasons
          are available.
        </section>
      ) : (
        <>
          <section
            style={{
              ...panelStyle,
              marginBottom: 20,
            }}
          >
            <div
              style={filterLabelStyle}
            >
              SELECT SEASON
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(75px, 1fr))",
                gap: 8,
              }}
            >
              {availableSeasons.map(
                season => {
                  const selected =
                    season ===
                    selectedSeason;

                  return (
                    <a
                      key={season}
                      href={`/matchups?season=${season}&week=1`}
                      style={{
                        textDecoration:
                          "none",
                        color: selected
                          ? "#ffffff"
                          : "#9da7b3",
                        background:
                          selected
                            ? "#27303b"
                            : "#0b0f14",
                        border:
                          selected
                            ? "1px solid #687384"
                            : "1px solid #27303b",
                        borderRadius: 10,
                        padding:
                          "12px 8px",
                        textAlign:
                          "center",
                        fontSize: 14,
                        fontWeight:
                          selected
                            ? 800
                            : 500,
                      }}
                    >
                      {season}
                    </a>
                  );
                }
              )}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "1fr 1fr",
                gap: 10,
                marginTop: 16,
              }}
            >
              <div
                style={countBoxStyle}
              >
                <div
                  style={countLabelStyle}
                >
                  Regular-Season Games
                </div>

                <div
                  style={countValueStyle}
                >
                  {regularSeasonCount}
                </div>
              </div>

              <div
                style={countBoxStyle}
              >
                <div
                  style={countLabelStyle}
                >
                  Main-Playoff Games
                </div>

                <div
                  style={countValueStyle}
                >
                  {playoffCount}
                </div>
              </div>
            </div>
          </section>

          <section
            style={{
              ...panelStyle,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "space-between",
                marginBottom: 16,
              }}
            >
              {currentWeek > 1 ? (
                <a
                  href={weekUrl(
                    currentWeek - 1
                  )}
                  aria-label="Previous week"
                  style={arrowStyle}
                >
                  ←
                </a>
              ) : (
                <div
                  style={{
                    width: 40,
                  }}
                />
              )}

              <div
                style={{
                  textAlign:
                    "center",
                }}
              >
                <div
                  style={{
                    color:
                      "#687384",
                    fontSize: 11,
                    fontWeight:
                      700,
                    letterSpacing:
                      1.5,
                  }}
                >
                  {selectedSeason} SEASON
                </div>

                <div
                  style={{
                    fontSize: 21,
                    fontWeight:
                      800,
                    marginTop: 4,
                  }}
                >
                  {getWeekLabel(
                    currentWeek
                  )}
                </div>
              </div>

              {currentWeek < 17 ? (
                <a
                  href={weekUrl(
                    currentWeek + 1
                  )}
                  aria-label="Next week"
                  style={arrowStyle}
                >
                  →
                </a>
              ) : (
                <div
                  style={{
                    width: 40,
                  }}
                />
              )}
            </div>

            <div
              style={filterLabelStyle}
            >
              REGULAR SEASON
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(7, minmax(0, 1fr))",
                gap: 7,
                marginBottom: 20,
              }}
            >
              {Array.from(
                {
                  length: 14,
                },
                (_, index) =>
                  index + 1
              ).map(week => (
                <WeekLink
                  key={week}
                  week={week}
                  currentWeek={
                    currentWeek
                  }
                  selectedSeason={
                    selectedSeason
                  }
                  label={String(
                    week
                  )}
                />
              ))}
            </div>

            <div
              style={filterLabelStyle}
            >
              MAIN PLAYOFFS
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(3, minmax(0, 1fr))",
                gap: 8,
              }}
            >
              {[15, 16, 17].map(
                week => (
                  <WeekLink
                    key={week}
                    week={week}
                    currentWeek={
                      currentWeek
                    }
                    selectedSeason={
                      selectedSeason
                    }
                    label={`Week ${week}`}
                  />
                )
              )}
            </div>
          </section>

          <div
            style={{
              marginBottom: 14,
              display: "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center",
              gap: 10,
            }}
          >
            <h2
              style={{
                fontSize: 19,
                fontWeight:
                  800,
                margin: 0,
              }}
            >
              {selectedSeason} ·{" "}
              {getWeekLabel(
                currentWeek
              )}
            </h2>

            <span
              style={{
                fontSize: 12,
                color:
                  "#9da7b3",
                whiteSpace:
                  "nowrap",
              }}
            >
              {matchups.length}{" "}
              {matchups.length ===
              1
                ? "game"
                : "games"}
            </span>
          </div>

          {matchups.length ===
          0 ? (
            <div
              style={{
                ...panelStyle,
                padding: 24,
                color:
                  "#9da7b3",
                textAlign:
                  "center",
                fontSize: 13,
              }}
            >
              No official completed
              matchups recorded for
              this week.
            </div>
          ) : (
            matchups.map(
              (matchup, index) => (
                <MatchupCard
                  key={`${selectedSeason}-${currentWeek}-${matchup.rosterA}-${matchup.rosterB}-${index}`}
                  matchup={
                    matchup
                  }
                  directory={
                    directory
                  }
                />
              )
            )
          )}

          <p
            style={{
              color: "#687384",
              fontSize: 12,
              lineHeight: 1.6,
              marginTop: 24,
            }}
          >
            Historical results and
            starting lineups are
            sourced from Sleeper.
            Only completed seasons
            and official SFL
            regular-season and main
            winners-bracket games
            are included. Toilet
            Bowl and consolation
            matchups are excluded.
          </p>
        </>
      )}
    </main>
  );
}

const panelStyle: CSSProperties = {
  background: "#151b23",
  border:
    "1px solid #27303b",
  borderRadius: 18,
  padding: 16,
};

const filterLabelStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 1.5,
  color: "#687384",
  marginBottom: 12,
};

const countBoxStyle: CSSProperties = {
  background: "#202833",
  borderRadius: 10,
  padding: 12,
};

const countLabelStyle: CSSProperties = {
  color: "#9da7b3",
  fontSize: 11,
  marginBottom: 5,
};

const countValueStyle: CSSProperties = {
  fontSize: 21,
  fontWeight: 800,
};

const arrowStyle: CSSProperties = {
  color: "#ffffff",
  textDecoration: "none",
  fontSize: 24,
  padding: 8,
};

const positionStyle: CSSProperties = {
  color: "#aeb8c5",
  fontSize: 9,
  fontWeight: 800,
  flexShrink: 0,
};

const lineupTotalStyle: CSSProperties = {
  background: "#0b0f14",
  border:
    "1px solid #27303b",
  borderRadius: 10,
  padding: "11px 8px",
  textAlign: "center",
  color: "#ffffff",
  fontSize: 20,
  fontWeight: 900,
  fontVariantNumeric:
    "tabular-nums",
};
