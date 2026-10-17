
"use client";

import { useState } from "react";
import type { CSSProperties } from "react";

import type {
  AllTimeRecords,
  AllTimeFranchiseRecord,
  LeagueRecord,
  RecordSet,
  SeasonRecord,
  SeasonRecordSet,
  AllTimeRecordSet,
  RecordLeaderboardSet,
  SeasonLeaderboardSet,
  AllTimeLeaderboardSet,
  FranchiseAchievement,
  StreakRecord,
} from "../../lib/records";

import type {
  PlayerRecords,
  PlayerRecordGroup,
  PlayerGameRecord,
  PlayerSeasonRecord,
  PlayerCareerRecord,
  PlayerWeeklyPerformance,
  PlayerRecordIdentity,
} from "../../lib/playerRecords";

import {
  getFranchiseName,
  getHistoricalFranchiseName,
} from "../../lib/franchises";

type Scope = "franchises" | "players";
type Period = "games" | "season" | "career";
type Competition = "regularSeason" | "mainPlayoffs";

type RecordCategory<T> = {
  key: string;
  title: string;
  description: string;
  record: T | null;
  leaderboard: T[];
  metric: (record: T) => number;
  format: (record: T) => string;
  suffix?: string;
  detail?: (record: T) => string;
};

type PlayerEntry = {
  playerId: string;
  name: string;
  position: string;
  rosterId: number;
  season: string;
  week?: number;
  points: number;
  starts: number;
  average: number;
  over20: number;
  over30: number;
  over40: number;
  weeks: PlayerWeeklyPerformance[];
};

const POSITIONS = ["QB", "RB", "WR", "TE"];
const LIMIT = 10;

const points = (value: number) =>
  value.toFixed(2);

const differential = (value: number) =>
  value >= 0
    ? `+${value.toFixed(2)}`
    : value.toFixed(2);

const franchise = (id: number) =>
  getFranchiseName(id);

const historicalFranchise = (
  id: number,
  season: string | number
) => getHistoricalFranchiseName(id, season);

function matchupDetail(r: LeagueRecord) {
  return (
    `${historicalFranchise(r.rosterId, r.season)} ` +
    `${points(r.score)} vs ` +
    `${historicalFranchise(
      r.opponentRosterId,
      r.season
    )} ${points(r.opponentScore)}`
  );
}

function gameMeta(r: LeagueRecord) {
  return `${r.season} · Week ${r.week} · ${r.phase}`;
}

function seasonDetail(r: SeasonRecord) {
  return (
    `${r.season} · ${r.wins}W-${r.losses}L` +
    (r.ties ? `-${r.ties}T` : "")
  );
}

function careerDetail(r: AllTimeFranchiseRecord) {
  return (
    `${r.wins}W-${r.losses}L` +
    (r.ties ? `-${r.ties}T` : "")
  );
}

function gameCategories(
  records: RecordSet,
  leaders: RecordLeaderboardSet
): RecordCategory<LeagueRecord>[] {
  return [
    {
      key: "highestTeamScore",
      title: "Highest Team Score",
      description:
        "The greatest single-game team performances.",
      record: records.highestTeamScore,
      leaderboard: leaders.highestTeamScore,
      metric: r => r.score,
      format: r => points(r.score),
      suffix: "pts",
    },
    {
      key: "lowestTeamScore",
      title: "Lowest Team Score",
      description:
        "The most miserable single-game totals.",
      record: records.lowestTeamScore,
      leaderboard: leaders.lowestTeamScore,
      metric: r => r.score,
      format: r => points(r.score),
      suffix: "pts",
    },
    {
      key: "biggestWinningMargin",
      title: "Biggest Winning Margin",
      description:
        "The most comprehensive demolitions.",
      record: records.biggestWinningMargin,
      leaderboard: leaders.biggestWinningMargin,
      metric: r => r.margin,
      format: r => points(r.margin),
      suffix: "pts",
    },
    {
      key: "closestGame",
      title: "Closest Game",
      description:
        "Matches decided by the smallest margins.",
      record: records.closestGame,
      leaderboard: leaders.closestGame,
      metric: r => r.margin,
      format: r => points(r.margin),
      suffix: "pts",
    },
    {
      key: "highestCombinedScore",
      title: "Highest Combined Score",
      description:
        "The biggest shootouts in SFL history.",
      record: records.highestCombinedScore,
      leaderboard: leaders.highestCombinedScore,
      metric: r =>
        r.score + r.opponentScore,
      format: r =>
        points(r.score + r.opponentScore),
      suffix: "pts",
    },
    {
      key: "lowestCombinedScore",
      title: "Lowest Combined Score",
      description:
        "Two teams united in offensive incompetence.",
      record: records.lowestCombinedScore,
      leaderboard: leaders.lowestCombinedScore,
      metric: r =>
        r.score + r.opponentScore,
      format: r =>
        points(r.score + r.opponentScore),
      suffix: "pts",
    },
    {
      key: "highestLosingScore",
      title: "Highest Losing Score",
      description:
        "Outstanding performances rewarded with defeat.",
      record: records.highestLosingScore,
      leaderboard: leaders.highestLosingScore,
      metric: r => r.score,
      format: r => points(r.score),
      suffix: "pts",
    },
    {
      key: "lowestWinningScore",
      title: "Lowest Winning Score",
      description:
        "Proof that sometimes both teams deserve to lose.",
      record: records.lowestWinningScore,
      leaderboard: leaders.lowestWinningScore,
      metric: r => r.score,
      format: r => points(r.score),
      suffix: "pts",
    },
    {
      key: "mostPointsConcededInVictory",
      title: "Most Points Conceded in a Victory",
      description:
        "The highest opponent scores overcome in victory.",
      record:
        records.mostPointsConcededInVictory,
      leaderboard:
        leaders.mostPointsConcededInVictory,
      metric: r => r.opponentScore,
      format: r => points(r.opponentScore),
      suffix: "pts",
    },
  ];
}

