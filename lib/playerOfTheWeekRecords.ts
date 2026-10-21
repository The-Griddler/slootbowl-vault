
import type {
  HistoricalSeason,
} from "./sleeper";

import {
  calculateConferencePlayerOfTheWeek,
} from "./weeklyRecap";

export type PlayerOfTheWeekAwardRecord = {
  season: string;
  week: number;
  conference: "OBFC" | "GPFC";
  playerId: string;
  rosterId: number;
};

export type PlayerOfTheWeekRecord = {
  playerId: string;
  season: string;
  awards: number;
  rosterIds: number[];
};

export type PlayerOfTheWeekRecords = {
  season: PlayerOfTheWeekRecord[];
  career: PlayerOfTheWeekRecord[];
};

export function calculatePlayerOfTheWeekRecords(
  historicalData: HistoricalSeason[]
): PlayerOfTheWeekRecords {
  const seasonRecords = new Map<
    string,
    PlayerOfTheWeekRecord
  >();

  const careerRecords = new Map<
    string,
    PlayerOfTheWeekRecord
  >();

  for (const seasonData of historicalData) {
    const season = seasonData.league.season;

    const weeklyResults =
      calculateConferencePlayerOfTheWeek(
        historicalData,
        season
      );

    for (const result of weeklyResults) {
      const winners = [
        result.obfcPlayerOfTheWeek,
        result.gpfcPlayerOfTheWeek,
      ].filter(
        (winner): winner is NonNullable<
          typeof winner
        > => winner !== null
      );

      for (const winner of winners) {
        const seasonKey =
          `${season}|${winner.playerId}`;

        let seasonRecord =
          seasonRecords.get(seasonKey);

        if (!seasonRecord) {
          seasonRecord = {
            playerId: winner.playerId,
            season,
            awards: 0,
            rosterIds: [],
          };

          seasonRecords.set(
            seasonKey,
            seasonRecord
          );
        }

        seasonRecord.awards++;

        if (
          !seasonRecord.rosterIds.includes(
            winner.rosterId
          )
        ) {
          seasonRecord.rosterIds.push(
            winner.rosterId
          );
        }

        let careerRecord =
          careerRecords.get(
            winner.playerId
          );

        if (!careerRecord) {
          careerRecord = {
            playerId: winner.playerId,
            season: "",
            awards: 0,
            rosterIds: [],
          };

          careerRecords.set(
            winner.playerId,
            careerRecord
          );
        }

        careerRecord.awards++;

        if (
          !careerRecord.rosterIds.includes(
            winner.rosterId
          )
        ) {
          careerRecord.rosterIds.push(
            winner.rosterId
          );
        }
      }
    }
  }

  return {
    season: Array.from(
      seasonRecords.values()
    ),
    career: Array.from(
      careerRecords.values()
    ),
  };
}
