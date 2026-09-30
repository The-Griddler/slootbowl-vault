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
        Team records across the history of the league.
      </p>

      <RecordSection
        title="Individual Game"
        records={records.individualGame.regularSeason}
        playoffRecords={records.individualGame.mainPlayoffs}
      />

      <SeasonSection
        title="Season Long"
        records={records.season.regularSeason}
        playoffRecords={records.season.mainPlayoffs}
      />

      <AllTimeSection
        title="All-Time Franchise"
        records={records.allTime}
      />
    </main>
  );
}

function RecordSection({
  title,
  records,
  playoffRecords,
}: {
  title: string;
  records: RecordSet;
  playoffRecords: RecordSet;
}) {
  return (
    <section style={{ marginBottom: "40px" }}>
      <SectionHeading title={title} />

      <p
        style={{
          fontSize: "12px",
          fontWeight: "700",
          letterSpacing: "1px",
          color: "#687384",
          marginBottom: "10px",
        }}
      >
        REGULAR SEASON
      </p>

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

      <RecordCard
        title="Highest Combined Score"
        record={records.highestCombinedScore}
        value={(record) =>
          (
            record.score +
            record.opponentScore
          ).toFixed(2)
        }
        suffix="pts"
      />

      <RecordCard
        title="Lowest Combined Score"
        record={records.lowestCombinedScore}
        value={(record) =>
          (
            record.score +
            record.opponentScore
          ).toFixed(2)
        }
        suffix="pts"
      />

      <RecordCard
        title="Highest Losing Score"
        record={records.highestLosingScore}
        value={(record) =>
          record.score.toFixed(2)
        }
        suffix="pts"
      />

      <RecordCard
        title="Lowest Winning Score"
        record={records.lowestWinningScore}
        value={(record) =>
          record.score.toFixed(2)
        }
        suffix="pts"
      />

      <p
        style={{
          fontSize: "12px",
          fontWeight: "700",
          letterSpacing: "1px",
          color: "#687384",
          marginTop: "24px",
          marginBottom: "10px",
        }}
      >
        MAIN PLAYOFFS
      </p>

      <RecordCard
        title="Highest Team Score"
        record={playoffRecords.highestTeamScore}
        value={(record) =>
          record.score.toFixed(2)
        }
        suffix="pts"
      />

      <RecordCard
        title="Lowest Team Score"
        record={playoffRecords.lowestTeamScore}
        value={(record) =>
          record.score.toFixed(2)
        }
        suffix="pts"
      />

      <RecordCard
        title="Biggest Winning Margin"
        record={playoffRecords.biggestWinningMargin}
        value={(record) =>
          record.margin.toFixed(2)
        }
        suffix="pts"
      />

      <RecordCard
        title="Closest Game"
        record={playoffRecords.closestGame}
        value={(record) =>
          record.margin.toFixed(2)
        }
        suffix="pts"
      />
    </section>
  );
}

function SeasonSection({
  title,
  records,
  playoffRecords,
}: {
  title: string;
  records: SeasonRecordSet;
  playoffRecords: SeasonRecordSet;
}) {
  return (
    <section style={{ marginBottom: "40px" }}>
      <SectionHeading title={title} />

      <p
        style={{
          fontSize: "12px",
          fontWeight: "700",
          letterSpacing: "1px",
          color: "#687384",
          marginBottom: "10px",
        }}
      >
        REGULAR SEASON
      </p>

      <SeasonRecordCard
        title="Most Wins"
        record={records.mostWins}
        value={(record) =>
          `${record.wins} wins`
        }
      />

      <SeasonRecordCard
        title="Most Points Scored"
        record={records.mostPointsFor}
        value={(record) =>
          record.pointsFor.toFixed(2)
        }
        suffix="pts"
      />

      <SeasonRecordCard
        title="Most Points Conceded"
        record={records.mostPointsAgainst}
        value={(record) =>
          record.pointsAgainst.toFixed(2)
        }
        suffix="pts"
      />

      <SeasonRecordCard
        title="Best Point Differential"
        record={records.bestPointDifferential}
        value={(record) =>
          record.pointDifferential >= 0
            ? `+${record.pointDifferential.toFixed(2)}`
            : record.pointDifferential.toFixed(2)
        }
        suffix="pts"
      />

      <p
        style={{
          fontSize: "12px",
          fontWeight: "700",
          letterSpacing: "1px",
          color: "#687384",
          marginTop: "24px",
          marginBottom: "10px",
        }}
      >
        MAIN PLAYOFFS
      </p>

      <SeasonRecordCard
        title="Most Wins"
        record={playoffRecords.mostWins}
        value={(record) =>
          `${record.wins} wins`
        }
      />

      <SeasonRecordCard
        title="Most Points Scored"
        record={playoffRecords.mostPointsFor}
        value={(record) =>
          record.pointsFor.toFixed(2)
        }
        suffix="pts"
      />
    </section>
  );
}

