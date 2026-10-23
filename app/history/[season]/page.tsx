
import Image from "next/image";
import { notFound } from "next/navigation";

import {
  getHistoricalData,
  getNFLState,
} from "../../../lib/sleeper";

import {
  isSeasonAwardsRevealed,
} from "../../../lib/awardVisibility";

import { getFranchiseName } from "../../../lib/franchises";
import { getPlayers, getPlayerName } from "../../../lib/players";

import type {
  HistoricalMatchup,
  HistoricalSeason,
  SleeperBracketMatch,
} from "../../../lib/sleeper";

const SLOOTBOWLS = [
  { season: "2025", champion: 10, runnerUp: 9 },
  { season: "2024", champion: 10, runnerUp: 4 },
  { season: "2023", champion: 4, runnerUp: 2 },
  { season: "2022", champion: 2, runnerUp: 8 },
];

const OBFC = [4, 6, 8, 7, 9];
const GPFC = [1, 2, 10, 3, 5];

const FRANCHISE_IDS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
];

const GM_NAMES: Record<number, string> = {
  1: "Ed Nelms",
  2: "Ben Smith",
  3: "Jake Greenwood",
  4: "George Pendleton",
  5: "Ryan Whiting",
  6: "Garrett Etheridge",
  7: "Ollie Payne",
  8: "Jack Brannigan",
  9: "Tarl Brayer",
  10: "Josh Thomas",
};

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

type GMAwardResult = {
  awardId: string;
  rosterId: number;
  detail: string;
};

type TeamSeasonStats = {
  rosterId: number;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
};

type WeeklyScore = {
  rosterId: number;
  week: number;
  points: number;
};

type SeasonStats = {
  season: string;
  complete: boolean;
  teams: TeamSeasonStats[];
  weeklyScores: WeeklyScore[];
};

