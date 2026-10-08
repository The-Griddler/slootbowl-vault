
"use client";

import { useState } from "react";
import type { LoveTriangleHistory, LoveTriangleStanding } from "../../../lib/loveTriangle";
import { OFFICIAL_RIVALRIES } from "../../../lib/rivalries";

type Props = {
  history: LoveTriangleHistory;
  franchiseNames: Record<number, string>;
};

function points(value: number) {
  return value.toFixed(2);
}

function percentage(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function shortName(
  rosterId: number,
  franchiseNames: Record<number, string>
) {
  const names: Record<number, string> = {
    4: "Isle of Wight",
    6: "Lincoln",
    7: "Kalamata",
  };

  return names[rosterId] ??
    franchiseNames[rosterId] ??
    `Roster ${rosterId}`;
}

function StandingsTable({
  standings,
  franchiseNames,
  showTitles = false,
}: {
  standings: LoveTriangleStanding[];
  franchiseNames: Record<number, string>;
  showTitles?: boolean;
}) {
  return (
    <div
      style={{
        overflowX: "auto",
        border: "1px solid #27303b",
        borderRadius: "12px",
        marginTop: "14px",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "11px",
          color: "#ffffff",
          whiteSpace: "nowrap",
        }}
      >
        <thead>
          <tr
            style={{
              background: "#25303d",
              color: "#cbd5e1",
            }}
          >
            <th style={cellStyle("left")}>Team</th>
            <th style={cellStyle()}>W</th>
            <th style={cellStyle()}>L</th>
            <th style={cellStyle()}>T</th>
            <th style={cellStyle()}>Win%</th>
            <th style={cellStyle()}>PD</th>
            {showTitles && (
              <th style={cellStyle()}>Titles</th>
            )}
          </tr>
        </thead>

        <tbody>
          {standings.map((team, index) => {
            const titles =
              "championships" in team
                ? Number(team.championships)
                : 0;

            return (
              <tr
                key={team.rosterId}
                style={{
                  background:
                    index % 2 === 0
                      ? "#151b23"
                      : "#1b2430",
                  borderTop:
                    "1px solid #27303b",
                }}
              >
                <td
                  style={{
                    ...cellStyle("left"),
                    fontWeight: "700",
                  }}
                >
                  {shortName(
                    team.rosterId,
                    franchiseNames
                  )}
                </td>
                <td style={cellStyle()}>
                  {team.wins}
                </td>
                <td style={cellStyle()}>
                  {team.losses}
                </td>
                <td style={cellStyle()}>
                  {team.ties}
                </td>
                <td style={cellStyle()}>
                  {percentage(
                    team.winPercentage
                  )}
                </td>
                <td style={cellStyle()}>
                  {team.pointDifference > 0
                    ? "+"
                    : ""}
                  {points(
                    team.pointDifference
                  )}
                </td>
                {showTitles && (
                  <td
                    style={{
                      ...cellStyle(),
                      fontWeight: "800",
                      color: "#facc15",
                    }}
                  >
                    {titles}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function cellStyle(
  align: "left" | "right" = "right"
): React.CSSProperties {
  return {
    padding: "12px 9px",
    textAlign: align,
  };
}

export default function LoveTriangle({
  history,
  franchiseNames,
}: Props) {
  const [selectedYear, setSelectedYear] =
    useState(
      history.seasons[0]?.year ?? ""
    );

  const selectedSeason =
    history.seasons.find(
      (season) =>
        season.year === selectedYear
    ) ?? history.seasons[0];

  const triangleRivalries =
    OFFICIAL_RIVALRIES.filter(
      (rivalry) =>
        rivalry.series === "love-triangle"
    );

  return (
    <section
      style={{
        marginTop: "36px",
        paddingTop: "24px",
        borderTop: "1px solid #27303b",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          fontWeight: "800",
          letterSpacing: "1.5px",
          color: "#facc15",
        }}
      >
        OFFICIAL SFL COMPETITION
      </div>

      <h2
        style={{
          fontSize: "22px",
          marginTop: "8px",
        }}
      >
        🏆 Love Triangle Bowl Series
      </h2>

      <p
        style={{
          color: "#9da7b3",
          fontSize: "12px",
          lineHeight: "1.7",
          marginTop: "10px",
        }}
      >
        Isle of Wight. Lincoln. Kalamata.
        Three franchises, three historic
        rivalries, and one championship
        contested through their regular-season
        meetings.
      </p>

      <div
        style={{
          background: "#151b23",
          border: "1px solid #27303b",
          borderRadius: "14px",
          padding: "16px",
          marginTop: "22px",
        }}
      >
        <h3 style={{ fontSize: "16px" }}>
          All-Time Standings
        </h3>

        <p
          style={{
            fontSize: "11px",
            color: "#9da7b3",
            marginTop: "7px",
          }}
        >
          All qualifying games since 2022.
          Titles count completed seasons only.
        </p>

        <StandingsTable
          standings={history.allTime}
          franchiseNames={franchiseNames}
          showTitles
        />
      </div>

      <div
        style={{
          background: "#151b23",
          border: "1px solid #27303b",
          borderRadius: "14px",
          padding: "16px",
          marginTop: "16px",
        }}
      >
        <h3 style={{ fontSize: "16px" }}>
          Season Championship
        </h3>

        <select
          value={selectedSeason?.year ?? ""}
          onChange={(event) =>
            setSelectedYear(
              event.target.value
            )
          }
          style={{
            width: "100%",
            marginTop: "14px",
            padding: "12px",
            background: "#25303d",
            color: "#ffffff",
            border: "1px solid #435163",
            borderRadius: "9px",
            fontSize: "14px",
          }}
        >
          {history.seasons.map(
            (season) => (
              <option
                key={season.year}
                value={season.year}
              >
                {season.year}
              </option>
            )
          )}
        </select>

        {selectedSeason ? (
          <>
            <StandingsTable
              standings={
                selectedSeason.standings
              }
              franchiseNames={
                franchiseNames
              }
            />

            <div
              style={{
                background: "#25303d",
                borderRadius: "10px",
                padding: "14px",
                marginTop: "14px",
                fontSize: "12px",
                lineHeight: "1.7",
              }}
            >
              {selectedSeason.champions.length >
              0 ? (
                <>
                  <strong>
                    🏆{" "}
                    {selectedSeason.champions
                      .map((id) =>
                        shortName(
                          id,
                          franchiseNames
                        )
                      )
                      .join(" & ")}
                  </strong>
                  <div
                    style={{
                      color: "#9da7b3",
                      marginTop: "4px",
                    }}
                  >
                    {selectedSeason.champions
                      .length > 1
                      ? "Joint Series Champions"
                      : "Series Champion"}
                  </div>
                </>
              ) : (
                <span
                  style={{
                    color: "#9da7b3",
                  }}
                >
                  {selectedSeason.completed
                    ? "No champion recorded."
                    : "Season in progress — champion not yet awarded."}
                </span>
              )}
            </div>
          </>
        ) : (
          <p
            style={{
              color: "#9da7b3",
              marginTop: "14px",
            }}
          >
            No historical seasons found.
          </p>
        )}
      </div>

      <div
        style={{
          background: "#151b23",
          border: "1px solid #27303b",
          borderRadius: "14px",
          padding: "16px",
          marginTop: "16px",
        }}
      >
        <h3 style={{ fontSize: "16px" }}>
          Championship History
        </h3>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            marginTop: "14px",
          }}
        >
          {history.seasons.map(
            (season) => (
              <div
                key={season.year}
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px",
                  background: "#1d2631",
                  borderRadius: "9px",
                  fontSize: "12px",
                }}
              >
                <strong>
                  {season.year}
                </strong>

                <span
                  style={{
                    textAlign: "right",
                    color:
                      season.champions.length
                        ? "#facc15"
                        : "#9da7b3",
                  }}
                >
                  {season.champions.length
                    ? season.champions
                        .map((id) =>
                          shortName(
                            id,
                            franchiseNames
                          )
                        )
                        .join(" & ")
                    : season.completed
                      ? "No champion"
                      : "In progress"}
                </span>
              </div>
            )
          )}
        </div>
      </div>

      <div
        style={{
          background: "#151b23",
          border: "1px solid #27303b",
          borderRadius: "14px",
          padding: "16px",
          marginTop: "16px",
        }}
      >
        <h3 style={{ fontSize: "16px" }}>
          The Three Rivalry Games
        </h3>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            marginTop: "14px",
          }}
        >
          {triangleRivalries.map(
            (rivalry) => (
              <div
                key={rivalry.id}
                style={{
                  background: "#1d2631",
                  borderRadius: "10px",
                  padding: "14px",
                }}
              >
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: "800",
                    color: "#ffffff",
                  }}
                >
                  {rivalry.name}
                </div>

                <div
                  style={{
                    fontSize: "11px",
                    color: "#9da7b3",
                    marginTop: "6px",
                  }}
                >
                  {shortName(
                    rivalry.teams[0],
                    franchiseNames
                  )}
                  {" vs "}
                  {shortName(
                    rivalry.teams[1],
                    franchiseNames
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
}
