import { getLeague } from "../../lib/sleeper";

export default async function HistoryTestPage() {
  const league = await getLeague();

  return (
    <main>
      <h1>League History Test</h1>

      <p style={{ marginTop: "20px" }}>
        League: {league.name}
      </p>

      <p style={{ marginTop: "10px" }}>
        Season: {league.season}
      </p>

      <p style={{ marginTop: "10px" }}>
        Previous League ID:
      </p>

      <p
        style={{
          marginTop: "5px",
          wordBreak: "break-all",
        }}
      >
        {league.previous_league_id ?? "None"}
      </p>
    </main>
  );
}