
/**
 * SLOOT NEWS — EDITORIAL FORMAT CATALOGUE
 *
 * 50 distinct formats across five journalists.
 *
 * This module:
 * - Defines ten formats per journalist.
 * - Describes the structure of each format.
 * - Checks whether the available evidence supports it.
 * - Assigns formats deterministically.
 * - Avoids repeating a format within ten appearances.
 *
 * It does NOT generate article prose.
 *
 * No database, AI API or external service required.
 */

export type JournalistId =
  | "pembroke"
  | "graves"
  | "mcnulty"
  | "bellend"
  | "pissworth";

export type EvidenceKey =
  | "result"
  | "star"
  | "collapse"
  | "surprise"
  | "rivalry"
  | "closeGame"
  | "blowout"
  | "shootout"
  | "winningStreak"
  | "losingStreak"
  | "highScoringLoss"
  | "lowScoringWin"
  | "historicalMeeting";

export type ArticleStructure =
  | "narrative"
  | "sections"
  | "numbered"
  | "transcript"
  | "letter"
  | "questions"
  | "ranking"
  | "essay"
  | "timeline"
  | "dialogue";

export type EditorialEvidence = {
  result: boolean;
  star: boolean;
  collapse: boolean;
  surprise: boolean;
  rivalry: boolean;
  closeGame: boolean;
  blowout: boolean;
  shootout: boolean;
  winningStreak: boolean;
  losingStreak: boolean;
  highScoringLoss: boolean;
  lowScoringWin: boolean;
  historicalMeeting: boolean;
};

export type StoryFormatDefinition = {
  id: string;
  journalist: JournalistId;
  name: string;
  structure: ArticleStructure;
  description: string;

  /**
   * Every listed requirement must be supported
   * by actual match or historical evidence.
   */
  requires: EvidenceKey[];

  /**
   * Optional evidence makes a format a stronger
   * editorial choice, but isn't mandatory.
   */
  prefers: EvidenceKey[];

  /**
   * Editorial blueprint. These are instructions
   * for the future article-writing engine,
   * not prose to display directly.
   */
  blueprint: string[];

  /**
   * Differentiate short pieces, normal articles
   * and substantial features.
   */
  length: "short" | "medium" | "long";
};

type FormatInput = Omit<
  StoryFormatDefinition,
  "journalist"
>;

function define(
  journalist: JournalistId,
  formats: FormatInput[]
): StoryFormatDefinition[] {
  return formats.map((format) => ({
    ...format,
    journalist,
  }));
}

/* ==================================================
   ARTHUR PEMBROKE
   Traditional sports correspondence.
   ================================================== */

