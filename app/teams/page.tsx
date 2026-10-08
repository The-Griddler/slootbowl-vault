
import Link from "next/link";
import { FRANCHISES } from "../../lib/franchises";

const conferences = [
  {
    abbreviation: "OBFC",
    name: "Osmington Bay Football Conference",
    rosterIds: [4, 6, 8, 7, 9],
    colour: "#4285f4",
  },
  {
    abbreviation: "GPFC",
    name: "Gloucester-Plymouth Football Conference",
    rosterIds: [1, 2, 10, 3, 5],
    colour: "#e05252",
  },
];

export default function TeamsPage() {
  return (
    <main>
      <p
        style={{
          fontSize: "12px",
          fontWeight: "700",
          letterSpacing: "1.5px",
          color: "#687384",
          marginBottom: "8px",
        }}
      >
        SLUTS FOOTBALL LEAGUE
      </p>

      <h1>Franchises</h1>

      <p
        style={{
          marginTop: "8px",
          marginBottom: "32px",
          lineHeight: "1.6",
        }}
      >
        Ten franchises. Two conferences. One Slootbowl.
        Explore the teams that make up the SFL.
      </p>

      {conferences.map((conference) => (
        <section
          key={conference.abbreviation}
          style={{ marginBottom: "36px" }}
        >
          <div
            style={{
              borderLeft: `4px solid ${conference.colour}`,
              paddingLeft: "12px",
              marginBottom: "18px",
            }}
          >
            <h2
              style={{
                fontSize: "24px",
                margin: "0 0 4px",
              }}
            >
              {conference.abbreviation}
            </h2>

            <p style={{ fontSize: "12px" }}>
              {conference.name}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            {conference.rosterIds.map((rosterId) => {
              const franchise = FRANCHISES.find(
                (team) => team.rosterId === rosterId
              );

              if (!franchise) return null;

              return (
                <Link
                  key={rosterId}
                  href={`/teams/${rosterId}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "20px 18px",
                    background: "#151b23",
                    border: "1px solid #27303b",
                    borderRadius: "14px",
                    textDecoration: "none",
                    color: "#ffffff",
                    gap: "12px",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "15px",
                        fontWeight: "700",
                        marginBottom: "5px",
                      }}
                    >
                      {franchise.name}
                    </div>

                    <div
                      style={{
                        fontSize: "11px",
                        color: "#687384",
                      }}
                    >
                      Est. 2022 · {conference.abbreviation}
                    </div>
                  </div>

                  <span
                    style={{
                      color: conference.colour,
                      fontSize: "24px",
                      flexShrink: 0,
                    }}
                  >
                    ›
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </main>
  );
}
