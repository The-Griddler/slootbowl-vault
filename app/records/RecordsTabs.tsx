
"use client";

import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";

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
  PlayerWeeklyPerformance,
  PlayerRecordIdentity,
  PlayerChampionshipRecord,
} from "../../lib/playerRecords";

import {
  FRANCHISES,
  getFranchiseName,
  getHistoricalFranchiseName,
} from "../../lib/franchises";

type Scope = "franchises" | "players";
type Period = "games" | "season" | "career";
type Competition = "regularSeason" | "mainPlayoffs";

type Category<T> = {
  key: string;
  title: string;
  description: string;
  leaderboard: T[];
  metric: (entry: T) => number;
  format: (entry: T) => string;
  suffix?: string;
  detail?: (entry: T) => string;
};

type PlayerEntry = {
  playerId: string;
  name: string;
  position: string;
  rosterId: number;
  season: string;
  week: number;
  points: number;
  starts: number;
  average: number;
  over20: number;
  over30: number;
  over40: number;
  franchisesRepresented: number;
  weeks: PlayerWeeklyPerformance[];
};

type ChampionshipEntry =
  PlayerChampionshipRecord & {
    name: string;
    position: string;
    rosterId: number;
  };

const POSITIONS = ["QB", "RB", "WR", "TE"];
const LIMIT = 10;

const pts = (n: number) => n.toFixed(2);

const signed = (n: number) =>
  n >= 0 ? `+${pts(n)}` : pts(n);

const currentName = (id: number) =>
  getFranchiseName(id);

const historicalName = (
  id: number,
  season: string | number
) => getHistoricalFranchiseName(id, season);

function chronological(
  aSeason: string,
  aWeek: number,
  bSeason: string,
  bWeek: number
) {
  return (
    Number(aSeason) - Number(bSeason) ||
    aWeek - bWeek
  );
}

function rounded(n: number) {
  return Math.round((n + Number.EPSILON) * 100);
}

function topTen<T>(
  entries: T[],
  metric: (entry: T) => number,
  direction: "high" | "low",
  compareTie: (a: T, b: T) => number,
  positiveOnly = false
): T[] {
  return entries
    .filter(
      entry =>
        Number.isFinite(metric(entry)) &&
        (!positiveOnly || metric(entry) > 0)
    )
    .sort((a, b) => {
      const difference =
        rounded(metric(a)) -
        rounded(metric(b));

      if (difference !== 0) {
        return direction === "high"
          ? -difference
          : difference;
      }

      return compareTie(a, b);
    })
    .slice(0, LIMIT);
}

function category<T>(
  key: string,
  title: string,
  description: string,
  leaderboard: T[],
  metric: (entry: T) => number,
  format: (entry: T) => string,
  suffix?: string,
  detail?: (entry: T) => string
): Category<T> {
  return {
    key,
    title,
    description,
    leaderboard,
    metric,
    format,
    suffix,
    detail,
  };
}

// --------------------------------------------------
// FRANCHISE LOGOS
// --------------------------------------------------

function uniqueRosterIds(ids: number[]) {
  return Array.from(
    new Set(
      ids.filter(id =>
        FRANCHISES.some(
          franchise => franchise.rosterId === id
        )
      )
    )
  );
}

function franchiseLogo(id: number) {
  return FRANCHISES.find(
    franchise => franchise.rosterId === id
  );
}

function FranchiseLogos({
  rosterIds,
  size,
}: {
  rosterIds: number[];
  size: "large" | "small";
}) {
  const franchises = uniqueRosterIds(rosterIds)
    .map(franchiseLogo)
    .filter(
      (
        franchise
      ): franchise is (typeof FRANCHISES)[number] =>
        franchise !== undefined
    );

  if (!franchises.length) {
    return null;
  }

  const large = size === "large";
  const dimension = large ? 76 : 24;
  const gap = large ? 10 : 4;
  const multiple = franchises.length > 1;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: multiple
          ? `repeat(2, ${dimension}px)`
          : `${dimension}px`,
        gap,
        alignItems: "center",
        justifyItems: "center",
        flexShrink: 0,
      }}
    >
      {franchises.map(franchise => (
        <div
          key={franchise.rosterId}
          title={franchise.name}
          style={{
            width: dimension,
            height: dimension,
            position: "relative",
          }}
        >
          <Image
            src={franchise.logo}
            alt={`${franchise.name} logo`}
            fill
            sizes={large ? "76px" : "24px"}
            style={{
              objectFit: "contain",
            }}
          />
        </div>
      ))}
    </div>
  );
}

// --------------------------------------------------
// FRANCHISE GAME RECORDS
// --------------------------------------------------

function gameCategories(
  records: RecordSet,
  leaders: RecordLeaderboardSet
): Category<LeagueRecord>[] {
  const definitions: {
    key: keyof RecordSet;
    title: string;
    description: string;
    metric: (r: LeagueRecord) => number;
    direction: "high" | "low";
  }[] = [
    {
      key: "highestTeamScore",
      title: "Highest Team Score",
      description:
        "The greatest single-game team performances.",
      metric: r => r.score,
      direction: "high",
    },
    {
      key: "lowestTeamScore",
      title: "Lowest Team Score",
      description:
        "The lowest single-game team totals.",
      metric: r => r.score,
      direction: "low",
    },
    {
      key: "biggestWinningMargin",
      title: "Biggest Winning Margin",
      description:
        "The most comprehensive victories.",
      metric: r => r.margin,
      direction: "high",
    },
    {
      key: "closestGame",
      title: "Closest Game",
      description:
        "The narrowest margins in SFL history.",
      metric: r => r.margin,
      direction: "low",
    },
    {
      key: "highestCombinedScore",
      title: "Highest Combined Score",
      description:
        "The biggest scoring shootouts.",
      metric: r =>
        r.score + r.opponentScore,
      direction: "high",
    },
    {
      key: "lowestCombinedScore",
      title: "Lowest Combined Score",
      description:
        "The lowest-scoring encounters.",
      metric: r =>
        r.score + r.opponentScore,
      direction: "low",
    },
    {
      key: "highestLosingScore",
      title: "Highest Losing Score",
      description:
        "Great performances rewarded with defeat.",
      metric: r => r.score,
      direction: "high",
    },
    {
      key: "lowestWinningScore",
      title: "Lowest Winning Score",
      description:
        "Victories achieved with the fewest points.",
      metric: r => r.score,
      direction: "low",
    },
    {
      key: "mostPointsConcededInVictory",
      title: "Most Points Conceded in Victory",
      description:
        "The highest opposition totals overcome.",
      metric: r => r.opponentScore,
      direction: "high",
    },
  ];

  return definitions.map(def => {
    const entries = topTen(
      leaders[def.key],
      def.metric,
      def.direction,
      (a, b) =>
        chronological(
          a.season,
          a.week,
          b.season,
          b.week
        ) ||
        a.rosterId - b.rosterId
    );

    return category(
      def.key,
      def.title,
      def.description,
      entries.length
        ? entries
        : records[def.key]
        ? [records[def.key] as LeagueRecord]
        : [],
      def.metric,
      r => pts(def.metric(r)),
      "pts"
    );
  });
}

