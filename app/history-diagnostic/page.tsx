import {
  getLeagueHistory,
} from "../../lib/sleeper";

type BracketMatch = {
  m: number;
  r: number;
  t1: number | null;
  t2: number | null;
  w: number | null;
  l: number | null;
  p?: number;
};

async function getWinnersBracket(
  leagueId: string
): Promise<BracketMatch[]> {
  const response = await fetch(
    `https://api.sleeper.app/v1/league/${leagueId}/winners_bracket`,
    {
      next: {
        revalidate: 300,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to load winners bracket for ${leagueId}`
    );
  }

  return response.json();
}

export default async function HistoryDiagnosticPage() {
  const leagues = await getLeagueHistory();

  const seasons = await Promise.all(
    leagues.map(async (league) => {
      const bracket =
        await getWinnersBracket(
          league.league_id
        );

      return {
        league,
        bracket,
      };
    })
  );

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

      <h1>History Diagnostic</h1>

      <p
        style={{
          marginBottom: "24px",
          lineHeight: 1.5,
        }}
      >
        Historical winners brackets from Sleeper.
      </p>

      {seasons.map(
        ({
          league,
          bracket,
        }) => (
          <section
            key={league.league_id}
            style={{
              marginBottom: "30px",
            }}
          >
            <h2
              style={{
                margin: "0 0 10px",
                fontSize: "22px",
              }}
            >
              {league.season}
            </h2>

            {bracket
              .sort(
                (a, b) =>
                  a.r - b.r ||
                  a.m - b.m
              )
              .map((match) => (
                <article
                  key={`${league.league_id}-${match.m}`}
                  style={{
                    background:
                      "#151b23",
                    border:
                      "1px solid #27303b",
                    borderRadius:
                      "16px",
                    padding: "14px",
                    marginBottom:
                      "8px",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: "12px",
                      color: "#687384",
                    }}
                  >
                    Round {match.r} · Match{" "}
                    {match.m}
                  </p>

                  <p
                    style={{
                      marginTop:
                        "8px",
                      fontSize:
                        "14px",
                    }}
                  >
                    Roster{" "}
                    {match.t1 ??
                      "TBD"}{" "}
                    vs Roster{" "}
                    {match.t2 ??
                      "TBD"}
                  </p>

                  <p
                    style={{
                      marginTop:
                        "6px",
                      fontSize:
                        "12px",
                      color: "#687384",
                    }}
                  >
                    Winner:{" "}
                    {match.w ??
                      "TBD"}{" "}
                    · Loser:{" "}
                    {match.l ??
                      "TBD"}
                  </p>
                </article>
              ))}
          </section>
        )
      )}
    </main>
  );
}