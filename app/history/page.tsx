
import { getHistoricalData } from "../../lib/sleeper";
import { getPlayers, getPlayerName } from "../../lib/players";
import { getFranchiseName } from "../../lib/franchises";
import HistoryTabs from "./HistoryTabs";

import type {
  HistoricalMatchup,
  HistoricalSeason,
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

// Manager names are kept separate from franchise
// names because GM awards belong to the managers.
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

    // Do not declare regular-season awards
    // before all 14 weeks are complete.
    if (!seasonStats.complete) {
      continue;
    }

    // GM of the Year:
    // Highest regular-season points for.
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

    // Lubed Up, Dicked Down:
    // Highest regular-season points against.
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

    // One Week Wonder:
    // Highest single team score in Weeks 1-14.
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

    // Most Improved GM:
    // Compare regular-season wins against
    // the immediately preceding season.
    //
    // The current season's GM of the Year
    // is ineligible for this award.
    //
    // 2022 is handled separately below.
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

  // Special inaugural honour agreed for 2022.
  if (
    statsBySeason.has("2022")
  ) {
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

    // Only main-playoff franchises are
    // eligible for SFL MVP.
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

  const gmAwards =
    calculateGMAwards(
      historicalData
    );

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
