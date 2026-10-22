
import {
  getPlayerRecords,
  type PlayerWeeklyPerformance,
} from "../../lib/playerRecords";

type Position = "QB" | "RB" | "WR" | "TE";

const POSITIONS: Position[] = [
  "QB",
  "RB",
  "WR",
  "TE",
];

const EXISTING_THRESHOLDS: Record<
  Position,
  number[]
> = {
  QB: [400, 800, 1200, 1600, 2200],
  RB: [250, 500, 750, 1000, 1400],
  WR: [250, 500, 750, 1000, 1400],
  TE: [175, 350, 525, 700, 1000],
};

const MIN_STRONG_SEASON_STARTS = 8;

type SeasonTotal = {
  playerId: string;
  name: string;
  position: Position;
  season: string;
  points: number;
  starts: number;
  pointsPerStart: number;
};

type CareerTotal = {
  playerId: string;
  name: string;
  position: Position;
  points: number;
  starts: number;
  seasons: number;
};

function isPosition(value: string): value is Position {
  return POSITIONS.includes(value as Position);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;

  return (
    values.reduce((sum, value) => sum + value, 0) /
    values.length
  );
}

function median(values: number[]): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 1) {
    return sorted[middle];
  }

  return (sorted[middle - 1] + sorted[middle]) / 2;
}

function format(value: number): string {
  return round(value).toLocaleString("en-AU", {
    maximumFractionDigits: 2,
  });
}

function buildSeasonTotals(
  performances: PlayerWeeklyPerformance[],
  directory: Record<
    string,
    {
      name: string;
      position: string;
    }
  >
): SeasonTotal[] {
  const totals = new Map<
    string,
    {
      playerId: string;
      name: string;
      position: Position;
      season: string;
      points: number;
      starts: number;
    }
  >();

  // Prevent duplicate player starts from affecting
  // the historical averages.
  const seen = new Set<string>();

  for (const performance of performances) {
    const player = directory[performance.playerId];

    if (!player || !isPosition(player.position)) {
      continue;
    }

    const startKey = [
      performance.season,
      performance.week,
      performance.playerId,
    ].join(":");

    if (seen.has(startKey)) continue;
    seen.add(startKey);

    const key = [
      performance.season,
      performance.playerId,
    ].join(":");

    const existing = totals.get(key);

    if (existing) {
      existing.points += performance.points;
      existing.starts++;
    } else {
      totals.set(key, {
        playerId: performance.playerId,
        name: player.name,
        position: player.position,
        season: performance.season,
        points: performance.points,
        starts: 1,
      });
    }
  }

  return [...totals.values()].map((total) => ({
    ...total,
    points: round(total.points),
    pointsPerStart: round(
      total.points / total.starts
    ),
  }));
}

function buildCareerTotals(
  seasons: SeasonTotal[]
): CareerTotal[] {
  const careers = new Map<string, CareerTotal>();

  for (const season of seasons) {
    const existing = careers.get(season.playerId);

    if (existing) {
      existing.points += season.points;
      existing.starts += season.starts;
      existing.seasons++;
    } else {
      careers.set(season.playerId, {
        playerId: season.playerId,
        name: season.name,
        position: season.position,
        points: season.points,
        starts: season.starts,
        seasons: 1,
      });
    }
  }

  return [...careers.values()]
    .map((career) => ({
      ...career,
      points: round(career.points),
    }))
    .sort((a, b) => b.points - a.points);
}

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "13px",
};

const cellStyle: React.CSSProperties = {
  padding: "10px",
  borderBottom: "1px solid #334155",
  textAlign: "left",
};

