
"use client";

import { useState } from "react";

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

import { getFranchiseName } from "../../lib/franchises";

type RecordsTab = "games" | "season" | "allTime";
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
};

const formatPoints = (value: number) =>
  value.toFixed(2);

const formatDifferential = (value: number) =>
  value >= 0
    ? `+${value.toFixed(2)}`
    : value.toFixed(2);

function franchiseName(rosterId: number) {
  return getFranchiseName(rosterId);
}

function matchupLabel(record: LeagueRecord) {
  return (
    `${franchiseName(record.rosterId)} ` +
    `${record.score.toFixed(2)} vs ` +
    `${franchiseName(record.opponentRosterId)} ` +
    `${record.opponentScore.toFixed(2)}`
  );
}

function gameDescription(record: LeagueRecord) {
  return (
    `${record.season} · Week ${record.week} · ` +
    record.phase
  );
}

function seasonDescription(record: SeasonRecord) {
  return (
    `${record.season} · ` +
    `${record.wins}W-${record.losses}L` +
    (record.ties ? `-${record.ties}T` : "")
  );
}

function careerDescription(
  record: AllTimeFranchiseRecord
) {
  return (
    `${record.wins}W-${record.losses}L` +
    (record.ties ? `-${record.ties}T` : "")
  );
}

function buildGameCategories(
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
      metric: (r) => r.score,
      format: (r) => formatPoints(r.score),
      suffix: "pts",
    },
    {
      key: "lowestTeamScore",
      title: "Lowest Team Score",
      description:
        "The most miserable single-game totals.",
      record: records.lowestTeamScore,
      leaderboard: leaders.lowestTeamScore,
      metric: (r) => r.score,
      format: (r) => formatPoints(r.score),
      suffix: "pts",
    },
    {
      key: "biggestWinningMargin",
      title: "Biggest Winning Margin",
      description:
        "The most comprehensive demolitions.",
      record: records.biggestWinningMargin,
      leaderboard: leaders.biggestWinningMargin,
      metric: (r) => r.margin,
      format: (r) => formatPoints(r.margin),
      suffix: "pts",
    },
    {
      key: "closestGame",
      title: "Closest Game",
      description:
        "Matches decided by the smallest margins.",
      record: records.closestGame,
      leaderboard: leaders.closestGame,
      metric: (r) => r.margin,
      format: (r) => formatPoints(r.margin),
      suffix: "pts",
    },
    {
      key: "highestCombinedScore",
      title: "Highest Combined Score",
      description:
        "The biggest shootouts in SFL history.",
      record: records.highestCombinedScore,
      leaderboard: leaders.highestCombinedScore,
      metric: (r) =>
        r.score + r.opponentScore,
      format: (r) =>
        formatPoints(r.score + r.opponentScore),
      suffix: "pts",
    },
    {
      key: "lowestCombinedScore",
      title: "Lowest Combined Score",
      description:
        "Two teams united in offensive incompetence.",
      record: records.lowestCombinedScore,
      leaderboard: leaders.lowestCombinedScore,
      metric: (r) =>
        r.score + r.opponentScore,
      format: (r) =>
        formatPoints(r.score + r.opponentScore),
      suffix: "pts",
    },
    {
      key: "highestLosingScore",
      title: "Highest Losing Score",
      description:
        "Outstanding performances rewarded with defeat.",
      record: records.highestLosingScore,
      leaderboard: leaders.highestLosingScore,
      metric: (r) => r.score,
      format: (r) => formatPoints(r.score),
      suffix: "pts",
    },
    {
      key: "lowestWinningScore",
      title: "Lowest Winning Score",
      description:
        "Proof that sometimes both teams deserve to lose.",
      record: records.lowestWinningScore,
      leaderboard: leaders.lowestWinningScore,
      metric: (r) => r.score,
      format: (r) => formatPoints(r.score),
      suffix: "pts",
    },
    {
      key: "mostPointsConcededInVictory",
      title: "Most Points Conceded in a Victory",
      description:
        "The highest opponent scores overcome in victory.",
      record: records.mostPointsConcededInVictory,
      leaderboard:
        leaders.mostPointsConcededInVictory,
      metric: (r) => r.opponentScore,
      format: (r) =>
        formatPoints(r.opponentScore),
      suffix: "pts",
    },
  ];
}