function seasonCategories(
  records: SeasonRecordSet,
  leaders: SeasonLeaderboardSet,
  competition: Competition
): RecordCategory<SeasonRecord>[] {
  const mostPoints: RecordCategory<SeasonRecord> = {
    key: "mostPointsFor",
    title: "Most Points Scored",
    description:
      "The highest season-long scoring totals.",
    record: records.mostPointsFor,
    leaderboard: leaders.mostPointsFor,
    metric: r => r.pointsFor,
    format: r => points(r.pointsFor),
    suffix: "pts",
  };

  const mostAgainst: RecordCategory<SeasonRecord> = {
    key: "mostPointsAgainst",
    title: "Most Points Conceded",
    description:
      "The unluckiest defensive records.",
    record: records.mostPointsAgainst,
    leaderboard: leaders.mostPointsAgainst,
    metric: r => r.pointsAgainst,
    format: r => points(r.pointsAgainst),
    suffix: "pts",
  };

  if (competition === "mainPlayoffs") {
    return [mostPoints, mostAgainst];
  }

  return [
    {
      key: "mostWins",
      title: "Most Wins",
      description:
        "The most successful individual seasons.",
      record: records.mostWins,
      leaderboard: leaders.mostWins,
      metric: r => r.wins,
      format: r => `${r.wins}`,
      suffix: "wins",
    },
    {
      key: "fewestWins",
      title: "Fewest Wins",
      description:
        "The bleakest regular-season campaigns.",
      record: records.fewestWins,
      leaderboard: leaders.fewestWins,
      metric: r => r.wins,
      format: r => `${r.wins}`,
      suffix: "wins",
    },
    mostPoints,
    {
      key: "fewestPointsFor",
      title: "Fewest Points Scored",
      description:
        "The lowest season-long scoring totals.",
      record: records.fewestPointsFor,
      leaderboard: leaders.fewestPointsFor,
      metric: r => r.pointsFor,
      format: r => points(r.pointsFor),
      suffix: "pts",
    },
    mostAgainst,
    {
      key: "fewestPointsAgainst",
      title: "Fewest Points Conceded",
      description:
        "The lowest points-against totals.",
      record: records.fewestPointsAgainst,
      leaderboard: leaders.fewestPointsAgainst,
      metric: r => r.pointsAgainst,
      format: r => points(r.pointsAgainst),
      suffix: "pts",
    },
    {
      key: "bestPointDifferential",
      title: "Best Point Differential",
      description:
        "The most dominant scoring advantages.",
      record: records.bestPointDifferential,
      leaderboard: leaders.bestPointDifferential,
      metric: r => r.pointDifferential,
      format: r =>
        differential(r.pointDifferential),
      suffix: "pts",
    },
    {
      key: "worstPointDifferential",
      title: "Worst Point Differential",
      description:
        "The largest season-long scoring deficits.",
      record: records.worstPointDifferential,
      leaderboard: leaders.worstPointDifferential,
      metric: r => r.pointDifferential,
      format: r =>
        differential(r.pointDifferential),
      suffix: "pts",
    },
    {
      key: "mostGamesOver150",
      title: "Most 150+ Point Games",
      description:
        "The most games scoring at least 150 points in a season.",
      record: records.mostGamesOver150,
      leaderboard: leaders.mostGamesOver150,
      metric: r => r.gamesOver150,
      format: r => `${r.gamesOver150}`,
      suffix: "games",
    },
    {
      key: "mostGames100OrFewer",
      title: "Most Games Scoring 100 or Fewer",
      description:
        "The most games scoring 100 points or less in a season.",
      record: records.mostGames100OrFewer,
      leaderboard:
        leaders.mostGames100OrFewer,
      metric: r => r.games100OrFewer,
      format: r => `${r.games100OrFewer}`,
      suffix: "games",
    },
  ];
}

function careerCategories(
  records: AllTimeRecordSet,
  leaders: AllTimeLeaderboardSet
): RecordCategory<AllTimeFranchiseRecord>[] {
  return [
    {
      key: "mostWins",
      title: "Most Career Wins",
      description:
        "The winningest franchises in SFL history.",
      record: records.mostWins,
      leaderboard: leaders.mostWins,
      metric: r => r.wins,
      format: r => `${r.wins}`,
      suffix: "wins",
    },
    {
      key: "mostPointsFor",
      title: "Most Career Points",
      description:
        "The greatest cumulative scoring totals.",
      record: records.mostPointsFor,
      leaderboard: leaders.mostPointsFor,
      metric: r => r.pointsFor,
      format: r => points(r.pointsFor),
      suffix: "pts",
    },
    {
      key: "mostPointsAgainst",
      title: "Most Career Points Conceded",
      description:
        "The most punishment absorbed over time.",
      record: records.mostPointsAgainst,
      leaderboard: leaders.mostPointsAgainst,
      metric: r => r.pointsAgainst,
      format: r => points(r.pointsAgainst),
      suffix: "pts",
    },
    {
      key: "bestPointDifferential",
      title: "Best Career Point Differential",
      description:
        "The greatest cumulative scoring advantages.",
      record: records.bestPointDifferential,
      leaderboard:
        leaders.bestPointDifferential,
      metric: r => r.pointDifferential,
      format: r =>
        differential(r.pointDifferential),
      suffix: "pts",
    },
  ];
}