// --------------------------------------------------
// FRANCHISE SEASON RECORDS
// --------------------------------------------------

function seasonCategories(
  records: SeasonRecordSet,
  leaders: SeasonLeaderboardSet,
  competition: Competition
): Category<SeasonRecord>[] {
  const definitions: {
    key: keyof SeasonRecordSet;
    title: string;
    description: string;
    metric: (r: SeasonRecord) => number;
    direction: "high" | "low";
    suffix: string;
    format?: (r: SeasonRecord) => string;
  }[] = [
    {
      key: "mostWins",
      title: "Most Wins",
      description:
        "The most successful regular seasons.",
      metric: r => r.wins,
      direction: "high",
      suffix: "wins",
      format: r => String(r.wins),
    },
    {
      key: "fewestWins",
      title: "Fewest Wins",
      description:
        "The least successful regular seasons.",
      metric: r => r.wins,
      direction: "low",
      suffix: "wins",
      format: r => String(r.wins),
    },
    {
      key: "mostPointsFor",
      title: "Most Points Scored",
      description:
        "The highest season scoring totals.",
      metric: r => r.pointsFor,
      direction: "high",
      suffix: "pts",
    },
    {
      key: "fewestPointsFor",
      title: "Fewest Points Scored",
      description:
        "The lowest season scoring totals.",
      metric: r => r.pointsFor,
      direction: "low",
      suffix: "pts",
    },
    {
      key: "mostPointsAgainst",
      title: "Most Points Conceded",
      description:
        "The highest points-against totals.",
      metric: r => r.pointsAgainst,
      direction: "high",
      suffix: "pts",
    },
    {
      key: "fewestPointsAgainst",
      title: "Fewest Points Conceded",
      description:
        "The lowest season scoring totals conceded.",
      metric: r => r.pointsAgainst,
      direction: "low",
      suffix: "pts",
    },
    {
      key: "bestPointDifferential",
      title: "Best Point Differential",
      description:
        "The greatest scoring advantages.",
      metric: r => r.pointDifferential,
      direction: "high",
      suffix: "pts",
      format: r =>
        signed(r.pointDifferential),
    },
    {
      key: "worstPointDifferential",
      title: "Worst Point Differential",
      description:
        "The greatest scoring deficits.",
      metric: r => r.pointDifferential,
      direction: "low",
      suffix: "pts",
      format: r =>
        signed(r.pointDifferential),
    },
    {
      key: "mostGamesOver150",
      title: "Most 150+ Point Games",
      description:
        "The most 150+ point team performances in one season.",
      metric: r => r.gamesOver150,
      direction: "high",
      suffix: "games",
      format: r =>
        String(r.gamesOver150),
    },
    {
      key: "mostGames100OrFewer",
      title: "Most Games Scoring 100 or Fewer",
      description:
        "The most games at or below 100 points.",
      metric: r => r.games100OrFewer,
      direction: "high",
      suffix: "games",
      format: r =>
        String(r.games100OrFewer),
    },
  ];

  return definitions
    .filter(
      def =>
        competition === "regularSeason" ||
        def.key === "mostPointsFor" ||
        def.key === "mostPointsAgainst"
    )
    .map(def => {
      const entries = topTen(
        leaders[def.key],
        def.metric,
        def.direction,
        (a, b) =>
          Number(a.season) -
            Number(b.season) ||
          a.rosterId - b.rosterId
      );

      return category(
        def.key,
        def.title,
        def.description,
        entries.length
          ? entries
          : records[def.key]
          ? [records[def.key] as SeasonRecord]
          : [],
        def.metric,
        def.format ??
          (r => pts(def.metric(r))),
        def.suffix
      );
    });
}

// --------------------------------------------------
// FRANCHISE CAREER RECORDS
// --------------------------------------------------

function franchiseCareerCategories(
  records: AllTimeRecordSet,
  leaders: AllTimeLeaderboardSet
): Category<AllTimeFranchiseRecord>[] {
  const definitions: {
    key: keyof AllTimeRecordSet;
    title: string;
    description: string;
    metric: (
      r: AllTimeFranchiseRecord
    ) => number;
    suffix: string;
    format: (
      r: AllTimeFranchiseRecord
    ) => string;
  }[] = [
    {
      key: "mostWins",
      title: "Most Career Wins",
      description:
        "The winningest franchises in SFL history.",
      metric: r => r.wins,
      suffix: "wins",
      format: r => String(r.wins),
    },
    {
      key: "mostPointsFor",
      title: "Most Career Points",
      description:
        "The greatest cumulative scoring totals.",
      metric: r => r.pointsFor,
      suffix: "pts",
      format: r => pts(r.pointsFor),
    },
    {
      key: "mostPointsAgainst",
      title: "Most Career Points Conceded",
      description:
        "The most points conceded across SFL history.",
      metric: r => r.pointsAgainst,
      suffix: "pts",
      format: r => pts(r.pointsAgainst),
    },
    {
      key: "bestPointDifferential",
      title: "Best Career Point Differential",
      description:
        "The greatest cumulative scoring advantages.",
      metric: r => r.pointDifferential,
      suffix: "pts",
      format: r =>
        signed(r.pointDifferential),
    },
  ];

  return definitions.map(def => {
    const entries = topTen(
      leaders[def.key],
      def.metric,
      "high",
      (a, b) =>
        a.rosterId - b.rosterId
    );

    return category(
      def.key,
      def.title,
      def.description,
      entries.length
        ? entries
        : records[def.key]
        ? [records[def.key] as AllTimeFranchiseRecord]
        : [],
      def.metric,
      def.format,
      def.suffix
    );
  });
}

