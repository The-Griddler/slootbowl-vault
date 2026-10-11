
import Link from "next/link";
import type { CSSProperties } from "react";
import {
  getHistoricalData,
  type HistoricalMatchup,
  type HistoricalSeason,
} from "../../../../../lib/sleeper";

type PageProps = {
  params: Promise<{
    season: string;
    week: string;
  }>;
};

type Result = {
  season: string;
  week: number;
  winner: number;
  loser: number;
  winnerScore: number;
  loserScore: number;
  margin: number;
  total: number;
};

type Candidate = {
  past: Result;
  current: Result;
  connection: Connection;
  relevance: number;
};

type Connection =
  | "revenge"
  | "repeat"
  | "reversal"
  | "rivalry"
  | "manager"
  | "parallel";

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

const RIVALRIES: Record<string, string> = {
  "1-3": "The Shotty Bowl",
  "4-7": "The Paddletap Bowl",
  "4-9": "The OBFC Grudge Match",
  "1-10": "The Commissioner's Nightmare",
};

const MUTED = "#929eae";

const PANEL: CSSProperties = {
  background: "#151b23",
  border: "1px solid #27303b",
  borderRadius: 16,
  padding: 20,
};

function teamName(id: number, season: string) {
  if (id === 1 && Number(season) < 2026) {
    return "Perth Ballbags";
  }

  return TEAMS[id] ?? `Franchise ${id}`;
}

function managerName(id: number) {
  return MANAGERS[id] ?? `Manager ${id}`;
}

function points(value: number) {
  return value.toFixed(2);
}

function pairKey(a: number, b: number) {
  return [a, b].sort((x, y) => x - y).join("-");
}

function rivalry(a: number, b: number) {
  return RIVALRIES[pairKey(a, b)] ?? null;
}

