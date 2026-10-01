import { notFound } from "next/navigation";
import { getHistoricalData } from "../../../lib/sleeper";
import { getFranchiseName } from "../../../lib/franchises";
export default async function SeasonPage({
  params,
}: {
  params: Promise<{ season: string }>;
}) {
  const { season } = await params;
  const historicalData = await getHistoricalData();
  const seasonData = historicalData.find(
    (item) => item.league.season === season
  );
  if (!seasonData) {
    notFound();
  }
  const championship = {
    "2022": { champion: 2, runnerUp: 8 },
    "2023": { champion: 4, runnerUp: 2 },
    "2024": { champion: 10, runnerUp: 4 },
    "2025": { champion: 10, runnerUp: 9 },
  }[season];
  return (
    <main>
      <p
        style={{
          fontSize: "11px",
          fontWeight: "700",
          letterSpacing: "1.5px",
          color: "#687384",
          marginBottom: "6px",
        }}
      >
        SFL HISTORY
      </p>
      <h1>{season} Season</h1>
      <p style={{ marginTop: "6px" }}>
        The Sluts Football League {season} season.
      </p>
      <section
        style={{
          background: "#151b23",
          border: "1px solid #27303b",
          borderRadius: "20px",
          padding: "18px",
          marginTop: "28px",
        }}
      >
        <p
          style={{
            fontSize: "11px",
            fontWeight: "700",
            letterSpacing: "1.5px",
            color: "#687384",
          }}
        >
          SLOOTBOWL
        </p>
        {championship ? (
          <>
            <h2
              style={{
                margin: "6px 0 4px",
                fontSize: "22px",
              }}
            >
              🏆 {getFranchiseName(championship.champion)}
            </h2>
            <p>
              Defeated {getFranchiseName(championship.runnerUp)}
            </p>
          </>
        ) : (
          <h2
            style={{
              margin: "6px 0 0",
              fontSize: "20px",
            }}
          >
            Slootbowl not yet played
          </h2>
        )}
      </section>
      <section
        style={{
          background: "#151b23",
          border: "1px solid #27303b",
          borderRadius: "20px",
          padding: "18px",
          marginTop: "14px",
        }}
      >
        <p
          style={{
            fontSize: "11px",
            fontWeight: "700",
            letterSpacing: "1.5px",
            color: "#687384",
          }}
        >
          SEASON DATA
        </p>
        <p style={{ marginTop: "8px" }}>
          {seasonData.matchups.length} recorded matchups.
        </p>
      </section>
    </main>
  );
}