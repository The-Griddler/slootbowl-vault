import { getAllTimeRecords } from "../../lib/records";
import { getFranchiseName } from "../../lib/franchises";

export default async function RecordsPage() {
  const records = await getAllTimeRecords();

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

      <h1>Records</h1>

      <p
        style={{
          marginTop: "8px",
          marginBottom: "28px",
        }}
      >
        All-time league records from 2022–2026.
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
    <section style={{ marginBottom: "36px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            width: "4px",
            height: "26px",
            background: "#ffffff",
            borderRadius: "4px",
          }}
        />

        <h2
          style={{
            margin: 0,
            fontSize: "24px",
          }}
        >
          {title}
        </h2>
      </div>

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

  const teamName = getFranchiseName(
    record.rosterId
  );

  const opponentName = getFranchiseName(
    record.opponentRosterId
  );

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
          fontSize: "11px",
          fontWeight: "700",
          letterSpacing: "1px",
          color: "#687384",
        }}
      >
        {title.toUpperCase()}
      </p>

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: "7px",
          marginTop: "5px",
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: "30px",
          }}
        >
          {value(record)}
        </h3>

        <span
          style={{
            fontSize: "13px",
            color: "#687384",
          }}
        >
          {suffix}
        </span>
      </div>

      <p
        style={{
          marginTop: "8px",
          color: "#ffffff",
          fontWeight: "600",
        }}
      >
        {teamName}
      </p>

      <p
        style={{
          marginTop: "4px",
          fontSize: "13px",
        }}
      >
        {teamName}{" "}
        {record.score.toFixed(2)}
        {"  "}
        <span
          style={{
            color: "#687384",
          }}
        >
          vs
        </span>
        {"  "}
        {opponentName}{" "}
        {record.opponentScore.toFixed(2)}
      </p>

      <p
        style={{
          marginTop: "8px",
          fontSize: "12px",
          color: "#687384",
        }}
      >
        {record.season} · Week{" "}
        {record.week}
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