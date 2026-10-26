
import {
  FRANCHISES,
  getFranchiseName,
} from "./franchises";

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
  rosters: SleeperRoster[];
  tradedPicks: SleeperTradedPick[];
  winnersBracket: SleeperBracketMatch[];
  nflState: SleeperNFLState;
  playoffRosterIds?: number[];
};

function getMaxPF(
  roster: SleeperRoster
): number | null {
  const whole = roster.settings.ppts;

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

function getRecord(
  roster: SleeperRoster
): {
  wins: number;
  losses: number;
  ties: number;
} {
  return {
    wins: roster.settings.wins ?? 0,
    losses: roster.settings.losses ?? 0,
    ties: roster.settings.ties ?? 0,
  };
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

function getPlayoffParticipants(
  bracket: SleeperBracketMatch[]
): Set<number> {
  const participants =
    new Set<number>();

  for (const match of bracket) {
    if (
      match.p !== undefined &&
      match.p !== 1
    ) {
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
    if (
      match.p !== undefined &&
      match.p !== 1
    ) {
      continue;
    }

    const week =
      14 + match.r;

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
    } else if (match.r === 2) {
      stages.set(
        match.l,
        "week_16"
      );
    } else if (match.r === 3) {
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

function stageOrder(
  stage: DraftStage
): number {
  switch (stage) {
    case "missed_playoffs":
      return 0;

    case "week_15":
      return 1;

    case "week_16":
      return 2;

    case "runner_up":
      return 3;

    case "champion":
      return 4;

    case "projected_playoff":
      return 5;
  }
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

  const bracketParticipants =
    getPlayoffParticipants(
      winnersBracket
    );

  const participants =
    playoffRosterIds
      ? new Set(
          playoffRosterIds
        )
      : bracketParticipants;

  const eliminations =
    getEliminations(
      winnersBracket,
      season,
      nflState
    );

  const teams: DraftTeam[] =
    rosters.map((roster) => {
      const franchise =
        FRANCHISES.find(
          (item) =>
            item.rosterId ===
            roster.roster_id
        );

      const record =
        getRecord(roster);

      let stage: DraftStage =
        "projected_playoff";

      let confirmed = false;

      if (
        regularSeasonComplete &&
        !participants.has(
          roster.roster_id
        )
      ) {
        stage =
          "missed_playoffs";
        confirmed = true;
      } else {
        const eliminated =
          eliminations.get(
            roster.roster_id
          );

        if (eliminated) {
          stage = eliminated;
          confirmed = true;
        }
      }

      return {
        rosterId:
          roster.roster_id,
        name:
          franchise?.name ??
          getFranchiseName(
            roster.roster_id
          ),
        logo:
          franchise?.logo ?? "",
        primaryColour:
          franchise?.primaryColour ??
          "#64748b",
        secondaryColour:
          franchise?.secondaryColour ??
          "#ffffff",
        ...record,
        maxPF: getMaxPF(roster),
        stage,
        draftPosition: 0,
        confirmed,
      };
    });

  if (
    teams.some(
      (team) =>
        team.maxPF === null
    )
  ) {
    warnings.push(
      "Max PF is unavailable for one or more franchises."
    );
  }

  if (
    !regularSeasonComplete
  ) {
    warnings.push(
      "Regular-season Max PF is still changing. Draft positions are provisional."
    );
  }

  if (
    participants.size !== 6
  ) {
    warnings.push(
      "Six playoff participants could not be confirmed from the bracket."
    );
  }

  if (
    !seasonComplete
  ) {
    warnings.push(
      "The draft order remains projected until the Slootbowl is complete."
    );
  }

  teams.sort((a, b) => {
    const stageDifference =
      stageOrder(a.stage) -
      stageOrder(b.stage);

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

  const official =
    seasonComplete &&
    regularSeasonComplete &&
    maxPFComplete &&
    teams.length ===
      DRAFT_TEAMS &&
    teams.every(
      (team) =>
        team.confirmed
    );

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
