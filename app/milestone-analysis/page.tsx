
import type { CSSProperties, ReactNode } from "react";

import { getPlayerRecords } from "../../lib/playerRecords";

import {
  getPlayers,
  getPlayerName,
} from "../../lib/players";

import { getHistoricalData } from "../../lib/sleeper";

import { calculateAllSloot } from "../../lib/allSloot";

import { calculateAllSlootCareers } from "../../lib/allSlootCareer";

import {
  calculateHistoricalSeasonGrades,
  calculateGradeCareers,
} from "../../lib/seasonGrades";

import {
  calculateLegacyScores,
  type LegacyScore,
} from "../../lib/legacyScore";

import { getSlootbowlResults } from "../../lib/slootbowlResults";

type Position = "QB" | "RB" | "WR" | "TE";

const POSITIONS: Position[] = [
  "QB",
  "RB",
  "WR",
  "TE",
];

// Proposed 15-tier career scoring thresholds.
// Career points include eligible regular-season
// and main-playoff starter performances.
const PROPOSED_THRESHOLDS: Record<
  Position,
  number[]
> = {
  QB: [
    110, 215, 325, 490, 650,
    815, 975, 1140, 1300, 1625,
    1950, 2275, 2600, 2925, 3250,
  ],
  RB: [
    90, 185, 275, 415, 550,
    690, 825, 965, 1100, 1375,
    1650, 1925, 2200, 2475, 2750,
  ],
  WR: [
    85, 175, 260, 390, 520,
    650, 780, 910, 1040, 1300,
    1560, 1820, 2080, 2340, 2600,
  ],
  TE: [
    75, 155, 230, 345, 460,
    575, 690, 805, 920, 1150,
    1380, 1610, 1840, 2070, 2300,
  ],
};

// Progressive early rewards, plateauing at
// 275 LP per milestone from Tier 10 onwards.
// Total possible milestone LP = 3,000.
const PROPOSED_BONUSES = [
  50, 75, 100, 125, 150,
  175, 200, 225, 250, 275,
  275, 275, 275, 275, 275,
] as const;

const MAX_TIERS = PROPOSED_BONUSES.length;

const MAX_MILESTONE_POINTS =
  PROPOSED_BONUSES.reduce(
    (sum, bonus) => sum + bonus,
    0
  );

const BORDER = "1px solid #263244";
const MUTED = "#9da7b3";

type Records = Awaited<
  ReturnType<typeof getPlayerRecords>
>;

type WeeklyPerformance =
  Records["competitions"]["regularSeason"]["weekly"][number];

type CareerProduction = {
  regularPoints: number;
  playoffPoints: number;
  regularStarts: number;
  playoffStarts: number;
};

type Comparison = {
  playerId: string;
  name: string;
  position: string;

  oldRank: number;
  newRank: number;
  rankChange: number;

  oldTotal: number;
  newTotal: number;
  gained: number;

  oldMilestones: number;
  newMilestones: number;
  tier: number;

  regularPoints: number;
  playoffPoints: number;
  careerPoints: number;

  regularStarts: number;
  playoffStarts: number;

  seasonalGradePoints: number;
  allSlootHonoursPoints: number;
  playoffLegacyPoints: number;
  weeklyAwardPoints: number;
};

const cellStyle: CSSProperties = {
  padding: "11px 10px",
  borderBottom: BORDER,
};

function format(value: number): string {
  return value.toLocaleString("en-AU", {
    maximumFractionDigits: 2,
  });
}

function isPosition(
  value: string | undefined | null
): value is Position {
  return POSITIONS.includes(
    value as Position
  );
}

function calculateProposedMilestones(
  position: string,
  careerPoints: number
): {
  tier: number;
  points: number;
} {
  if (!isPosition(position)) {
    return {
      tier: 0,
      points: 0,
    };
  }

  const thresholds =
    PROPOSED_THRESHOLDS[position];

  const tier = thresholds.filter(
    (threshold) =>
      careerPoints + 0.000001 >= threshold
  ).length;

  const points = PROPOSED_BONUSES
    .slice(0, tier)
    .reduce(
      (sum, bonus) => sum + bonus,
      0
    );

  return {
    tier,
    points,
  };
}

