
import Link from "next/link";
import type { CSSProperties } from "react";
import {
  getHistoricalData,
  type HistoricalMatchup,
} from "../../../../../lib/sleeper";

type PageProps = {
  params: Promise<{
    season: string;
    week: string;
  }>;
};

type TeamStats = {
  id: number;
  name: string;
  manager: string;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  average: number;
  recentWins: number;
  recentGames: number;
  latestPoints: number;
  latestMargin: number;
  latestWon: boolean;
  score: number;
  rank: number;
  previousRank: number | null;
};

const TEAMS: Record<number, string> = {
  1: "Mt Isa Ballbags",
  2: "Cambridge Cum Sluts",
  3: "Grimsby Chode Chokers",
  4: "Isle of Wight Happy Endings",
  5: "Grays Town Fingerblasters",
  6: "Lincoln Nonces",
  7: "Kalamata Dirty Vegans",
  8: "Weybiza BAB’s",
  9: "East Rutherford Shitlickers",
  10: "Chad Moist Discharge",
};

const MANAGERS: Record<number, string> = {
  1: "Ed Nelms",
  2: "Ben Smith",
  3: "Jake Greenwood",
  4: "George Pendleton",
  5: "Ryan Whiting",
  6: "Garrett Etheridge",
  7: "Ollie Payne",
  8: "Jack Brannigan",
  9: "Tarl Brayer",
  10: "Josh Thomas",
};

const CONFERENCES: Record<number, string> = {
  1: "GPFC",
  2: "GPFC",
  3: "GPFC",
  4: "OBFC",
  5: "GPFC",
  6: "OBFC",
  7: "OBFC",
  8: "OBFC",
  9: "OBFC",
  10: "GPFC",
};

const PANEL: CSSProperties = {
  background: "#151b23",
  border: "1px solid #27303b",
  borderRadius: "18px",
  padding: "20px",
};

const MUTED = "#929eae";

const TIER_COLLECTIONS = [
  [
    "The Commissioner's Inner Circle",
    "Men Who Could Actually Win Something",
    "The Department of Wishful Thinking",
    "The League's Unflushable Turds",
  ],
  [
    "The Cocaine-Fuelled Champions League",
    "Dangerous Men With Questionable Intentions",
    "The Human Participation Trophies",
    "Should Be Investigated by the RSPCA",
  ],
  [
    "The Alleged Professional Football Teams",
    "Potentially Dangerous, Mostly to Themselves",
    "The Financially Irresponsible Middle Class",
    "Tenancy Agreement in the League Basement",
  ],
  [
    "The Elite Establishment",
    "One Injury Away From Public Humiliation",
    "The Great Unwashed",
    "The Emergency Contact List",
  ],
  [
    "People the Commissioner Respects",
    "Technically Still Contenders",
    "The Department of False Hope",
    "Whiting and Other Public Health Concerns",
  ],
  [
    "The SFL's Most Wanted",
    "Good Teams With Terrible Personalities",
    "The Inexplicably Employed",
    "The Footballing Witness Protection Programme",
  ],
];

function teamName(id: number, season: string) {
  if (id === 1 && Number(season) < 2026) {
    return "Perth Ballbags";
  }

  return TEAMS[id] ?? `Franchise ${id}`;
}

function points(value: number) {
  return value.toFixed(2);
}

function complete(game: HistoricalMatchup) {
  return (
    game.phase === "Regular Season" &&
    game.isComplete === true &&
    game.week >= 1 &&
    game.week <= 14 &&
    Number.isFinite(game.scoreA) &&
    Number.isFinite(game.scoreB) &&
    game.scoreA >= 0 &&
    game.scoreB >= 0 &&
    (game.scoreA > 0 || game.scoreB > 0)
  );
}

function completedWeeks(
  games: HistoricalMatchup[],
  throughWeek: number
) {
  const validWeeks = new Set<number>();

  for (let week = 1; week <= throughWeek; week++) {
    const fixtures = games.filter(
      (game) => game.week === week && complete(game)
    );

    const teams = new Set<number>();

    for (const fixture of fixtures) {
      teams.add(fixture.rosterA);
      teams.add(fixture.rosterB);
    }

    if (fixtures.length === 5 && teams.size === 10) {
      validWeeks.add(week);
    }
  }

  return validWeeks;
}