function buildSeasonCategories(
  records: SeasonRecordSet,
  leaders: SeasonLeaderboardSet,
  competition: Competition
): RecordCategory<SeasonRecord>[] {
  const categories: RecordCategory<SeasonRecord>[] = [
    {
      key: "mostWins",
      title: "Most Wins",
      description:
        "The most successful individual seasons.",
      record: records.mostWins,
      leaderboard: leaders.mostWins,
      metric: (r) => r.wins,
      format: (r) => `${r.wins}`,
      suffix: "wins",
    },
    {
      key: "mostPointsFor",
      title: "Most Points Scored",
      description:
        "The highest season-long scoring totals.",
      record: records.mostPointsFor,
      leaderboard: leaders.mostPointsFor,
      metric: (r) => r.pointsFor,
      format: (r) => formatPoints(r.pointsFor),
      suffix: "pts",
    },
    {
      key: "mostPointsAgainst",
      title: "Most Points Conceded",
      description:
        "The unluckiest defensive records.",
      record: records.mostPointsAgainst,
      leaderboard: leaders.mostPointsAgainst,
      metric: (r) => r.pointsAgainst,
      format: (r) =>
        formatPoints(r.pointsAgainst),
      suffix: "pts",
    },
    {
      key: "mostGamesOver150",
      title: "Most 150+ Point Games",
      description:
        "The most games scoring at least 150 points in a single season.",
      record: records.mostGamesOver150,
      leaderboard: leaders.mostGamesOver150,
      metric: (r) => r.gamesOver150,
      format: (r) => `${r.gamesOver150}`,
      suffix: "games",
    },
    {
      key: "mostGames100OrFewer",
      title: "Most Games Scoring 100 or Fewer",
      description:
        "The most games scoring 100 points or less in a single season.",
      record: records.mostGames100OrFewer,
      leaderboard: leaders.mostGames100OrFewer,
      metric: (r) => r.games100OrFewer,
      format: (r) => `${r.games100OrFewer}`,
      suffix: "games",
    },
  ];

  if (competition === "mainPlayoffs") {
    return categories;
  }

  return [
    categories[0],
    {
      key: "fewestWins",
      title: "Fewest Wins",
      description:
        "The bleakest regular-season campaigns.",
      record: records.fewestWins,
      leaderboard: leaders.fewestWins,
      metric: (r) => r.wins,
      format: (r) => `${r.wins}`,
      suffix: "wins",
    },
    categories[1],
    {
      key: "fewestPointsFor",
      title: "Fewest Points Scored",
      description:
        "The lowest season-long scoring totals.",
      record: records.fewestPointsFor,
      leaderboard: leaders.fewestPointsFor,
      metric: (r) => r.pointsFor,
      format: (r) => formatPoints(r.pointsFor),
      suffix: "pts",
    },
    categories[2],
    {
      key: "fewestPointsAgainst",
      title: "Fewest Points Conceded",
      description:
        "The lowest points-against totals.",
      record: records.fewestPointsAgainst,
      leaderboard: leaders.fewestPointsAgainst,
      metric: (r) => r.pointsAgainst,
      format: (r) =>
        formatPoints(r.pointsAgainst),
      suffix: "pts",
    },
    {
      key: "bestPointDifferential",
      title: "Best Point Differential",
      description:
        "The most dominant scoring advantages.",
      record: records.bestPointDifferential,
      leaderboard: leaders.bestPointDifferential,
      metric: (r) => r.pointDifferential,
      format: (r) =>
        formatDifferential(r.pointDifferential),
      suffix: "pts",
    },
    {
      key: "worstPointDifferential",
      title: "Worst Point Differential",
      description:
        "The largest season-long scoring deficits.",
      record: records.worstPointDifferential,
      leaderboard: leaders.worstPointDifferential,
      metric: (r) => r.pointDifferential,
      format: (r) =>
        formatDifferential(r.pointDifferential),
      suffix: "pts",
    },
    categories[3],
    categories[4],
  ];
}

