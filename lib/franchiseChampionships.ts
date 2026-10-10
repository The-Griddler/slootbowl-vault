
import {
  getMatchups,
  type HistoricalSeason,
  type SleeperMatchup,
} from "./sleeper";

import {
  getSlootbowlResults,
} from "./slootbowlResults";

type WeeklyRoster = SleeperMatchup & {
  players?: string[] | null;
};

export type FranchiseChampionship = {
  playerId: string;
  rosterId: number;
  championships: number;
  championshipSeasons: string[];
};

export async function getFranchiseChampionships(
  historicalSeasons: HistoricalSeason[],
  completedThroughSeason: number
): Promise<FranchiseChampionship[]> {
  const results = await getSlootbowlResults(
    historicalSeasons,
    completedThroughSeason
  );

  const leagueIds = new Map(
    historicalSeasons.map((season) => [
      season.league.season,
      season.league.league_id,
    ])
  );

  const championships = new Map<
    string,
    {
      playerId: string;
      rosterId: number;
      seasons: Set<string>;
    }
  >();

  for (const result of results) {
    const leagueId = leagueIds.get(
      result.season
    );

    if (!leagueId) continue;

    const weeklyMatchups = await getMatchups(
      result.week,
      leagueId
    );

    const winningRoster = weeklyMatchups.find(
      (matchup) =>
        matchup.roster_id ===
        result.championRosterId
    ) as WeeklyRoster | undefined;

    if (
      !winningRoster ||
      !Array.isArray(winningRoster.players)
    ) {
      continue;
    }

    const uniquePlayers = new Set(
      winningRoster.players.filter(
        (playerId) =>
          typeof playerId === "string" &&
          playerId.length > 0 &&
          playerId !== "0"
      )
    );

    for (const playerId of uniquePlayers) {
      const key =
        `${result.championRosterId}:${playerId}`;

      let championship = championships.get(key);

      if (!championship) {
        championship = {
          playerId,
          rosterId: result.championRosterId,
          seasons: new Set<string>(),
        };

        championships.set(
          key,
          championship
        );
      }

      championship.seasons.add(
        result.season
      );
    }
  }

  return [...championships.values()]
    .map((championship) => {
      const championshipSeasons = [
        ...championship.seasons,
      ].sort();

      return {
        playerId: championship.playerId,
        rosterId: championship.rosterId,
        championships:
          championshipSeasons.length,
        championshipSeasons,
      };
    })
    .sort(
      (a, b) =>
        b.championships - a.championships ||
        a.rosterId - b.rosterId ||
        a.playerId.localeCompare(
          b.playerId
        )
    );
}
