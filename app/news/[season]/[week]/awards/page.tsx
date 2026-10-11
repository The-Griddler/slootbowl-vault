
import Link from "next/link";
import type { CSSProperties } from "react";
import {
  getHistoricalData,
  type HistoricalMatchup,
} from "../../../../../lib/sleeper";

type PageProps = {
  params: Promise<{
    season: string;
    week: string;
  }>;
};

type Conference = "OBFC" | "GPFC";

type SleeperPlayer = {
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  team?: string | null;
  position?: string | null;
};

type PlayerDirectory = Record<string, SleeperPlayer>;

type Performance = {
  playerId: string;
  name: string;
  nflTeam: string;
  position: string;
  points: number;
  franchiseId: number;
  franchise: string;
  manager: string;
  conference: Conference;
  teamScore: number;
  opponentScore: number;
  opponent: string;
  won: boolean;
  tied: boolean;
};

const TEAMS: Record<number, string> = {
  1: "Mt Isa Ballbags",
  2: "Cambridge Cum Sluts",
  3: "Grimsby Chode Chokers",
  4: "Isle of Wight Happy Endings",
  5: "Grays Town Fingerblasters",
  6: "Lincoln Nonces",
  7: "Kalamata Dirty Vegans",
  8: "Weybiza BAB’s",
  9: "East Rutherford Shitlickers",
  10: "Chad Moist Discharge",
};

const MANAGERS: Record<number, string> = {
  1: "Ed Nelms",
  2: "Ben Smith",
  3: "Jake Greenwood",
  4: "George Pendleton",
  5: "Ryan Whiting",
  6: "Garrett Etheridge",
  7: "Ollie Payne",
  8: "Jack Brannigan",
  9: "Tarl Brayer",
  10: "Josh Thomas",
};

const CONFERENCES: Record<number, Conference> = {
  1: "GPFC",
  2: "GPFC",
  3: "GPFC",
  4: "OBFC",
  5: "GPFC",
  6: "OBFC",
  7: "OBFC",
  8: "OBFC",
  9: "OBFC",
  10: "GPFC",
};

const MUTED = "#929eae";

const PANEL: CSSProperties = {
  background: "#151b23",
  border: "1px solid #27303b",
  borderRadius: 17,
  padding: 19,
};

function teamName(id: number, season: string) {
  if (id === 1 && Number(season) < 2026) {
    return "Perth Ballbags";
  }

  return TEAMS[id] ?? `Franchise ${id}`;
}

function formatPoints(value: number) {
  return value.toFixed(2);
}

function complete(game: HistoricalMatchup) {
  return (
    game.phase === "Regular Season" &&
    game.isComplete === true &&
    game.week >= 1 &&
    game.week <= 14 &&
    Number.isFinite(game.scoreA) &&
    Number.isFinite(game.scoreB) &&
    game.scoreA >= 0 &&
    game.scoreB >= 0 &&
    (game.scoreA > 0 || game.scoreB > 0)
  );
}

function weekGames(
  games: HistoricalMatchup[],
  week: number
) {
  const fixtures = games.filter(
    (game) =>
      game.week === week &&
      complete(game)
  );

  const teams = new Set<number>();

  for (const game of fixtures) {
    teams.add(game.rosterA);
    teams.add(game.rosterB);
  }

  if (
    fixtures.length !== 5 ||
    teams.size !== 10 ||
    [...teams].some((id) => id < 1 || id > 10)
  ) {
    return [];
  }

  return fixtures;
}

async function getPlayerDirectory(): Promise<PlayerDirectory> {
  try {
    const response = await fetch(
      "https://api.sleeper.app/v1/players/nfl",
      {
        next: {
          revalidate: 86400,
        },
      }
    );

    if (!response.ok) {
      return {};
    }

    return (await response.json()) as PlayerDirectory;
  } catch {
    return {};
  }
}