function achievementCategories(
  records: AllTimeRecords
): RecordCategory<FranchiseAchievement>[] {
  const leaders =
    records.historicalAchievements.leaderboards;

  return [
    {
      key: "championships",
      title: "Slootbowl Championships",
      description:
        "The franchises that have lifted the Slootbowl trophy.",
      record: leaders.championships[0] ?? null,
      leaderboard: leaders.championships,
      metric: r => r.championships,
      format: r => `${r.championships}`,
      suffix: "titles",
      detail: r =>
        r.championshipSeasons.join(" · "),
    },
    {
      key: "slootbowlAppearances",
      title: "Slootbowl Appearances",
      description:
        "Reaching the championship game, whether victorious or not.",
      record:
        leaders.slootbowlAppearances[0] ?? null,
      leaderboard:
        leaders.slootbowlAppearances,
      metric: r => r.slootbowlAppearances,
      format: r => `${r.slootbowlAppearances}`,
      suffix: "appearances",
      detail: r =>
        r.slootbowlSeasons.join(" · "),
    },
    {
      key: "runnerUpFinishes",
      title: "Slootbowl Runner-Up Finishes",
      description:
        "Getting all the way to the final, only to lose.",
      record:
        leaders.runnerUpFinishes[0] ?? null,
      leaderboard:
        leaders.runnerUpFinishes,
      metric: r => r.runnerUpFinishes,
      format: r => `${r.runnerUpFinishes}`,
      suffix: "finishes",
      detail: r =>
        r.runnerUpSeasons.join(" · "),
    },
    {
      key: "playoffAppearances",
      title: "Most Playoff Appearances",
      description:
        "Seasons competing in the main winners bracket.",
      record:
        leaders.playoffAppearances[0] ?? null,
      leaderboard:
        leaders.playoffAppearances,
      metric: r => r.playoffAppearances,
      format: r => `${r.playoffAppearances}`,
      suffix: "seasons",
      detail: r =>
        r.playoffSeasons.join(" · "),
    },
    {
      key: "playoffWins",
      title: "Most Playoff Wins",
      description:
        "Main winners-bracket wins only.",
      record: leaders.playoffWins[0] ?? null,
      leaderboard: leaders.playoffWins,
      metric: r => r.playoffWins,
      format: r => `${r.playoffWins}`,
      suffix: "wins",
      detail: r =>
        `${r.playoffWins}W · ${r.playoffLosses}L`,
    },
    {
      key: "playoffLosses",
      title: "Most Playoff Losses",
      description:
        "Defeats in the main winners bracket only.",
      record: leaders.playoffLosses[0] ?? null,
      leaderboard: leaders.playoffLosses,
      metric: r => r.playoffLosses,
      format: r => `${r.playoffLosses}`,
      suffix: "losses",
      detail: r =>
        `${r.playoffWins}W · ${r.playoffLosses}L`,
    },
  ];
}

function streakCategories(
  records: AllTimeRecords,
  competition: Competition
): RecordCategory<StreakRecord>[] {
  const leaders =
    records.historicalAchievements.streaks;

  const period = (r: StreakRecord) => {
    const start =
      `${r.startSeason} W${r.startWeek}`;
    const end =
      `${r.endSeason} W${r.endWeek}`;

    return start === end
      ? start
      : `${start} → ${end}`;
  };

  const winning =
    competition === "regularSeason"
      ? leaders.regularSeasonWinning
      : leaders.mainPlayoffsWinning;

  const losing =
    competition === "regularSeason"
      ? leaders.regularSeasonLosing
      : leaders.mainPlayoffsLosing;

  return [
    {
      key: "winningStreak",
      title: "Longest Winning Streak",
      description:
        "Consecutive victories within the selected competition.",
      record: winning[0] ?? null,
      leaderboard: winning,
      metric: r => r.length,
      format: r => `${r.length}`,
      suffix: "wins",
      detail: period,
    },
    {
      key: "losingStreak",
      title: "Longest Losing Streak",
      description:
        "Consecutive defeats within the selected competition.",
      record: losing[0] ?? null,
      leaderboard: losing,
      metric: r => r.length,
      format: r => `${r.length}`,
      suffix: "losses",
      detail: period,
    },
  ];
}

function roundMetric(value: number) {
  return Math.round(
    (value + Number.EPSILON) * 100
  );
}

function rankEntries<T>(
  entries: T[],
  metric: (entry: T) => number,
  direction: "highest" | "lowest"
): T[] {
  const sorted = [...entries].sort((a, b) => {
    const difference =
      roundMetric(metric(a)) -
      roundMetric(metric(b));

    return direction === "highest"
      ? -difference
      : difference;
  });

  if (sorted.length <= LIMIT) {
    return sorted;
  }

  const cutoff = roundMetric(
    metric(sorted[LIMIT - 1])
  );

  return sorted.filter(
    (entry, index) =>
      index < LIMIT ||
      roundMetric(metric(entry)) === cutoff
  );
}

