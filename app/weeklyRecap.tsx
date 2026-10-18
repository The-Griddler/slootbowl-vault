
"use client";

import { useState } from "react";
import Link from "next/link";

import type {
  WeeklyRecapData,
  WeeklyRecapGame,
  WeeklyPlayerAward,
} from "../lib/weeklyRecap";

type PlayerInfo = {
  name: string;
  position: string;
};

type Props = {
  data: WeeklyRecapData;
  playerInfo: Record<string, PlayerInfo>;
};

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

const NAMES: Record<number, string> = {
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

const SHORT_NAMES: Record<number, string> = {
  1: "Mt Isa",
  2: "Cambridge",
  3: "Grimsby",
  4: "Isle of Wight",
  5: "Grays Town",
  6: "Lincoln",
  7: "Kalamata",
  8: "Weybiza",
  9: "East Rutherford",
  10: "Chad",
};

const GOLD = "#eab308";
const MUTED = "#94a3b8";
const CARD = "#151b23";
const BORDER = "1px solid #27303b";

function Logo({
  rosterId,
  size = 35,
}: {
  rosterId: number;
  size?: number;
}) {
  return (
    <img
      src={LOGOS[rosterId]}
      alt={NAMES[rosterId] ?? "Franchise"}
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        flexShrink: 0,
      }}
    />
  );
}

function score(value: number) {
  return value.toFixed(2);
}

function FeaturedGame({
  game,
}: {
  game: WeeklyRecapGame;
}) {
  const { ranking } = game;

  const margin = ranking.margin;

  const description =
    ranking.isUpset
      ? "An underdog victory steals the spotlight."
      : margin <= 3
        ? "A nail-biting finish earns top billing."
        : margin <= 10
          ? "A hard-fought contest takes Game of the Week."
          : "The week's standout matchup.";

  return (
    <div
      style={{
        background: "#1b2736",
        border: "1px solid #7a6124",
        borderRadius: 15,
        padding: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
          marginBottom: 16,
        }}
      >
        <span
          style={{
            color: GOLD,
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: 0.7,
          }}
        >
          ★ GAME OF THE WEEK
        </span>

        <span
          style={{
            color: MUTED,
            fontSize: 10,
          }}
        >
          WEEK {ranking.week}
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(0, 1fr) 35px minmax(0, 1fr)",
          alignItems: "center",
          gap: 7,
        }}
      >
        {[
          {
            id: ranking.rosterA,
            points: ranking.scoreA,
          },
          {
            id: ranking.rosterB,
            points: ranking.scoreB,
          },
        ].map((team, index) => (
          <div
            key={team.id}
            style={{
              gridColumn:
                index === 0 ? 1 : 3,
              gridRow: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              minWidth: 0,
            }}
          >
            <Link
              href={`/teams/${team.id}`}
              style={{
                textDecoration: "none",
              }}
            >
              <Logo
                rosterId={team.id}
                size={58}
              />
            </Link>

            <span
              style={{
                color: "#ffffff",
                fontSize: 12,
                fontWeight: 800,
                textAlign: "center",
                minHeight: 30,
                lineHeight: 1.3,
              }}
            >
              {SHORT_NAMES[team.id]}
            </span>

            <span
              style={{
                color:
                  ranking.winnerId === team.id
                    ? "#ffffff"
                    : MUTED,
                fontSize: "clamp(19px, 5vw, 26px)",
                fontWeight: 900,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {score(team.points)}
            </span>
          </div>
        ))}

        <div
          style={{
            gridColumn: 2,
            gridRow: 1,
            textAlign: "center",
            color: "#64748b",
            fontSize: 12,
            fontWeight: 900,
          }}
        >
          VS
        </div>
      </div>

      <div
        style={{
          background: "#26374b",
          borderRadius: 9,
          padding: "9px 12px",
          marginTop: 17,
          textAlign: "center",
          color: "#cbd5e1",
          fontSize: 11,
          lineHeight: 1.6,
        }}
      >
        {description}
      </div>
    </div>
  );
}

