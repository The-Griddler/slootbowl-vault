import {
  getHistoricalData,
  HistoricalMatchup,
} from "../../../lib/sleeper";

import {
  FRANCHISES,
  getFranchiseName,
} from "../../../lib/franchises";

type BracketMatch = {
  m: number;
  r: number;
  t1: number | null;
  t2: number | null;
  w: number | null;
  l: number | null;
  p?: number;
  t1_from?: {
    w?: number;
    l?: number;
  };
  t2_from?: {
    w?: number;
    l?: number;
  };
};

type TeamStanding = {
  rosterId: number;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
};

type FinalStanding = {
  placement: number;
  rosterId: number;
};

function getDivision(rosterId: number): "OBFC" | "GPFC" {
  const obfc = [4, 6, 7, 8, 9];

  return obfc.includes(rosterId)
    ? "OBFC"
    : "GPFC";
}

async function getBracket(
  leagueId: string,
  bracket: "winners_bracket" | "losers_bracket"
): Promise<BracketMatch[]> {
  const response = await fetch(
    `https://api.sleeper.app/v1/league/${leagueId}/${bracket}`,
    {
      next: {
        revalidate: 300,
      },
    }
  );

  if (!response.ok) {
    return [];
  }

  return response.json();
}

function buildRegularSeasonStandings(
  matchups: HistoricalMatchup[]
): TeamStanding[] {
  const standings = new Map<
    number,
    TeamStanding
  >();

  for (const franchise of FRANCHISES) {
    standings.set(franchise.rosterId, {
      rosterId: franchise.rosterId,
      wins: 0,
      losses: 0,
      ties: 0,
      pointsFor: 0,
      pointsAgainst: 0,
    });
  }

  for (const matchup of matchups) {
    if (
      matchup.phase !== "Regular Season"
    ) {
      continue;
    }

    const teamA = standings.get(
      matchup.rosterA
    );

    const teamB = standings.get(
      matchup.rosterB
    );

    if (!teamA || !teamB) {
      continue;
    }

    teamA.pointsFor += matchup.scoreA;
    teamA.pointsAgainst += matchup.scoreB;

    teamB.pointsFor += matchup.scoreB;
    teamB.pointsAgainst += matchup.scoreA;

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

  return Array.from(standings.values()).sort(
    (a, b) => {
      if (b.wins !== a.wins) {
        return b.wins - a.wins;
      }

      if (a.losses !== b.losses) {
        return a.losses - b.losses;
      }

      if (b.pointsFor !== a.pointsFor) {
        return b.pointsFor - a.pointsFor;
      }

      return (
        b.pointsAgainst -
        a.pointsAgainst
      );
    }
  );
}

function getBracketMatch(
  bracket: BracketMatch[],
  round: number,
  match: number
): BracketMatch | null {
  return (
    bracket.find(
      (item) =>
        item.r === round &&
        item.m === match
    ) ?? null
  );
}

function findToiletBowl(
  losersBracket: BracketMatch[]
): BracketMatch | null {
  /*
   * The Toilet Bowl is the game that receives
   * the LOSERS of the two preceding losers-bracket
   * games.
   *
   * In our league those are the games:
   *   Round 2 Match 3
   *   Round 2 Match 4
   *
   * Rather than relying on a hard-coded match number,
   * find the game by its bracket progression.
   */

  return (
    losersBracket.find((match) => {
      const fromOne =
        match.t1_from?.l === 3 ||
        match.t2_from?.l === 3;

      const fromTwo =
        match.t1_from?.l === 4 ||
        match.t2_from?.l === 4;

      return (
        fromOne &&
        fromTwo &&
        match.r >= 3
      );
    }) ?? null
  );
}

function buildFinalStandings(
  winnersBracket: BracketMatch[],
  losersBracket: BracketMatch[]
): FinalStanding[] {
  const standings: FinalStanding[] = [];

  /*
   * 1st / 2nd
   * Winners bracket Round 3 Match 6
   */
  const championship = getBracketMatch(
    winnersBracket,
    3,
    6
  );

  if (
    championship &&
    championship.w !== null &&
    championship.l !== null
  ) {
    standings.push({
      placement: 1,
      rosterId: championship.w,
    });

    standings.push({
      placement: 2,
      rosterId: championship.l,
    });
  }

  /*
   * 3rd / 4th
   * Winners bracket Round 3 Match 7
   */
  const thirdPlace = getBracketMatch(
    winnersBracket,
    3,
    7
  );

  if (
    thirdPlace &&
    thirdPlace.w !== null &&
    thirdPlace.l !== null
  ) {
    standings.push({
      placement: 3,
      rosterId: thirdPlace.w,
    });

    standings.push({
      placement: 4,
      rosterId: thirdPlace.l,
    });
  }

  /*
   * 5th / 6th
   * Winners bracket Round 2 Match 5
   */
  const fifthPlace = getBracketMatch(
    winnersBracket,
    2,
    5
  );

  if (
    fifthPlace &&
    fifthPlace.w !== null &&
    fifthPlace.l !== null
  ) {
    standings.push({
      placement: 5,
      rosterId: fifthPlace.w,
    });

    standings.push({
      placement: 6,
      rosterId: fifthPlace.l,
    });
  }

  /*
   * 7th / 8th
   *
   * These are the WINNERS of the two
   * losers-bracket games.
   *
   * The losers of these games progress
   * to the actual Toilet Bowl.
   */
  const seventhGame = getBracketMatch(
    losersBracket,
    2,
    3
  );

  if (
    seventhGame &&
    seventhGame.w !== null
  ) {
    standings.push({
      placement: 7,
      rosterId: seventhGame.w,
    });
  }

  const eighthGame = getBracketMatch(
    losersBracket,
    2,
    4
  );

  if (
    eighthGame &&
    eighthGame.w !== null
  ) {
    standings.push({
      placement: 8,
      rosterId: eighthGame.w,
    });
  }

  /*
   * 9th / 10th
   *
   * The losers of the two games above
   * play the actual Toilet Bowl.
   *
   * Toilet Bowl winner = 9th
   * Toilet Bowl loser  = 10th
   */
  const toiletBowl =
    findToiletBowl(losersBracket);

  if (
    toiletBowl &&
    toiletBowl.w !== null &&
    toiletBowl.l !== null
  ) {
    standings.push({
      placement: 9,
      rosterId: toiletBowl.w,
    });

    standings.push({
      placement: 10,
      rosterId: toiletBowl.l,
    });
  }

  return standings.sort(
    (a, b) =>
      a.placement - b.placement
  );
}

function formatRecord(
  team: TeamStanding
): string {
  return `${team.wins}-${team.losses}-${team.ties}`;
}

export default async function SeasonHistoryPage({
  params,
}: {
  params: Promise<{
    season: string;
  }>;
}) {
  const { season } = await params;

  const historicalData =
    await getHistoricalData();

  const seasonData =
    historicalData.find(
      (item) =>
        item.league.season === season
    );

  if (!seasonData) {
    return (
      <main className="min-h-screen bg-black px-4 py-8 text-white">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-2xl font-bold">
            Season not found
          </h1>

          <p className="mt-2 text-zinc-400">
            We couldn't find SFL season{" "}
            {season}.
          </p>
        </div>
      </main>
    );
  }

  const [winnersBracket, losersBracket] =
    await Promise.all([
      getBracket(
        seasonData.league.league_id,
        "winners_bracket"
      ),
      getBracket(
        seasonData.league.league_id,
        "losers_bracket"
      ),
    ]);

  const regularSeasonStandings =
    buildRegularSeasonStandings(
      seasonData.matchups
    );

  const obfcStandings =
    regularSeasonStandings.filter(
      (team) =>
        getDivision(team.rosterId) ===
        "OBFC"
    );

  const gpfcStandings =
    regularSeasonStandings.filter(
      (team) =>
        getDivision(team.rosterId) ===
        "GPFC"
    );

  const finalStandings =
    buildFinalStandings(
      winnersBracket,
      losersBracket
    );

  const championship =
    getBracketMatch(
      winnersBracket,
      3,
      6
    );

  const regularSeasonGames =
    seasonData.matchups.filter(
      (matchup) =>
        matchup.phase ===
        "Regular Season"
    ).length;

  const mainPlayoffGames =
    seasonData.matchups.filter(
      (matchup) =>
        matchup.phase ===
        "Main Playoffs"
    ).length;

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white">
      <div className="mx-auto max-w-5xl space-y-8">
        <div>
          <p className="text-sm font-medium uppercase tracking-wider text-zinc-500">
            SFL Season
          </p>

          <h1 className="mt-1 text-3xl font-bold">
            {season}
          </h1>

          <p className="mt-2 text-zinc-400">
            {seasonData.league.name}
          </p>
        </div>

        <section>
          <div className="mb-4">
            <h2 className="text-xl font-bold">
              Regular Season
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Overall record across all 14
              regular-season games.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <ConferenceTable
              name="OBFC"
              teams={obfcStandings}
            />

            <ConferenceTable
              name="GPFC"
              teams={gpfcStandings}
            />
          </div>
        </section>

        <section>
          <div className="mb-4">
            <h2 className="text-xl font-bold">
              Slootbowl
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Championship game.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            {championship &&
            championship.w !== null &&
            championship.l !== null ? (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm uppercase tracking-wider text-zinc-500">
                    Slootbowl Champion
                  </p>

                  <p className="mt-2 text-2xl font-bold">
                    {getFranchiseName(
                      championship.w
                    )}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-4 text-sm text-zinc-400">
                  <span>
                    {getFranchiseName(
                      championship.w
                    )}
                  </span>

                  <span className="text-zinc-600">
                    vs
                  </span>

                  <span>
                    {getFranchiseName(
                      championship.l
                    )}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-lg font-semibold">
                  Slootbowl not yet played
                </p>

                <p className="mt-1 text-sm text-zinc-500">
                  The championship result will
                  appear here once the game is
                  complete.
                </p>
              </div>
            )}
          </div>
        </section>

        <section>
          <div className="mb-4">
            <h2 className="text-xl font-bold">
              Final Season Standings
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Final league placement after the
              playoffs and Toilet Bowl.
            </p>
          </div>

          {finalStandings.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-center">
              <p className="font-semibold">
                Final standings not yet
                determined
              </p>

              <p className="mt-1 text-sm text-zinc-500">
                Final placement will appear as
                playoff games are completed.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
              {finalStandings.map(
                (team, index) => (
                  <div
                    key={team.placement}
                    className={`flex items-center justify-between px-5 py-4 ${
                      index !==
                      finalStandings.length - 1
                        ? "border-b border-zinc-800"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="w-8 text-lg font-bold text-zinc-500">
                        {team.placement}
                      </span>

                      <span className="font-semibold">
                        {getFranchiseName(
                          team.rosterId
                        )}
                      </span>
                    </div>

                    <span className="text-sm text-zinc-500">
                      {team.placement === 1
                        ? "Slootbowl Champion"
                        : team.placement === 2
                        ? "Runner-up"
                        : team.placement === 3
                        ? "3rd Place"
                        : team.placement === 4
                        ? "4th Place"
                        : team.placement === 5
                        ? "5th Place"
                        : team.placement === 6
                        ? "6th Place"
                        : team.placement === 7
                        ? "7th Place"
                        : team.placement === 8
                        ? "8th Place"
                        : team.placement === 9
                        ? "Toilet Bowl Winner"
                        : "Toilet Bowl Loser"}
                    </span>
                  </div>
                )
              )}
            </div>
          )}
        </section>

        <section>
          <div className="mb-4">
            <h2 className="text-xl font-bold">
              Season Summary
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <SummaryCard
              label="Regular Season Games"
              value={regularSeasonGames}
            />

            <SummaryCard
              label="Main Playoff Games"
              value={mainPlayoffGames}
            />

            <SummaryCard
              label="Franchises"
              value={FRANCHISES.length}
            />

            <SummaryCard
              label="Weeks"
              value={14}
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function ConferenceTable({
  name,
  teams,
}: {
  name: string;
  teams: TeamStanding[];
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
      <div className="border-b border-zinc-800 px-5 py-4">
        <h3 className="font-bold">
          {name}
        </h3>
      </div>

      {teams.map((team, index) => (
        <div
          key={team.rosterId}
          className={`px-5 py-4 ${
            index !== teams.length - 1
              ? "border-b border-zinc-800"
              : ""
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate font-semibold">
                {getFranchiseName(
                  team.rosterId
                )}
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                PF {team.pointsFor.toFixed(2)} ·
                PA{" "}
                {team.pointsAgainst.toFixed(
                  2
                )}
              </p>
            </div>

            <div className="shrink-0 text-right">
              <p className="font-bold">
                {formatRecord(team)}
              </p>

              <p className="text-xs text-zinc-500">
                {index + 1}
                {index === 0
                  ? "st"
                  : index === 1
                  ? "nd"
                  : index === 2
                  ? "rd"
                  : "th"}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
      <p className="text-sm text-zinc-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold">
        {value}
      </p>
    </div>
  );
}