function makePlayerEntry(
  playerId: string,
  weeks: PlayerWeeklyPerformance[],
  directory: Record<
    string,
    PlayerRecordIdentity
  >,
  season = ""
): PlayerEntry {
  const identity = directory[playerId];

  const total = weeks.reduce(
    (sum, week) => sum + week.points,
    0
  );

  const starts = weeks.length;

  const latest = weeks[weeks.length - 1];

  return {
    playerId,
    name:
      identity?.name ?? `Player ${playerId}`,
    position:
      identity?.position ?? "UNKNOWN",
    rosterId: latest?.rosterId ?? 0,
    season,
    week: latest?.week,
    points: Math.round(total * 100) / 100,
    starts,
    average:
      starts > 0 ? total / starts : 0,
    over20: weeks.filter(
      week => week.points >= 20
    ).length,
    over30: weeks.filter(
      week => week.points >= 30
    ).length,
    over40: weeks.filter(
      week => week.points >= 40
    ).length,
    weeks,
  };
}

function gamePlayerEntries(
  games: PlayerGameRecord[],
  directory: Record<
    string,
    PlayerRecordIdentity
  >
): PlayerEntry[] {
  return games.map(game =>
    makePlayerEntry(
      game.playerId,
      [{
        season: game.season,
        week: game.week,
        phase: game.phase,
        rosterId: game.rosterId,
        playerId: game.playerId,
        points: game.points,
      }],
      directory,
      game.season
    )
  );
}

function seasonPlayerEntries(
  seasons: PlayerSeasonRecord[],
  directory: Record<
    string,
    PlayerRecordIdentity
  >
): PlayerEntry[] {
  return seasons.map(season =>
    makePlayerEntry(
      season.playerId,
      season.weeks,
      directory,
      season.season
    )
  );
}

function careerPlayerEntries(
  careers: PlayerCareerRecord[],
  directory: Record<
    string,
    PlayerRecordIdentity
  >
): PlayerEntry[] {
  return careers.map(career =>
    makePlayerEntry(
      career.playerId,
      career.weeks,
      directory
    )
  );
}

function playerCategories(
  entries: PlayerEntry[],
  period: Period
): RecordCategory<PlayerEntry>[] {
  function category(
    key: string,
    title: string,
    description: string,
    metric: (entry: PlayerEntry) => number,
    direction: "highest" | "lowest",
    suffix: string,
    format?: (entry: PlayerEntry) => string
  ): RecordCategory<PlayerEntry> {
    const leaderboard = rankEntries(
      entries,
      metric,
      direction
    );

    return {
      key,
      title,
      description,
      record: leaderboard[0] ?? null,
      leaderboard,
      metric,
      format:
        format ??
        (entry => points(metric(entry))),
      suffix,
    };
  }

  if (period === "games") {
    return [
      category(
        "highestScore",
        "Highest Single-Game Score",
        "The greatest individual performances in SFL history.",
        entry => entry.points,
        "highest",
        "pts"
      ),
      category(
        "lowestScore",
        "Lowest Single-Game Score",
        "The lowest scores recorded by a starting player.",
        entry => entry.points,
        "lowest",
        "pts"
      ),
    ];
  }

  if (period === "season") {
    return [
      category(
        "mostPoints",
        "Most Points in a Season",
        "The highest individual season scoring totals.",
        entry => entry.points,
        "highest",
        "pts"
      ),
      category(
        "mostStarts",
        "Most Starts in a Season",
        "The most appearances in an SFL starting lineup.",
        entry => entry.starts,
        "highest",
        "starts",
        entry => `${entry.starts}`
      ),
      category(
        "highestAverage",
        "Highest Points Per Start",
        "The best scoring averages among players with at least five starts.",
        entry => entry.average,
        "highest",
        "pts/start"
      ),
      category(
        "most20",
        "Most 20+ Point Games",
        "The most 20-point performances in a season.",
        entry => entry.over20,
        "highest",
        "games",
        entry => `${entry.over20}`
      ),
      category(
        "most30",
        "Most 30+ Point Games",
        "The most 30-point performances in a season.",
        entry => entry.over30,
        "highest",
        "games",
        entry => `${entry.over30}`
      ),
      category(
        "most40",
        "Most 40+ Point Games",
        "The most 40-point performances in a season.",
        entry => entry.over40,
        "highest",
        "games",
        entry => `${entry.over40}`
      ),
    ].map(item =>
      item.key === "highestAverage"
        ? {
            ...item,
            leaderboard: rankEntries(
              entries.filter(
                entry => entry.starts >= 5
              ),
              entry => entry.average,
              "highest"
            ),
            record:
              rankEntries(
                entries.filter(
                  entry => entry.starts >= 5
                ),
                entry => entry.average,
                "highest"
              )[0] ?? null,
          }
        : item
    );
  }

  return [
    category(
      "careerPoints",
      "Most Career Points",
      "The highest cumulative SFL scoring totals.",
      entry => entry.points,
      "highest",
      "pts"
    ),
    category(
      "careerStarts",
      "Most Career Starts",
      "The most appearances in SFL starting lineups.",
      entry => entry.starts,
      "highest",
      "starts",
      entry => `${entry.starts}`
    ),
    category(
      "careerAverage",
      "Highest Career Points Per Start",
      "The highest career averages among players with at least ten starts.",
      entry => entry.average,
      "highest",
      "pts/start"
    ),
    category(
      "career20",
      "Most Career 20+ Point Games",
      "The most 20-point games across an SFL career.",
      entry => entry.over20,
      "highest",
      "games",
      entry => `${entry.over20}`
    ),
    category(
      "career30",
      "Most Career 30+ Point Games",
      "The most 30-point games across an SFL career.",
      entry => entry.over30,
      "highest",
      "games",
      entry => `${entry.over30}`
    ),
    category(
      "career40",
      "Most Career 40+ Point Games",
      "The most 40-point games across an SFL career.",
      entry => entry.over40,
      "highest",
      "games",
      entry => `${entry.over40}`
    ),
  ].map(item =>
    item.key === "careerAverage"
      ? {
          ...item,
          leaderboard: rankEntries(
            entries.filter(
              entry => entry.starts >= 10
            ),
            entry => entry.average,
            "highest"
          ),
          record:
            rankEntries(
              entries.filter(
                entry => entry.starts >= 10
              ),
              entry => entry.average,
              "highest"
            )[0] ?? null,
        }
      : item
  );
}

