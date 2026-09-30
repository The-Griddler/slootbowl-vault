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

function getRegularSeasonStandings(
  season: HistoricalSeason
): StandingRow[] {
  const standings =
    new Map<number, StandingRow>();

  for (const matchup of season.matchups) {
    if (
      matchup.phase !==
      "Regular Season"
    ) {
      continue;
    }

    if (!standings.has(matchup.rosterA)) {
      standings.set(matchup.rosterA, {
        rosterId: matchup.rosterA,
        wins: 0,
        losses: 0,
        ties: 0,
        pointsFor: 0,
      });
    }

    if (!standings.has(matchup.rosterB)) {
      standings.set(matchup.rosterB, {
        rosterId: matchup.rosterB,
        wins: 0,
        losses: 0,
        ties: 0,
        pointsFor: 0,
      });
    }

    const teamA =
      standings.get(matchup.rosterA)!;

    const teamB =
      standings.get(matchup.rosterB)!;

    teamA.pointsFor += matchup.scoreA;
    teamB.pointsFor += matchup.scoreB;

    if (matchup.scoreA > matchup.scoreB) {
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
    if (b.wins !== a.wins) {
      return b.wins - a.wins;
    }

    if (b.ties !== a.ties) {
      return b.ties - a.ties;
    }

    return b.pointsFor - a.pointsFor;
  });
}

/*
 * Find the postseason game between two
 * specific franchises.
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
            matchup.rosterA === rosterA &&
            matchup.rosterB === rosterB
          ) ||
          (
            matchup.rosterA === rosterB &&
            matchup.rosterB === rosterA
          )
        )
    ) ?? null
  );
}

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
      winner: matchup.rosterA,
      loser: matchup.rosterB,
    };
  }

  if (
    matchup.scoreB >
    matchup.scoreA
  ) {
    return {
      winner: matchup.rosterB,
      loser: matchup.rosterA,
    };
  }

  return null;
}

/*
 * Determine final positions.
 *
 * The winners bracket directly determines
 * positions 1–6.
 *
 * Positions 7–10 are determined from the
 * four teams occupying the bottom four
 * places after the regular season.
 *
 * We deliberately do NOT try to reconstruct
 * Sleeper's losers-bracket tree.
 */
function getFinalStandings(
  season: HistoricalSeason,
  regularSeasonStandings: StandingRow[],
  winnersBracket: SleeperBracketMatch[]
): FinalStanding[] {
  const finalRows: FinalStanding[] = [];

  /*
   * =====================================
   * POSITIONS 1–6
   * =====================================
   */

  const championship =
    getBracketMatch(
      winnersBracket,
      3,
      6
    );

  if (championship?.w !== null &&
      championship?.w !== undefined) {
    finalRows.push({
      place: 1,
      rosterId: championship.w,
      label: "Slootbowl Champion",
    });
  }

  if (championship?.l !== null &&
      championship?.l !== undefined) {
    finalRows.push({
      place: 2,
      rosterId: championship.l,
      label: "Runner-up",
    });
  }

  const thirdPlace =
    getBracketMatch(
      winnersBracket,
      3,
      7
    );

  if (thirdPlace?.w !== null &&
      thirdPlace?.w !== undefined) {
    finalRows.push({
      place: 3,
      rosterId: thirdPlace.w,
      label: "3rd Place",
    });
  }

  if (thirdPlace?.l !== null &&
      thirdPlace?.l !== undefined) {
    finalRows.push({
      place: 4,
      rosterId: thirdPlace.l,
      label: "4th Place",
    });
  }

  const fifthSixth =
    getBracketMatch(
      winnersBracket,
      2,
      5
    );

  if (fifthSixth?.w !== null &&
      fifthSixth?.w !== undefined) {
    finalRows.push({
      place: 5,
      rosterId: fifthSixth.w,
      label: "5th Place",
    });
  }

  if (fifthSixth?.l !== null &&
      fifthSixth?.l !== undefined) {
    finalRows.push({
      place: 6,
      rosterId: fifthSixth.l,
      label: "6th Place",
    });
  }

  /*
   * =====================================
   * POSITIONS 7–10
   * =====================================
   *
   * The bottom four teams are simply the
   * bottom four teams in the final regular
   * season standings.
   */

  const bottomFour =
    regularSeasonStandings
      .slice(-4)
      .map(
        (team) =>
          team.rosterId
      );

  /*
   * Find postseason games involving only
   * those four teams.
   *
   * The first round creates two winners
   * and two losers.
   */
  const bottomFourGames =
    season.matchups
      .filter(
        (matchup) =>
          matchup.week > 14 &&
          bottomFour.includes(
            matchup.rosterA
          ) &&
          bottomFour.includes(
            matchup.rosterB
          )
      )
      .sort(
        (a, b) =>
          a.week - b.week
      );

  /*
   * Track the results of games involving
   * the bottom four.
   */
  const eliminated: number[] = [];
  const winners: number[] = [];

  for (const matchup of bottomFourGames) {
    if (
      matchup.scoreA ===
      matchup.scoreB
    ) {
      continue;
    }

    const winner =
      matchup.scoreA >
      matchup.scoreB
        ? matchup.rosterA
        : matchup.rosterB;

    const loser =
      matchup.scoreA >
      matchup.scoreB
        ? matchup.rosterB
        : matchup.rosterA;

    /*
     * A team can appear in more than one
     * postseason game. The first game
     * involving a team establishes its
     * first-round result.
     */
    if (
      !winners.includes(winner) &&
      !eliminated.includes(winner)
    ) {
      winners.push(winner);
    }

    if (
      !eliminated.includes(loser)
    ) {
      eliminated.push(loser);
    }
  }

  /*
   * The first two bottom-four teams to
   * lose their opening game become the
   * Toilet Bowl participants.
   */
  const toiletTeams =
    eliminated.slice(0, 2);

  /*
   * The two teams that won their opening
   * bottom-four game play for 7th/8th.
   *
   * Find their later matchup.
   */
  if (
    winners.length >= 2
  ) {
    const seventhEighth =
      getMatchResult(
        season,
        winners[0],
        winners[1]
      );

    if (seventhEighth) {
      finalRows.push({
        place: 7,
        rosterId:
          seventhEighth.winner,
        label: "7th Place",
      });

      finalRows.push({
        place: 8,
        rosterId:
          seventhEighth.loser,
        label: "8th Place",
      });
    }
  }

  /*
   * Toilet Bowl winner = 9th
   * Toilet Bowl loser = 10th
   */
  if (
    toiletTeams.length >= 2
  ) {
    const toiletBowl =
      getMatchResult(
        season,
        toiletTeams[0],
        toiletTeams[1]
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
      a.place - b.place
  );
}

function StandingTable({
  standings,
}: {
  standings: StandingRow[];
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
      <div className="border-b border-zinc-800 px-4 py-4">
        <h2 className="text-lg font-bold text-white">
          Regular Season Standings
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

  const winnersBracket =
    await fetchBracketForPage(
      league.league_id,
      "winners_bracket"
    );

  const regularSeasonStandings =
    getRegularSeasonStandings(
      seasonData
    );

  const finalStandings =
    getFinalStandings(
      seasonData,
      regularSeasonStandings,
      winnersBracket
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
          <StandingTable
            standings={
              regularSeasonStandings
            }
          />

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