function calculateRankings(
  games: HistoricalMatchup[],
  season: string,
  throughWeek: number
): TeamStats[] {
  const validWeeks = completedWeeks(games, throughWeek);

  const eligible = games
    .filter(
      (game) =>
        validWeeks.has(game.week) &&
        complete(game)
    )
    .sort((a, b) => a.week - b.week);

  const teams: TeamStats[] = Array.from(
    { length: 10 },
    (_, index) => {
      const id = index + 1;

      return {
        id,
        name: teamName(id, season),
        manager: MANAGERS[id],
        wins: 0,
        losses: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        average: 0,
        recentWins: 0,
        recentGames: 0,
        latestPoints: 0,
        latestMargin: 0,
        latestWon: false,
        score: 0,
        rank: 0,
        previousRank: null,
      };
    }
  );

  const results = new Map<
    number,
    { week: number; scored: number; conceded: number; won: boolean }[]
  >();

  for (const team of teams) {
    results.set(team.id, []);
  }

  for (const game of eligible) {
    if (game.scoreA === game.scoreB) {
      continue;
    }

    results.get(game.rosterA)?.push({
      week: game.week,
      scored: game.scoreA,
      conceded: game.scoreB,
      won: game.scoreA > game.scoreB,
    });

    results.get(game.rosterB)?.push({
      week: game.week,
      scored: game.scoreB,
      conceded: game.scoreA,
      won: game.scoreB > game.scoreA,
    });
  }

  for (const team of teams) {
    const history = results.get(team.id) ?? [];
    const recent = history.slice(-3);
    const latest = history[history.length - 1];

    team.wins = history.filter(
      (game) => game.won
    ).length;

    team.losses = history.filter(
      (game) => !game.won
    ).length;

    team.pointsFor = history.reduce(
      (sum, game) => sum + game.scored,
      0
    );

    team.pointsAgainst = history.reduce(
      (sum, game) => sum + game.conceded,
      0
    );

    team.average = history.length
      ? team.pointsFor / history.length
      : 0;

    team.recentWins = recent.filter(
      (game) => game.won
    ).length;

    team.recentGames = recent.length;

    team.latestPoints = latest?.scored ?? 0;

    team.latestMargin = latest
      ? latest.scored - latest.conceded
      : 0;

    team.latestWon = latest?.won ?? false;

    const played = team.wins + team.losses;

    const winRate = played
      ? team.wins / played
      : 0;

    const recentRate = team.recentGames
      ? team.recentWins / team.recentGames
      : 0;

    // Genuine football performance is the
    // overwhelming basis of the rankings.
    const performance =
      team.average * 0.55 +
      winRate * 45 +
      recentRate * 24 +
      Math.max(
        -10,
        Math.min(10, team.latestMargin * 0.12)
      );

    // Editorial interference is intentionally
    // small enough to keep the rankings credible.
    const editorialAdjustment =
      team.id === 1
        ? 5
        : team.id === 5
          ? -4
          : team.id === 6
            ? -3
            : 0;

    team.score =
      performance + editorialAdjustment;
  }

  teams.sort(
    (a, b) =>
      b.score - a.score ||
      b.pointsFor - a.pointsFor ||
      a.id - b.id
  );

  return teams.map((team, index) => ({
    ...team,
    rank: index + 1,
  }));
}

function selectTiers(season: string, week: number) {
  const index =
    (Number(season) * 7 + week * 3) %
    TIER_COLLECTIONS.length;

  return TIER_COLLECTIONS[index];
}

function tierForRank(rank: number) {
  if (rank <= 2) return 0;
  if (rank <= 4) return 1;
  if (rank <= 7) return 2;
  return 3;
}

function movement(team: TeamStats) {
  if (team.previousRank === null) {
    return "NEW";
  }

  const change = team.previousRank - team.rank;

  if (change > 0) return `▲ ${change}`;
  if (change < 0) return `▼ ${Math.abs(change)}`;

  return "—";
}