const PEMBROKE = define("pembroke", [
  {
    id: "pembroke-match-report",
    name: "Classic Match Report",
    structure: "narrative",
    description:
      "A measured account of the result, with sporting context and understated criticism.",
    requires: ["result"],
    prefers: ["star"],
    blueprint: [
      "Establish the central sporting consequence.",
      "Explain the result and winning margin.",
      "Assess a decisive individual contribution.",
      "Consider what the result means for both managers.",
    ],
    length: "medium",
  },
  {
    id: "pembroke-tactical",
    name: "Tactical Breakdown",
    structure: "sections",
    description:
      "A structured assessment of where fantasy points were won and lost.",
    requires: ["result"],
    prefers: ["star", "collapse"],
    blueprint: [
      "Identify the central scoring imbalance.",
      "Examine the strongest starting contribution.",
      "Compare supporting performances where available.",
      "Deliver a restrained tactical verdict.",
    ],
    length: "long",
  },
  {
    id: "pembroke-profile",
    name: "Star Player Profile",
    structure: "narrative",
    description:
      "A player-centred feature examining the standout performance.",
    requires: ["result"],
    prefers: ["star", "surprise"],
    blueprint: [
      "Introduce the winning team's leading scorer.",
      "Explain their contribution to the final score.",
      "Compare with historical form if available.",
      "Explore how much credit belongs to the manager.",
    ],
    length: "medium",
  },
  {
    id: "pembroke-comeback",
    name: "Anatomy of a Recovery",
    structure: "sections",
    description:
      "A retrospective on a franchise recovering from previous defeats or poor form, without inventing in-game comebacks.",
    requires: ["result"],
    prefers: ["losingStreak"],
    blueprint: [
      "Describe the franchise's previous difficulties if documented.",
      "Explain the latest winning performance.",
      "Identify evidence of improvement.",
      "Assess whether the recovery is sustainable.",
    ],
    length: "medium",
  },
  {
    id: "pembroke-five-factors",
    name: "Five Decisive Factors",
    structure: "numbered",
    description:
      "Five grounded observations explaining the result.",
    requires: ["result"],
    prefers: ["star", "collapse"],
    blueprint: [
      "Present five distinct facts or analytical observations.",
      "Include player data where supported.",
      "Avoid treating correlations as proven causes.",
      "Finish with the most significant implication.",
    ],
    length: "long",
  },
  {
    id: "pembroke-losing-side",
    name: "The Losing Side's Perspective",
    structure: "narrative",
    description:
      "A sympathetic but unsparing examination of defeat.",
    requires: ["result"],
    prefers: ["collapse", "highScoringLoss"],
    blueprint: [
      "Begin with the defeated franchise.",
      "Identify what worked and what failed.",
      "Discuss an individual performance.",
      "Explain the challenge facing management.",
    ],
    length: "medium",
  },
  {
    id: "pembroke-form-guide",
    name: "Season Form Assessment",
    structure: "sections",
    description:
      "Places the match within the franchise's wider season.",
    requires: ["result"],
    prefers: ["winningStreak", "losingStreak"],
    blueprint: [
      "Establish the latest result.",
      "Compare with documented earlier results.",
      "Identify a trend or lack of consistency.",
      "Assess the next challenge without inventing fixtures.",
    ],
    length: "long",
  },
  {
    id: "pembroke-rivalry",
    name: "Rivalry Retrospective",
    structure: "narrative",
    description:
      "A rivalry feature, using head-to-head history when available.",
    requires: ["result"],
    prefers: ["rivalry", "historicalMeeting"],
    blueprint: [
      "Explain why the fixture matters.",
      "Recall previous meetings only if documented.",
      "Describe the latest outcome.",
      "Consider how the rivalry has changed.",
    ],
    length: "long",
  },
  {
    id: "pembroke-pressure",
    name: "A Manager Under Pressure",
    structure: "questions",
    description:
      "Examines the difficult questions facing the losing manager.",
    requires: ["result"],
    prefers: ["collapse", "losingStreak"],
    blueprint: [
      "Pose the main question facing management.",
      "Examine the available scoring evidence.",
      "Separate poor luck from demonstrated problems.",
      "Offer a measured verdict.",
    ],
    length: "medium",
  },
  {
    id: "pembroke-numbers",
    name: "The Match in Numbers",
    structure: "numbered",
    description:
      "A concise statistical account with minimal editorial theatrics.",
    requires: ["result"],
    prefers: ["star", "shootout"],
    blueprint: [
      "Lead with the most revealing number.",
      "Explain several additional numerical observations.",
      "Connect the numbers to the result.",
      "Conclude with a brief sporting assessment.",
    ],
    length: "short",
  },
]);

/* ==================================================
   MARTIN GRAVES
   Investigative journalism.
   ================================================== */

