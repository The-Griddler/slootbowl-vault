
import type { GreatestGame } from "./greatestGames";

type ReportContext = {
  isSlootbowl: boolean;
  isConferenceChampionship: boolean;
  conferenceName: string | null;
  isHistoricClosestSlootbowl: boolean;
  isHighestScoring: boolean;
  isBiggestDemolition: boolean;
};

const NAMES: Record<number, string> = {
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

const SHORT: Record<number, string> = {
  1: "Mt Isa",
  2: "Cambridge",
  3: "Grimsby",
  4: "Isle of Wight",
  5: "Grays Town",
  6: "Lincoln",
  7: "Kalamata",
  8: "Weybiza",
  9: "East Rutherford",
  10: "Chad",
};

function name(id: number) {
  return NAMES[id] ?? `Franchise ${id}`;
}

function short(id: number) {
  return SHORT[id] ?? name(id);
}

function pts(value: number) {
  return value.toFixed(2);
}

function record(value: string) {
  return value.endsWith("-0")
    ? value.slice(0, -2)
    : value;
}

function key(
  season: string,
  week: number,
  a: number,
  b: number
) {
  return [
    season,
    week,
    Math.min(a, b),
    Math.max(a, b),
  ].join(":");
}

function gameKey(game: GreatestGame) {
  return key(
    game.season,
    game.week,
    game.rosterA,
    game.rosterB
  );
}

// Individually written SFL history.
// Keyed by season, week and both franchises,
// so the same report appears in every category.
const BESPOKE: Record<string, string> = {
  [key("2025", 17, 9, 10)]:
    "East Rutherford Shitlickers spent the regular season licking their way to a 10–4 record, only to find themselves on the receiving end of Chad Moist Discharge in the Slootbowl. Chad entered at 5–9 but somehow squeezed out a 140.58–140.46 victory. A championship decided by 0.12 points: the smallest discharge imaginable, yet enough to leave East Rutherford with a mouthful of regret.",

  [key("2024", 17, 4, 10)]:
    "Isle of Wight Happy Endings arrived at the Slootbowl expecting a glorious climax. Unfortunately, Chad Moist Discharge finished first. A positively obscene 375.80 points were sprayed across the scoreboard as Chad prevailed 189.66–186.14. The Happy Endings were left frustrated, sticky and wondering where it all went wrong.",

  [key("2023", 16, 4, 9)]:
    "East Rutherford Shitlickers were just 0.84 points away from a Happy Ending, but Isle of Wight refused to finish second. The two sides went at it for 354.56 combined points in the OBFC Championship Game, with Isle of Wight eventually coming out on top. The Shitlickers were left with a bitter taste in their mouths and no invitation to the Slootbowl.",

  [key("2024", 16, 4, 9)]:
    "The OBFC Championship Game was another deeply unpleasant experience for East Rutherford Shitlickers. Isle of Wight Happy Endings squeezed past them 142.96–140.10, a 2.86-point defeat that left the Shitlickers tasting conference championship heartbreak for the second year running. Apparently some people never learn when to keep their mouths shut.",

  [key("2023", 17, 2, 4)]:
    "Cambridge Cum Sluts turned up to the Slootbowl looking for a good time, but Isle of Wight Happy Endings had the final say. Isle of Wight prevailed 154.44–146.46, delivering the Happy Ending their name had promised. Cambridge were left eight points short of satisfaction and with absolutely nothing to show for their efforts.",

  [key("2022", 16, 7, 8)]:
    "Kalamata Dirty Vegans were hoping to serve up something wholesome in the OBFC Championship Game, but Weybiza BAB’s brought an entirely different menu. Weybiza edged the Vegans 126.06–123.84, leaving Kalamata 2.22 points short and thoroughly unsatisfied. A narrow escape for the BAB’s, and a bitter mouthful for the Vegans.",

  [key("2022", 7, 7, 8)]:
    "Weybiza BAB’s entered Week 7 with a perfect 6–0 record, their enormous confidence apparently impossible to contain. Kalamata Dirty Vegans, sitting at 3–3, promptly shoved that confidence somewhere uncomfortable. A 112.82–112.20 upset by just 0.62 points brought the unbeaten run to a spectacularly premature end.",

  [key("2025", 4, 1, 5)]:
    "Mt Isa Ballbags were looking a little deflated at 1–2, while the unbeaten Grays Town Fingerblasters were riding high at 3–0. But the Ballbags swelled to the occasion, hanging 154.18 points on Grays Town and squeezing out a 5.30-point upset. The Fingerblasters finally found themselves on the receiving end.",

  [key("2024", 8, 5, 9)]:
    "East Rutherford Shitlickers arrived at 7–0, apparently convinced they were untouchable. Grays Town Fingerblasters had other plans, slipping past them 169.46–165.94. A 3.52-point upset that saw the Fingerblasters find exactly the right spot and the Shitlickers finally taste defeat.",

  [key("2023", 5, 4, 9)]:
    "Isle of Wight Happy Endings had spent four weeks giving everyone exactly what their name suggested, opening 4–0. Then the 2–2 East Rutherford Shitlickers showed up and spoiled the mood. A 130.98–127.90 upset gave East Rutherford the last laugh, leaving the Happy Endings distinctly unfinished.",

  [key("2025", 4, 2, 3)]:
    "Cambridge Cum Sluts fancied their chances against a Grimsby Chode Chokers side sitting at 1–2. Unfortunately for Cambridge, Grimsby chose precisely the wrong moment to stop choking. A 134.04–132.92 victory by just 1.12 points left the Cum Sluts with a thoroughly disappointing finish.",

  [key("2024", 12, 3, 7)]:
    "Grimsby Chode Chokers entered at 8–3 and looked ready to swallow the 5–6 Kalamata Dirty Vegans whole. Instead, Grimsby lived up to their name and choked on a 154.44–152.12 defeat. The Vegans escaped with a 2.32-point upset, proving that sometimes the meat-free option still delivers a proper stuffing.",

  [key("2025", 16, 6, 9)]:
    "Lincoln Nonces had made it all the way to the OBFC Championship Game, only to run into East Rutherford Shitlickers with their mouths wide open. East Rutherford piled on 164.46 points to Lincoln’s 153.50, claiming the conference crown by 10.96 and earning a trip to the Slootbowl. Lincoln were left watching from the sidelines, which was probably for the best.",

  [key("2025", 15, 1, 10)]:
    "Mt Isa Ballbags arrived in the playoffs at 8–6, looking considerably healthier than Chad Moist Discharge at 5–9. But Chad chose the postseason to start leaking points everywhere. A 127.74–121.02 victory sent the Ballbags packing and kept Chad’s deeply improbable Slootbowl run alive.",

  [key("2023", 6, 8, 10)]:
    "Weybiza BAB’s came into Week 6 at 3–2, only to discover that Chad Moist Discharge had been quietly building pressure. Chad erupted for 136.00 points against Weybiza’s 134.88, stealing a 1.12-point victory. The BAB’s were left wondering how such a small discharge could make such a mess.",

  [key("2024", 7, 4, 7)]:
    "Isle of Wight Happy Endings were looking to even their record at 3–3, but Kalamata Dirty Vegans had other ideas. The Vegans snatched a 131.46–130.96 victory by just half a point, leaving Isle of Wight agonisingly close to a Happy Ending. Half a point: barely enough to satisfy anyone.",

  [key("2025", 7, 1, 10)]:
    "Mt Isa Ballbags and Chad Moist Discharge produced 349.80 points of absolute nonsense in Week 7. The Ballbags swelled to 176.40, while Chad unloaded 173.40 in response. Three points separated the pair when the dust settled, with Mt Isa just managing to keep their sack intact.",

  [key("2022", 5, 1, 3)]:
    "Four weeks, four losses, and Mt Isa Ballbags were looking thoroughly deflated. Then Grimsby Chode Chokers came along and offered them something to squeeze. The Ballbags scraped together a 92.00–89.84 victory, finally getting their first win of the season. Grimsby, meanwhile, managed to choke on a team that hadn't beaten anyone.",

  [key("2023", 12, 1, 8)]:
    "Mt Isa Ballbags put up a respectable 148.80 points against Weybiza BAB’s, but respectable wasn't quite enough. Weybiza managed to squeeze out 150.12, leaving the Ballbags dangling just 1.32 points short. A painful reminder that size isn't everything, although the BAB’s would presumably disagree.",

  [key("2024", 9, 5, 10)]:
    "Grays Town Fingerblasters and Chad Moist Discharge spent Week 9 making an absolute mess of the scoreboard. The Fingerblasters finished on 151.92, just 1.72 ahead of Chad’s 150.20. Grays Town found the winning touch, while Chad were left with an unfortunate case of premature discharge.",

  [key("2024", 11, 5, 7)]:
    "Grays Town Fingerblasters entered at 8–2, looking rather pleased with themselves. Kalamata Dirty Vegans, sitting at 4–6, decided to ruin the mood with a 148.70–140.58 victory. The Fingerblasters got an unexpected stuffing, and for once the Vegans were the ones serving it.",

  [key("2023", 14, 5, 10)]:
    "Grays Town Fingerblasters and Chad Moist Discharge delivered a Week 14 contest that nobody could comfortably explain to their parents. Grays Town squeezed out a 143.82–142.20 victory, a margin of just 1.62 points. The Fingerblasters finished on top, leaving Chad with one final regular-season mess to clean up.",

  [key("2026", 3, 4, 6)]:
    "Isle of Wight Happy Endings were just 0.40 points away from getting what they wanted, but Lincoln Nonces spoiled the occasion. Lincoln edged a 129.32–128.92 victory, leaving Isle of Wight painfully short of satisfaction. Forty hundredths of a point: a truly pathetic distance between pleasure and misery.",

  [key("2023", 8, 3, 8)]:
    "Grimsby Chode Chokers and Weybiza BAB’s produced 297.24 combined points in a thoroughly indecent Week 8 encounter. Grimsby somehow avoided living up to their name, holding on for a 150.14–147.10 victory. Weybiza were left 3.04 points short, with the BAB’s looking rather less impressive than advertised.",

  [key("2022", 2, 3, 10)]:
    "Grimsby Chode Chokers and Chad Moist Discharge met in Week 2 for a contest that sounded like a medical emergency before a ball was even thrown. Grimsby escaped 129.68–128.62, winning by just 1.06 points. Chad produced plenty of discharge but couldn't quite finish the job.",
};

function genericReport(
  game: GreatestGame,
  context: ReportContext
) {
  const winnerId = game.winnerId;

  if (winnerId === null) {
    return (
      `${name(game.rosterA)} and ${name(game.rosterB)} ` +
      `finished level after ${pts(game.combinedScore)} ` +
      `combined points. All that effort and neither ` +
      `side managed to finish on top. Embarrassing.`
    );
  }

  const loserId =
    winnerId === game.rosterA
      ? game.rosterB
      : game.rosterA;

  const winner = short(winnerId);
  const loser = short(loserId);
  const margin = pts(game.margin);
  const total = pts(game.combinedScore);

  const winnerScore =
    winnerId === game.rosterA
      ? game.scoreA
      : game.scoreB;

  const loserScore =
    winnerId === game.rosterA
      ? game.scoreB
      : game.scoreA;

  const winnerRecord = record(
    winnerId === game.rosterA
      ? game.pregameRecordA
      : game.pregameRecordB
  );

  const loserRecord = record(
    winnerId === game.rosterA
      ? game.pregameRecordB
      : game.pregameRecordA
  );

  const insults: Record<number, string[]> = {
    1: [
      "the Ballbags were left hanging",
      "Mt Isa's sack took a proper beating",
      "the Ballbags were thoroughly deflated",
    ],
    2: [
      "Cambridge were left completely unsatisfied",
      "the Cum Sluts got a thoroughly disappointing finish",
      "Cambridge came away empty-handed",
    ],
    3: [
      "Grimsby choked when it mattered",
      "the Chode Chokers swallowed a painful defeat",
      "Grimsby lived up to their unfortunate name",
    ],
    4: [
      "there was no Happy Ending in sight",
      "Isle of Wight were denied their climax",
      "the Happy Endings finished second",
    ],
    5: [
      "the Fingerblasters completely missed the spot",
      "Grays Town lost their touch",
      "the Fingerblasters were left fumbling",
    ],
    6: [
      "Lincoln were left looking deeply uncomfortable",
      "the Nonces had a thoroughly miserable afternoon",
      "Lincoln were sent packing",
    ],
    7: [
      "the Vegans got absolutely stuffed",
      "Kalamata discovered this wasn't cruelty-free",
      "the Dirty Vegans were served a nasty surprise",
    ],
    8: [
      "Weybiza's BAB’s were left badly bruised",
      "the BAB’s had a disappointing showing",
      "Weybiza were left feeling rather small",
    ],
    9: [
      "the Shitlickers were left with a foul taste",
      "East Rutherford had to swallow a bitter result",
      "the Shitlickers got a mouthful of misery",
    ],
    10: [
      "Chad's discharge proved disappointingly weak",
      "Chad couldn't quite finish the job",
      "the Moist Discharge dried up at the worst moment",
    ],
  };

  const winnerFlavour: Record<number, string[]> = {
    1: [
      "the Ballbags swelled to the occasion",
      "Mt Isa kept their sack intact",
      "the Ballbags found something worth squeezing",
    ],
    2: [
      "Cambridge finally got the finish they wanted",
      "the Cum Sluts came out on top",
      "Cambridge enjoyed a thoroughly satisfying result",
    ],
    3: [
      "Grimsby somehow remembered how not to choke",
      "the Chode Chokers held their nerve",
      "Grimsby kept their gag reflex under control",
    ],
    4: [
      "Isle of Wight got their Happy Ending",
      "the Happy Endings delivered a satisfying climax",
      "Isle of Wight finished exactly where they wanted",
    ],
    5: [
      "the Fingerblasters found the right spot",
      "Grays Town's touch proved decisive",
      "the Fingerblasters worked their magic",
    ],
    6: [
      "Lincoln got the job done",
      "the Nonces escaped with the spoils",
      "Lincoln had the last laugh",
    ],
    7: [
      "the Vegans served up a proper stuffing",
      "Kalamata proved surprisingly hard to swallow",
      "the Dirty Vegans delivered the goods",
    ],
    8: [
      "the BAB’s stood tall when it mattered",
      "Weybiza squeezed out the result",
      "the BAB’s came out swinging",
    ],
    9: [
      "the Shitlickers got the last laugh",
      "East Rutherford found the winning taste",
      "the Shitlickers swallowed their nerves",
    ],
    10: [
      "Chad unloaded at precisely the right moment",
      "the Moist Discharge proved unstoppable",
      "Chad finished with an impressive eruption",
    ],
  };

  // Deterministic variation: a game always gets
  // the same report, regardless of category.
  const seed =
    Number(game.season) * 17 +
    game.week * 13 +
    winnerId * 7 +
    loserId * 11;

  const pick = (options: string[]) =>
    options[seed % options.length];

  const loserJoke = pick(
    insults[loserId] ?? [`${loser} were left disappointed`]
  );

  const winnerJoke = pick(
    winnerFlavour[winnerId] ??
      [`${winner} got the job done`]
  );

  if (context.isSlootbowl) {
    return (
      `${name(winnerId)} claimed the Slootbowl ` +
      `with a ${pts(winnerScore)}–${pts(loserScore)} ` +
      `victory over ${name(loserId)}. ` +
      `After ${total} combined points, ${winnerJoke} ` +
      `and ${loserJoke}. One franchise gets the ` +
      `trophy; the other gets mercilessly rinsed ` +
      `in the group chat.`
    );
  }

  if (
    context.isConferenceChampionship &&
    context.conferenceName
  ) {
    return (
      `The ${context.conferenceName} Championship ` +
      `Game delivered ${total} combined points, ` +
      `with ${winner} edging ${loser} by ${margin}. ` +
      `${winnerJoke.charAt(0).toUpperCase() + winnerJoke.slice(1)}, ` +
      `while ${loserJoke}. A conference crown ` +
      `and a Slootbowl berth were the reward.`
    );
  }

  if (context.isBiggestDemolition) {
    return (
      `${name(winnerId)} inflicted the biggest ` +
      `pounding in SFL history, putting up ` +
      `${pts(winnerScore)} against ${loser}'s ` +
      `${pts(loserScore)}. A ${margin}-point ` +
      `humiliation that left ${loserJoke}. ` +
      `Somebody check on the group chat.`
    );
  }

  if (game.margin >= 75) {
    return (
      `${name(winnerId)} absolutely pulverised ` +
      `${name(loserId)}, winning by ${margin} ` +
      `points. ${winnerJoke.charAt(0).toUpperCase() + winnerJoke.slice(1)}, ` +
      `while ${loserJoke}. This one probably ` +
      `deserves a formal apology.`
    );
  }

  if (game.margin <= 1) {
    return (
      `${name(winnerId)} squeezed past ${name(loserId)} ` +
      `by a microscopic ${margin} points. ` +
      `${winnerJoke.charAt(0).toUpperCase() + winnerJoke.slice(1)}, ` +
      `and ${loserJoke}. The sort of result ` +
      `that causes a week-long argument ` +
      `over stat corrections.`
    );
  }

  if (game.isUpset) {
    return (
      `${winner} entered at ${winnerRecord} against ` +
      `${loser}'s ${loserRecord}, but apparently ` +
      `nobody told them how this was supposed ` +
      `to go. ${name(winnerId)} pulled off a ` +
      `${margin}-point upset. ${loserJoke.charAt(0).toUpperCase() + loserJoke.slice(1)}.`
    );
  }

  if (game.phase === "Main Playoffs") {
    return (
      `${name(winnerId)} sent ${name(loserId)} ` +
      `packing with a ${margin}-point playoff ` +
      `victory. ${winnerJoke.charAt(0).toUpperCase() + winnerJoke.slice(1)}, ` +
      `while ${loserJoke}. Slootbowl dreams ` +
      `remained alive for one side only.`
    );
  }

  if (game.combinedScore >= 330) {
    return (
      `${winner} and ${loser} combined for a ` +
      `positively obscene ${total} points. ` +
      `${name(winnerId)} came out ${margin} points ` +
      `ahead, proving that ${winnerJoke}. ` +
      `As for ${loser}, ${loserJoke}.`
    );
  }

  return (
    `${name(winnerId)} defeated ${name(loserId)} ` +
    `${pts(winnerScore)}–${pts(loserScore)} ` +
    `in Week ${game.week}. ${winnerJoke.charAt(0).toUpperCase() + winnerJoke.slice(1)}, ` +
    `while ${loserJoke}. A perfectly ordinary ` +
    `fantasy result, if you ignore everything ` +
    `about these franchises.`
  );
}

export function getGreatestGameCommentary(
  game: GreatestGame,
  context: ReportContext
): string {
  return BESPOKE[gameKey(game)] ?? genericReport(game, context);
}
