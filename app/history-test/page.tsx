import { getHistoricalData } from "../../lib/sleeper";

export default async function HistoryTestPage() {
  const seasons = await getHistoricalData();

  return (
    <main>
      <h1>Historical Data Test</h1>

      <p
        style={{
          marginTop: "10px",
          marginBottom: "24px",
        }}
      >
        Checking how Sleeper games are classified across all
        historical seasons.
      </p>

      {seasons.map((season) => {
        const regularSeason = season.matchups.filter(
          (matchup) =>
            matchup.phase === "Regular Season"
        );

        const mainPlayoffs = season.matchups.filter(
          (matchup) =>
            matchup.phase === "Main Playoffs"
        );

        const toiletBowl = season.matchups.filter(
          (matchup) =>
            matchup.phase === "Toilet Bowl"
        );

        const ignored = season.matchups.filter(
          (matchup) =>
            matchup.phase === "Ignored"
        );

        return (
          <article
            key={season.league.league_id}
            style={{
              background: "#151b23",
              border: "1px solid #27303b",
              borderRadius: "18px",
              padding: "18px",
              marginBottom: "20px",
            }}
          >
            <p
              style={{
                fontSize: "12px",
                fontWeight: "700",
                letterSpacing: "1px",
                color: "#687384",
              }}
            >
              SEASON
            </p>

            <h2
              style={{
                margin: "6px 0 18px",
                fontSize: "24px",
              }}
            >
              {season.league.season}
            </h2>

            <div
              style={{
                display: "grid",
                gap: "8px",
              }}
            >
              <StatRow
                label="Regular Season"
                value={regularSeason.length}
              />

              <StatRow
                label="Main Playoffs"
                value={mainPlayoffs.length}
              />

              <StatRow
                label="Toilet Bowl"
                value={toiletBowl.length}
              />

              <StatRow
                label="Ignored"
                value={ignored.length}
              />
            </div>

            <div
              style={{
                height: "1px",
                background: "#27303b",
                margin: "18px 0",
              }}
            />

            <p
              style={{
                fontSize: "12px",
                fontWeight: "700",
                letterSpacing: "1px",
                color: "#687384",
                marginBottom: "10px",
              }}
            >
              PLAYOFF CLASSIFICATION
            </p>

            {season.matchups
              .filter(
                (matchup) => matchup.week >= 15
              )
              .map((matchup, index) => (
                <div
                  key={`${matchup.week}-${matchup.rosterA}-${matchup.rosterB}-${index}`}
                  style={{
                    padding: "10px 0",
                    borderBottom:
                      "1px solid #27303b",
                    fontSize: "13px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      gap: "12px",
                    }}
                  >
                    <span>
                      Week {matchup.week}:{" "}
                      {matchup.rosterA} vs{" "}
                      {matchup.rosterB}
                    </span>

                    <span
                      style={{
                        color:
                          matchup.phase ===
                          "Main Playoffs"
                            ? "#ffffff"
                            : matchup.phase ===
                              "Toilet Bowl"
                            ? "#9da7b3"
                            : "#687384",
                        fontWeight: "700",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {matchup.phase}
                    </span>
                  </div>
                </div>
              ))}
          </article>
        );
      })}
    </main>
  );
}

function StatRow({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 12px",
        background: "#0f141b",
        borderRadius: "10px",
      }}
    >
      <span>{label}</span>

      <strong>{value}</strong>
    </div>
  );
}