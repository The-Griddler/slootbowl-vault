
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

const PROPOSED_THRESHOLDS: Record<
  Position,
  number
> = {
  QB: 325,
  RB: 275,
  WR: 260,
  TE: 230,
};

const PROPOSED_BONUSES = [
  100,
  150,
  200,
  250,
  300,
  350,
  350,
  350,
  350,
  350,
];

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

const BORDER = "1px solid #263244";
const MUTED = "#9da7b3";

function format(value: number): string {
  return value.toLocaleString("en-AU", {
    maximumFractionDigits: 2,
  });
}

function isPosition(
  value: string | undefined | null
): value is Position {
  return POSITIONS.includes(value as Position);
}

function calculateProposedMilestones(
  position: string,
  careerPoints: number
) {
  if (!isPosition(position)) {
    return { tier: 0, points: 0 };
  }

  const benchmark =
    PROPOSED_THRESHOLDS[position];

  const tier = Math.min(
    10,
    Math.max(
      0,
      Math.floor(
        (careerPoints + 0.000001) / benchmark
      )
    )
  );

  const points = PROPOSED_BONUSES
    .slice(0, tier)
    .reduce((sum, bonus) => sum + bonus, 0);

  return { tier, points };
}

function buildCareerProduction(
  records: Awaited<
    ReturnType<typeof getPlayerRecords>
  >,
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

  // Protect against duplicate player-week entries.
  const seen = new Set<string>();

  function add(
    entries: typeof records.competitions.regularSeason.weekly,
    phase: "regular" | "playoff",
    completedSeasons: Set<string>
  ) {
    for (const entry of entries) {
      if (!completedSeasons.has(entry.season)) {
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

      const key = [
        entry.playerId,
        entry.season,
        entry.week,
        phase,
      ].join(":");

      if (seen.has(key)) continue;
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

      results.set(entry.playerId, existing);
    }
  }

  add(
    records.competitions.regularSeason.weekly,
    "regular",
    completedRegularSeasons
  );

  add(
    records.competitions.mainPlayoffs.weekly,
    "playoff",
    completedPlayoffSeasons
  );

  return results;
}

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

  const preliminary = scores.map((player) => {
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

    const proposed = calculateProposedMilestones(
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
  });

  preliminary.sort(
    (a, b) =>
      b.newTotal - a.newTotal ||
      b.player.qualifyingGreatSeasons -
        a.player.qualifyingGreatSeasons ||
      a.player.name.localeCompare(b.player.name)
  );

  return preliminary.map((item, index) => {
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

      newMilestones: item.proposed.points,
      tier: item.proposed.tier,

      regularPoints:
        item.career.regularPoints,

      playoffPoints:
        item.career.playoffPoints,

      careerPoints: item.careerPoints,

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
  });
}

function SectionTitle({
  children,
}: {
  children: React.ReactNode;
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

function RankingTable({
  players,
  mode,
}: {
  players: Comparison[];
  mode: "ranking" | "movement";
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
                  {player.tier}/10
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

const cellStyle: React.CSSProperties = {
  padding: "11px 10px",
  borderBottom: BORDER,
};

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

export default async function MilestoneAnalysisPage() {
  const [records, players, historicalData] =
    await Promise.all([
      getPlayerRecords(),
      getPlayers(),
      getHistoricalData(),
    ]);

  const currentYear =
    new Date().getUTCFullYear();

  const completedThroughSeason =
    currentYear - 1;

  const directory = Object.fromEntries(
    Object.entries(players).map(([id, player]) => [
      id,
      {
        name: getPlayerName(player),
        position: player.position,
        rookieYear:
          typeof player.years_exp === "number" &&
          Number.isFinite(player.years_exp) &&
          player.years_exp >= 0
            ? currentYear - player.years_exp
            : null,
      },
    ])
  );

  const completedSeasons =
    historicalData.filter(
      (season) =>
        Number(season.league.season) <=
        completedThroughSeason
    );

  const allSlootSeasons =
    completedSeasons.map((season) =>
      calculateAllSloot(season, directory)
    );

  const honours =
    calculateAllSlootCareers(
      allSlootSeasons
    );

  const seasonGrades =
    calculateHistoricalSeasonGrades(
      completedSeasons,
      directory,
      completedThroughSeason
    );

  const gradeCareers =
    calculateGradeCareers(seasonGrades);

  const championshipResults =
    await getSlootbowlResults(
      completedSeasons,
      completedThroughSeason
    );

  // Existing scoring system, unchanged.
  const oldScores = calculateLegacyScores(
    gradeCareers,
    honours,
    records,
    directory,
    completedThroughSeason,
    championshipResults,
    completedSeasons
  );

  // New career production calculation.
  const production = buildCareerProduction(
    records,
    completedThroughSeason
  );

  // Compare both systems without changing
  // the existing Legacy Score calculations.
  const comparison = comparePlayers(
    oldScores,
    production
  );

  const biggestRisers = [...comparison]
    .filter((player) => player.rankChange > 0)
    .sort(
      (a, b) =>
        b.rankChange - a.rankChange ||
        b.gained - a.gained
    )
    .slice(0, 15);

  const biggestFallers = [...comparison]
    .filter((player) => player.rankChange < 0)
    .sort(
      (a, b) =>
        a.rankChange - b.rankChange ||
        a.gained - b.gained
    )
    .slice(0, 15);

  const biggestGainers = [...comparison]
    .sort(
      (a, b) =>
        b.gained - a.gained ||
        b.newTotal - a.newTotal
    )
    .slice(0, 15);

  const totalOldMilestones =
    comparison.reduce(
      (sum, player) =>
        sum + player.oldMilestones,
      0
    );

  const totalNewMilestones =
    comparison.reduce(
      (sum, player) =>
        sum + player.newMilestones,
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
        sum + player.careerPoints,
      0
    );

  const exportData = {
    generatedAt: new Date().toISOString(),
    completedThroughSeason,
    thresholds: PROPOSED_THRESHOLDS,
    bonuses: PROPOSED_BONUSES,
    summary: {
      playerCount: comparison.length,
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
        padding: "24px 16px 110px",
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
        Comparing the existing five-tier career
        milestone system with the proposed
        ten-tier system. All other Legacy
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
          value={format(comparison.length)}
          detail="Existing Legacy leaderboard"
        />

        <SummaryCard
          label="RANKINGS CHANGED"
          value={format(changedRankings)}
          detail="Players moving up or down"
        />

        <SummaryCard
          label="OLD MILESTONE LP"
          value={format(totalOldMilestones)}
          detail="Combined across all players"
        />

        <SummaryCard
          label="NEW MILESTONE LP"
          value={format(totalNewMilestones)}
          detail="Combined across all players"
        />
      </div>

      <SectionTitle>
        Proposed milestone benchmarks
      </SectionTitle>

      <div
        style={{
          border: BORDER,
          borderRadius: "10px",
          padding: "16px",
          background: "#202833",
          fontSize: "13px",
          lineHeight: 1.9,
        }}
      >
        {POSITIONS.map((position) => (
          <div key={position}>
            <strong>{position}</strong>:{" "}
            {format(
              PROPOSED_THRESHOLDS[position]
            )}{" "}
            points per tier
          </div>
        ))}

        <p
          style={{
            color: MUTED,
            fontSize: "12px",
            marginTop: "10px",
          }}
        >
          Rewards:{" "}
          {PROPOSED_BONUSES.join(", ")} LP.
          Maximum cumulative reward: 2,750 LP.
        </p>
      </div>

      <SectionTitle>
        New Legacy Rankings
      </SectionTitle>

      <p style={{ color: MUTED, fontSize: "12px" }}>
        Full leaderboard, ranked by proposed
        Legacy Points.
      </p>

      <RankingTable
        players={comparison}
        mode="ranking"
      />

      <SectionTitle>
        Biggest Ranking Risers
      </SectionTitle>

      <RankingTable
        players={biggestRisers}
        mode="movement"
      />

      <SectionTitle>
        Biggest Ranking Fallers
      </SectionTitle>

      <RankingTable
        players={biggestFallers}
        mode="movement"
      />

      <SectionTitle>
        Biggest Legacy Points Gainers
      </SectionTitle>

      <RankingTable
        players={biggestGainers}
        mode="movement"
      />

      <SectionTitle>
        Career Scoring Breakdown
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
            {[...comparison]
              .sort(
                (a, b) =>
                  b.careerPoints -
                  a.careerPoints
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
                    {player.tier}/10
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
        Download the complete comparison as JSON
        so we can analyse individual careers,
        ranking changes and category balances.
      </p>

      <a
        href={exportHref}
        download="sfl-legacy-milestone-comparison.json"
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
        Analysis only. No changes have been made
        to the official Legacy scoring system.
        Career production includes completed
        regular-season starts and completed
        eligible main-playoff starts. Toilet Bowl
        and placement games are excluded according
        to the existing matchup classification.
      </p>
    </main>
  );
}