const GRAVES = define("graves", [
  {
    id: "graves-case-file",
    name: "Confidential Case File",
    structure: "sections",
    description:
      "A formal investigation presented as an evidence dossier.",
    requires: ["result"],
    prefers: ["collapse"],
    blueprint: [
      "Open a numbered case.",
      "Identify the subject of investigation.",
      "Present documented exhibits.",
      "Deliver a deliberately disproportionate finding.",
    ],
    length: "medium",
  },
  {
    id: "graves-audit",
    name: "Fantasy Points Audit",
    structure: "numbered",
    description:
      "An absurd financial-style audit of scoring contributions.",
    requires: ["result"],
    prefers: ["star", "collapse"],
    blueprint: [
      "Declare an audit of fantasy-point expenditure.",
      "Itemise verified contributions.",
      "Identify apparent inefficiencies.",
      "Issue a mock compliance recommendation.",
    ],
    length: "long",
  },
  {
    id: "graves-witnesses",
    name: "Witness Statements",
    structure: "transcript",
    description:
      "A fictionalised hearing in which statistics are treated as witnesses.",
    requires: ["result"],
    prefers: ["star", "collapse"],
    blueprint: [
      "Clearly frame the proceedings as satire.",
      "Introduce the result as evidence.",
      "Let verified numbers answer mock questions.",
      "End with a finding unsupported by common sense.",
    ],
    length: "medium",
  },
  {
    id: "graves-autopsy",
    name: "Forensic Match Autopsy",
    structure: "sections",
    description:
      "A forensic examination of a defeat using final scores and player data.",
    requires: ["result"],
    prefers: ["collapse", "blowout"],
    blueprint: [
      "Record the final outcome.",
      "Identify the largest documented performance concerns.",
      "Compare players with previous form where possible.",
      "State a cause of defeat without inventing play-by-play events.",
    ],
    length: "long",
  },
  {
    id: "graves-timeline",
    name: "Timeline of a Disaster",
    structure: "timeline",
    description:
      "Reconstructs the franchise's sequence of previous results, not unrecorded in-game events.",
    requires: ["result"],
    prefers: ["losingStreak"],
    blueprint: [
      "Establish the earliest documented relevant result.",
      "Trace the subsequent sequence of matches.",
      "Identify the current result.",
      "Explain the accumulated consequences.",
    ],
    length: "medium",
  },
  {
    id: "graves-memo",
    name: "Leaked Internal Memo",
    structure: "letter",
    description:
      "A clearly fictional internal memo satirising franchise management.",
    requires: ["result"],
    prefers: ["collapse"],
    blueprint: [
      "Mark the memo as satirical.",
      "Address the franchise's fictional executives.",
      "Summarise the verified problem.",
      "Propose increasingly ridiculous corrective measures.",
    ],
    length: "short",
  },
  {
    id: "graves-inquiry",
    name: "Public Inquiry Transcript",
    structure: "transcript",
    description:
      "A mock parliamentary inquiry into fantasy management.",
    requires: ["result"],
    prefers: ["blowout", "collapse"],
    blueprint: [
      "Call the imaginary hearing to order.",
      "Present a factual opening statement.",
      "Conduct satirical questioning.",
      "Adjourn with a mock recommendation.",
    ],
    length: "long",
  },
  {
    id: "graves-anomaly",
    name: "Statistical Anomaly Investigation",
    structure: "questions",
    description:
      "Examines an unusual result or performance without alleging real wrongdoing.",
    requires: ["result"],
    prefers: ["surprise", "lowScoringWin"],
    blueprint: [
      "Identify a surprising statistical fact.",
      "Compare it with a documented baseline where possible.",
      "Examine ordinary explanations.",
      "Deliver an unnecessarily suspicious conclusion.",
    ],
    length: "medium",
  },
  {
    id: "graves-management",
    name: "The Evidence Against Management",
    structure: "numbered",
    description:
      "A mock prosecution built from actual fantasy results.",
    requires: ["result"],
    prefers: ["losingStreak", "collapse"],
    blueprint: [
      "Read the fictional charges.",
      "Present several verifiable facts.",
      "Allow an imaginary defence.",
      "Return a satirical verdict.",
    ],
    length: "medium",
  },
  {
    id: "graves-cold-case",
    name: "Cold Case Reopened",
    structure: "narrative",
    description:
      "Revisits a historical grievance or earlier franchise performance.",
    requires: ["result"],
    prefers: ["historicalMeeting", "rivalry"],
    blueprint: [
      "Open with a previously documented event if available.",
      "Explain why the latest result invites comparison.",
      "Contrast the two outcomes.",
      "Close the case or leave it theatrically unresolved.",
    ],
    length: "long",
  },
]);

