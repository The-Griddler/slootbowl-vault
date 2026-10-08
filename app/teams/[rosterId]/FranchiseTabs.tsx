
"use client";

import { useState } from "react";
import type { ReactNode } from "react";

type Tab =
  | "overview"
  | "records"
  | "legends"
  | "rivalries";

type FranchiseTabsProps = {
  overview: ReactNode;
  records: ReactNode;
  legends: ReactNode;
  rivalries: ReactNode;
};

export default function FranchiseTabs({
  overview,
  records,
  legends,
  rivalries,
}: FranchiseTabsProps) {
  const [activeTab, setActiveTab] =
    useState<Tab>("overview");

  const tabs: {
    id: Tab;
    label: string;
  }[] = [
    { id: "overview", label: "Overview" },
    { id: "records", label: "Team Records" },
    { id: "legends", label: "Player Legends" },
    { id: "rivalries", label: "Rivalries" },
  ];

  const content: Record<Tab, ReactNode> = {
    overview,
    records,
    legends,
    rivalries,
  };

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(4, minmax(0, 1fr))",
          gap: "6px",
          marginTop: "24px",
          marginBottom: "20px",
        }}
      >
        {tabs.map((tab) => {
          const selected =
            activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() =>
                setActiveTab(tab.id)
              }
              style={{
                padding: "12px 4px",
                background: selected
                  ? "#303b48"
                  : "#151b23",
                color: selected
                  ? "#ffffff"
                  : "#9da7b3",
                border: selected
                  ? "1px solid #64748b"
                  : "1px solid #27303b",
                borderRadius: "9px",
                fontSize: "11px",
                fontWeight: selected
                  ? "800"
                  : "600",
                cursor: "pointer",
                minWidth: 0,
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div>{content[activeTab]}</div>
    </div>
  );
}
