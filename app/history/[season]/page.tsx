import Link from "next/link";

import {
  getHistoricalData,
  getLeagueHistory,
  fetchBracketForPage,
  SleeperBracketMatch,
  HistoricalSeason,
} from "../../../lib/sleeper";

import {
  getFranchiseName,
} from "../../../lib/franchises";

type SeasonPageProps = {
  params: Promise<{
    season: string;
  }>;
};

type StandingRow = {
  rosterId: number;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
};

type FinalStanding = {
  place: number;
  rosterId: number;
  label: string;
};

function getBracketMatch(
  bracket: SleeperBracketMatch[],
  round: number,
  match: number
): SleeperBracketMatch | null {
  return (
    bracket.find(
      (game) =>
        game.r === round &&
        game.m === match
    ) ?? null
  );
}

/*
 * Resolve a bracket slot into an actual
 * roster ID.
 *
 * A slot can either contain a roster ID
 * directly or point to the winner/loser
 * of an earlier bracket match.
 */
function resolveBracketSlot(
  bracket: SleeperBracketMatch[],
  match: SleeperBracketMatch,
  slot: "t1" | "t2"
): number | null {
  const direct =
    match[slot];

  if (
    typeof direct ===
    "number"
  ) {
    return direct;
  }

  const from =
    slot === "t1"
      ? match.t1_from
      : match.t2_from;

  if (!from) {
    return null;
  }

  const sourceMatchId =
    from.w ?? from.l;

  if (
    typeof sourceMatchId !==
    "number"
  ) {
    return null;
  }

  const sourceMatch =
    bracket.find(
      (game) =>
        game.m ===
        sourceMatchId
    );

  if (!sourceMatch) {
    return null;
  }

  if (
    typeof from.w ===
    "number"
  ) {
    return (
      sourceMatch.w ??
      null
    );
  }

  if (
    typeof from.l ===
    "number"
  ) {
    return (
      sourceMatch.l ??
      null
    );
  }

  return null;
}

/*
 * Find the actual historical matchup
 * between two franchises during the
 * postseason.
 */
function findPostseasonMatchup(
  season: HistoricalSeason,
  rosterA: number,
  rosterB: number
) {
  return (
    season.matchups.find(
      (matchup) =>
        matchup.week > 14 &&
        (
          (
            matchup.rosterA ===
              rosterA &&
            matchup.rosterB ===
              rosterB
          ) ||
          (
            matchup.rosterA ===
              rosterB &&
            matchup.rosterB ===
              rosterA
          )
        )
    ) ?? null
  );
}

/*
 * Determine the winner and loser of an
 * actual postseason matchup.
 */
function getMatchResult(
  season: HistoricalSeason,
  rosterA: number,
  rosterB: number
): {
  winner: number;
  loser: number;
} | null {
  const matchup =
    findPostseasonMatchup(
      season,
      rosterA,
      rosterB
    );

  if (!matchup) {
    return null;
  }

  if (
    matchup.scoreA >
    matchup.scoreB
  ) {
    return {
      winner:
        matchup.rosterA,
      loser:
        matchup.rosterB,
    };
  }

  if (
    matchup.scoreB >
    matchup.scoreA
  ) {
    return {
      winner:
        matchup.rosterB,
      loser:
        matchup.rosterA,
    };
  }

  return null;
}

function getRegularSeasonStandings(
  season: HistoricalSeason,
  rosterIds: number[]
): StandingRow[] {
  const standings =
    new Map<
      number,
      StandingRow
    >();

  for (const rosterId of rosterIds) {
    standings.set(
      rosterId,
      {
        rosterId,
        wins: 0,
        losses: 0,
        ties: 0,
        pointsFor: 0,
      }
    );
  }

  for (const matchup of season.matchups) {
    if (
      matchup.phase !==
      "Regular Season"
    ) {
      continue;
    }

    const teamA =
      standings.get(
        matchup.rosterA
      );

    const teamB =
      standings.get(
        matchup.rosterB
      );

    if (teamA) {
      teamA.pointsFor +=
        matchup.scoreA;
    }

    if (teamB) {
      teamB.pointsFor +=
        matchup.scoreB;
    }

    /*
     * The conference determines where
     * the team is displayed.
     *
     * The record is ALWAYS the team's
     * complete 14-game regular-season
     * record, including cross-conference
     * games.
     */

    if (
      !teamA ||
      !teamB
    ) {
      continue;
    }

    if (
      matchup.scoreA >
      matchup.scoreB
    ) {
      teamA.wins += 1;
      teamB.losses += 1;
    } else if (
      matchup.scoreB >
      matchup.scoreA
    ) {
      teamB.wins += 1;
      teamA.losses += 1;
    } else {
      teamA.ties += 1;
      teamB.ties += 1;
    }
  }

  return Array.from(
    standings.values()
  ).sort((a, b) => {
    if (
      b.wins !==
      a.wins
    ) {
      return (
        b.wins -
        a.wins
      );
    }

    if (
      b.ties !==
      a.ties
    ) {
      return (
        b.ties -
        a.ties
      );
    }

    return (
      b.pointsFor -
      a.pointsFor
    );
  });
}