/* ==================================================
   BAZ MCNULTY
   Tabloid outrage and sensationalism.
   ================================================== */

const MCNULTY = define("mcnulty", [
  {
    id: "mcnulty-scandal",
    name: "Front-Page Scandal",
    structure: "narrative",
    description:
      "A spectacularly exaggerated reaction to a routine result.",
    requires: ["result"],
    prefers: ["blowout"],
    blueprint: [
      "Open with an outrageous declaration.",
      "Reveal the actual result.",
      "Escalate the mock scandal.",
      "Demand immediate and unnecessary action.",
    ],
    length: "short",
  },
  {
    id: "mcnulty-hero",
    name: "Hero Worship Special",
    structure: "sections",
    description:
      "Treats the week's best player like a national treasure.",
    requires: ["result"],
    prefers: ["star", "surprise"],
    blueprint: [
      "Declare the winning franchise's leading scorer a hero.",
      "Present their verified contribution.",
      "Exaggerate their cultural importance.",
      "Question whether the manager deserves any credit.",
    ],
    length: "medium",
  },
  {
    id: "mcnulty-outrage",
    name: "Manager Outrage Column",
    structure: "questions",
    description:
      "An aggressive list of questions directed at management.",
    requires: ["result"],
    prefers: ["collapse"],
    blueprint: [
      "Identify the losing manager.",
      "Ask increasingly hostile rhetorical questions.",
      "Introduce genuine evidence.",
      "Finish with a ridiculous demand.",
    ],
    length: "medium",
  },
  {
    id: "mcnulty-crisis",
    name: "Crisis Countdown",
    structure: "numbered",
    description:
      "Counts down the reasons a franchise is supposedly in crisis.",
    requires: ["result"],
    prefers: ["losingStreak", "blowout"],
    blueprint: [
      "Announce a crisis.",
      "Count down several documented concerns.",
      "Escalate the tone at each stage.",
      "End with an absurdly dramatic forecast.",
    ],
    length: "medium",
  },
  {
    id: "mcnulty-humiliation",
    name: "Public Humiliation Rankings",
    structure: "ranking",
    description:
      "Ranks the most embarrassing aspects of one match.",
    requires: ["result"],
    prefers: ["blowout", "collapse"],
    blueprint: [
      "Introduce the humiliation rankings.",
      "Rank distinct verified facts or satirical observations.",
      "Identify the worst offender.",
      "Award an imaginary punishment.",
    ],
    length: "medium",
  },
  {
    id: "mcnulty-interview",
    name: "Imaginary Exclusive Interview",
    structure: "transcript",
    description:
      "An explicitly fictional interview based on actual results.",
    requires: ["result"],
    prefers: ["star"],
    blueprint: [
      "Clearly label the interview fictional.",
      "Ask pointed questions about the result.",
      "Use verified statistics in the questions.",
      "Give the imaginary subject increasingly ridiculous answers.",
    ],
    length: "long",
  },
  {
    id: "mcnulty-overreaction",
    name: "Overreaction of the Century",
    structure: "narrative",
    description:
      "Makes a wildly premature conclusion from one match.",
    requires: ["result"],
    prefers: ["lowScoringWin", "surprise"],
    blueprint: [
      "Declare an enormous consequence.",
      "Admit the conclusion rests on one result.",
      "Defend it with dubious logic.",
      "Double down despite obvious objections.",
    ],
    length: "short",
  },
  {
    id: "mcnulty-market",
    name: "Transfer-Market Panic",
    structure: "questions",
    description:
      "Speculates comically about roster changes without inventing real trades.",
    requires: ["result"],
    prefers: ["collapse"],
    blueprint: [
      "Call for urgent roster action.",
      "Identify a documented performance problem.",
      "Ask which hypothetical changes might help.",
      "Clarify that no actual transaction is being reported.",
    ],
    length: "medium",
  },
  {
    id: "mcnulty-blame",
    name: "The Blame Game",
    structure: "ranking",
    description:
      "Assigns theatrical blame for a defeat.",
    requires: ["result"],
    prefers: ["collapse"],
    blueprint: [
      "Announce the search for a scapegoat.",
      "Consider several possible explanations.",
      "Use verified player data when available.",
      "Select an absurdly convenient culprit.",
    ],
    length: "medium",
  },
  {
    id: "mcnulty-coronation",
    name: "Emergency Championship Proclamation",
    structure: "letter",
    description:
      "Prematurely crowns a team after a single regular-season victory.",
    requires: ["result"],
    prefers: ["winningStreak", "shootout"],
    blueprint: [
      "Issue an official-sounding proclamation.",
      "Present the winning score.",
      "Explain why all other contenders should apparently surrender.",
      "Include a wildly inadequate disclaimer.",
    ],
    length: "short",
  },
]);

