
import { getLeagueHistory } from "../../lib/sleeper";

type WeeklyRoster = {
  roster_id: number;
  players?: string[] | null;
};

type SleeperTransaction = {
  transaction_id: string;
  type: string;
  status: string;
  adds?: Record<string, number> | null;
  drops?: Record<string, number> | null;
};

type TradeCheck = {
  season: string;
  week: number;
  playerId: string;
  from: number;
  to: number;
  beforeFrom: boolean;
  beforeTo: boolean;
  afterFrom: boolean;
  afterTo: boolean;
  verdict: "PASS" | "CHECK";
};

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error(`Sleeper request failed: ${url}`);
  }

  return response.json();
}

export default async function TradeAuditPage() {
  const leagues = (await getLeagueHistory()).filter(
    (league) => Number(league.season) < 2026
  );

  const checks: TradeCheck[] = [];
  let tradesFound = 0;

  for (const league of leagues) {
    const base =
      `https://api.sleeper.app/v1/league/${league.league_id}`;

    const weeks = Array.from(
      { length: 17 },
      (_, index) => index + 1
    );

    const [weeklyRosters, weeklyTransactions] =
      await Promise.all([
        Promise.all(
          weeks.map((week) =>
            fetchJson<WeeklyRoster[]>(
              `${base}/matchups/${week}`
            )
          )
        ),
        Promise.all(
          weeks.map((week) =>
            fetchJson<SleeperTransaction[]>(
              `${base}/transactions/${week}`
            )
          )
        ),
      ]);

    for (let index = 1; index < 17; index++) {
      const week = index + 1;

      const transactions = weeklyTransactions[index]
        .filter(
          (transaction) =>
            transaction.type === "trade" &&
            transaction.status === "complete"
        );

      tradesFound += transactions.length;

      const before = weeklyRosters[index - 1];
      const after = weeklyRosters[index];

      for (const transaction of transactions) {
        for (const [playerId, destination] of Object.entries(
          transaction.adds ?? {}
        )) {
          const source = Number(
            transaction.drops?.[playerId]
          );

          if (!Number.isInteger(source)) continue;
          if (source === destination) continue;

          const beforeFrom =
            before.find((r) => r.roster_id === source)
              ?.players?.includes(playerId) ?? false;

          const beforeTo =
            before.find((r) => r.roster_id === destination)
              ?.players?.includes(playerId) ?? false;

          const afterFrom =
            after.find((r) => r.roster_id === source)
              ?.players?.includes(playerId) ?? false;

          const afterTo =
            after.find((r) => r.roster_id === destination)
              ?.players?.includes(playerId) ?? false;

          checks.push({
            season: league.season,
            week,
            playerId,
            from: source,
            to: destination,
            beforeFrom,
            beforeTo,
            afterFrom,
            afterTo,
            verdict:
              beforeFrom &&
              !beforeTo &&
              !afterFrom &&
              afterTo
                ? "PASS"
                : "CHECK",
          });
        }
      }
    }
  }

  const passed = checks.filter(
    (check) => check.verdict === "PASS"
  ).length;

  return (
    <main style={{ padding: "24px 12px 110px" }}>
      <h1>Historical Trade Audit</h1>

      <p style={{ color: "#9da7b3", lineHeight: 1.6 }}>
        Checks whether traded players move between
        historical weekly roster snapshots.
        A CHECK result may reflect transaction timing,
        another roster move, or inconsistent data.
      </p>

      <div
        style={{
          background: "#151b23",
          border: "1px solid #27303b",
          borderRadius: 14,
          padding: 16,
          margin: "20px 0",
        }}
      >
        <p>Completed trades found: {tradesFound}</p>
        <p>Player movements checked: {checks.length}</p>
        <p>Passed: {passed}</p>
        <p>Needs inspection: {checks.length - passed}</p>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            borderCollapse: "collapse",
            width: "100%",
            fontSize: 12,
          }}
        >
          <thead>
            <tr>
              {[
                "Year",
                "Week",
                "Player ID",
                "From",
                "To",
                "Before",
                "After",
                "Result",
              ].map((heading) => (
                <th
                  key={heading}
                  style={{
                    padding: 8,
                    textAlign: "left",
                    borderBottom: "1px solid #27303b",
                  }}
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {checks.map((check, index) => (
              <tr key={`${check.season}-${check.week}-${check.playerId}-${index}`}>
                <td style={{ padding: 8 }}>{check.season}</td>
                <td style={{ padding: 8 }}>{check.week}</td>
                <td style={{ padding: 8 }}>{check.playerId}</td>
                <td style={{ padding: 8 }}>{check.from}</td>
                <td style={{ padding: 8 }}>{check.to}</td>
                <td style={{ padding: 8 }}>
                  {check.beforeFrom ? "Old ✓" : "Old ✗"}
                  {" / "}
                  {check.beforeTo ? "New ✓" : "New ✗"}
                </td>
                <td style={{ padding: 8 }}>
                  {check.afterFrom ? "Old ✓" : "Old ✗"}
                  {" / "}
                  {check.afterTo ? "New ✓" : "New ✗"}
                </td>
                <td
                  style={{
                    padding: 8,
                    fontWeight: 800,
                    color:
                      check.verdict === "PASS"
                        ? "#4ade80"
                        : "#fbbf24",
                  }}
                >
                  {check.verdict}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
