
"use client";

import { useState } from "react";
import type { HistoricalMatchup } from "../../../lib/sleeper";

type Phase = "Regular Season" | "Main Playoffs";

type Game = {
  year: string;
  week: number;
  phase: Phase;
  opponent: number;
  scored: number;
  conceded: number;
};

type Season = {
  year: string;
  wins: number;
  losses: number;
  ties: number;
  games: number;
  pointsFor: number;
  completed: boolean;
};

type TeamRecordsProps = {
  rosterId: number;
  matchups: HistoricalMatchup[];
  seasons: Season[];
  franchiseNames: Record<number, string>;
};

function points(value: number) {
  return value.toFixed(2);
}

function RecordCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div
      style={{
        background: "#151b23",
        border: "1px solid #27303b",
        borderRadius: "14px",
        padding: "16px",
      }}
    >
      <div
        style={{
          color: "#9da7b3",
          fontSize: "12px",
          fontWeight: "700",
          marginBottom: "10px",
        }}
      >
        {label}
      </div>

      <div
        style={{
          color: "#ffffff",
          fontSize: "24px",
          fontWeight: "800",
        }}
      >
        {value}
      </div>

      <div
        style={{
          color: "#9da7b3",
          fontSize: "12px",
          marginTop: "8px",
          lineHeight: "1.5",
        }}
      >
        {detail}
      </div>
    </div>
  );
}

export default function TeamRecords({
  rosterId,
  matchups,
  seasons,
  franchiseNames,
}: TeamRecordsProps) {
  const [phase, setPhase] =
    useState<Phase>("Regular Season");

  const games: Game[] = matchups
    .filter(
      (matchup) =>
        matchup.phase === phase &&
        (matchup.rosterA === rosterId ||
          matchup.rosterB === rosterId) &&
        Number.isFinite(matchup.scoreA) &&
        Number.isFinite(matchup.scoreB) &&
        (matchup.scoreA !== 0 || matchup.scoreB !== 0)
    )
    .map((matchup) => {
      const isA = matchup.rosterA === rosterId;

      return {
        year: matchup.season,
        week: matchup.week,
        phase,
        opponent: isA
          ? matchup.rosterB
          : matchup.rosterA,
        scored: isA
          ? matchup.scoreA
          : matchup.scoreB,
        conceded: isA
          ? matchup.scoreB
          : matchup.scoreA,
      };
    });

  const highestScore = [...games].sort(
    (a, b) => b.scored - a.scored
  )[0];

  const lowestScore = [...games].sort(
    (a, b) => a.scored - b.scored
  )[0];

  const victories = games.filter(
    (game) => game.scored > game.conceded
  );

  const biggestVictory = [...victories].sort(
    (a, b) =>
      b.scored -
      b.conceded -
      (a.scored - a.conceded)
  )[0];

  const closestVictory = [...victories].sort(
    (a, b) =>
      a.scored -
      a.conceded -
      (b.scored - b.conceded)
  )[0];

  function gameDetail(game?: Game) {
    if (!game) return "No qualifying games";

    const opponent =
      franchiseNames[game.opponent] ??
      `Roster ${game.opponent}`;

    return `${game.year} · Week ${game.week}
vs ${opponent} · ${points(game.scored)}–${points(game.conceded)}`;
  }

  const completedSeasons = seasons.filter(
    (season) => season.completed
  );

  const mostWins = [...completedSeasons].sort(
    (a, b) => b.wins - a.wins
  )[0];

  const bestWinPercentage = [...completedSeasons]
    .filter((season) => season.games > 0)
    .sort(
      (a, b) =>
        (b.wins + b.ties / 2) / b.games -
        (a.wins + a.ties / 2) / a.games
    )[0];

  const mostPoints = [...completedSeasons].sort(
    (a, b) => b.pointsFor - a.pointsFor
  )[0];

  return (
    <section style={{ marginTop: "24px" }}>
      <h2 style={{ fontSize: "21px" }}>
        Team Records
      </h2>

      <p
        style={{
          color: "#9da7b3",
          fontSize: "12px",
          marginTop: "8px",
          lineHeight: "1.6",
        }}
      >
        Franchise records across every SFL season.
        Toilet Bowl and consolation games are excluded.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "8px",
          marginTop: "20px",
        }}
      >
        {(["Regular Season", "Main Playoffs"] as Phase[]).map(
          (option) => (
            <button
              key={option}
              type="button"
              onClick={() => setPhase(option)}
              style={{
                padding: "12px 6px",
                background:
                  phase === option
                    ? "#303b48"
                    : "#151b23",
                color:
                  phase === option
                    ? "#ffffff"
                    : "#9da7b3",
                border: "1px solid #27303b",
                borderRadius: "10px",
                fontSize: "12px",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              {option === "Main Playoffs"
                ? "Playoffs"
                : option}
            </button>
          )
        )}
      </div>

      <h3
        style={{
          fontSize: "17px",
          marginTop: "26px",
          marginBottom: "14px",
        }}
      >
        Game Records
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "10px",
        }}
      >
        <RecordCard
          label="Highest Game Score"
          value={
            highestScore
              ? points(highestScore.scored)
              : "—"
          }
          detail={gameDetail(highestScore)}
        />

        <RecordCard
          label="Lowest Game Score"
          value={
            lowestScore
              ? points(lowestScore.scored)
              : "—"
          }
          detail={gameDetail(lowestScore)}
        />

        <RecordCard
          label="Biggest Victory"
          value={
            biggestVictory
              ? `+${points(
                  biggestVictory.scored -
                    biggestVictory.conceded
                )}`
              : "—"
          }
          detail={gameDetail(biggestVictory)}
        />

        <RecordCard
          label="Closest Victory"
          value={
            closestVictory
              ? `+${points(
                  closestVictory.scored -
                    closestVictory.conceded
                )}`
              : "—"
          }
          detail={gameDetail(closestVictory)}
        />
      </div>

      <h3
        style={{
          fontSize: "17px",
          marginTop: "32px",
          marginBottom: "14px",
        }}
      >
        Regular Season Records
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "10px",
        }}
      >
        <RecordCard
          label="Most Season Wins"
          value={
            mostWins
              ? String(mostWins.wins)
              : "—"
          }
          detail={
            mostWins
              ? `${mostWins.year} · ${mostWins.wins}-${mostWins.losses}-${mostWins.ties}`
              : "No completed seasons"
          }
        />

        <RecordCard
          label="Best Win Percentage"
          value={
            bestWinPercentage
              ? `${(
                  ((bestWinPercentage.wins +
                    bestWinPercentage.ties / 2) /
                    bestWinPercentage.games) *
                  100
                ).toFixed(1)}%`
              : "—"
          }
          detail={
            bestWinPercentage
              ? `${bestWinPercentage.year} · ${bestWinPercentage.wins}-${bestWinPercentage.losses}-${bestWinPercentage.ties}`
              : "No completed seasons"
          }
        />

        <RecordCard
          label="Most Season Points"
          value={
            mostPoints
              ? points(mostPoints.pointsFor)
              : "—"
          }
          detail={
            mostPoints
              ? `${mostPoints.year} · Regular Season`
              : "No completed seasons"
          }
        />
      </div>
    </section>
  );
}
