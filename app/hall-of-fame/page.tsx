
import { getPlayerRecords } from "../../lib/playerRecords";
import { getPlayers, getPlayerName } from "../../lib/players";
import { getHistoricalData } from "../../lib/sleeper";
import { calculateAllSloot } from "../../lib/allSloot";
import { calculateAllSlootCareers } from "../../lib/allSlootCareer";
import { calculateHallOfFameScores } from "../../lib/hallOfFame";
import HallOfFameLeaderboard from "./HallOfFameLeaderboard";

export default async function HallOfFamePage() {
  const [records, players, historicalData] =
    await Promise.all([
      getPlayerRecords(),
      getPlayers(),
      getHistoricalData(),
    ]);

  const currentYear = new Date().getUTCFullYear();

  const directory = Object.fromEntries(
    Object.entries(players).map(([id, player]) => [
      id,
      {
        name: getPlayerName(player),
        position: player.position,
        rookieYear:
          typeof player.years_exp === "number"
            ? currentYear - player.years_exp
            : null,
      },
    ])
  );

  const completedSeasons = historicalData.filter(
    (season) => Number(season.league.season) < currentYear
  );

  const allSlootSeasons = completedSeasons.map(
    (season) => calculateAllSloot(season, directory)
  );

  const honours = calculateAllSlootCareers(
    allSlootSeasons
  );

  const scores = calculateHallOfFameScores(
    records,
    directory,
    honours,
    currentYear - 1
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
        history, ranked by their SFL achievements.
        These are provisional candidate rankings,
        not official Hall of Fame inductions.
      </p>

      <HallOfFameLeaderboard scores={scores} />

      <p
        style={{
          color: "#9da7b3",
          fontSize: "12px",
          lineHeight: 1.6,
          marginTop: "24px",
        }}
      >
        Rankings include completed seasons through{" "}
        {currentYear - 1}. Championship bonuses,
        retirement eligibility and automatic
        induction are not yet applied.
      </p>
    </main>
  );
}