function buildAllTimeCategories(
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
      metric: (r) => r.wins,
      format: (r) => `${r.wins}`,
      suffix: "wins",
    },
    {
      key: "fewestWins",
      title: "Fewest Career Wins",
      description:
        "The franchises with the fewest victories.",
      record: records.fewestWins,
      leaderboard: leaders.fewestWins,
      metric: (r) => r.wins,
      format: (r) => `${r.wins}`,
      suffix: "wins",
    },
    {
      key: "mostPointsFor",
      title: "Most Career Points",
      description:
        "The greatest cumulative scoring totals.",
      record: records.mostPointsFor,
      leaderboard: leaders.mostPointsFor,
      metric: (r) => r.pointsFor,
      format: (r) => formatPoints(r.pointsFor),
      suffix: "pts",
    },
    {
      key: "mostPointsAgainst",
      title: "Most Career Points Conceded",
      description:
        "The most punishment absorbed over time.",
      record: records.mostPointsAgainst,
      leaderboard: leaders.mostPointsAgainst,
      metric: (r) => r.pointsAgainst,
      format: (r) =>
        formatPoints(r.pointsAgainst),
      suffix: "pts",
    },
    {
      key: "bestPointDifferential",
      title: "Best Career Point Differential",
      description:
        "The greatest cumulative scoring advantages.",
      record: records.bestPointDifferential,
      leaderboard: leaders.bestPointDifferential,
      metric: (r) => r.pointDifferential,
      format: (r) =>
        formatDifferential(r.pointDifferential),
      suffix: "pts",
    },
    {
      key: "worstPointDifferential",
      title: "Worst Career Point Differential",
      description:
        "The greatest cumulative scoring deficits.",
      record: records.worstPointDifferential,
      leaderboard: leaders.worstPointDifferential,
      metric: (r) => r.pointDifferential,
      format: (r) =>
        formatDifferential(r.pointDifferential),
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
      metric: (r) => r.championships,
      format: (r) => `${r.championships}`,
      suffix: "titles",
    },
    {
      key: "slootbowlAppearances",
      title: "Slootbowl Appearances",
      description:
        "Reaching the championship game, whether victorious or not.",
      record:
        leaders.slootbowlAppearances[0] ?? null,
      leaderboard: leaders.slootbowlAppearances,
      metric: (r) => r.slootbowlAppearances,
      format: (r) => `${r.slootbowlAppearances}`,
      suffix: "appearances",
    },
    {
      key: "runnerUpFinishes",
      title: "Slootbowl Runner-Up Finishes",
      description:
        "Getting all the way to the final, only to lose.",
      record: leaders.runnerUpFinishes[0] ?? null,
      leaderboard: leaders.runnerUpFinishes,
      metric: (r) => r.runnerUpFinishes,
      format: (r) => `${r.runnerUpFinishes}`,
      suffix: "finishes",
    },
    {
      key: "playoffAppearances",
      title: "Most Playoff Appearances",
      description:
        "Seasons spent competing in the main winners bracket.",
      record: leaders.playoffAppearances[0] ?? null,
      leaderboard: leaders.playoffAppearances,
      metric: (r) => r.playoffAppearances,
      format: (r) => `${r.playoffAppearances}`,
      suffix: "seasons",
    },
    {
      key: "playoffWins",
      title: "Most Playoff Wins",
      description:
        "Wins in the main winners bracket only. No toilet bowl or placement games.",
      record: leaders.playoffWins[0] ?? null,
      leaderboard: leaders.playoffWins,
      metric: (r) => r.playoffWins,
      format: (r) => `${r.playoffWins}`,
      suffix: "wins",
    },
    {
      key: "playoffLosses",
      title: "Most Playoff Losses",
      description:
        "Defeats in the main winners bracket only.",
      record: leaders.playoffLosses[0] ?? null,
      leaderboard: leaders.playoffLosses,
      metric: (r) => r.playoffLosses,
      format: (r) => `${r.playoffLosses}`,
      suffix: "losses",
    },
  ];
}

function achievementDetail(
  record: FranchiseAchievement,
  key: string
): string {
  const years =
    key === "championships"
      ? record.championshipSeasons
      : key === "slootbowlAppearances"
        ? record.slootbowlSeasons
        : key === "runnerUpFinishes"
          ? record.runnerUpSeasons
          : key === "playoffAppearances"
            ? record.playoffSeasons
            : [];

  if (years.length > 0) {
    return years.join(" · ");
  }

  if (
    key === "playoffWins" ||
    key === "playoffLosses"
  ) {
    return (
      `${record.playoffWins}W · ` +
      `${record.playoffLosses}L` +
      (record.playoffTies
        ? ` · ${record.playoffTies}T`
        : "")
    );
  }

  return "";
}

