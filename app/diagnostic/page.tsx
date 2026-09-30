import {
  getPlayerRecords,
} from "../../lib/playerRecords";

import {
  getPlayers,
  getPlayerName,
  getPlayerPosition,
} from "../../lib/players";

export default async function DiagnosticPage() {
  const [
    records,
    players,
  ] = await Promise.all([
    getPlayerRecords(),
    getPlayers(),
  ]);

  const topCareer =
    [...records.careers]
      .sort(
        (a, b) =>
          b.points - a.points
      )
      .slice(0, 10);

  const topSeasons =
    [...records.seasons]
      .sort(
        (a, b) =>
          b.points - a.points
      )
      .slice(0, 10);

  const topFranchisePlayers =
    [...records.franchises]
      .sort(
        (a, b) =>
          b.points - a.points
      )
      .slice(0, 10);

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
        Player Records Diagnostic
      </h1>

      <p
        style={{
          marginTop: "8px",
          marginBottom: "28px",
        }}
      >
        Historical player data
      </p>

      <article style={cardStyle}>
        <p style={labelStyle}>
          WEEKLY PERFORMANCES
        </p>

        <h2 style={valueStyle}>
          {records.weekly.length}
        </h2>
      </article>

      <article style={cardStyle}>
        <p style={labelStyle}>
          PLAYER SEASONS
        </p>

        <h2 style={valueStyle}>
          {records.seasons.length}
        </h2>
      </article>

      <article style={cardStyle}>
        <p style={labelStyle}>
          PLAYER CAREERS
        </p>

        <h2 style={valueStyle}>
          {records.careers.length}
        </h2>
      </article>

      <article style={cardStyle}>
        <p style={labelStyle}>
          FRANCHISE / PLAYER RECORDS
        </p>

        <h2 style={valueStyle}>
          {records.franchises.length}
        </h2>
      </article>

      <section style={sectionStyle}>
        <h2 style={sectionHeadingStyle}>
          Top Career Players
        </h2>

        {topCareer.map(
          (record, index) => {
            const player =
              players[
                record.playerId
              ];

            return (
              <RecordCard
                key={record.playerId}
                rank={index + 1}
                playerName={
                  getPlayerName(player)
                }
                position={
                  getPlayerPosition(
                    player
                  )
                }
                points={
                  record.points
                }
                starts={
                  record.starts
                }
                extra={`${record.seasons.length} seasons`}
              />
            );
          }
        )}
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionHeadingStyle}>
          Top Player Seasons
        </h2>

        {topSeasons.map(
          (record, index) => {
            const player =
              players[
                record.playerId
              ];

            return (
              <RecordCard
                key={`${record.season}-${record.playerId}`}
                rank={index + 1}
                playerName={
                  getPlayerName(player)
                }
                position={
                  getPlayerPosition(
                    player
                  )
                }
                points={
                  record.points
                }
                starts={
                  record.starts
                }
                extra={record.season}
              />
            );
          }
        )}
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionHeadingStyle}>
          Top Franchise / Player Totals
        </h2>

        {topFranchisePlayers.map(
          (record, index) => {
            const player =
              players[
                record.playerId
              ];

            return (
              <RecordCard
                key={`${record.rosterId}-${record.playerId}`}
                rank={index + 1}
                playerName={
                  getPlayerName(player)
                }
                position={
                  getPlayerPosition(
                    player
                  )
                }
                points={
                  record.points
                }
                starts={
                  record.starts
                }
                extra={`Roster ${record.rosterId}`}
              />
            );
          }
        )}
      </section>
    </main>
  );
}

function RecordCard({
  rank,
  playerName,
  position,
  points,
  starts,
  extra,
}: {
  rank: number;
  playerName: string;
  position: string;
  points: number;
  starts: number;
  extra: string;
}) {
  return (
    <article
      style={cardStyle}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: "10px",
        }}
      >
        <span
          style={{
            color: "#687384",
            fontSize: "13px",
            fontWeight: "700",
          }}
        >
          #{rank}
        </span>

        <h3
          style={{
            margin: 0,
            fontSize: "22px",
          }}
        >
          {playerName}
        </h3>
      </div>

      <p
        style={{
          marginTop: "5px",
          fontSize: "12px",
          fontWeight: "700",
          color: "#687384",
        }}
      >
        {position}
      </p>

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: "6px",
          marginTop: "8px",
        }}
      >
        <strong
          style={{
            fontSize: "28px",
          }}
        >
          {points.toFixed(2)}
        </strong>

        <span
          style={{
            color: "#687384",
            fontSize: "13px",
          }}
        >
          pts
        </span>
      </div>

      <p
        style={{
          marginTop: "7px",
          fontSize: "13px",
        }}
      >
        {starts} starts · {extra}
      </p>
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

const labelStyle = {
  fontSize: "11px",
  fontWeight: "700",
  letterSpacing: "1px",
  color: "#687384",
};

const valueStyle = {
  margin: "8px 0 0",
  fontSize: "24px",
};

const sectionStyle = {
  marginTop: "40px",
};

const sectionHeadingStyle = {
  fontSize: "22px",
  marginBottom: "14px",
};