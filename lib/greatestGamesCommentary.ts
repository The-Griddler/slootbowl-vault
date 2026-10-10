
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

function name(id: number, season: string): string {
  if (id === 1 && Number(season) < 2026) {
    return "Perth Ballbags";
  }
  return NAMES[id] ?? `Franchise ${id}`;
}

function short(id: number, season: string): string {
  if (id === 1 && Number(season) < 2026) {
    return "Perth";
  }
  return SHORT[id] ?? name(id, season);
}

function pts(value: number): string {
  return value.toFixed(2);
}

function key(
  season: string,
  week: number,
  a: number,
  b: number
): string {
  return [
    season,
    week,
    Math.min(a, b),
    Math.max(a, b),
  ].join(":");
}

function gameKey(game: GreatestGame): string {
  return key(
    game.season,
    game.week,
    game.rosterA,
    game.rosterB
  );
}

// Historical editorial reports.
//
// Results and scores come from Sleeper.
// League history comes from Sloot News Issues 1–6.
//
// Reports are keyed by season, week and franchise pair,
// so the same game gets the same report in every category.

const BESPOKE: Record<string, string> = {
  [key("2025", 17, 9, 10)]:
    `Ladies and gentlemen, your back-to-back Slootbowl champions: the 5–9 Chad Moist Discharge. Josh Thomas entered Week 11 at 3–8, somehow made the playoffs, and arrived at Slootbowl IV facing a Shitlickers side that had finally broken George Pendleton's stranglehold on the OBFC. Tarl Brayer had spent two years losing conference finals to Isle of Wight by a combined 3.70 points. Surely the football gods had finished kicking this man in the bollocks. Apparently not. Chad won 140.58–140.46, a difference of 0.12 points, to become the SFL's first two-time champions and extend their postseason winning streak to six. Jared Goff, in particular, has been advised against holidaying in East Rutherford. An independent investigation into Josh's December activities has been requested. The commissioner has declined on the grounds that being shit for fourteen weeks is, regrettably, not against league rules.`,

  [key("2024", 17, 4, 10)]:
    `George Pendleton was one victory from becoming the SFL's first two-time champion. His Happy Endings had dispatched Kalamata and survived another agonising OBFC Championship against Tarl Brayer. They then posted 186.14 points in Slootbowl III, a score that would normally justify ordering a trophy cabinet. Unfortunately, Josh Thomas had spent the first ten weeks disguising Chad as a mediocre football team before unleashing absolute carnage in December. Chad won 189.66–186.14 in a 375.80-point championship, the highest-scoring game in SFL history. Josh's side averaged 192.4 points across the playoffs after starting the year 4–6. George was understandably furious. We reminded him that defence wins championships, a particularly useful observation in a league that doesn't field defences.`,

  [key("2023", 16, 4, 9)]:
    `For a brief moment, it looked as though Tarl Brayer might finally be heading to the Slootbowl. East Rutherford and Isle of Wight combined for an outrageous 354.56 points in the OBFC Championship Game, with Josh Allen's Shitlickers giving George Pendleton absolutely everything. The problem was that George gave back 0.84 points more. The Happy Endings escaped 177.70–176.86 and went on to win Slootbowl II, while Tarl was left to contemplate how an excellent season could end in a defeat smaller than the value of a modest reception. At the time it looked like extraordinary bad luck. Twelve months later, it looked suspiciously like the start of a curse.`,

  [key("2024", 16, 4, 9)]:
    `Same managers, same conference championship, same deeply unpleasant ending for Tarl Brayer. The Shitlickers had gone 11–3 after opening the season 7–0, only to find George Pendleton waiting at the last obstacle before the Slootbowl. Isle of Wight won 142.96–140.10, sending East Rutherford home from the OBFC Championship Game for the second consecutive season. Across those two defeats, Tarl had lost by a combined 3.70 points. George, meanwhile, was heading to a second straight Slootbowl. We understand the Shitlickers have asked the league to investigate whether Pendleton is legally permitted to keep doing this to the same man.`,

  [key("2023", 17, 2, 4)]:
    `Cambridge Cum Sluts arrived at Slootbowl II as the defending champions, with Ben Smith attempting to establish the league's first proper dynasty. George Pendleton had other ideas. Twelve months earlier, the Happy Endings had finished 6–8; now they were 12–2, powered by a roster featuring breakout stars and the extraordinary undrafted pickup of Puka Nacua. Isle of Wight won 154.44–146.46 to claim their first Slootbowl and complete one of the SFL's great single-season turnarounds. Ben had reached both of the league's first two championship games, an impressive achievement that offered absolutely no consolation while George celebrated with a trophy and, somehow, the rights to another high draft pick.`,

  [key("2022", 16, 7, 8)]:
    `The inaugural OBFC Championship Game brought together two very different success stories. Jack Brannigan's Weybiza BAB's had gone 12–2, led the league in regular-season scoring and entered as the conference's great hope. Ollie Payne's Kalamata Dirty Vegans had put together an impressive inaugural campaign of their own. For one afternoon, Ollie came within 2.22 points of reaching the first Slootbowl. Weybiza survived 126.06–123.84, booking their place in the championship game. Brannigan would lose that final to Cambridge, but in 2022 the BAB's were genuinely frightening. Yes, Jack. We have documentary evidence.`,

  [key("2022", 7, 7, 8)]:
    `Weybiza had won six straight to begin the inaugural SFL season, and Jack Brannigan was developing the sort of confidence normally reserved for men who haven't looked at their future draft-pick balance. Kalamata entered at 3–3 and ruined the perfect start by 0.62 points, winning 112.82–112.20. Ollie Payne would later meet the BAB's again in the OBFC Championship Game and come out on the wrong side of another narrow result. The two sides spent 2022 proving that the difference between conference glory and looking like an absolute tit can be measured in fractions of a fantasy point.`,

  [key("2025", 4, 1, 5)]:
    `Ryan Whiting's Fingerblasters arrived unbeaten at 3–0, having spent the previous season transforming Grays Town from the GPFC's favourite punching bag into an 11-win powerhouse. Ed Nelms and the Ballbags, meanwhile, were 1–2 and had heard quite enough about everybody else's successful rebuild. Mt Isa responded with 154.18 points to Grays Town's 148.88, claiming a 5.30-point upset in the latest chapter of the old Baring Street feud, also known as the Jai Ho Series. The commissioner has requested that this game be recognised as proof of his superior football intellect. The rest of the league has requested that he shut the fuck up.`,

  [key("2024", 8, 5, 9)]:
    `East Rutherford had opened 2024 with seven consecutive wins. Tarl Brayer's veteran-heavy Shitlickers were the OBFC's form team, and their manager had every reason to believe this might finally be his year. Enter Ryan Whiting, whose rebuilt Fingerblasters were beginning to look like a legitimate GPFC contender. Grays Town won a spectacular interconference contest 169.46–165.94, handing Tarl his first defeat by just 3.52 points. The result revived the old CrossCon rivalry, born from Whiting's resentment over an Ozzy Bay final defeat to Tarl. Years later, the man still apparently holds a grudge. Fair play to him; it's the only healthy way to approach fantasy football.`,

  [key("2023", 5, 4, 9)]:
    `George Pendleton opened 2023 with four straight victories, giving the Happy Endings every reason to believe their miserable 2022 record was behind them. Tarl Brayer's Shitlickers entered at 2–2 and promptly spoiled the party, winning 130.98–127.90. At the time, a 3.08-point regular-season upset seemed like a promising sign that East Rutherford could stand up to their OBFC rivals. By December, George had beaten Tarl in the conference final and gone on to win the Slootbowl. It's a useful reminder that winning the October argument is all well and good, but Pendleton has an irritating habit of getting the last word.`,

  [key("2025", 4, 2, 3)]:
    `Ben Smith's Cambridge side entered Week 4 at 2–1, while Jake Greenwood's Chode Chokers were already wobbling at 1–2. These were two former GPFC heavyweights: Ben had reached the first two Slootbowls, and Jake had made three consecutive playoff appearances without collecting a trophy. Grimsby won 134.04–132.92, a 1.12-point result that offered Jake a rare opportunity to enjoy somebody else's disappointment. Neither franchise would make the 2025 playoffs. In retrospect, this was less a clash of titans than two men fighting over the last intact deckchair on a sinking cruise ship.`,

  [key("2024", 12, 3, 7)]:
    `At 8–3, Jake Greenwood's Grimsby looked set for another postseason appearance. Ollie Payne's Kalamata side were 5–6 and still trying to recover from the previous year's Shitcunt of the Year award. Unfortunately for Jake, the Dirty Vegans hadn't received the memo explaining that they were supposed to lose. Kalamata won 154.44–152.12, an upset by 2.32 points that helped restore a little credibility to Ollie's battered franchise. Grimsby still made the playoffs, where Chad promptly beat them by more than a hundred points. This was, in hindsight, the gentle part of Jake's December humiliation.`,

  [key("2025", 16, 6, 9)]:
    `Garrett Etheridge had finally built something resembling a championship contender. Eleven regular-season wins, 2,179 points, GM of the Year and the OBFC's top seed. After years of starting seasons like a man attempting to operate a toaster underwater, Lincoln had become genuinely excellent. Unfortunately, the playoffs remained a concept Garrett was yet to master. East Rutherford won the OBFC Championship Game 164.46–153.50, booking Tarl Brayer's first Slootbowl appearance. Garrett was left with another postseason defeat and the consolation prize of the 2026 first overall draft pick. The Nonces' championship window is officially open. Somebody should probably teach them how to climb through it.`,

  [key("2025", 15, 1, 10)]:
    `Ed Nelms had spent the 2025 regular season assembling an 8–6 Ballbags side that appeared perfectly capable of competing for the championship. Josh Thomas had spent the same period losing nine games and apparently treating the league table as optional reading. Naturally, Chad won their wildcard meeting 127.74–121.02. It was the beginning of another extraordinary postseason run for the Moist Discharge, who would eventually become back-to-back Slootbowl champions. The commissioner has declined to provide further comment, citing an ongoing investigation into how a 5–9 team is permitted to ruin his fucking season.`,

  [key("2023", 6, 8, 10)]:
    `In 2022, Jack Brannigan had been one win away from becoming the inaugural Slootbowl champion. By Week 6 of 2023, cracks were appearing in the Weybiza empire. Josh Thomas, whose Chad side entered at 2–3, claimed a 136.00–134.88 victory over the 3–2 BAB's. Just 1.12 points separated them, but the wider trajectories were considerably more dramatic. Jack's win-now approach would leave him with an ageing squad and precious little draft capital, while Josh would eventually become the first manager to win two Slootbowls. One of these men had clearly read the dynasty league instructions incorrectly.`,

  [key("2024", 7, 4, 7)]:
    `The Paddletap Bowl has been a fixture of OBFC life since the league's inception, and this edition provided Ollie Payne with something particularly satisfying: an opportunity to irritate George Pendleton. Kalamata entered at 2–4 against Isle of Wight's 3–3 and somehow escaped with a 131.46–130.96 victory. Half a point separated the teams. George would go on to reach his second consecutive Slootbowl, while Ollie eventually returned to the playoffs after his disastrous 2023 season. Both managers could therefore claim progress. Only one got to spend the week reminding the other that he'd lost the fucking Paddletap Bowl.`,

  [key("2025", 7, 1, 10)]:
    `The Ballbags and Moist Discharge produced an outrageous 349.80 combined points in Week 7 of 2025. Ed Nelms emerged victorious, 176.40–173.40, in a result the commissioner has repeatedly described as an exhibition of elite fantasy management. Josh Thomas probably wasn't listening. Chad would finish the regular season 5–9 before winning the Slootbowl, while the Ballbags' own playoff campaign would end at the hands of the very same opponent. Ed won the spectacular regular-season shootout. Josh won the championship. An entirely reasonable sporting system, if your name happens to be Josh Thomas.`,

  [key("2022", 5, 1, 3)]:
    `Welcome to the Shotty Bowl, the rivalry Jake Greenwood apparently felt so strongly about that he nominated Ed Nelms as an enemy three separate times before the league even started. Perth entered Week 5 at 0–4, desperate for a first victory. Grimsby arrived at 2–2 and somehow managed to lose 92.00–89.84. It wasn't pretty, it wasn't particularly high-scoring, and it certainly wasn't an advertisement for the quality of the inaugural GPFC. But the commissioner had his first win, Jake had an embarrassing defeat, and the Shotty Bowl had immediately justified its existence.`,

  [key("2023", 12, 1, 8)]:
    `The Ballbags and Weybiza BAB's met in Week 12 of 2023 with Jack Brannigan's once-dominant franchise beginning to lose its grip on the OBFC. For one afternoon, however, the BAB's remembered how to win an important contest. Weybiza edged Perth 150.12–148.80, a 1.32-point victory that left Ed Nelms deeply unimpressed. Jack had spent the previous offseason trading away significant future draft capital to secure C.J. Stroud. The commissioner, meanwhile, was busy building his own collection of young prospects. Both men were convinced their strategy was the correct one. History has been rather less charitable to Brannigan.`,

  [key("2024", 9, 5, 10)]:
    `Ryan Whiting's rebuilt Fingerblasters were rapidly establishing themselves as one of the GPFC's strongest sides, while Josh Thomas was still trying to turn Chad's inconsistent regular-season form into something useful. Their Week 9 meeting produced a 151.92–150.20 victory for Grays Town, decided by just 1.72 points. At the time, Whiting appeared to have the better championship credentials. Unfortunately, Josh had discovered that the SFL hands out its actual trophy in December. The two would meet again in the GPFC Championship Game, where Chad would have a rather more unpleasant surprise waiting.`,

  [key("2024", 11, 5, 7)]:
    `Grays Town entered Week 11 at 8–2, having spent much of the season demonstrating why Ryan Whiting would eventually be named GM of the Year. Kalamata, meanwhile, sat at 4–6, a considerable improvement on Ollie Payne's previous campaign but hardly a terrifying opponent on paper. The Dirty Vegans won 148.70–140.58, handing Whiting an 8.12-point defeat and reminding the league that even the strongest teams are occasionally vulnerable to a manager who has previously finished dead last. Ollie enjoyed a rare opportunity to lecture somebody else about competent roster construction. Nobody particularly enjoyed listening.`,

  [key("2023", 14, 5, 10)]:
    `Grays Town and Chad entered the final week of the 2023 regular season with little indication of the enormous improvement both franchises would enjoy over the following two years. Whiting's Fingerblasters edged Josh Thomas's Moist Discharge 143.82–142.20, a narrow 1.62-point victory. Neither manager was celebrating a championship that season. By the end of 2025, Josh would have two Slootbowls and Whiting would have transformed Grays Town into a regular-season powerhouse. This was the quiet beginning of a GPFC rivalry that would become considerably more important in December.`,

  [key("2026", 3, 4, 6)]:
    `The Texas Bowl has been one of the OBFC's named rivalries since the inaugural season, although George Pendleton has traditionally enjoyed rather more success than Garrett Etheridge. Their Week 3 meeting in 2026 was decided by the smallest of margins, with Lincoln winning 129.32–128.92. Just 0.40 points separated the Happy Endings from another victory. Garrett had entered the year fresh from an 11-win campaign and a GM of the Year award, but still without a postseason victory to his name. Beating George in September is a pleasant start. Beating anybody in December would be a considerably more useful development.`,

  [key("2023", 8, 3, 8)]:
    `Jake Greenwood's Chode Chokers had endured a catastrophic opening to 2023, losing Aaron Rodgers, J.K. Dobbins and Nick Chubb to season-ending injuries in the first three weeks. Against Weybiza in Week 8, however, Grimsby demonstrated that the season was far from over. Jake's side won 150.14–147.10 in a 297.24-point contest, continuing a recovery that would eventually carry them to the GPFC Championship Game. Jack Brannigan, meanwhile, was watching his 2022 Slootbowl finalist slide towards playoff irrelevance. Both managers had made aggressive roster decisions. Only one was getting anything useful out of them.`,

  [key("2022", 2, 3, 10)]:
    `Jake Greenwood and Josh Thomas met in Week 2 of the inaugural SFL season, before either manager had established his future reputation. Grimsby escaped with a 129.68–128.62 victory, winning by just 1.06 points. Jake would go on to make three consecutive playoff appearances without winning silverware. Josh would eventually become the first back-to-back Slootbowl champion. It is comforting to know that, somewhere in the historical record, Jake can point to a narrow September victory and insist that he was once the superior fantasy football manager.`,

  // Additional closest finishes.

  [key("2023", 14, 6, 7)]:
    `The Trash Bowl has never pretended to be the SFL's most glamorous rivalry. Garrett Etheridge and Ollie Payne earned the name through years of questionable fantasy decisions, and their Week 14 meeting in 2023 delivered the appropriate level of misery. Lincoln won 106.20–106.12, a difference of just 0.08 points. Eight hundredths of a point. Garrett had recovered from a 2–6 start to reach the playoffs, while Ollie was heading towards a 3–11 season and the Shitcunt of the Year award. For once, the Trash Bowl lived up to its name without either team needing to score particularly well.`,

  [key("2023", 1, 1, 9)]:
    `Perth Ballbags opened the 2023 season against East Rutherford Shitlickers, with Ed Nelms hoping that the arrival of first overall rookie pick Bijan Robinson would signal a new era of competent fantasy management. The commissioner escaped with a 115.08–114.56 victory, winning by just 0.52 points. Tarl Brayer would go on to reach the OBFC Championship Game, where he would suffer an even more consequential narrow defeat to Isle of Wight. The Ballbags, meanwhile, could at least celebrate starting the year with a victory. A rare occasion on which the commissioner's optimism survived contact with reality.`,

  // Additional highest-scoring games.

  [key("2023", 8, 5, 7)]:
    `Grays Town Fingerblasters and Kalamata Dirty Vegans combined for an absurd 363.34 points in Week 8 of 2023. Ryan Whiting's side scored 194.28, while Ollie Payne somehow managed 169.06 and still lost by 25.22. It was the sort of offensive performance that should guarantee a victory, unless your opponent has decided to turn the entire afternoon into a public execution. Neither franchise would finish the season particularly happy with its overall record. But for one glorious week, two of the league's struggling managers produced enough points to embarrass almost everybody else.`,

  [key("2025", 4, 4, 10)]:
    `George Pendleton's Happy Endings scored a staggering 200.20 points against Chad Moist Discharge in Week 4, and Josh Thomas still managed 149.90 in defeat. The 350.10-point total made this one of the highest-scoring regular-season games in SFL history. At the time, George looked like the manager with championship credentials and Chad looked like the team that had simply been caught in the blast radius. By December, Josh had somehow won a second consecutive Slootbowl with a 5–9 record. It's becoming increasingly difficult to determine which part of the season he thinks is real.`,

  // Additional biggest demolitions.

  [key("2025", 12, 7, 10)]:
    `There are beatings, there are massacres, and then there is what Josh Thomas did to Ollie Payne in Week 12 of 2025. Chad Moist Discharge scored 206.88 points. Kalamata Dirty Vegans scored 62.02. The difference was 144.86 points, the largest margin in SFL history. Ollie would go on to lose the toilet bowl and become the league's first two-time Shitcunt of the Year, while Josh somehow turned a 5–9 regular season into another championship. It is difficult to imagine two managers leaving the same fixture with more different opinions about the existence of a benevolent god.`,

  [key("2024", 15, 3, 10)]:
    `Jake Greenwood's Chode Chokers had made the playoffs for the third consecutive season, a remarkable record for a franchise that has yet to develop a meaningful relationship with silverware. Chad Moist Discharge ended that campaign in the wildcard round by scoring 206.28 points to Grimsby's 103.86, a 102.42-point demolition. Josh had spent much of the regular season fighting for a playoff berth; apparently he'd been saving the actual football for when it mattered. Jake was sent home to prepare for another offseason of explaining why his team is definitely a contender this time.`,

  [key("2026", 4, 8, 9)]:
    `The Jelly Legs Showdown has its roots in the shared injury history of Tarl Brayer and Jack Brannigan, two men whose lower limbs have provided the league with more material than most franchises' entire trophy cabinets. Their Week 4 meeting in 2026 was less a rivalry contest than an organised execution. East Rutherford scored 182.30 points to Weybiza's 85.06, winning by 97.24. Tarl's Shitlickers have spent years flirting with Slootbowl glory; Brannigan has spent the same period turning a once-great roster into an elaborate warning about trading future picks. On this evidence, neither trend is reversing soon.`,

  [key("2025", 9, 6, 8)]:
    `Lincoln Nonces hammered Weybiza BAB's 185.10–88.30 in Week 9 of 2025, a 96.80-point mismatch between a genuine OBFC contender and a franchise apparently conducting an experiment into how few fantasy points ten grown men can produce. Garrett Etheridge would finish the regular season 11–3 and win GM of the Year. Jack Brannigan would finish with the league's first sub-100-point weekly scoring average across a full season. For once, even the commissioner struggled to find a way of making Garrett the more embarrassing manager.`,

  [key("2023", 13, 3, 10)]:
    `Grimsby Chode Chokers scored 201.70 points against Chad Moist Discharge in Week 13 of 2023, winning by 89.86 after Josh Thomas could muster only 111.84. Jake Greenwood's injury-ravaged side had clawed its way back into contention and was building towards another GPFC Championship appearance. Chad, meanwhile, looked like a franchise heading for an uncomfortable offseason. Within a year, Josh would be Slootbowl champion and Jake would be on the receiving end of a 102.42-point playoff demolition by the very same opponent. Fantasy football is a deeply stupid sport.`,
};