// --------------------------------------------------
// HONOURS
// --------------------------------------------------

function achievementCategories(
  records: AllTimeRecords
): Category<FranchiseAchievement>[] {
  const leaders =
    records.historicalAchievements.leaderboards;

  const definitions: {
    key: keyof typeof leaders;
    title: string;
    description: string;
    metric: (
      r: FranchiseAchievement
    ) => number;
    detail: (
      r: FranchiseAchievement
    ) => string;
    suffix: string;
  }[] = [
    {
      key: "championships",
      title: "Slootbowl Championships",
      description:
        "The franchises that have won the Slootbowl.",
      metric: r => r.championships,
      detail: r =>
        r.championshipSeasons.join(" · "),
      suffix: "titles",
    },
    {
      key: "slootbowlAppearances",
      title: "Slootbowl Appearances",
      description:
        "Appearances in the championship game.",
      metric: r =>
        r.slootbowlAppearances,
      detail: r =>
        r.slootbowlSeasons.join(" · "),
      suffix: "appearances",
    },
    {
      key: "runnerUpFinishes",
      title: "Slootbowl Runner-Up Finishes",
      description:
        "Finishing second in the Slootbowl.",
      metric: r =>
        r.runnerUpFinishes,
      detail: r =>
        r.runnerUpSeasons.join(" · "),
      suffix: "finishes",
    },
    {
      key: "playoffAppearances",
      title: "Most Playoff Appearances",
      description:
        "Seasons reaching the main winners bracket.",
      metric: r =>
        r.playoffAppearances,
      detail: r =>
        r.playoffSeasons.join(" · "),
      suffix: "seasons",
    },
    {
      key: "playoffWins",
      title: "Most Playoff Wins",
      description:
        "Victories in the main winners bracket.",
      metric: r => r.playoffWins,
      detail: r =>
        `${r.playoffWins}W · ${r.playoffLosses}L`,
      suffix: "wins",
    },
    {
      key: "playoffLosses",
      title: "Most Playoff Losses",
      description:
        "Defeats in the main winners bracket.",
      metric: r => r.playoffLosses,
      detail: r =>
        `${r.playoffWins}W · ${r.playoffLosses}L`,
      suffix: "losses",
    },
  ];

  return definitions.map(def =>
    category(
      def.key,
      def.title,
      def.description,
      topTen(
        leaders[def.key],
        def.metric,
        "high",
        (a, b) => {
          const yearsA =
            def.key === "championships"
              ? a.championshipSeasons
              : def.key === "slootbowlAppearances"
              ? a.slootbowlSeasons
              : def.key === "runnerUpFinishes"
              ? a.runnerUpSeasons
              : a.playoffSeasons;

          const yearsB =
            def.key === "championships"
              ? b.championshipSeasons
              : def.key === "slootbowlAppearances"
              ? b.slootbowlSeasons
              : def.key === "runnerUpFinishes"
              ? b.runnerUpSeasons
              : b.playoffSeasons;

          return (
            Number(yearsA[0] ?? 9999) -
              Number(yearsB[0] ?? 9999) ||
            a.rosterId - b.rosterId
          );
        }
      ),
      def.metric,
      r => String(def.metric(r)),
      def.suffix,
      def.detail
    )
  );
}

// --------------------------------------------------
// STREAKS
// --------------------------------------------------

function streakCategories(
  records: AllTimeRecords,
  competition: Competition
): Category<StreakRecord>[] {
  const streaks =
    records.historicalAchievements.streaks;

  const winning =
    competition === "regularSeason"
      ? streaks.regularSeasonWinning
      : streaks.mainPlayoffsWinning;

  const losing =
    competition === "regularSeason"
      ? streaks.regularSeasonLosing
      : streaks.mainPlayoffsLosing;

  return [
    {
      key: "winningStreak",
      title: "Longest Winning Streak",
      description:
        "Consecutive victories in the selected competition.",
      entries: winning,
      suffix: "wins",
    },
    {
      key: "losingStreak",
      title: "Longest Losing Streak",
      description:
        "Consecutive defeats in the selected competition.",
      entries: losing,
      suffix: "losses",
    },
  ].map(def =>
    category(
      def.key,
      def.title,
      def.description,
      topTen(
        def.entries,
        r => r.length,
        "high",
        (a, b) =>
          chronological(
            a.startSeason,
            a.startWeek,
            b.startSeason,
            b.startWeek
          ) ||
          a.rosterId - b.rosterId
      ),
      r => r.length,
      r => String(r.length),
      def.suffix,
      r =>
        `${r.startSeason} W${r.startWeek} → ` +
        `${r.endSeason} W${r.endWeek}`
    )
  );
}

// --------------------------------------------------
// PLAYER RECORD DATA
// --------------------------------------------------

function makePlayerEntry(
  playerId: string,
  weeks: PlayerWeeklyPerformance[],
  directory: Record<
    string,
    PlayerRecordIdentity
  >,
  season = ""
): PlayerEntry {
  const sorted = [...weeks].sort(
    (a, b) =>
      chronological(
        a.season,
        a.week,
        b.season,
        b.week
      ) ||
      a.rosterId - b.rosterId
  );

  const total = sorted.reduce(
    (sum, week) =>
      sum + week.points,
    0
  );

  const first = sorted[0];
  const starts = sorted.length;

  const franchisesRepresented =
    uniqueRosterIds(
      sorted.map(
        week => week.rosterId
      )
    ).length;

  return {
    playerId,
    name:
      directory[playerId]?.name ??
      `Player ${playerId}`,
    position:
      directory[playerId]?.position ??
      "UNKNOWN",
    rosterId:
      first?.rosterId ?? 0,
    season:
      season ||
      first?.season ||
      "",
    week:
      first?.week ?? 0,
    points:
      Math.round(total * 100) /
      100,
    starts,
    average:
      starts
        ? total / starts
        : 0,
    over20: sorted.filter(
      w => w.points >= 20
    ).length,
    over30: sorted.filter(
      w => w.points >= 30
    ).length,
    over40: sorted.filter(
      w => w.points >= 40
    ).length,
    franchisesRepresented,
    weeks: sorted,
  };
}

