import { SOLUTIONS } from "../data/solutions.js";
import { daysSinceDailyStart } from "./date_math.js";
import { MAX_SLICE_INDEX } from "./fetch_slices.js";
import { fromFragment, toFragment } from "./fragment_hash.js";
import { hashNum, randInt } from "./random.js";

export type GameType = "daily" | "random" | "link";

export interface SolutionIndices {
  solutionIndex: number;
  sliceIndex: number;
  gameType: GameType;
  hash: string;
}

export function getRandomSolutionIndices(): SolutionIndices {
  const randomIndices = {
    solutionIndex: randInt(0, SOLUTIONS.length),
    sliceIndex: randInt(0, MAX_SLICE_INDEX),
  };
  return {
    ...randomIndices,
    gameType: "random",
    hash: toFragment(randomIndices),
  };
}

export async function getDailySolutionIndices(
  date: Date
): Promise<SolutionIndices> {
  if (date.getTime() > Date.now()) {
    alert(`Shame! 🔔 Shame! 🔔 Shame! 🔔`);
    return getRandomSolutionIndices();
  }
  const daysSinceStart = daysSinceDailyStart(date);
  const monthStr = String(date.getMonth() + 1).padStart(2, "0");
  const dayStr = String(date.getDate()).padStart(2, "0");
  const hash = `${date.getFullYear()}-${monthStr}-${dayStr}`;
  return {
    solutionIndex: await hashNum(daysSinceStart, SOLUTIONS.length),
    sliceIndex: await hashNum(daysSinceStart, MAX_SLICE_INDEX),
    gameType: "daily",
    hash,
  };
}

async function tryGetHashIndices(
  hash: string
): Promise<SolutionIndices | null> {
  // location.hash typically starts with '#' so strip that out
  if (hash.startsWith("#")) {
    hash = hash.substring(1);
  }
  const dateMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(hash);
  if (dateMatch) {
    const date = new Date(
      Number(dateMatch[1]),
      Number(dateMatch[2]) - 1,
      Number(dateMatch[3])
    );
    return getDailySolutionIndices(date);
  }
  try {
    return {
      ...fromFragment(hash),
      gameType: "link",
      hash: hash,
    };
  } catch (e) {
    // Invalid hash - ignore and fall back to default random
    // behavior. Probably means someone typed their own hash into
    // the url.
  }
  return null;
}

/**
 * Gets or generates solution indices based on the game type or hash.
 *
 * If hash is populated, this will attempt to extract solutionIndices from it.
 * If successful, those solution indices will be used and gameType will be
 * ignored.
 */
export async function getSolutionIndices(
  gameType: GameType,
  hash?: string | null
): Promise<SolutionIndices> {
  if (hash) {
    const maybeResult = await tryGetHashIndices(hash);
    if (maybeResult) {
      return maybeResult;
    }
  }
  if (gameType == "random") {
    return await getRandomSolutionIndices();
  }
  if (gameType == "daily") {
    return getDailySolutionIndices(new Date());
  }
  // It's probably impossible to hit this code
  return getRandomSolutionIndices();
}
