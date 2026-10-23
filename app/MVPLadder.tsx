
"use client";

import Link from "next/link";

import type {
  MVPLeaderboard,
  MVPCandidate,
} from "../lib/mvp";

type PlayerInfo = {
  name: string;
  position: string;
};

type Props = {
  leaderboard: MVPLeaderboard;
  playerInfo: Record<string, PlayerInfo>;
};

const GOLD = "#eab308";
const MUTED = "#94a3b8";
const CARD = "#151b23";
const BORDER = "1px solid #27303b";

const LOGOS: Record<number, string> = {
  1: "/logos/mt-isa-ballbags.PNG",
  2: "/logos/cambridge-cum-sluts.PNG",
  3: "/logos/grimsby-chode-chokers.PNG",
  4: "/logos/isle-of-wight-happy-endings.PNG",
  5: "/logos/grays-town-fingerblasters.PNG",
  6: "/logos/lincoln-nonces.PNG",
  7: "/logos/kalamata-dirty-vegans.PNG",
  8: "/logos/weybiza-babs.PNG",
  9: "/logos/east-rutherford-shitlickers.PNG",
  10: "/logos/chad-moist-discharge.PNG",
};

const SHORT_NAMES: Record<number, string> = {
  1: "Mt Isa Ballbags",
  2: "Cambridge Cum Sluts",
  3: "Grimsby Chode Chokers",
  4: "Isle of Wight Happy Endings",
  5: "Grays Town Fingerblasters",
  6: "Lincoln Nonces",
  7: "Kalamata Dirty Vegans",
  8: "Weybiza BAB's",
  9: "East Rutherford Shitlickers",
  10: "Chad Moist Discharge",
};

function TeamLogo({
  rosterId,
  size = 30,
}: {
  rosterId: number | null;
  size?: number;
}) {
  if (rosterId === null || !LOGOS[rosterId]) {
    return null;
  }

  return (
    <img
      src={LOGOS[rosterId]}
      alt=""
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        flexShrink: 0,
      }}
    />
  );
}

function PlayerPortrait({
  playerId,
  name,
  size,
}: {
  playerId: string;
  name: string;
  size: number;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: "50%",
        background: "#273445",
        overflow: "hidden",
      }}
    >
      <img
        src={`https://sleepercdn.com/content/nfl/players/${playerId}.jpg`}
        alt={name}
        width={size}
        height={size}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
    </div>
  );
}

function Movement({
  candidate,
}: {
  candidate: MVPCandidate;
}) {
  if (candidate.previousRank === null) {
    return (
      <span
        style={{
          color: MUTED,
          fontSize: 10,
          fontWeight: 800,
        }}
      >
        NEW
      </span>
    );
  }

  const change = candidate.rankChange ?? 0;

  if (change > 0) {
    return (
      <span
        style={{
          color: "#86efac",
          fontSize: 11,
          fontWeight: 900,
        }}
      >
        ▲ {change}
      </span>
    );
  }

  if (change < 0) {
    return (
      <span
        style={{
          color: "#f87171",
          fontSize: 11,
          fontWeight: 900,
        }}
      >
        ▼ {Math.abs(change)}
      </span>
    );
  }

  return (
    <span
      style={{
        color: MUTED,
        fontSize: 11,
        fontWeight: 900,
      }}
    >
      —
    </span>
  );
}

function FranchiseLine({
  candidate,
}: {
  candidate: MVPCandidate;
}) {
  const rosterId = candidate.mvpRosterId;

  if (rosterId === null) {
    return (
      <span
        style={{
          color: MUTED,
          fontSize: 11,
        }}
      >
        Franchise unconfirmed
      </span>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 7,
        minWidth: 0,
      }}
    >
      <TeamLogo rosterId={rosterId} size={25} />

      <span
        style={{
          color: MUTED,
          fontSize: 11,
          lineHeight: 1.4,
        }}
      >
        {SHORT_NAMES[rosterId]}
      </span>
    </div>
  );
}

