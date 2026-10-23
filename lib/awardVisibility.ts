
import {
  getNFLState,
  isNFLWeekComplete,
} from "./sleeper";

import type {
  SleeperNFLState,
} from "./sleeper";

/**
 * Official seasonal award winners become
 * public only after NFL Week 17 finishes.
 *
 * Historical seasons are evaluated
 * independently of the current season.
 */
export function isSeasonAwardsRevealed(
  season: string,
  nflState: SleeperNFLState
): boolean {
  return isNFLWeekComplete(
    season,
    17,
    nflState
  );
}

/**
 * Convenience helper for pages that
 * haven't already fetched NFL state.
 */
export async function getSeasonAwardsRevealed(
  season: string
): Promise<boolean> {
  const nflState = await getNFLState();

  return isSeasonAwardsRevealed(
    season,
    nflState
  );
}