/**
 * Calculate historical career production
 * from completed SFL seasons.
 *
 * Only started players count.
 *
 * Regular season: Weeks 1-14.
 * Main playoffs: Weeks 15-17.
 *
 * Toilet Bowl and placement games are
 * excluded by the existing records data.
 */
function buildCareerProduction(
  records: Records,
  completedThroughSeason: number
): Map<string, CareerProduction> {
  const results = new Map<
    string,
    CareerProduction
  >();

  const completedRegularSeasons = new Set(
    records.completedSeasons.regularSeason.filter(
      (season) =>
        Number(season) <= completedThroughSeason
    )
  );

  const completedPlayoffSeasons = new Set(
    records.completedSeasons.mainPlayoffs.filter(
      (season) =>
        Number(season) <= completedThroughSeason
    )
  );

  // Prevent duplicate player-week entries.
  const seen = new Set<string>();

  function addPerformances(
    entries: WeeklyPerformance[],
    phase: "regular" | "playoff",
    eligibleSeasons: Set<string>
  ) {
    for (const entry of entries) {
      if (!eligibleSeasons.has(entry.season)) {
        continue;
      }

      if (
        phase === "regular" &&
        (entry.week < 1 || entry.week > 14)
      ) {
        continue;
      }

      if (
        phase === "playoff" &&
        (entry.week < 15 || entry.week > 17)
      ) {
        continue;
      }

      if (!Number.isFinite(entry.points)) {
        continue;
      }

      const key = [
        entry.playerId,
        entry.season,
        entry.week,
        phase,
      ].join(":");

      if (seen.has(key)) {
        continue;
      }

      seen.add(key);

      const existing = results.get(
        entry.playerId
      ) ?? {
        regularPoints: 0,
        playoffPoints: 0,
        regularStarts: 0,
        playoffStarts: 0,
      };

      if (phase === "regular") {
        existing.regularPoints += entry.points;
        existing.regularStarts += 1;
      } else {
        existing.playoffPoints += entry.points;
        existing.playoffStarts += 1;
      }

      results.set(
        entry.playerId,
        existing
      );
    }
  }

  addPerformances(
    records.competitions.regularSeason.weekly,
    "regular",
    completedRegularSeasons
  );

  addPerformances(
    records.competitions.mainPlayoffs.weekly,
    "playoff",
    completedPlayoffSeasons
  );

  return results;
}

/**
 * Recalculate milestone points only.
 *
 * All other categories retain their
 * official Legacy Score values.
 */
function comparePlayers(
  scores: LegacyScore[],
  production: Map<string, CareerProduction>
): Comparison[] {
  const oldRanking = [...scores].sort(
    (a, b) =>
      b.totalLegacyPoints -
        a.totalLegacyPoints ||
      b.qualifyingGreatSeasons -
        a.qualifyingGreatSeasons ||
      a.name.localeCompare(b.name)
  );

  const oldRanks = new Map(
    oldRanking.map((player, index) => [
      player.playerId,
      index + 1,
    ])
  );

  const preliminary = scores.map(
    (player) => {
      const career = production.get(
        player.playerId
      ) ?? {
        regularPoints: 0,
        playoffPoints: 0,
        regularStarts: 0,
        playoffStarts: 0,
      };

      const careerPoints =
        career.regularPoints +
        career.playoffPoints;

      const proposed =
        calculateProposedMilestones(
          player.position,
          careerPoints
        );

      const newTotal =
        player.totalLegacyPoints -
        player.careerMilestonePoints +
        proposed.points;

      return {
        player,
        career,
        careerPoints,
        proposed,
        newTotal,
      };
    }
  );

  preliminary.sort(
    (a, b) =>
      b.newTotal - a.newTotal ||
      b.player.qualifyingGreatSeasons -
        a.player.qualifyingGreatSeasons ||
      a.player.name.localeCompare(b.player.name)
  );

  return preliminary.map(
    (item, index): Comparison => {
      const player = item.player;

      const oldRank =
        oldRanks.get(player.playerId) ?? 0;

      const newRank = index + 1;

      return {
        playerId: player.playerId,
        name: player.name,
        position: player.position,

        oldRank,
        newRank,
        rankChange: oldRank - newRank,

        oldTotal: player.totalLegacyPoints,
        newTotal: item.newTotal,

        gained:
          item.proposed.points -
          player.careerMilestonePoints,

        oldMilestones:
          player.careerMilestonePoints,

        newMilestones:
          item.proposed.points,

        tier: item.proposed.tier,

        regularPoints:
          item.career.regularPoints,

        playoffPoints:
          item.career.playoffPoints,

        careerPoints:
          item.careerPoints,

        regularStarts:
          item.career.regularStarts,

        playoffStarts:
          item.career.playoffStarts,

        seasonalGradePoints:
          player.seasonalGradePoints,

        allSlootHonoursPoints:
          player.allSlootHonoursPoints,

        playoffLegacyPoints:
          player.playoffLegacyPoints,

        weeklyAwardPoints:
          player.weeklyAwardPoints,
      };
    }
  );
}