function Frontrunner({
  candidate,
  playerInfo,
}: {
  candidate: MVPCandidate;
  playerInfo: Record<string, PlayerInfo>;
}) {
  const player = playerInfo[candidate.playerId];

  const name =
    player?.name ?? `Player ${candidate.playerId}`;

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        background:
          "linear-gradient(135deg, #302718 0%, #1b2533 55%, #151b23 100%)",
        border: "1px solid #866b29",
        borderRadius: 17,
        padding: 19,
      }}
    >
      <div
        style={{
          color: GOLD,
          fontSize: 11,
          fontWeight: 900,
          letterSpacing: 1.1,
          marginBottom: 17,
        }}
      >
        ★ MVP FRONTRUNNER
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 17,
        }}
      >
        <PlayerPortrait
          playerId={candidate.playerId}
          name={name}
          size={106}
        />

        <div
          style={{
            flex: 1,
            minWidth: 0,
          }}
        >
          <div
            style={{
              color: GOLD,
              fontSize: 32,
              fontWeight: 900,
              lineHeight: 1,
              marginBottom: 7,
            }}
          >
            #1
          </div>

          <div
            style={{
              color: "#ffffff",
              fontSize: 21,
              fontWeight: 900,
              lineHeight: 1.2,
            }}
          >
            {name}
          </div>

          <div
            style={{
              color: MUTED,
              fontSize: 12,
              marginTop: 6,
            }}
          >
            {player?.position ?? "—"}
          </div>

          <div style={{ marginTop: 10 }}>
            <Movement candidate={candidate} />
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 17,
          paddingTop: 14,
          borderTop: "1px solid #4c432f",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
        }}
      >
        <FranchiseLine candidate={candidate} />
      </div>
    </div>
  );
}

function Challenger({
  candidate,
  playerInfo,
}: {
  candidate: MVPCandidate;
  playerInfo: Record<string, PlayerInfo>;
}) {
  const player = playerInfo[candidate.playerId];

  const name =
    player?.name ?? `Player ${candidate.playerId}`;

  return (
    <div
      style={{
        background: CARD,
        border: BORDER,
        borderRadius: 14,
        padding: 13,
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <span
          style={{
            color: GOLD,
            fontSize: 21,
            fontWeight: 900,
          }}
        >
          #{candidate.rank}
        </span>

        <Movement candidate={candidate} />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: 11,
        }}
      >
        <PlayerPortrait
          playerId={candidate.playerId}
          name={name}
          size={79}
        />
      </div>

      <div
        style={{
          color: "#ffffff",
          fontSize: 13,
          fontWeight: 900,
          textAlign: "center",
          lineHeight: 1.35,
          minHeight: 36,
        }}
      >
        {name}
      </div>

      <div
        style={{
          color: MUTED,
          fontSize: 11,
          textAlign: "center",
          marginTop: 5,
        }}
      >
        {player?.position ?? "—"}
      </div>

      <div
        style={{
          borderTop: BORDER,
          marginTop: 12,
          paddingTop: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
      >
        <TeamLogo
          rosterId={candidate.mvpRosterId}
          size={24}
        />

        <span
          style={{
            color: MUTED,
            fontSize: 10,
            lineHeight: 1.3,
          }}
        >
          {candidate.mvpRosterId !== null
            ? SHORT_NAMES[candidate.mvpRosterId]
            : "Unconfirmed"}
        </span>
      </div>
    </div>
  );
}

function ChasingPlayer({
  candidate,
  playerInfo,
}: {
  candidate: MVPCandidate;
  playerInfo: Record<string, PlayerInfo>;
}) {
  const player = playerInfo[candidate.playerId];

  const name =
    player?.name ?? `Player ${candidate.playerId}`;

  const rosterId = candidate.mvpRosterId;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "28px 43px minmax(0, 1fr) auto",
        gap: 10,
        alignItems: "center",
        background: CARD,
        border: BORDER,
        borderRadius: 11,
        padding: "10px 11px",
      }}
    >
      <span
        style={{
          color: GOLD,
          fontSize: 15,
          fontWeight: 900,
        }}
      >
        {candidate.rank}
      </span>

      <PlayerPortrait
        playerId={candidate.playerId}
        name={name}
        size={43}
      />

      <div style={{ minWidth: 0 }}>
        <div
          style={{
            color: "#ffffff",
            fontSize: 12,
            fontWeight: 800,
            lineHeight: 1.4,
          }}
        >
          {name}
        </div>

        <div
          style={{
            color: MUTED,
            fontSize: 10,
            marginTop: 3,
          }}
        >
          {player?.position ?? "—"}
        </div>

        {/* Franchise name and logo for ranks 4–10 */}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            marginTop: 6,
            minWidth: 0,
          }}
        >
          <TeamLogo
            rosterId={rosterId}
            size={17}
          />

          <span
            style={{
              color: MUTED,
              fontSize: 10,
              lineHeight: 1.35,
              overflowWrap: "anywhere",
            }}
          >
            {rosterId !== null
              ? SHORT_NAMES[rosterId] ?? "Unknown franchise"
              : "Franchise unconfirmed"}
          </span>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 7,
        }}
      >
        <Movement candidate={candidate} />
      </div>
    </div>
  );
}