// Established rivalry names.
// These also give future games relevant commentary
// without requiring every matchup to be hand-written.

const RIVALRIES: Record<string, string> = {
  "1:5":
    "the Jai Ho Series, originally the Baring Street Brawl between former housemates Ed Nelms and Ryan Whiting",
  "2:10":
    "Flobageddon, the Ben Smith–Josh Thomas feud dating back to their schooldays",
  "8:9":
    "the Jelly Legs Showdown, born from Jack Brannigan and Tarl Brayer's shared history of leg-related calamity",
  "1:3":
    "the Shotty Bowl, fuelled by Jake Greenwood repeatedly nominating Ed Nelms as his rival",
  "5:9":
    "CrossCon, a grudge Ryan Whiting carried over from an old Ozzy Bay final against Tarl Brayer",
  "4:6":
    "the Texas Bowl, featuring George Pendleton and Garrett Etheridge",
  "4:7":
    "the Paddletap Bowl, the long-running George Pendleton–Ollie Payne rivalry",
  "6:7":
    "the Trash Bowl, an appropriately named fixture between Garrett Etheridge and Ollie Payne",
};

const WINNER_NOTES: Record<number, string> = {
  1:
    "Ed Nelms has already declared the result evidence of his exceptional leadership. Independent verification remains unavailable.",
  2:
    "Ben Smith's Cum Sluts have a championship pedigree, although their supporters have learned that pedigree doesn't guarantee a happy ending.",
  3:
    "Jake Greenwood will take the win; given Grimsby's postseason history, nobody should begrudge him a pleasant afternoon.",
  4:
    "George Pendleton has made winning an irritating habit, and his rivals would very much appreciate it if he found another hobby.",
  5:
    "Ryan Whiting has come a long way from the Fingerblasters' early years as the GPFC's designated punching bag.",
  6:
    "Garrett Etheridge has spent years assembling a talented Lincoln squad; his remaining challenge is persuading it to win a playoff game.",
  7:
    "Ollie Payne will be delighted to have supplied the league with something other than another reason to mock Kalamata.",
  8:
    "Jack Brannigan's glory days feel increasingly distant, so every victory is worth enjoying before somebody asks about his draft picks.",
  9:
    "Tarl Brayer's Shitlickers rarely lack regular-season quality. The question, as ever, is whether they can survive December.",
  10:
    "Josh Thomas has demonstrated that the relationship between regular-season form and championship success is entirely optional.",
};

