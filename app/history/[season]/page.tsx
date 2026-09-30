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

type BracketMatch = {
  m: number;
  r: number;
  t1: number | null;
  t2: number | null;
  w: number | null;
  l: number | null;
  p?: number;
};

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
    throw new Error(
      `Failed to load ${bracket} for ${leagueId}`
    );
  }

  return response.json();
}

function getDivision(
  rosterId: number
): "OBFC" | "GPFC" {
  const obfc = [4, 6, 7, 8, 9];

  return obfc.includes(rosterId)
    ? "OBFC"
    : "GPFC";
}

function buildRegularSeasonStandings(
  matchups: {
    phase: string;
    rosterA: number;
    rosterB: number;
    scoreA: number;
    scoreB: number;
  }[],
  division: "OBFC" | "GPFC"
) {
  const stats = new Map<
    number,
    {
      wins: number;
      losses: number;
      ties: number;
      pointsFor: number;
      pointsAgainst: number;
    }
  >();

  for (const matchup of matchups) {
    if (
      matchup.phase !==
      "Regular Season"
    ) {
      continue;
    }

    if (
      getDivision(
        matchup.rosterA
      ) !== division &&
      getDivision(
        matchup.rosterB
      ) !== division
    ) {
      continue;
    }

    if (!stats.has(matchup.rosterA)) {
      stats.set(matchup.rosterA, {
        wins: 0,
        losses: 0,
        ties: 0,
        pointsFor: 0,
        pointsAgainst: 0,
      });
    }

    if (!stats.has(matchup.rosterB)) {
      stats.set(matchup.rosterB, {
        wins: 0,
        losses: 0,
        ties: 0,
        pointsFor: 0,
        pointsAgainst: 0,
      });
    }

    const teamA =
      stats.get(matchup.rosterA)!;

    const teamB =
      stats.get(matchup.rosterB)!;

    teamA.pointsFor +=
      matchup.scoreA;

    teamA.pointsAgainst +=
      matchup.scoreB;

    teamB.pointsFor +=
      matchup.scoreB;

    teamB.pointsAgainst +=
      matchup.scoreA;

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
    stats.entries()
  )
    .map(
      ([rosterId, values]) => ({
        rosterId,
        ...values,
      })
    )
    .sort((a, b) => {
      if (b.wins !== a.wins) {
        return b.wins - a.wins;
      }

      return (
        b.pointsFor -
        a.pointsFor
      );
    });
}

function getPlacementGames(
  winnersBracket: BracketMatch[],
  losersBracket: BracketMatch[]
) {
  const allMatches = [
    ...winnersBracket,
    ...losersBracket,
  ];

  return allMatches.filter(
    (match) =>
      match.p !== undefined &&
      match.t1 !== null &&
      match.t2 !== null &&
      match.w !== null &&
      match.l !== null
  );
}

function buildFinalStandings(
  winnersBracket: BracketMatch[],
  losersBracket: BracketMatch[]
) {
  const placementGames =
    getPlacementGames(
      winnersBracket,
      losersBracket
    );

  const placements = new Map<
    number,
    number
  >();

  for (const match of placementGames) {
    if (
      match.p === undefined ||
      match.w === null ||
      match.l === null
    ) {
      continue;
    }

    placements.set(
      match.w,
      match.p
    );

    placements.set(
      match.l,
      match.p + 1
    );
  }

  return Array.from(
    placements.entries()
  )
    .map(
      ([rosterId, placement]) => ({
        rosterId,
        placement,
      })
    )
    .sort(
      (a, b) =>
        a.placement -
        b.placement
    );
}