export default function MVPLadder({
  leaderboard,
  playerInfo,
}: Props) {
  const candidates = leaderboard.topTen;

  const leader = candidates[0] ?? null;

  const challengers = candidates.slice(1, 3);

  const chasing = candidates.slice(3, 10);

  return (
    <section style={{ marginTop: 36 }}>
      <div style={{ marginBottom: 16 }}>
        <p
          style={{
            color: GOLD,
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: 1.2,
            margin: "0 0 7px",
          }}
        >
          2026 SFL AWARDS
        </p>

        <h2
          style={{
            fontSize: 23,
            margin: 0,
          }}
        >
          🏆 MVP Ladder
        </h2>

        <p
          style={{
            color: MUTED,
            fontSize: 12,
            lineHeight: 1.7,
            margin: "9px 0 0",
          }}
        >
          The race for the SFL&apos;s
          most valuable player.
          Rankings through Week{" "}
          {leaderboard.throughWeek}.
        </p>
      </div>

      {!leader ? (
        <div
          style={{
            background: CARD,
            border: BORDER,
            borderRadius: 14,
            padding: 20,
            color: MUTED,
            fontSize: 12,
            lineHeight: 1.7,
          }}
        >
          MVP rankings will appear
          once the 2026 season has
          completed its first week.
        </div>
      ) : (
        <>
          <Frontrunner
            candidate={leader}
            playerInfo={playerInfo}
          />

          {challengers.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, minmax(0, 1fr))",
                gap: 10,
                marginTop: 11,
              }}
            >
              {challengers.map((candidate) => (
                <Challenger
                  key={candidate.playerId}
                  candidate={candidate}
                  playerInfo={playerInfo}
                />
              ))}
            </div>
          )}

          {chasing.length > 0 && (
            <div style={{ marginTop: 21 }}>
              <p
                style={{
                  color: GOLD,
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: 0.8,
                  margin: "0 0 11px",
                }}
              >
                THE CHASING PACK
              </p>

              <div
                style={{
                  display: "grid",
                  gap: 7,
                }}
              >
                {chasing.map((candidate) => (
                  <ChasingPlayer
                    key={candidate.playerId}
                    candidate={candidate}
                    playerInfo={playerInfo}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {leaderboard.cutoffLocked && (
        <p
          style={{
            color: MUTED,
            fontSize: 10,
            lineHeight: 1.7,
            marginTop: 13,
          }}
        >
          Week 9 MVP franchise cutoff
          has passed. Player eligibility
          follows the Week 9 franchise,
          subject to roster verification.
        </p>
      )}
    </section>
  );
}
