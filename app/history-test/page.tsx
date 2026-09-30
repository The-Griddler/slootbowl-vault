import { getAllTimeRecords } from "../../lib/records";

export default async function HistoryTestPage() {
  const records = await getAllTimeRecords();

  return (
    <main>
      <h1>All-Time Records Test</h1>

      <p
        style={{
          marginTop: "10px",
          marginBottom: "24px",
        }}
      >
        Official records from Regular Season + Main
        Playoffs only.
      </p>

      <RecordCard
        title="Highest Team Score"
        record={records.highestTeamScore}
        valueLabel="points"
      />

      <RecordCard
        title="Lowest Team Score"
        record={records.lowestTeamScore}
        valueLabel="points"
      />

      <RecordCard
        title="Biggest Winning Margin"
        record={records.biggestWinningMargin}
        valueLabel="points"
      />

      <RecordCard
        title="Closest Game"
        record={records.closestGame}
        valueLabel="points"
      />
    </main>
  );
}

function RecordCard({
  title,
  record,
  valueLabel,
}: {
  title: string;
  record: {
    season: string;
    week: number;
    phase: string;
    rosterId: number;
    score: number;
    opponentRosterId: number;
    opponentScore: number;
    margin: number;
  } | null;
  valueLabel: string;
}) {
  if (!record) {
    return null;
  }

  return (
    <article
      style={{
        background: "#151b23",
        border: "1px solid #27303b",
        borderRadius: "18px",
        padding: "18px",
        marginBottom: "16px",
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
        {title.toUpperCase()}
      </p>

      <h2
        style={{
          margin: "8px 0",
          fontSize: "30px",
        }}
      >
        {title === "Highest Team Score" &&
          record.score.toFixed(2)}

        {title === "Lowest Team Score" &&
          record.score.toFixed(2)}

        {title === "Biggest Winning Margin" &&
          record.margin.toFixed(2)}

        {title === "Closest Game" &&
          record.margin.toFixed(2)}

        <span
          style={{
            fontSize: "14px",
            color: "#687384",
            marginLeft: "6px",
          }}
        >
          {valueLabel}
        </span>
      </h2>

      <p>
        {record.season} · Week {record.week} ·{" "}
        {record.phase}
      </p>

      <p
        style={{
          marginTop: "8px",
          color: "#f5f7fa",
        }}
      >
        Roster {record.rosterId}{" "}
        <span style={{ color: "#687384" }}>
          {record.score.toFixed(2)}
        </span>{" "}
        vs Roster {record.opponentRosterId}{" "}
        <span style={{ color: "#687384" }}>
          {record.opponentScore.toFixed(2)}
        </span>
      </p>
    </article>
  );
}