function streakCategories(
  records: AllTimeRecords
): RecordCategory<StreakRecord>[] {
  const streaks =
    records.historicalAchievements.streaks;

  return [
    {
      key: "regularSeasonWinning",
      title: "Longest Regular-Season Winning Streak",
      description:
        "Consecutive regular-season victories. Streaks can carry into the next season.",
      record: streaks.regularSeasonWinning[0] ?? null,
      leaderboard: streaks.regularSeasonWinning,
      metric: (r) => r.length,
      format: (r) => `${r.length}`,
      suffix: "wins",
    },
    {
      key: "regularSeasonLosing",
      title: "Longest Regular-Season Losing Streak",
      description:
        "Consecutive regular-season defeats. The sort of consistency nobody wants.",
      record: streaks.regularSeasonLosing[0] ?? null,
      leaderboard: streaks.regularSeasonLosing,
      metric: (r) => r.length,
      format: (r) => `${r.length}`,
      suffix: "losses",
    },
    {
      key: "mainPlayoffsWinning",
      title: "Longest Playoff Winning Streak",
      description:
        "Consecutive victories in the main winners bracket, across seasons.",
      record: streaks.mainPlayoffsWinning[0] ?? null,
      leaderboard: streaks.mainPlayoffsWinning,
      metric: (r) => r.length,
      format: (r) => `${r.length}`,
      suffix: "wins",
    },
    {
      key: "mainPlayoffsLosing",
      title: "Longest Playoff Losing Streak",
      description:
        "Consecutive main-playoff defeats across appearances.",
      record: streaks.mainPlayoffsLosing[0] ?? null,
      leaderboard: streaks.mainPlayoffsLosing,
      metric: (r) => r.length,
      format: (r) => `${r.length}`,
      suffix: "losses",
    },
  ];
}

function streakDescription(record: StreakRecord) {
  const start =
    `${record.startSeason} W${record.startWeek}`;

  const end =
    `${record.endSeason} W${record.endWeek}`;

  return start === end
    ? start
    : `${start} → ${end}`;
}

