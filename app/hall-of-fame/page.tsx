
import { getPlayerRecords } from "../../lib/playerRecords";

import {
  getPlayers,
  getPlayerName,
} from "../../lib/players";

import { getHistoricalData } from "../../lib/sleeper";

import { calculateAllSloot } from "../../lib/allSloot";

import { calculateAllSlootCareers } from "../../lib/allSlootCareer";

import {
  calculateHistoricalSeasonGrades,
  calculateGradeCareers,
} from "../../lib/seasonGrades";

import { calculateLegacyScores } from "../../lib/legacyScore";

import { getSlootbowlResults } from "../../lib/slootbowlResults";

import LegacyLeaderboard from "./LegacyLeaderboard";

export default async function HallOfFamePage() {
  const [records, players, historicalData] =
    await Promise.all([
      getPlayerRecords(),
      getPlayers(),
      getHistoricalData(),
    ]);

  const currentYear = new Date().getUTCFullYear();

  const completedThroughSeason = currentYear - 1;

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

  // Only completed SFL seasons are eligible.
  const completedSeasons = historicalData.filter(
    (season) =>
      Number(season.league.season) <=
      completedThroughSeason
  );

  // Calculate All-Sloot honours.
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

  // Calculate cumulative SFL Legacy Points.
  const legacyScores = calculateLegacyScores(
    gradeCareers,
    honours,
    records,
    directory,
    completedThroughSeason,
    championshipResults
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
        SFL Hall of Fame
      </h1>

      <p
        style={{
          color: "#9da7b3",
          fontSize: "13px",
          lineHeight: 1.6,
          marginBottom: "24px",
        }}
      >
        The greatest players in Sluts Football League
        history, ranked by cumulative Legacy Points
        earned through seasonal greatness, All-Sloot
        honours, career milestones and playoff
        achievements.
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
          SFL LEGACY RANKINGS
        </div>

        <div
          style={{
            color: "#9da7b3",
            fontSize: "12px",
            lineHeight: 1.6,
          }}
        >
          Legacy Points accumulate throughout a
          player's SFL career. Rankings are
          provisional while we calibrate career
          milestones and Hall of Fame induction
          requirements.
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
        {completedThroughSeason}. Only official
        regular-season and main-playoff performances
        count. Toilet Bowl and consolation games
        are excluded. Hall of Fame inductions
        have not yet been activated.
      </p>
    </main>
  );
}