function playerName(
  playerId: string,
  directory: PlayerDirectory
) {
  const player = directory[playerId];

  if (!player) {
    return `Player ${playerId}`;
  }

  const name =
    player.full_name?.trim() ||
    [
      player.first_name,
      player.last_name,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

  return name || `Player ${playerId}`;
}

function extractPerformances(
  fixtures: HistoricalMatchup[],
  season: string,
  directory: PlayerDirectory
): Performance[] {
  const performances: Performance[] = [];

  for (const game of fixtures) {
    const sides = [
      {
        id: game.rosterA,
        opponentId: game.rosterB,
        score: game.scoreA,
        opponentScore: game.scoreB,
        starters: game.startersA,
        starterPoints: game.startersPointsA,
      },
      {
        id: game.rosterB,
        opponentId: game.rosterA,
        score: game.scoreB,
        opponentScore: game.scoreA,
        starters: game.startersB,
        starterPoints: game.startersPointsB,
      },
    ];

    for (const side of sides) {
      const conference = CONFERENCES[side.id];

      if (!conference) continue;

      const starters = Array.isArray(side.starters)
        ? side.starters
        : [];

      const starterPoints = Array.isArray(
        side.starterPoints
      )
        ? side.starterPoints
        : [];

      for (let index = 0; index < starters.length; index++) {
        const rawId = starters[index];

        if (
          rawId === null ||
          rawId === undefined ||
          rawId === "" ||
          rawId === "0"
        ) {
          continue;
        }

        const id = String(rawId);
        const points = Number(starterPoints[index]);

        // A missing score must never be treated
        // as a genuine zero-point performance.
        if (
          starterPoints[index] === null ||
          starterPoints[index] === undefined ||
          !Number.isFinite(points)
        ) {
          continue;
        }

        const player = directory[id];

        performances.push({
          playerId: id,
          name: playerName(id, directory),
          nflTeam: player?.team || "—",
          position: player?.position || "—",
          points,
          franchiseId: side.id,
          franchise: teamName(side.id, season),
          manager: MANAGERS[side.id] ?? "Unknown",
          conference,
          teamScore: side.score,
          opponentScore: side.opponentScore,
          opponent: teamName(
            side.opponentId,
            season
          ),
          won: side.score > side.opponentScore,
          tied: side.score === side.opponentScore,
        });
      }
    }
  }

  return performances.sort(
    (a, b) =>
      b.points - a.points ||
      a.name.localeCompare(b.name) ||
      a.franchiseId - b.franchiseId
  );
}

function seededPick(
  choices: string[],
  season: string,
  week: number,
  id: string
) {
  let seed = Number(season) * 13 + week * 29;

  for (const char of id) {
    seed += char.charCodeAt(0);
  }

  return choices[
    Math.abs(seed) % choices.length
  ];
}

function awardHeadline(
  performance: Performance,
  season: string,
  week: number
) {
  if (performance.franchiseId === 1) {
    return seededPick(
      [
        "BALLBAGS PRODUCE ANOTHER NATIONAL TREASURE",
        "COMMISSIONER'S GENIUS FINALLY RECOGNISED",
        "THE PEOPLE'S CHAMPION HAS ARRIVED",
      ],
      season,
      week,
      performance.playerId
    );
  }

  if (performance.franchiseId === 5) {
    return seededPick(
      [
        "WHITING ACCIDENTALLY SELECTS GOOD FOOTBALLER",
        "PLAYER OVERCOMES MANAGER TO CLAIM HONOURS",
        "FINGERBLASTERS STAR REQUESTS NEW MANAGEMENT",
      ],
      season,
      week,
      performance.playerId
    );
  }

  if (performance.franchiseId === 6) {
    return seededPick(
      [
        "LINCOLN STAR PEAKS BEFORE DECEMBER",
        "GARRETT DISCOVERS REGULAR-SEASON FOOTBALL",
        "NONCES PLAYER DEMANDS POSTSEASON GUARANTEES",
      ],
      season,
      week,
      performance.playerId
    );
  }

  if (!performance.won) {
    return seededPick(
      [
        "HEROIC PERFORMANCE WASTED BY INCOMPETENCE",
        "ONE MAN ARMY DEFEATED BY OWN FRANCHISE",
        "INDIVIDUAL BRILLIANCE, COLLECTIVE DISGRACE",
      ],
      season,
      week,
      performance.playerId
    );
  }

  return seededPick(
    [
      "THE WEEK'S MOST DANGEROUS EMPLOYEE",
      "ONE MAN TERRORISES THE CONFERENCE",
      "FANTASY FOOTBALL'S LATEST PUBLIC MENACE",
      "THE PERFORMANCE THAT BROKE THE SCOREBOARD",
      "LOCAL MAN REFUSES TO STOP SCORING POINTS",
    ],
    season,
    week,
    performance.playerId
  );
}

function awardCitation(
  player: Performance,
  season: string,
  week: number
) {
  const result = player.won
    ? `helping ${player.franchise} beat ${player.opponent} ${formatPoints(player.teamScore)}–${formatPoints(player.opponentScore)}`
    : player.tied
      ? `during a ${formatPoints(player.teamScore)}–${formatPoints(player.opponentScore)} draw against ${player.opponent}`
      : `despite ${player.franchise} losing ${formatPoints(player.teamScore)}–${formatPoints(player.opponentScore)} to ${player.opponent}`;

  const opening =
    `${player.name} produced ${formatPoints(player.points)} fantasy points for ${player.franchise}, ${result}.`;

  const general = seededPick(
    [
      "The awards committee described the performance as outstanding before immediately launching an investigation into whether the manager actually knew what he was doing.",
      "Several members of the opposition have reportedly requested counselling. The newsroom considers this an entirely reasonable response to being publicly humiliated by a fantasy football lineup.",
      "The performance has been formally entered into the Sloot News archives, where it will remain until somebody produces a bigger number or the commissioner demands a recount.",
      "The editorial board unanimously approved the award after a heated debate involving three calculators, a broken chair and accusations of gross professional misconduct.",
    ],
    season,
    week,
    player.playerId
  );

  let personal = "";

  switch (player.franchiseId) {
    case 1:
      personal =
        "Ed Nelms has accepted full credit for the achievement and confirmed that any suggestion the player deserves most of the praise is both hurtful and legally questionable.";
      break;

    case 5:
      personal =
        "Ryan Whiting has been congratulated for successfully locating the correct button on the Sleeper app. The player, meanwhile, is believed to be considering a transfer to a more professionally run organisation.";
      break;

    case 6:
      personal =
        "Garrett Etheridge will be delighted. Unfortunately, the Sloot News legal department has asked us to clarify that this award does not count as a playoff victory.";
      break;

    case 10:
      personal =
        "Josh Thomas has previously demonstrated that the league's regular season is merely an optional warm-up for his annual attempt to ruin everybody else's Christmas.";
      break;

    case 4:
      personal =
        "George Pendleton is expected to discuss this achievement at considerable length with anyone unfortunate enough to make eye contact.";
      break;

    case 9:
      personal =
        "Tarl Brayer will be hoping that such excellence can eventually be reproduced in a decisive postseason fixture without the intervention of a cruel and vindictive universe.";
      break;

    case 8:
      personal =
        "Jack Brannigan has reportedly offered three future draft picks in exchange for the right to keep this performance permanently.";
      break;

    case 2:
      personal =
        "Ben Smith will be hoping the display marks the beginning of another championship era rather than another excuse to reminisce about 2022.";
      break;

    case 3:
      personal =
        "Jake Greenwood has been advised that individual weekly awards, while lovely, are not currently accepted as substitutes for a Slootbowl trophy.";
      break;

    default:
      personal =
        "Ollie Payne has welcomed the award as evidence that the Dirty Vegans remain a footballing institution rather than an elaborate social experiment.";
  }

  if (!player.won && !player.tied) {
    return `${opening} ${general} ${personal} Most impressively, all this excellence still wasn't enough to save the franchise from defeat.`;
  }

  return `${opening} ${general} ${personal}`;
}

function SectionHeading({
  eyebrow,
  children,
}: {
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 18 }}>
      <p
        style={{
          color: MUTED,
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: 2,
          textTransform: "uppercase",
          margin: "0 0 7px",
        }}
      >
        {eyebrow}
      </p>

      <h2
        style={{
          fontSize: 25,
          lineHeight: 1.2,
          margin: 0,
        }}
      >
        {children}
      </h2>
    </div>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        background: "#222b36",
        borderRadius: 10,
        padding: "11px 12px",
      }}
    >
      <p
        style={{
          color: MUTED,
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: 1,
          margin: "0 0 5px",
        }}
      >
        {label}
      </p>

      <p
        style={{
          fontSize: 14,
          fontWeight: 800,
          margin: 0,
        }}
      >
        {value}
      </p>
    </div>
  );
}

