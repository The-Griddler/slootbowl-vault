
import {
  getPlayerRecords,
  type PlayerWeeklyPerformance,
} from "../../lib/playerRecords";

type Position = "QB" | "RB" | "WR" | "TE";

const RANKINGS: Record<Position, number[]> = {
  QB: [1, 3, 6, 9, 12, 15, 18],
  RB: [1, 3, 6, 12, 18, 24, 30, 36],
  WR: [1, 3, 6, 12, 18, 24, 30, 36],
  TE: [1, 3, 6, 9, 12, 15, 18],
};

const POSITIONS: Position[] = [
  "QB",
  "RB",
  "WR",
  "TE",
];

type SeasonScore = {
  season: string;
  playerId: string;
  name: string;
  position: Position;
  regularPoints: number;
  playoffPoints: number;
  totalPoints: number;
  regularStarts: number;
  playoffStarts: number;
  totalStarts: number;
};

type RankedSeason = SeasonScore & {
  rank: number;
};

type RankingAverage = {
  position: Position;
  rank: number;
  seasons: number;
  avgRegularPoints: number;
  avgPlayoffPoints: number;
  avgTotalPoints: number;
  avgRegularStarts: number;
  avgPlayoffStarts: number;
  avgTotalStarts: number;
};

function isPosition(value: string): value is Position {
  return POSITIONS.includes(value as Position);
}

function round(value: number): number {
  return Math.round(
    (value + Number.EPSILON) * 100
  ) / 100;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;

  return values.reduce(
    (sum, value) => sum + value,
    0
  ) / values.length;
}

function format(value: number): string {
  return round(value).toLocaleString("en-AU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function buildSeasonScores(
  weekly: PlayerWeeklyPerformance[],
  players: Record<
    string,
    { name: string; position: string }
  >
): SeasonScore[] {
  const map = new Map<string, SeasonScore>();

  // Prevent duplicate records from counting
  // the same player start twice.
  const seen = new Set<string>();

  for (const performance of weekly) {
    const player = players[performance.playerId];

    if (
      !player ||
      !isPosition(player.position) ||
      !Number.isFinite(performance.points)
    ) {
      continue;
    }

    const uniqueKey = [
      performance.season,
      performance.week,
      performance.playerId,
    ].join("|");

    if (seen.has(uniqueKey)) {
      continue;
    }

    seen.add(uniqueKey);

    const key = [
      performance.season,
      performance.playerId,
    ].join("|");

    let record = map.get(key);

    if (!record) {
      record = {
        season: performance.season,
        playerId: performance.playerId,
        name: player.name,
        position: player.position,
        regularPoints: 0,
        playoffPoints: 0,
        totalPoints: 0,
        regularStarts: 0,
        playoffStarts: 0,
        totalStarts: 0,
      };

      map.set(key, record);
    }

    if (performance.phase === "Regular Season") {
      record.regularPoints += performance.points;
      record.regularStarts++;
    } else if (
      performance.phase === "Main Playoffs"
    ) {
      record.playoffPoints += performance.points;
      record.playoffStarts++;
    }

    record.totalPoints += performance.points;
    record.totalStarts++;
  }

  return [...map.values()].map((record) => ({
    ...record,
    regularPoints: round(record.regularPoints),
    playoffPoints: round(record.playoffPoints),
    totalPoints: round(record.totalPoints),
  }));
}

function rankSeasons(
  seasonScores: SeasonScore[]
): RankedSeason[] {
  const groups = new Map<string, SeasonScore[]>();

  for (const score of seasonScores) {
    const key = [
      score.season,
      score.position,
    ].join("|");

    const group = groups.get(key) ?? [];
    group.push(score);
    groups.set(key, group);
  }

  const ranked: RankedSeason[] = [];

  for (const group of groups.values()) {
    // Rank players using regular-season points.
    // Playoff points are included in their totals,
    // but do not change their positional ranking.
    const sorted = [...group].sort(
      (a, b) =>
        b.regularPoints - a.regularPoints ||
        b.regularStarts - a.regularStarts ||
        a.playerId.localeCompare(b.playerId)
    );

    sorted.forEach((score, index) => {
      ranked.push({
        ...score,
        rank: index + 1,
      });
    });
  }

  return ranked;
}

function buildRankingAverages(
  ranked: RankedSeason[]
): RankingAverage[] {
  const result: RankingAverage[] = [];

  for (const position of POSITIONS) {
    for (const rank of RANKINGS[position]) {
      const matching = ranked.filter(
        (record) =>
          record.position === position &&
          record.rank === rank
      );

      result.push({
        position,
        rank,
        seasons: matching.length,
        avgRegularPoints: round(
          average(
            matching.map(
              (record) => record.regularPoints
            )
          )
        ),
        avgPlayoffPoints: round(
          average(
            matching.map(
              (record) => record.playoffPoints
            )
          )
        ),
        avgTotalPoints: round(
          average(
            matching.map(
              (record) => record.totalPoints
            )
          )
        ),
        avgRegularStarts: round(
          average(
            matching.map(
              (record) => record.regularStarts
            )
          )
        ),
        avgPlayoffStarts: round(
          average(
            matching.map(
              (record) => record.playoffStarts
            )
          )
        ),
        avgTotalStarts: round(
          average(
            matching.map(
              (record) => record.totalStarts
            )
          )
        ),
      });
    }
  }

  return result;
}

const cellStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderBottom: "1px solid #334155",
  textAlign: "left",
  whiteSpace: "nowrap",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "13px",
};