export default async function MilestoneAnalysisPage() {
  const records = await getPlayerRecords();

  const completedSeasons = new Set(
    records.completedSeasons.regularSeason
  );

  const performances =
    records.competitions.regularSeason.weekly.filter(
      (performance) =>
        completedSeasons.has(performance.season) &&
        performance.week >= 1 &&
        performance.week <= 14 &&
        Number.isFinite(performance.points)
    );

  const seasonTotals = buildSeasonTotals(
    performances,
    records.players
  );

  const careerTotals = buildCareerTotals(seasonTotals);

  const summary = POSITIONS.map((position) => {
    const allSeasons = seasonTotals.filter(
      (season) => season.position === position
    );

    const qualifyingSeasons = allSeasons.filter(
      (season) =>
        season.starts >= MIN_STRONG_SEASON_STARTS
    );

    // Top six season totals at each position
    // per year, matching the broad Great-or-better
    // QB/TE and top-end RB/WR approach.
    const strongSeasons = qualifyingSeasons.filter(
      (season) => {
        const sameYear = allSeasons
          .filter(
            (candidate) =>
              candidate.season === season.season
          )
          .sort(
            (a, b) => b.points - a.points
          );

        const rank =
          sameYear.findIndex(
            (candidate) =>
              candidate.playerId === season.playerId
          ) + 1;

        const limit =
          position === "QB" || position === "TE"
            ? 6
            : 12;

        return rank > 0 && rank <= limit;
      }
    );

    const careerPlayers = careerTotals.filter(
      (career) => career.position === position
    );

    const medianStrongSeason = median(
      strongSeasons.map((season) => season.points)
    );

    const averageStrongSeason = average(
      strongSeasons.map((season) => season.points)
    );

    return {
      position,
      totalSeasons: allSeasons.length,
      qualifyingSeasons: qualifyingSeasons.length,
      strongSeasons: strongSeasons.length,
      averagePointsPerStart: round(
        average(
          strongSeasons.map(
            (season) => season.pointsPerStart
          )
        )
      ),
      averageStrongSeason: round(
        averageStrongSeason
      ),
      medianStrongSeason: round(
        medianStrongSeason
      ),
      tenSeasonTarget: round(
        medianStrongSeason * 10
      ),
      existingTier5:
        EXISTING_THRESHOLDS[position][4],
      milestoneCounts:
        EXISTING_THRESHOLDS[position].map(
          (threshold) =>
            careerPlayers.filter(
              (career) => career.points >= threshold
            ).length
        ),
    };
  });

  const exportData = {
    description:
      "SFL historical regular-season milestone analysis",
    completedSeasons: [
      ...completedSeasons,
    ].sort(),
    strongSeasonDefinition:
      "At least 8 starts, top 6 QB/TE or top 12 RB/WR in seasonal points",
    summary,
    topCareers: careerTotals.slice(0, 50),
    allCareers: careerTotals,
    strongSeasons: seasonTotals.filter(
      (season) => {
        const positionSummary = summary.find(
          (item) => item.position === season.position
        );

        if (!positionSummary) return false;

        if (season.starts < MIN_STRONG_SEASON_STARTS) {
          return false;
        }

        const sameYear = seasonTotals
          .filter(
            (candidate) =>
              candidate.position === season.position &&
              candidate.season === season.season
          )
          .sort(
            (a, b) => b.points - a.points
          );

        const limit =
          season.position === "QB" ||
          season.position === "TE"
            ? 6
            : 12;

        return (
          sameYear.findIndex(
            (candidate) =>
              candidate.playerId === season.playerId
          ) < limit
        );
      }
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
      <h1 style={{ fontSize: "28px", fontWeight: 800 }}>
        SFL Milestone Analysis
      </h1>

      <p
        style={{
          color: "#94a3b8",
          marginTop: "8px",
          marginBottom: "28px",
        }}
      >
        Historical regular-season scoring analysis.
        Only completed seasons and starting-lineup
        performances are included.
      </p>

      <h2 style={{ fontSize: "20px", fontWeight: 700 }}>
        Positional Scoring Summary
      </h2>

      <div
        style={{
          overflowX: "auto",
          marginTop: "16px",
          marginBottom: "36px",
        }}
      >
        <table style={tableStyle}>
          <thead>
            <tr>
              {[
                "Position",
                "Strong Seasons",
                "Avg PPG",
                "Avg Season",
                "Median Season",
                "10-Season Target",
                "Current Tier 5",
              ].map((heading) => (
                <th
                  key={heading}
                  style={cellStyle}
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {summary.map((item) => (
              <tr key={item.position}>
                <td style={cellStyle}>
                  {item.position}
                </td>
                <td style={cellStyle}>
                  {item.strongSeasons}
                </td>
                <td style={cellStyle}>
                  {format(item.averagePointsPerStart)}
                </td>
                <td style={cellStyle}>
                  {format(item.averageStrongSeason)}
                </td>
                <td style={cellStyle}>
                  {format(item.medianStrongSeason)}
                </td>
                <td style={cellStyle}>
                  <strong>
                    {format(item.tenSeasonTarget)}
                  </strong>
                </td>
                <td style={cellStyle}>
                  {format(item.existingTier5)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 style={{ fontSize: "20px", fontWeight: 700 }}>
        Players Reaching Existing Milestones
      </h2>

      <div
        style={{
          overflowX: "auto",
          marginTop: "16px",
          marginBottom: "36px",
        }}
      >
        <table style={tableStyle}>
          <thead>
            <tr>
              {[
                "Position",
                "Tier 1",
                "Tier 2",
                "Tier 3",
                "Tier 4",
                "Tier 5",
              ].map((heading) => (
                <th key={heading} style={cellStyle}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {summary.map((item) => (
              <tr key={item.position}>
                <td style={cellStyle}>
                  {item.position}
                </td>

                {item.milestoneCounts.map(
                  (count, index) => (
                    <td
                      key={index}
                      style={cellStyle}
                    >
                      {count}
                    </td>
                  )
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 style={{ fontSize: "20px", fontWeight: 700 }}>
        Top 30 SFL Scoring Careers
      </h2>

      <div
        style={{
          overflowX: "auto",
          marginTop: "16px",
          marginBottom: "36px",
        }}
      >
        <table style={tableStyle}>
          <thead>
            <tr>
              {[
                "Player",
                "Pos",
                "Career Points",
                "Starts",
                "Seasons",
              ].map((heading) => (
                <th key={heading} style={cellStyle}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {careerTotals
              .slice(0, 30)
              .map((career) => (
                <tr key={career.playerId}>
                  <td style={cellStyle}>
                    {career.name}
                  </td>
                  <td style={cellStyle}>
                    {career.position}
                  </td>
                  <td style={cellStyle}>
                    {format(career.points)}
                  </td>
                  <td style={cellStyle}>
                    {career.starts}
                  </td>
                  <td style={cellStyle}>
                    {career.seasons}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <h2 style={{ fontSize: "20px", fontWeight: 700 }}>
        Export Analysis Data
      </h2>

      <p
        style={{
          color: "#94a3b8",
          marginTop: "8px",
          marginBottom: "12px",
        }}
      >
        Copy the JSON below and send it to ChatGPT.
        It contains the positional summary, career
        totals and strong-season records.
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
    </main>
  );
}