const LOSER_NOTES: Record<number, string> = {
  1:
    "The commissioner has disputed the result and is considering an emergency rule change.",
  2:
    "Ben Smith will have to settle for reminding everyone that Cambridge won the inaugural Slootbowl.",
  3:
    "For Jake Greenwood, this is another entry in an increasingly substantial catalogue of disappointment.",
  4:
    "George Pendleton will presumably explain why the result is everybody else's fault.",
  5:
    "Whiting has experienced worse, although that is a particularly grim standard by which to judge an afternoon.",
  6:
    "Garrett's collection of excuses remains considerably larger than his postseason win total.",
  7:
    "Ollie has been through enough of these to know that the group chat will not be merciful.",
  8:
    "Brannigan has endured enough humiliation that this barely registers on the Weybiza disaster scale.",
  9:
    "Tarl knows better than most that narrow defeats have a nasty habit of becoming historical exhibits.",
  10:
    "Josh will probably win the Slootbowl anyway, so nobody should get too excited.",
};

function genericReport(
  game: GreatestGame,
  context: ReportContext
): string {
  if (game.winnerId === null) {
    return (
      `${name(game.rosterA, game.season)} and ` +
      `${name(game.rosterB, game.season)} finished ` +
      `level after ${pts(game.combinedScore)} ` +
      `combined points. Nobody won, and somehow ` +
      `both managers will still claim they deserved to.`
    );
  }

  const winnerId = game.winnerId;

  const loserId =
    winnerId === game.rosterA
      ? game.rosterB
      : game.rosterA;

  const winnerScore =
    winnerId === game.rosterA
      ? game.scoreA
      : game.scoreB;

  const loserScore =
    winnerId === game.rosterA
      ? game.scoreB
      : game.scoreA;

  const winner = short(winnerId, game.season);
  const loser = short(loserId, game.season);

  const matchup =
    `${pts(winnerScore)}–${pts(loserScore)}`;

  const pair = [
    Math.min(winnerId, loserId),
    Math.max(winnerId, loserId),
  ].join(":");

  const rivalry = RIVALRIES[pair];

  const lead = rivalry
    ? (
      `The latest instalment of ${rivalry} ` +
      `ended ${matchup} in favour of ${winner}. `
    )
    : (
      `${name(winnerId, game.season)} defeated ` +
      `${name(loserId, game.season)} ` +
      `${matchup} in Week ${game.week} ` +
      `of ${game.season}. `
    );

  const winnerNote =
    WINNER_NOTES[winnerId] ??
    `${winner} got the job done.`;

  const loserNote =
    LOSER_NOTES[loserId] ??
    `${loser} were left disappointed.`;

  if (context.isSlootbowl) {
    return (
      `${name(winnerId, game.season)} claimed ` +
      `the Slootbowl with a ${matchup} victory. ` +
      `${pts(game.combinedScore)} combined points ` +
      `decided the biggest prize in SFL football. ` +
      `${winnerNote} ${loserNote}`
    );
  }

  if (context.isConferenceChampionship) {
    const conference =
      context.conferenceName ?? "Conference";

    return (
      `${lead}The ${conference} Championship ` +
      `Game ended with a ${pts(game.margin)}-point ` +
      `margin and a Slootbowl berth for ` +
      `${MANAGERS[winnerId]}. ${loserNote}`
    );
  }

  if (
    context.isBiggestDemolition ||
    game.margin >= 75
  ) {
    return (
      `${lead}A ${pts(game.margin)}-point margin ` +
      `is not a defeat so much as a formal ` +
      `request for the losing manager to ` +
      `reconsider his hobbies. ${loserNote}`
    );
  }

  if (game.margin <= 1) {
    return (
      `${lead}Just ${pts(game.margin)} points ` +
      `separated the teams, the sort of result ` +
      `that sends grown men hunting through ` +
      `stat corrections and demanding a recount. ` +
      `${loserNote}`
    );
  }

  if (game.phase === "Main Playoffs") {
    return (
      `${lead}A ${pts(game.margin)}-point ` +
      `postseason win kept ${winner}'s ` +
      `championship hopes alive and ended ` +
      `${loser}'s. ${loserNote}`
    );
  }

  if (game.isUpset) {
    const winnerRecord =
      winnerId === game.rosterA
        ? game.pregameRecordA
        : game.pregameRecordB;

    const loserRecord =
      winnerId === game.rosterA
        ? game.pregameRecordB
        : game.pregameRecordA;

    return (
      `${lead}${winner} entered at ` +
      `${winnerRecord} against ${loser}'s ` +
      `${loserRecord}, but the form book ` +
      `was evidently being used as toilet paper. ` +
      `${winnerNote}`
    );
  }

  if (
    game.combinedScore >= 330 ||
    context.isHighestScoring
  ) {
    return (
      `${lead}The two sides combined for ` +
      `${pts(game.combinedScore)} points, ` +
      `an obscene amount of offence for a ` +
      `game in which somebody still had to lose. ` +
      `${loserNote}`
    );
  }

  return `${lead}${winnerNote} ${loserNote}`;
}

export function getGreatestGameCommentary(
  game: GreatestGame,
  context: ReportContext
): string {
  return (
    BESPOKE[gameKey(game)] ??
    genericReport(game, context)
  );
}
