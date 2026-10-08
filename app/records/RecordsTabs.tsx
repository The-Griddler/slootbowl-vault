
"use client";

import { useState } from "react";
import type {
  AllTimeRecords,
  AllTimeRecordSet,
  AllTimeFranchiseRecord,
  LeagueRecord,
  RecordSet,
  SeasonRecord,
  SeasonRecordSet,
} from "../../lib/records";
import { getFranchiseName } from "../../lib/franchises";

type RecordsTab = "games" | "season" | "allTime";
type Competition = "regularSeason" | "mainPlayoffs";

export default function RecordsTabs({
  records,
}: {
  records: AllTimeRecords;
}) {
  const [activeTab, setActiveTab] =
    useState<RecordsTab>("games");

  const [selectedSeason, setSelectedSeason] =
    useState("all");

  const [competition, setCompetition] =
    useState<Competition>("regularSeason");

  const filteredRecords =
    selectedSeason === "all"
      ? records
      : records.bySeason[selectedSeason] ?? records;

  const isSeasonComplete =
    selectedSeason === "all" ||
    records.completedSeasons[competition].includes(
      selectedSeason
    );

  return (
    <>
      <div style={tabsStyle}>
        <TabButton
          label="Game"
          active={activeTab === "games"}
          onClick={() => setActiveTab("games")}
        />

        <TabButton
          label="Season"
          active={activeTab === "season"}
          onClick={() => setActiveTab("season")}
        />

        <TabButton
          label="All-Time"
          active={activeTab === "allTime"}
          onClick={() => setActiveTab("allTime")}
        />
      </div>

      {activeTab !== "allTime" && (
        <div style={{ marginBottom: "28px" }}>
          <p style={subheadingStyle}>SEASON</p>

          <select
            value={selectedSeason}
            onChange={(event) =>
              setSelectedSeason(event.target.value)
            }
            style={{
              width: "100%",
              padding: "13px 14px",
              background: "#151b23",
              border: "1px solid #27303b",
              borderRadius: "12px",
              color: "#ffffff",
              fontSize: "14px",
              marginBottom: "20px",
            }}
          >
            <option value="all">All Seasons</option>

            {records.availableSeasons.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          <p style={subheadingStyle}>COMPETITION</p>

          <div style={competitionTabsStyle}>
            <TabButton
              label="Regular Season"
              active={competition === "regularSeason"}
              onClick={() =>
                setCompetition("regularSeason")
              }
            />

            <TabButton
              label="Main Playoffs"
              active={competition === "mainPlayoffs"}
              onClick={() =>
                setCompetition("mainPlayoffs")
              }
            />
          </div>

          {activeTab === "season" &&
            !isSeasonComplete && (
              <p
                style={{
                  marginTop: "12px",
                  fontSize: "12px",
                  color: "#aeb8c5",
                  lineHeight: "1.6",
                }}
              >
                Season in Progress — these totals are
                provisional and are excluded from
                all-season records until this competition
                is complete.
              </p>
            )}
        </div>
      )}

      {activeTab === "games" && (
        <IndividualGameRecords
          records={
            filteredRecords.individualGame[competition]
          }
        />
      )}

      {activeTab === "season" && (
        <SeasonRecords
          records={filteredRecords.season[competition]}
          competition={competition}
        />
      )}

      {activeTab === "allTime" && (
        <AllTimeRecordsSection records={records.allTime} />
      )}
    </>
  );
}

function IndividualGameRecords({
  records,
}: {
  records: RecordSet;
}) {
  return (
    <section>
      <SectionHeading title="Individual Game" />

      <RecordCard
        title="Highest Team Score"
        record={records.highestTeamScore}
        value={(r) => r.score.toFixed(2)}
        suffix="pts"
      />

      <RecordCard
        title="Lowest Team Score"
        record={records.lowestTeamScore}
        value={(r) => r.score.toFixed(2)}
        suffix="pts"
      />

      <RecordCard
        title="Biggest Winning Margin"
        record={records.biggestWinningMargin}
        value={(r) => r.margin.toFixed(2)}
        suffix="pts"
      />

      <RecordCard
        title="Closest Game"
        record={records.closestGame}
        value={(r) => r.margin.toFixed(2)}
        suffix="pts"
      />

      <RecordCard
        title="Highest Combined Score"
        record={records.highestCombinedScore}
        value={(r) =>
          (r.score + r.opponentScore).toFixed(2)
        }
        suffix="pts"
      />

      <RecordCard
        title="Lowest Combined Score"
        record={records.lowestCombinedScore}
        value={(r) =>
          (r.score + r.opponentScore).toFixed(2)
        }
        suffix="pts"
      />

      <RecordCard
        title="Highest Losing Score"
        record={records.highestLosingScore}
        value={(r) => r.score.toFixed(2)}
        suffix="pts"
      />

      <RecordCard
        title="Lowest Winning Score"
        record={records.lowestWinningScore}
        value={(r) => r.score.toFixed(2)}
        suffix="pts"
      />
    </section>
  );
}

function SeasonRecords({
  records,
  competition,
}: {
  records: SeasonRecordSet;
  competition: Competition;
}) {
  const isPlayoffs = competition === "mainPlayoffs";

  return (
    <section>
      <SectionHeading title="Season Long" />

      <SeasonRecordCard
        title="Most Wins"
        record={records.mostWins}
        value={(r) => `${r.wins} wins`}
      />

      {!isPlayoffs && (
        <SeasonRecordCard
          title="Fewest Wins"
          record={records.fewestWins}
          value={(r) => `${r.wins} wins`}
        />
      )}

      <SeasonRecordCard
        title="Most Points Scored"
        record={records.mostPointsFor}
        value={(r) => r.pointsFor.toFixed(2)}
        suffix="pts"
      />

      {!isPlayoffs && (
        <SeasonRecordCard
          title="Fewest Points Scored"
          record={records.fewestPointsFor}
          value={(r) => r.pointsFor.toFixed(2)}
          suffix="pts"
        />
      )}

      <SeasonRecordCard
        title="Most Points Conceded"
        record={records.mostPointsAgainst}
        value={(r) => r.pointsAgainst.toFixed(2)}
        suffix="pts"
      />

      {!isPlayoffs && (
        <>
          <SeasonRecordCard
            title="Fewest Points Conceded"
            record={records.fewestPointsAgainst}
            value={(r) => r.pointsAgainst.toFixed(2)}
            suffix="pts"
          />

          <SeasonRecordCard
            title="Best Point Differential"
            record={records.bestPointDifferential}
            value={(r) =>
              formatDifferential(r.pointDifferential)
            }
            suffix="pts"
          />

          <SeasonRecordCard
            title="Worst Point Differential"
            record={records.worstPointDifferential}
            value={(r) =>
              formatDifferential(r.pointDifferential)
            }
            suffix="pts"
          />
        </>
      )}
    </section>
  );
}

function AllTimeRecordsSection({
  records,
}: {
  records: AllTimeRecordSet;
}) {
  return (
    <section>
      <SectionHeading title="All-Time Franchise" />

      <AllTimeRecordCard
        title="Most Career Wins"
        record={records.mostWins}
        value={(r) => `${r.wins} wins`}
      />

      <AllTimeRecordCard
        title="Fewest Career Wins"
        record={records.fewestWins}
        value={(r) => `${r.wins} wins`}
      />

      <AllTimeRecordCard
        title="Most Career Points"
        record={records.mostPointsFor}
        value={(r) => r.pointsFor.toFixed(2)}
        suffix="pts"
      />

      <AllTimeRecordCard
        title="Most Career Points Conceded"
        record={records.mostPointsAgainst}
        value={(r) => r.pointsAgainst.toFixed(2)}
        suffix="pts"
      />

      <AllTimeRecordCard
        title="Best Career Point Differential"
        record={records.bestPointDifferential}
        value={(r) =>
          formatDifferential(r.pointDifferential)
        }
        suffix="pts"
      />

      <AllTimeRecordCard
        title="Worst Career Point Differential"
        record={records.worstPointDifferential}
        value={(r) =>
          formatDifferential(r.pointDifferential)
        }
        suffix="pts"
      />
    </section>
  );
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        border: "none",
        borderRadius: "10px",
        padding: "10px 6px",
        background: active ? "#ffffff" : "transparent",
        color: active ? "#0b0f14" : "#687384",
        fontSize: "13px",
        fontWeight: "700",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
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

      <h2 style={{ margin: 0, fontSize: "24px" }}>
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
  if (!record) return null;

  const teamName = getFranchiseName(record.rosterId);
  const opponentName = getFranchiseName(
    record.opponentRosterId
  );

  return (
    <article style={cardStyle}>
      <p style={labelStyle}>{title.toUpperCase()}</p>

      <div style={valueRowStyle}>
        <h3 style={valueStyle}>{value(record)}</h3>

        {suffix && (
          <span style={suffixStyle}>{suffix}</span>
        )}
      </div>

      <p style={teamStyle}>{teamName}</p>

      <p style={matchupStyle}>
        {teamName} {record.score.toFixed(2)}
        {"  "}
        <span style={{ color: "#687384" }}>vs</span>
        {"  "}
        {opponentName} {record.opponentScore.toFixed(2)}
      </p>

      <p style={metaStyle}>
        {record.season} · Week {record.week}
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
  if (!record) return null;

  return (
    <article style={cardStyle}>
      <p style={labelStyle}>{title.toUpperCase()}</p>

      <div style={valueRowStyle}>
        <h3 style={valueStyle}>{value(record)}</h3>

        {suffix && (
          <span style={suffixStyle}>{suffix}</span>
        )}
      </div>

      <p style={teamStyle}>
        {getFranchiseName(record.rosterId)}
      </p>

      <p style={metaStyle}>{record.season}</p>
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
  if (!record) return null;

  return (
    <article style={cardStyle}>
      <p style={labelStyle}>{title.toUpperCase()}</p>

      <div style={valueRowStyle}>
        <h3 style={valueStyle}>{value(record)}</h3>

        {suffix && (
          <span style={suffixStyle}>{suffix}</span>
        )}
      </div>

      <p style={teamStyle}>
        {getFranchiseName(record.rosterId)}
      </p>
    </article>
  );
}

function formatDifferential(value: number) {
  return value >= 0
    ? `+${value.toFixed(2)}`
    : value.toFixed(2);
}

const tabsStyle = {
  display: "flex",
  background: "#151b23",
  border: "1px solid #27303b",
  borderRadius: "14px",
  padding: "4px",
  marginBottom: "24px",
};

const competitionTabsStyle = {
  display: "flex",
  background: "#151b23",
  border: "1px solid #27303b",
  borderRadius: "12px",
  padding: "4px",
};

const cardStyle = {
  background: "#151b23",
  border: "1px solid #27303b",
  borderRadius: "18px",
  padding: "18px",
  marginBottom: "12px",
};

const valueRowStyle = {
  display: "flex",
  alignItems: "baseline",
  gap: "7px",
  marginTop: "5px",
};

const valueStyle = {
  margin: 0,
  fontSize: "30px",
};

const labelStyle = {
  fontSize: "11px",
  fontWeight: "700",
  letterSpacing: "1px",
  color: "#687384",
};

const suffixStyle = {
  fontSize: "13px",
  color: "#687384",
};

const teamStyle = {
  marginTop: "8px",
  color: "#ffffff",
  fontWeight: "600",
};

const matchupStyle = {
  marginTop: "4px",
  fontSize: "13px",
};

const metaStyle = {
  marginTop: "8px",
  fontSize: "12px",
  color: "#687384",
};

const subheadingStyle = {
  fontSize: "11px",
  fontWeight: "700",
  letterSpacing: "1px",
  color: "#687384",
  marginBottom: "10px",
};
