
import { FRANCHISES } from "../../lib/franchises";
import {
  getFranchisePlayerCareers,
} from "../../lib/franchiseLegacy";
import { getPlayerNames } from "../../lib/players";

export default async function LoyaltyPreviewPage() {
  const careers =
    await getFranchisePlayerCareers();

  const topCareers = FRANCHISES.flatMap(
    (franchise) =>
      careers
        .filter(
          (career) =>
            career.rosterId === franchise.rosterId
        )
        .slice(0, 15)
  );

  const playerNames = await getPlayerNames(
    [...new Set(
      topCareers.map((career) => career.playerId)
    )]
  );

  return (
    <main style={{ padding: "24px 12px 110px" }}>
      <h1>Franchise Loyalty Preview</h1>

      <p
        style={{
          color: "#9da7b3",
          fontSize: 13,
          lineHeight: 1.6,
          marginTop: 10,
        }}
      >
        Experimental franchise service rankings.
        Includes bench players. Loyalty points
        are provisional and do not yet include
        performance or achievements.
      </p>

      {FRANCHISES.map((franchise) => {
        const leaders = careers
          .filter(
            (career) =>
              career.rosterId === franchise.rosterId
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
                      "Seasons",
                      "Starts",
                      "Loyalty",
                    ].map((heading) => (
                      <th
                        key={heading}
                        style={{
                          padding: "12px 8px",
                          textAlign: "left",
                          borderBottom:
                            "1px solid #27303b",
                          color: "#9da7b3",
                        }}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {leaders.map((career, index) => (
                    <tr
                      key={career.playerId}
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
                        {playerNames[career.playerId] ??
                          career.playerId}
                      </td>

                      <td style={{ padding: "11px 8px" }}>
                        {career.rosterWeeks}
                      </td>

                      <td style={{ padding: "11px 8px" }}>
                        {career.seasonsRepresented}
                      </td>

                      <td style={{ padding: "11px 8px" }}>
                        {career.starts}
                      </td>

                      <td
                        style={{
                          padding: "11px 8px",
                          fontWeight: 800,
                        }}
                      >
                        {career.loyaltyPoints.toLocaleString()}
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
