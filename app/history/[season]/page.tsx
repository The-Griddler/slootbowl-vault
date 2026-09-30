import {
  getHistoricalData,
} from "../../../lib/sleeper";

import {
  getFranchiseName,
} from "../../../lib/franchises";

type SeasonPageProps = {
  params: Promise<{
    season: string;
  }>;
};

export default async function SeasonPage({
  params,
}: SeasonPageProps) {
  const { season } = await params;

  const historicalData =
    await getHistoricalData();

  const selectedSeason =
    historicalData.find(
      (item) =>
        item.league.season === season
    );

  if (!selectedSeason) {
    return (
      <main>
        <p
          style={{
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "1.5px",
            color: "#687384",
            marginBottom: "6px",
          }}
        >
          SLOOTBOWL VAULT
        </p>

        <h1>Season Not Found</h1>

        <p
          style={{
            marginTop: "8px",
            lineHeight: 1.5,
          }}
        >
          We couldn't find that SFL season.
        </p>
      </main>
    );
  }

  const regularSeason =
    selectedSeason.matchups.filter(
      (matchup) =>
        matchup.phase ===
        "Regular Season"
    );

  const teamStats = new Map<
    number,
    {
      wins: number;
      losses: number;
      ties: number;
      pointsFor: number;
      pointsAgainst: number;
    }
  >();

  for (const matchup of regularSeason) {
    if (!teamStats.has(matchup.rosterA)) {
      teamStats.set(matchup.rosterA, {
        wins: 0,
        losses: 0,
        ties: 0,
        pointsFor: 0,
        pointsAgainst: 0,
      });
    }

    if (!teamStats.has(matchup.rosterB)) {
      teamStats.set(matchup.rosterB, {
        wins: 0,
        losses: 0,
        ties: 0,
        pointsFor: 0,
        pointsAgainst: 0,
      });
    }

    const teamA =
      teamStats.get(matchup.rosterA)!;

    const teamB =
      teamStats.get(matchup.rosterB)!;

    teamA.pointsFor += matchup.scoreA;
    teamA.pointsAgainst += matchup.scoreB;

    teamB.pointsFor += matchup.scoreB;
    teamB.pointsAgainst += matchup.scoreA;

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

  const standings = Array.from(
    teamStats.entries()
  )
    .map(
      ([
        rosterId,
        stats,
      ]) => ({
        rosterId,
        ...stats,
      })
    )
    .sort((a, b) => {
      if (b.wins !== a.wins) {
        return b.wins - a.wins;
      }

      if (
        b.pointsFor !==
        a.pointsFor
      ) {
        return (
          b.pointsFor -
          a.pointsFor
        );
      }

      return (
        b.pointsAgainst -
        a.pointsAgainst
      );
    });

  const playoffGames =
    selectedSeason.matchups.filter(
      (matchup) =>
        matchup.phase ===
        "Main Playoffs"
    );

  const final =
    playoffGames
      .filter(
        (matchup) =>
          matchup.week >= 17
      )
      .sort(
        (a, b) =>
          b.week - a.week
      )[0] ?? null;

  return (
    <main>
      <p
        style={{
          fontSize: "12px",
          fontWeight: 700,
          letterSpacing: "1.5px",
          color: "#687384",
          marginBottom: "6px",
        }}
      >
        DYNASTY SLUTS
      </p>

      <h1>{season} Season</h1>

      <p
        style={{
          marginBottom: "24px",
          lineHeight: 1.5,
        }}
      >
        Sluts Football League
      </p>

      <section
        style={{
          background: "#151b23",
          border: "1px solid #27303b",
          borderRadius: "18px",
          padding: "18px",
          marginBottom: "24px",
        }}
      >
        <p
          style={{
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "1px",
            color: "#687384",
            marginBottom: "8px",
          }}
        >
          SLOOTBOWL
        </p>

        {final ? (
          <>
            <p
              style={{
                margin: 0,
                fontSize: "16px",
                fontWeight: 700,
              }}
            >
              {getFranchiseName(
                final.rosterA
              )}{" "}
              vs{" "}
              {getFranchiseName(
                final.rosterB
              )}
            </p>

            <p
              style={{
                marginTop: "8px",
                fontSize: "14px",
                color: "#9da7b3",
              }}
            >
              {final.scoreA.toFixed(
                2
              )}{" "}
              –{" "}
              {final.scoreB.toFixed(
                2
              )}
            </p>

            <p
              style={{
                marginTop: "8px",
                fontSize: "13px",
                fontWeight: 700,
              }}
            >
              🏆{" "}
              {getFranchiseName(
                final.scoreA >
                  final.scoreB
                  ? final.rosterA
                  : final.rosterB
              )}
            </p>
          </>
        ) : (
          <p
            style={{
              margin: 0,
              fontSize: "14px",
              color: "#9da7b3",
            }}
          >
            Slootbowl not yet played.
          </p>
        )}
      </section>

      <h2
        style={{
          fontSize: "20px",
          margin: "0 0 12px",
        }}
      >
        Final Standings
      </h2>

      {standings.map(
        (team, index) => (
          <article
            key={team.rosterId}
            style={{
              background: "#151b23",
              border: "1px solid #27303b",
              borderRadius: "16px",
              padding: "14px",
              marginBottom: "8px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <strong
              style={{
                width: "24px",
                fontSize: "14px",
                color: "#687384",
              }}
            >
              {index + 1}
            </strong>

            <div
              style={{
                minWidth: 0,
                flex: 1,
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "15px",
                }}
              >
                {getFranchiseName(
                  team.rosterId
                )}
              </h3>

              <p
                style={{
                  marginTop: "4px",
                  fontSize: "12px",
                  color: "#687384",
                }}
              >
                {team.wins}-
                {team.losses}-
                {team.ties}
              </p>
            </div>

            <div
              style={{
                textAlign: "right",
              }}
            >
              <strong
                style={{
                  fontSize: "14px",
                }}
              >
                {team.pointsFor.toFixed(
                  2
                )}
              </strong>

              <p
                style={{
                  marginTop: "3px",
                  fontSize: "10px",
                  color: "#687384",
                }}
              >
                PF
              </p>
            </div>
          </article>
        )
      )}

      <h2
        style={{
          fontSize: "20px",
          margin:
            "28px 0 12px",
        }}
      >
        Season Stats
      </h2>

      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(2, 1fr)",
          gap: "8px",
        }}
      >
        <article
          style={statCardStyle}
        >
          <strong>
            {regularSeason.length}
          </strong>

          <p>
            Regular-season games
          </p>
        </article>

        <article
          style={statCardStyle}
        >
          <strong>
            {playoffGames.length}
          </strong>

          <p>
            Playoff games
          </p>
        </article>
      </section>

      <section
        style={{
          marginTop: "24px",
          background: "#151b23",
          border: "1px solid #27303b",
          borderRadius: "18px",
          padding: "18px",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "18px",
          }}
        >
          Coming Soon
        </h2>

        <p
          style={{
            marginTop: "8px",
            fontSize: "13px",
            lineHeight: 1.5,
          }}
        >
          Biggest games, season records,
          playoff bracket and award winners
          will appear here.
        </p>
      </section>
    </main>
  );
}

const statCardStyle = {
  background: "#151b23",
  border: "1px solid #27303b",
  borderRadius: "16px",
  padding: "16px",
};