function playerEntries(
  weekly: PlayerWeeklyPerformance[],
  period: Period,
  directory: Record<
    string,
    PlayerRecordIdentity
  >
): PlayerEntry[] {
  if (period === "games") {
    return weekly.map(week =>
      makePlayerEntry(
        week.playerId,
        [week],
        directory,
        week.season
      )
    );
  }

  const grouped = new Map<
    string,
    PlayerWeeklyPerformance[]
  >();

  for (const week of weekly) {
    const key =
      period === "season"
        ? `${week.season}|${week.playerId}`
        : week.playerId;

    const existing =
      grouped.get(key) ?? [];

    existing.push(week);
    grouped.set(key, existing);
  }

  return Array.from(grouped.values()).map(
    weeks =>
      makePlayerEntry(
        weeks[0].playerId,
        weeks,
        directory,
        period === "season"
          ? weeks[0].season
          : ""
      )
  );
}

// --------------------------------------------------
// PLAYER RECORD CATEGORIES
// --------------------------------------------------

function playerCategories(
  entries: PlayerEntry[],
  period: Period
): Category<PlayerEntry>[] {
  const tieBreak = (
    a: PlayerEntry,
    b: PlayerEntry
  ) =>
    chronological(
      a.season,
      a.week,
      b.season,
      b.week
    ) ||
    a.playerId.localeCompare(
      b.playerId
    );

  function build(
    key: string,
    title: string,
    description: string,
    metric: (
      entry: PlayerEntry
    ) => number,
    direction:
      | "high"
      | "low" = "high",
    suffix = "pts",
    minimumStarts = 0,
    positiveOnly = false,
    format?: (
      entry: PlayerEntry
    ) => string
  ) {
    const eligible =
      entries.filter(
        entry =>
          entry.starts >= minimumStarts
      );

    return category(
      key,
      title,
      description,
      topTen(
        eligible,
        metric,
        direction,
        tieBreak,
        positiveOnly
      ),
      metric,
      format ??
        (entry => pts(metric(entry))),
      suffix
    );
  }

  if (period === "games") {
    return [
      build(
        "highestScore",
        "Highest Single-Game Score",
        "The greatest individual performances in SFL history.",
        r => r.points
      ),
      build(
        "lowestScore",
        "Lowest Single-Game Score",
        "The lowest scores recorded by a starting player.",
        r => r.points,
        "low"
      ),
    ];
  }

  if (period === "season") {
    return [
      build(
        "seasonPoints",
        "Most Points in a Season",
        "The highest individual season scoring totals.",
        r => r.points
      ),
      build(
        "seasonAverage",
        "Highest Points Per Start",
        "Best season averages with at least five starts.",
        r => r.average,
        "high",
        "pts/start",
        5
      ),
      build(
        "season20",
        "Most 20+ Point Games",
        "The most 20+ point performances in a season.",
        r => r.over20,
        "high",
        "games",
        0,
        true,
        r => String(r.over20)
      ),
      build(
        "season30",
        "Most 30+ Point Games",
        "The most 30+ point performances in a season.",
        r => r.over30,
        "high",
        "games",
        0,
        true,
        r => String(r.over30)
      ),
      build(
        "season40",
        "Most 40+ Point Games",
        "The most 40+ point performances in a season.",
        r => r.over40,
        "high",
        "games",
        0,
        true,
        r => String(r.over40)
      ),
    ];
  }

  return [
    build(
      "careerPoints",
      "Most Career Points",
      "The highest cumulative SFL scoring totals.",
      r => r.points
    ),
    build(
      "careerStarts",
      "Most Career Starts",
      "The most SFL starting appearances.",
      r => r.starts,
      "high",
      "starts",
      0,
      false,
      r => String(r.starts)
    ),
    build(
      "careerAverage",
      "Highest Career Points Per Start",
      "The best averages among players with at least ten starts.",
      r => r.average,
      "high",
      "pts/start",
      10
    ),
    build(
      "careerFranchises",
      "Most Franchises Represented",
      "The most different SFL franchises a player has started for. Historical franchise renames count as one.",
      r => r.franchisesRepresented,
      "high",
      "teams",
      0,
      true,
      r => String(r.franchisesRepresented)
    ),
    build(
      "career20",
      "Most Career 20+ Point Games",
      "The most career games scoring 20+ points.",
      r => r.over20,
      "high",
      "games",
      0,
      true,
      r => String(r.over20)
    ),
    build(
      "career30",
      "Most Career 30+ Point Games",
      "The most career games scoring 30+ points.",
      r => r.over30,
      "high",
      "games",
      0,
      true,
      r => String(r.over30)
    ),
    build(
      "career40",
      "Most Career 40+ Point Games",
      "The most career games scoring 40+ points.",
      r => r.over40,
      "high",
      "games",
      0,
      true,
      r => String(r.over40)
    ),
  ];
}

// --------------------------------------------------
// PLAYER CHAMPIONSHIP CATEGORIES
// --------------------------------------------------

function championshipEntries(
  records: PlayerChampionshipRecord[],
  directory: Record<
    string,
    PlayerRecordIdentity
  >,
  positions: string[]
): ChampionshipEntry[] {
  const allowed = new Set(positions);

  return records
    .filter(record =>
      allowed.has(
        directory[record.playerId]
          ?.position ?? "UNKNOWN"
      )
    )
    .map(record => ({
      ...record,
      name:
        directory[record.playerId]?.name ??
        `Player ${record.playerId}`,
      position:
        directory[record.playerId]?.position ??
        "UNKNOWN",
      rosterId:
        record.rosterIds[0] ?? 0,
    }));
}