function WinnerCard({
  player,
  season,
  week,
}: {
  player: Performance;
  season: string;
  week: number;
}) {
  return (
    <article
      style={{
        ...PANEL,
        borderTop: "4px solid #f4f5f7",
        marginBottom: 22,
      }}
    >
      <p
        style={{
          color: MUTED,
          fontSize: 11,
          fontWeight: 900,
          letterSpacing: 2,
          margin: "0 0 14px",
        }}
      >
        {player.conference} PLAYER OF THE WEEK
      </p>

      <h3
        style={{
          fontSize: "clamp(23px, 6vw, 32px)",
          lineHeight: 1.12,
          margin: "0 0 9px",
        }}
      >
        {player.name}
      </h3>

      <p
        style={{
          color: MUTED,
          fontSize: 13,
          margin: "0 0 19px",
        }}
      >
        {player.position} · {player.nflTeam}
      </p>

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 10,
          flexWrap: "wrap",
          marginBottom: 19,
        }}
      >
        <span
          style={{
            fontSize: "clamp(42px, 12vw, 60px)",
            fontWeight: 900,
            letterSpacing: -2,
            lineHeight: 1,
          }}
        >
          {formatPoints(player.points)}
        </span>

        <span
          style={{
            color: MUTED,
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          FANTASY POINTS
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(2, minmax(0, 1fr))",
          gap: 9,
          marginBottom: 23,
        }}
      >
        <Stat
          label="SFL FRANCHISE"
          value={player.franchise}
        />

        <Stat
          label="MANAGER"
          value={player.manager}
        />

        <Stat
          label="MATCH RESULT"
          value={
            player.tied
              ? "Draw"
              : player.won
                ? "Victory"
                : "Defeat"
          }
        />

        <Stat
          label="OPPONENT"
          value={player.opponent}
        />
      </div>

      <div
        style={{
          borderTop: "1px solid #364150",
          paddingTop: 20,
        }}
      >
        <p
          style={{
            color: MUTED,
            fontSize: 10,
            fontWeight: 900,
            letterSpacing: 1.5,
            margin: "0 0 9px",
          }}
        >
          OFFICIAL AWARD CITATION
        </p>

        <h4
          style={{
            fontSize: 19,
            lineHeight: 1.25,
            margin: "0 0 14px",
          }}
        >
          {awardHeadline(player, season, week)}
        </h4>

        <p
          style={{
            color: "#d2d8e0",
            fontSize: 14,
            lineHeight: 1.85,
            margin: 0,
          }}
        >
          {awardCitation(player, season, week)}
        </p>
      </div>
    </article>
  );
}