export default function RecordsTabs({
  records,
}: {
  records: AllTimeRecords;
}) {
  const [activeTab, setActiveTab] =
    useState<RecordsTab>("games");

  const [selectedSeason, setSelectedSeason] =
    useState("all");

  const [competition, setCompetition] =
    useState<Competition>("regularSeason");

  const filteredRecords =
    selectedSeason === "all"
      ? records
      : records.bySeason[selectedSeason] ?? records;

  const isSeasonComplete =
    selectedSeason === "all" ||
    records.completedSeasons[competition].includes(
      selectedSeason
    );

  const achievements =
    achievementCategories(records);

  return (
    <div>
      <div style={tabsStyle}>
        <TabButton
          label="Game"
          active={activeTab === "games"}
          onClick={() => setActiveTab("games")}
        />

        <TabButton
          label="Season"
          active={activeTab === "season"}
          onClick={() => setActiveTab("season")}
        />

        <TabButton
          label="All-Time"
          active={activeTab === "allTime"}
          onClick={() => setActiveTab("allTime")}
        />
      </div>

      {activeTab !== "allTime" && (
        <div style={{ marginBottom: "26px" }}>
          <p style={subheadingStyle}>SEASON</p>

          <select
            value={selectedSeason}
            onChange={(event) =>
              setSelectedSeason(event.target.value)
            }
            style={selectStyle}
          >
            <option value="all">
              All Seasons
            </option>

            {records.availableSeasons.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          <p style={subheadingStyle}>
            COMPETITION
          </p>

          <div style={competitionTabsStyle}>
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

          {activeTab === "season" &&
            !isSeasonComplete && (
              <p style={noticeStyle}>
                Season in Progress — these totals
                are provisional and are excluded
                from all-season records until
                this competition is complete.
              </p>
            )}
        </div>
      )}

      {activeTab === "games" && (
        <RecordSection
          key={`games-${selectedSeason}-${competition}`}
          title="Individual Game"
          subtitle="The greatest performances, closest finishes and most spectacular disasters."
          categories={buildGameCategories(
            filteredRecords.individualGame[
              competition
            ],
            filteredRecords.leaderboards.individualGame[
              competition
            ]
          )}
          primaryLabel={(record) =>
            franchiseName(record.rosterId)
          }
          detailLabel={matchupLabel}
          metaLabel={gameDescription}
        />
      )}

      {activeTab === "season" && (
        <RecordSection
          key={`season-${selectedSeason}-${competition}`}
          title="Season Long"
          subtitle="The best and worst campaigns across SFL history."
          categories={buildSeasonCategories(
            filteredRecords.season[
              competition
            ],
            filteredRecords.leaderboards.season[
              competition
            ],
            competition
          )}
          primaryLabel={(record) =>
            franchiseName(record.rosterId)
          }
          detailLabel={seasonDescription}
          metaLabel={(record) => record.season}
        />
      )}

      {activeTab === "allTime" && (
        <div>
          <RecordSection
            title="Slootbowl Honours"
            subtitle="Championship glory and the heartbreak of finishing second."
            categories={achievements.slice(0, 3)}
            primaryLabel={(record) =>
              franchiseName(record.rosterId)
            }
            detailLabel={(record) =>
              achievementDetail(
                record,
                activeAchievementKey(
                  record,
                  achievements.slice(0, 3)
                )
              )
            }
            metaLabel={() => ""}
            categoryAwareDetail
          />

          <RecordSection
            title="Playoff History"
            subtitle="Only the main winners bracket counts. Toilet bowl and placement games are excluded."
            categories={achievements.slice(3)}
            primaryLabel={(record) =>
              franchiseName(record.rosterId)
            }
            detailLabel={() => ""}
            metaLabel={() => ""}
            categoryAwareDetail
          />

          <RecordSection
            title="Historical Streaks"
            subtitle="Uninterrupted runs of wins or defeats, tracked separately by competition."
            categories={streakCategories(records)}
            primaryLabel={(record) =>
              franchiseName(record.rosterId)
            }
            detailLabel={streakDescription}
            metaLabel={() => ""}
          />

          <RecordSection
            title="Career Totals"
            subtitle="The cumulative achievements and embarrassments of the SFL's ten franchises."
            categories={buildAllTimeCategories(
              records.allTime,
              records.allTimeLeaderboards
            )}
            primaryLabel={(record) =>
              franchiseName(record.rosterId)
            }
            detailLabel={careerDescription}
            metaLabel={() => ""}
          />
        </div>
      )}
    </div>
  );
}

/*
 * Category-aware detail labels let the
 * achievement cards show the correct
 * seasons for each individual award.
 */

function activeAchievementKey(
  _record: FranchiseAchievement,
  categories: RecordCategory<FranchiseAchievement>[]
): string {
  return categories[0]?.key ?? "";
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
  categoryAwareDetail = false,
}: {
  title: string;
  subtitle: string;
  categories: RecordCategory<T>[];
  primaryLabel: (record: T) => string;
  detailLabel: (record: T) => string;
  metaLabel: (record: T) => string;
  categoryAwareDetail?: boolean;
}) {
  return (
    <section style={{ marginBottom: "32px" }}>
      <SectionHeading title={title} />

      <p style={sectionDescriptionStyle}>
        {subtitle}
      </p>

      {categories.map((category) => {
        const actualDetailLabel =
          categoryAwareDetail
            ? (record: T) =>
                achievementDetail(
                  record as FranchiseAchievement,
                  category.key
                )
            : detailLabel;

        return (
          <ExpandableRecordCard
            key={category.key}
            category={category}
            primaryLabel={primaryLabel}
            detailLabel={actualDetailLabel}
            metaLabel={metaLabel}
          />
        );
      })}
    </section>
  );
}

function ExpandableRecordCard<
  T extends { rosterId: number }