function championshipCategories(
  entries: ChampionshipEntry[]
): Category<ChampionshipEntry>[] {
  const earliestSeason = (
    seasons: string[]
  ) =>
    Math.min(
      ...seasons.map(Number)
    );

  const tieBreak = (
    seasons: (
      entry: ChampionshipEntry
    ) => string[]
  ) => (
    a: ChampionshipEntry,
    b: ChampionshipEntry
  ) =>
    earliestSeason(seasons(a)) -
      earliestSeason(seasons(b)) ||
    a.playerId.localeCompare(b.playerId);

  // Slootbowl rings are ranked by total rings.
  // When totals match, more Slootbowl starts
  // take priority. The earliest championship
  // is used only if both values match.
  //
  // Shared official ranks are still determined
  // by ring totals in RecordCard.

  const ringTieBreak = (
    a: ChampionshipEntry,
    b: ChampionshipEntry
  ) =>
    b.slootbowlAppearances -
      a.slootbowlAppearances ||
    earliestSeason(a.ringSeasons) -
      earliestSeason(b.ringSeasons) ||
    a.playerId.localeCompare(b.playerId);

  return [
    category(
      "playerSlootbowlRings",
      "Most Slootbowl Rings",
      "Championships won while on the winning team's roster, including starters and bench players. Ties are ordered by Slootbowl starts.",
      topTen(
        entries,
        r => r.slootbowlRings,
        "high",
        ringTieBreak,
        true
      ),
      r => r.slootbowlRings,
      r => String(r.slootbowlRings),
      "rings",
      r =>
        `${r.starterRings} starter · ${r.benchRings} bench` +
        ` · ${r.slootbowlAppearances} Slootbowl starts` +
        (r.ringSeasons.length
          ? ` · ${r.ringSeasons.join(", ")}`
          : "")
    ),
    category(
      "playerSlootbowlAppearances",
      "Most Slootbowl Appearances",
      "Championship-game appearances as a starting player.",
      topTen(
        entries,
        r => r.slootbowlAppearances,
        "high",
        tieBreak(r => r.slootbowlSeasons),
        true
      ),
      r => r.slootbowlAppearances,
      r => String(r.slootbowlAppearances),
      "starts",
      r =>
        `${r.position} · ${r.slootbowlSeasons.join(", ")}`
    ),
    category(
      "playerConferenceChampionshipAppearances",
      "Most Conference Championship Appearances",
      "Conference championship appearances as a starting player.",
      topTen(
        entries,
        r => r.conferenceChampionshipAppearances,
        "high",
        tieBreak(
          r => r.conferenceChampionshipSeasons
        ),
        true
      ),
      r => r.conferenceChampionshipAppearances,
      r =>
        String(
          r.conferenceChampionshipAppearances
        ),
      "starts",
      r =>
        `${r.position} · ${r.conferenceChampionshipSeasons.join(", ")}`
    ),
  ];
}

function championshipRosterIds(
  entry: ChampionshipEntry,
  categoryKey: string
): number[] {
  if (categoryKey === "playerSlootbowlRings") {
    return uniqueRosterIds(
      entry.ringAppearances.map(
        appearance => appearance.rosterId
      )
    );
  }

  if (
    categoryKey ===
    "playerSlootbowlAppearances"
  ) {
    return uniqueRosterIds(
      entry.slootbowlGames.map(
        appearance => appearance.rosterId
      )
    );
  }

  return uniqueRosterIds(
    entry.conferenceChampionshipGames.map(
      appearance => appearance.rosterId
    )
  );
}

// --------------------------------------------------
// PLAYER FRANCHISE HISTORY
// --------------------------------------------------

function playerRosterIds(
  entry: PlayerEntry,
  period: Period
) {
  if (period === "games") {
    return [entry.rosterId];
  }

  return uniqueRosterIds(
    entry.weeks.map(
      week => week.rosterId
    )
  );
}

function playerTeams(
  entry: PlayerEntry,
  period: Period
) {
  if (period === "games") {
    return historicalName(
      entry.rosterId,
      entry.season
    );
  }

  if (period === "season") {
    const names = new Set(
      entry.weeks.map(week =>
        historicalName(
          week.rosterId,
          week.season
        )
      )
    );

    return Array.from(names).join(", ");
  }

  const names = new Set(
    entry.weeks.map(week =>
      currentName(week.rosterId)
    )
  );

  return Array.from(names).join(", ");
}

// --------------------------------------------------
// MAIN RECORDS PAGE
// --------------------------------------------------

