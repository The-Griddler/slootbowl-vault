
"use client";

import { useState } from "react";
import type { AllSlootCareerPlayer } from "../../lib/allSlootCareer";

type Props = {
  careers: AllSlootCareerPlayer[];
};

export default function CareerHonours({ careers }: Props) {
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(
    null
  );
  const [showAll, setShowAll] = useState(false);

  const visibleCareers = showAll ? careers : careers.slice(0, 20);

  return (
    <section>
      <h2 style={{ marginBottom: "8px" }}>SFL Career Honours</h2>

      <p
        style={{
          fontSize: "13px",
          color: "#9da7b3",
          marginBottom: "20px",
        }}
      >
        Ranked by First Team selections, followed by Second Team
        selections. Tap a player to view their complete award history.
      </p>

      <div
        style={{
          border: "1px solid #263244",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 42px 42px 42px 20px",
            gap: "6px",
            padding: "12px",
            background: "#202833",
            color: "#9da7b3",
            fontSize: "10px",
            fontWeight: "700",
          }}
        >
          <span>PLAYER</span>
          <span style={{ textAlign: "center" }}>1ST</span>
          <span style={{ textAlign: "center" }}>2ND</span>
          <span style={{ textAlign: "center" }}>R</span>
          <span />
        </div>

        {visibleCareers.map((player, index) => {
          const expanded = expandedPlayer === player.playerId;

          return (
            <div
              key={player.playerId}
              style={{
                borderTop: "1px solid #263244",
              }}
            >
              <button
                type="button"
                onClick={() =>
                  setExpandedPlayer(
                    expanded ? null : player.playerId
                  )
                }
                aria-expanded={expanded}
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "minmax(0, 1fr) 42px 42px 42px 20px",
                  gap: "6px",
                  width: "100%",
                  padding: "13px 12px",
                  background: expanded
                    ? "#202833"
                    : "transparent",
                  border: "none",
                  color: "inherit",
                  textAlign: "left",
                  cursor: "pointer",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    alignItems: "center",
                    minWidth: 0,
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      color: "#9da7b3",
                      minWidth: "18px",
                    }}
                  >
                    {index + 1}
                  </span>

                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: "700",
                        fontSize: "13px",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {player.name}
                    </div>

                    <div
                      style={{
                        fontSize: "11px",
                        color: "#9da7b3",
                        marginTop: "3px",
                      }}
                    >
                      {player.position}
                    </div>
                  </div>
                </div>

                <span style={{ textAlign: "center", fontWeight: "700" }}>
                  {player.firstTeamSelections}
                </span>

                <span style={{ textAlign: "center" }}>
                  {player.secondTeamSelections}
                </span>

                <span style={{ textAlign: "center" }}>
                  {player.rookieTeamSelections}
                </span>

                <span
                  style={{
                    fontSize: "12px",
                    color: "#9da7b3",
                    textAlign: "center",
                  }}
                >
                  {expanded ? "▲" : "▼"}
                </span>
              </button>

              {expanded && (
                <div
                  style={{
                    padding: "14px",
                    background: "#151b23",
                    borderTop: "1px solid #263244",
                  }}
                >
                  <p
                    style={{
                      fontSize: "12px",
                      fontWeight: "700",
                      marginBottom: "12px",
                    }}
                  >
                    {player.totalHonours} total honours ·{" "}
                    {player.seasonsHonoured} seasons honoured
                  </p>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "6px",
                    }}
                  >
                    {player.awards.map((award) => (
                      <span
                        key={`${award.season}-${award.team}`}
                        style={{
                          padding: "7px 9px",
                          background: "#263244",
                          borderRadius: "7px",
                          fontSize: "11px",
                        }}
                      >
                        {award.season} · {award.team}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {careers.length > 20 && (
        <button
          type="button"
          onClick={() => setShowAll((previous) => !previous)}
          style={{
            display: "block",
            width: "100%",
            marginTop: "16px",
            padding: "14px",
            border: "1px solid #263244",
            borderRadius: "10px",
            background: "#202833",
            color: "#ffffff",
            fontWeight: "700",
            fontSize: "13px",
            cursor: "pointer",
          }}
        >
          {showAll
            ? "Show Top 20"
            : `Show All ${careers.length} Players`}
        </button>
      )}

      {careers.length === 0 && (
        <p style={{ marginTop: "16px" }}>
          No completed-season honours found.
        </p>
      )}
    </section>
  );
}