function AllTimeSection({
  title,
  records,
}: {
  title: string;
  records: AllTimeRecordSet;
}) {
  return (
    <section style={{ marginBottom: "40px" }}>
      <SectionHeading title={title} />

      <AllTimeRecordCard
        title="Most Career Wins"
        record={records.mostWins}
        value={(record) =>
          `${record.wins} wins`
        }
      />

      <AllTimeRecordCard
        title="Most Career Points"
        record={records.mostPointsFor}
        value={(record) =>
          record.pointsFor.toFixed(2)
        }
        suffix="pts"
      />

      <AllTimeRecordCard
        title="Most Career Points Conceded"
        record={records.mostPointsAgainst}
        value={(record) =>
          record.pointsAgainst.toFixed(2)
        }
        suffix="pts"
      />

      <AllTimeRecordCard
        title="Best Career Point Differential"
        record={records.bestPointDifferential}
        value={(record) =>
          record.pointDifferential >= 0
            ? `+${record.pointDifferential.toFixed(2)}`
            : record.pointDifferential.toFixed(2)
        }
        suffix="pts"
      />
    </section>
  );
}

function SectionHeading({
  title,
}: {
  title: string;
}) {
  return (
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
  suffix?: string;
}) {
  if (!record) {
    return null;
  }

  const teamName = getFranchiseName(
    record.rosterId
  );

  const opponentName =
    getFranchiseName(
      record.opponentRosterId
    );

  return (
    <article style={cardStyle}>
      <p style={labelStyle}>
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

        {suffix && (
          <span
            style={{
              fontSize: "13px",
              color: "#687384",
            }}
          >
            {suffix}
          </span>
        )}
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
        <span style={{ color: "#687384" }}>
          vs
        </span>
        {"  "}
        {opponentName}{" "}
        {record.opponentScore.toFixed(2)}
      </p>

      <p style={metaStyle}>
        {record.season} · Week{" "}
        {record.week}
      </p>
    </article>
  );
}

function SeasonRecordCard({
  title,
  record,
  value,
  suffix,
}: {
  title: string;
  record: SeasonRecord | null;
  value: (record: SeasonRecord) => string;
  suffix?: string;
}) {
  if (!record) {
    return null;
  }

  return (
    <article style={cardStyle}>
      <p style={labelStyle}>
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

        {suffix && (
          <span
            style={{
              fontSize: "13px",
              color: "#687384",
            }}
          >
            {suffix}
          </span>
        )}
      </div>

      <p
        style={{
          marginTop: "8px",
          color: "#ffffff",
          fontWeight: "600",
        }}
      >
        {getFranchiseName(
          record.rosterId
        )}
      </p>

      <p style={metaStyle}>
        {record.season}
      </p>
    </article>
  );
}

function AllTimeRecordCard({
  title,
  record,
  value,
  suffix,
}: {
  title: string;
  record: AllTimeFranchiseRecord | null;
  value: (record: AllTimeFranchiseRecord) => string;
  suffix?: string;
}) {
  if (!record) {
    return null;
  }

  return (
    <article style={cardStyle}>
      <p style={labelStyle}>
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

        {suffix && (
          <span
            style={{
              fontSize: "13px",
              color: "#687384",
            }}
          >
            {suffix}
          </span>
        )}
      </div>

      <p
        style={{
          marginTop: "8px",
          color: "#ffffff",
          fontWeight: "600",
        }}
      >
        {getFranchiseName(
          record.rosterId
        )}
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

const metaStyle = {
  marginTop: "8px",
  fontSize: "12px",
  color: "#687384",
};

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

type RecordSet = {
  highestTeamScore: LeagueRecord | null;
  lowestTeamScore: LeagueRecord | null;
  biggestWinningMargin: LeagueRecord | null;
  closestGame: LeagueRecord | null;
  highestCombinedScore: LeagueRecord | null;
  lowestCombinedScore: LeagueRecord | null;
  highestLosingScore: LeagueRecord | null;
  lowestWinningScore: LeagueRecord | null;
};

type SeasonRecord = {
  season: string;
  rosterId: number;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDifferential: number;
};

type SeasonRecordSet = {
  mostWins: SeasonRecord | null;
  fewestWins: SeasonRecord | null;
  mostPointsFor: SeasonRecord | null;
  fewestPointsFor: SeasonRecord | null;
  mostPointsAgainst: SeasonRecord | null;
  fewestPointsAgainst: SeasonRecord | null;
  bestPointDifferential: SeasonRecord | null;
  worstPointDifferential: SeasonRecord | null;
};

type AllTimeFranchiseRecord = {
  rosterId: number;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDifferential: number;
};

type AllTimeRecordSet = {
  mostWins: AllTimeFranchiseRecord | null;
  fewestWins: AllTimeFranchiseRecord | null;
  mostPointsFor: AllTimeFranchiseRecord | null;
  mostPointsAgainst: AllTimeFranchiseRecord | null;
  bestPointDifferential: AllTimeFranchiseRecord | null;
  worstPointDifferential: AllTimeFranchiseRecord | null;
};