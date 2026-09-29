type League = {
  name: string;
  season: string;
  status: string;
};

async function getLeague(): Promise<League> {
  const response = await fetch(
    "https://api.sleeper.app/v1/league/1326512818865868800",
    {
      next: { revalidate: 300 },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to load league");
  }

  return response.json();
}

export default async function Home() {
  const league = await getLeague();

  return (
    <main>
      <p>FANTASY FOOTBALL</p>

      <h1>{league.name}</h1>

      <p>
        {league.season} Season · {league.status}
      </p>

      <section>
        <h2>Dynasty Sluts</h2>
        <p>League data successfully connected to Sleeper.</p>
      </section>
    </main>
  );
}