export default function RecordsTabs({
  records,
  playerRecords,
}: {
  records: AllTimeRecords;
  playerRecords: PlayerRecords;
}) {
  const [scope, setScope] =
    useState<Scope>("franchises");

  const [period, setPeriod] =
    useState<Period>("games");

  const [competition, setCompetition] =
    useState<Competition>("regularSeason");

  const [selectedSeason, setSelectedSeason] =
    useState("all");

  const [positions, setPositions] =
    useState<string[]>([...POSITIONS]);

  const [showHonours, setShowHonours] =
    useState(false);

  const filtered =
    selectedSeason === "all"
      ? records
      : records.bySeason[selectedSeason] ??
        records;

  const seasonComplete =
    selectedSeason === "all" ||
    records.completedSeasons[
      competition
    ].includes(selectedSeason);

  const achievements =
    achievementCategories(records);

  const playerGroup: PlayerRecordGroup =
    playerRecords.competitions[competition];

  const allowedPositions = new Set(
    positions
  );

  const filteredWeeks =
    playerGroup.weekly.filter(week => {
      if (
        selectedSeason !== "all" &&
        period !== "career" &&
        week.season !== selectedSeason
      ) {
        return false;
      }

      const identity =
        playerRecords.players[week.playerId];

      return allowedPositions.has(
        identity?.position ?? "UNKNOWN"
      );
    });

  const gameEntries = gamePlayerEntries(
    playerGroup.games.filter(game => {
      if (
        selectedSeason !== "all" &&
        game.season !== selectedSeason
      ) {
        return false;
      }

      return allowedPositions.has(
        playerRecords.players[game.playerId]
          ?.position ?? "UNKNOWN"
      );
    }),
    playerRecords.players
  );

  const seasonMap = new Map<
    string,
    PlayerWeeklyPerformance[]
  >();

  for (const week of filteredWeeks) {
    const key =
      `${week.season}|${week.playerId}`;

    const weeks = seasonMap.get(key) ?? [];
    weeks.push(week);
    seasonMap.set(key, weeks);
  }

  const seasonEntries = Array.from(
    seasonMap.entries()
  )
    .filter(([key]) => {
      const season = key.split("|")[0];

      return (
        selectedSeason !== "all" ||
        playerRecords.completedSeasons[
          competition
        ].includes(season)
      );
    })
    .map(([key, weeks]) => {
      const [season, playerId] =
        key.split("|");

      return makePlayerEntry(
        playerId,
        weeks,
        playerRecords.players,
        season
      );
    });

  const careerMap = new Map<
    string,
    PlayerWeeklyPerformance[]
  >();

  for (const week of playerGroup.weekly) {
    if (
      !allowedPositions.has(
        playerRecords.players[week.playerId]
          ?.position ?? "UNKNOWN"
      )
    ) {
      continue;
    }

    const weeks =
      careerMap.get(week.playerId) ?? [];

    weeks.push(week);
    careerMap.set(week.playerId, weeks);
  }

  const careerEntries = Array.from(
    careerMap.entries()
  ).map(([playerId, weeks]) =>
    makePlayerEntry(
      playerId,
      weeks,
      playerRecords.players
    )
  );

  const currentPlayerEntries =
    period === "games"
      ? gameEntries
      : period === "season"
      ? seasonEntries
      : careerEntries;

  const togglePosition = (position: string) => {
    setPositions(current =>
      current.includes(position)
        ? current.filter(
            item => item !== position
          )
        : [...current, position]
    );
  };

  return (
    <div>
      <p style={subheadingStyle}>
        RECORD TYPE
      </p>

      <div style={tabsStyle}>
        <TabButton
          label="Franchises"
          active={scope === "franchises"}
          onClick={() =>
            setScope("franchises")
          }
        />
        <TabButton
          label="Players"
          active={scope === "players"}
          onClick={() =>
            setScope("players")
          }
        />
      </div>

      <p style={subheadingStyle}>
        COMPETITION
      </p>

      <div style={tabsStyle}>
        <TabButton
          label="Regular Season"
          active={
            competition === "regularSeason"
          }
          onClick={() =>
            setCompetition("regularSeason")
          }
        />
        <TabButton
          label="Main Playoffs"
          active={
            competition === "mainPlayoffs"
          }
          onClick={() =>
            setCompetition("mainPlayoffs")
          }
        />
      </div>

      <p style={subheadingStyle}>
        RECORD PERIOD
      </p>

      <div style={tabsStyle}>
        <TabButton
          label="Game"
          active={period === "games"}
          onClick={() => setPeriod("games")}
        />
        <TabButton
          label="Season"
          active={period === "season"}
          onClick={() => setPeriod("season")}
        />
        <TabButton
          label="Career"
          active={period === "career"}
          onClick={() => setPeriod("career")}
        />
      </div>

      {scope === "players" && (
        <div style={{ marginBottom: 24 }}>
          <div style={filterHeadingStyle}>
            <p style={subheadingStyle}>
              PLAYER POSITIONS
            </p>

            <button
              type="button"
              onClick={() =>
                setPositions(
                  positions.length ===
                    POSITIONS.length
                    ? []
                    : [...POSITIONS]
                )
              }
              style={smallButtonStyle}
            >
              {positions.length ===
              POSITIONS.length
                ? "Clear All"
                : "Select All"}
            </button>
          </div>

          <div style={positionRowStyle}>
            {POSITIONS.map(position => {
              const selected =
                positions.includes(position);

              return (
                <button
                  key={position}
                  type="button"
                  aria-pressed={selected}
                  onClick={() =>
                    togglePosition(position)
                  }
                  style={{
                    ...positionButtonStyle,
                    background: selected
                      ? "#ffffff"
                      : "#151b23",
                    color: selected
                      ? "#0b0f14"
                      : "#aeb8c5",
                    borderColor: selected
                      ? "#ffffff"
                      : "#27303b",
                  }}
                >
                  {position}
                </button>
              );
            })}
          </div>

          <p style={filterNoteStyle}>
            {positions.length === 0
              ? "Select at least one position."
              : `Showing ${POSITIONS.filter(
                  position =>
                    positions.includes(position)
                ).join(" + ")} records`}
          </p>
        </div>
      )}

      {period !== "career" && (
        <div style={{ marginBottom: 24 }}>
          <p style={subheadingStyle}>
            SEASON
          </p>

          <select
            value={selectedSeason}
            onChange={event =>
              setSelectedSeason(
                event.target.value
              )
            }
            style={selectStyle}
          >
            <option value="all">
              All Seasons
            </option>

            {(scope === "players"
              ? playerRecords.availableSeasons
              : records.availableSeasons
            ).map(year => (
              <option
                key={year}
                value={year}
              >
                {year}
              </option>
            ))}
          </select>

          {period === "season" &&
            !seasonComplete && (
              <p style={noticeStyle}>
                Season in Progress —
                these totals are provisional
                and excluded from all-season
                records until the competition
                is complete.
              </p>
            )}
        </div>
      )}

      {scope === "franchises" &&
        period === "games" && (
          <RecordSection
            key={`franchise-games-${selectedSeason}-${competition}`}
            title="Individual Game"
            subtitle="The greatest performances, closest finishes and most spectacular disasters."
            categories={gameCategories(
              filtered.individualGame[
                competition
              ],
              filtered.leaderboards
                .individualGame[competition]
            )}
            primaryLabel={r =>
              historicalFranchise(
                r.rosterId,
                r.season
              )
            }
            defaultDetail={matchupDetail}
            metaLabel={gameMeta}
          />
        )}

      {scope === "franchises" &&
        period === "season" && (
          <RecordSection
            key={`franchise-season-${selectedSeason}-${competition}`}
            title="Season Long"
            subtitle="The best and worst campaigns across SFL history."
            categories={seasonCategories(
              filtered.season[competition],
              filtered.leaderboards
                .season[competition],
              competition
            )}
            primaryLabel={r =>
              historicalFranchise(
                r.rosterId,
                r.season
              )
            }
            defaultDetail={seasonDetail}
            metaLabel={r => r.season}
          />
        )}

      {scope === "franchises" &&
        period === "career" && (
          <>
            {competition ===
              "mainPlayoffs" && (
              <>
                <RecordSection
                  title="Slootbowl Honours"
                  subtitle="Championship glory and the heartbreak of finishing second."
                  categories={
                    achievements.slice(0, 3)
                  }
                  primaryLabel={r =>
                    franchise(r.rosterId)
                  }
                />

                <RecordSection
                  title="Playoff History"
                  subtitle="Main winners-bracket results only. No toilet bowl or placement games."
                  categories={
                    achievements.slice(3)
                  }
                  primaryLabel={r =>
                    franchise(r.rosterId)
                  }
                />
              </>
            )}

            <RecordSection
              title="Historical Streaks"
              subtitle="Winning and losing runs tracked separately by competition."
              categories={streakCategories(
                records,
                competition
              )}
              primaryLabel={r =>
                franchise(r.rosterId)
              }
            />

            {competition ===
              "regularSeason" && (
              <RecordSection
                title="Career Totals"
                subtitle="All-time franchise totals across completed regular-season and main-playoff games."
                categories={careerCategories(
                  records.allTime,
                  records.allTimeLeaderboards
                )}
                primaryLabel={r =>
                  franchise(r.rosterId)
                }
                defaultDetail={careerDetail}
              />
            )}
          </>
        )}

      {scope === "players" &&
        positions.length > 0 && (
          <RecordSection
            key={`players-${period}-${competition}-${selectedSeason}-${positions.join("-")}`}
            title={
              period === "games"
                ? "Player Game Records"
                : period === "season"
                ? "Player Season Records"
                : "Player Career Records"
            }
            subtitle={
              "Started players only. " +
              (competition ===
              "regularSeason"
                ? "Regular-season performances."
                : "Main winners-bracket performances only.")
            }
            categories={playerCategories(
              currentPlayerEntries,
              period
            )}
            primaryLabel={r => r.name}
            defaultDetail={r => {
              const teams = Array.from(
                new Set(
                  r.weeks.map(
                    week =>
                      historicalFranchise(
                        week.rosterId,
                        week.season
                      )
                  )
                )
              );

              return (
                `${r.position} · ` +
                teams.join(", ")
              );
            }}
            metaLabel={r =>
              period === "games"
                ? `${r.season} · Week ${r.week}`
                : period === "season"
                ? `${r.season} · ${r.starts} starts`
                : `${r.starts} career starts`
            }
          />
        )}

      {scope === "players" &&
        positions.length === 0 && (
          <p style={noticeStyle}>
            Select at least one position
            to view player records.
          </p>
        )}
    </div>
  );
}