function editorial(team: TeamStats, week: number) {
  const seed = (week + team.id * 7) % 3;

  if (team.id === 1) {
    if (team.latestWon) {
      return [
        "The commissioner has hailed this result as further proof that the Ballbags are the most exciting sporting institution since the invention of competitive drinking. Independent analysts have requested access to the evidence. Their requests have been denied.",
        "Another victory for the Ballbags, and another difficult week for those who insist that Ed Nelms should be judged by the same standards as the rest of the league. The newsroom considers such suggestions deeply offensive.",
        "The Ballbags continue their march towards whatever glorious destiny the commissioner has promised them this month. Sloot News has already begun preparing the commemorative merchandise.",
      ][seed];
    }

    return [
      "A defeat on paper, perhaps, but the commissioner's office has confirmed that the underlying performance was morally victorious. The investigation into why fantasy football insists on using actual scores is ongoing.",
      "The Ballbags have suffered a temporary setback. Sloot News understands that Ed Nelms has described the result as an encouraging sign of progress, although nobody has yet worked out what the fuck he was looking at.",
      "Critics will point to the defeat. Visionaries will point to the long-term project. The commissioner has asked us to remind readers that only one of these groups understands the Ballbags' true potential.",
    ][seed];
  }

  if (team.id === 5) {
    if (team.latestWon) {
      return [
        "Ryan Whiting has somehow won another football match. The newsroom congratulates him on this achievement and would like to clarify that a police investigation remains an option.",
        "Grays Town's latest victory is an unfortunate development for those of us who had already prepared several excellent jokes about Whiting's incompetence. We have decided to publish them anyway.",
        "The Fingerblasters are showing signs of genuine quality, an observation that has caused considerable distress within the Sloot News editorial department. We expect normal service to resume shortly.",
      ][seed];
    }

    return [
      "Ryan Whiting has once again demonstrated that owning a fantasy football team and being qualified to operate one are two very different things. The Fingerblasters' supporters deserve answers, or at least a refund.",
      "The newsroom has spent years investigating the Grays Town project. Our latest findings suggest that Whiting's greatest obstacle may be the continued involvement of Ryan Whiting.",
      "Another setback for the Fingerblasters. Sloot News has been advised that Whiting remains confident, which historically has not been a particularly reassuring sign.",
    ][seed];
  }

  if (team.id === 6) {
    if (team.latestWon) {
      return [
        "Garrett Etheridge has produced another impressive performance, confirming once again that Lincoln are capable of winning football matches during the portion of the calendar in which trophies are not awarded.",
        "The Nonces continue to look formidable. Sloot News would like to congratulate Garrett and remind readers that the regular season is not, technically speaking, the entire competition.",
        "Lincoln have impressed the statistical department. The historical department, however, would like to know whether Garrett intends to keep this up when the games start mattering.",
      ][seed];
    }

    return [
      "Lincoln's latest performance has raised an uncomfortable question: what happens if Garrett starts bottling it before the playoffs even arrive? The newsroom has requested an emergency meeting.",
      "Garrett Etheridge has built a reputation for impressive regular seasons followed by disappointment. This latest result suggests he may be experimenting with a more efficient timetable.",
      "The Nonces have stumbled, leaving Garrett to explain why a franchise with such lofty ambitions occasionally performs like somebody has unplugged the controller.",
    ][seed];
  }

  if (team.id === 10) {
    return [
      "Josh Thomas remains the owner of two consecutive Slootbowl titles, a deeply irritating fact that the editorial team is legally obliged to acknowledge. Whatever the latest result, Chad's history makes them difficult to dismiss.",
      "The Moist Discharge continue to operate according to a sporting philosophy best described as 'fuck around until December'. Unfortunately for the rest of the league, it has previously worked.",
      "Josh Thomas has already demonstrated that regular-season appearances can be deceiving. The newsroom is therefore refusing to declare Chad finished until somebody physically removes them from the postseason.",
    ][seed];
  }

  if (team.id === 9) {
    return [
      "Tarl Brayer knows all about building a competitive franchise. He also knows an extraordinary amount about losing important games by margins that would make a grown man consider moving to a remote island.",
      "East Rutherford remain capable of causing serious damage. Whether that damage will ultimately be inflicted on their opponents or Tarl's emotional wellbeing is another matter.",
      "The Shitlickers have the pedigree to frighten anybody in the OBFC. Their biggest enemy, as several painful chapters of SFL history suggest, may be the concept of hope itself.",
    ][seed];
  }

  if (team.id === 4) {
    return [
      "George Pendleton's championship pedigree remains undeniable. His ability to discuss that pedigree without sounding like an unbearable prick remains a work in progress.",
      "The Happy Endings have earned the right to be taken seriously, even if their manager has repeatedly demonstrated that he cannot be trusted with the resulting attention.",
      "George's franchise has spent years behaving like a genuine contender. The rest of the OBFC would appreciate it if he could occasionally develop a hobby.",
    ][seed];
  }

  if (team.id === 3) {
    return [
      "Jake Greenwood's Grimsby project remains an impressive monument to almost achieving something. The Chode Chokers have had plenty of chances to write a championship story and keep misplacing the final chapter.",
      "Grimsby have the look of a side capable of making noise. Whether that noise is a championship celebration or Jake swearing at his phone remains uncertain.",
      "The Chode Chokers continue to pursue their first Slootbowl title. Sloot News wishes Jake every success, largely because the resulting celebrations would probably be fucking unbearable.",
    ][seed];
  }

  if (team.id === 2) {
    return [
      "Ben Smith has already climbed the mountain once, winning the inaugural Slootbowl. Cambridge's current task is to prove that the franchise has something to offer beyond a very impressive collection of old photographs.",
      "The Cum Sluts remain a reminder that championship success is not necessarily a permanent condition. Ben will be hoping that his next great era arrives before everyone forgets the first one.",
      "Cambridge's place in SFL history is secure. Its place in the current power rankings, however, must unfortunately be determined by football rather than nostalgia.",
    ][seed];
  }

  if (team.id === 8) {
    return [
      "Jack Brannigan continues his campaign to prove that future draft picks are an unnecessary luxury. Weybiza supporters have been assured that everything is under control, which has done little to calm them.",
      "The BAB's have previously reached the Slootbowl, so the ambition is certainly there. Whether Jack's long-term planning survives contact with reality is less clear.",
      "Weybiza remain one of the league's more fascinating experiments in aggressive roster management. The results may eventually vindicate Jack, although the newsroom has declined to place a bet.",
    ][seed];
  }

  return [
    "Ollie Payne's Kalamata side remain a deeply unpredictable organisation. Some weeks they resemble a serious football team. Other weeks they resemble a cry for help.",
    "The Dirty Vegans continue to occupy that peculiar space between genuine danger and complete fucking nonsense. Ollie appears entirely comfortable with the arrangement.",
    "Kalamata's latest performance adds another chapter to a franchise history that could generously be described as inconsistent and less generously be described as a complete shitshow.",
  ][seed];
}