export default async function MilestoneAnalysisPage() {
  const records = await getPlayerRecords();

  const completedRegular = new Set(
    records.completedSeasons.regularSeason
  );

  const completedPlayoffs = new Set(
    records.completedSeasons.mainPlayoffs
  );

  const regularWeekly =
    records.competitions.regularSeason.weekly.filter(
      (record) =>
        completedRegular.has(record.season) &&
        record.week >= 1 &&
        record.week <= 14
    );

  const playoffWeekly =
    records.competitions.mainPlayoffs.weekly.filter(
      (record) =>
        completedRegular.has(record.season) &&
        completedPlayoffs.has(record.season) &&
        record.week >= 15 &&
        record.week <= 17
    );

  const seasonScores = buildSeasonScores([
    ...regularWeekly,
    ...playoffWeekly,
  ], records.players);

  const ranked = rankSeasons(seasonScores);

  const averages = buildRankingAverages(ranked);

  const exportData = {
    description:
      "Average SFL season scores by positional rank",
    rankingMethod:
      "Players ranked by regular-season fantasy points",
    scoringMethod:
      "Regular season plus eligible Main Playoffs",
    completedRegularSeasons: [
      ...completedRegular,
    ].sort(),
    completedPlayoffSeasons: [
      ...completedPlayoffs,
    ].sort(),
    rankings: averages,
    individualSeasons: ranked.sort(
      (a, b) =>
        Number(a.season) - Number(b.season) ||
        a.position.localeCompare(b.position) ||
        a.rank - b.rank
    ),
  };

  return (
    <main
      style={{
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "24px 16px 80px",
        color: "#e2e8f0",
      }}
    >
      <h1
        style={{
          fontSize: "28px",
          fontWeight: 800,
        }}
      >
        SFL Positional Scoring Analysis
      </h1>

      <p
        style={{
          color: "#94a3b8",
          marginTop: "8px",
          marginBottom: "28px",
        }}
      >
        Historical average fantasy points by positional
        season ranking. Rankings use regular-season
        points; scoring totals include eligible
        winners-bracket playoff performances.
      </p>

      {POSITIONS.map((position) => {
        const positionAverages = averages.filter(
          (item) => item.position === position
        );

        return (
          <section
            key={position}
            style={{
              marginBottom: "40px",
            }}
          >
            <h2
              style={{
                fontSize: "21px",
                fontWeight: 800,
                marginBottom: "14px",
              }}
            >
              {position} Season Rankings
            </h2>

            <div
              style={{
                overflowX: "auto",
                border: "1px solid #334155",
                borderRadius: "10px",
              }}
            >
              <table style={tableStyle}>
                <thead>
                  <tr>
                    {[
                      "Rank",
                      "Seasons",
                      "Avg Reg Pts",
                      "Avg Playoff Pts",
                      "Avg Total Pts",
                      "Avg Reg Starts",
                      "Avg Playoff Starts",
                    ].map((heading) => (
                      <th
                        key={heading}
                        style={{
                          ...cellStyle,
                          background: "#1e293b",
                          fontWeight: 700,
                        }}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {positionAverages.map((item) => (
                    <tr key={item.rank}>
                      <td style={cellStyle}>
                        <strong>
                          {position}
                          {item.rank}
                        </strong>
                      </td>

                      <td style={cellStyle}>
                        {item.seasons}
                      </td>

                      <td style={cellStyle}>
                        {format(item.avgRegularPoints)}
                      </td>

                      <td style={cellStyle}>
                        {format(item.avgPlayoffPoints)}
                      </td>

                      <td style={cellStyle}>
                        <strong>
                          {format(item.avgTotalPoints)}
                        </strong>
                      </td>

                      <td style={cellStyle}>
                        {format(item.avgRegularStarts)}
                      </td>

                      <td style={cellStyle}>
                        {format(item.avgPlayoffStarts)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}

      <section>
        <h2
          style={{
            fontSize: "20px",
            fontWeight: 800,
            marginBottom: "12px",
          }}
        >
          Export Analysis Data
        </h2>

        <p
          style={{
            color: "#94a3b8",
            marginBottom: "12px",
          }}
        >
          Copy the JSON below and send it to ChatGPT.
          It includes the averages and the individual
          season results behind them.
        </p>

        <details>
          <summary
            style={{
              cursor: "pointer",
              fontWeight: 700,
              marginBottom: "12px",
            }}
          >
            Show JSON export
          </summary>

          <pre
            style={{
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
              fontSize: "11px",
              padding: "16px",
              border: "1px solid #334155",
              borderRadius: "10px",
              background: "#0f172a",
              maxHeight: "500px",
              overflowY: "auto",
            }}
          >
            {JSON.stringify(exportData, null, 2)}
          </pre>
        </details>
      </section>
    </main>
  );
}