function HonourableMentions({
  conference,
  players,
}: {
  conference: Conference;
  players: Performance[];
}) {
  return (
    <section
      style={{
        ...PANEL,
        marginBottom: 29,
      }}
    >
      <SectionHeading eyebrow={`${conference} Awards`}>
        Honourable Mentions
      </SectionHeading>

      <p
        style={{
          color: MUTED,
          fontSize: 13,
          lineHeight: 1.75,
          margin: "0 0 17px",
        }}
      >
        Other starters who put up the kind
        of numbers that normally demand
        their own press conference.
      </p>

      {players.length === 0 ? (
        <p style={{ color: MUTED }}>
          No eligible runners-up recorded.
        </p>
      ) : (
        players.map((player, index) => (
          <div
            key={`${player.franchiseId}-${player.playerId}`}
            style={{
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
              borderTop: "1px solid #27303b",
              padding: "15px 0",
            }}
          >
            <span
              style={{
                color: MUTED,
                fontSize: 13,
                fontWeight: 900,
                minWidth: 18,
              }}
            >
              {index + 2}.
            </span>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  margin: "0 0 5px",
                }}
              >
                {player.name}
              </p>

              <p
                style={{
                  color: MUTED,
                  fontSize: 12,
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                {player.position} · {player.nflTeam}
                {" · "}
                {player.franchise}
              </p>
            </div>

            <span
              style={{
                fontSize: 17,
                fontWeight: 900,
                whiteSpace: "nowrap",
              }}
            >
              {formatPoints(player.points)}
            </span>
          </div>
        ))
      )}
    </section>
  );
}