function completed(game: HistoricalMatchup) {
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

function completeWeek(
  games: HistoricalMatchup[],
  week: number
) {
  const fixtures = games.filter(
    (game) =>
      game.week === week &&
      completed(game)
  );

  const teams = new Set<number>();

  for (const game of fixtures) {
    if (
      game.rosterA < 1 ||
      game.rosterA > 10 ||
      game.rosterB < 1 ||
      game.rosterB > 10 ||
      game.rosterA === game.rosterB
    ) {
      return [];
    }

    teams.add(game.rosterA);
    teams.add(game.rosterB);
  }

  if (fixtures.length !== 5 || teams.size !== 10) {
    return [];
  }

  return fixtures;
}

function toResult(
  game: HistoricalMatchup,
  season: string
): Result | null {
  if (!completed(game)) return null;
  if (game.scoreA === game.scoreB) return null;

  const aWon = game.scoreA > game.scoreB;

  return {
    season,
    week: game.week,
    winner: aWon ? game.rosterA : game.rosterB,
    loser: aWon ? game.rosterB : game.rosterA,
    winnerScore: aWon
      ? game.scoreA
      : game.scoreB,
    loserScore: aWon
      ? game.scoreB
      : game.scoreA,
    margin: Math.abs(game.scoreA - game.scoreB),
    total: game.scoreA + game.scoreB,
  };
}

function olderThan(
  result: Result,
  season: string,
  week: number
) {
  const resultYear = Number(result.season);
  const currentYear = Number(season);

  return (
    resultYear < currentYear ||
    (resultYear === currentYear &&
      result.week < week)
  );
}

function historyBefore(
  seasons: HistoricalSeason[],
  season: string,
  week: number
) {
  const results: Result[] = [];

  for (const historical of seasons) {
    const historicalYear = Number(
      historical.league.season
    );

    if (historicalYear > Number(season)) {
      continue;
    }

    for (let historicalWeek = 1;
      historicalWeek <= 14;
      historicalWeek++
    ) {
      const fixtures = completeWeek(
        historical.matchups,
        historicalWeek
      );

      if (fixtures.length !== 5) continue;

      for (const fixture of fixtures) {
        const result = toResult(
          fixture,
          historical.league.season
        );

        if (
          result &&
          olderThan(result, season, week)
        ) {
          results.push(result);
        }
      }
    }
  }

  return results;
}

function historicalMatches(
  results: Result[],
  a: number,
  b: number
) {
  const key = pairKey(a, b);

  return results.filter(
    (result) =>
      pairKey(result.winner, result.loser) === key
  );
}

function headToHead(
  results: Result[],
  a: number,
  b: number
) {
  const meetings = historicalMatches(
    results,
    a,
    b
  );

  return {
    meetings: meetings.length,
    aWins: meetings.filter(
      (result) => result.winner === a
    ).length,
    bWins: meetings.filter(
      (result) => result.winner === b
    ).length,
  };
}

function teamRecord(
  results: Result[],
  team: number
) {
  let wins = 0;
  let losses = 0;

  for (const result of results) {
    if (result.winner === team) wins++;
    if (result.loser === team) losses++;
  }

  return { wins, losses };
}

function connectionType(
  past: Result,
  current: Result
): Connection {
  const samePair =
    pairKey(past.winner, past.loser) ===
    pairKey(current.winner, current.loser);

  if (samePair) {
    if (
      past.winner === current.loser &&
      past.loser === current.winner
    ) {
      return "revenge";
    }

    if (rivalry(past.winner, past.loser)) {
      return "rivalry";
    }

    if (past.margin <= 5 || current.margin <= 5) {
      return "repeat";
    }

    return "repeat";
  }

  if (
    past.loser === current.winner &&
    past.margin >= 30
  ) {
    return "reversal";
  }

  if (
    past.loser === current.loser ||
    past.winner === current.winner
  ) {
    return "manager";
  }

  return "parallel";
}

function relevanceScore(
  past: Result,
  current: Result,
  currentSeason: string
) {
  const samePair =
    pairKey(past.winner, past.loser) ===
    pairKey(current.winner, current.loser);

  const connection = connectionType(
    past,
    current
  );

  let relevance = 0;

  if (samePair) relevance += 110;

  if (connection === "revenge") {
    relevance += 60;
  }

  if (connection === "rivalry") {
    relevance += 45;
  }

  if (connection === "reversal") {
    relevance += 30;
  }

  if (
    past.loser === current.loser &&
    past.margin >= 25
  ) {
    relevance += 22;
  }

  if (
    past.winner === current.winner
  ) {
    relevance += 14;
  }

  if (past.margin <= 3) relevance += 32;
  else if (past.margin <= 7) relevance += 19;

  if (past.margin >= 45) relevance += 25;

  if (past.winnerScore >= 175) {
    relevance += 16;
  }

  if (past.total >= 320) {
    relevance += 12;
  }

  const age =
    Number(currentSeason) -
    Number(past.season);

  if (age === 0) relevance += 12;
  if (age === 1) relevance += 9;

  if (past.loser === 5 || past.loser === 6) {
    relevance += 5;
  }

  if (past.winner === 1) {
    relevance += 5;
  }

  return relevance;
}

function selectStory(
  historical: Result[],
  current: Result[],
  season: string,
  week: number
): Candidate | null {
  const candidates: Candidate[] = [];

  for (const past of historical) {
    for (const present of current) {
      const sharesManager =
        past.winner === present.winner ||
        past.winner === present.loser ||
        past.loser === present.winner ||
        past.loser === present.loser;

      if (!sharesManager) continue;

      candidates.push({
        past,
        current: present,
        connection: connectionType(
          past,
          present
        ),
        relevance: relevanceScore(
          past,
          present,
          season
        ),
      });
    }
  }

  if (!candidates.length) return null;

  // Deterministic selection. A small
  // edition-specific adjustment encourages
  // different stories without introducing
  // randomness or future knowledge.
  const salt = Number(season) * 19 + week * 37;

  candidates.sort((a, b) => {
    const aVariety =
      ((a.past.week * 17 +
        Number(a.past.season) * 3 +
        salt) % 19);

    const bVariety =
      ((b.past.week * 17 +
        Number(b.past.season) * 3 +
        salt) % 19);

    return (
      (b.relevance + bVariety) -
        (a.relevance + aVariety) ||
      Number(b.past.season) -
        Number(a.past.season) ||
      b.past.week - a.past.week
    );
  });

  return candidates[0];
}

function headline(
  story: Candidate
) {
  const { past, current, connection } = story;

  const pastLoser = teamName(
    past.loser,
    past.season
  );

  const pastWinner = teamName(
    past.winner,
    past.season
  );

  const currentWinner = teamName(
    current.winner,
    current.season
  );

  switch (connection) {
    case "revenge":
      return "REVENGE IS A DISH BEST SERVED WITH RECEIPTS";

    case "rivalry":
      return "OLD ENEMIES, FRESH WOUNDS, SAME OLD BULLSHIT";

    case "repeat":
      return "HISTORY REPEATS ITSELF. THE LOSER OBJECTS.";

    case "reversal":
      return `${currentWinner.toUpperCase()} RISE FROM THE WRECKAGE`;

    case "manager":
      if (past.margin >= 40) {
        return `${pastLoser.toUpperCase()}: THE DISASTER THEY TRIED TO BURY`;
      }

      return "THE GHOSTS OF FANTASY FOOTBALL PAST";

    default:
      return `${pastWinner.toUpperCase()}: THE FORGOTTEN AFFAIR`;
  }
}

function subtitle(story: Candidate) {
  const { past, current } = story;

  return (
    `A Week ${past.week}, ${past.season} ` +
    `result has resurfaced following ` +
    `events in Week ${current.week} of ` +
    `${current.season}. The archives ` +
    `have been reopened.`
  );
}

function openingParagraph(story: Candidate) {
  const { past } = story;

  const winner = teamName(
    past.winner,
    past.season
  );

  const loser = teamName(
    past.loser,
    past.season
  );

  return (
    `Deep within the Sloot News archives, ` +
    `between several unpaid invoices and ` +
    `a suspicious number of documents ` +
    `marked "Destroy Before Commissioner ` +
    `Sees", lies the official record of ` +
    `Week ${past.week} in ${past.season}. ` +
    `On that occasion, ${winner} defeated ` +
    `${loser} by ${points(past.winnerScore)} ` +
    `to ${points(past.loserScore)}. ` +
    `The ${points(past.margin)}-point ` +
    `margin was real. So, unfortunately, ` +
    `was the managerial responsibility.`
  );
}

function contextParagraph(
  story: Candidate,
  earlier: Result[]
) {
  const { past } = story;

  const beforePast = earlier.filter(
    (result) =>
      olderThan(
        result,
        past.season,
        past.week
      )
  );

  const winnerRecord = teamRecord(
    beforePast,
    past.winner
  );

  const loserRecord = teamRecord(
    beforePast,
    past.loser
  );

  const winner = teamName(
    past.winner,
    past.season
  );

  const loser = teamName(
    past.loser,
    past.season
  );

  return (
    `To understand the scale of the ` +
    `incident, one must first examine ` +
    `the circumstances. Entering that ` +
    `week, ${winner} held an all-time ` +
    `regular-season record of ` +
    `${winnerRecord.wins}–${winnerRecord.losses} ` +
    `across the available SFL archive, ` +
    `while ${loser} stood at ` +
    `${loserRecord.wins}–${loserRecord.losses}. ` +
    `These were not theoretical ` +
    `franchises in a spreadsheet. ` +
    `These were actual managers, ` +
    `making actual decisions, ` +
    `with consequences that can ` +
    `still be used against them today.`
  );
}

function originalMatchParagraph(
  story: Candidate
) {
  const { past } = story;

  const winner = teamName(
    past.winner,
    past.season
  );

  const loser = teamName(
    past.loser,
    past.season
  );

  const winningManager = managerName(
    past.winner
  );

  const losingManager = managerName(
    past.loser
  );

  if (past.margin <= 3) {
    return (
      `The contest itself was an exercise ` +
      `in psychological cruelty. ${winner} ` +
      `escaped with a victory of just ` +
      `${points(past.margin)} points, ` +
      `leaving ${losingManager} to contemplate ` +
      `every lineup decision, substitution ` +
      `and minor personal failing that ` +
      `might have altered the result. ` +
      `${winningManager}, meanwhile, ` +
      `was able to describe the outcome ` +
      `as tactical brilliance without ` +
      `being immediately removed ` +
      `from the premises.`
    );
  }

  if (past.margin >= 40) {
    return (
      `This was not a competitive sporting ` +
      `event. It was a public dismantling. ` +
      `${winner} finished ${points(past.margin)} ` +
      `points clear of ${loser}, ` +
      `with ${winningManager} enjoying ` +
      `the sort of afternoon normally ` +
      `reserved for Bond villains. ` +
      `${losingManager}'s contribution ` +
      `to proceedings was largely ` +
      `administrative: submitting a lineup, ` +
      `watching it get destroyed and ` +
      `remaining technically responsible ` +
      `for the outcome.`
    );
  }

  if (past.winnerScore >= 175) {
    return (
      `${winner} piled up a monstrous ` +
      `${points(past.winnerScore)} points, ` +
      `turning an ordinary fantasy ` +
      `fixture into a numerical crime ` +
      `scene. ${loser} managed ` +
      `${points(past.loserScore)}, ` +
      `which under different circumstances ` +
      `might have been respectable. ` +
      `Unfortunately, those circumstances ` +
      `did not include facing a franchise ` +
      `that had apparently discovered ` +
      `how to score points by the truckload.`
    );
  }

  return (
    `On the scoreboard, ${winner} ` +
    `produced ${points(past.winnerScore)} ` +
    `points against ${loser}'s ` +
    `${points(past.loserScore)}. ` +
    `It was enough for a clear victory, ` +
    `and enough for ${winningManager} ` +
    `to spend the following days ` +
    `explaining his genius to anyone ` +
    `within earshot. ${losingManager} ` +
    `was left to examine what went wrong, ` +
    `a process which the newsroom ` +
    `suspects remains ongoing.`
  );
}

function connectionParagraph(
  story: Candidate
) {
  const { past, current, connection } = story;

  const currentWinner = teamName(
    current.winner,
    current.season
  );

  const currentLoser = teamName(
    current.loser,
    current.season
  );

  const oldWinner = teamName(
    past.winner,
    past.season
  );

  const oldLoser = teamName(
    past.loser,
    past.season
  );

  if (connection === "revenge") {
    return (
      `Now the wheel has turned. In Week ` +
      `${current.week} of ${current.season}, ` +
      `${currentWinner} defeated ` +
      `${currentLoser} by ` +
      `${points(current.winnerScore)} to ` +
      `${points(current.loserScore)}. ` +
      `The same two franchises had ` +
      `previously met in the opposite ` +
      `configuration, with ${oldWinner} ` +
      `taking the spoils. ` +
      `The historical record therefore ` +
      `confirms an act of revenge, ` +
      `although whether either manager ` +
      `has achieved emotional closure ` +
      `remains deeply doubtful.`
    );
  }

  if (
    connection === "rivalry" ||
    connection === "repeat"
  ) {
    return (
      `The relevance became impossible ` +
      `to ignore this week when ` +
      `${currentWinner} again defeated ` +
      `${currentLoser}, this time ` +
      `${points(current.winnerScore)}–` +
      `${points(current.loserScore)}. ` +
      `The same pair of franchises, ` +
      `another entry in the history ` +
      `books and another opportunity ` +
      `for the winning manager to ` +
      `become completely unbearable. ` +
      `For the loser, the archive ` +
      `offers the comfort of knowing ` +
      `this has happened before. ` +
      `Which is no comfort whatsoever.`
    );
  }

  if (connection === "reversal") {
    return (
      `The archive's relevance lies ` +
      `in the reversal of fortune. ` +
      `${oldLoser}, once on the receiving ` +
      `end of a ${points(past.margin)}-point ` +
      `defeat, returned to the headlines ` +
      `this week as ${currentWinner} ` +
      `won ${points(current.winnerScore)}–` +
      `${points(current.loserScore)}. ` +
      `It is tempting to call this ` +
      `a redemption arc. Sloot News ` +
      `prefers to wait until the ` +
      `postseason before making ` +
      `such irresponsible claims.`
    );
  }

  return (
    `The connection to the present ` +
    `became clear when Week ` +
    `${current.week} produced a ` +
    `${points(current.winnerScore)}–` +
    `${points(current.loserScore)} ` +
    `victory for ${currentWinner} ` +
    `over ${currentLoser}. ` +
    `At least one of the managers ` +
    `involved was also present ` +
    `in the earlier affair. ` +
    `Different opposition, different ` +
    `season, but the same uncomfortable ` +
    `question: how much has actually ` +
    `changed since the original incident?`
  );
}

function rivalryParagraph(
  story: Candidate,
  earlier: Result[]
) {
  const { past, current } = story;

  const history = earlier.filter(
    (result) =>
      olderThan(
        result,
        current.season,
        current.week
      )
  );

  const record = headToHead(
    history,
    past.winner,
    past.loser
  );

  const first = teamName(
    past.winner,
    current.season
  );

  const second = teamName(
    past.loser,
    current.season
  );

  const rivalryName = rivalry(
    past.winner,
    past.loser
  );

  const introduction = rivalryName
    ? `The fixture is better known to historians as ${rivalryName}. `
    : "The two franchises have an established history of making each other's lives unnecessarily difficult. ";

  return (
    introduction +
    `Before the current week's result, ` +
    `the available regular-season ` +
    `archive recorded ${record.meetings} ` +
    `meetings between ${first} and ` +
    `${second}. ${first} had won ` +
    `${record.aWins}, while ${second} ` +
    `had taken ${record.bWins}. ` +
    `These figures exclude playoff ` +
    `games and consolation fixtures. ` +
    `The editorial board considers ` +
    `the numbers important, although ` +
    `it reserves the right to ignore ` +
    `them when they become inconvenient.`
  );
}

function editorialParagraph(
  story: Candidate
) {
  const { past, current } = story;

  const managers = new Set([
    past.winner,
    past.loser,
    current.winner,
    current.loser,
  ]);

  if (managers.has(6)) {
    return (
      `Garrett Etheridge's involvement ` +
      `has prompted the usual discussion ` +
      `about the difference between ` +
      `regular-season achievement and ` +
      `actual silverware. The Lincoln ` +
      `manager may object to this ` +
      `characterisation, but the ` +
      `Sloot News archives are not ` +
      `a customer-service department.`
    );
  }

  if (managers.has(5)) {
    return (
      `Ryan Whiting's name appearing ` +
      `anywhere near a historical ` +
      `investigation is rarely a good ` +
      `sign. The Fingerblasters manager ` +
      `has declined to comment, ` +
      `primarily because nobody ` +
      `has actually asked him.`
    );
  }

  if (managers.has(1)) {
    return (
      `The Ballbags' involvement ` +
      `has naturally attracted intense ` +
      `interest from the commissioner's ` +
      `office. Officials insist the ` +
      `investigation is entirely ` +
      `independent, despite its ` +
      `conclusion having apparently ` +
      `been approved before the ` +
      `research began.`
    );
  }

  if (managers.has(9)) {
    return (
      `For Tarl Brayer, the mere ` +
      `mention of historical results ` +
      `is enough to provoke concern. ` +
      `Few SFL managers have endured ` +
      `quite so many occasions where ` +
      `the football gods appeared ` +
      `to intervene personally.`
    );
  }

  if (managers.has(10)) {
    return (
      `Josh Thomas, of course, has ` +
      `developed a reputation for ` +
      `treating the regular season ` +
      `as an optional administrative ` +
      `exercise before becoming ` +
      `unreasonably dangerous ` +
      `when trophies are available.`
    );
  }

  return (
    `Several managers contacted ` +
    `by Sloot News have declined ` +
    `to offer a statement, mostly ` +
    `because they were not contacted ` +
    `in the first place. The ` +
    `investigation therefore rests ` +
    `on the one source that cannot ` +
    `be bullied, bribed or persuaded ` +
    `to forget: the historical ` +
    `Sleeper scoreboard.`
  );
}

function closingParagraph(
  story: Candidate
) {
  const { past, current } = story;

  const loser = managerName(
    past.loser
  );

  return (
    `The original result is now ` +
    `firmly part of SFL history, ` +
    `and Week ${current.week} has ` +
    `supplied a fresh reason ` +
    `to examine it. Whether ` +
    `${loser} considers this ` +
    `retrospective necessary is ` +
    `immaterial. Sloot News ` +
    `exists to preserve the ` +
    `historical record, expose ` +
    `managerial incompetence ` +
    `and ensure that no ` +
    `embarrassing defeat is ` +
    `ever allowed to die ` +
    `a peaceful death.`
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        background: "#222b36",
        borderRadius: 9,
        padding: 12,
      }}
    >
      <p
        style={{
          color: MUTED,
          fontSize: 10,
          fontWeight: 900,
          letterSpacing: 1,
          margin: "0 0 5px",
        }}
      >
        {label}
      </p>

      <p
        style={{
          fontSize: 14,
          fontWeight: 800,
          lineHeight: 1.4,
          margin: 0,
        }}
      >
        {value}
      </p>
    </div>
  );
}