function FranchiseLogo({
  rosterId,
  size = 40,
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

function cardStyle() {
  return {
    background: "#151b23",
    border: "1px solid #27303b",
    borderRadius: "20px",
    padding: "18px",
    marginBottom: "14px",
  } as const;
}

function labelStyle() {
  return {
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "1.5px",
    color: "#687384",
  } as const;
}

// ============================================
// COMPLETED MATCHUP VALIDATION
// ============================================

function isCompletedMatchup(
  matchup: HistoricalMatchup
): boolean {
  return (
    matchup.isComplete === true &&
    Number.isFinite(matchup.scoreA) &&
    Number.isFinite(matchup.scoreB) &&
    matchup.scoreA >= 0 &&
    matchup.scoreB >= 0 &&
    (matchup.scoreA > 0 || matchup.scoreB > 0)
  );
}

function isRegularSeasonComplete(
  matchups: HistoricalMatchup[]
): boolean {
  const completed = matchups.filter(
    (matchup) =>
      matchup.phase === "Regular Season" &&
      isCompletedMatchup(matchup)
  );

  return Array.from(
    { length: 14 },
    (_, index) => index + 1
  ).every((week) => {
    const weekly = completed.filter(
      (matchup) => matchup.week === week
    );

    if (weekly.length !== 5) {
      return false;
    }

    const rosters = new Set<number>();

    for (const matchup of weekly) {
      rosters.add(matchup.rosterA);
      rosters.add(matchup.rosterB);
    }

    return rosters.size === 10;
  });
}

// ============================================
// GM AWARD STATISTICS
// ============================================

function buildSeasonStats(
  seasonData: HistoricalSeason
): SeasonStats {
  const completedRegularMatchups =
    seasonData.matchups.filter(
      (matchup) =>
        matchup.phase === "Regular Season" &&
        isCompletedMatchup(matchup)
    );

  const teamMap = new Map<
    number,
    TeamSeasonStats
  >();

  for (const rosterId of FRANCHISE_IDS) {
    teamMap.set(rosterId, {
      rosterId,
      wins: 0,
      losses: 0,
      ties: 0,
      pointsFor: 0,
      pointsAgainst: 0,
    });
  }

  const weeklyScores: WeeklyScore[] = [];

  for (const matchup of completedRegularMatchups) {
    const teamA = teamMap.get(matchup.rosterA);
    const teamB = teamMap.get(matchup.rosterB);

    if (!teamA || !teamB) {
      continue;
    }

    teamA.pointsFor += matchup.scoreA;
    teamA.pointsAgainst += matchup.scoreB;

    teamB.pointsFor += matchup.scoreB;
    teamB.pointsAgainst += matchup.scoreA;

    weeklyScores.push({
      rosterId: matchup.rosterA,
      week: matchup.week,
      points: matchup.scoreA,
    });

    weeklyScores.push({
      rosterId: matchup.rosterB,
      week: matchup.week,
      points: matchup.scoreB,
    });

    if (matchup.scoreA > matchup.scoreB) {
      teamA.wins++;
      teamB.losses++;
    } else if (matchup.scoreB > matchup.scoreA) {
      teamB.wins++;
      teamA.losses++;
    } else {
      teamA.ties++;
      teamB.ties++;
    }
  }

  return {
    season: seasonData.league.season,
    complete: isRegularSeasonComplete(
      seasonData.matchups
    ),
    teams: Array.from(teamMap.values()),
    weeklyScores,
  };
}

function calculateRegularSeasonGMAwards(
  seasonData: HistoricalSeason,
  historicalData: HistoricalSeason[]
): GMAwardResult[] {
  const seasonStats = buildSeasonStats(
    seasonData
  );

  const awards: GMAwardResult[] = [];

  if (!seasonStats.complete) {
    return awards;
  }

  const pointsForRanking = [
    ...seasonStats.teams,
  ].sort(
    (a, b) =>
      b.pointsFor - a.pointsFor ||
      a.rosterId - b.rosterId
  );

  const gmOfTheYear = pointsForRanking[0];

  if (gmOfTheYear) {
    awards.push({
      awardId: "gm",
      rosterId: gmOfTheYear.rosterId,
      detail:
        `${gmOfTheYear.pointsFor.toFixed(2)} points scored`,
    });
  }

  const pointsAgainstRanking = [
    ...seasonStats.teams,
  ].sort(
    (a, b) =>
      b.pointsAgainst - a.pointsAgainst ||
      a.rosterId - b.rosterId
  );

  const mostPointsAgainst =
    pointsAgainstRanking[0];

  if (mostPointsAgainst) {
    awards.push({
      awardId: "lubed",
      rosterId: mostPointsAgainst.rosterId,
      detail:
        `${mostPointsAgainst.pointsAgainst.toFixed(2)} points conceded`,
    });
  }

  const highestWeeklyScore = [
    ...seasonStats.weeklyScores,
  ].sort(
    (a, b) =>
      b.points - a.points ||
      a.week - b.week ||
      a.rosterId - b.rosterId
  )[0];

  if (highestWeeklyScore) {
    awards.push({
      awardId: "wonder",
      rosterId: highestWeeklyScore.rosterId,
      detail:
        `${highestWeeklyScore.points.toFixed(2)} points — Week ${highestWeeklyScore.week}`,
    });
  }

  if (seasonStats.season === "2022") {
    awards.push({
      awardId: "improved",
      rosterId: 7,
      detail: "Inaugural honorary winner",
    });
  } else {
    const previousSeason = String(
      Number(seasonStats.season) - 1
    );

    const previousSeasonData =
      historicalData.find(
        (item) =>
          item.league.season === previousSeason
      );

    if (previousSeasonData) {
      const previousStats = buildSeasonStats(
        previousSeasonData
      );

      if (previousStats.complete) {
        const previousWins = new Map(
          previousStats.teams.map((team) => [
            team.rosterId,
            team.wins,
          ])
        );

        const improvements =
          seasonStats.teams
            .filter(
              (team) =>
                team.rosterId !==
                gmOfTheYear?.rosterId
            )
            .map((team) => ({
              rosterId: team.rosterId,
              previousWins:
                previousWins.get(team.rosterId) ?? 0,
              currentWins: team.wins,
              improvement:
                team.wins -
                (previousWins.get(team.rosterId) ?? 0),
            }))
            .sort(
              (a, b) =>
                b.improvement - a.improvement ||
                b.currentWins - a.currentWins ||
                a.rosterId - b.rosterId
            );

        const mostImproved = improvements[0];

        if (mostImproved) {
          const change = mostImproved.improvement;

          const changeLabel =
            change > 0
              ? `+${change}`
              : String(change);

          awards.push({
            awardId: "improved",
            rosterId: mostImproved.rosterId,
            detail:
              `${mostImproved.previousWins} → ${mostImproved.currentWins} wins (${changeLabel})`,
          });
        }
      }
    }
  }

  return awards;
}

// ============================================
// SHITCUNT OF THE YEAR
// ============================================
//
// Uses the WINNER of the p:1 final in
// Sleeper's losers bracket, Week 16.
//
// Same rule as the main History page.
// ============================================

async function calculateShitcuntAward(
  seasonData: HistoricalSeason
): Promise<GMAwardResult | null> {
  const week16Complete =
    seasonData.matchups.some(
      (matchup) =>
        matchup.week === 16 &&
        matchup.isComplete === true
    );

  if (!week16Complete) {
    return null;
  }

  const response = await fetch(
    `https://api.sleeper.app/v1/league/${seasonData.league.league_id}/losers_bracket`,
    {
      next: {
        revalidate: 300,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to load losers bracket for league ${seasonData.league.league_id}`
    );
  }

  const bracket: SleeperBracketMatch[] =
    await response.json();

  const final = bracket.find(
    (match) =>
      match.p === 1 &&
      match.w !== null &&
      match.l !== null &&
      match.t1 !== null &&
      match.t2 !== null
  );

  if (
    !final ||
    final.w === null ||
    final.l === null ||
    final.t1 === null ||
    final.t2 === null
  ) {
    return null;
  }

  const finalists = [
    final.t1,
    final.t2,
  ];

  if (
    !finalists.includes(final.w) ||
    !finalists.includes(final.l) ||
    final.w === final.l
  ) {
    return null;
  }

  return {
    awardId: "shitcunt",
    rosterId: final.w,
    detail: "Toilet Bowl winner — Week 16",
  };
}

// ============================================
// SEASON ARCHIVE
// ============================================

export default async function SeasonPage({
  params,
}: {
  params: Promise<{ season: string }>;
}) {
  const { season } = await params;

  const [historicalData, players, nflState] =
    await Promise.all([
      getHistoricalData(),
      getPlayers(),
      getNFLState(),
    ]);

  const seasonData = historicalData.find(
    (item) => item.league.season === season
  );

  if (!seasonData) {
    notFound();
  }

  // ========================================
  // WEEK 17 AWARD REVEAL RULE
  // ========================================

  const awardsRevealed =
    isSeasonAwardsRevealed(
      season,
      nflState
    );

  const championship = SLOOTBOWLS.find(
    (item) => item.season === season
  );

  const completedRegularMatchups =
    seasonData.matchups.filter(
      (matchup) =>
        matchup.phase === "Regular Season" &&
        isCompletedMatchup(matchup)
    );

  const regularSeasonComplete =
    isRegularSeasonComplete(
      seasonData.matchups
    );

  const standingsLabel = regularSeasonComplete
    ? "FINAL STANDINGS"
    : "CURRENT STANDINGS";

  // ========================================
  // REGULAR SEASON STANDINGS
  // ========================================

  const standings = new Map<
    number,
    {
      rosterId: number;
      wins: number;
      losses: number;
      ties: number;
      points: number;
    }
  >();

  for (const rosterId of [...OBFC, ...GPFC]) {
    standings.set(rosterId, {
      rosterId,
      wins: 0,
      losses: 0,
      ties: 0,
      points: 0,
    });
  }

  for (const matchup of completedRegularMatchups) {
    const teamA = standings.get(matchup.rosterA);
    const teamB = standings.get(matchup.rosterB);

    if (!teamA || !teamB) {
      continue;
    }

    teamA.points += matchup.scoreA;
    teamB.points += matchup.scoreB;

    if (matchup.scoreA > matchup.scoreB) {
      teamA.wins++;
      teamB.losses++;
    } else if (matchup.scoreB > matchup.scoreA) {
      teamB.wins++;
      teamA.losses++;
    } else {
      teamA.ties++;
      teamB.ties++;
    }
  }

  const sortStandings = (rosterIds: number[]) =>
    rosterIds
      .map((rosterId) => standings.get(rosterId)!)
      .sort((a, b) => {
        if (b.wins !== a.wins) {
          return b.wins - a.wins;
        }

        if (b.ties !== a.ties) {
          return b.ties - a.ties;
        }

        return b.points - a.points;
      });

  const obfcStandings = sortStandings(OBFC);
  const gpfcStandings = sortStandings(GPFC);

  // ========================================
  // MAIN PLAYOFFS ONLY
  // ========================================

  const playoffMatchups = seasonData.matchups
    .filter(
      (matchup) =>
        matchup.phase === "Main Playoffs"
    )
    .sort((a, b) => a.week - b.week);

  const completedPlayoffMatchups =
    playoffMatchups.filter(
      (matchup) =>
        matchup.isComplete === true &&
        Number.isFinite(matchup.scoreA) &&
        Number.isFinite(matchup.scoreB) &&
        (matchup.scoreA > 0 || matchup.scoreB > 0)
    );

  const playoffTeams = new Set<number>();

  for (const matchup of completedPlayoffMatchups) {
    playoffTeams.add(matchup.rosterA);
    playoffTeams.add(matchup.rosterB);
  }

  // ========================================
  // PLAYER AWARDS
  // ========================================

  const regularSeasonPerformances =
    completedRegularMatchups.flatMap(
      (matchup) => [
        ...matchup.startersA.map(
          (playerId, index) => ({
            playerId,
            rosterId: matchup.rosterA,
            points:
              matchup.startersPointsA[index] ?? 0,
          })
        ),
        ...matchup.startersB.map(
          (playerId, index) => ({
            playerId,
            rosterId: matchup.rosterB,
            points:
              matchup.startersPointsB[index] ?? 0,
          })
        ),
      ]
    );

  const playerTotals = new Map<
    string,
    {
      playerId: string;
      points: number;
      rosters: Set<number>;
    }
  >();

  for (const performance of regularSeasonPerformances) {
    if (
      !performance.playerId ||
      performance.playerId === "0" ||
      !Number.isFinite(performance.points)
    ) {
      continue;
    }

    const existing = playerTotals.get(
      performance.playerId
    );

    if (!existing) {
      playerTotals.set(performance.playerId, {
        playerId: performance.playerId,
        points: performance.points,
        rosters: new Set([performance.rosterId]),
      });
    } else {
      existing.points += performance.points;
      existing.rosters.add(performance.rosterId);
    }
  }

  // SFL MVP
  const mvpCandidates = Array.from(
    playerTotals.values()
  )
    .filter((player) =>
      Array.from(player.rosters).some(
        (rosterId) => playoffTeams.has(rosterId)
      )
    )
    .sort((a, b) => b.points - a.points);

  const mvp = awardsRevealed &&
    regularSeasonComplete
    ? mvpCandidates[0]
    : undefined;

  // SFL OPOY
  const mvpPlayer = mvp
    ? players[mvp.playerId]
    : null;

  const mvpPosition =
    mvpPlayer?.position ??
    mvpPlayer?.fantasy_positions?.[0] ??
    null;

  const opoy = awardsRevealed &&
    regularSeasonComplete
    ? mvpCandidates.find((candidate) => {
        const player = players[candidate.playerId];

        const position =
          player?.position ??
          player?.fantasy_positions?.[0] ??
          null;

        return (
          position &&
          position !== mvpPosition
        );
      })
    : undefined;

  // SFL ROY
  const seasonNumber = Number(season);

  const currentPlayerDataSeason = Math.max(
    ...historicalData.map((item) =>
      Number(item.league.season)
    )
  );

  const rookieCandidates = Array.from(
    playerTotals.values()
  )
    .filter((candidate) => {
      const player = players[candidate.playerId];

      if (
        player?.years_exp === null ||
        player?.years_exp === undefined
      ) {
        return false;
      }

      const rookieSeason =
        currentPlayerDataSeason -
        player.years_exp;

      return rookieSeason === seasonNumber;
    })
    .sort((a, b) => b.points - a.points);

  const roy = awardsRevealed &&
    regularSeasonComplete
    ? rookieCandidates[0]
    : undefined;

  // SLOOTBOWL MVP
  const slootbowl =
    completedPlayoffMatchups.find(
      (matchup) => matchup.week === 17
    );

  let sbMvp:
    | {
        playerId: string;
        rosterId: number;
        points: number;
      }
    | undefined;

  if (awardsRevealed && slootbowl) {
    const winningRosterId =
      slootbowl.scoreA > slootbowl.scoreB
        ? slootbowl.rosterA
        : slootbowl.scoreB > slootbowl.scoreA
        ? slootbowl.rosterB
        : null;

    if (winningRosterId !== null) {
      const winningStarters =
        winningRosterId === slootbowl.rosterA
          ? slootbowl.startersA
          : slootbowl.startersB;

      const winningStarterPoints =
        winningRosterId === slootbowl.rosterA
          ? slootbowl.startersPointsA
          : slootbowl.startersPointsB;

      const candidates = winningStarters
        .map((playerId, index) => ({
          playerId,
          rosterId: winningRosterId,
          points:
            winningStarterPoints[index] ?? 0,
        }))
        .filter(
          (candidate) =>
            candidate.playerId &&
            candidate.playerId !== "0" &&
            Number.isFinite(candidate.points)
        );

      sbMvp = candidates.sort(
        (a, b) => b.points - a.points
      )[0];
    }
  }

  const getAwardRosterId = (
    result:
      | {
          playerId: string;
          points: number;
          rosters: Set<number>;
        }
      | {
          playerId: string;
          points: number;
          rosterId: number;
        }
  ) =>
    "rosterId" in result
      ? result.rosterId
      : Array.from(result.rosters)[0];

  // ========================================
  // GM AWARDS
  // ========================================

  // Do not calculate or expose official
  // GM winners until Week 17 completes.

  const regularSeasonGMAwards =
    awardsRevealed
      ? calculateRegularSeasonGMAwards(
          seasonData,
          historicalData
        )
      : [];

  const shitcuntAward =
    awardsRevealed
      ? await calculateShitcuntAward(
          seasonData
        )
      : null;

  const gmAwards: GMAwardResult[] =
    awardsRevealed
      ? [
          ...regularSeasonGMAwards,
          ...(shitcuntAward
            ? [shitcuntAward]
            : []),
        ]
      : [];

  const playoffWeeks = [15, 16, 17];

  return (
    <main>
      <header style={{ marginBottom: "28px" }}>
        <p
          style={{
            ...labelStyle(),
            marginBottom: "6px",
          }}
        >
          SFL HISTORY
        </p>

        <h1>{season} Season</h1>

        <p style={{ marginTop: "6px" }}>
          The Sluts Football League {season} season.
        </p>
      </header>

      {/* SLOOTBOWL CHAMPION */}

      <section style={cardStyle()}>
        <p style={labelStyle()}>SLOOTBOWL</p>

        {championship ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginTop: "12px",
            }}
          >
            <FranchiseLogo
              rosterId={championship.champion}
              size={80}
            />

            <div style={{ minWidth: 0, flex: 1 }}>
              <h2
                style={{
                  margin: "0 0 8px",
                  fontSize: "20px",
                }}
              >
                🏆{" "}
                {getFranchiseName(
                  championship.champion
                )}
              </h2>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "#9da7b3",
                  fontSize: "13px",
                }}
              >
                <span>Defeated</span>

                <FranchiseLogo
                  rosterId={championship.runnerUp}
                  size={30}
                />

                <span>
                  {getFranchiseName(
                    championship.runnerUp
                  )}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <>
            <h2
              style={{
                margin: "6px 0 4px",
                fontSize: "20px",
              }}
            >
              Slootbowl not yet played
            </h2>

            <p>
              {season} season is still underway.
            </p>
          </>
        )}
      </section>

      {/* CONFERENCE STANDINGS */}

      {[
        {
          name: "OBFC",
          teams: obfcStandings,
        },
        {
          name: "GPFC",
          teams: gpfcStandings,
        },
      ].map((conference) => (
        <section
          key={conference.name}
          style={{ marginTop: "30px" }}
        >
          <div style={{ marginBottom: "12px" }}>
            <p style={labelStyle()}>
              {standingsLabel}
            </p>

            <h2
              style={{
                margin: "4px 0 0",
                fontSize: "22px",
              }}
            >
              {conference.name}
            </h2>
          </div>

          <article style={cardStyle()}>
            {conference.teams.map(
              (team, index) => (
                <div
                  key={team.rosterId}
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "20px 44px minmax(0, 1fr) auto",
                    gap: "9px",
                    alignItems: "center",
                    padding: "12px 0",
                    borderBottom:
                      index ===
                      conference.teams.length - 1
                        ? "none"
                        : "1px solid #27303b",
                  }}
                >
                  <strong
                    style={{
                      color:
                        index === 0
                          ? "#f5f7fa"
                          : "#687384",
                    }}
                  >
                    {index + 1}
                  </strong>

                  <FranchiseLogo
                    rosterId={team.rosterId}
                    size={44}
                  />

                  <strong
                    style={{
                      fontSize: "13px",
                      minWidth: 0,
                      overflowWrap: "break-word",
                    }}
                  >
                    {getFranchiseName(
                      team.rosterId
                    )}
                  </strong>

                  <div
                    style={{
                      textAlign: "right",
                      fontSize: "13px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <strong>
                      {team.wins}-{team.losses}
                      {team.ties > 0
                        ? `-${team.ties}`
                        : ""}
                    </strong>

                    <div
                      style={{
                        color: "#687384",
                        marginTop: "3px",
                        fontSize: "11px",
                      }}
                    >
                      {team.points.toFixed(1)} PF
                    </div>
                  </div>
                </div>
              )
            )}
          </article>
        </section>
      ))}

      {/* PLAYER AWARDS */}

      <section style={{ marginTop: "30px" }}>
        <div style={{ marginBottom: "12px" }}>
          <p style={labelStyle()}>
            INDIVIDUAL AWARDS
          </p>

          <h2
            style={{
              margin: "4px 0 0",
              fontSize: "22px",
            }}
          >
            SFL honours
          </h2>
        </div>

        <article style={cardStyle()}>
          {[
            {
              award: "SFL MVP",
              icon: "👑",
              result: mvp,
            },
            {
              award: "SFL OPOY",
              icon: "⭐",
              result: opoy,
            },
            {
              award: "SFL ROY",
              icon: "🏅",
              result: roy,
            },
            {
              award: "Slootbowl MVP",
              icon: "🏆",
              result: sbMvp,
            },
          ].map((award, index, awards) => {
            const result = award.result;

            const player = result
              ? players[result.playerId]
              : null;

            return (
              <div
                key={award.award}
                style={{
                  padding: "14px 0",
                  borderBottom:
                    index === awards.length - 1
                      ? "none"
                      : "1px solid #27303b",
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: "700",
                    letterSpacing: "1.5px",
                    color: "#687384",
                  }}
                >
                  {award.icon} {award.award}
                </div>

                {!awardsRevealed ? (
                  <p
                    style={{
                      marginTop: "8px",
                      color: "#9da7b3",
                      fontSize: "13px",
                    }}
                  >
                    Awaiting Week 17 completion
                  </p>
                ) : result && player ? (
                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems: "center",
                      gap: "12px",
                      marginTop: "10px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      <FranchiseLogo
                        rosterId={getAwardRosterId(
                          result
                        )}
                        size={48}
                      />

                      <div style={{ minWidth: 0 }}>
                        <strong
                          style={{
                            display: "block",
                            fontSize: "16px",
                          }}
                        >
                          {getPlayerName(player)}
                        </strong>

                        <span
                          style={{
                            display: "block",
                            color: "#687384",
                            fontSize: "13px",
                            marginTop: "3px",
                          }}
                        >
                          {getFranchiseName(
                            getAwardRosterId(result)
                          )}
                        </span>
                      </div>
                    </div>

                    <strong
                      style={{
                        whiteSpace: "nowrap",
                        fontSize: "13px",
                      }}
                    >
                      {result.points.toFixed(1)} pts
                    </strong>
                  </div>
                ) : (
                  <p style={{ marginTop: "6px" }}>
                    Award not available
                  </p>
                )}
              </div>
            );
          })}
        </article>
      </section>

      {/* GM AWARDS */}

      <section style={{ marginTop: "30px" }}>
        <div style={{ marginBottom: "12px" }}>
          <p style={labelStyle()}>
            GENERAL MANAGERS
          </p>

          <h2
            style={{
              margin: "4px 0 0",
              fontSize: "22px",
            }}
          >
            GM honours
          </h2>
        </div>

        <article style={cardStyle()}>
          {GM_AWARDS.map((award, index) => {
            const result = gmAwards.find(
              (item) =>
                item.awardId === award.id
            );

            return (
              <div
                key={award.id}
                style={{
                  padding: "14px 0",
                  borderBottom:
                    index === GM_AWARDS.length - 1
                      ? "none"
                      : "1px solid #27303b",
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: "700",
                    letterSpacing: "1.2px",
                    color: "#687384",
                  }}
                >
                  {award.icon} {award.title}
                </div>

                {!awardsRevealed ? (
                  <p
                    style={{
                      marginTop: "8px",
                      color: "#9da7b3",
                      fontSize: "13px",
                    }}
                  >
                    Awaiting Week 17 completion
                  </p>
                ) : result ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      marginTop: "10px",
                    }}
                  >
                    <FranchiseLogo
                      rosterId={result.rosterId}
                      size={48}
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
                          fontSize: "16px",
                        }}
                      >
                        {GM_NAMES[
                          result.rosterId
                        ] ??
                          `GM ${result.rosterId}`}
                      </strong>

                      <span
                        style={{
                          display: "block",
                          color: "#687384",
                          fontSize: "13px",
                          marginTop: "3px",
                        }}
                      >
                        {getFranchiseName(
                          result.rosterId
                        )}
                      </span>

                      <span
                        style={{
                          display: "block",
                          color: "#9da7b3",
                          fontSize: "12px",
                          marginTop: "4px",
                        }}
                      >
                        {result.detail}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p
                    style={{
                      marginTop: "8px",
                      color: "#9da7b3",
                      fontSize: "13px",
                    }}
                  >
                    Award not available
                  </p>
                )}
              </div>
            );
          })}
        </article>
      </section>

      {/* ROAD TO THE SLOOTBOWL */}

      <section style={{ marginTop: "30px" }}>
        <div style={{ marginBottom: "12px" }}>
          <p style={labelStyle()}>PLAYOFFS</p>

          <h2
            style={{
              margin: "4px 0 0",
              fontSize: "22px",
            }}
          >
            Road to the Slootbowl
          </h2>
        </div>

        {playoffWeeks.map((week) => {
          const games = playoffMatchups.filter(
            (matchup) => matchup.week === week
          );

          if (games.length === 0) {
            return null;
          }

          const title =
            week === 15
              ? "Week 15 — First Round"
              : week === 16
              ? "Week 16 — Conference Championships"
              : "Week 17 — Slootbowl";

          return (
            <article
              key={week}
              style={cardStyle()}
            >
              <h3
                style={{
                  margin: "0 0 12px",
                  fontSize: "17px",
                }}
              >
                {title}
              </h3>

              {games.map((matchup, index) => {
                const completed =
                  matchup.isComplete === true &&
                  Number.isFinite(matchup.scoreA) &&
                  Number.isFinite(matchup.scoreB) &&
                  (matchup.scoreA > 0 ||
                    matchup.scoreB > 0);

                const aWon =
                  completed &&
                  matchup.scoreA > matchup.scoreB;

                const bWon =
                  completed &&
                  matchup.scoreB > matchup.scoreA;

                const aLost =
                  completed &&
                  matchup.scoreA < matchup.scoreB;

                const bLost =
                  completed &&
                  matchup.scoreB < matchup.scoreA;

                const aColor = aLost
                  ? "#687384"
                  : "#f5f7fa";

                const bColor = bLost
                  ? "#687384"
                  : "#f5f7fa";

                return (
                  <div
                    key={`${matchup.rosterA}-${matchup.rosterB}-${index}`}
                    style={{
                      padding: "12px 0",
                      borderBottom:
                        index === games.length - 1
                          ? "none"
                          : "1px solid #27303b",
                    }}
                  >
                    {!matchup.isComplete && (
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#9da7b3",
                          marginBottom: "8px",
                        }}
                      >
                        PROVISIONAL RESULT
                      </div>
                    )}

                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        alignItems: "center",
                        gap: "12px",
                        color: aColor,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          minWidth: 0,
                          flex: 1,
                        }}
                      >
                        <FranchiseLogo
                          rosterId={matchup.rosterA}
                          size={42}
                        />

                        <strong
                          style={{
                            fontWeight:
                              aWon ? 700 : 400,
                            fontSize: "13px",
                          }}
                        >
                          {getFranchiseName(
                            matchup.rosterA
                          )}
                        </strong>
                      </div>

                      <strong
                        style={{
                          whiteSpace: "nowrap",
                          color: aColor,
                        }}
                      >
                        {matchup.scoreA.toFixed(1)}
                      </strong>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        alignItems: "center",
                        gap: "12px",
                        marginTop: "10px",
                        color: bColor,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          minWidth: 0,
                          flex: 1,
                        }}
                      >
                        <FranchiseLogo
                          rosterId={matchup.rosterB}
                          size={42}
                        />

                        <strong
                          style={{
                            fontWeight:
                              bWon ? 700 : 400,
                            fontSize: "13px",
                          }}
                        >
                          {getFranchiseName(
                            matchup.rosterB
                          )}
                        </strong>
                      </div>

                      <strong
                        style={{
                          whiteSpace: "nowrap",
                          color: bColor,
                        }}
                      >
                        {matchup.scoreB.toFixed(1)}
                      </strong>
                    </div>
                  </div>
                );
              })}
            </article>
          );
        })}
      </section>
    </main>
  );
}
