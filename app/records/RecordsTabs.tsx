
import {
  getHistoricalData,
  type HistoricalSeason,
} from "./sleeper";

import {
  getPlayers,
  getPlayerName,
  getPlayerPosition,
  type SleeperPlayer,
} from "./players";

export type PlayerCompetition =
  | "regularSeason"
  | "mainPlayoffs";

export type PlayerRecordPhase =
  | "Regular Season"
  | "Main Playoffs";

export type PlayerWeeklyPerformance = {
  season: string;
  week: number;
  phase: PlayerRecordPhase;
  rosterId: number;
  playerId: string;
  points: number;
};

export type PlayerSeasonRecord = {
  season: string;
  playerId: string;
  points: number;
  starts: number;
  weeks: PlayerWeeklyPerformance[];
};

export type PlayerCareerRecord = {
  playerId: string;
  points: number;
  starts: number;
  seasons: string[];
  weeks: PlayerWeeklyPerformance[];
};

export type FranchisePlayerRecord = {
  rosterId: number;
  playerId: string;
  points: number;
  starts: number;
  weeks: PlayerWeeklyPerformance[];
};

export type PlayerGameRecord = {
  season: string;
  week: number;
  phase: PlayerRecordPhase;
  playerId: string;
  rosterId: number;
  points: number;
};

export type PlayerRecordGroup = {
  weekly: PlayerWeeklyPerformance[];
  games: PlayerGameRecord[];
  seasons: PlayerSeasonRecord[];
  careers: PlayerCareerRecord[];
  franchises: FranchisePlayerRecord[];
};

export type PlayerRecordIdentity = {
  playerId: string;
  name: string;
  position: string;
  team: string | null;
};

// --------------------------------------------------
// PLAYER CHAMPIONSHIP HONOURS
// --------------------------------------------------

export type PlayerChampionshipAppearance = {
  season: string;
  week: number;
  rosterId: number;
  started: boolean;
};

export type PlayerChampionshipRecord = {
  playerId: string;

  slootbowlRings: number;
  starterRings: number;
  benchRings: number;

  slootbowlAppearances: number;
  conferenceChampionshipAppearances: number;

  ringSeasons: string[];
  slootbowlSeasons: string[];
  conferenceChampionshipSeasons: string[];

  ringAppearances: PlayerChampionshipAppearance[];
  slootbowlGames: PlayerChampionshipAppearance[];
  conferenceChampionshipGames: PlayerChampionshipAppearance[];

  rosterIds: number[];
};

export type PlayerRecords =
  PlayerRecordGroup & {
    competitions: {
      regularSeason: PlayerRecordGroup;
      mainPlayoffs: PlayerRecordGroup;
    };

    championshipRecords: PlayerChampionshipRecord[];

    players: Record<
      string,
      PlayerRecordIdentity
    >;

    availableSeasons: string[];

    completedSeasons: {
      regularSeason: string[];
      mainPlayoffs: string[];
    };
  };

const REGULAR_SEASON_WEEKS = 14;
const MATCHUPS_PER_WEEK = 5;

const CONFERENCE_CHAMPIONSHIP_WEEK = 16;
const SLOOTBOWL_WEEK = 17;

function roundPoints(value: number): number {
  return Math.round(
    (value + Number.EPSILON) * 100
  ) / 100;
}

