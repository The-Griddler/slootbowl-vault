import {
  getPlayerRecords,
} from "../../lib/playerRecords";

import {
  getPlayers,
  getPlayerName,
  getPlayerPosition,
  SleeperPlayer,
} from "../../lib/players";

export default async function PlayerRecordsPage() {
  const [
    records,
    players,
  ] = await Promise.all([
    getPlayerRecords(),
    getPlayers(),
  ]);

  const highestGame =
    [...records.games]
      .sort(
        (a, b) =>
          b.points - a.points
      )[0] ?? null;

  const highestSeason =
    [...records.seasons]
      .sort(
        (a, b) =>
          b.points - a.points
      )[0] ?? null;

  const highestCareer =
    [...records.careers]
      .sort(
        (a, b) =>
          b.points - a.points
      )[0] ?? null;

  const mostStarts =
    [...records.careers]
      .sort(
        (a, b) =>
          b.starts - a.starts
      )[0] ?? null;

  const positionalRecords =
    getPositionalRecords(
      records,
      players
    );

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
        Player Records
      </h1>

      <p
        style={{
          marginTop: "8px",
          marginBottom: "30px",
        }}
      >
        The biggest player performances
        in Slootbowl history.
      </p>

      <section>
        <h2 style={sectionHeadingStyle}>
          All-Time
        </h2>

        <RecordCard
          label="Highest single-game score"
          record={
            highestGame
              ? {
                  playerId:
                    highestGame.playerId,
                  points:
                    highestGame.points,
                  detail:
                    `${highestGame.season} · Week ${highestGame.week}`,
                }
              : null
          }
          players={players}
        />

        <RecordCard
          label="Highest single-season total"
          record={
            highestSeason
              ? {
                  playerId:
                    highestSeason.playerId,
                  points:
                    highestSeason.points,
                  detail:
                    `${highestSeason.season} · ${highestSeason.starts} starts`,
                }
              : null
          }
          players={players}
        />

        <RecordCard
          label="Highest career total"
          record={
            highestCareer
              ? {
                  playerId:
                    highestCareer.playerId,
                  points:
                    highestCareer.points,
                  detail:
                    `${highestCareer.seasons.length} seasons · ${highestCareer.starts} starts`,
                }
              : null
          }
          players={players}
        />

        <RecordCard
          label="Most career starts"
          record={
            mostStarts
              ? {
                  playerId:
                    mostStarts.playerId,
                  points:
                    mostStarts.points,
                  detail:
                    `${mostStarts.starts} starts · ${mostStarts.seasons.length} seasons`,
                  secondaryValue:
                    mostStarts.starts.toString(),
                  secondaryLabel:
                    "starts",
                }
              : null
          }
          players={players}
        />
      </section>

      <section
        style={{
          marginTop: "40px",
        }}
      >
        <h2 style={sectionHeadingStyle}>
          Positional Records
        </h2>

        {positionalRecords.map(
          (record) => (
            <RecordCard
              key={record.position}
              label={`Highest career ${record.position} score`}
              record={record.record}
              players={players}
            />
          )
        )}
      </section>

      <section
        style={{
          marginTop: "40px",
        }}
      >
        <h2 style={sectionHeadingStyle}>
          Top 10 Career Players
        </h2>

        {[...records.careers]
          .sort(
            (a, b) =>
              b.points - a.points
          )
          .slice(0, 10)
          .map(
            (record, index) => {
              const player =
                players[
                  record.playerId
                ];

              return (
                <article
                  key={record.playerId}
                  style={listCardStyle}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems:
                        "center",
                      gap: "14px",
                    }}
                  >
                    <div
                      style={{
                        width: "32px",
                        color:
                          "#687384",
                        fontSize:
                          "13px",
                        fontWeight:
                          "700",
                      }}
                    >
                      #{index + 1}
                    </div>

                    <div
                      style={{
                        flex: 1,
                      }}
                    >
                      <h3
                        style={{
                          margin: 0,
                          fontSize:
                            "17px",
                        }}
                      >
                        {getPlayerName(
                          player
                        )}
                      </h3>

                      <p
                        style={{
                          marginTop:
                            "4px",
                          fontSize:
                            "12px",
                        }}
                      >
                        {getPlayerPosition(
                          player
                        )}{" "}
                        ·{" "}
                        {record.starts}{" "}
                        starts
                      </p>
                    </div>

                    <strong
                      style={{
                        fontSize:
                          "17px",
                      }}
                    >
                      {record.points.toFixed(
                        2
                      )}
                    </strong>
                  </div>
                </article>
              );
            }
          )}
      </section>
    </main>
  );
}

function getPositionalRecords(
  records: Awaited<
    ReturnType<
      typeof getPlayerRecords
    >
  >,
  players: Record<
    string,
    SleeperPlayer
  >
) {
  const positions = [
    "QB",
    "RB",
    "WR",
    "TE",
  ];

  return positions.map(
    (position) => {
      const eligible =
        records.careers.filter(
          (record) =>
            players[
              record.playerId
            ]?.position ===
            position
        );

      const winner =
        [...eligible].sort(
          (a, b) =>
            b.points - a.points
        )[0] ?? null;

      return {
        position,
        record: winner
          ? {
              playerId:
                winner.playerId,
              points:
                winner.points,
              detail:
                `${winner.seasons.length} seasons · ${winner.starts} starts`,
            }
          : null,
      };
    }
  );
}

function RecordCard({
  label,
  record,
  players,
}: {
  label: string;
  record: {
    playerId: string;
    points: number;
    detail: string;
    secondaryValue?: string;
    secondaryLabel?: string;
  } | null;
  players: Record<
    string,
    SleeperPlayer
  >;
}) {
  if (!record) {
    return (
      <article
        style={cardStyle}
      >
        <p style={labelStyle}>
          {label}
        </p>

        <p
          style={{
            marginTop: "10px",
          }}
        >
          No record available
        </p>
      </article>
    );
  }

  const player =
    players[record.playerId];

  return (
    <article
      style={cardStyle}
    >
      <p style={labelStyle}>
        {label}
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
        <div
          style={{
            minWidth: 0,
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: "22px",
            }}
          >
            {getPlayerName(
              player
            )}
          </h3>

          <p
            style={{
              marginTop: "5px",
              fontSize: "12px",
            }}
          >
            {getPlayerPosition(
              player
            )}
            {" · "}
            {record.detail}
          </p>
        </div>

        <div
          style={{
            textAlign:
              "right",
            flexShrink: 0,
          }}
        >
          <strong
            style={{
              fontSize: "26px",
            }}
          >
            {record.secondaryValue ??
              record.points.toFixed(
                2
              )}
          </strong>

          <p
            style={{
              marginTop: "2px",
              fontSize: "11px",
            }}
          >
            {record.secondaryLabel ??
              "pts"}
          </p>
        </div>
      </div>
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

const listCardStyle = {
  background: "#151b23",
  border: "1px solid #27303b",
  borderRadius: "16px",
  padding: "15px 16px",
  marginBottom: "8px",
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