/* ==================================================
   PROFESSOR HUGO BELLEND
   Pretentious academic nonsense.
   ================================================== */

const BELLEND = define("bellend", [
  {
    id: "bellend-philosophy",
    name: "Philosophical Essay",
    structure: "essay",
    description:
      "An absurd meditation on the meaning of victory.",
    requires: ["result"],
    prefers: ["closeGame"],
    blueprint: [
      "Introduce a grand philosophical question.",
      "Apply it to the actual match.",
      "Consider opposing interpretations.",
      "Conclude with unnecessary intellectual confidence.",
    ],
    length: "long",
  },
  {
    id: "bellend-research",
    name: "Academic Research Paper",
    structure: "sections",
    description:
      "A mock research paper with abstract, methods and findings.",
    requires: ["result"],
    prefers: ["star"],
    blueprint: [
      "Write a mock abstract.",
      "Describe the verified dataset.",
      "Present findings and limitations.",
      "Offer a disproportionate academic conclusion.",
    ],
    length: "long",
  },
  {
    id: "bellend-theorem",
    name: "Theorem and Proof",
    structure: "numbered",
    description:
      "An elaborate mathematical proof of a trivial sporting observation.",
    requires: ["result"],
    prefers: ["blowout"],
    blueprint: [
      "State a ridiculous theorem.",
      "Present the actual scores as premises.",
      "Construct a mock proof.",
      "Declare the result academically significant.",
    ],
    length: "medium",
  },
  {
    id: "bellend-history",
    name: "Historical Comparison",
    structure: "essay",
    description:
      "Compares fantasy football with grand historical events, clearly as metaphor.",
    requires: ["result"],
    prefers: ["rivalry", "historicalMeeting"],
    blueprint: [
      "Introduce a grand historical analogy.",
      "Describe the actual match.",
      "Explain the analogy's absurd limitations.",
      "Deliver a pompous conclusion.",
    ],
    length: "medium",
  },
  {
    id: "bellend-psychology",
    name: "Psychological Assessment",
    structure: "sections",
    description:
      "A satirical examination of a manager's sporting behaviour, not a real diagnosis.",
    requires: ["result"],
    prefers: ["losingStreak"],
    blueprint: [
      "Frame the assessment explicitly as sporting satire.",
      "Describe the documented result.",
      "Explore imagined managerial rationalisations.",
      "Avoid real clinical claims.",
    ],
    length: "medium",
  },
  {
    id: "bellend-economics",
    name: "Economic Analysis",
    structure: "sections",
    description:
      "Applies ridiculous economic concepts to fantasy-point production.",
    requires: ["result"],
    prefers: ["star", "lowScoringWin"],
    blueprint: [
      "Define an absurd economic model.",
      "Treat fantasy points as a resource.",
      "Compare verified production.",
      "Discuss imaginary market inefficiencies.",
    ],
    length: "long",
  },
  {
    id: "bellend-morality",
    name: "The Moral Dilemma",
    structure: "questions",
    description:
      "Treats an ordinary result as an ethical catastrophe.",
    requires: ["result"],
    prefers: ["highScoringLoss"],
    blueprint: [
      "Pose a moral dilemma.",
      "Introduce the result.",
      "Argue contradictory ethical positions.",
      "Reach a deliberately unhelpful judgement.",
    ],
    length: "medium",
  },
  {
    id: "bellend-lecture",
    name: "Lecture Transcript",
    structure: "transcript",
    description:
      "A fictional university lecture about an SFL result.",
    requires: ["result"],
    prefers: ["surprise"],
    blueprint: [
      "Welcome an imaginary lecture hall.",
      "Present the match as a case study.",
      "Include fictional student interruptions.",
      "Finish with an absurd examination question.",
    ],
    length: "long",
  },
  {
    id: "bellend-existential",
    name: "Existential Crisis",
    structure: "essay",
    description:
      "A brief meditation on the futility of fantasy management.",
    requires: ["result"],
    prefers: ["closeGame", "collapse"],
    blueprint: [
      "Question the purpose of fantasy football.",
      "Introduce the match as evidence.",
      "Explore the futility of managerial control.",
      "End without resolving anything.",
    ],
    length: "short",
  },
  {
    id: "bellend-debate",
    name: "Scholarly Debate",
    structure: "dialogue",
    description:
      "Two fictional academics argue over a straightforward result.",
    requires: ["result"],
    prefers: ["rivalry"],
    blueprint: [
      "Introduce two competing academic positions.",
      "Have each interpret the actual result.",
      "Escalate the disagreement into pedantry.",
      "Conclude with no useful consensus.",
    ],
    length: "medium",
  },
]);