>({
  category,
  primaryLabel,
  detailLabel,
  metaLabel,
}: {
  category: RecordCategory<T>;
  primaryLabel: (record: T) => string;
  detailLabel: (record: T) => string;
  metaLabel: (record: T) => string;
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

  const leadingValue = Math.round(
    (metric(record) + Number.EPSILON) * 100
  );

  const jointHolders = leaderboard.filter(
    (entry) =>
      Math.round(
        (metric(entry) + Number.EPSILON) * 100
      ) === leadingValue
  );

  const isJointRecord =
    jointHolders.length > 1;

  let previousMetric: number | null = null;
  let previousRank = 0;

  return (
    <article style={cardStyle}>
      <div style={cardHeaderStyle}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={labelStyle}>
            {category.title.toUpperCase()}
          </p>

          <p style={descriptionStyle}>
            {category.description}
          </p>
        </div>

        {isJointRecord && (
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

      {detailLabel(record) && (
        <p style={detailStyle}>
          {detailLabel(record)}
        </p>
      )}

      {metaLabel(record) && (
        <p style={metaStyle}>
          {metaLabel(record)}
        </p>
      )}

      {isJointRecord && (
        <p style={jointNoticeStyle}>
          {jointHolders.length} performances
          share this record.
        </p>
      )}

      {leaderboard.length > 1 && (
        <>
          <button
            type="button"
            onClick={() =>
              setExpanded(!expanded)
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
                  const currentMetric =
                    Math.round(
                      (
                        metric(entry) +
                        Number.EPSILON
                      ) * 100
                    );

                  const rank =
                    previousMetric === currentMetric
                      ? previousRank
                      : index + 1;

                  previousMetric =
                    currentMetric;

                  previousRank = rank;

                  return (
                    <div
                      key={`${category.key}-${index}`}
                      style={{
                        ...leaderboardRowStyle,
                        borderBottom:
                          index ===
                          leaderboard.length - 1
                            ? "none"
                            : "1px solid #27303b",
                      }}
                    >
                      <div style={rankStyle}>
                        {rank}
                      </div>

                      <div style={leaderboardInfoStyle}>
                        <p style={leaderboardTeamStyle}>
                          {primaryLabel(entry)}
                        </p>

                        {detailLabel(entry) && (
                          <p style={leaderboardDetailStyle}>
                            {detailLabel(entry)}
                          </p>
                        )}

                        {metaLabel(entry) && (
                          <p style={leaderboardMetaStyle}>
                            {metaLabel(entry)}
                          </p>
                        )}
                      </div>

                      <div style={leaderboardValueStyle}>
                        {format(entry)}
                      </div>
                    </div>
                  );
                }
              )}

              <p style={leaderboardFootnoteStyle}>
                Top ten entries, including
                ties at the cutoff.
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
        borderRadius: "10px",
        padding: "11px 5px",
        background: active
          ? "#ffffff"
          : "transparent",
        color: active
          ? "#0b0f14"
          : "#aeb8c5",
        fontSize: "13px",
        fontWeight: "700",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

function SectionHeading({
  title,
}: {
  title: string;
}) {
  return (
    <div style={sectionHeadingStyle}>
      <div style={headingAccentStyle} />

      <h2 style={headingStyle}>
        {title}
      </h2>
    </div>
  );
}

const tabsStyle = {
  display: "flex",
  background: "#151b23",
  border: "1px solid #27303b",
  borderRadius: "14px",
  padding: "4px",
  marginBottom: "24px",
  gap: "3px",
};

const competitionTabsStyle = {
  display: "flex",
  background: "#151b23",
  border: "1px solid #27303b",
  borderRadius: "12px",
  padding: "4px",
  gap: "3px",
};

const selectStyle = {
  width: "100%",
  padding: "13px 14px",
  background: "#151b23",
  border: "1px solid #27303b",
  borderRadius: "12px",
  color: "#ffffff",
  fontSize: "14px",
  marginBottom: "20px",
};

const cardStyle = {
  background: "#151b23",
  border: "1px solid #27303b",
  borderRadius: "18px",
  padding: "18px",
  marginBottom: "12px",
  overflow: "hidden" as const,
};

const cardHeaderStyle = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "10px",
};

const valueRowStyle = {
  display: "flex",
  alignItems: "baseline",
  gap: "7px",
  marginTop: "14px",
  flexWrap: "wrap" as const,
};

const valueStyle = {
  margin: 0,
  fontSize: "32px",
  fontWeight: "800",
  letterSpacing: "-1px",
  fontVariantNumeric: "tabular-nums" as const,
};

const labelStyle = {
  margin: 0,
  fontSize: "11px",
  fontWeight: "700",
  letterSpacing: "1px",
  color: "#aeb8c5",
};

const descriptionStyle = {
  marginTop: "7px",
  marginBottom: 0,
  fontSize: "12px",
  lineHeight: "1.5",
  color: "#687384",
};

const suffixStyle = {
  fontSize: "13px",
  color: "#aeb8c5",
};

const teamStyle = {
  marginTop: "10px",
  marginBottom: "4px",
  color: "#ffffff",
  fontWeight: "700",
  fontSize: "15px",
};

const detailStyle = {
  marginTop: "5px",
  marginBottom: 0,
  fontSize: "13px",
  lineHeight: "1.5",
  color: "#d0d7e0",
  overflowWrap: "anywhere" as const,
};

const metaStyle = {
  marginTop: "8px",
  marginBottom: 0,
  fontSize: "12px",
  color: "#8793a3",
};

const subheadingStyle = {
  fontSize: "11px",
  fontWeight: "700",
  letterSpacing: "1px",
  color: "#aeb8c5",
  marginBottom: "10px",
};

const noticeStyle = {
  marginTop: "12px",
  fontSize: "12px",
  color: "#aeb8c5",
  lineHeight: "1.6",
};

const sectionHeadingStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  marginBottom: "8px",
};

const headingAccentStyle = {
  width: "4px",
  height: "26px",
  background: "#ffffff",
  borderRadius: "4px",
  flexShrink: 0,
};

const headingStyle = {
  margin: 0,
  fontSize: "24px",
};

const sectionDescriptionStyle = {
  marginTop: "0",
  marginBottom: "20px",
  color: "#aeb8c5",
  fontSize: "13px",
  lineHeight: "1.6",
};

const jointBadgeStyle = {
  fontSize: "10px",
  fontWeight: "800",
  letterSpacing: "0.8px",
  color: "#ffffff",
  border: "1px solid #475569",
  borderRadius: "6px",
  padding: "5px 7px",
  whiteSpace: "nowrap" as const,
};

const jointNoticeStyle = {
  marginTop: "10px",
  marginBottom: 0,
  color: "#aeb8c5",
  fontSize: "12px",
};

const expandButtonStyle = {
  display: "flex",
  width: "100%",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: "18px",
  padding: "13px 2px 2px",
  border: "none",
  borderTop: "1px solid #27303b",
  background: "transparent",
  color: "#ffffff",
  fontSize: "13px",
  fontWeight: "700",
  textAlign: "left" as const,
  cursor: "pointer",
};

const leaderboardStyle = {
  marginTop: "16px",
  paddingTop: "14px",
  borderTop: "1px solid #27303b",
};

const leaderboardHeadingStyle = {
  marginTop: 0,
  marginBottom: "10px",
  fontSize: "10px",
  fontWeight: "800",
  letterSpacing: "1px",
  color: "#8793a3",
};

const leaderboardRowStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: "10px",
  padding: "13px 0",
};

const rankStyle = {
  width: "24px",
  flexShrink: 0,
  fontSize: "13px",
  fontWeight: "800",
  color: "#aeb8c5",
};

const leaderboardInfoStyle = {
  flex: 1,
  minWidth: 0,
};

const leaderboardTeamStyle = {
  margin: 0,
  fontSize: "13px",
  fontWeight: "700",
  color: "#ffffff",
  overflowWrap: "anywhere" as const,
};

const leaderboardDetailStyle = {
  marginTop: "5px",
  marginBottom: 0,
  fontSize: "12px",
  lineHeight: "1.5",
  color: "#aeb8c5",
  overflowWrap: "anywhere" as const,
};

const leaderboardMetaStyle = {
  marginTop: "5px",
  marginBottom: 0,
  fontSize: "11px",
  color: "#687384",
};

const leaderboardValueStyle = {
  flexShrink: 0,
  fontSize: "14px",
  fontWeight: "800",
  color: "#ffffff",
  fontVariantNumeric: "tabular-nums" as const,
};

const leaderboardFootnoteStyle = {
  marginTop: "12px",
  marginBottom: 0,
  fontSize: "11px",
  lineHeight: "1.5",
  color: "#687384",
};
