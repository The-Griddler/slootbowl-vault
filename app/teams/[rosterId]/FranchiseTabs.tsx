
"use client";

import { useState } from "react";
import type { ReactNode } from "react";

type Tab = "overview" | "records" | "legends";

type FranchiseTabsProps = {
  overview: ReactNode;
  records: ReactNode;
  legends: ReactNode;
};

const tabs: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "records", label: "Team Records" },
  { id: "legends", label: "Player Legends" },
];

export default function FranchiseTabs({
  overview,
  records,
  legends,
}: FranchiseTabsProps) {
  const [activeTab, setActiveTab] =
    useState<Tab>("overview");

  const content = {
    overview,
    records,
    legends,
  };

  return (
    <div style={{ marginTop: "28px" }}>
      <div
        role="tablist"
        aria-label="Franchise history sections"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: "6px",
          padding: "5px",
          background: "#151b23",
          border: "1px solid #27303b",
          borderRadius: "14px",
        }}
      >
        {tabs.map((tab) => {
          const active = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab.id)}
              style={{
                minWidth: 0,
                minHeight: "46px",
                padding: "8px 4px",
                background: active
                  ? "#303b48"
                  : "transparent",
                color: active
                  ? "#ffffff"
                  : "#9da7b3",
                border: "none",
                borderRadius: "10px",
                fontSize: "12px",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        style={{ marginTop: "8px" }}
      >
        {content[activeTab]}
      </div>
    </div>
  );
}
