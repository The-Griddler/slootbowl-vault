
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
  detail?: (record: T) => string;
};

const points = (value: number) => value.toFixed(2);

const differential = (value: number) =>
  value >= 0
    ? `+${value.toFixed(2)}`
    : value.toFixed(2);

const franchise = (id: number) =>
  getFranchiseName(id);

function matchupDetail(r: LeagueRecord) {
  return (
    `${franchise(r.rosterId)} ${points(r.score)} vs ` +
    `${franchise(r.opponentRosterId)} ` +
    `${points(r.opponentScore)}`
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
      description: "The greatest single-game team performances.",
      record: records.highestTeamScore,
      leaderboard: leaders.highestTeamScore,
      metric: r => r.score,
      format: r => points(r.score),
      suffix: "pts",
    },
    {
      key: "lowestTeamScore",
      title: "Lowest Team Score",
      description: "The most miserable single-game totals.",
      record: records.lowestTeamScore,
      leaderboard: leaders.lowestTeamScore,
      metric: r => r.score,
      format: r => points(r.score),
      suffix: "pts",
    },
    {
      key: "biggestWinningMargin",
      title: "Biggest Winning Margin",
      description: "The most comprehensive demolitions.",
      record: records.biggestWinningMargin,
      leaderboard: leaders.biggestWinningMargin,
      metric: r => r.margin,
      format: r => points(r.margin),
      suffix: "pts",
    },
    {
      key: "closestGame",
      title: "Closest Game",
      description: "Matches decided by the smallest margins.",
      record: records.closestGame,
      leaderboard: leaders.closestGame,
      metric: r => r.margin,
      format: r => points(r.margin),
      suffix: "pts",
    },
    {
      key: "highestCombinedScore",
      title: "Highest Combined Score",
      description: "The biggest shootouts in SFL history.",
      record: records.highestCombinedScore,
      leaderboard: leaders.highestCombinedScore,
      metric: r => r.score + r.opponentScore,
      format: r => points(r.score + r.opponentScore),
      suffix: "pts",
    },
    {
      key: "lowestCombinedScore",
      title: "Lowest Combined Score",
      description: "Two teams united in offensive incompetence.",
      record: records.lowestCombinedScore,
      leaderboard: leaders.lowestCombinedScore,
      metric: r => r.score + r.opponentScore,
      format: r => points(r.score + r.opponentScore),
      suffix: "pts",
    },
    {
      key: "highestLosingScore",
      title: "Highest Losing Score",
      description: "Outstanding performances rewarded with defeat.",
      record: records.highestLosingScore,
      leaderboard: leaders.highestLosingScore,
      metric: r => r.score,
      format: r => points(r.score),
      suffix: "pts",
    },
    {
      key: "lowestWinningScore",
      title: "Lowest Winning Score",
      description: "Proof that sometimes both teams deserve to lose.",
      record: records.lowestWinningScore,
      leaderboard: leaders.lowestWinningScore,
      metric: r => r.score,
      format: r => points(r.score),
      suffix: "pts",
    },
    {
      key: "mostPointsConcededInVictory",
      title: "Most Points Conceded in a Victory",
      description: "The highest opponent scores overcome in victory.",
      record: records.mostPointsConcededInVictory,
      leaderboard: leaders.mostPointsConcededInVictory,
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
  const mostWins: RecordCategory<SeasonRecord> = {
    key: "mostWins",
    title: "Most Wins",
    description: "The most successful individual seasons.",
    record: records.mostWins,
    leaderboard: leaders.mostWins,
    metric: r => r.wins,
    format: r => `${r.wins}`,
    suffix: "wins",
  };

  const mostPoints: RecordCategory<SeasonRecord> = {
    key: "mostPointsFor",
    title: "Most Points Scored",
    description: "The highest season-long scoring totals.",
    record: records.mostPointsFor,
    leaderboard: leaders.mostPointsFor,
    metric: r => r.pointsFor,
    format: r => points(r.pointsFor),
    suffix: "pts",
  };

  const mostAgainst: RecordCategory<SeasonRecord> = {
    key: "mostPointsAgainst",
    title: "Most Points Conceded",
    description: "The unluckiest defensive records.",
    record: records.mostPointsAgainst,
    leaderboard: leaders.mostPointsAgainst,
    metric: r => r.pointsAgainst,
    format: r => points(r.pointsAgainst),
    suffix: "pts",
  };

  const over150: RecordCategory<SeasonRecord> = {
    key: "mostGamesOver150",
    title: "Most 150+ Point Games",
    description: "The most games scoring at least 150 points in a season.",
    record: records.mostGamesOver150,
    leaderboard: leaders.mostGamesOver150,
    metric: r => r.gamesOver150,
    format: r => `${r.gamesOver150}`,
    suffix: "games",
  };

  const under100: RecordCategory<SeasonRecord> = {
    key: "mostGames100OrFewer",
    title: "Most Games Scoring 100 or Fewer",
    description: "The most games scoring 100 points or less in a season.",
    record: records.mostGames100OrFewer,
    leaderboard: leaders.mostGames100OrFewer,
    metric: r => r.games100OrFewer,
    format: r => `${r.games100OrFewer}`,
    suffix: "games",
  };

  // Playoffs: only the two meaningful season totals.
  if (competition === "mainPlayoffs") {
    return [mostPoints, mostAgainst];
  }

  return [
    mostWins,
    {
      key: "fewestWins",
      title: "Fewest Wins",
      description: "The bleakest regular-season campaigns.",
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
      description: "The lowest season-long scoring totals.",
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
      description: "The lowest points-against totals.",
      record: records.fewestPointsAgainst,
      leaderboard: leaders.fewestPointsAgainst,
      metric: r => r.pointsAgainst,
      format: r => points(r.pointsAgainst),
      suffix: "pts",
    },
    {
      key: "bestPointDifferential",
      title: "Best Point Differential",
      description: "The most dominant scoring advantages.",
      record: records.bestPointDifferential,
      leaderboard: leaders.bestPointDifferential,
      metric: r => r.pointDifferential,
      format: r => differential(r.pointDifferential),
      suffix: "pts",
    },
    {
      key: "worstPointDifferential",
      title: "Worst Point Differential",
      description: "The largest season-long scoring deficits.",
      record: records.worstPointDifferential,
      leaderboard: leaders.worstPointDifferential,
      metric: r => r.pointDifferential,
      format: r => differential(r.pointDifferential),
      suffix: "pts",
    },
    over150,
    under100,
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
      description: "The winningest franchises in SFL history.",
      record: records.mostWins,
      leaderboard: leaders.mostWins,
      metric: r => r.wins,
      format: r => `${r.wins}`,
      suffix: "wins",
    },
    {
      key: "mostPointsFor",
      title: "Most Career Points",
      description: "The greatest cumulative scoring totals.",
      record: records.mostPointsFor,
      leaderboard: leaders.mostPointsFor,
      metric: r => r.pointsFor,
      format: r => points(r.pointsFor),
      suffix: "pts",
    },
    {
      key: "mostPointsAgainst",
      title: "Most Career Points Conceded",
      description: "The most punishment absorbed over time.",
      record: records.mostPointsAgainst,
      leaderboard: leaders.mostPointsAgainst,
      metric: r => r.pointsAgainst,
      format: r => points(r.pointsAgainst),
      suffix: "pts",
    },
    {
      key: "bestPointDifferential",
      title: "Best Career Point Differential",
      description: "The greatest cumulative scoring advantages.",
      record: records.bestPointDifferential,
      leaderboard: leaders.bestPointDifferential,
      metric: r => r.pointDifferential,
      format: r => differential(r.pointDifferential),
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
      description: "The franchises that have lifted the Slootbowl trophy.",
      record: leaders.championships[0] ?? null,
      leaderboard: leaders.championships,
      metric: r => r.championships,
      format: r => `${r.championships}`,
      suffix: "titles",
      detail: r => r.championshipSeasons.join(" · "),
    },
    {
      key: "slootbowlAppearances",
      title: "Slootbowl Appearances",
      description: "Reaching the championship game, whether victorious or not.",
      record: leaders.slootbowlAppearances[0] ?? null,
      leaderboard: leaders.slootbowlAppearances,
      metric: r => r.slootbowlAppearances,
      format: r => `${r.slootbowlAppearances}`,
      suffix: "appearances",
      detail: r => r.slootbowlSeasons.join(" · "),
    },
    {
      key: "runnerUpFinishes",
      title: "Slootbowl Runner-Up Finishes",
      description: "Getting all the way to the final, only to lose.",
      record: leaders.runnerUpFinishes[0] ?? null,
      leaderboard: leaders.runnerUpFinishes,
      metric: r => r.runnerUpFinishes,
      format: r => `${r.runnerUpFinishes}`,
      suffix: "finishes",
      detail: r => r.runnerUpSeasons.join(" · "),
    },
    {
      key: "playoffAppearances",
      title: "Most Playoff Appearances",
      description: "Seasons competing in the main winners bracket.",
      record: leaders.playoffAppearances[0] ?? null,
      leaderboard: leaders.playoffAppearances,
      metric: r => r.playoffAppearances,
      format: r => `${r.playoffAppearances}`,
      suffix: "seasons",
      detail: r => r.playoffSeasons.join(" · "),
    },
    {
      key: "playoffWins",
      title: "Most Playoff Wins",
      description: "Main winners-bracket wins only. No toilet bowl or placement games.",
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
      description: "Defeats in the main winners bracket only.",
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
  records: AllTimeRecords
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

  return [
    {
      key: "regularSeasonWinning",
      title: "Longest Regular-Season Winning Streak",
      description: "Consecutive regular-season victories, including across seasons.",
      record: leaders.regularSeasonWinning[0] ?? null,
      leaderboard: leaders.regularSeasonWinning,
      metric: r => r.length,
      format: r => `${r.length}`,
      suffix: "wins",
      detail: period,
    },
    {
      key: "regularSeasonLosing",
      title: "Longest Regular-Season Losing Streak",
      description: "Consecutive regular-season defeats.",
      record: leaders.regularSeasonLosing[0] ?? null,
      leaderboard: leaders.regularSeasonLosing,
      metric: r => r.length,
      format: r => `${r.length}`,
      suffix: "losses",
      detail: period,
    },
    {
      key: "mainPlayoffsWinning",
      title: "Longest Playoff Winning Streak",
      description: "Consecutive main-playoff victories across seasons.",
      record: leaders.mainPlayoffsWinning[0] ?? null,
      leaderboard: leaders.mainPlayoffsWinning,
      metric: r => r.length,
      format: r => `${r.length}`,
      suffix: "wins",
      detail: period,
    },
    {
      key: "mainPlayoffsLosing",
      title: "Longest Playoff Losing Streak",
      description: "Consecutive main-playoff defeats across appearances.",
      record: leaders.mainPlayoffsLosing[0] ?? null,
      leaderboard: leaders.mainPlayoffsLosing,
      metric: r => r.length,
      format: r => `${r.length}`,
      suffix: "losses",
      detail: period,
    },
  ];
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

  const filtered =
    selectedSeason === "all"
      ? records
      : records.bySeason[selectedSeason] ?? records;

  const seasonComplete =
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
        <div style={{ marginBottom: 26 }}>
          <p style={subheadingStyle}>SEASON</p>

          <select
            value={selectedSeason}
            onChange={e =>
              setSelectedSeason(e.target.value)
            }
            style={selectStyle}
          >
            <option value="all">
              All Seasons
            </option>
            {records.availableSeasons.map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          <p style={subheadingStyle}>
            COMPETITION
          </p>

          <div style={tabsStyle}>
            <TabButton
              label="Regular Season"
              active={competition === "regularSeason"}
              onClick={() =>
                setCompetition("regularSeason")
              }
            />
            <TabButton
              label="Main Playoffs"
              active={competition === "mainPlayoffs"}
              onClick={() =>
                setCompetition("mainPlayoffs")
              }
            />
          </div>

          {activeTab === "season" &&
            !seasonComplete && (
              <p style={noticeStyle}>
                Season in Progress — these totals
                are provisional and excluded
                from all-season records until
                the competition is complete.
              </p>
            )}
        </div>
      )}

      {activeTab === "games" && (
        <RecordSection
          key={`games-${selectedSeason}-${competition}`}
          title="Individual Game"
          subtitle="The greatest performances, closest finishes and most spectacular disasters."
          categories={gameCategories(
            filtered.individualGame[competition],
            filtered.leaderboards.individualGame[
              competition
            ]
          )}
          primaryLabel={r => franchise(r.rosterId)}
          defaultDetail={matchupDetail}
          metaLabel={gameMeta}
        />
      )}

      {activeTab === "season" && (
        <RecordSection
          key={`season-${selectedSeason}-${competition}`}
          title="Season Long"
          subtitle="The best and worst campaigns across SFL history."
          categories={seasonCategories(
            filtered.season[competition],
            filtered.leaderboards.season[
              competition
            ],
            competition
          )}
          primaryLabel={r => franchise(r.rosterId)}
          defaultDetail={seasonDetail}
          metaLabel={r => r.season}
        />
      )}

      {activeTab === "allTime" && (
        <>
          <RecordSection
            title="Slootbowl Honours"
            subtitle="Championship glory and the heartbreak of finishing second."
            categories={achievements.slice(0, 3)}
            primaryLabel={r => franchise(r.rosterId)}
          />

          <RecordSection
            title="Playoff History"
            subtitle="Main winners-bracket results only. No toilet bowl or placement games."
            categories={achievements.slice(3)}
            primaryLabel={r => franchise(r.rosterId)}
          />

          <RecordSection
            title="Historical Streaks"
            subtitle="Winning and losing runs, tracked separately by competition."
            categories={streakCategories(records)}
            primaryLabel={r => franchise(r.rosterId)}
          />

          <RecordSection
            title="Career Totals"
            subtitle="The cumulative achievements and embarrassments of the SFL's ten franchises."
            categories={careerCategories(
              records.allTime,
              records.allTimeLeaderboards
            )}
            primaryLabel={r => franchise(r.rosterId)}
            defaultDetail={careerDetail}
          />
        </>
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
        <h2 style={headingStyle}>{title}</h2>
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
            category.detail ?? defaultDetail
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
  const [expanded, setExpanded] = useState(false);

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
      (metric(entry) + Number.EPSILON) * 100
    );

  const leaderValue = normalized(record);

  const jointCount = leaderboard.filter(
    entry => normalized(entry) === leaderValue
  ).length;

  let previousValue: number | null = null;
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
          {jointCount} entries share this record.
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

              {leaderboard.map((entry, index) => {
                const currentValue =
                  normalized(entry);

                const rank =
                  previousValue === currentValue
                    ? previousRank
                    : index + 1;

                previousValue = currentValue;
                previousRank = rank;

                return (
                  <div
                    key={`${category.key}-${index}`}
                    style={{
                      ...leaderboardRowStyle,
                      borderBottom:
                        index === leaderboard.length - 1
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

                      {detailLabel?.(entry) && (
                        <p style={leaderboardDetailStyle}>
                          {detailLabel(entry)}
                        </p>
                      )}

                      {metaLabel?.(entry) && (
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
              })}

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

const tabsStyle = {
  display: "flex",
  background: "#151b23",
  border: "1px solid #27303b",
  borderRadius: 14,
  padding: 4,
  marginBottom: 24,
  gap: 3,
};

const selectStyle = {
  width: "100%",
  padding: "13px 14px",
  background: "#151b23",
  border: "1px solid #27303b",
  borderRadius: 12,
  color: "#ffffff",
  fontSize: 14,
  marginBottom: 20,
};

const subheadingStyle = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 1,
  color: "#aeb8c5",
  marginBottom: 10,
};

const noticeStyle = {
  marginTop: 12,
  fontSize: 12,
  color: "#aeb8c5",
  lineHeight: 1.6,
};

const headingRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginBottom: 8,
};

const headingAccentStyle = {
  width: 4,
  height: 26,
  background: "#ffffff",
  borderRadius: 4,
  flexShrink: 0,
};

const headingStyle = {
  margin: 0,
  fontSize: 24,
};

const sectionDescriptionStyle = {
  marginTop: 0,
  marginBottom: 20,
  color: "#aeb8c5",
  fontSize: 13,
  lineHeight: 1.6,
};

const cardStyle = {
  background: "#151b23",
  border: "1px solid #27303b",
  borderRadius: 18,
  padding: 18,
  marginBottom: 12,
  overflow: "hidden" as const,
};

const cardHeaderStyle = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 10,
};

const labelStyle = {
  margin: 0,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 1,
  color: "#aeb8c5",
};

const descriptionStyle = {
  marginTop: 7,
  marginBottom: 0,
  fontSize: 12,
  lineHeight: 1.5,
  color: "#687384",
};

const valueRowStyle = {
  display: "flex",
  alignItems: "baseline",
  gap: 7,
  marginTop: 14,
  flexWrap: "wrap" as const,
};

const valueStyle = {
  margin: 0,
  fontSize: 32,
  fontWeight: 800,
  letterSpacing: -1,
  fontVariantNumeric: "tabular-nums" as const,
};

const suffixStyle = {
  fontSize: 13,
  color: "#aeb8c5",
};

const teamStyle = {
  marginTop: 10,
  marginBottom: 4,
  color: "#ffffff",
  fontWeight: 700,
  fontSize: 15,
};

const detailStyle = {
  marginTop: 5,
  marginBottom: 0,
  fontSize: 13,
  lineHeight: 1.5,
  color: "#d0d7e0",
  overflowWrap: "anywhere" as const,
};

const metaStyle = {
  marginTop: 8,
  marginBottom: 0,
  fontSize: 12,
  color: "#8793a3",
};

const jointBadgeStyle = {
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: 0.8,
  color: "#ffffff",
  border: "1px solid #475569",
  borderRadius: 6,
  padding: "5px 7px",
  whiteSpace: "nowrap" as const,
};

const jointNoticeStyle = {
  marginTop: 10,
  marginBottom: 0,
  color: "#aeb8c5",
  fontSize: 12,
};

const expandButtonStyle = {
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
  textAlign: "left" as const,
  cursor: "pointer",
};

const leaderboardStyle = {
  marginTop: 16,
  paddingTop: 14,
  borderTop: "1px solid #27303b",
};

const leaderboardHeadingStyle = {
  marginTop: 0,
  marginBottom: 10,
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: 1,
  color: "#8793a3",
};

const leaderboardRowStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: 10,
  padding: "13px 0",
};

const rankStyle = {
  width: 24,
  flexShrink: 0,
  fontSize: 13,
  fontWeight: 800,
  color: "#aeb8c5",
};

const leaderboardInfoStyle = {
  flex: 1,
  minWidth: 0,
};

const leaderboardTeamStyle = {
  margin: 0,
  fontSize: 13,
  fontWeight: 700,
  color: "#ffffff",
  overflowWrap: "anywhere" as const,
};

const leaderboardDetailStyle = {
  marginTop: 5,
  marginBottom: 0,
  fontSize: 12,
  lineHeight: 1.5,
  color: "#aeb8c5",
  overflowWrap: "anywhere" as const,
};

const leaderboardMetaStyle = {
  marginTop: 5,
  marginBottom: 0,
  fontSize: 11,
  color: "#687384",
};

const leaderboardValueStyle = {
  flexShrink: 0,
  fontSize: 14,
  fontWeight: 800,
  color: "#ffffff",
  fontVariantNumeric: "tabular-nums" as const,
};

const leaderboardFootnoteStyle = {
  marginTop: 12,
  marginBottom: 0,
  fontSize: 11,
  lineHeight: 1.5,
  color: "#687384",
};