function getFinalStandings(
  season: HistoricalSeason,
  winnersBracket: SleeperBracketMatch[],
  losersBracket: SleeperBracketMatch[]
): FinalStanding[] {
  const finalRows: FinalStanding[] =
    [];

  /*
   * =====================================
   * MAIN PLAYOFFS
   * =====================================
   */

  /*
   * R3 M6
   * Slootbowl
   */

  const championship =
    getBracketMatch(
      winnersBracket,
      3,
      6
    );

  if (
    championship?.w
  ) {
    finalRows.push({
      place: 1,
      rosterId:
        championship.w,
      label:
        "Slootbowl Champion",
    });
  }

  if (
    championship?.l
  ) {
    finalRows.push({
      place: 2,
      rosterId:
        championship.l,
      label:
        "Runner-up",
    });
  }

  /*
   * R3 M7
   * 3rd / 4th
   */

  const thirdPlace =
    getBracketMatch(
      winnersBracket,
      3,
      7
    );

  if (
    thirdPlace?.w
  ) {
    finalRows.push({
      place: 3,
      rosterId:
        thirdPlace.w,
      label:
        "3rd Place",
    });
  }

  if (
    thirdPlace?.l
  ) {
    finalRows.push({
      place: 4,
      rosterId:
        thirdPlace.l,
      label:
        "4th Place",
    });
  }

  /*
   * R2 M5
   * 5th / 6th
   */

  const fifthSixth =
    getBracketMatch(
      winnersBracket,
      2,
      5
    );

  if (
    fifthSixth?.w
  ) {
    finalRows.push({
      place: 5,
      rosterId:
        fifthSixth.w,
      label:
        "5th Place",
    });
  }

  if (
    fifthSixth?.l
  ) {
    finalRows.push({
      place: 6,
      rosterId:
        fifthSixth.l,
      label:
        "6th Place",
    });
  }

  /*
   * =====================================
   * LOSERS BRACKET
   * =====================================
   *
   * R2 M3 determines 7th / one Toilet
   * Bowl participant.
   *
   * R2 M4 determines 8th / the other
   * Toilet Bowl participant.
   *
   * We reconstruct the participants,
   * then look at the actual postseason
   * matchup score to determine the winner.
   */

  const losersMatchThree =
    getBracketMatch(
      losersBracket,
      2,
      3
    );

  const losersMatchFour =
    getBracketMatch(
      losersBracket,
      2,
      4
    );

  let seventh:
    | number
    | null = null;

  let eighth:
    | number
    | null = null;

  let toiletBowlTeamA:
    | number
    | null = null;

  let toiletBowlTeamB:
    | number
    | null = null;

  /*
   * R2 M3
   */

  if (losersMatchThree) {
    const teamA =
      resolveBracketSlot(
        losersBracket,
        losersMatchThree,
        "t1"
      );

    const teamB =
      resolveBracketSlot(
        losersBracket,
        losersMatchThree,
        "t2"
      );

    if (
      teamA !== null &&
      teamB !== null
    ) {
      const result =
        getMatchResult(
          season,
          teamA,
          teamB
        );

      if (result) {
        seventh =
          result.winner;

        toiletBowlTeamA =
          result.loser;
      }
    }
  }

  /*
   * R2 M4
   */

  if (losersMatchFour) {
    const teamA =
      resolveBracketSlot(
        losersBracket,
        losersMatchFour,
        "t1"
      );

    const teamB =
      resolveBracketSlot(
        losersBracket,
        losersMatchFour,
        "t2"
      );

    if (
      teamA !== null &&
      teamB !== null
    ) {
      const result =
        getMatchResult(
          season,
          teamA,
          teamB
        );

      if (result) {
        eighth =
          result.winner;

        toiletBowlTeamB =
          result.loser;
      }
    }
  }

  /*
   * Add 7th / 8th.
   */

  if (
    seventh !== null
  ) {
    finalRows.push({
      place: 7,
      rosterId: seventh,
      label:
        "7th Place",
    });
  }

  if (
    eighth !== null
  ) {
    finalRows.push({
      place: 8,
      rosterId: eighth,
      label:
        "8th Place",
    });
  }

  /*
   * =====================================
   * TOILET BOWL
   * =====================================
   *
   * The losers of the two R2 losers'
   * bracket games play each other.
   *
   * Winner = 9th
   * Loser = 10th
   */

  if (
    toiletBowlTeamA !==
      null &&
    toiletBowlTeamB !==
      null
  ) {
    const toiletBowl =
      getMatchResult(
        season,
        toiletBowlTeamA,
        toiletBowlTeamB
      );

    if (toiletBowl) {
      finalRows.push({
        place: 9,
        rosterId:
          toiletBowl.winner,
        label:
          "Toilet Bowl Winner",
      });

      finalRows.push({
        place: 10,
        rosterId:
          toiletBowl.loser,
        label:
          "Toilet Bowl Loser",
      });
    }
  }

  return finalRows.sort(
    (a, b) =>
      a.place -
      b.place
  );
}