function formComment(team: TeamStats) {
  if (team.recentGames === 0) {
    return "The form department has nothing to report.";
  }

  if (team.recentWins === team.recentGames) {
    return `They've won all ${team.recentGames} of their most recent fixtures. Even the newsroom is struggling to find a way to call that bad football.`;
  }

  if (team.recentWins === 0) {
    return `They've lost their last ${team.recentGames} fixtures. At this point, the club might consider replacing its training facilities with a large bin.`;
  }

  return `Their last ${team.recentGames} fixtures have produced ${team.recentWins} wins, suggesting a side with enough talent to be dangerous and enough inconsistency to remain deeply annoying.`;
}

function rankingSummary(team: TeamStats) {
  const record = `${team.wins}-${team.losses}`;

  return `${record} record, ${points(team.average)} points per game and ${points(team.pointsFor)} total points scored. ${formComment(team)}`;
}

function SectionHeading({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div style={{ marginBottom: "18px" }}>
      <p
        style={{
          color: MUTED,
          fontSize: "11px",
          fontWeight: 800,
          letterSpacing: "2px",
          margin: "0 0 7px",
          textTransform: "uppercase",
        }}
      >
        {eyebrow}
      </p>

      <h2
        style={{
          fontSize: "25px",
          lineHeight: 1.2,
          margin: 0,
        }}
      >
        {title}
      </h2>
    </div>
  );
}

