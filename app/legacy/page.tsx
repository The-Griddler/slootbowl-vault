
import { getPlayerRecords } from "../../lib/playerRecords";

import {
  getPlayers,
  getPlayerName,
} from "../../lib/players";

import {
  getHistoricalData,
  getNFLState,
} from "../../lib/sleeper";

import {
  isSeasonAwardsRevealed,
} from "../../lib/awardVisibility";

import { calculateAllSloot } from "../../lib/allSloot";

import { calculateAllSlootCareers } from "../../lib/allSlootCareer";

import {
  calculateHistoricalSeasonGrades,
  calculateGradeCareers,
} from "../../lib/seasonGrades";

import { calculateLegacyScores } from "../../lib/legacyScore";

import { getSlootbowlResults } from "../../lib/slootbowlResults";

// Reuse the existing leaderboard component.
import LegacyLeaderboard from "../hall-of-fame/LegacyLeaderboard";

export default async function LeagueLegacyPage() {
  const [records, players, historicalData, nflState] =
    await Promise.all([
      getPlayerRecords(),
      getPlayers(),
      getHistoricalData(),
      getNFLState(),
    ]);

  const currentYear = new Date().getUTCFullYear();

  // Only seasons that have passed the Week 17
  // reveal threshold qualify for annual honours.
  const completedSeasons = historicalData.filter(
    (season) =>
      isSeasonAwardsRevealed(
        season.league.season,
        nflState
      )
  );

  // Existing calculation helpers require a
  // numeric upper boundary for eligible seasons.
  const completedThroughSeason =
    completedSeasons.length > 0
      ? Math.max(
          ...completedSeasons.map((season) =>
            Number(season.league.season)
          )
        )
      : 0;

  // Build the Sleeper player directory.
  const directory = Object.fromEntries(
    Object.entries(players).map(([id, player]) => [
      id,
      {
        name: getPlayerName(player),
        position: player.position,
        rookieYear:
          typeof player.years_exp === "number" &&
          Number.isFinite(player.years_exp) &&
          player.years_exp >= 0
            ? currentYear - player.years_exp
            : null,
      },
    ])
  );

  // Calculate All-Sloot honours using only
  // seasons whose annual awards are revealed.
  const allSlootSeasons = completedSeasons.map(
    (season) => calculateAllSloot(season, directory)
  );

  const honours = calculateAllSlootCareers(
    allSlootSeasons
  );

  // Calculate historical seasonal grades.
  const seasonGrades =
    calculateHistoricalSeasonGrades(
      completedSeasons,
      directory,
      completedThroughSeason
    );

  const gradeCareers = calculateGradeCareers(
    seasonGrades
  );

  // Identify verified Slootbowl championship
  // winners and runners-up.
  const championshipResults =
    await getSlootbowlResults(
      completedSeasons,
      completedThroughSeason
    );

  // Calculate cumulative SFL Legacy Points,
  // including historical Conference Player
  // of the Week awards worth 25 points each.
  const legacyScores = calculateLegacyScores(
    gradeCareers,
    honours,
    records,
    directory,
    completedThroughSeason,
    championshipResults,
    completedSeasons
  );

  return (
    <main
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "24px 16px 110px",
      }}
    >
      <a
        href="/"
        style={{
          display: "inline-block",
          marginBottom: "18px",
          color: "#9da7b3",
          fontSize: "13px",
          textDecoration: "none",
        }}
      >
        ← Back to Home
      </a>

      <h1
        style={{
          fontSize: "28px",
          fontWeight: 800,
          marginBottom: "8px",
        }}
      >
        League Legacy Tracker
      </h1>

      <p
        style={{
          color: "#9da7b3",
          fontSize: "13px",
          lineHeight: 1.6,
          marginBottom: "24px",
        }}
      >
        Tracking the greatest players in Sluts
        Football League history through seasonal
        dominance, All-Sloot honours, career
        milestones, playoff achievements and
        Conference Player of the Week awards.
      </p>

      <div
        style={{
          marginBottom: "18px",
          padding: "12px 14px",
          border: "1px solid #263244",
          borderRadius: "10px",
          background: "#202833",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            fontWeight: 700,
            marginBottom: "4px",
          }}
        >
          SFL ALL-TIME LEGACY RANKINGS
        </div>

        <div
          style={{
            color: "#9da7b3",
            fontSize: "12px",
            lineHeight: 1.6,
          }}
        >
          Legacy Points accumulate throughout a
          player's SFL career. Rankings reflect
          seasonal grades, All-Sloot selections,
          career milestones, postseason success
          and weekly conference honours.
        </div>
      </div>

      <LegacyLeaderboard scores={legacyScores} />

      <p
        style={{
          color: "#9da7b3",
          fontSize: "12px",
          lineHeight: 1.6,
          marginTop: "24px",
        }}
      >
        Includes completed SFL seasons through{" "}
        {completedThroughSeason || "none yet"}.
        Only official regular-season and
        main-playoff performances count.
        Toilet Bowl and consolation games
        are excluded.
      </p>
    </main>
  );
}