export default async function FromTheVaultPage({
  params,
}: PageProps) {
  const { season, week } = await params;
  const weekNumber = Number(week);

  const seasons = await getHistoricalData();

  const selected = seasons.find(
    (item) =>
      item.league.season === season
  );

  const valid =
    Number.isInteger(weekNumber) &&
    weekNumber >= 1 &&
    weekNumber <= 14;

  const fixtures =
    valid && selected
      ? completeWeek(
          selected.matchups,
          weekNumber
        )
      : [];

  const currentResults = fixtures
    .map((game) => toResult(game, season))
    .filter(
      (result): result is Result =>
        result !== null
    );

  const ready =
    fixtures.length === 5 &&
    currentResults.length === 5;

  const historical = ready
    ? historyBefore(
        seasons,
        season,
        weekNumber
      )
    : [];

  const story = ready
    ? selectStory(
        historical,
        currentResults,
        season,
        weekNumber
      )
    : null;

  const articleParagraphs = story
    ? [
        openingParagraph(story),
        contextParagraph(story, historical),
        originalMatchParagraph(story),
        connectionParagraph(story),
        rivalryParagraph(story, historical),
        editorialParagraph(story),
        closingParagraph(story),
      ]
    : [];

  return (
    <main
      style={{
        color: "#f4f5f7",
        paddingBottom: 40,
      }}
    >
      <header
        style={{
          textAlign: "center",
          borderBottom: "2px solid #f4f5f7",
          paddingBottom: 20,
          marginBottom: 29,
        }}
      >
        <Link
          href={`/news/${season}/${week}`}
          style={{
            color: MUTED,
            fontSize: 12,
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          ← Back to the Weekly Edition
        </Link>

        <h1
          style={{
            fontSize: "clamp(36px, 10vw, 56px)",
            letterSpacing: -2,
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
            fontSize: 14,
            margin: "0 0 18px",
          }}
        >
          Your Home of Sloot Sport
        </p>

        <div
          style={{
            borderTop: "1px solid #27303b",
            paddingTop: 12,
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            color: MUTED,
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: 1,
          }}
        >
          <span>{season} SEASON</span>
          <span>
            WEEK {valid ? weekNumber : "—"}
          </span>
        </div>
      </header>

      <section
        style={{
          ...PANEL,
          borderTop: "4px solid #f4f5f7",
          marginBottom: 28,
        }}
      >
        <p
          style={{
            color: MUTED,
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: 2,
            margin: "0 0 13px",
          }}
        >
          FROM THE VAULT · INVESTIGATIONS
        </p>

        <h2
          style={{
            fontSize: "clamp(29px, 8vw, 42px)",
            lineHeight: 1.1,
            letterSpacing: -1,
            margin: "0 0 17px",
          }}
        >
          {story
            ? headline(story)
            : "THE ARCHIVES REMAIN SEALED"}
        </h2>

        <p
          style={{
            color: "#d2d8e0",
            fontSize: 15,
            lineHeight: 1.85,
            margin: 0,
          }}
        >
          {story
            ? subtitle(story)
            : "The Sloot News investigative desk is waiting for a completed edition and a genuine historical incident worth reopening."}
        </p>
      </section>

      {!ready ? (
        <section style={PANEL}>
          <h2
            style={{
              fontSize: 23,
              margin: "0 0 12px",
            }}
          >
            Investigation Under Embargo
          </h2>

          <p
            style={{
              color: MUTED,
              lineHeight: 1.8,
              margin: 0,
            }}
          >
            From the Vault publishes only
            when all five regular-season
            fixtures for the selected week
            have officially concluded.
            The newsroom does not report
            on unfinished games or
            invent historical evidence.
          </p>
        </section>
      ) : !story ? (
        <section style={PANEL}>
          <h2
            style={{
              fontSize: 23,
              margin: "0 0 12px",
            }}
          >
            No Historical Case Available
          </h2>

          <p
            style={{
              color: MUTED,
              lineHeight: 1.8,
              margin: 0,
            }}
          >
            There are no earlier completed
            regular-season results in
            the available archive that
            connect to this edition.
            The investigators will
            return when the league
            has accumulated more
            embarrassing evidence.
          </p>
        </section>
      ) : (
        <>
          <section
            style={{
              ...PANEL,
              marginBottom: 28,
            }}
          >
            <p
              style={{
                color: MUTED,
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: 2,
                margin: "0 0 16px",
              }}
            >
              EXHIBIT A · THE ORIGINAL INCIDENT
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, minmax(0, 1fr))",
                gap: 10,
                marginBottom: 17,
              }}
            >
              <Stat
                label="ORIGINAL SEASON"
                value={story.past.season}
              />

              <Stat
                label="ORIGINAL WEEK"
                value={`Week ${story.past.week}`}
              />

              <Stat
                label="VICTOR"
                value={teamName(
                  story.past.winner,
                  story.past.season
                )}
              />

              <Stat
                label="VICTIM"
                value={teamName(
                  story.past.loser,
                  story.past.season
                )}
              />
            </div>

            <div
              style={{
                background: "#222b36",
                borderRadius: 11,
                padding: 17,
                textAlign: "center",
              }}
            >
              <p
                style={{
                  color: MUTED,
                  fontSize: 10,
                  fontWeight: 900,
                  letterSpacing: 1.5,
                  margin: "0 0 12px",
                }}
              >
                HISTORICAL FINAL SCORE
              </p>

              <p
                style={{
                  fontSize: "clamp(27px, 8vw, 40px)",
                  fontWeight: 900,
                  margin: "0 0 10px",
                }}
              >
                {points(story.past.winnerScore)}
                {" – "}
                {points(story.past.loserScore)}
              </p>

              <p
                style={{
                  color: MUTED,
                  fontSize: 12,
                  margin: 0,
                }}
              >
                Winning margin:
                {" "}
                {points(story.past.margin)}
                {" "}
                points
              </p>
            </div>
          </section>

          <article
            style={{
              ...PANEL,
              marginBottom: 28,
            }}
          >
            <p
              style={{
                color: MUTED,
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: 2,
                margin: "0 0 18px",
              }}
            >
              THE FULL INVESTIGATION
            </p>

            {articleParagraphs.map(
              (paragraph, index) => (
                <p
                  key={index}
                  style={{
                    color: "#d2d8e0",
                    fontSize: 15,
                    lineHeight: 1.95,
                    margin:
                      index ===
                      articleParagraphs.length - 1
                        ? 0
                        : "0 0 21px",
                  }}
                >
                  {paragraph}
                </p>
              )
            )}
          </article>

          <section
            style={{
              ...PANEL,
              marginBottom: 28,
            }}
          >
            <p
              style={{
                color: MUTED,
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: 2,
                margin: "0 0 14px",
              }}
            >
              EXHIBIT B · THE MODERN CONNECTION
            </p>

            <h2
              style={{
                fontSize: 23,
                lineHeight: 1.2,
                margin: "0 0 16px",
              }}
            >
              Why This Story Matters Now
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, minmax(0, 1fr))",
                gap: 10,
                marginBottom: 16,
              }}
            >
              <Stat
                label="CURRENT WINNER"
                value={teamName(
                  story.current.winner,
                  story.current.season
                )}
              />

              <Stat
                label="CURRENT LOSER"
                value={teamName(
                  story.current.loser,
                  story.current.season
                )}
              />

              <Stat
                label="CURRENT SCORE"
                value={
                  `${points(story.current.winnerScore)}` +
                  "–" +
                  `${points(story.current.loserScore)}`
                }
              />

              <Stat
                label="CURRENT WEEK"
                value={`Week ${story.current.week}`}
              />
            </div>

            <p
              style={{
                color: "#d2d8e0",
                fontSize: 13,
                lineHeight: 1.8,
                margin: 0,
              }}
            >
              The connection is drawn
              from actual historical
              matchups involving at
              least one of this week's
              franchises. The original
              incident occurred before
              the selected edition;
              no future results are
              used in this report.
            </p>
          </section>

          <section style={PANEL}>
            <h2
              style={{
                fontSize: 22,
                margin: "0 0 13px",
              }}
            >
              The Archive Remains Open
            </h2>

            <p
              style={{
                color: "#d2d8e0",
                fontSize: 14,
                lineHeight: 1.8,
                margin: "0 0 15px",
              }}
            >
              Every scandal in SFL
              history began as somebody
              insisting that it
              wasn't a big deal.
              The newsroom disagrees.
            </p>

            <Link
              href={`/news/${story.past.season}/${story.past.week}`}
              style={{
                color: "#f4f5f7",
                fontSize: 12,
                fontWeight: 900,
                textDecoration: "none",
                letterSpacing: 0.5,
              }}
            >
              REVISIT THE ORIGINAL WEEKLY EDITION →
            </Link>
          </section>
        </>
      )}

      <footer
        style={{
          textAlign: "center",
          borderTop: "1px solid #27303b",
          paddingTop: 24,
          marginTop: 33,
        }}
      >
        <p
          style={{
            fontWeight: 900,
            letterSpacing: 2,
            margin: "0 0 8px",
          }}
        >
          SLOOT NEWS
        </p>

        <p
          style={{
            color: MUTED,
            fontSize: 12,
            margin: "0 0 10px",
          }}
        >
          Your Home of Sloot Sport
        </p>

        <p
          style={{
            color: MUTED,
            fontSize: 11,
            lineHeight: 1.7,
            margin: 0,
          }}
        >
          The past is never dead.
          It's merely awaiting
          another humiliating defeat.
        </p>
      </footer>
    </main>
  );
}