export default async function SeasonPage({
  params,
}: SeasonPageProps) {
  const { season } =
    await params;

  const historicalData =
    await getHistoricalData();

  const selectedSeason =
    historicalData.find(
      (item) =>
        item.league.season ===
        season
    );

  if (!selectedSeason) {
    return (
      <main>
        <p style={eyebrowStyle}>
          SLOOTBOWL VAULT
        </p>

        <h1>
          Season Not Found
        </h1>

        <p
          style={{
            marginTop: "8px",
          }}
        >
          We couldn't find that
          SFL season.
        </p>
      </main>
    );
  }

  const [
    winnersBracket,
    losersBracket,
  ] = await Promise.all([
    getBracket(
      selectedSeason.league
        .league_id,
      "winners_bracket"
    ),
    getBracket(
      selectedSeason.league
        .league_id,
      "losers_bracket"
    ),
  ]);

  const regularSeason =
    selectedSeason.matchups.filter(
      (matchup) =>
        matchup.phase ===
        "Regular Season"
    );

  const obfc =
    buildRegularSeasonStandings(
      regularSeason,
      "OBFC"
    );

  const gpfc =
    buildRegularSeasonStandings(
      regularSeason,
      "GPFC"
    );

  const finalStandings =
    buildFinalStandings(
      winnersBracket,
      losersBracket
    );

  const championship =
    winnersBracket.find(
      (match) =>
        match.p === 1 &&
        match.t1 !== null &&
        match.t2 !== null &&
        match.w !== null
    );

  const playoffGames =
    selectedSeason.matchups.filter(
      (matchup) =>
        matchup.phase ===
        "Main Playoffs"
    );

  return (
    <main>
      <p style={eyebrowStyle}>
        DYNASTY SLUTS
      </p>

      <h1>
        {season} Season
      </h1>

      <p
        style={{
          marginBottom: "24px",
          lineHeight: 1.5,
        }}
      >
        Sluts Football League
      </p>

      <section
        style={heroCardStyle}
      >
        <p style={smallLabelStyle}>
          SLOOTBOWL
        </p>

        {championship &&
        championship.w !== null ? (
          <>
            <p
              style={{
                margin: 0,
                fontSize: "16px",
                fontWeight: 700,
              }}
            >
              {
                getFranchiseName(
                  championship.t1!
                )
              }
              {" "}
              vs{" "}
              {
                getFranchiseName(
                  championship.t2!
                )
              }
            </p>

            <p
              style={{
                marginTop: "8px",
                fontSize: "14px",
                color: "#9da7b3",
              }}
            >
              Champion
            </p>

            <p
              style={{
                marginTop: "6px",
                fontSize: "17px",
                fontWeight: 700,
              }}
            >
              🏆{" "}
              {getFranchiseName(
                championship.w
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
            Slootbowl not yet
            played.
          </p>
        )}
      </section>

      <h2 style={sectionTitleStyle}>
        Regular Season
      </h2>

      <p
        style={{
          fontSize: "13px",
          lineHeight: 1.5,
          marginBottom: "14px",
        }}
      >
        Final standings after Week
        14, shown separately by
        division.
      </p>

      <DivisionTable
        name="OBFC"
        teams={obfc}
      />

      <DivisionTable
        name="GPFC"
        teams={gpfc}
      />

      <h2
        style={{
          ...sectionTitleStyle,
          marginTop: "30px",
        }}
      >
        Final Season Standings
      </h2>

      <p
        style={{
          fontSize: "13px",
          lineHeight: 1.5,
          marginBottom: "14px",
        }}
      >
        Overall finishing position
        after the playoffs and
        placement games.
      </p>

      {finalStandings.map(
        (team) => (
          <article
            key={team.rosterId}
            style={teamCardStyle}
          >
            <strong
              style={{
                width: "28px",
                fontSize: "15px",
                color: "#687384",
              }}
            >
              {team.placement}
            </strong>

            <div
              style={{
                flex: 1,
                minWidth: 0,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: "15px",
                  fontWeight: 700,
                  color:
                    "#f5f7fa",
                }}
              >
                {getFranchiseName(
                  team.rosterId
                )}
              </p>
            </div>

            {team.placement ===
              1 && (
              <span
                style={{
                  fontSize: "18px",
                }}
              >
                🏆
              </span>
            )}

            {team.placement ===
              2 && (
              <span
                style={{
                  fontSize: "18px",
                }}
              >
                🥈
              </span>
            )}
          </article>
        )
      )}

      <h2
        style={{
          ...sectionTitleStyle,
          marginTop: "30px",
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
          <strong
            style={statNumberStyle}
          >
            {regularSeason.length}
          </strong>

          <p
            style={statLabelStyle}
          >
            Regular-season games
          </p>
        </article>

        <article
          style={statCardStyle}
        >
          <strong
            style={statNumberStyle}
          >
            {playoffGames.length}
          </strong>

          <p
            style={statLabelStyle}
          >
            Official playoff games
          </p>
        </article>
      </section>
    </main>
  );
}

function DivisionTable({
  name,
  teams,
}: {
  name: string;
  teams: {
    rosterId: number;
    wins: number;
    losses: number;
    ties: number;
    pointsFor: number;
    pointsAgainst: number;
  }[];
}) {
  return (
    <section
      style={{
        marginBottom: "18px",
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
        {name}
      </p>

      {teams.map(
        (team, index) => (
          <article
            key={team.rosterId}
            style={teamCardStyle}
          >
            <strong
              style={{
                width: "24px",
                fontSize: "13px",
                color: "#687384",
              }}
            >
              {index + 1}
            </strong>

            <div
              style={{
                flex: 1,
                minWidth: 0,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: "14px",
                  fontWeight: 700,
                  color:
                    "#f5f7fa",
                }}
              >
                {getFranchiseName(
                  team.rosterId
                )}
              </p>

              <p
                style={{
                  marginTop: "4px",
                  fontSize: "11px",
                  color: "#687384",
                }}
              >
                {team.pointsFor.toFixed(
                  2
                )}{" "}
                PF ·{" "}
                {team.pointsAgainst.toFixed(
                  2
                )}{" "}
                PA
              </p>
            </div>

            <strong
              style={{
                fontSize: "14px",
              }}
            >
              {team.wins}-
              {team.losses}-
              {team.ties}
            </strong>
          </article>
        )
      )}
    </section>
  );
}

const eyebrowStyle = {
  fontSize: "12px",
  fontWeight: 700,
  letterSpacing: "1.5px",
  color: "#687384",
  marginBottom: "6px",
};

const heroCardStyle = {
  background: "#151b23",
  border: "1px solid #27303b",
  borderRadius: "18px",
  padding: "18px",
  marginBottom: "26px",
};

const smallLabelStyle = {
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "1px",
  color: "#687384",
  marginBottom: "8px",
};

const sectionTitleStyle = {
  fontSize: "20px",
  margin: "0 0 10px",
};

const teamCardStyle = {
  background: "#151b23",
  border: "1px solid #27303b",
  borderRadius: "16px",
  padding: "14px",
  marginBottom: "8px",
  display: "flex",
  alignItems: "center",
  gap: "10px",
};

const statCardStyle = {
  background: "#151b23",
  border: "1px solid #27303b",
  borderRadius: "16px",
  padding: "16px",
};

const statNumberStyle = {
  fontSize: "20px",
};

const statLabelStyle = {
  marginTop: "4px",
  fontSize: "11px",
  color: "#687384",
};