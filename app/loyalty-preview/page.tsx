
import { FRANCHISES } from "../../lib/franchises";
import {
  getFranchisePlayerCareers,
} from "../../lib/franchiseLegacy";
import {
  calculateFranchiseLegacyScores,
} from "../../lib/franchiseLegacyScore";
import { getPlayerNames } from "../../lib/players";

export default async function LoyaltyPreviewPage() {
  const careers =
    await getFranchisePlayerCareers();

  const rankings =
    calculateFranchiseLegacyScores(careers);

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
    [...new Set(
      topPlayers.map((player) => player.playerId)
    )]
  );

  const format = (value: number) =>
    value.toLocaleString("en-AU", {
      maximumFractionDigits: 0,
    });

  return (
    <main style={{ padding: "24px 12px 110px" }}>
      <h1>Franchise Legends Preview</h1>

      <p
        style={{
          color: "#9da7b3",
          fontSize: 13,
          lineHeight: 1.6,
          marginTop: 10,
        }}
      >
        Experimental rankings combining franchise
        loyalty, official starts and fantasy
        production. Seasonal awards and
        championships are not included yet.
      </p>

      {FRANCHISES.map((franchise) => {
        const leaders = rankings
          .filter(
            (player) =>
              player.rosterId === franchise.rosterId
          )
          .slice(0, 15);

        return (
          <section
            key={franchise.rosterId}
            style={{ marginTop: 36 }}
          >
            <h2 style={{ fontSize: 19 }}>
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
                  {leaders.map((player, index) => (
                    <tr
                      key={player.playerId}
                      style={{
                        borderBottom:
                          "1px solid #27303b",
                      }}
                    >
                      <td style={{ padding: "11px 8px" }}>
                        {index + 1}
                      </td>

                      <td
                        style={{
                          padding: "11px 8px",
                          fontWeight: 700,
                          minWidth: 130,
                        }}
                      >
                        {playerNames[player.playerId] ??
                          player.playerId}
                      </td>

                      <td style={{ padding: "11px 8px" }}>
                        {player.rosterWeeks}
                      </td>

                      <td style={{ padding: "11px 8px" }}>
                        {player.starts}
                      </td>

                      <td style={{ padding: "11px 8px" }}>
                        {format(player.loyaltyPoints)}
                      </td>

                      <td style={{ padding: "11px 8px" }}>
                        {format(player.startPoints)}
                      </td>

                      <td style={{ padding: "11px 8px" }}>
                        {format(player.productionPoints)}
                      </td>

                      <td
                        style={{
                          padding: "11px 8px",
                          fontWeight: 800,
                          color: "#eab308",
                        }}
                      >
                        {format(
                          player.totalFranchiseLegacyPoints
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </main>
  );
}