function StandingTable({
  title,
  standings,
}: {
  title: string;
  standings: StandingRow[];
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
      <div className="border-b border-zinc-800 px-4 py-4">
        <h2 className="text-lg font-bold text-white">
          {title}
        </h2>
      </div>

      <div className="divide-y divide-zinc-800">
        {standings.map(
          (
            team,
            index
          ) => (
            <div
              key={
                team.rosterId
              }
              className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 px-4 py-4"
            >
              <div className="text-sm font-semibold text-zinc-500">
                {index + 1}
              </div>

              <div className="min-w-0">
                <div className="truncate font-semibold text-white">
                  {getFranchiseName(
                    team.rosterId
                  )}
                </div>

                <div className="mt-1 text-xs text-zinc-500">
                  PF{" "}
                  {team.pointsFor.toFixed(
                    2
                  )}
                </div>
              </div>

              <div className="text-right">
                <div className="font-bold text-white">
                  {team.wins}-
                  {team.losses}-
                  {team.ties}
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </section>
  );
}

function FinalStandings({
  standings,
}: {
  standings: FinalStanding[];
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
      <div className="border-b border-zinc-800 px-4 py-4">
        <h2 className="text-lg font-bold text-white">
          Final Standings
        </h2>
      </div>

      <div className="divide-y divide-zinc-800">
        {standings.map(
          (team) => (
            <div
              key={`${team.place}-${team.rosterId}`}
              className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 px-4 py-4"
            >
              <div className="text-xl font-black text-zinc-500">
                {team.place}
              </div>

              <div className="min-w-0">
                <div className="font-bold text-white">
                  {getFranchiseName(
                    team.rosterId
                  )}
                </div>

                <div className="mt-1 text-xs font-medium text-zinc-500">
                  {team.label}
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </section>
  );
}

export default async function SeasonHistoryPage({
  params,
}: SeasonPageProps) {
  const {
    season,
  } = await params;

  const [
    leagues,
    historicalData,
  ] = await Promise.all([
    getLeagueHistory(),
    getHistoricalData(),
  ]);

  const league =
    leagues.find(
      (item) =>
        item.season ===
        season
    );

  const seasonData =
    historicalData.find(
      (item) =>
        item.league.season ===
        season
    );

  if (
    !league ||
    !seasonData
  ) {
    return (
      <main className="min-h-screen bg-black px-4 py-8 text-white">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/history"
            className="text-sm text-zinc-400 hover:text-white"
          >
            ← Back to History
          </Link>

          <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <h1 className="text-2xl font-bold">
              Season not found
            </h1>
          </div>
        </div>
      </main>
    );
  }

  const [
    winnersBracket,
    losersBracket,
  ] = await Promise.all([
    fetchBracketForPage(
      league.league_id,
      "winners_bracket"
    ),
    fetchBracketForPage(
      league.league_id,
      "losers_bracket"
    ),
  ]);

  /*
   * Permanent franchise IDs.
   *
   * OBFC:
   * 4, 6, 7, 8, 9
   *
   * GPFC:
   * 1, 2, 3, 5, 10
   */

  const obfcRosterIds = [
    4,
    6,
    7,
    8,
    9,
  ];

  const gpfcRosterIds = [
    1,
    2,
    3,
    5,
    10,
  ];

  const obfcStandings =
    getRegularSeasonStandings(
      seasonData,
      obfcRosterIds
    );

  const gpfcStandings =
    getRegularSeasonStandings(
      seasonData,
      gpfcRosterIds
    );

  const finalStandings =
    getFinalStandings(
      seasonData,
      winnersBracket,
      losersBracket
    );

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/history"
          className="text-sm font-medium text-zinc-400 hover:text-white"
        >
          ← Back to History
        </Link>

        <div className="mt-6">
          <div className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
            SFL Season
          </div>

          <h1 className="mt-1 text-4xl font-black tracking-tight">
            {season}
          </h1>

          <p className="mt-2 text-zinc-400">
            {league.name}
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <div>
            <h2 className="mb-4 text-2xl font-black">
              Regular Season
            </h2>

            <div className="grid gap-6 md:grid-cols-2">
              <StandingTable
                title="OBFC"
                standings={
                  obfcStandings
                }
              />

              <StandingTable
                title="GPFC"
                standings={
                  gpfcStandings
                }
              />
            </div>
          </div>

          <FinalStandings
            standings={
              finalStandings
            }
          />
        </div>
      </div>
    </main>
  );
}