/* ==================================================
   DEREK PISSWORTH
   Bitter former manager and opinion columnist.
   ================================================== */

const PISSWORTH = define("pissworth", [
  {
    id: "pissworth-opinion",
    name: "Angry Opinion Column",
    structure: "narrative",
    description:
      "An opinionated rant about the week's result.",
    requires: ["result"],
    prefers: ["blowout"],
    blueprint: [
      "State a provocative opinion.",
      "Explain the result.",
      "Attack a fashionable interpretation.",
      "End with an unrequested judgement.",
    ],
    length: "medium",
  },
  {
    id: "pissworth-letter",
    name: "Open Letter to a Manager",
    structure: "letter",
    description:
      "A direct and unwelcome message to a franchise manager.",
    requires: ["result"],
    prefers: ["collapse"],
    blueprint: [
      "Address the manager personally.",
      "Explain why the latest result is unacceptable or overrated.",
      "Offer increasingly patronising advice.",
      "Sign off with a final insult.",
    ],
    length: "medium",
  },
  {
    id: "pissworth-old-days",
    name: "Back in My Day",
    structure: "narrative",
    description:
      "An exaggerated nostalgic rant about fantasy football.",
    requires: ["result"],
    prefers: ["shootout"],
    blueprint: [
      "Complain about modern fantasy football.",
      "Compare the result with an explicitly imaginary golden age.",
      "Praise or criticise the current managers.",
      "Refuse to acknowledge progress.",
    ],
    length: "short",
  },
  {
    id: "pissworth-advice",
    name: "Unwanted Managerial Advice",
    structure: "numbered",
    description:
      "A list of unsolicited instructions for the losing manager.",
    requires: ["result"],
    prefers: ["losingStreak"],
    blueprint: [
      "Announce that nobody asked for advice.",
      "Present several increasingly obvious suggestions.",
      "Refer to real scoring evidence.",
      "Insist the problem would never happen under Derek.",
    ],
    length: "medium",
  },
  {
    id: "pissworth-grudge",
    name: "Personal Grudge Retrospective",
    structure: "narrative",
    description:
      "Uses a current result as an excuse to revisit old resentment.",
    requires: ["result"],
    prefers: ["rivalry", "historicalMeeting"],
    blueprint: [
      "Begin with an old grievance, if documented.",
      "Reluctantly explain the current result.",
      "Return repeatedly to the grievance.",
      "Claim to have moved on while proving otherwise.",
    ],
    length: "long",
  },
  {
    id: "pissworth-pub",
    name: "Conversation Down the Pub",
    structure: "dialogue",
    description:
      "A fictional pub argument about the match.",
    requires: ["result"],
    prefers: ["closeGame"],
    blueprint: [
      "Introduce imaginary drinking companions.",
      "Have them disagree about the result.",
      "Use genuine match facts in their argument.",
      "End with Derek insulting everyone.",
    ],
    length: "medium",
  },
  {
    id: "pissworth-truths",
    name: "Things Nobody Wants to Admit",
    structure: "numbered",
    description:
      "Several uncomfortable opinions, some fair and some ridiculous.",
    requires: ["result"],
    prefers: ["lowScoringWin"],
    blueprint: [
      "Announce several supposedly forbidden truths.",
      "Support each with a real observation where possible.",
      "Separate facts from opinions.",
      "Finish with Derek congratulating himself.",
    ],
    length: "medium",
  },
  {
    id: "pissworth-review",
    name: "Manager Performance Review",
    structure: "sections",
    description:
      "A mock workplace appraisal of a fantasy manager.",
    requires: ["result"],
    prefers: ["collapse", "winningStreak"],
    blueprint: [
      "Introduce an imaginary appraisal form.",
      "Evaluate results and decision-making evidence.",
      "Award exaggerated performance grades.",
      "Recommend an inappropriate development plan.",
    ],
    length: "long",
  },
  {
    id: "pissworth-predictions",
    name: "Unpopular Predictions",
    structure: "ranking",
    description:
      "Makes provocative predictions clearly identified as opinion.",
    requires: ["result"],
    prefers: ["winningStreak", "losingStreak"],
    blueprint: [
      "Declare that everyone else is wrong.",
      "Offer several predictions inspired by the result.",
      "Explain their questionable reasoning.",
      "Refuse to accept future accountability.",
    ],
    length: "medium",
  },
  {
    id: "pissworth-apology",
    name: "A Reluctant Apology",
    structure: "letter",
    description:
      "Derek begrudgingly admits someone performed well.",
    requires: ["result"],
    prefers: ["star", "surprise"],
    blueprint: [
      "Admit a previous imagined criticism may have been unfair.",
      "Acknowledge the actual winning performance.",
      "Undermine the apology with several qualifications.",
      "Withdraw most of the goodwill.",
    ],
    length: "short",
  },
]);