export default function RecordsTabs({
  records,
  playerRecords,
}: {
  records: AllTimeRecords;
  playerRecords: PlayerRecords;
}) {
  const [scope, setScope] =
    useState<Scope>("franchises");

  const [
    competition,
    setCompetition,
  ] = useState<Competition>(
    "regularSeason"
  );

  const [period, setPeriod] =
    useState<Period>("games");

  const [
    selectedSeason,
    setSelectedSeason,
  ] = useState("all");

  const [
    positions,
    setPositions,
  ] = useState<string[]>([...POSITIONS]);

  const filteredFranchise =
    selectedSeason === "all"
      ? records
      : records.bySeason[
          selectedSeason
        ] ?? records;

  const selectedCompetition =
    playerRecords.competitions[
      competition
    ];

  const allowed = new Set(positions);

  const completed = new Set(
    playerRecords.completedSeasons[
      competition
    ]
  );

  const filteredWeeks =
    selectedCompetition.weekly.filter(
      week => {
        const position =
          playerRecords.players[
            week.playerId
          ]?.position ??
          "UNKNOWN";

        if (!allowed.has(position)) {
          return false;
        }

        if (period === "career") {
          return true;
        }

        if (
          selectedSeason !== "all" &&
          week.season !== selectedSeason
        ) {
          return false;
        }

        if (
          period === "season" &&
          selectedSeason === "all" &&
          !completed.has(week.season)
        ) {
          return false;
        }

        return true;
      }
    );

  const entries = playerEntries(
    filteredWeeks,
    period,
    playerRecords.players
  );

  const championshipLeaders =
    championshipEntries(
      playerRecords.championshipRecords,
      playerRecords.players,
      positions
    );

  const togglePosition = (
    position: string
  ) =>
    setPositions(current =>
      current.includes(position)
        ? current.filter(
            p => p !== position
          )
        : [...current, position]
    );

  const seasonComplete =
    selectedSeason === "all" ||
    (
      scope === "players"
        ? playerRecords.completedSeasons[
            competition
          ]
        : records.completedSeasons[
            competition
          ]
    ).includes(selectedSeason);

  const honours =
    achievementCategories(records);

  return (
    <div>
      <FilterHeading>
        RECORD TYPE
      </FilterHeading>

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

      <FilterHeading>
        COMPETITION
      </FilterHeading>

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

      <FilterHeading>
        RECORD PERIOD
      </FilterHeading>

      <div style={tabsStyle}>
        <TabButton
          label="Game"
          active={period === "games"}
          onClick={() =>
            setPeriod("games")
          }
        />

        <TabButton
          label="Season"
          active={period === "season"}
          onClick={() =>
            setPeriod("season")
          }
        />

        <TabButton
          label="Career"
          active={period === "career"}
          onClick={() =>
            setPeriod("career")
          }
        />
      </div>

      {scope === "players" && (
        <div style={{ marginBottom: 24 }}>
          <div style={filterHeadingRow}>
            <FilterHeading>
              PLAYER POSITIONS
            </FilterHeading>

            <button
              type="button"
              style={clearButtonStyle}
              onClick={() =>
                setPositions(
                  positions.length ===
                    POSITIONS.length
                    ? []
                    : [...POSITIONS]
                )
              }
            >
              {positions.length ===
              POSITIONS.length
                ? "Clear All"
                : "Select All"}
            </button>
          </div>

          <div style={positionRowStyle}>
            {POSITIONS.map(position => {
              const active =
                positions.includes(position);

              return (
                <button
                  key={position}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    togglePosition(position)
                  }
                  style={{
                    ...positionButtonStyle,
                    background: active
                      ? "#ffffff"
                      : "#151b23",
                    color: active
                      ? "#0b0f14"
                      : "#aeb8c5",
                    borderColor: active
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
            {positions.length
              ? `Showing ${POSITIONS.filter(
                  p => positions.includes(p)
                ).join(" + ")} records`
              : "Select at least one position."}
          </p>
        </div>
      )}

      {period !== "career" && (
        <div style={{ marginBottom: 24 }}>
          <FilterHeading>
            SEASON
          </FilterHeading>

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

            {(
              scope === "players"
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
                Season in Progress — these
                totals are provisional and
                excluded from all-season
                records until the competition
                is complete.
              </p>
            )}
        </div>
      )}

      {scope === "franchises" &&
        period === "games" && (
          <RecordSection
            key={`fg-${competition}-${selectedSeason}`}
            title="Individual Game"
            subtitle="The greatest performances, closest finishes and most spectacular disasters."
            categories={gameCategories(
              filteredFranchise.individualGame[
                competition
              ],
              filteredFranchise.leaderboards
                .individualGame[competition]
            )}
            primaryLabel={r =>
              historicalName(
                r.rosterId,
                r.season
              )
            }
            detailLabel={r =>
              `${historicalName(
                r.rosterId,
                r.season
              )} ${pts(r.score)} vs ` +
              `${historicalName(
                r.opponentRosterId,
                r.season
              )} ${pts(r.opponentScore)}`
            }
            metaLabel={r =>
              `${r.season} · Week ${r.week} · ${r.phase}`
            }
            logoIds={r => [r.rosterId]}
          />
        )}

      {scope === "franchises" &&
        period === "season" && (
          <RecordSection
            key={`fs-${competition}-${selectedSeason}`}
            title="Season Long"
            subtitle="The best and worst campaigns across SFL history."
            categories={seasonCategories(
              filteredFranchise.season[
                competition
              ],
              filteredFranchise.leaderboards
                .season[competition],
              competition
            )}
            primaryLabel={r =>
              historicalName(
                r.rosterId,
                r.season
              )
            }
            detailLabel={r =>
              `${r.wins}W-${r.losses}L` +
              (r.ties
                ? `-${r.ties}T`
                : "")
            }
            metaLabel={r => r.season}
            logoIds={r => [r.rosterId]}
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
                  subtitle="Championship glory and runner-up finishes."
                  categories={honours.slice(0, 3)}
                  primaryLabel={r =>
                    currentName(r.rosterId)
                  }
                  logoIds={r => [r.rosterId]}
                />

                <RecordSection
                  title="Playoff History"
                  subtitle="Main winners-bracket records only."
                  categories={honours.slice(3)}
                  primaryLabel={r =>
                    currentName(r.rosterId)
                  }
                  logoIds={r => [r.rosterId]}
                />
              </>
            )}

            <RecordSection
              title="Historical Streaks"
              subtitle="Winning and losing runs within the selected competition."
              categories={streakCategories(
                records,
                competition
              )}
              primaryLabel={r =>
                currentName(r.rosterId)
              }
              logoIds={r => [r.rosterId]}
            />

            {competition ===
              "regularSeason" && (
              <RecordSection
                title="Career Totals"
                subtitle="All-time franchise totals across regular-season and main-playoff games."
                categories={franchiseCareerCategories(
                  records.allTime,
                  records.allTimeLeaderboards
                )}
                primaryLabel={r =>
                  currentName(r.rosterId)
                }
                detailLabel={r =>
                  `${r.wins}W-${r.losses}L` +
                  (r.ties
                    ? `-${r.ties}T`
                    : "")
                }
                logoIds={r => [r.rosterId]}
              />
            )}
          </>
        )}

      {scope === "players" &&
        positions.length > 0 && (
          <>
            {competition === "mainPlayoffs" &&
              period === "career" && (
                <ChampionshipRecordSection
                  categories={championshipCategories(
                    championshipLeaders
                  )}
                />
              )}

            <RecordSection
              key={`p-${period}-${competition}-${selectedSeason}-${positions.join("-")}`}
              title={
                period === "games"
                  ? "Player Game Records"
                  : period === "season"
                  ? "Player Season Records"
                  : "Player Career Records"
              }
              subtitle={
                "Started players only. " +
                (competition === "regularSeason"
                  ? "Regular-season performances."
                  : "Main winners-bracket performances only.")
              }
              categories={playerCategories(
                entries,
                period
              )}
              primaryLabel={r => r.name}
              detailLabel={r =>
                `${r.position} · ${playerTeams(
                  r,
                  period
                )}`
              }
              metaLabel={r =>
                period === "games"
                  ? `${r.season} · Week ${r.week}`
                  : period === "season"
                  ? `${r.season} · ${r.starts} starts`
                  : `${r.starts} career starts`
              }
              logoIds={r =>
                playerRosterIds(r, period)
              }
            />
          </>
        )}

      {scope === "players" &&
        positions.length === 0 && (
          <p style={noticeStyle}>
            Select at least one position to
            view player records.
          </p>
        )}
    </div>
  );
}

// --------------------------------------------------
// CHAMPIONSHIP RECORD DISPLAY
// --------------------------------------------------

function ChampionshipRecordSection({
  categories,
}: {
  categories: Category<ChampionshipEntry>[];
}) {
  return (
    <section style={{ marginBottom: 32 }}>
      <div style={sectionHeadingRow}>
        <div style={headingAccent} />

        <h2 style={sectionHeading}>
          Player Championship Honours
        </h2>
      </div>

      <p style={sectionSubtitle}>
        Slootbowl rings include starters and
        bench players. Championship and
        conference appearances count starts
        only.
      </p>

      {categories.map(item => (
        <RecordCard
          key={item.key}
          item={item}
          primaryLabel={r => r.name}
          detailLabel={item.detail}
          metaLabel={r => r.position}
          logoIds={r =>
            championshipRosterIds(
              r,
              item.key
            )
          }
        />
      ))}
    </section>
  );
}

// --------------------------------------------------
// SHARED UI COMPONENTS
// --------------------------------------------------

function FilterHeading({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <p style={filterHeadingStyle}>
      {children}
    </p>
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

function RecordSection<
  T extends { rosterId: number }
>({
  title,
  subtitle,
  categories,
  primaryLabel,
  detailLabel,
  metaLabel,
  logoIds,
}: {
  title: string;
  subtitle: string;
  categories: Category<T>[];
  primaryLabel: (entry: T) => string;
  detailLabel?: (entry: T) => string;
  metaLabel?: (entry: T) => string;
  logoIds: (entry: T) => number[];
}) {
  return (
    <section style={{ marginBottom: 32 }}>
      <div style={sectionHeadingRow}>
        <div style={headingAccent} />

        <h2 style={sectionHeading}>
          {title}
        </h2>
      </div>

      <p style={sectionSubtitle}>
        {subtitle}
      </p>

      {categories.map(item => (
        <RecordCard
          key={item.key}
          item={item}
          primaryLabel={primaryLabel}
          detailLabel={
            item.detail ?? detailLabel
          }
          metaLabel={metaLabel}
          logoIds={logoIds}
        />
      ))}
    </section>
  );
}

function RecordCard<
  T extends { rosterId: number }
>({
  item,
  primaryLabel,
  detailLabel,
  metaLabel,
  logoIds,
}: {
  item: Category<T>;
  primaryLabel: (entry: T) => string;
  detailLabel?: (entry: T) => string;
  metaLabel?: (entry: T) => string;
  logoIds: (entry: T) => number[];
}) {
  const [expanded, setExpanded] =
    useState(false);

  const entries =
    item.leaderboard.slice(0, LIMIT);

  const leader = entries[0];

  if (!leader) {
    return null;
  }

  const jointCount = entries.filter(
    entry =>
      rounded(item.metric(entry)) ===
      rounded(item.metric(leader))
  ).length;

  let previousValue: number | null = null;
  let previousRank = 0;

  const rankedEntries = entries.map(
    (entry, index) => {
      const value = rounded(
        item.metric(entry)
      );

      const rank =
        previousValue === value
          ? previousRank
          : index + 1;

      previousValue = value;
      previousRank = rank;

      return {
        entry,
        rank,
      };
    }
  );

  const remainingEntries =
    rankedEntries.slice(1);

  return (
    <article style={cardStyle}>
      <div style={cardHeaderStyle}>
        <div
          style={{
            flex: 1,
            minWidth: 0,
          }}
        >
          <p style={cardLabel}>
            {item.title.toUpperCase()}
          </p>

          <p style={cardDescription}>
            {item.description}
          </p>
        </div>

        {jointCount > 1 && (
          <span style={jointBadge}>
            JOINT
          </span>
        )}
      </div>

      <div style={holderLayout}>
        <FranchiseLogos
          rosterIds={logoIds(leader)}
          size="large"
        />

        <div
          style={{
            flex: 1,
            minWidth: 0,
          }}
        >
          <div style={valueRow}>
            <h3 style={valueText}>
              {item.format(leader)}
            </h3>

            {item.suffix && (
              <span style={suffixText}>
                {item.suffix}
              </span>
            )}
          </div>

          <p style={primaryText}>
            {primaryLabel(leader)}
          </p>

          {detailLabel && (
            <p style={detailText}>
              {detailLabel(leader)}
            </p>
          )}

          {metaLabel && (
            <p style={metaText}>
              {metaLabel(leader)}
            </p>
          )}
        </div>
      </div>

      {jointCount > 1 && (
        <p style={jointNotice}>
          {jointCount} entries share this
          record within the top ten.
          Earliest achievement is listed
          first.
        </p>
      )}

      {remainingEntries.length > 0 && (
        <>
          <button
            type="button"
            aria-expanded={expanded}
            onClick={() =>
              setExpanded(value => !value)
            }
            style={expandButton}
          >
            <span>
              {expanded
                ? "Hide leaderboard"
                : `View leaderboard (${remainingEntries.length})`}
            </span>

            <span aria-hidden="true">
              {expanded ? "▲" : "▼"}
            </span>
          </button>

          {expanded && (
            <div
              style={leaderboardContainer}
            >
              <p style={leaderboardHeading}>
                HISTORICAL LEADERBOARD
              </p>

              {remainingEntries.map(
                ({ entry, rank }, index) => (
                  <div
                    key={`${item.key}-${index + 1}`}
                    style={{
                      ...leaderboardRow,
                      borderBottom:
                        index ===
                        remainingEntries.length - 1
                          ? "none"
                          : "1px solid #27303b",
                    }}
                  >
                    <div style={rankText}>
                      {rank}
                    </div>

                    <FranchiseLogos
                      rosterIds={logoIds(entry)}
                      size="small"
                    />

                    <div style={leaderboardInfo}>
                      <p style={leaderboardName}>
                        {primaryLabel(entry)}
                      </p>

                      {detailLabel && (
                        <p
                          style={leaderboardDetail}
                        >
                          {detailLabel(entry)}
                        </p>
                      )}

                      {metaLabel && (
                        <p
                          style={leaderboardMeta}
                        >
                          {metaLabel(entry)}
                        </p>
                      )}
                    </div>

                    <div
                      style={leaderboardValue}
                    >
                      {item.format(entry)}
                    </div>
                  </div>
                )
              )}

              <p style={leaderboardFootnote}>
                Positions two through ten.
                The record holder is shown
                above. Ties retain their
                shared ranking and are
                ordered by earliest
                achievement where dates
                are available.
              </p>
            </div>
          )}
        </>
      )}
    </article>
  );
}

// --------------------------------------------------
// STYLES
// --------------------------------------------------

const tabsStyle: CSSProperties = {
  display: "flex",
  background: "#151b23",
  border: "1px solid #27303b",
  borderRadius: 14,
  padding: 4,
  marginBottom: 24,
  gap: 3,
};

const filterHeadingStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 1,
  color: "#aeb8c5",
  marginBottom: 10,
};

const filterHeadingRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const clearButtonStyle: CSSProperties = {
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

const selectStyle: CSSProperties = {
  width: "100%",
  padding: "13px 14px",
  background: "#151b23",
  border: "1px solid #27303b",
  borderRadius: 12,
  color: "#ffffff",
  fontSize: 14,
};

const noticeStyle: CSSProperties = {
  marginTop: 12,
  marginBottom: 20,
  fontSize: 12,
  color: "#aeb8c5",
  lineHeight: 1.6,
};

const sectionHeadingRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginBottom: 8,
};

const headingAccent: CSSProperties = {
  width: 4,
  height: 26,
  background: "#ffffff",
  borderRadius: 4,
  flexShrink: 0,
};

const sectionHeading: CSSProperties = {
  margin: 0,
  fontSize: 24,
};

const sectionSubtitle: CSSProperties = {
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

const cardLabel: CSSProperties = {
  margin: 0,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 1,
  color: "#aeb8c5",
};

const cardDescription: CSSProperties = {
  marginTop: 7,
  marginBottom: 0,
  fontSize: 12,
  lineHeight: 1.5,
  color: "#687384",
};

const holderLayout: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 16,
  marginTop: 20,
  minWidth: 0,
};

const valueRow: CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  gap: 7,
  flexWrap: "wrap",
};

const valueText: CSSProperties = {
  margin: 0,
  fontSize: 32,
  fontWeight: 800,
  letterSpacing: -1,
  fontVariantNumeric: "tabular-nums",
  overflowWrap: "anywhere",
};

const suffixText: CSSProperties = {
  fontSize: 13,
  color: "#aeb8c5",
};

const primaryText: CSSProperties = {
  marginTop: 10,
  marginBottom: 4,
  color: "#ffffff",
  fontWeight: 700,
  fontSize: 15,
};

const detailText: CSSProperties = {
  marginTop: 5,
  marginBottom: 0,
  fontSize: 13,
  lineHeight: 1.5,
  color: "#d0d7e0",
  overflowWrap: "anywhere",
};

const metaText: CSSProperties = {
  marginTop: 8,
  marginBottom: 0,
  fontSize: 12,
  color: "#8793a3",
};

const jointBadge: CSSProperties = {
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: 0.8,
  color: "#ffffff",
  border: "1px solid #475569",
  borderRadius: 6,
  padding: "5px 7px",
  whiteSpace: "nowrap",
};

const jointNotice: CSSProperties = {
  marginTop: 16,
  marginBottom: 0,
  color: "#aeb8c5",
  fontSize: 12,
  lineHeight: 1.5,
};

const expandButton: CSSProperties = {
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

const leaderboardContainer: CSSProperties = {
  marginTop: 16,
  paddingTop: 14,
  borderTop: "1px solid #27303b",
};

const leaderboardHeading: CSSProperties = {
  marginTop: 0,
  marginBottom: 10,
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: 1,
  color: "#8793a3",
};

const leaderboardRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 9,
  padding: "13px 0",
};

const rankText: CSSProperties = {
  width: 20,
  flexShrink: 0,
  fontSize: 13,
  fontWeight: 800,
  color: "#aeb8c5",
};

const leaderboardInfo: CSSProperties = {
  flex: 1,
  minWidth: 0,
};

const leaderboardName: CSSProperties = {
  margin: 0,
  fontSize: 13,
  fontWeight: 700,
  color: "#ffffff",
  overflowWrap: "anywhere",
};

const leaderboardDetail: CSSProperties = {
  marginTop: 5,
  marginBottom: 0,
  fontSize: 12,
  lineHeight: 1.5,
  color: "#aeb8c5",
  overflowWrap: "anywhere",
};

const leaderboardMeta: CSSProperties = {
  marginTop: 5,
  marginBottom: 0,
  fontSize: 11,
  color: "#687384",
};

const leaderboardValue: CSSProperties = {
  flexShrink: 0,
  fontSize: 14,
  fontWeight: 800,
  color: "#ffffff",
  fontVariantNumeric: "tabular-nums",
};

const leaderboardFootnote: CSSProperties = {
  marginTop: 12,
  marginBottom: 0,
  fontSize: 11,
  lineHeight: 1.5,
  color: "#687384",
};
