
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
  regularPoints: number;
  playoffPoints: number;
  totalPoints: number;
  regularStarts: number;
  playoffStarts: number;
  totalStarts: number;
  regularPointsPerStart: number;
};

type CareerTotal = {
  playerId: string;
  name: string;
  position: Position;
  regularPoints: number;
  playoffPoints: number;
  totalPoints: number;
  regularStarts: number;
  playoffStarts: number;
  totalStarts: number;
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

  return sorted.length % 2 === 1
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
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
    { name: string; position: string }
  >
): SeasonTotal[] {
  const totals = new Map<string, SeasonTotal>();
  const seen = new Set<string>();

  for (const performance of performances) {
    const player = directory[performance.playerId];

    if (
      !player ||
      !isPosition(player.position) ||
      !Number.isFinite(performance.points)
    ) {
      continue;
    }

    // One start per player, season and week.
    const startKey = [
      performance.season,
      performance.week,
      performance.playerId,
    ].join("|");

    if (seen.has(startKey)) continue;
    seen.add(startKey);

    const key = [
      performance.season,
      performance.playerId,
    ].join("|");

    let record = totals.get(key);

    if (!record) {
      record = {
        playerId: performance.playerId,
        name: player.name,
        position: player.position,
        season: performance.season,
        regularPoints: 0,
        playoffPoints: 0,
        totalPoints: 0,
        regularStarts: 0,
        playoffStarts: 0,
        totalStarts: 0,
        regularPointsPerStart: 0,
      };

      totals.set(key, record);
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

  return [...totals.values()].map((record) => ({
    ...record,
    regularPoints: round(record.regularPoints),
    playoffPoints: round(record.playoffPoints),
    totalPoints: round(record.totalPoints),
    regularPointsPerStart:
      record.regularStarts > 0
        ? round(
            record.regularPoints /
              record.regularStarts
          )
        : 0,
  }));
}

function buildCareerTotals(
  seasons: SeasonTotal[]
): CareerTotal[] {
  const careers = new Map<string, CareerTotal>();

  for (const season of seasons) {
    let career = careers.get(season.playerId);

    if (!career) {
      career = {
        playerId: season.playerId,
        name: season.name,
        position: season.position,
        regularPoints: 0,
        playoffPoints: 0,
        totalPoints: 0,
        regularStarts: 0,
        playoffStarts: 0,
        totalStarts: 0,
        seasons: 0,
      };

      careers.set(season.playerId, career);
    }

    career.regularPoints += season.regularPoints;
    career.playoffPoints += season.playoffPoints;
    career.totalPoints += season.totalPoints;
    career.regularStarts += season.regularStarts;
    career.playoffStarts += season.playoffStarts;
    career.totalStarts += season.totalStarts;
    career.seasons++;
  }

  return [...careers.values()]
    .map((career) => ({
      ...career,
      regularPoints: round(career.regularPoints),
      playoffPoints: round(career.playoffPoints),
      totalPoints: round(career.totalPoints),
    }))
    .sort(
      (a, b) => b.totalPoints - a.totalPoints
    );
}

const cellStyle: React.CSSProperties = {
  padding: "10px",
  borderBottom: "1px solid #334155",
  textAlign: "left",
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

  // Include regular-season scoring only when the
  // regular season has been completed.
  const regularWeekly =
    records.competitions.regularSeason.weekly.filter(
      (performance) =>
        completedRegular.has(performance.season) &&
        performance.week >= 1 &&
        performance.week <= 14
    );

  // Only winners-bracket playoff performances
  // already classified as "Main Playoffs"
  // by sleeper.ts are eligible.
  const playoffWeekly =
    records.competitions.mainPlayoffs.weekly.filter(
      (performance) =>
        completedPlayoffs.has(performance.season) &&
        performance.week >= 15 &&
        performance.week <= 17
    );

  const performances = [
    ...regularWeekly,
    ...playoffWeekly,
  ];

  const seasonTotals = buildSeasonTotals(
    performances,
    records.players
  );

  const careerTotals = buildCareerTotals(
    seasonTotals
  );

  const strongSeasonIds = new Set<string>();

  const summary = POSITIONS.map((position) => {
    const allSeasons = seasonTotals.filter(
      (season) => season.position === position
    );

    const qualifyingSeasons = allSeasons.filter(
      (season) =>
        season.regularStarts >=
        MIN_STRONG_SEASON_STARTS
    );

    // Rank by regular-season production so playoff
    // opportunities do not determine who qualifies
    // as a strong seasonal performer.
    const strongSeasons = qualifyingSeasons.filter(
      (season) => {
        const sameYear = allSeasons
          .filter(
            (candidate) =>
              candidate.season === season.season
          )
          .sort(
            (a, b) =>
              b.regularPoints - a.regularPoints
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

        const qualifies =
          rank > 0 && rank <= limit;

        if (qualifies) {
          strongSeasonIds.add(
            `${season.season}|${season.playerId}`
          );
        }

        return qualifies;
      }
    );

    const positionCareers = careerTotals.filter(
      (career) => career.position === position
    );

    const medianStrongSeason = median(
      strongSeasons.map(
        (season) => season.totalPoints
      )
    );

    return {
      position,
      strongSeasons: strongSeasons.length,
      averageRegularPPG: round(
        average(
          strongSeasons.map(
            (season) =>
              season.regularPointsPerStart
          )
        )
      ),
      averageRegularPoints: round(
        average(
          strongSeasons.map(
            (season) => season.regularPoints
          )
        )
      ),
      averagePlayoffPoints: round(
        average(
          strongSeasons.map(
            (season) => season.playoffPoints
          )
        )
      ),
      averageTotalPoints: round(
        average(
          strongSeasons.map(
            (season) => season.totalPoints
          )
        )
      ),
      medianTotalPoints: round(
        medianStrongSeason
      ),
      tenSeasonTarget: round(
        medianStrongSeason * 10
      ),
      currentTier5:
        EXISTING_THRESHOLDS[position][4],
      milestoneCounts:
        EXISTING_THRESHOLDS[position].map(
          (threshold) =>
            positionCareers.filter(
              (career) =>
                career.totalPoints >= threshold
            ).length
        ),
    };
  });

  const strongSeasons = seasonTotals.filter(
    (season) =>
      strongSeasonIds.has(
        `${season.season}|${season.playerId}`
      )
  );

  const exportData = {
    description:
      "SFL career milestone analysis including eligible playoff points",
    completedRegularSeasons: [
      ...completedRegular,
    ].sort(),
    completedPlayoffSeasons: [
      ...completedPlayoffs,
    ].sort(),
    rules: {
      regularSeasonWeeks: "1-14",
      playoffWeeks: "15-17",
      eligiblePlayoffs:
        "Main Playoffs only, as classified by sleeper.ts",
      excluded:
        "Toilet Bowl, placement games and bench performances",
      strongSeasonDefinition:
        "At least 8 regular-season starts; top 6 QB/TE or top 12 RB/WR by regular-season points",
    },
    summary,
    topCareers: careerTotals.slice(0, 50),
    allCareers: careerTotals,
    strongSeasons,
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
        SFL Milestone Analysis
      </h1>

      <p
        style={{
          color: "#94a3b8",
          marginTop: "8px",
          marginBottom: "28px",
        }}
      >
        Career scoring includes regular-season and
        eligible winners-bracket playoff starts.
        Toilet Bowl and placement games are excluded.
      </p>

      <h2
        style={{
          fontSize: "20px",
          fontWeight: 700,
        }}
      >
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
                "Avg Reg PPG",
                "Avg Reg Pts",
                "Avg Playoff Pts",
                "Avg Total",
                "Median Total",
                "10-Season Target",
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
                  {format(item.averageRegularPPG)}
                </td>
                <td style={cellStyle}>
                  {format(item.averageRegularPoints)}
                </td>
                <td style={cellStyle}>
                  {format(item.averagePlayoffPoints)}
                </td>
                <td style={cellStyle}>
                  {format(item.averageTotalPoints)}
                </td>
                <td style={cellStyle}>
                  {format(item.medianTotalPoints)}
                </td>
                <td style={cellStyle}>
                  <strong>
                    {format(item.tenSeasonTarget)}
                  </strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2
        style={{
          fontSize: "20px",
          fontWeight: 700,
        }}
      >
        Existing Milestone Achievement
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

      <h2
        style={{
          fontSize: "20px",
          fontWeight: 700,
        }}
      >
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
                "Regular Pts",
                "Playoff Pts",
                "Career Total",
                "Starts",
                "Seasons",
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
                    {format(career.regularPoints)}
                  </td>
                  <td style={cellStyle}>
                    {format(career.playoffPoints)}
                  </td>
                  <td style={cellStyle}>
                    <strong>
                      {format(career.totalPoints)}
                    </strong>
                  </td>
                  <td style={cellStyle}>
                    {career.totalStarts}
                  </td>
                  <td style={cellStyle}>
                    {career.seasons}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <h2
        style={{
          fontSize: "20px",
          fontWeight: 700,
        }}
      >
        Export Analysis Data
      </h2>

      <p
        style={{
          color: "#94a3b8",
          marginTop: "8px",
          marginBottom: "12px",
        }}
      >
        Expand the JSON below and send its contents
        to ChatGPT. It includes career totals,
        positional averages and strong-season
        performances.
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
