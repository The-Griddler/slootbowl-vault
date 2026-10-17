
import { getHistoricalData } from "../../lib/sleeper";
import { getPlayers, getPlayerName } from "../../lib/players";
import { getFranchiseName } from "../../lib/franchises";
import HistoryTabs from "./HistoryTabs";

import type {
  HistoricalMatchup,
  HistoricalSeason,
  SleeperBracketMatch,
} from "../../lib/sleeper";

import type {
  GMAwardRecord,
} from "./HistoryTabs";

const SLOOTBOWLS = [
  { season: "2025", champion: 10, runnerUp: 9 },
  { season: "2024", champion: 10, runnerUp: 4 },
  { season: "2023", champion: 4, runnerUp: 2 },
  { season: "2022", champion: 2, runnerUp: 8 },
];

const CONFERENCE_CHAMPIONS = [
  { season: "2025", obfc: 9, gpfc: 10 },
  { season: "2024", obfc: 4, gpfc: 10 },
  { season: "2023", obfc: 4, gpfc: 2 },
  { season: "2022", obfc: 8, gpfc: 2 },
];

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

function isCompletedMatchup(
  matchup: HistoricalMatchup
): boolean {
  return (
    matchup.isComplete === true &&
    Number.isFinite(matchup.scoreA) &&
    Number.isFinite(matchup.scoreB) &&
    matchup.scoreA >= 0 &&
    matchup.scoreB >= 0 &&
    (matchup.scoreA > 0 ||
      matchup.scoreB > 0)
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

function buildSeasonStats(
  seasonData: HistoricalSeason
): SeasonStats {
  const season = seasonData.league.season;

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
      teamA.wins += 1;
      teamB.losses += 1;
    } else if (
      matchup.scoreB > matchup.scoreA
    ) {
      teamB.wins += 1;
      teamA.losses += 1;
    } else {
      teamA.ties += 1;
      teamB.ties += 1;
    }
  }

  return {
    season,
    complete: isRegularSeasonComplete(
      seasonData.matchups
    ),
    teams: Array.from(teamMap.values()),
    weeklyScores,
  };
}

function makeGMAward(
  season: string,
  awardId: string,
  rosterId: number,
  detail: string
): GMAwardRecord {
  return {
    season,
    awardId,
    winnerName:
      GM_NAMES[rosterId] ??
      `GM ${rosterId}`,
    franchiseName:
      getFranchiseName(rosterId),
    detail,
  };
}

function calculateGMAwards(
  historicalData: HistoricalSeason[]
): GMAwardRecord[] {
  const allStats = historicalData.map(
    buildSeasonStats
  );

  const statsBySeason = new Map(
    allStats.map((stats) => [
      stats.season,
      stats,
    ])
  );

  const awards: GMAwardRecord[] = [];

  for (const seasonStats of allStats) {
    const season = seasonStats.season;

    if (!seasonStats.complete) {
      continue;
    }

    // GM of the Year
    const pointsForRanking = [
      ...seasonStats.teams,
    ].sort(
      (a, b) =>
        b.pointsFor - a.pointsFor ||
        a.rosterId - b.rosterId
    );

    const gmOfTheYear =
      pointsForRanking[0];

    if (gmOfTheYear) {
      awards.push(
        makeGMAward(
          season,
          "gm",
          gmOfTheYear.rosterId,
          `${gmOfTheYear.pointsFor.toFixed(2)} points scored`
        )
      );
    }

    // Lubed Up, Dicked Down
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
      awards.push(
        makeGMAward(
          season,
          "lubed",
          mostPointsAgainst.rosterId,
          `${mostPointsAgainst.pointsAgainst.toFixed(2)} points conceded`
        )
      );
    }

    // One Week Wonder
    const highestWeeklyScore = [
      ...seasonStats.weeklyScores,
    ].sort(
      (a, b) =>
        b.points - a.points ||
        a.week - b.week ||
        a.rosterId - b.rosterId
    )[0];

    if (highestWeeklyScore) {
      awards.push(
        makeGMAward(
          season,
          "wonder",
          highestWeeklyScore.rosterId,
          `${highestWeeklyScore.points.toFixed(2)} points — Week ${highestWeeklyScore.week}`
        )
      );
    }

    // Most Improved GM
    if (season !== "2022") {
      const previousSeason = String(
        Number(season) - 1
      );

      const previousStats =
        statsBySeason.get(previousSeason);

      if (previousStats?.complete) {
        const previousWins = new Map(
          previousStats.teams.map(
            (team) => [
              team.rosterId,
              team.wins,
            ]
          )
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
                previousWins.get(
                  team.rosterId
                ) ?? 0,
              currentWins: team.wins,
              improvement:
                team.wins -
                (previousWins.get(
                  team.rosterId
                ) ?? 0),
            }))
            .sort(
              (a, b) =>
                b.improvement -
                  a.improvement ||
                b.currentWins -
                  a.currentWins ||
                a.rosterId -
                  b.rosterId
            );

        const mostImproved =
          improvements[0];

        if (mostImproved) {
          const change =
            mostImproved.improvement;

          const changeLabel =
            change > 0
              ? `+${change}`
              : String(change);

          awards.push(
            makeGMAward(
              season,
              "improved",
              mostImproved.rosterId,
              `${mostImproved.previousWins} → ${mostImproved.currentWins} wins (${changeLabel})`
            )
          );
        }
      }
    }
  }

  // Inaugural honorary award
  if (statsBySeason.has("2022")) {
    awards.push({
      season: "2022",
      awardId: "improved",
      winnerName: "Ollie Payne",
      franchiseName:
        getFranchiseName(7),
      detail: "Inaugural honorary winner",
    });
  }

  return awards;
}

