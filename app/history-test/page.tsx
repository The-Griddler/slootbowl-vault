import { getAllTimeRecords } from "../../lib/records";

export default async function HistoryTestPage() {
  const records = await getAllTimeRecords();

  return (
    <main>
      <h1>All-Time Records Test</h1>

      <p
        style={{
          marginTop: "10px",
          marginBottom: "28px",
        }}
      >
        Official records from 2022–2026. Toilet Bowl and
        consolation games are excluded.
      </p>

      <RecordSection
        title="Regular Season"
        records={records.regularSeason}
      />

      <RecordSection
        title="Main Playoffs"
        records={records.mainPlayoffs}
      />
    </main>
  );
}

function RecordSection({
  title,
  records,
}: {
  title: string;
  records: {
    highestTeamScore: LeagueRecord | null;
    lowestTeamScore: LeagueRecord | null;
    biggestWinningMargin: LeagueRecord | null;
    closestGame: LeagueRecord | null;
  };
}) {
  return (
    <section style={{ marginBottom: "32px" }}>
      <p
        style={{
          fontSize: "12px",
          fontWeight: "700",
          letterSpacing: "1px",
          color: "#687384",
          marginBottom: "8px",
        }}
      >
        RECORD CATEGORY
      </p>

      <h2
        style={{
          fontSize: "24px",
          margin: "0 0 16px",
        }}
      >
        {title}
      </h2>

      <RecordCard
        title="Highest Team Score"
        record={records.highestTeamScore}
        value={(record) =>
          record.score.toFixed(2)
        }
        suffix="pts"
      />

      <RecordCard
        title="Lowest Team Score"
        record={records.lowestTeamScore}
        value={(record) =>
          record.score.toFixed(2)
        }
        suffix="pts"
      />

      <RecordCard
        title="Biggest Winning Margin"
        record={records.biggestWinningMargin}
        value={(record) =>
          record.margin.toFixed(2)
        }
        suffix="pts"
      />

      <RecordCard
        title="Closest Game"
        record={records.closestGame}
        value={(record) =>
          record.margin.toFixed(2)
        }
        suffix="pts"
      />
    </section>
  );
}

function RecordCard({
  title,
  record,
  value,
  suffix,
}: {
  title: string;
  record: LeagueRecord | null;
  value: (record: LeagueRecord) => string;
  suffix: string;
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
        marginBottom: "12px",
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

      <h3
        style={{
          margin: "8px 0",
          fontSize: "30px",
        }}
      >
        {value(record)}

        <span
          style={{
            fontSize: "14px",
            color: "#687384",
            marginLeft: "6px",
          }}
        >
          {suffix}
        </span>
      </h3>

      <p>
        {record.season} · Week {record.week}
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

type LeagueRecord = {
  season: string;
  week: number;
  phase: string;
  rosterId: number;
  score: number;
  opponentRosterId: number;
  opponentScore: number;
  margin: number;
};