function RecordSection<
  T extends { rosterId: number }
>({
  title,
  subtitle,
  categories,
  primaryLabel,
  defaultDetail,
  metaLabel,
}: {
  title: string;
  subtitle: string;
  categories: RecordCategory<T>[];
  primaryLabel: (record: T) => string;
  defaultDetail?: (record: T) => string;
  metaLabel?: (record: T) => string;
}) {
  return (
    <section style={{ marginBottom: 32 }}>
      <div style={headingRowStyle}>
        <div style={headingAccentStyle} />
        <h2 style={headingStyle}>
          {title}
        </h2>
      </div>

      <p style={sectionDescriptionStyle}>
        {subtitle}
      </p>

      {categories.map(category => (
        <RecordCard
          key={category.key}
          category={category}
          primaryLabel={primaryLabel}
          detailLabel={
            category.detail ??
            defaultDetail
          }
          metaLabel={metaLabel}
        />
      ))}
    </section>
  );
}

function RecordCard<
  T extends { rosterId: number }
>({
  category,
  primaryLabel,
  detailLabel,
  metaLabel,
}: {
  category: RecordCategory<T>;
  primaryLabel: (record: T) => string;
  detailLabel?: (record: T) => string;
  metaLabel?: (record: T) => string;
}) {
  const [expanded, setExpanded] =
    useState(false);

  const {
    record,
    leaderboard,
    metric,
    format,
    suffix,
  } = category;

  if (!record) {
    return null;
  }

  const normalized = (entry: T) =>
    Math.round(
      (metric(entry) + Number.EPSILON) *
        100
    );

  const leaderValue = normalized(record);

  const jointCount = leaderboard.filter(
    entry =>
      normalized(entry) === leaderValue
  ).length;

  let previousValue: number | null = null;
  let previousRank = 0;

  return (
    <article style={cardStyle}>
      <div style={cardHeaderStyle}>
        <div
          style={{
            minWidth: 0,
            flex: 1,
          }}
        >
          <p style={labelStyle}>
            {category.title.toUpperCase()}
          </p>

          <p style={descriptionStyle}>
            {category.description}
          </p>
        </div>

        {jointCount > 1 && (
          <span style={jointBadgeStyle}>
            JOINT
          </span>
        )}
      </div>

      <div style={valueRowStyle}>
        <h3 style={valueStyle}>
          {format(record)}
        </h3>

        {suffix && (
          <span style={suffixStyle}>
            {suffix}
          </span>
        )}
      </div>

      <p style={teamStyle}>
        {primaryLabel(record)}
      </p>

      {detailLabel?.(record) && (
        <p style={detailStyle}>
          {detailLabel(record)}
        </p>
      )}

      {metaLabel?.(record) && (
        <p style={metaStyle}>
          {metaLabel(record)}
        </p>
      )}

      {jointCount > 1 && (
        <p style={jointNoticeStyle}>
          {jointCount} entries share
          this record.
        </p>
      )}

      {leaderboard.length > 1 && (
        <>
          <button
            type="button"
            onClick={() =>
              setExpanded(value => !value)
            }
            aria-expanded={expanded}
            style={expandButtonStyle}
          >
            <span>
              {expanded
                ? "Hide leaderboard"
                : `View leaderboard (${leaderboard.length})`}
            </span>

            <span aria-hidden="true">
              {expanded ? "▲" : "▼"}
            </span>
          </button>

          {expanded && (
            <div style={leaderboardStyle}>
              <p style={leaderboardHeadingStyle}>
                HISTORICAL LEADERBOARD
              </p>

              {leaderboard.map(
                (entry, index) => {
                  const currentValue =
                    normalized(entry);

                  const rank =
                    previousValue ===
                    currentValue
                      ? previousRank
                      : index + 1;

                  previousValue =
                    currentValue;

                  previousRank = rank;

                  return (
                    <div
                      key={`${category.key}-${index}`}
                      style={{
                        ...leaderboardRowStyle,
                        borderBottom:
                          index ===
                          leaderboard.length -
                            1
                            ? "none"
                            : "1px solid #27303b",
                      }}
                    >
                      <div style={rankStyle}>
                        {rank}
                      </div>

                      <div
                        style={
                          leaderboardInfoStyle
                        }
                      >
                        <p
                          style={
                            leaderboardTeamStyle
                          }
                        >
                          {primaryLabel(entry)}
                        </p>

                        {detailLabel?.(
                          entry
                        ) && (
                          <p
                            style={
                              leaderboardDetailStyle
                            }
                          >
                            {detailLabel(entry)}
                          </p>
                        )}

                        {metaLabel?.(
                          entry
                        ) && (
                          <p
                            style={
                              leaderboardMetaStyle
                            }
                          >
                            {metaLabel(entry)}
                          </p>
                        )}
                      </div>

                      <div
                        style={
                          leaderboardValueStyle
                        }
                      >
                        {format(entry)}
                      </div>
                    </div>
                  );
                }
              )}

              <p
                style={
                  leaderboardFootnoteStyle
                }
              >
                Top ten entries,
                including ties at the cutoff.
              </p>
            </div>
          )}
        </>
      )}
    </article>
  );
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        flex: 1,
        minWidth: 0,
        border: "none",
        borderRadius: 10,
        padding: "11px 5px",
        background: active
          ? "#ffffff"
          : "transparent",
        color: active
          ? "#0b0f14"
          : "#aeb8c5",
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

const tabsStyle: CSSProperties = {
  display: "flex",
  background: "#151b23",
  border: "1px solid #27303b",
  borderRadius: 14,
  padding: 4,
  marginBottom: 24,
  gap: 3,
};

const selectStyle: CSSProperties = {
  width: "100%",
  padding: "13px 14px",
  background: "#151b23",
  border: "1px solid #27303b",
  borderRadius: 12,
  color: "#ffffff",
  fontSize: 14,
};

const subheadingStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 1,
  color: "#aeb8c5",
  marginBottom: 10,
};