/**
 * Retrieve the actual consolation bracket
 * for one historical Sleeper league.
 *
 * The bracket identifies the Toilet Bowl
 * final using placement p === 1.
 */
async function getLosersBracket(
  leagueId: string
): Promise<SleeperBracketMatch[]> {
  const response = await fetch(
    `https://api.sleeper.app/v1/league/${leagueId}/losers_bracket`,
    {
      next: {
        revalidate: 300,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to load losers bracket for league ${leagueId}`
    );
  }

  return response.json();
}

/**
 * Shitcunt of the Year:
 *
 * - Toilet Bowl final takes place in Week 16
 * - Find the final using p === 1
 * - Ignore consolation placement matches
 * - Require the actual matchup to be complete
 * - Confirm the recorded loser against the score
 *
 * Toilet Bowl results are kept separate
 * from official main-playoff records.
 */
async function calculateShitcuntAwards(
  historicalData: HistoricalSeason[]
): Promise<GMAwardRecord[]> {
  const awards = await Promise.all(
    historicalData.map(async (seasonData) => {
      const season =
        seasonData.league.season;

      const week16ToiletBowl =
        seasonData.matchups.filter(
          (matchup) =>
            matchup.week === 16 &&
            matchup.phase === "Toilet Bowl" &&
            isCompletedMatchup(matchup)
        );

      // No completed Week 16 consolation
      // games means no award yet.
      if (
        week16ToiletBowl.length === 0
      ) {
        return null;
      }

      const bracket =
        await getLosersBracket(
          seasonData.league.league_id
        );

      // p: 1 identifies the Toilet Bowl
      // final; p: 3 is a placement game.
      const final = bracket.find(
        (match) =>
          match.r === 2 &&
          match.p === 1 &&
          match.t1 !== null &&
          match.t2 !== null &&
          match.l !== null &&
          match.w !== null
      );

      if (
        !final ||
        final.t1 === null ||
        final.t2 === null ||
        final.l === null ||
        final.w === null
      ) {
        return null;
      }

      // Verify that the bracket final
      // corresponds to a completed Week 16
      // matchup, not another consolation game.
      const actualMatchup =
        week16ToiletBowl.find(
          (matchup) =>
            (
              matchup.rosterA === final.t1 &&
              matchup.rosterB === final.t2
            ) ||
            (
              matchup.rosterA === final.t2 &&
              matchup.rosterB === final.t1
            )
        );

      if (!actualMatchup) {
        return null;
      }

      // Don't award a tied or inconsistent
      // result. Sleeper's bracket loser
      // must agree with the matchup score.
      if (
        actualMatchup.scoreA ===
        actualMatchup.scoreB
      ) {
        return null;
      }

      const scoreLoser =
        actualMatchup.scoreA <
        actualMatchup.scoreB
          ? actualMatchup.rosterA
          : actualMatchup.rosterB;

      const scoreWinner =
        actualMatchup.scoreA >
        actualMatchup.scoreB
          ? actualMatchup.rosterA
          : actualMatchup.rosterB;

      if (
        scoreLoser !== final.l ||
        scoreWinner !== final.w
      ) {
        return null;
      }

      return makeGMAward(
        season,
        "shitcunt",
        final.l,
        "Toilet Bowl loser — Week 16"
      );
    })
  );

  return awards.filter(
    (award): award is GMAwardRecord =>
      award !== null
  );
}

export default async function HistoryPage() {
  const [
    historicalData,
    players,
  ] = await Promise.all([
    getHistoricalData(),
    getPlayers(),
  ]);

  const seasons = historicalData
    .map(
      (item) => item.league.season
    )
    .sort(
      (a, b) =>
        Number(b) - Number(a)
    )
    .slice(0, 5);

  const franchiseNames: Record<
    number,
    string
  > = {};

  for (const rosterId of FRANCHISE_IDS) {
    franchiseNames[rosterId] =
      getFranchiseName(rosterId);
  }

  const mvpRecords: Array<{
    season: string;
    playerName: string;
    franchiseName: string;
    points: number;
  }> = [];

  for (const seasonData of historicalData) {
    const season =
      seasonData.league.season;

    const completedRegularMatchups =
      seasonData.matchups.filter(
        (matchup) =>
          matchup.phase ===
            "Regular Season" &&
          isCompletedMatchup(matchup)
      );

    if (
      !isRegularSeasonComplete(
        seasonData.matchups
      )
    ) {
      continue;
    }

    const playoffTeams =
      new Set<number>();

    for (const matchup of seasonData.matchups) {
      if (
        matchup.phase ===
          "Main Playoffs" &&
        isCompletedMatchup(matchup)
      ) {
        playoffTeams.add(
          matchup.rosterA
        );
        playoffTeams.add(
          matchup.rosterB
        );
      }
    }

    const playerTotals = new Map<
      string,
      {
        playerId: string;
        points: number;
        rosters: Set<number>;
      }
    >();

    for (const matchup of completedRegularMatchups) {
      const performances = [
        ...matchup.startersA.map(
          (playerId, index) => ({
            playerId,
            rosterId:
              matchup.rosterA,
            points:
              matchup.startersPointsA[
                index
              ] ?? 0,
          })
        ),
        ...matchup.startersB.map(
          (playerId, index) => ({
            playerId,
            rosterId:
              matchup.rosterB,
            points:
              matchup.startersPointsB[
                index
              ] ?? 0,
          })
        ),
      ];

      for (const performance of performances) {
        if (
          !performance.playerId ||
          performance.playerId ===
            "0" ||
          !Number.isFinite(
            performance.points
          )
        ) {
          continue;
        }

        const existing =
          playerTotals.get(
            performance.playerId
          );

        if (existing) {
          existing.points +=
            performance.points;

          existing.rosters.add(
            performance.rosterId
          );
        } else {
          playerTotals.set(
            performance.playerId,
            {
              playerId:
                performance.playerId,
              points:
                performance.points,
              rosters: new Set([
                performance.rosterId,
              ]),
            }
          );
        }
      }
    }

    const mvp = Array.from(
      playerTotals.values()
    )
      .filter((player) =>
        Array.from(
          player.rosters
        ).some((rosterId) =>
          playoffTeams.has(
            rosterId
          )
        )
      )
      .sort(
        (a, b) =>
          b.points - a.points
      )[0];

    if (!mvp) {
      continue;
    }

    const player =
      players[mvp.playerId];

    if (!player) {
      continue;
    }

    const franchiseRosterId =
      Array.from(
        mvp.rosters
      ).find((rosterId) =>
        playoffTeams.has(
          rosterId
        )
      ) ??
      Array.from(
        mvp.rosters
      )[0];

    mvpRecords.push({
      season,
      playerName:
        getPlayerName(player),
      franchiseName:
        getFranchiseName(
          franchiseRosterId
        ),
      points: mvp.points,
    });
  }

  const [
    regularSeasonGMAwards,
    shitcuntAwards,
  ] = await Promise.all([
    Promise.resolve(
      calculateGMAwards(
        historicalData
      )
    ),
    calculateShitcuntAwards(
      historicalData
    ),
  ]);

  const gmAwards = [
    ...regularSeasonGMAwards,
    ...shitcuntAwards,
  ];

  return (
    <HistoryTabs
      seasons={seasons}
      champions={SLOOTBOWLS}
      conferenceChampions={
        CONFERENCE_CHAMPIONS
      }
      mvpRecords={mvpRecords}
      franchiseNames={
        franchiseNames
      }
      gmAwards={gmAwards}
    />
  );
}
