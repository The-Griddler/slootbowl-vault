"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type PlayerDirectoryRecord = {
  playerId: string;
  name: string;
  position: string;
  points: number;
  starts: number;
  seasons: number;
};

export default function PlayerDirectory({
  players,
}: {
  players: PlayerDirectoryRecord[];
}) {
  const [search, setSearch] =
    useState("");

  const [position, setPosition] =
    useState("ALL");

  const filteredPlayers =
    useMemo(() => {
      const searchTerm =
        search
          .trim()
          .toLowerCase();

      return players
        .filter((player) => {
          const matchesSearch =
            !searchTerm ||
            player.name
              .toLowerCase()
              .includes(searchTerm);

          const matchesPosition =
            position === "ALL" ||
            player.position ===
              position;

          return (
            matchesSearch &&
            matchesPosition
          );
        })
        .sort(
          (a, b) =>
            b.points - a.points
        );
    }, [
      players,
      search,
      position,
    ]);

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
        DYNASTY SLUTS
      </p>

      <h1>
        Players
      </h1>

      <p
        style={{
          marginTop: "8px",
          marginBottom: "24px",
        }}
      >
        Every player to have been
        started in Slootbowl.
      </p>

      <input
        type="search"
        placeholder="Search players..."
        value={search}
        onChange={(event) =>
          setSearch(
            event.target.value
          )
        }
        style={searchStyle}
      />

      <div
        style={{
          display: "flex",
          gap: "8px",
          overflowX:
            "auto",
          paddingBottom: "4px",
          marginBottom: "20px",
        }}
      >
        {[
          "ALL",
          "QB",
          "RB",
          "WR",
          "TE",
        ].map(
          (item) => {
            const active =
              position ===
              item;

            return (
              <button
                key={item}
                type="button"
                onClick={() =>
                  setPosition(
                    item
                  )
                }
                style={{
                  border:
                    "1px solid #27303b",
                  borderRadius:
                    "999px",
                  padding:
                    "9px 15px",
                  background:
                    active
                      ? "#f5f7fa"
                      : "#151b23",
                  color:
                    active
                      ? "#0b0f14"
                      : "#9da7b3",
                  fontWeight:
                    "700",
                  fontSize:
                    "12px",
                  flexShrink: 0,
                }}
              >
                {item}
              </button>
            );
          }
        )}
      </div>

      <p
        style={{
          fontSize: "12px",
          color: "#687384",
          marginBottom: "10px",
        }}
      >
        {filteredPlayers.length}{" "}
        players
      </p>

      {filteredPlayers.map(
        (player) => (
          <Link
            key={
              player.playerId
            }
            href={`/player/${player.playerId}`}
            style={{
              textDecoration:
                "none",
              color:
                "inherit",
            }}
          >
            <article
              style={
                playerCardStyle
              }
            >
              <div
                style={{
                  minWidth: 0,
                  flex: 1,
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize:
                      "17px",
                  }}
                >
                  {player.name}
                </h2>

                <p
                  style={{
                    marginTop:
                      "5px",
                    fontSize:
                      "12px",
                  }}
                >
                  {player.position}
                  {" · "}
                  {player.starts}{" "}
                  starts
                  {" · "}
                  {player.seasons}{" "}
                  seasons
                </p>
              </div>

              <div
                style={{
                  textAlign:
                    "right",
                  flexShrink: 0,
                }}
              >
                <strong
                  style={{
                    fontSize:
                      "17px",
                  }}
                >
                  {player.points.toFixed(
                    2
                  )}
                </strong>

                <p
                  style={{
                    marginTop:
                      "2px",
                    fontSize:
                      "10px",
                    color:
                      "#687384",
                  }}
                >
                  pts
                </p>
              </div>

              <span
                style={{
                  color:
                    "#687384",
                  fontSize:
                    "18px",
                }}
              >
                ›
              </span>
            </article>
          </Link>
        )
      )}

      {filteredPlayers.length ===
        0 && (
        <article
          style={emptyStyle}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "18px",
            }}
          >
            No players found
          </h2>

          <p
            style={{
              marginTop:
                "6px",
              fontSize: "13px",
            }}
          >
            Try a different name
            or position.
          </p>
        </article>
      )}
    </main>
  );
}

const searchStyle = {
  width: "100%",
  padding: "14px 16px",
  marginBottom: "12px",
  background: "#151b23",
  border: "1px solid #27303b",
  borderRadius: "14px",
  color: "#f5f7fa",
  fontSize: "16px",
  outline: "none",
};

const playerCardStyle = {
  background: "#151b23",
  border: "1px solid #27303b",
  borderRadius: "16px",
  padding: "15px 14px",
  marginBottom: "8px",
  display: "flex",
  alignItems: "center",
  gap: "12px",
};

const emptyStyle = {
  background: "#151b23",
  border: "1px solid #27303b",
  borderRadius: "16px",
  padding: "20px",
  textAlign: "center" as const,
};