function validMatchup(
  matchup: HistoricalSeason["matchups"][number]
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

function validPhase(
  phase: string
): phase is PlayerRecordPhase {
  return (
    phase === "Regular Season" ||
    phase === "Main Playoffs"
  );
}

function competitionPhase(
  competition: PlayerCompetition
): PlayerRecordPhase {
  return competition === "regularSeason"
    ? "Regular Season"
    : "Main Playoffs";
}

function addStarters(
  performances: PlayerWeeklyPerformance[],
  matchup: HistoricalSeason["matchups"][number],
  rosterId: number,
  starters: string[],
  starterPoints: number[]
) {
  for (
    let index = 0;
    index < starters.length;
    index++
  ) {
    const playerId = starters[index];
    const points = starterPoints[index];

    if (
      !playerId ||
      playerId === "0" ||
      !Number.isFinite(points)
    ) {
      continue;
    }

    performances.push({
      season: matchup.season,
      week: matchup.week,
      phase:
        matchup.phase as PlayerRecordPhase,
      rosterId,
      playerId,
      points: roundPoints(points),
    });
  }
}

function buildWeeklyPerformances(
  historicalData: HistoricalSeason[]
): PlayerWeeklyPerformance[] {
  const performances: PlayerWeeklyPerformance[] =
    [];

  for (const season of historicalData) {
    for (const matchup of season.matchups) {
      if (
        !validPhase(matchup.phase) ||
        !validMatchup(matchup)
      ) {
        continue;
      }

      addStarters(
        performances,
        matchup,
        matchup.rosterA,
        matchup.startersA,
        matchup.startersPointsA
      );

      addStarters(
        performances,
        matchup,
        matchup.rosterB,
        matchup.startersB,
        matchup.startersPointsB
      );
    }
  }

  return performances.sort(
    (a, b) =>
      Number(a.season) -
        Number(b.season) ||
      a.week - b.week ||
      a.rosterId - b.rosterId ||
      a.playerId.localeCompare(b.playerId)
  );
}

function buildGameRecords(
  weekly: PlayerWeeklyPerformance[]
): PlayerGameRecord[] {
  return weekly.map(performance => ({
    season: performance.season,
    week: performance.week,
    phase: performance.phase,
    playerId: performance.playerId,
    rosterId: performance.rosterId,
    points: performance.points,
  }));
}

function buildSeasonRecords(
  weekly: PlayerWeeklyPerformance[]
): PlayerSeasonRecord[] {
  const records = new Map<
    string,
    PlayerSeasonRecord
  >();

  for (const performance of weekly) {
    const key = [
      performance.season,
      performance.playerId,
    ].join("|");

    let record = records.get(key);

    if (!record) {
      record = {
        season: performance.season,
        playerId: performance.playerId,
        points: 0,
        starts: 0,
        weeks: [],
      };

      records.set(key, record);
    }

    record.points = roundPoints(
      record.points + performance.points
    );

    record.starts++;
    record.weeks.push(performance);
  }

  return Array.from(records.values());
}

function buildCareerRecords(
  weekly: PlayerWeeklyPerformance[]
): PlayerCareerRecord[] {
  const records = new Map<
    string,
    PlayerCareerRecord
  >();

  for (const performance of weekly) {
    let record = records.get(
      performance.playerId
    );

    if (!record) {
      record = {
        playerId: performance.playerId,
        points: 0,
        starts: 0,
        seasons: [],
        weeks: [],
      };

      records.set(
        performance.playerId,
        record
      );
    }

    record.points = roundPoints(
      record.points + performance.points
    );

    record.starts++;
    record.weeks.push(performance);

    if (
      !record.seasons.includes(
        performance.season
      )
    ) {
      record.seasons.push(
        performance.season
      );
    }
  }

  return Array.from(records.values());
}

function buildFranchiseRecords(
  weekly: PlayerWeeklyPerformance[]
): FranchisePlayerRecord[] {
  const records = new Map<
    string,
    FranchisePlayerRecord
  >();

  for (const performance of weekly) {
    const key = [
      performance.rosterId,
      performance.playerId,
    ].join("|");

    let record = records.get(key);

    if (!record) {
      record = {
        rosterId: performance.rosterId,
        playerId: performance.playerId,
        points: 0,
        starts: 0,
        weeks: [],
      };

      records.set(key, record);
    }

    record.points = roundPoints(
      record.points + performance.points
    );

    record.starts++;
    record.weeks.push(performance);
  }

  return Array.from(records.values());
}

function buildRecordGroup(
  weekly: PlayerWeeklyPerformance[]
): PlayerRecordGroup {
  return {
    weekly,
    games: buildGameRecords(weekly),
    seasons: buildSeasonRecords(weekly),
    careers: buildCareerRecords(weekly),
    franchises: buildFranchiseRecords(weekly),
  };
}

// --------------------------------------------------
// CHAMPIONSHIP RECORD CALCULATIONS
// --------------------------------------------------

function validPlayerIds(
  players: string[]
): string[] {
  return Array.from(
    new Set(
      players.filter(
        playerId =>
          Boolean(playerId) &&
          playerId !== "0"
      )
    )
  );
}

function buildChampionshipRecords(
  historicalData: HistoricalSeason[]
): PlayerChampionshipRecord[] {
  const records = new Map<
    string,
    PlayerChampionshipRecord
  >();

  function getRecord(
    playerId: string
  ): PlayerChampionshipRecord {
    let record = records.get(playerId);

    if (!record) {
      record = {
        playerId,

        slootbowlRings: 0,
        starterRings: 0,
        benchRings: 0,

        slootbowlAppearances: 0,
        conferenceChampionshipAppearances: 0,

        ringSeasons: [],
        slootbowlSeasons: [],
        conferenceChampionshipSeasons: [],

        ringAppearances: [],
        slootbowlGames: [],
        conferenceChampionshipGames: [],

        rosterIds: [],
      };

      records.set(playerId, record);
    }

    return record;
  }

  function addRoster(
    record: PlayerChampionshipRecord,
    rosterId: number
  ) {
    if (!record.rosterIds.includes(rosterId)) {
      record.rosterIds.push(rosterId);
    }
  }

  function addSeason(
    seasons: string[],
    season: string
  ) {
    if (!seasons.includes(season)) {
      seasons.push(season);
    }
  }

  function addStartingAppearance(
    season: string,
    week: number,
    rosterId: number,
    starters: string[],
    competition:
      | "slootbowl"
      | "conference"
  ) {
    for (const playerId of validPlayerIds(starters)) {
      const record = getRecord(playerId);

      const appearance: PlayerChampionshipAppearance = {
        season,
        week,
        rosterId,
        started: true,
      };

      if (competition === "slootbowl") {
        record.slootbowlAppearances++;
        record.slootbowlGames.push(appearance);

        addSeason(
          record.slootbowlSeasons,
          season
        );
      } else {
        record.conferenceChampionshipAppearances++;

        record.conferenceChampionshipGames.push(
          appearance
        );

        addSeason(
          record.conferenceChampionshipSeasons,
          season
        );
      }

      addRoster(record, rosterId);
    }
  }

  for (const season of historicalData) {
    const championshipGames =
      season.matchups.filter(
        matchup =>
          matchup.phase === "Main Playoffs" &&
          validMatchup(matchup) &&
          (
            matchup.week ===
              CONFERENCE_CHAMPIONSHIP_WEEK ||
            matchup.week ===
              SLOOTBOWL_WEEK
          )
      );

    for (const matchup of championshipGames) {
      if (
        matchup.week ===
        CONFERENCE_CHAMPIONSHIP_WEEK
      ) {
        addStartingAppearance(
          matchup.season,
          matchup.week,
          matchup.rosterA,
          matchup.startersA,
          "conference"
        );

        addStartingAppearance(
          matchup.season,
          matchup.week,
          matchup.rosterB,
          matchup.startersB,
          "conference"
        );

        continue;
      }

      if (
        matchup.week !== SLOOTBOWL_WEEK
      ) {
        continue;
      }

      // Both Slootbowl finalists earn
      // a starting appearance.

      addStartingAppearance(
        matchup.season,
        matchup.week,
        matchup.rosterA,
        matchup.startersA,
        "slootbowl"
      );

      addStartingAppearance(
        matchup.season,
        matchup.week,
        matchup.rosterB,
        matchup.startersB,
        "slootbowl"
      );

      // A tied championship score cannot
      // independently establish a winner.

      if (matchup.scoreA === matchup.scoreB) {
        continue;
      }

      const winnerIsA =
        matchup.scoreA > matchup.scoreB;

      const winningRosterId = winnerIsA
        ? matchup.rosterA
        : matchup.rosterB;

      const winningStarters = winnerIsA
        ? matchup.startersA
        : matchup.startersB;

      const winningPlayers = winnerIsA
        ? matchup.playersA
        : matchup.playersB;

      // The historical matchup's players
      // array contains both starters and
      // bench players. Include starters
      // explicitly as a safeguard against
      // incomplete player arrays.

      const championshipRoster =
        validPlayerIds([
          ...(winningPlayers ?? []),
          ...winningStarters,
        ]);

      const startingIds =
        new Set(
          validPlayerIds(winningStarters)
        );

      for (const playerId of championshipRoster) {
        const record = getRecord(playerId);

        const started =
          startingIds.has(playerId);

        record.slootbowlRings++;

        if (started) {
          record.starterRings++;
        } else {
          record.benchRings++;
        }

        record.ringAppearances.push({
          season: matchup.season,
          week: matchup.week,
          rosterId: winningRosterId,
          started,
        });

        addSeason(
          record.ringSeasons,
          matchup.season
        );

        addRoster(
          record,
          winningRosterId
        );
      }
    }
  }

  return Array.from(records.values()).sort(
    (a, b) =>
      b.slootbowlRings -
        a.slootbowlRings ||
      b.slootbowlAppearances -
        a.slootbowlAppearances ||
      b.conferenceChampionshipAppearances -
        a.conferenceChampionshipAppearances ||
      a.playerId.localeCompare(b.playerId)
  );
}

// --------------------------------------------------
// COMPLETED SEASONS
// --------------------------------------------------

function isRegularSeasonComplete(
  season: HistoricalSeason
): boolean {
  for (
    let week = 1;
    week <= REGULAR_SEASON_WEEKS;
    week++
  ) {
    const matchups = season.matchups.filter(
      matchup =>
        matchup.week === week &&
        matchup.phase === "Regular Season" &&
        validMatchup(matchup)
    );

    if (
      matchups.length !== MATCHUPS_PER_WEEK
    ) {
      return false;
    }

    const rosterIds = new Set<number>();

    for (const matchup of matchups) {
      rosterIds.add(matchup.rosterA);
      rosterIds.add(matchup.rosterB);
    }

    if (rosterIds.size !== 10) {
      return false;
    }
  }

  return true;
}

function arePlayoffsComplete(
  season: HistoricalSeason
): boolean {
  return season.matchups.some(
    matchup =>
      matchup.week === 17 &&
      matchup.phase === "Main Playoffs" &&
      validMatchup(matchup)
  );
}

// --------------------------------------------------
// PLAYER DIRECTORY
// --------------------------------------------------

function buildPlayerDirectory(
  weekly: PlayerWeeklyPerformance[],
  sleeperPlayers: Record<
    string,
    SleeperPlayer
  >,
  championshipRecords: PlayerChampionshipRecord[] = []
): Record<
  string,
  PlayerRecordIdentity
> {
  const directory: Record<
    string,
    PlayerRecordIdentity
  > = {};

  const ids = new Set([
    ...weekly.map(
      record => record.playerId
    ),
    ...championshipRecords.map(
      record => record.playerId
    ),
  ]);

  for (const playerId of ids) {
    const player =
      sleeperPlayers[playerId] ?? null;

    directory[playerId] = {
      playerId,
      name: player
        ? getPlayerName(player)
        : `Player ${playerId}`,
      position:
        getPlayerPosition(player).toUpperCase(),
      team: player?.team ?? null,
    };
  }

  return directory;
}

// --------------------------------------------------
// EXISTING RECORD FILTERS
// --------------------------------------------------

export function filterPlayerRecordsByPositions(
  records: PlayerRecordGroup,
  selectedPositions: string[],
  directory: Record<
    string,
    PlayerRecordIdentity
  >
): PlayerRecordGroup {
  const allowed = new Set(
    selectedPositions.map(
      position => position.toUpperCase()
    )
  );

  const weekly = records.weekly.filter(
    performance => {
      const position =
        directory[performance.playerId]
          ?.position ?? "UNKNOWN";

      return allowed.has(position);
    }
  );

  return buildRecordGroup(weekly);
}

export function filterPlayerRecordsBySeason(
  records: PlayerRecordGroup,
  season: string
): PlayerRecordGroup {
  if (season === "all") {
    return records;
  }

  return buildRecordGroup(
    records.weekly.filter(
      performance =>
        performance.season === season
    )
  );
}

export function getCompletedPlayerSeasons(
  records: PlayerRecordGroup,
  completedSeasons: string[]
): PlayerSeasonRecord[] {
  const completed = new Set(
    completedSeasons
  );

  return records.seasons.filter(
    record =>
      completed.has(record.season)
  );
}

// --------------------------------------------------
// MAIN PLAYER RECORDS LOADER
// --------------------------------------------------

export async function getPlayerRecords():
  Promise<PlayerRecords> {
  const [
    historicalData,
    sleeperPlayers,
  ] = await Promise.all([
    getHistoricalData(),
    getPlayers(),
  ]);

  const weekly =
    buildWeeklyPerformances(
      historicalData
    );

  const championshipRecords =
    buildChampionshipRecords(
      historicalData
    );

  const regularWeekly = weekly.filter(
    performance =>
      performance.phase ===
      competitionPhase("regularSeason")
  );

  const playoffWeekly = weekly.filter(
    performance =>
      performance.phase ===
      competitionPhase("mainPlayoffs")
  );

  const combined =
    buildRecordGroup(weekly);

  const regularSeason =
    buildRecordGroup(regularWeekly);

  const mainPlayoffs =
    buildRecordGroup(playoffWeekly);

  const availableSeasons = Array.from(
    new Set(
      historicalData.map(
        season =>
          season.league.season
      )
    )
  ).sort(
    (a, b) =>
      Number(b) - Number(a)
  );

  const completedRegularSeasons =
    historicalData
      .filter(isRegularSeasonComplete)
      .map(
        season =>
          season.league.season
      );

  const completedPlayoffSeasons =
    historicalData
      .filter(arePlayoffsComplete)
      .map(
        season =>
          season.league.season
      );

  return {
    ...combined,

    competitions: {
      regularSeason,
      mainPlayoffs,
    },

    championshipRecords,

    players: buildPlayerDirectory(
      weekly,
      sleeperPlayers,
      championshipRecords
    ),

    availableSeasons,

    completedSeasons: {
      regularSeason:
        completedRegularSeasons,
      mainPlayoffs:
        completedPlayoffSeasons,
    },
  };
}