export default async function PowerRankings({
  params,
}: PageProps) {
  const { season, week } = await params;
  const weekNumber = Number(week);

  const seasons = await getHistoricalData();

  const selected = seasons.find(
    (item) => item.league.season === season
  );

  const validWeek =
    Number.isInteger(weekNumber) &&
    weekNumber >= 1 &&
    weekNumber <= 14;

  const games = selected?.matchups ?? [];

  const completed = validWeek
    ? completedWeeks(games, weekNumber)
    : new Set<number>();

  const ready =
    validWeek && completed.has(weekNumber);

  let rankings: TeamStats[] = [];

  if (ready) {
    rankings = calculateRankings(
      games,
      season,
      weekNumber
    );

    const previous =
      weekNumber > 1 &&
      completed.has(weekNumber - 1)
        ? calculateRankings(
            games,
            season,
            weekNumber - 1
          )
        : [];

    const previousPositions = new Map(
      previous.map((team) => [
        team.id,
        team.rank,
      ])
    );

    rankings = rankings.map((team) => ({
      ...team,
      previousRank:
        previousPositions.get(team.id) ?? null,
    }));
  }

  const tiers = selectTiers(
    season,
    validWeek ? weekNumber : 1
  );

  const topTeam = rankings[0];

  const biggestRiser = [...rankings]
    .filter(
      (team) => team.previousRank !== null
    )
    .sort(
      (a, b) =>
        (b.previousRank! - b.rank) -
        (a.previousRank! - a.rank)
    )[0];

  const biggestFaller = [...rankings]
    .filter(
      (team) => team.previousRank !== null
    )
    .sort(
      (a, b) =>
        (a.previousRank! - a.rank) -
        (b.previousRank! - b.rank)
    )[0];

  return (
    <main style={{ paddingBottom: "40px" }}>
      <header
        style={{
          textAlign: "center",
          borderBottom: "2px solid #ffffff",
          paddingBottom: "20px",
          marginBottom: "28px",
        }}
      >
        <Link
          href={`/news/${season}/${week}`}
          style={{
            color: MUTED,
            fontSize: "12px",
            textDecoration: "none",
            fontWeight: 700,
          }}
        >
          ← Back to the Weekly Edition
        </Link>

        <h1
          style={{
            fontSize: "clamp(36px, 10vw, 56px)",
            letterSpacing: "-2px",
            fontWeight: 900,
            lineHeight: 1,
            margin: "24px 0 8px",
          }}
        >
          SLOOT NEWS
        </h1>

        <p
          style={{
            fontWeight: 700,
            fontSize: "14px",
            margin: "0 0 18px",
          }}
        >
          Your Home of Sloot Sport
        </p>

        <div
          style={{
            borderTop: "1px solid #27303b",
            paddingTop: "12px",
            display: "flex",
            justifyContent: "space-between",
            gap: "10px",
            color: MUTED,
            fontSize: "11px",
            fontWeight: 800,
            letterSpacing: "1px",
          }}
        >
          <span>{season} SEASON</span>
          <span>WEEK {validWeek ? weekNumber : "—"}</span>
        </div>
      </header>

      {!ready ? (
        <section style={PANEL}>
          <SectionHeading
            eyebrow="Editorial Notice"
            title="Rankings Under Embargo"
          />

          <p
            style={{
              color: MUTED,
              lineHeight: 1.8,
            }}
          >
            The editorial board will not publish
            this week's power rankings until all
            five regular-season fixtures have
            officially finished.
          </p>

          <p
            style={{
              color: MUTED,
              lineHeight: 1.8,
              marginBottom: 0,
            }}
          >
            The commissioner has requested an
            exception for the Ballbags. The
            request is being considered by the
            commissioner.
          </p>
        </section>
      ) : (
        <>
          <section
            style={{
              ...PANEL,
              borderTop: "4px solid #ffffff",
              marginBottom: "30px",
            }}
          >
            <p
              style={{
                color: MUTED,
                fontSize: "11px",
                fontWeight: 800,
                letterSpacing: "2px",
                margin: "0 0 14px",
              }}
            >
              THE SLOOT POWER INDEX
            </p>

            <h2
              style={{
                fontSize: "clamp(27px, 7vw, 38px)",
                lineHeight: 1.12,
                letterSpacing: "-0.7px",
                margin: "0 0 18px",
              }}
            >
              Ten Franchises. Four Tiers.
              Absolutely No Editorial Integrity.
            </h2>

            <p
              style={{
                color: "#d2d8e0",
                fontSize: "15px",
                lineHeight: 1.85,
                margin: "0 0 16px",
              }}
            >
              Welcome to Week {weekNumber} of
              the Sloot Power Index, the SFL's
              premier source of football
              analysis, personal vendettas and
              occasionally accurate mathematics.
            </p>

            <p
              style={{
                color: "#d2d8e0",
                fontSize: "15px",
                lineHeight: 1.85,
                margin: 0,
              }}
            >
              This week's rankings combine
              scoring, results and recent form,
              before being submitted to an
              editorial committee whose
              commitment to impartiality is
              best described as theoretical.
              The Ballbags have been granted
              favourable treatment. Whiting
              and Garrett have been denied
              the right to appeal.
            </p>
          </section>

          {topTeam && (
            <section
              style={{
                ...PANEL,
                marginBottom: "30px",
              }}
            >
              <SectionHeading
                eyebrow="The View From the Summit"
                title="King of the Shit Mountain"
              />

              <h3
                style={{
                  fontSize: "24px",
                  margin: "0 0 12px",
                }}
              >
                {topTeam.name}
              </h3>

              <p
                style={{
                  color: MUTED,
                  fontSize: "14px",
                  lineHeight: 1.8,
                  margin: 0,
                }}
              >
                {topTeam.manager} occupies
                the top spot with a
                {" "}
                {topTeam.wins}-{topTeam.losses}
                {" "}
                record and an average of
                {" "}
                {points(topTeam.average)}
                {" "}
                points per fixture. The
                editorial team has examined
                the evidence and, with
                varying degrees of
                enthusiasm, agreed that
                somebody has to be first.
              </p>
            </section>
          )}

          <section style={{ marginBottom: "30px" }}>
            <SectionHeading
              eyebrow="The Officially Unofficial List"
              title="The Rankings"
            />

            {tiers.map((tierName, tierIndex) => {
              const members = rankings.filter(
                (team) =>
                  tierForRank(team.rank) ===
                  tierIndex
              );

              if (!members.length) return null;

              return (
                <div
                  key={tierName}
                  style={{
                    marginBottom: "28px",
                  }}
                >
                  <div
                    style={{
                      borderBottom:
                        "1px solid #445061",
                      paddingBottom: "12px",
                      marginBottom: "14px",
                    }}
                  >
                    <p
                      style={{
                        color: MUTED,
                        fontSize: "10px",
                        fontWeight: 800,
                        letterSpacing: "2px",
                        margin: "0 0 6px",
                      }}
                    >
                      TIER {tierIndex + 1}
                    </p>

                    <h3
                      style={{
                        fontSize: "22px",
                        lineHeight: 1.25,
                        margin: 0,
                      }}
                    >
                      {tierName}
                    </h3>
                  </div>

                  {members.map((team) => (
                    <article
                      key={team.id}
                      style={{
                        ...PANEL,
                        marginBottom: "12px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "14px",
                          marginBottom: "16px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "34px",
                            fontWeight: 900,
                            lineHeight: 1,
                            minWidth: "45px",
                          }}
                        >
                          {team.rank}
                        </div>

                        <div style={{ flex: 1 }}>
                          <h4
                            style={{
                              fontSize: "19px",
                              lineHeight: 1.25,
                              margin: "0 0 6px",
                            }}
                          >
                            {team.name}
                          </h4>

                          <p
                            style={{
                              color: MUTED,
                              fontSize: "12px",
                              margin: 0,
                            }}
                          >
                            {team.manager}
                            {" · "}
                            {CONFERENCES[team.id]}
                          </p>
                        </div>

                        <span
                          style={{
                            color:
                              team.previousRank !==
                                null &&
                              team.previousRank >
                                team.rank
                                ? "#73c69a"
                                : team.previousRank !==
                                      null &&
                                    team.previousRank <
                                      team.rank
                                  ? "#ed9393"
                                  : MUTED,
                            fontSize: "12px",
                            fontWeight: 900,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {movement(team)}
                        </span>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "8px",
                          marginBottom: "16px",
                        }}
                      >
                        {[
                          `${team.wins}-${team.losses}`,
                          `${points(team.average)} AVG`,
                          `${points(team.pointsFor)} PF`,
                        ].map((stat) => (
                          <span
                            key={stat}
                            style={{
                              background: "#27303b",
                              borderRadius: "7px",
                              padding: "6px 9px",
                              fontSize: "11px",
                              fontWeight: 800,
                            }}
                          >
                            {stat}
                          </span>
                        ))}
                      </div>

                      <p
                        style={{
                          color: "#d2d8e0",
                          fontSize: "14px",
                          lineHeight: 1.8,
                          margin: "0 0 14px",
                        }}
                      >
                        {rankingSummary(team)}
                      </p>

                      <p
                        style={{
                          color: MUTED,
                          fontSize: "14px",
                          lineHeight: 1.8,
                          margin: 0,
                        }}
                      >
                        {editorial(team, weekNumber)}
                      </p>
                    </article>
                  ))}
                </div>
              );
            })}
          </section>

          {weekNumber > 1 && (
            <section
              style={{
                ...PANEL,
                marginBottom: "30px",
              }}
            >
              <SectionHeading
                eyebrow="Market Movements"
                title="The Movers and Shakers"
              />

              {biggestRiser &&
                biggestRiser.previousRank !== null &&
                biggestRiser.previousRank >
                  biggestRiser.rank && (
                  <p
                    style={{
                      color: "#d2d8e0",
                      fontSize: "14px",
                      lineHeight: 1.8,
                    }}
                  >
                    <strong>Biggest riser:</strong>
                    {" "}
                    {biggestRiser.name},
                    climbing from
                    {" "}
                    #{biggestRiser.previousRank}
                    {" "}
                    to #{biggestRiser.rank}.
                    Somebody in that
                    organisation has
                    apparently discovered
                    how to play fantasy
                    football.
                  </p>
                )}

              {biggestFaller &&
                biggestFaller.previousRank !== null &&
                biggestFaller.previousRank <
                  biggestFaller.rank && (
                  <p
                    style={{
                      color: "#d2d8e0",
                      fontSize: "14px",
                      lineHeight: 1.8,
                      marginBottom: 0,
                    }}
                  >
                    <strong>Biggest faller:</strong>
                    {" "}
                    {biggestFaller.name},
                    dropping from
                    {" "}
                    #{biggestFaller.previousRank}
                    {" "}
                    to #{biggestFaller.rank}.
                    The newsroom has
                    attempted to contact
                    management for comment,
                    but understands the
                    telephone may have
                    been thrown into a
                    nearby body of water.
                  </p>
                )}
            </section>
          )}

          <section
            style={{
              ...PANEL,
              marginBottom: "30px",
            }}
          >
            <SectionHeading
              eyebrow="A Statement From Management"
              title="Editorial Independence"
            />

            <p
              style={{
                color: MUTED,
                fontSize: "14px",
                lineHeight: 1.8,
                margin: 0,
              }}
            >
              Sloot News categorically denies
              that its rankings are influenced
              by the personal preferences of
              the commissioner. The newsroom
              would also like to congratulate
              Ed Nelms on his excellent
              leadership and remind Ryan
              Whiting and Garrett Etheridge
              that complaints must be
              submitted in writing to an
              address that does not exist.
            </p>
          </section>
        </>
      )}

      <footer
        style={{
          textAlign: "center",
          borderTop: "1px solid #27303b",
          paddingTop: "24px",
          marginTop: "32px",
        }}
      >
        <p
          style={{
            fontWeight: 900,
            letterSpacing: "2px",
            margin: 0,
          }}
        >
          SLOOT NEWS
        </p>

        <p
          style={{
            color: MUTED,
            fontSize: "12px",
            marginTop: "8px",
          }}
        >
          Your Home of Sloot Sport
        </p>

        <p
          style={{
            color: MUTED,
            fontSize: "11px",
            lineHeight: 1.6,
            marginTop: "12px",
          }}
        >
          Real statistics. Corrupt analysis.
          Absolutely no right of appeal.
        </p>
      </footer>
    </main>
  );
}
