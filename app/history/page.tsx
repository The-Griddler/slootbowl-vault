
import { getHistoricalData } from "../../lib/sleeper";
import { getPlayers, getPlayerName } from "../../lib/players";
import { getFranchiseName } from "../../lib/franchises";
import HistoryTabs from "./HistoryTabs";

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

const FRANCHISE_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function isCompletedMatchup(matchup: {
  isComplete: boolean;
  scoreA: number;
  scoreB: number;
}) {
  return (
    matchup.isComplete === true &&
    Number.isFinite(matchup.scoreA) &&
    Number.isFinite(matchup.scoreB) &&
    matchup.scoreA >= 0 &&
    matchup.scoreB >= 0 &&
    (matchup.scoreA > 0 || matchup.scoreB > 0)
  );
}

export default async function HistoryPage() {
  const [historicalData, players] = await Promise.all([
    getHistoricalData(),
    getPlayers(),
  ]);

  const seasons = historicalData
    .map((item) => item.league.season)
    .sort((a, b) => Number(b) - Number(a))
    .slice(0, 5);

  const franchiseNames: Record<number, string> = {};

  for (const rosterId of FRANCHISE_IDS) {
    franchiseNames[rosterId] = getFranchiseName(rosterId);
  }

  const mvpRecords: Array<{
    season: string;
    playerName: string;
    franchiseName: string;
    points: number;
  }> = [];

  for (const seasonData of historicalData) {
    const season = seasonData.league.season;

    const completedRegularMatchups =
      seasonData.matchups.filter(
        (matchup) =>
          matchup.phase === "Regular Season" &&
          isCompletedMatchup(matchup)
      );

    // The MVP cannot be announced until
    // every regular-season week is complete.
    const regularSeasonComplete = Array.from(
      { length: 14 },
      (_, index) => index + 1
    ).every((week) => {
      const weekly = completedRegularMatchups.filter(
        (matchup) => matchup.week === week
      );

      if (weekly.length !== 5) {
        return false;
      }

      const teams = new Set<number>();

      for (const matchup of weekly) {
        teams.add(matchup.rosterA);
        teams.add(matchup.rosterB);
      }

      return teams.size === 10;
    });

    if (!regularSeasonComplete) {
      continue;
    }

    // Match the individual Season Archive's
    // eligibility rule: the MVP must have
    // played for a main-playoff franchise.
    const playoffTeams = new Set<number>();

    for (const matchup of seasonData.matchups) {
      if (
        matchup.phase === "Main Playoffs" &&
        isCompletedMatchup(matchup)
      ) {
        playoffTeams.add(matchup.rosterA);
        playoffTeams.add(matchup.rosterB);
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
        ...matchup.startersA.map((playerId, index) => ({
          playerId,
          rosterId: matchup.rosterA,
          points: matchup.startersPointsA[index] ?? 0,
        })),
        ...matchup.startersB.map((playerId, index) => ({
          playerId,
          rosterId: matchup.rosterB,
          points: matchup.startersPointsB[index] ?? 0,
        })),
      ];

      for (const performance of performances) {
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

        if (existing) {
          existing.points += performance.points;
          existing.rosters.add(performance.rosterId);
        } else {
          playerTotals.set(performance.playerId, {
            playerId: performance.playerId,
            points: performance.points,
            rosters: new Set([performance.rosterId]),
          });
        }
      }
    }

    const mvp = Array.from(playerTotals.values())
      .filter((player) =>
        Array.from(player.rosters).some((rosterId) =>
          playoffTeams.has(rosterId)
        )
      )
      .sort((a, b) => b.points - a.points)[0];

    if (!mvp) {
      continue;
    }

    const player = players[mvp.playerId];

    if (!player) {
      continue;
    }

    const franchiseRosterId =
      Array.from(mvp.rosters).find((rosterId) =>
        playoffTeams.has(rosterId)
      ) ?? Array.from(mvp.rosters)[0];

    mvpRecords.push({
      season,
      playerName: getPlayerName(player),
      franchiseName: getFranchiseName(franchiseRosterId),
      points: mvp.points,
    });
  }

  return (
    <HistoryTabs
      seasons={seasons}
      champions={SLOOTBOWLS}
      conferenceChampions={CONFERENCE_CHAMPIONS}
      mvpRecords={mvpRecords}
      franchiseNames={franchiseNames}
    />
  );
}
