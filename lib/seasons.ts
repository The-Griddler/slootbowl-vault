
/**
 * SFL season configuration.
 *
 * When renewing the league on Sleeper,
 * update CURRENT_LEAGUE_ID to the
 * newly created league ID.
 *
 * All previous seasons are discovered
 * through Sleeper's previous_league_id
 * chain.
 */

export const CURRENT_LEAGUE_ID =
  "1326512818865868800";

/**
 * Fantasy league schedule.
 *
 * SFL regular season: Weeks 1–14
 * SFL playoffs: Weeks 15–17
 * Slootbowl: Week 17
 */
export const REGULAR_SEASON_END_WEEK = 14;
export const PLAYOFF_START_WEEK = 15;
export const SEASON_END_WEEK = 17;
export const SLOOTBOWL_WEEK = 17;

/**
 * Annual awards become public
 * only after NFL Week 17 completes.
 */
export const AWARDS_REVEAL_WEEK = 17;
