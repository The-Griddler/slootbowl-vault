"use client";

import { useState } from "react";
import {
  getAllTimeRecords,
} from "../../lib/records";
import {
  getFranchiseName,
} from "../../lib/franchises";

type RecordsData = Awaited<
  ReturnType<typeof getAllTimeRecords>
>;

export default function RecordsPage() {
  const [activeTab, setActiveTab] =
    useState<
      "games" | "season" | "allTime"
    >("games");

  /*
   * Temporary client-side placeholder.
   *
   * We will connect this to the server-side
   * records data in the next step.
   */
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
          marginBottom: "24px",
        }}
      >
        The Dynasty Sluts record book.
      </p>

      <div
        style={{
          display: "flex",
          background: "#151b23",
          border: "1px solid #27303b",
          borderRadius: "14px",
          padding: "4px",
          marginBottom: "28px",
        }}
      >
        <TabButton
          label="Game"
          active={activeTab === "games"}
          onClick={() =>
            setActiveTab("games")
          }
        />

        <TabButton
          label="Season"
          active={activeTab === "season"}
          onClick={() =>
            setActiveTab("season")
          }
        />

        <TabButton
          label="All-Time"
          active={activeTab === "allTime"}
          onClick={() =>
            setActiveTab("allTime")
          }
        />
      </div>

      {activeTab === "games" && (
        <div>
          <SectionHeading title="Individual Game" />

          <p style={subheadingStyle}>
            REGULAR SEASON
          </p>

          <EmptyRecordCard
            title="Highest Team Score"
          />

          <EmptyRecordCard
            title="Lowest Team Score"
          />

          <EmptyRecordCard
            title="Biggest Winning Margin"
          />

          <EmptyRecordCard
            title="Closest Game"
          />

          <EmptyRecordCard
            title="Highest Combined Score"
          />

          <EmptyRecordCard
            title="Lowest Combined Score"
          />

          <EmptyRecordCard
            title="Highest Losing Score"
          />

          <EmptyRecordCard
            title="Lowest Winning Score"
          />

          <p
            style={{
              ...subheadingStyle,
              marginTop: "28px",
            }}
          >
            MAIN PLAYOFFS
          </p>

          <EmptyRecordCard
            title="Highest Team Score"
          />

          <EmptyRecordCard
            title="Lowest Team Score"
          />

          <EmptyRecordCard
            title="Biggest Winning Margin"
          />

          <EmptyRecordCard
            title="Closest Game"
          />
        </div>
      )}

      {activeTab === "season" && (
        <div>
          <SectionHeading title="Season Long" />

          <p style={subheadingStyle}>
            REGULAR SEASON
          </p>

          <EmptyRecordCard title="Most Wins" />
          <EmptyRecordCard
            title="Most Points Scored"
          />
          <EmptyRecordCard
            title="Most Points Conceded"
          />
          <EmptyRecordCard
            title="Best Point Differential"
          />

          <p
            style={{
              ...subheadingStyle,
              marginTop: "28px",
            }}
          >
            MAIN PLAYOFFS
          </p>

          <EmptyRecordCard title="Most Wins" />
          <EmptyRecordCard
            title="Most Points Scored"
          />
        </div>
      )}

      {activeTab === "allTime" && (
        <div>
          <SectionHeading title="All-Time Franchise" />

          <EmptyRecordCard
            title="Most Career Wins"
          />

          <EmptyRecordCard
            title="Most Career Points"
          />

          <EmptyRecordCard
            title="Most Career Points Conceded"
          />

          <EmptyRecordCard
            title="Best Career Point Differential"
          />
        </div>
      )}
    </main>
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
        background: active
          ? "#ffffff"
          : "transparent",
        color: active
          ? "#0b0f14"
          : "#687384",
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

function EmptyRecordCard({
  title,
}: {
  title: string;
}) {
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

      <p
        style={{
          marginTop: "10px",
          color: "#687384",
          fontSize: "13px",
        }}
      >
        Record data loading...
      </p>
    </article>
  );
}

const subheadingStyle = {
  fontSize: "11px",
  fontWeight: "700",
  letterSpacing: "1px",
  color: "#687384",
  marginBottom: "10px",
};