
import { FRANCHISES } from "../../lib/franchises";

import { getHistoricalData } from "../../lib/sleeper";

import {
  getFranchisePlayerCareers,
} from "../../lib/franchiseLegacy";

import {
  calculateFranchiseLegacyScores,
} from "../../lib/franchiseLegacyScore";

import {
  getFranchiseChampionships,
} from "../../lib/franchiseChampionships";

import {
  getPlayerNames,
  getAllSlootPlayerDirectory,
} from "../../lib/players";

import {
  calculateHistoricalSeasonGrades,
} from "../../lib/seasonGrades";

import {
  calculateAllSloot,
} from "../../lib/allSloot";

import {
  calculateAllSlootCareers,
} from "../../lib/allSlootCareer";

export default async function LoyaltyPreviewPage() {
  const [
    careers,
    historicalData,
    playerDirectory,
  ] = await Promise.all([
    getFranchisePlayerCareers(),
    getHistoricalData(),
    getAllSlootPlayerDirectory(),
  ]);

  const currentYear = new Date().getUTCFullYear();

  const completedThroughSeason =
    currentYear - 1;

  // Only completed seasons receive
  // seasonal awards and championships.
  const seasonalGrades =
    calculateHistoricalSeasonGrades(
      historicalData,
      playerDirectory,
      completedThroughSeason
    );

  const completedAllSlootSeasons =
    historicalData
      .filter(
        (season) =>
          Number(season.league.season) <=
          completedThroughSeason
      )
      .map((season) =>
        calculateAllSloot(
          season,
          playerDirectory
        )
      );

  const allSlootCareers =
    calculateAllSlootCareers(
      completedAllSlootSeasons
    );

  // Identify official Slootbowl winners,
  // then credit every player on the
  // championship-week winning roster.
  const franchiseChampionships =
    await getFranchiseChampionships(
      historicalData,
      completedThroughSeason
    );

  // Calculate complete Franchise Legends
  // scores including championship bonuses.
  const rankings =
    calculateFranchiseLegacyScores(
      careers,
      historicalData,
      seasonalGrades,
      allSlootCareers,
      franchiseChampionships
    );

  const topPlayers = FRANCHISES.flatMap(
    (franchise) =>
      rankings
        .filter(
          (player) =>
            player.rosterId === franchise.rosterId
        )
        .slice(0, 15)
  );

  const playerNames = await getPlayerNames(
    [
      ...new Set(
        topPlayers.map(
          (player) => player.playerId
        )
      ),
    ]
  );

  const format = (value: number) =>
    value.toLocaleString("en-AU", {
      maximumFractionDigits: 0,
    });

  const cellStyle = {
    padding: "11px 8px",
    whiteSpace: "nowrap" as const,
  };

  return (
    <main
      style={{
        padding: "24px 12px 110px",
      }}
    >
      <h1>Franchise Legends Preview</h1>

      <p
        style={{
          color: "#9da7b3",
          fontSize: 13,
          lineHeight: 1.6,
          marginTop: 10,
        }}
      >
        Experimental franchise rankings
        combining roster loyalty, official
        starts, fantasy production, seasonal
        grades, All-Sloot honours and Slootbowl
        championships.
      </p>

      <p
        style={{
          color: "#9da7b3",
          fontSize: 12,
          lineHeight: 1.6,
          marginTop: 10,
        }}
      >
        Seasonal grades and All-Sloot honours
        are attributed to the franchise where
        a player recorded the most official
        starts that season. Tiebreakers are
        fantasy points, roster weeks, then
        lowest roster ID.
      </p>

      <p
        style={{
          color: "#9da7b3",
          fontSize: 12,
          lineHeight: 1.6,
          marginTop: 10,
        }}
      >
        Each Slootbowl championship awards
        150 points to every player on the
        winning franchise&apos;s roster during
        the championship week, including
        bench players. Only completed seasons
        receive achievement bonuses.
      </p>

      {FRANCHISES.map((franchise) => {
        const leaders = rankings
          .filter(
            (player) =>
              player.rosterId ===
              franchise.rosterId
          )
          .slice(0, 15);

        return (
          <section
            key={franchise.rosterId}
            style={{
              marginTop: 36,
            }}
          >
            <h2
              style={{
                fontSize: 19,
              }}
            >
              {franchise.name}
            </h2>

            <div
              style={{
                overflowX: "auto",
                marginTop: 14,
                background: "#151b23",
                border: "1px solid #27303b",
                borderRadius: 14,
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 12,
                }}
              >
                <thead>
                  <tr>
                    {[
                      "#",
                      "Player",
                      "Weeks",
                      "Starts",
                      "Loyalty",
                      "Starts Pts",
                      "Production",
                      "Grades",
                      "All-Sloot",
                      "Titles",
                      "Title Pts",
                      "Achievements",
                      "Total",
                    ].map((heading) => (
                      <th
                        key={heading}
                        style={{
                          padding: "12px 8px",
                          textAlign: "left",
                          borderBottom:
                            "1px solid #27303b",
                          color: "#9da7b3",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {leaders.map(
                    (player, index) => (
                      <tr
                        key={player.playerId}
                        style={{
                          borderBottom:
                            "1px solid #27303b",
                        }}
                      >
                        <td style={cellStyle}>
                          {index + 1}
                        </td>

                        <td
                          style={{
                            ...cellStyle,
                            fontWeight: 700,
                            minWidth: 130,
                          }}
                        >
                          {playerNames[
                            player.playerId
                          ] ?? player.playerId}
                        </td>

                        <td style={cellStyle}>
                          {player.rosterWeeks}
                        </td>

                        <td style={cellStyle}>
                          {player.starts}
                        </td>

                        <td style={cellStyle}>
                          {format(
                            player.loyaltyPoints
                          )}
                        </td>

                        <td style={cellStyle}>
                          {format(
                            player.startPoints
                          )}
                        </td>

                        <td style={cellStyle}>
                          {format(
                            player.productionPoints
                          )}
                        </td>

                        <td style={cellStyle}>
                          {format(
                            player.seasonalGradePoints
                          )}
                        </td>

                        <td style={cellStyle}>
                          {format(
                            player.allSlootHonoursPoints
                          )}
                        </td>

                        <td
                          style={{
                            ...cellStyle,
                            fontWeight:
                              player.championships > 0
                                ? 800
                                : 400,
                            color:
                              player.championships > 0
                                ? "#eab308"
                                : "inherit",
                          }}
                          title={
                            player.championshipSeasons
                              .join(", ") ||
                            "No championships"
                          }
                        >
                          {player.championships > 0
                            ? `🏆 ${player.championships}`
                            : "0"}
                        </td>

                        <td style={cellStyle}>
                          {format(
                            player.championshipPoints
                          )}
                        </td>

                        <td
                          style={{
                            ...cellStyle,
                            fontWeight: 700,
                          }}
                        >
                          {format(
                            player.achievementPoints
                          )}
                        </td>

                        <td
                          style={{
                            ...cellStyle,
                            fontWeight: 800,
                            color: "#eab308",
                          }}
                        >
                          {format(
                            player.totalFranchiseLegacyPoints
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </main>
  );
}
