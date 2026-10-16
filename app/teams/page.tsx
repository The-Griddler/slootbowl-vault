
import Link from "next/link";
import { FRANCHISES } from "../../lib/franchises";

const conferences = [
  {
    abbreviation: "OBFC",
    name: "Osmington Bay Football Conference",
    rosterIds: [4, 6, 8, 7, 9],
    colours: ["#299DB9", "#F0D044"],
  },
  {
    abbreviation: "GPFC",
    name: "Gloucester-Plymouth Football Conference",
    rosterIds: [1, 2, 10, 3, 5],
    colours: ["#C83E2F", "#25834B"],
  },
];

const teamIdentity: Record<
  number,
  {
    manager: string;
    primary: string;
    secondary: string;
    logo: string;
  }
> = {
  1: {
    manager: "Ed Nelms",
    primary: "#651326",
    secondary: "#D4A04A",
    logo: "/logos/mt-isa-ballbags.PNG",
  },
  2: {
    manager: "Ben Smith",
    primary: "#C8102E",
    secondary: "#09244A",
    logo: "/logos/cambridge-cum-sluts.PNG",
  },
  3: {
    manager: "Jake Greenwood",
    primary: "#9062B5",
    secondary: "#2C194D",
    logo: "/logos/grimsby-chode-chokers.PNG",
  },
  4: {
    manager: "George Pendleton",
    primary: "#E7B34D",
    secondary: "#A85D28",
    logo: "/logos/isle-of-wight-happy-endings.PNG",
  },
  5: {
    manager: "Ryan Whiting",
    primary: "#092B58",
    secondary: "#F47721",
    logo: "/logos/grays-town-fingerblasters.PNG",
  },
  6: {
    manager: "Garrett Etheridge",
    primary: "#581525",
    secondary: "#E8E6E1",
    logo: "/logos/lincoln-nonces.PNG",
  },
  7: {
    manager: "Ollie Payne",
    primary: "#D97920",
    secondary: "#557B29",
    logo: "/logos/kalamata-dirty-vegans.PNG",
  },
  8: {
    manager: "Jack Brannigan",
    primary: "#2788D2",
    secondary: "#E88924",
    logo: "/logos/weybiza-babs.PNG",
  },
  9: {
    manager: "Tarl Brayer",
    primary: "#955322",
    secondary: "#103C58",
    logo: "/logos/east-rutherford-shitlickers.PNG",
  },
  10: {
    manager: "Josh Thomas",
    primary: "#171717",
    secondary: "#C7192D",
    logo: "/logos/chad-moist-discharge.PNG",
  },
};

export default function TeamsPage() {
  return (
    <main>
      <p
        style={{
          fontSize: "12px",
          fontWeight: 700,
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
          lineHeight: 1.6,
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
              display: "flex",
              gap: "12px",
              marginBottom: "18px",
              alignItems: "stretch",
            }}
          >
            <div
              style={{
                width: "5px",
                flexShrink: 0,
                borderRadius: "4px",
                background:
                  conference.abbreviation === "OBFC"
                    ? "repeating-linear-gradient(180deg, #299DB9 0px, #299DB9 12px, #F0D044 12px, #F0D044 24px)"
                    : "linear-gradient(180deg, #C83E2F 0%, #C83E2F 50%, #25834B 50%, #25834B 100%)",
              }}
            />

            <div>
              <h2
                style={{
                  fontSize: "24px",
                  margin: "0 0 4px",
                }}
              >
                {conference.abbreviation}
              </h2>

              <p
                style={{
                  fontSize: "12px",
                  margin: 0,
                  color: "#9da7b3",
                }}
              >
                {conference.name}
              </p>
            </div>
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

              const identity = teamIdentity[rosterId];

              if (!franchise || !identity) return null;

              return (
                <Link
                  key={rosterId}
                  href={`/teams/${rosterId}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "15px 14px",
                    background: "#151b23",
                    border: "1px solid #27303b",
                    borderLeft: `3px solid ${identity.primary}`,
                    borderRadius: "14px",
                    textDecoration: "none",
                    color: "#ffffff",
                    minHeight: "100px",
                  }}
                >
                  <div
                    style={{
                      width: "70px",
                      height: "70px",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <img
                      src={identity.logo}
                      alt={`${franchise.name} logo`}
                      style={{
                        display: "block",
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                      }}
                    />
                  </div>

                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        fontSize: "15px",
                        fontWeight: 700,
                        lineHeight: 1.35,
                        marginBottom: "6px",
                      }}
                    >
                      {franchise.name}
                    </div>

                    <div
                      style={{
                        fontSize: "12px",
                        color: "#9da7b3",
                        lineHeight: 1.5,
                      }}
                    >
                      {identity.manager}
                    </div>

                    <div
                      style={{
                        fontSize: "10px",
                        color: "#687384",
                        marginTop: "5px",
                      }}
                    >
                      EST. 2022 · {conference.abbreviation}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: "3px",
                        marginRight: "4px",
                      }}
                    >
                      <span
                        style={{
                          width: "5px",
                          height: "18px",
                          borderRadius: "3px",
                          background: identity.primary,
                        }}
                      />
                      <span
                        style={{
                          width: "5px",
                          height: "18px",
                          borderRadius: "3px",
                          background: identity.secondary,
                        }}
                      />
                    </div>

                    <span
                      style={{
                        color:
                          identity.primary === "#171717" ||
                          identity.primary === "#651326" ||
                          identity.primary === "#092B58" ||
                          identity.primary === "#581525"
                            ? identity.secondary
                            : identity.primary,
                        fontSize: "24px",
                      }}
                    >
                      ›
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </main>
  );
}