export default async function AwardsPage({
  params,
}: PageProps) {
  const { season, week } = await params;
  const weekNumber = Number(week);

  const history = await getHistoricalData();

  const selected = history.find(
    (item) => item.league.season === season
  );

  const valid =
    Number.isInteger(weekNumber) &&
    weekNumber >= 1 &&
    weekNumber <= 14;

  const fixtures =
    valid && selected
      ? weekGames(selected.matchups, weekNumber)
      : [];

  const ready = fixtures.length === 5;

  const directory = ready
    ? await getPlayerDirectory()
    : {};

  const performances = ready
    ? extractPerformances(
        fixtures,
        season,
        directory
      )
    : [];

  const obfc = performances.filter(
    (player) => player.conference === "OBFC"
  );

  const gpfc = performances.filter(
    (player) => player.conference === "GPFC"
  );

  const obfcWinner = obfc[0];
  const gpfcWinner = gpfc[0];

  const wasted = performances
    .filter(
      (player) =>
        !player.won &&
        !player.tied &&
        player.points > 0
    )
    .slice(0, 3);

  const highest = performances[0];

  const directoryLoaded =
    Object.keys(directory).length > 0;

  return (
    <main
      style={{
        color: "#f4f5f7",
        paddingBottom: 40,
      }}
    >
      <header
        style={{
          textAlign: "center",
          borderBottom: "2px solid #f4f5f7",
          paddingBottom: 20,
          marginBottom: 28,
        }}
      >
        <Link
          href={`/news/${season}/${week}`}
          style={{
            color: MUTED,
            fontSize: 12,
            textDecoration: "none",
            fontWeight: 700,
          }}
        >
          ← Back to the Weekly Edition
        </Link>

        <h1
          style={{
            fontSize: "clamp(36px, 10vw, 56px)",
            letterSpacing: -2,
            fontWeight: 900,
            lineHeight: 1,
            margin: "24px 0 8px",
          }}
        >
          SLOOT NEWS
        </h1>

        <p
          style={{
            fontWeight: 700,
            fontSize: 14,
            margin: "0 0 18px",
          }}
        >
          Your Home of Sloot Sport
        </p>

        <div
          style={{
            borderTop: "1px solid #27303b",
            paddingTop: 12,
            display: "flex",
            justifyContent: "space-between",
            gap: 10,
            color: MUTED,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 1,
          }}
        >
          <span>{season} SEASON</span>
          <span>
            WEEK {valid ? weekNumber : "—"}
          </span>
        </div>
      </header>

      <section
        style={{
          ...PANEL,
          borderTop: "4px solid #f4f5f7",
          marginBottom: 29,
        }}
      >
        <p
          style={{
            color: MUTED,
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: 2,
            margin: "0 0 13px",
          }}
        >
          THE CONFERENCE HONOURS
        </p>

        <h2
          style={{
            fontSize: "clamp(27px, 7vw, 39px)",
            lineHeight: 1.12,
            letterSpacing: -0.8,
            margin: "0 0 17px",
          }}
        >
          Two Conferences.
          Two Heroes.
          Ten Questionable Managers.
        </h2>

        <p
          style={{
            color: "#d2d8e0",
            fontSize: 15,
            lineHeight: 1.85,
            margin: "0 0 14px",
          }}
        >
          Welcome to the Week {weekNumber}
          {" "}
          Sloot News Conference Awards,
          where we recognise the finest
          individual performances in the
          OBFC and GPFC.
        </p>

        <p
          style={{
            color: "#d2d8e0",
            fontSize: 15,
            lineHeight: 1.85,
            margin: 0,
          }}
        >
          Eligibility is simple: the player
          must have actually started for
          an SFL franchise. Bench points,
          moral victories and whatever
          Ryan Whiting claims he intended
          to do are not considered.
        </p>
      </section>

      {!ready ? (
        <section style={PANEL}>
          <SectionHeading eyebrow="Awards Committee">
            Ceremony Postponed
          </SectionHeading>

          <p
            style={{
              color: MUTED,
              lineHeight: 1.8,
              margin: 0,
            }}
          >
            These awards will be published
            once all five regular-season
            fixtures for this week have
            officially finished.
            The committee refuses to
            crown a winner halfway through
            the competition, despite
            repeated lobbying from the
            Ballbags.
          </p>
        </section>
      ) : performances.length === 0 ? (
        <section style={PANEL}>
          <SectionHeading eyebrow="Data Desk">
            Nobody Has Turned Up
          </SectionHeading>

          <p
            style={{
              color: MUTED,
              lineHeight: 1.8,
              margin: 0,
            }}
          >
            The match results are complete,
            but no usable starter-level
            player scores were returned
            for this edition. The newsroom
            will not fabricate award winners.
          </p>
        </section>
      ) : (
        <>
          {!directoryLoaded && (
            <section
              style={{
                ...PANEL,
                marginBottom: 24,
              }}
            >
              <p
                style={{
                  color: MUTED,
                  fontSize: 13,
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                Sleeper's NFL player directory
                is temporarily unavailable.
                Player IDs are shown instead
                of names; actual fantasy
                points remain unchanged.
              </p>
            </section>
          )}

          {highest && (
            <section
              style={{
                ...PANEL,
                marginBottom: 29,
              }}
            >
              <SectionHeading eyebrow="Across the SFL">
                Performance of the Week
              </SectionHeading>

              <p
                style={{
                  fontSize: 19,
                  fontWeight: 900,
                  margin: "0 0 8px",
                }}
              >
                {highest.name}
              </p>

              <p
                style={{
                  color: "#d2d8e0",
                  fontSize: 14,
                  lineHeight: 1.8,
                  margin: 0,
                }}
              >
                With {formatPoints(highest.points)}
                {" "}
                fantasy points for
                {" "}
                {highest.franchise},
                {" "}
                {highest.name} topped the
                entire league's starting
                lineup performances.
                The {highest.conference}
                {" "}
                will naturally claim
                this proves its complete
                superiority over the
                other conference.
              </p>
            </section>
          )}

          {obfcWinner && (
            <WinnerCard
              player={obfcWinner}
              season={season}
              week={weekNumber}
            />
          )}

          <HonourableMentions
            conference="OBFC"
            players={obfc.slice(1, 4)}
          />

          {gpfcWinner && (
            <WinnerCard
              player={gpfcWinner}
              season={season}
              week={weekNumber}
            />
          )}

          <HonourableMentions
            conference="GPFC"
            players={gpfc.slice(1, 4)}
          />

          <section
            style={{
              ...PANEL,
              marginBottom: 29,
            }}
          >
            <SectionHeading eyebrow="The Tragedy Desk">
              Wasted in Defeat
            </SectionHeading>

            <p
              style={{
                color: "#d2d8e0",
                fontSize: 14,
                lineHeight: 1.85,
                margin: "0 0 19px",
              }}
            >
              Some players produce a
              performance worthy of
              champagne, applause and
              a commemorative statue.
              Their managers respond
              by losing anyway.
              Sloot News salutes these
              unfortunate bastards.
            </p>

            {wasted.length === 0 ? (
              <p
                style={{
                  color: MUTED,
                  fontSize: 13,
                  lineHeight: 1.75,
                  margin: 0,
                }}
              >
                No qualifying losing-side
                performances were found.
                An unusually disappointing
                week for the Tragedy Desk.
              </p>
            ) : (
              wasted.map((player, index) => (
                <div
                  key={`${player.franchiseId}-${player.playerId}`}
                  style={{
                    borderTop: "1px solid #27303b",
                    padding: "17px 0",
                  }}
                >
                  <p
                    style={{
                      color: MUTED,
                      fontSize: 10,
                      fontWeight: 900,
                      letterSpacing: 1.5,
                      margin: "0 0 8px",
                    }}
                  >
                    CASE FILE {index + 1}
                  </p>

                  <h3
                    style={{
                      fontSize: 18,
                      margin: "0 0 8px",
                    }}
                  >
                    {player.name}
                    {" · "}
                    {formatPoints(player.points)} pts
                  </h3>

                  <p
                    style={{
                      color: "#d2d8e0",
                      fontSize: 13,
                      lineHeight: 1.8,
                      margin: 0,
                    }}
                  >
                    {player.name} scored
                    {" "}
                    {formatPoints(player.points)}
                    {" "}
                    points for
                    {" "}
                    {player.franchise},
                    but {player.manager}
                    {" "}
                    still lost
                    {" "}
                    {formatPoints(player.teamScore)}
                    {"–"}
                    {formatPoints(player.opponentScore)}
                    {" "}
                    to {player.opponent}.
                    An individual masterpiece
                    buried beneath a
                    collective administrative
                    disaster.
                  </p>
                </div>
              ))
            )}
          </section>

          <section style={PANEL}>
            <SectionHeading eyebrow="Closing Statement">
              The Committee's Verdict
            </SectionHeading>

            <p
              style={{
                color: "#d2d8e0",
                fontSize: 14,
                lineHeight: 1.85,
                margin: 0,
              }}
            >
              Congratulations to this
              week's award winners.
              Your performances have
              been recognised by one
              of fantasy football's
              least reputable media
              organisations.
              Certificates will not
              be issued, trophies
              have not been ordered
              and the prize money
              has apparently been
              redirected to the
              commissioner's
              discretionary fund.
            </p>
          </section>
        </>
      )}

      <footer
        style={{
          textAlign: "center",
          borderTop: "1px solid #27303b",
          paddingTop: 24,
          marginTop: 32,
        }}
      >
        <p
          style={{
            fontWeight: 900,
            letterSpacing: 2,
            margin: 0,
          }}
        >
          SLOOT NEWS
        </p>

        <p
          style={{
            color: MUTED,
            fontSize: 12,
            marginTop: 8,
          }}
        >
          Your Home of Sloot Sport
        </p>

        <p
          style={{
            color: MUTED,
            fontSize: 11,
            marginTop: 12,
          }}
        >
          Recognising individual excellence.
          Blaming management for everything else.
        </p>
      </footer>
    </main>
  );
}