function SectionTitle({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <h2
      style={{
        fontSize: "20px",
        fontWeight: 800,
        marginTop: "32px",
        marginBottom: "12px",
      }}
    >
      {children}
    </h2>
  );
}

function SummaryCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div
      style={{
        padding: "16px",
        background: "#202833",
        border: BORDER,
        borderRadius: "10px",
      }}
    >
      <div
        style={{
          color: MUTED,
          fontSize: "11px",
          marginBottom: "7px",
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: "24px",
          fontWeight: 800,
        }}
      >
        {value}
      </div>

      <div
        style={{
          color: MUTED,
          fontSize: "11px",
          marginTop: "6px",
        }}
      >
        {detail}
      </div>
    </div>
  );
}

function RankingTable({
  players,
}: {
  players: Comparison[];
}) {
  return (
    <div
      style={{
        overflowX: "auto",
        border: BORDER,
        borderRadius: "10px",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "12px",
          whiteSpace: "nowrap",
        }}
      >
        <thead>
          <tr
            style={{
              background: "#202833",
              color: MUTED,
              textAlign: "left",
            }}
          >
            {[
              "New #",
              "Player",
              "Pos",
              "Old #",
              "Move",
              "Old LP",
              "New LP",
              "LP Change",
              "Tier",
            ].map((heading) => (
              <th
                key={heading}
                style={{
                  padding: "12px 10px",
                  borderBottom: BORDER,
                }}
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {players.map((player) => {
            const movement =
              player.rankChange > 0
                ? `▲ ${player.rankChange}`
                : player.rankChange < 0
                  ? `▼ ${Math.abs(
                      player.rankChange
                    )}`
                  : "—";

            return (
              <tr key={player.playerId}>
                <td style={cellStyle}>
                  {player.newRank}
                </td>

                <td
                  style={{
                    ...cellStyle,
                    fontWeight: 700,
                  }}
                >
                  {player.name}
                </td>

                <td style={cellStyle}>
                  {player.position}
                </td>

                <td style={cellStyle}>
                  {player.oldRank}
                </td>

                <td
                  style={{
                    ...cellStyle,
                    color:
                      player.rankChange > 0
                        ? "#4ade80"
                        : player.rankChange < 0
                          ? "#fb7185"
                          : MUTED,
                  }}
                >
                  {movement}
                </td>

                <td style={cellStyle}>
                  {format(player.oldTotal)}
                </td>

                <td
                  style={{
                    ...cellStyle,
                    fontWeight: 700,
                  }}
                >
                  {format(player.newTotal)}
                </td>

                <td
                  style={{
                    ...cellStyle,
                    color:
                      player.gained > 0
                        ? "#4ade80"
                        : player.gained < 0
                          ? "#fb7185"
                          : MUTED,
                  }}
                >
                  {player.gained > 0 ? "+" : ""}
                  {format(player.gained)}
                </td>

                <td style={cellStyle}>
                  {player.tier}/{MAX_TIERS}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {players.length === 0 && (
        <p
          style={{
            padding: "16px",
            color: MUTED,
          }}
        >
          No players to display.
        </p>
      )}
    </div>
  );
}

function CareerTable({
  players,
}: {
  players: Comparison[];
}) {
  return (
    <div
      style={{
        overflowX: "auto",
        border: BORDER,
        borderRadius: "10px",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "12px",
          whiteSpace: "nowrap",
        }}
      >
        <thead>
          <tr
            style={{
              background: "#202833",
              color: MUTED,
              textAlign: "left",
            }}
          >
            {[
              "Player",
              "Pos",
              "Regular Pts",
              "Playoff Pts",
              "Career Pts",
              "Reg Starts",
              "Playoff Starts",
              "Tier",
              "Old Milestone LP",
              "New Milestone LP",
            ].map((heading) => (
              <th
                key={heading}
                style={{
                  padding: "12px 10px",
                  borderBottom: BORDER,
                }}
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {[...players]
            .sort(
              (a, b) =>
                b.careerPoints -
                  a.careerPoints ||
                a.name.localeCompare(b.name)
            )
            .map((player) => (
              <tr key={player.playerId}>
                <td style={cellStyle}>
                  {player.name}
                </td>

                <td style={cellStyle}>
                  {player.position}
                </td>

                <td style={cellStyle}>
                  {format(
                    player.regularPoints
                  )}
                </td>

                <td style={cellStyle}>
                  {format(
                    player.playoffPoints
                  )}
                </td>

                <td
                  style={{
                    ...cellStyle,
                    fontWeight: 700,
                  }}
                >
                  {format(
                    player.careerPoints
                  )}
                </td>

                <td style={cellStyle}>
                  {player.regularStarts}
                </td>

                <td style={cellStyle}>
                  {player.playoffStarts}
                </td>

                <td style={cellStyle}>
                  {player.tier}/{MAX_TIERS}
                </td>

                <td style={cellStyle}>
                  {format(
                    player.oldMilestones
                  )}
                </td>

                <td style={cellStyle}>
                  {format(
                    player.newMilestones
                  )}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function MilestoneAnalysisPage() {
  const [
    records,
    players,
    historicalData,
  ] = await Promise.all([
    getPlayerRecords(),
    getPlayers(),
    getHistoricalData(),
  ]);

  const currentYear =
    new Date().getUTCFullYear();

  const completedThroughSeason =
    currentYear - 1;

  // Build the same player directory
  // used by the official Legacy page.
  const directory = Object.fromEntries(
    Object.entries(players).map(
      ([id, player]) => [
        id,
        {
          name: getPlayerName(player),
          position: player.position,
          rookieYear:
            typeof player.years_exp === "number" &&
            Number.isFinite(
              player.years_exp
            ) &&
            player.years_exp >= 0
              ? currentYear -
                player.years_exp
              : null,
        },
      ]
    )
  );

  // Use the same completed-season cutoff
  // as the official Legacy leaderboard.
  const completedSeasons =
    historicalData.filter(
      (season) =>
        Number(season.league.season) <=
        completedThroughSeason
    );

  // Existing All-Sloot honours.
  const allSlootSeasons =
    completedSeasons.map(
      (season) =>
        calculateAllSloot(
          season,
          directory
        )
    );

  const honours =
    calculateAllSlootCareers(
      allSlootSeasons
    );

  // Existing seasonal grade calculations.
  const seasonGrades =
    calculateHistoricalSeasonGrades(
      completedSeasons,
      directory,
      completedThroughSeason
    );

  const gradeCareers =
    calculateGradeCareers(
      seasonGrades
    );

  // Existing verified championship results.
  const championshipResults =
    await getSlootbowlResults(
      completedSeasons,
      completedThroughSeason
    );

  // Official Legacy Scores, unchanged.
  const oldScores =
    calculateLegacyScores(
      gradeCareers,
      honours,
      records,
      directory,
      completedThroughSeason,
      championshipResults,
      completedSeasons
    );

  // Calculate career starter production.
  const production =
    buildCareerProduction(
      records,
      completedThroughSeason
    );

  // Recalculate milestones only.
  const comparison =
    comparePlayers(
      oldScores,
      production
    );

  const biggestRisers =
    [...comparison]
      .filter(
        (player) =>
          player.rankChange > 0
      )
      .sort(
        (a, b) =>
          b.rankChange -
            a.rankChange ||
          b.gained - a.gained
      )
      .slice(0, 15);

  const biggestFallers =
    [...comparison]
      .filter(
        (player) =>
          player.rankChange < 0
      )
      .sort(
        (a, b) =>
          a.rankChange -
            b.rankChange ||
          a.gained - b.gained
      )
      .slice(0, 15);

  const biggestGainers =
    [...comparison]
      .sort(
        (a, b) =>
          b.gained - a.gained ||
          b.newTotal - a.newTotal
      )
      .slice(0, 15);

  const totalOldMilestones =
    comparison.reduce(
      (sum, player) =>
        sum +
        player.oldMilestones,
      0
    );

  const totalNewMilestones =
    comparison.reduce(
      (sum, player) =>
        sum +
        player.newMilestones,
      0
    );

  const changedRankings =
    comparison.filter(
      (player) =>
        player.rankChange !== 0
    ).length;

  const totalCareerPoints =
    comparison.reduce(
      (sum, player) =>
        sum +
        player.careerPoints,
      0
    );

  const exportData = {
    generatedAt:
      new Date().toISOString(),

    completedThroughSeason,

    system: {
      name:
        "Proposed 15-Tier SFL Legacy Milestones",
      maximumTiers: MAX_TIERS,
      maximumMilestonePoints:
        MAX_MILESTONE_POINTS,
      thresholds:
        PROPOSED_THRESHOLDS,
      bonuses:
        PROPOSED_BONUSES,
    },

    summary: {
      playerCount:
        comparison.length,
      changedRankings,
      totalOldMilestones,
      totalNewMilestones,
      totalCareerPoints,
    },

    players: comparison,
  };

  const json = JSON.stringify(
    exportData,
    null,
    2
  );

  const exportHref =
    "data:application/json;charset=utf-8," +
    encodeURIComponent(json);

  return (
    <main
      style={{
        maxWidth: "1100px",
        margin: "0 auto",
        padding:
          "24px 16px 110px",
      }}
    >
      <a
        href="/"
        style={{
          color: MUTED,
          fontSize: "13px",
          textDecoration: "none",
        }}
      >
        ← Back to Home
      </a>

      <h1
        style={{
          fontSize: "28px",
          fontWeight: 800,
          marginTop: "20px",
          marginBottom: "8px",
        }}
      >
        SFL Legacy Milestone Analysis
      </h1>

      <p
        style={{
          color: MUTED,
          fontSize: "13px",
          lineHeight: 1.7,
        }}
      >
        Comparing the official five-tier
        milestone system against the proposed
        15-tier system worth up to{" "}
        {format(MAX_MILESTONE_POINTS)}{" "}
        Legacy Points. All other Legacy
        categories remain unchanged.
        Completed seasons through{" "}
        {completedThroughSeason}.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "12px",
          marginTop: "24px",
        }}
      >
        <SummaryCard
          label="PLAYERS ANALYSED"
          value={format(
            comparison.length
          )}
          detail="Official Legacy leaderboard"
        />

        <SummaryCard
          label="RANKINGS CHANGED"
          value={format(
            changedRankings
          )}
          detail="Players moving up or down"
        />

        <SummaryCard
          label="OLD MILESTONE LP"
          value={format(
            totalOldMilestones
          )}
          detail="Combined across all players"
        />

        <SummaryCard
          label="NEW MILESTONE LP"
          value={format(
            totalNewMilestones
          )}
          detail="Combined across all players"
        />
      </div>

      <SectionTitle>
        Proposed Milestone System
      </SectionTitle>

      <div
        style={{
          overflowX: "auto",
          border: BORDER,
          borderRadius: "10px",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "12px",
            whiteSpace: "nowrap",
          }}
        >
          <thead>
            <tr
              style={{
                background: "#202833",
                color: MUTED,
                textAlign: "left",
              }}
            >
              {[
                "Tier",
                "QB",
                "RB",
                "WR",
                "TE",
                "LP Earned",
                "Total LP",
              ].map((heading) => (
                <th
                  key={heading}
                  style={{
                    padding: "12px 10px",
                    borderBottom: BORDER,
                  }}
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {PROPOSED_BONUSES.map(
              (bonus, index) => {
                const cumulative =
                  PROPOSED_BONUSES
                    .slice(0, index + 1)
                    .reduce(
                      (sum, value) =>
                        sum + value,
                      0
                    );

                return (
                  <tr key={index}>
                    <td style={cellStyle}>
                      {index + 1}
                    </td>

                    {POSITIONS.map(
                      (position) => (
                        <td
                          key={position}
                          style={cellStyle}
                        >
                          {format(
                            PROPOSED_THRESHOLDS[
                              position
                            ][index]
                          )}
                        </td>
                      )
                    )}

                    <td style={cellStyle}>
                      +{format(bonus)}
                    </td>

                    <td
                      style={{
                        ...cellStyle,
                        fontWeight: 700,
                      }}
                    >
                      {format(cumulative)}
                    </td>
                  </tr>
                );
              }
            )}
          </tbody>
        </table>
      </div>

      <SectionTitle>
        New Legacy Rankings
      </SectionTitle>

      <p
        style={{
          color: MUTED,
          fontSize: "12px",
          lineHeight: 1.7,
        }}
      >
        Full leaderboard ranked by proposed
        Legacy Points. Positive movement means
        the player has climbed the rankings.
      </p>

      <RankingTable
        players={comparison}
      />

      <SectionTitle>
        Biggest Ranking Risers
      </SectionTitle>

      <RankingTable
        players={biggestRisers}
      />

      <SectionTitle>
        Biggest Ranking Fallers
      </SectionTitle>

      <RankingTable
        players={biggestFallers}
      />

      <SectionTitle>
        Biggest Legacy Points Gainers
      </SectionTitle>

      <RankingTable
        players={biggestGainers}
      />

      <SectionTitle>
        Career Scoring Breakdown
      </SectionTitle>

      <p
        style={{
          color: MUTED,
          fontSize: "12px",
          lineHeight: 1.7,
        }}
      >
        Career fantasy points earned in
        completed SFL seasons while started.
        Regular-season and eligible
        main-playoff performances contribute
        to the proposed milestone totals.
      </p>

      <CareerTable
        players={comparison}
      />

      <SectionTitle>
        Export Comparison Data
      </SectionTitle>

      <p
        style={{
          color: MUTED,
          fontSize: "12px",
          lineHeight: 1.7,
        }}
      >
        Download the complete player-by-player
        comparison, including old and new
        rankings, milestone rewards, scoring
        totals and Legacy category breakdowns.
      </p>

      <a
        href={exportHref}
        download="sfl-legacy-15-tier-comparison.json"
        style={{
          display: "inline-block",
          marginTop: "8px",
          padding: "12px 16px",
          borderRadius: "8px",
          background: "#2563eb",
          color: "#ffffff",
          fontSize: "13px",
          fontWeight: 700,
          textDecoration: "none",
        }}
      >
        Download Comparison JSON
      </a>

      <p
        style={{
          color: MUTED,
          fontSize: "12px",
          lineHeight: 1.7,
          marginTop: "28px",
        }}
      >
        Analysis only. The official Legacy
        scoring system has not been changed.
        Eligible performances are determined
        by the existing historical records
        and playoff classification logic.
        Toilet Bowl and consolation games
        should not contribute.
      </p>
    </main>
  );
}
