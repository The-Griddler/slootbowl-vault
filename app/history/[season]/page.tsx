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
     * IMPORTANT:
     *
     * Every team's record is their
     * COMPLETE regular-season record.
     *
     * Cross-conference games count.
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

function findPostseasonMatchup(
  season: HistoricalSeason,
  rosterA: number,
  rosterB: number
): HistoricalSeason["matchups"][number] | null {
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

function getFinalStandings(
  season: HistoricalSeason,
  winnersBracket: SleeperBracketMatch[],
  losersBracket: SleeperBracketMatch[]
) {
  const finalRows: {
    place: number;
    rosterId: number;
    label: string;
  }[] = [];

  /*
   * 1st / 2nd
   *
   * Winners bracket R3 M6
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
   * 3rd / 4th
   *
   * Winners bracket R3 M7
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
   * 5th / 6th
   *
   * Winners bracket R2 M5
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
   * 7th / 8th
   *
   * Winners of the two final
   * losers-bracket games.
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

  if (
    losersMatchThree?.w
  ) {
    finalRows.push({
      place: 7,
      rosterId:
        losersMatchThree.w,
      label:
        "7th Place",
    });
  }

  if (
    losersMatchFour?.w
  ) {
    finalRows.push({
      place: 8,
      rosterId:
        losersMatchFour.w,
      label:
        "8th Place",
    });
  }

  /*
   * 9th / 10th
   *
   * The LOSERS of R2 M3 and R2 M4
   * play the actual Toilet Bowl.
   *
   * We deliberately do NOT require
   * phase === "Toilet Bowl" here.
   *
   * The matchup can currently be
   * classified as "Ignored" by the
   * historical stats system because
   * it isn't represented directly in
   * the losers bracket.
   */

  const toiletBowlTeamA =
    losersMatchThree?.l ??
    null;

  const toiletBowlTeamB =
    losersMatchFour?.l ??
    null;

  if (
    toiletBowlTeamA !== null &&
    toiletBowlTeamB !== null
  ) {
    const toiletBowl =
      findPostseasonMatchup(
        season,
        toiletBowlTeamA,
        toiletBowlTeamB
      );

    if (toiletBowl) {
      if (
        toiletBowl.scoreA >
        toiletBowl.scoreB
      ) {
        finalRows.push({
          place: 9,
          rosterId:
            toiletBowl.rosterA,
          label:
            "Toilet Bowl Winner",
        });

        finalRows.push({
          place: 10,
          rosterId:
            toiletBowl.rosterB,
          label:
            "Toilet Bowl Loser",
        });
      } else if (
        toiletBowl.scoreB >
        toiletBowl.scoreA
      ) {
        finalRows.push({
          place: 9,
          rosterId:
            toiletBowl.rosterB,
          label:
            "Toilet Bowl Winner",
        });

        finalRows.push({
          place: 10,
          rosterId:
            toiletBowl.rosterA,
          label:
            "Toilet Bowl Loser",
        });
      }
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
  standings: {
    place: number;
    rosterId: number;
    label: string;
  }[];
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
                <div className="truncate font-bold text-white">
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
   *
   * These are used only to decide which
   * conference table the franchise belongs in.
   *
   * Their records are still calculated from
   * ALL regular-season games.
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