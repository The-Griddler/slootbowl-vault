import { getRosters, getUsers } from "../lib/sleeper";

const OFFICIAL_TEAM_NAMES: Record<number, string> = {
  1: "Mt Isa Ballbags",
  2: "Cambridge Cum Sluts",
  3: "Grimsby Chode Chokers",
  4: "Isle of Wight Happy Endings",
  5: "Grays Town Fingerblasters",
  6: "Lincoln Nonces",
  7: "Kalamata Dirty Vegans",
  8: "Weybiza BAB’s",
  9: "East Rutherford Shitlickers",
  10: "Chad Moist Discharge",
};

const TEAM_DIVISIONS: Record<number, "OBFC" | "GPFC"> = {
  1: "GPFC",
  2: "GPFC",
  3: "GPFC",
  4: "OBFC",
  5: "GPFC",
  6: "OBFC",
  7: "OBFC",
  8: "OBFC",
  9: "OBFC",
  10: "GPFC",
};

const DIVISION_NAMES = {
  OBFC: "Osmington Bay Football Conference",
  GPFC: "Gloucester-Plymouth Football Conference",
};

export default async function Home() {
  const [users, rosters] = await Promise.all([
    getUsers(),
    getRosters(),
  ]);

  const teams = rosters
    .map((roster) => {
      const user = users.find(
        (user) => user.user_id === roster.owner_id
      );

      return {
        rosterId: roster.roster_id,
        manager: user?.display_name ?? "Unknown Manager",
        teamName:
          OFFICIAL_TEAM_NAMES[roster.roster_id] ??
          user?.display_name ??
          "Unknown Team",
        division: TEAM_DIVISIONS[roster.roster_id],
        wins: roster.settings?.wins ?? 0,
        losses: roster.settings?.losses ?? 0,
        ties: roster.settings?.ties ?? 0,
        pointsFor: roster.settings?.fpts ?? 0,
      };
    })
    .sort((a, b) => {
      if (b.wins !== a.wins) {
        return b.wins - a.wins;
      }

      return b.pointsFor - a.pointsFor;
    });

  const obfcTeams = teams.filter(
    (team) => team.division === "OBFC"
  );

  const gpfcTeams = teams.filter(
    (team) => team.division === "GPFC"
  );

  const renderDivision = (
    division: "OBFC" | "GPFC",
    divisionTeams: typeof teams
  ) => (
    <section style={{ marginBottom: "36px" }}>
      <div style={{ marginBottom: "14px" }}>
        <p
          style={{
            margin: 0,
            fontSize: "12px",
            fontWeight: "700",
            letterSpacing: "2px",
            color: "#687384",
          }}
        >
          {division}
        </p>

        <h2
          style={{
            margin: "4px 0 0",
            fontSize: "22px",
          }}
        >
          {DIVISION_NAMES[division]}
        </h2>
      </div>

      {divisionTeams.map((team, index) => (
        <article
          key={team.rosterId}
          style={{
            background: "#151b23",
            border: "1px solid #27303b",
            borderRadius: "18px",
            padding: "18px",
            marginBottom: "10px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <div
            style={{
              width: "32px",
              textAlign: "center",
              fontSize: "18px",
              fontWeight: "700",
              color: index === 0 ? "#ffffff" : "#687384",
            }}
          >
            {index + 1}
          </div>

          <div
            style={{
              flex: 1,
              minWidth: 0,
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: "18px",
                lineHeight: 1.2,
              }}
            >
              {team.teamName}
            </h3>

            <p
              style={{
                marginTop: "5px",
                fontSize: "13px",
              }}
            >
              {team.manager}
            </p>
          </div>

          <div
            style={{
              textAlign: "right",
              minWidth: "75px",
            }}
          >
            <strong
              style={{
                display: "block",
                fontSize: "18px",
                color: "#ffffff",
              }}
            >
              {team.wins}-{team.losses}
              {team.ties > 0 ? `-${team.ties}` : ""}
            </strong>

            <p
              style={{
                marginTop: "4px",
                fontSize: "12px",
              }}
            >
              {team.pointsFor.toFixed(1)} PF
            </p>
          </div>
        </article>
      ))}
    </section>
  );

  return (
    <main>
      <header
        style={{
          marginBottom: "32px",
        }}
      >
        <p
          style={{
            fontSize: "12px",
            fontWeight: "700",
            letterSpacing: "2px",
            color: "#687384",
            marginBottom: "6px",
          }}
        >
          DYNASTY SLUTS
        </p>

        <h1
          style={{
            fontSize: "34px",
            margin: 0,
          }}
        >
          Standings
        </h1>

        <p
          style={{
            marginTop: "6px",
          }}
        >
          2026 Season
        </p>
      </header>

      {renderDivision("OBFC", obfcTeams)}

      {renderDivision("GPFC", gpfcTeams)}
    </main>
  );
}