export const STORY_FORMATS: StoryFormatDefinition[] = [
  ...PEMBROKE,
  ...GRAVES,
  ...MCNULTY,
  ...BELLEND,
  ...PISSWORTH,
];

export const FORMATS_BY_JOURNALIST: Record<
  JournalistId,
  StoryFormatDefinition[]
> = {
  pembroke: PEMBROKE,
  graves: GRAVES,
  mcnulty: MCNULTY,
  bellend: BELLEND,
  pissworth: PISSWORTH,
};

/**
 * Check whether the evidence supports a format.
 */
export function isFormatEligible(
  format: StoryFormatDefinition,
  evidence: EditorialEvidence
): boolean {
  return format.requires.every(
    (key) => evidence[key] === true
  );
}

/**
 * Score the relevance of a format to a match.
 *
 * Eligibility is mandatory.
 * Preferred evidence increases relevance.
 */
export function scoreFormat(
  format: StoryFormatDefinition,
  evidence: EditorialEvidence
): number {
  if (!isFormatEligible(format, evidence)) {
    return -Infinity;
  }

  return format.prefers.reduce(
    (score, key) =>
      score + (evidence[key] ? 1 : 0),
    0
  );
}

export function getJournalistFormats(
  journalist: JournalistId
): StoryFormatDefinition[] {
  return FORMATS_BY_JOURNALIST[journalist];
}

export function getFormatById(
  id: string
): StoryFormatDefinition | undefined {
  return STORY_FORMATS.find(
    (format) => format.id === id
  );
}

/**
 * A stable per-journalist format order.
 *
 * The multiplier 3 is coprime to 10,
 * so it visits all ten format slots before
 * repeating. Different journalists have
 * different starting positions.
 */
const JOURNALIST_OFFSETS: Record<
  JournalistId,
  number
> = {
  pembroke: 0,
  graves: 3,
  mcnulty: 6,
  bellend: 1,
  pissworth: 8,
};

