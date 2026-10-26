
import {
  FRANCHISES,
  getFranchiseName,
} from "./franchises";

import type {
  HomeStanding,
} from "./homeStats";

import type {
  SleeperBracketMatch,
  SleeperNFLState,
  SleeperRoster,
  SleeperTradedPick,
} from "./sleeper";

import {
  isNFLWeekComplete,
} from "./sleeper";

export const DRAFT_ROUNDS = 5;
export const DRAFT_TEAMS = 10;
export const DRAFT_TOTAL_PICKS =
  DRAFT_ROUNDS * DRAFT_TEAMS;

export type DraftStage =
  | "missed_playoffs"
  | "week_15"
  | "week_16"
  | "runner_up"
  | "champion"
  | "projected_playoff";

export type DraftTeam = {
  rosterId: number;
  name: string;
  logo: string;
  primaryColour: string;
  secondaryColour: string;
  conference: "OBFC" | "GPFC";
  conferenceRank: number;
  wins: number;
  losses: number;
  ties: number;
  maxPF: number | null;
  stage: DraftStage;
  draftPosition: number;
  confirmed: boolean;
};

export type DraftPick = {
  round: number;
  pickInRound: number;
  overallPick: number;
  originalRosterId: number;
  ownerRosterId: number;
  traded: boolean;
};

export type DraftTracker = {
  season: string;
  draftSeason: string;
  status: "projected" | "official";
  teams: DraftTeam[];
  picks: DraftPick[];
  maxPFComplete: boolean;
  warnings: string[];
};

type BuildDraftTrackerArgs = {
  season: string;
  standings: HomeStanding[];
  rosters: SleeperRoster[];
  tradedPicks: SleeperTradedPick[];
  winnersBracket: SleeperBracketMatch[];
  nflState: SleeperNFLState;
  playoffRosterIds?: number[];
};

const STAGE_ORDER: Record<
  DraftStage,
  number
> = {
  missed_playoffs: 0,
  week_15: 1,
  week_16: 2,
  runner_up: 3,
  champion: 4,
  projected_playoff: 5,
};

function getMaxPF(
  roster: SleeperRoster | undefined
): number | null {
  if (!roster) return null;

  const whole =
    roster.settings.ppts;

  if (
    typeof whole !== "number" ||
    !Number.isFinite(whole)
  ) {
    return null;
  }

  const decimal =
    roster.settings.ppts_decimal ?? 0;

  return (
    Math.round(
      (whole + decimal / 100) * 100
    ) / 100
  );
}

function compareMaxPF(
  a: DraftTeam,
  b: DraftTeam
): number {
  if (
    a.maxPF === null &&
    b.maxPF === null
  ) {
    return a.rosterId - b.rosterId;
  }

  if (a.maxPF === null) {
    return 1;
  }

  if (b.maxPF === null) {
    return -1;
  }

  return (
    a.maxPF - b.maxPF ||
    a.rosterId - b.rosterId
  );
}

function projectedStage(
  conferenceRank: number
): DraftStage {
  if (conferenceRank >= 4) {
    return "missed_playoffs";
  }

  if (conferenceRank === 3) {
    return "week_15";
  }

  if (conferenceRank === 2) {
    return "week_16";
  }

  return "runner_up";
}

function isMainBracketMatch(
  match: SleeperBracketMatch
): boolean {
  return (
    match.p === undefined ||
    match.p === 1
  );
}

function getPlayoffParticipants(
  bracket: SleeperBracketMatch[]
): Set<number> {
  const participants =
    new Set<number>();

  for (const match of bracket) {
    if (!isMainBracketMatch(match)) {
      continue;
    }

    if (match.t1 !== null) {
      participants.add(match.t1);
    }

    if (match.t2 !== null) {
      participants.add(match.t2);
    }
  }

  return participants;
}

function getEliminations(
  bracket: SleeperBracketMatch[],
  season: string,
  nflState: SleeperNFLState
): Map<number, DraftStage> {
  const stages =
    new Map<number, DraftStage>();

  for (const match of bracket) {
    if (!isMainBracketMatch(match)) {
      continue;
    }

    const week = 14 + match.r;

    if (
      !isNFLWeekComplete(
        season,
        week,
        nflState
      )
    ) {
      continue;
    }

    if (
      match.w === null ||
      match.l === null
    ) {
      continue;
    }

    if (match.r === 1) {
      stages.set(
        match.l,
        "week_15"
      );
    }

    if (match.r === 2) {
      stages.set(
        match.l,
        "week_16"
      );
    }

    if (match.r === 3) {
      stages.set(
        match.l,
        "runner_up"
      );

      stages.set(
        match.w,
        "champion"
      );
    }
  }

  return stages;
}

function makeDraftPicks(
  teams: DraftTeam[],
  draftSeason: string,
  tradedPicks: SleeperTradedPick[]
): DraftPick[] {
  const ownership =
    new Map<string, number>();

  for (const pick of tradedPicks) {
    if (
      String(pick.season) !==
        draftSeason ||
      pick.round < 1 ||
      pick.round > DRAFT_ROUNDS
    ) {
      continue;
    }

    ownership.set(
      `${pick.round}:${pick.roster_id}`,
      pick.owner_id
    );
  }

  const picks: DraftPick[] = [];

  for (
    let round = 1;
    round <= DRAFT_ROUNDS;
    round++
  ) {
    for (const team of teams) {
      const originalRosterId =
        team.rosterId;

      const ownerRosterId =
        ownership.get(
          `${round}:${originalRosterId}`
        ) ?? originalRosterId;

      picks.push({
        round,
        pickInRound:
          team.draftPosition,
        overallPick:
          (round - 1) *
            DRAFT_TEAMS +
          team.draftPosition,
        originalRosterId,
        ownerRosterId,
        traded:
          ownerRosterId !==
          originalRosterId,
      });
    }
  }

  return picks;
}