const noticeStyle: CSSProperties = {
  marginTop: 12,
  marginBottom: 20,
  fontSize: 12,
  color: "#aeb8c5",
  lineHeight: 1.6,
};

const filterHeadingStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const smallButtonStyle: CSSProperties = {
  border: "none",
  background: "transparent",
  color: "#ffffff",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
};

const positionRowStyle: CSSProperties = {
  display: "flex",
  gap: 8,
};

const positionButtonStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  padding: "12px 4px",
  border: "1px solid",
  borderRadius: 10,
  fontSize: 13,
  fontWeight: 800,
  cursor: "pointer",
};

const filterNoteStyle: CSSProperties = {
  marginTop: 10,
  marginBottom: 0,
  color: "#8793a3",
  fontSize: 12,
};

const headingRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginBottom: 8,
};

const headingAccentStyle: CSSProperties = {
  width: 4,
  height: 26,
  background: "#ffffff",
  borderRadius: 4,
  flexShrink: 0,
};

const headingStyle: CSSProperties = {
  margin: 0,
  fontSize: 24,
};

const sectionDescriptionStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: 20,
  color: "#aeb8c5",
  fontSize: 13,
  lineHeight: 1.6,
};

const cardStyle: CSSProperties = {
  background: "#151b23",
  border: "1px solid #27303b",
  borderRadius: 18,
  padding: 18,
  marginBottom: 12,
  overflow: "hidden",
};

const cardHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 10,
};

const labelStyle: CSSProperties = {
  margin: 0,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 1,
  color: "#aeb8c5",
};

const descriptionStyle: CSSProperties = {
  marginTop: 7,
  marginBottom: 0,
  fontSize: 12,
  lineHeight: 1.5,
  color: "#687384",
};

const valueRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  gap: 7,
  marginTop: 14,
  flexWrap: "wrap",
};

const valueStyle: CSSProperties = {
  margin: 0,
  fontSize: 32,
  fontWeight: 800,
  letterSpacing: -1,
  fontVariantNumeric: "tabular-nums",
};

const suffixStyle: CSSProperties = {
  fontSize: 13,
  color: "#aeb8c5",
};

const teamStyle: CSSProperties = {
  marginTop: 10,
  marginBottom: 4,
  color: "#ffffff",
  fontWeight: 700,
  fontSize: 15,
};

const detailStyle: CSSProperties = {
  marginTop: 5,
  marginBottom: 0,
  fontSize: 13,
  lineHeight: 1.5,
  color: "#d0d7e0",
  overflowWrap: "anywhere",
};

const metaStyle: CSSProperties = {
  marginTop: 8,
  marginBottom: 0,
  fontSize: 12,
  color: "#8793a3",
};

const jointBadgeStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: 0.8,
  color: "#ffffff",
  border: "1px solid #475569",
  borderRadius: 6,
  padding: "5px 7px",
  whiteSpace: "nowrap",
};

const jointNoticeStyle: CSSProperties = {
  marginTop: 10,
  marginBottom: 0,
  color: "#aeb8c5",
  fontSize: 12,
};

const expandButtonStyle: CSSProperties = {
  display: "flex",
  width: "100%",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: 18,
  padding: "13px 2px 2px",
  border: "none",
  borderTop: "1px solid #27303b",
  background: "transparent",
  color: "#ffffff",
  fontSize: 13,
  fontWeight: 700,
  textAlign: "left",
  cursor: "pointer",
};

const leaderboardStyle: CSSProperties = {
  marginTop: 16,
  paddingTop: 14,
  borderTop: "1px solid #27303b",
};

const leaderboardHeadingStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: 10,
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: 1,
  color: "#8793a3",
};

const leaderboardRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 10,
  padding: "13px 0",
};

const rankStyle: CSSProperties = {
  width: 24,
  flexShrink: 0,
  fontSize: 13,
  fontWeight: 800,
  color: "#aeb8c5",
};

const leaderboardInfoStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
};

const leaderboardTeamStyle: CSSProperties = {
  margin: 0,
  fontSize: 13,
  fontWeight: 700,
  color: "#ffffff",
  overflowWrap: "anywhere",
};

const leaderboardDetailStyle: CSSProperties = {
  marginTop: 5,
  marginBottom: 0,
  fontSize: 12,
  lineHeight: 1.5,
  color: "#aeb8c5",
  overflowWrap: "anywhere",
};

const leaderboardMetaStyle: CSSProperties = {
  marginTop: 5,
  marginBottom: 0,
  fontSize: 11,
  color: "#687384",
};

const leaderboardValueStyle: CSSProperties = {
  flexShrink: 0,
  fontSize: 14,
  fontWeight: 800,
  color: "#ffffff",
  fontVariantNumeric: "tabular-nums",
};

const leaderboardFootnoteStyle: CSSProperties = {
  marginTop: 12,
  marginBottom: 0,
  fontSize: 11,
  lineHeight: 1.5,
  color: "#687384",
};