function CompactGame({
  game,
}: {
  game: WeeklyRecapGame;
}) {
  const { ranking } = game;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "minmax(0, 1fr) auto",
        gap: 10,
        background: CARD,
        border: BORDER,
        borderRadius: 11,
        padding: "11px 13px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 7,
          minWidth: 0,
        }}
      >
        {[
          ranking.rosterA,
          ranking.rosterB,
        ].map((rosterId) => (
          <div
            key={rosterId}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Logo
              rosterId={rosterId}
              size={22}
            />

            <span
              style={{
                fontSize: 12,
                fontWeight:
                  ranking.winnerId === rosterId
                    ? 800
                    : 500,
                color:
                  ranking.winnerId === rosterId
                    ? "#ffffff"
                    : MUTED,
              }}
            >
              {SHORT_NAMES[rosterId]}
            </span>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-around",
          textAlign: "right",
          fontSize: 13,
          fontWeight: 800,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        <span>
          {score(ranking.scoreA)}
        </span>

        <span>
          {score(ranking.scoreB)}
        </span>
      </div>
    </div>
  );
}

function PlayerAward({
  award,
  conference,
  playerInfo,
}: {
  award: WeeklyPlayerAward | null;
  conference: "OBFC" | "GPFC";
  playerInfo: Record<string, PlayerInfo>;
}) {
  const player = award
    ? playerInfo[award.playerId]
    : null;

  const name =
    player?.name ??
    (award
      ? `Player ${award.playerId}`
      : "Not yet awarded");

  const headshot = award
    ? `https://sleepercdn.com/content/nfl/players/${award.playerId}.jpg`
    : null;

  return (
    <div
      style={{
        background: CARD,
        border: BORDER,
        borderRadius: 12,
        padding: 12,
        minWidth: 0,
        textAlign: "center",

        // Both cards share identical row heights.
        display: "grid",
        gridTemplateRows:
          "44px 78px 46px 22px 42px 32px",
        justifyItems: "center",
        alignContent: "start",
      }}
    >
      {/* Fixed-height conference heading */}
      <div
        style={{
          color:
            conference === "OBFC"
              ? "#62c4de"
              : "#f0786b",
          fontSize: 10,
          fontWeight: 900,
          letterSpacing: 0.6,
          lineHeight: 1.35,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          textAlign: "center",
          overflowWrap: "break-word",
        }}
      >
        {conference} PLAYER OF THE WEEK
      </div>

      {/* Player photo */}
      <div
        style={{
          width: 68,
          height: 68,
          borderRadius: "50%",
          background: "#263445",
          overflow: "hidden",
        }}
      >
        {headshot ? (
          <img
            src={headshot}
            alt={name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <div
            style={{
              height: "100%",
              display: "grid",
              placeItems: "center",
              color: MUTED,
              fontSize: 28,
            }}
          >
            ★
          </div>
        )}
      </div>

      {/* Fixed-height player name */}
      <div
        style={{
          color: "#ffffff",
          fontSize: 13,
          fontWeight: 900,
          lineHeight: 1.3,
          width: "100%",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          overflowWrap: "break-word",
        }}
      >
        {name}
      </div>

      {/* Position */}
      <div
        style={{
          color: MUTED,
          fontSize: 11,
        }}
      >
        {player?.position ?? "—"}
      </div>

      {/* Franchise */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          width: "100%",
          minWidth: 0,
        }}
      >
        {award && (
          <>
            <Logo
              rosterId={award.rosterId}
              size={25}
            />

            <span
              style={{
                color: MUTED,
                fontSize: 10,
                lineHeight: 1.3,
                overflowWrap: "break-word",
              }}
            >
              {SHORT_NAMES[award.rosterId]}
            </span>
          </>
        )}
      </div>

      {/* Fantasy points */}
      <div
        style={{
          color: GOLD,
          fontSize: 17,
          fontWeight: 900,
          whiteSpace: "nowrap",
        }}
      >
        {award ? (
          <>
            {score(award.points)}
            <span
              style={{
                fontSize: 10,
                color: MUTED,
                marginLeft: 4,
              }}
            >
              PTS
            </span>
          </>
        ) : (
          "—"
        )}
      </div>
    </div>
  );
}

export default function WeeklyRecapSection({
  data,
  playerInfo,
}: Props) {
  const [selectedWeek, setSelectedWeek] =
    useState<number | null>(
      data.latestWeek
    );

  const recap = data.recaps.find(
    (item) => item.week === selectedWeek
  );

  const currentIndex =
    data.availableWeeks.indexOf(
      selectedWeek ?? -1
    );

  const previousWeek =
    currentIndex > 0
      ? data.availableWeeks[currentIndex - 1]
      : null;

  const nextWeek =
    currentIndex >= 0 &&
    currentIndex <
      data.availableWeeks.length - 1
      ? data.availableWeeks[currentIndex + 1]
      : null;

  return (
    <section style={{ marginTop: 28 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 10,
          marginBottom: 16,
        }}
      >
        <div>
          <p
            style={{
              color: GOLD,
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: 1.2,
              margin: "0 0 7px",
            }}
          >
            2026 SFL SEASON
          </p>

          <h2
            style={{
              fontSize: 23,
              margin: 0,
            }}
          >
            Weekly Recap
          </h2>

          <p
            style={{
              color: MUTED,
              fontSize: 12,
              margin: "8px 0 0",
            }}
          >
            The best of every gameweek.
          </p>
        </div>

        {data.availableWeeks.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              disabled={previousWeek === null}
              onClick={() => {
                if (previousWeek !== null) {
                  setSelectedWeek(previousWeek);
                }
              }}
              style={{
                background: "#263445",
                border: BORDER,
                borderRadius: 8,
                color: "#ffffff",
                padding: "7px 9px",
                opacity:
                  previousWeek === null ? 0.4 : 1,
                cursor: "pointer",
              }}
            >
              ‹
            </button>

            <select
              aria-label="Select recap week"
              value={selectedWeek ?? ""}
              onChange={(event) =>
                setSelectedWeek(
                  Number(event.target.value)
                )
              }
              style={{
                background: "#263445",
                border: BORDER,
                borderRadius: 8,
                color: "#ffffff",
                padding: "8px 5px",
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              {data.availableWeeks.map(
                (week) => (
                  <option
                    key={week}
                    value={week}
                  >
                    Wk {week}
                  </option>
                )
              )}
            </select>

            <button
              type="button"
              disabled={nextWeek === null}
              onClick={() => {
                if (nextWeek !== null) {
                  setSelectedWeek(nextWeek);
                }
              }}
              style={{
                background: "#263445",
                border: BORDER,
                borderRadius: 8,
                color: "#ffffff",
                padding: "7px 9px",
                opacity:
                  nextWeek === null ? 0.4 : 1,
                cursor: "pointer",
              }}
            >
              ›
            </button>
          </div>
        )}
      </div>

      {!recap ? (
        <div
          style={{
            background: CARD,
            border: BORDER,
            borderRadius: 14,
            padding: 22,
            color: MUTED,
            fontSize: 13,
            lineHeight: 1.7,
          }}
        >
          Weekly recaps will appear once
          all five matchups in a 2026
          regular-season week have finished.
        </div>
      ) : (
        <>
          <FeaturedGame
            game={recap.gameOfTheWeek}
          />

          <div style={{ marginTop: 19 }}>
            <p
              style={{
                color: GOLD,
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: 0.7,
                marginBottom: 11,
              }}
            >
              AROUND THE LEAGUE
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, minmax(0, 1fr))",
                gap: 8,
              }}
            >
              {recap.otherGames.map(
                (game) => (
                  <CompactGame
                    key={`${game.ranking.rosterA}-${game.ranking.rosterB}`}
                    game={game}
                  />
                )
              )}
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <p
              style={{
                color: GOLD,
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: 0.7,
                marginBottom: 11,
              }}
            >
              CONFERENCE PLAYERS OF THE WEEK
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, minmax(0, 1fr))",
                gap: 9,
              }}
            >
              <PlayerAward
                award={
                  recap.obfcPlayerOfTheWeek
                }
                conference="OBFC"
                playerInfo={playerInfo}
              />

              <PlayerAward
                award={
                  recap.gpfcPlayerOfTheWeek
                }
                conference="GPFC"
                playerInfo={playerInfo}
              />
            </div>
          </div>
        </>
      )}
    </section>
  );
}