export function buildDraftTracker({
  season,
  standings,
  rosters,
  tradedPicks,
  winnersBracket,
  nflState,
  playoffRosterIds,
}: BuildDraftTrackerArgs): DraftTracker {
  const draftSeason = String(
    Number(season) + 1
  );

  const warnings: string[] = [];

  const regularSeasonComplete =
    isNFLWeekComplete(
      season,
      14,
      nflState
    );

  const seasonComplete =
    isNFLWeekComplete(
      season,
      17,
      nflState
    );

  const rosterMap = new Map(
    rosters.map((roster) => [
      roster.roster_id,
      roster,
    ])
  );

  const bracketParticipants =
    getPlayoffParticipants(
      winnersBracket
    );

  const participants =
    playoffRosterIds
      ? new Set(playoffRosterIds)
      : bracketParticipants;

  const eliminations =
    getEliminations(
      winnersBracket,
      season,
      nflState
    );

  const teams: DraftTeam[] =
    standings.map((standing) => {
      const franchise =
        FRANCHISES.find(
          (item) =>
            item.rosterId ===
            standing.rosterId
        );

      const roster =
        rosterMap.get(
          standing.rosterId
        );

      let stage =
        projectedStage(
          standing.rank
        );

      let confirmed = false;

      if (
        regularSeasonComplete &&
        participants.size === 6 &&
        !participants.has(
          standing.rosterId
        )
      ) {
        stage = "missed_playoffs";
        confirmed = true;
      }

      const actualStage =
        eliminations.get(
          standing.rosterId
        );

      if (actualStage) {
        stage = actualStage;
        confirmed = true;
      }

      return {
        rosterId:
          standing.rosterId,
        name:
          franchise?.name ??
          getFranchiseName(
            standing.rosterId
          ),
        logo:
          franchise?.logo ?? "",
        primaryColour:
          franchise?.primaryColour ??
          "#64748b",
        secondaryColour:
          franchise?.secondaryColour ??
          "#ffffff",
        conference:
          standing.conference,
        conferenceRank:
          standing.rank,
        wins:
          standing.wins,
        losses:
          standing.losses,
        ties:
          standing.ties,
        maxPF:
          getMaxPF(roster),
        stage,
        draftPosition: 0,
        confirmed,
      };
    });

  /**
   * Until the Slootbowl is decided,
   * project the two conference
   * leaders into the championship.
   *
   * Higher Max PF projects the
   * champion, who drafts last.
   */
  const actualChampion =
    teams.some(
      (team) =>
        team.stage === "champion" &&
        team.confirmed
    );

  if (!actualChampion) {
    const projectedLeaders =
      teams.filter(
        (team) =>
          team.conferenceRank === 1 &&
          !team.confirmed
      );

    if (
      projectedLeaders.length === 2
    ) {
      projectedLeaders.sort(
        compareMaxPF
      );

      projectedLeaders[0].stage =
        "runner_up";

      projectedLeaders[1].stage =
        "champion";
    }
  }

  /**
   * Once playoff results begin,
   * actual elimination stages
   * override regular-season
   * projections.
   */
  teams.sort((a, b) => {
    const stageDifference =
      STAGE_ORDER[a.stage] -
      STAGE_ORDER[b.stage];

    if (
      stageDifference !== 0
    ) {
      return stageDifference;
    }

    return compareMaxPF(a, b);
  });

  teams.forEach(
    (team, index) => {
      team.draftPosition =
        index + 1;
    }
  );

  const maxPFComplete =
    teams.every(
      (team) =>
        team.maxPF !== null
    );

  if (!maxPFComplete) {
    warnings.push(
      "Max PF is unavailable for one or more franchises."
    );
  }

  if (!regularSeasonComplete) {
    warnings.push(
      "Regular-season Max PF is still changing. Draft positions are provisional."
    );
  } else {
    warnings.push(
      "Sleeper Max PF totals must be checked against the end-of-Week-14 values before the order can be treated as final."
    );
  }

  if (
    regularSeasonComplete &&
    participants.size !== 6
  ) {
    warnings.push(
      "Six playoff participants could not be confirmed from the winners bracket."
    );
  }

  if (!seasonComplete) {
    warnings.push(
      "The draft order remains projected until the Slootbowl is complete."
    );
  }

  /**
   * We deliberately do not mark
   * the order official yet.
   *
   * Sleeper roster Max PF is
   * cumulative, so a reliable
   * Week 14 freeze must be
   * implemented first.
   */
  const official = false;

  return {
    season,
    draftSeason,
    status:
      official
        ? "official"
        : "projected",
    teams,
    picks: makeDraftPicks(
      teams,
      draftSeason,
      tradedPicks
    ),
    maxPFComplete,
    warnings,
  };
}
