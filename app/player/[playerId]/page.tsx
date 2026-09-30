import {
  getPlayerRecords,
} from "../../../lib/playerRecords";

import {
  getPlayers,
  getPlayerName,
  getPlayerPosition,
} from "../../../lib/players";

import {
  getFranchiseName,
} from "../../../lib/franchises";

type PlayerPageProps = {
  params: Promise<{
    playerId: string;
  }>;
};

export default async function PlayerPage({
  params,
}: PlayerPageProps) {
  const { playerId } =
    await params;

  const [
    records,
    players,
  ] = await Promise.all([
    getPlayerRecords(),
    getPlayers(),
  ]);

  const player =
    players[playerId];

  if (!player) {
    return (
      <main>
        <p
          style={{
            fontSize: "12px",
            fontWeight: "700",
            letterSpacing: "1.5px",
            color: "#687384",
            marginBottom: "8px",
          }}
        >
          DYNASTY SLUTS
        </p>

        <h1>
          Player Not Found
        </h1>

        <p
          style={{
            marginTop: "8px",
          }}
        >
          We couldn't find this player
          in the Sleeper database.
        </p>
      </main>
    );
  }

  const career =
    records.careers.find(
      (record) =>
        record.playerId ===
        playerId
    );

  const seasonRecords =
    records.seasons
      .filter(
        (record) =>
          record.playerId ===
          playerId
      )
      .sort(
        (a, b) =>
          Number(b.season) -
          Number(a.season)
      );

  const franchiseRecords =
    records.franchises
      .filter(
        (record) =>
          record.playerId ===
          playerId
      )
      .sort(
        (a, b) =>
          b.points - a.points
      );

  const bestGame =
    records.games
      .filter(
        (game) =>
          game.playerId ===
          playerId
      )
      .sort(
        (a, b) =>
          b.points - a.points
      )[0] ?? null;

  const playerWeeks =
    records.weekly
      .filter(
        (week) =>
          week.playerId ===
          playerId
      )
      .sort((a, b) => {
        if (
          a.season !==
          b.season
        ) {
          return (
            Number(b.season) -
            Number(a.season)
          );
        }

        return (
          b.week - a.week
        );
      });

  return (
    <main>
      <p
        style={{
          fontSize: "12px",
          fontWeight: "700",
          letterSpacing: "1.5px",
          color: "#687384",
          marginBottom: "8px",
        }}
      >
        DYNASTY SLUTS
      </p>

      <h1>
        {getPlayerName(
          player
        )}
      </h1>

      <p
        style={{
          marginTop: "6px",
          marginBottom: "30px",
          fontWeight: "700",
        }}
      >
        {getPlayerPosition(
          player
        )}
      </p>

      <section>
        <h2 style={sectionHeadingStyle}>
          Career
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "1fr 1fr",
            gap: "10px",
          }}
        >
          <StatCard
            label="Career points"
            value={
              career
                ? career.points.toFixed(
                    2
                  )
                : "0.00"
            }
          />

          <StatCard
            label="Starts"
            value={
              career
                ? career.starts.toString()
                : "0"
            }
          />

          <StatCard
            label="Seasons"
            value={
              career
                ? career.seasons.length.toString()
                : "0"
            }
          />

          <StatCard
            label="Best game"
            value={
              bestGame
                ? bestGame.points.toFixed(
                    2
                  )
                : "0.00"
            }
          />
        </div>
      </section>

      <section
        style={{
          marginTop: "40px",
        }}
      >
        <h2 style={sectionHeadingStyle}>
          Best Game
        </h2>

        {bestGame ? (
          <article
            style={cardStyle}
          >
            <p style={labelStyle}>
              HIGHEST SINGLE-GAME SCORE
            </p>

            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "flex-end",
                gap: "16px",
                marginTop: "10px",
              }}
            >
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "20px",
                  }}
                >
                  {bestGame.season}
                </h3>

                <p
                  style={{
                    marginTop:
                      "5px",
                    fontSize:
                      "13px",
                  }}
                >
                  Week{" "}
                  {bestGame.week}
                  {" · "}
                  {bestGame.phase}
                </p>
              </div>

              <strong
                style={{
                  fontSize:
                    "28px",
                }}
              >
                {bestGame.points.toFixed(
                  2
                )}
              </strong>
            </div>
          </article>
        ) : (
          <article
            style={cardStyle}
          >
            No games recorded.
          </article>
        )}
      </section>

      <section
        style={{
          marginTop: "40px",
        }}
      >
        <h2 style={sectionHeadingStyle}>
          Season History
        </h2>

        {seasonRecords.map(
          (record) => (
            <article
              key={record.season}
              style={cardStyle}
            >
              <div
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "center",
                  gap: "12px",
                }}
              >
                <div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize:
                        "19px",
                    }}
                  >
                    {record.season}
                  </h3>

                  <p
                    style={{
                      marginTop:
                        "5px",
                      fontSize:
                        "12px",
                    }}
                  >
                    {record.starts}{" "}
                    starts
                  </p>
                </div>

                <strong
                  style={{
                    fontSize:
                      "21px",
                  }}
                >
                  {record.points.toFixed(
                    2
                  )}
                </strong>
              </div>
            </article>
          )
        )}
      </section>

      <section
        style={{
          marginTop: "40px",
        }}
      >
        <h2 style={sectionHeadingStyle}>
          Franchise History
        </h2>

        {franchiseRecords.map(
          (record) => (
            <article
              key={`${record.rosterId}-${record.playerId}`}
              style={cardStyle}
            >
              <div
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "center",
                  gap: "12px",
                }}
              >
                <div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize:
                        "18px",
                    }}
                  >
                    {getFranchiseName(
                      record.rosterId
                    )}
                  </h3>

                  <p
                    style={{
                      marginTop:
                        "5px",
                      fontSize:
                        "12px",
                    }}
                  >
                    {record.starts}{" "}
                    starts
                  </p>
                </div>

                <strong
                  style={{
                    fontSize:
                      "19px",
                  }}
                >
                  {record.points.toFixed(
                    2
                  )}
                </strong>
              </div>
            </article>
          )
        )}
      </section>

      <section
        style={{
          marginTop: "40px",
        }}
      >
        <h2 style={sectionHeadingStyle}>
          Weekly History
        </h2>

        {playerWeeks
          .slice(0, 30)
          .map(
            (
              week,
              index
            ) => (
              <article
                key={`${week.season}-${week.week}-${week.rosterId}-${index}`}
                style={
                  weeklyCardStyle
                }
              >
                <div>
                  <strong>
                    {week.season}
                  </strong>

                  <p
                    style={{
                      marginTop:
                        "3px",
                      fontSize:
                        "12px",
                    }}
                  >
                    Week{" "}
                    {week.week}
                    {" · "}
                    {getFranchiseName(
                      week.rosterId
                    )}
                  </p>
                </div>

                <strong
                  style={{
                    fontSize:
                      "17px",
                  }}
                >
                  {week.points.toFixed(
                    2
                  )}
                </strong>
              </article>
            )
          )}
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <article
      style={{
        background: "#151b23",
        border:
          "1px solid #27303b",
        borderRadius: "16px",
        padding: "16px",
      }}
    >
      <p style={labelStyle}>
        {label}
      </p>

      <strong
        style={{
          display: "block",
          marginTop: "8px",
          fontSize: "24px",
        }}
      >
        {value}
      </strong>
    </article>
  );
}

const cardStyle = {
  background: "#151b23",
  border: "1px solid #27303b",
  borderRadius: "18px",
  padding: "18px",
  marginBottom: "12px",
};

const weeklyCardStyle = {
  background: "#151b23",
  border: "1px solid #27303b",
  borderRadius: "14px",
  padding: "14px 16px",
  marginBottom: "8px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
};

const labelStyle = {
  fontSize: "11px",
  fontWeight: "700",
  letterSpacing: "1px",
  color: "#687384",
};

const sectionHeadingStyle = {
  fontSize: "22px",
  marginBottom: "14px",
};