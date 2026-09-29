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

export default async function Home() {
  const [users, rosters] = await Promise.all([
    getUsers(),
    getRosters(),
  ]);

  const teams = rosters.map((roster) => {
    const user = users.find(
      (user) => user.user_id === roster.owner_id
    );

    return {
      rosterId: roster.roster_id,
      manager: user?.display_name ?? "Unknown Manager",
      wins: roster.settings?.wins ?? 0,
      losses: roster.settings?.losses ?? 0,
      pointsFor: roster.settings?.fpts ?? 0,
    };
  });

  return (
    <main>
      <header>
        <p>DYNASTY SLUTS</p>

        <h1>League Teams</h1>

        <p>Live data from Sleeper</p>
      </header>

      <section>
        {teams.map((team) => (
          <article
            key={team.rosterId}
            style={{
              background: "#151b23",
              border: "1px solid #27303b",
              borderRadius: "16px",
              padding: "18px",
              marginTop: "12px",
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#687384",
                fontSize: "12px",
              }}
            >
              TEAM {team.rosterId}
            </p>

            <h2
              style={{
                margin: "6px 0",
                fontSize: "20px",
              }}
            >
              {OFFICIAL_TEAM_NAMES[team.rosterId] ?? team.manager}
            </h2>

            <p>
              {team.manager}
            </p>

            <strong>
              {team.wins}-{team.losses}
            </strong>

            <p>
              {team.pointsFor.toFixed(2)} points
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}