function rotationIndex(
  journalist: JournalistId,
  appearance: number
): number {
  return (
    JOURNALIST_OFFSETS[journalist] +
    appearance * 3
  ) % 10;
}

/**
 * Return the ten-format rotation for a writer.
 *
 * This is useful for debugging and previews.
 */
export function getFormatRotation(
  journalist: JournalistId
): StoryFormatDefinition[] {
  const formats =
    FORMATS_BY_JOURNALIST[journalist];

  return Array.from(
    { length: 10 },
    (_, index) =>
      formats[rotationIndex(journalist, index)]
  );
}

/**
 * Select a format for a journalist's appearance.
 *
 * appearance:
 *   0 = first appearance
 *   1 = second appearance
 *   ...
 *
 * previousFormatIds should contain formats
 * actually published in recent appearances.
 *
 * The selector prioritises unused formats,
 * then the planned rotation, then relevance.
 *
 * IMPORTANT:
 * The ten-appearance guarantee requires:
 * - At least ten eligible formats.
 * - An accurate history of previous selections.
 * - The same selection rules across editions.
 *
 * The caller must supply that history.
 */
export function selectStoryFormat(
  journalist: JournalistId,
  appearance: number,
  evidence: EditorialEvidence,
  previousFormatIds: string[] = []
): StoryFormatDefinition {
  const formats =
    FORMATS_BY_JOURNALIST[journalist];

  const eligible = formats.filter(
    (format) => isFormatEligible(format, evidence)
  );

  if (!eligible.length) {
    throw new Error(
      `No eligible formats for ${journalist}`
    );
  }

  const recent = new Set(
    previousFormatIds.slice(-9)
  );

  const unused = eligible.filter(
    (format) => !recent.has(format.id)
  );

  const candidates =
    unused.length > 0 ? unused : eligible;

  const preferredIndex = rotationIndex(
    journalist,
    appearance
  );

  const preferredId =
    formats[preferredIndex].id;

  const ranked = [...candidates].sort(
    (a, b) => {
      const aPreferred =
        a.id === preferredId ? 1 : 0;
      const bPreferred =
        b.id === preferredId ? 1 : 0;

      if (aPreferred !== bPreferred) {
        return bPreferred - aPreferred;
      }

      const relevance =
        scoreFormat(b, evidence) -
        scoreFormat(a, evidence);

      if (relevance !== 0) {
        return relevance;
      }

      const aIndex = formats.findIndex(
        (format) => format.id === a.id
      );
      const bIndex = formats.findIndex(
        (format) => format.id === b.id
      );

      const aDistance =
        (aIndex - preferredIndex + 10) % 10;
      const bDistance =
        (bIndex - preferredIndex + 10) % 10;

      return aDistance - bDistance;
    }
  );

  return ranked[0];
}

/**
 * Validate the catalogue at runtime.
 *
 * Useful during development to catch
 * missing or duplicated definitions.
 */
export function validateFormatCatalogue(): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  const ids = new Set<string>();

  for (const format of STORY_FORMATS) {
    if (ids.has(format.id)) {
      errors.push(
        `Duplicate format ID: ${format.id}`
      );
    }

    ids.add(format.id);

    if (!format.requires.includes("result")) {
      errors.push(
        `${format.id} does not require a result`
      );
    }

    if (!format.blueprint.length) {
      errors.push(
        `${format.id} has no blueprint`
      );
    }
  }

  for (const journalist of Object.keys(
    FORMATS_BY_JOURNALIST
  ) as JournalistId[]) {
    const formats =
      FORMATS_BY_JOURNALIST[journalist];

    if (formats.length !== 10) {
      errors.push(
        `${journalist} has ${formats.length} formats instead of 10`
      );
    }

    const rotation = getFormatRotation(
      journalist
    );

    if (
      new Set(rotation.map((f) => f.id)).size !== 10
    ) {
      errors.push(
        `${journalist} has duplicate formats in rotation`
      );
    }
  }

  if (STORY_FORMATS.length !== 50) {
    errors.push(
      `Expected 50 formats, found ${STORY_FORMATS.length}`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
