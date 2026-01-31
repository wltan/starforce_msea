import type { Config } from "./types";
import { MAX_STARS, Event, DEFAULT_STARCATCH_ALL } from "./types";

// Per official KMS site.
const STARCATCH_MULTI = 1.05;

// These are (success chance, boom chance given no success).
const PROBABILITIES: { [star: number]: [number, number] } = {
  0: [0.95, 0],
  1: [0.9, 0],
  2: [0.85, 0],
  3: [0.85, 0],
  4: [0.8, 0],
  5: [0.75, 0],
  6: [0.7, 0],
  7: [0.65, 0],
  8: [0.6, 0],
  9: [0.55, 0],
  10: [0.5, 0],
  11: [0.45, 0],
  12: [0.4, 0],
  13: [0.35, 0],
  14: [0.3, 0],
  15: [0.3, 0.03],
  16: [0.3, 0.03],
  17: [0.15, 0.08],
  18: [0.15, 0.08],
  19: [0.15, 0.1],
  20: [0.3, 0.15],
  21: [0.15, 0.15],
  22: [0.15, 0.2],
  23: [0.1, 0.2],
  24: [0.1, 0.2],
  25: [0.1, 0.2],
  26: [0.07, 0.2],
  27: [0.05, 0.2],
  28: [0.03, 0.2],
  29: [0.01, 0.2],
};

// MSEA costs
const COST: { [star: number]: (level: number) => number } = {
  0: (level) => 100 * Math.round(10 + (level ** 3 * 1) / 3600),
  1: (level) => 100 * Math.round(10 + (level ** 3 * 2) / 3600),
  2: (level) => 100 * Math.round(10 + (level ** 3 * 3) / 3600),
  3: (level) => 100 * Math.round(10 + (level ** 3 * 4) / 3600),
  4: (level) => 100 * Math.round(10 + (level ** 3 * 5) / 3600),
  5: (level) => 100 * Math.round(10 + (level ** 3 * 6) / 3600),
  6: (level) => 100 * Math.round(10 + (level ** 3 * 7) / 3600),
  7: (level) => 100 * Math.round(10 + (level ** 3 * 8) / 3600),
  8: (level) => 100 * Math.round(10 + (level ** 3 * 9) / 3600),
  9: (level) => 100 * Math.round(10 + (level ** 3 * 10) / 3600),
  10: (level) => 100 * Math.round(10 + (level ** 3 * 11 ** 2.7) / 57100),
  11: (level) => 100 * Math.round(10 + (level ** 3 * 12 ** 2.7) / 31400),
  12: (level) => 100 * Math.round(10 + (level ** 3 * 13 ** 2.7) / 21400),
  13: (level) => 100 * Math.round(10 + (level ** 3 * 14 ** 2.7) / 15700),
  14: (level) => 100 * Math.round(10 + (level ** 3 * 15 ** 2.7) / 10700),
  15: (level) => 100 * Math.round(10 + (level ** 3 * 16 ** 2.7) / 20000),
  16: (level) => 100 * Math.round(10 + (level ** 3 * 17 ** 2.7) / 20000),
  17: (level) => 100 * Math.round(10 + (level ** 3 * 18 ** 2.7) / 15000),
  18: (level) => 100 * Math.round(10 + (level ** 3 * 19 ** 2.7) / 7000),
  19: (level) => 100 * Math.round(10 + (level ** 3 * 20 ** 2.7) / 4500),
  20: (level) => 100 * Math.round(10 + (level ** 3 * 21 ** 2.7) / 20000),
  21: (level) => 100 * Math.round(10 + (level ** 3 * 22 ** 2.7) / 12500),
  22: (level) => 100 * Math.round(10 + (level ** 3 * 23 ** 2.7) / 20000),
  23: (level) => 100 * Math.round(10 + (level ** 3 * 24 ** 2.7) / 20000),
  24: (level) => 100 * Math.round(10 + (level ** 3 * 25 ** 2.7) / 20000),
  25: (level) => 100 * Math.round(10 + (level ** 3 * 26 ** 2.7) / 20000),
  26: (level) => 100 * Math.round(10 + (level ** 3 * 27 ** 2.7) / 20000),
  27: (level) => 100 * Math.round(10 + (level ** 3 * 28 ** 2.7) / 20000),
  28: (level) => 100 * Math.round(10 + (level ** 3 * 29 ** 2.7) / 20000),
  29: (level) => 100 * Math.round(10 + (level ** 3 * 30 ** 2.7) / 20000),
};

const cost_and_odds = (config: Config, star: number) => {
  const base_cost = COST[star](config.item_level);
  const is_safeguard_active = config.safeguard.find((s) => s === star) !== undefined;

  let click_cost = base_cost;
  if (
    config.event === Event.THIRTY_OFF_PRICE ||
    config.event === Event.GUARDIAN ||
    config.event === Event.SHINING
  ) {
    click_cost *= 0.7;
  }
  if (star < 17) {
    click_cost *= 1 - config.mvp_discount;
  }
  if (is_safeguard_active) {
    click_cost += 2 * base_cost; // safeguard not subject to discounts
  }

  const [base_success_chance, boom_chance_given_no_success] = PROBABILITIES[star];
  const success_chance =
    base_success_chance * (config.starcatch.includes(star) ? STARCATCH_MULTI : 1);

  let boom_chance = is_safeguard_active ? 0 : (1 - success_chance) * boom_chance_given_no_success;
  switch (config.event) {
    case Event.THIRTY_OFF_PRICE:
      break;
    case Event.THIRTY_OFF_BOOM:
    case Event.SHINING: // also -30% boom
      if (star <= 21) {
        boom_chance *= 0.7;
      }
      break;
    case Event.GUARDIAN:
      if (star <= 21) {
        boom_chance *= 0.6;
      } else if (star <= 24) {
        boom_chance *= 0.8;
      }
      break;
  }

  return [click_cost, success_chance, boom_chance];
};

const expected_cost_to_next = (config: Config, star: number, prior_costs: number[]) => {
  const [c, s, d] = cost_and_odds(config, star);

  let cost_to_restore_to_current = 0;
  for (let i = 12; i < star; i++) {
    cost_to_restore_to_current += prior_costs[i];
  }

  return (c + d * (config.replacement_cost + cost_to_restore_to_current)) / s;
};

const expected_booms_to_next = (config: Config, star: number, prior_booms: number[]) => {
  const [_c, s, d] = cost_and_odds(config, star);

  let cost_to_restore_to_current = 0;
  for (let i = 12; i < star; i++) {
    cost_to_restore_to_current += prior_booms[i];
  }

  return (d * (1 + cost_to_restore_to_current)) / s;
};

const prob_success_to_next = (config: Config, star: number) => {
  const [_c, s, d] = cost_and_odds(config, star);
  // Fail without destruction does not matter here, as we will click until either success or destruction.
  // Therefore, this is simply P(success | success or destruction).
  return s / (s + d);
};

export type Result = {
  cost: number;
  booms: number;
  prob_success: number;
};

export const expected_from_config = (config: Config): Result => {
  let cost_to_next_star: number[] = [];
  let booms_to_next_star: number[] = [];
  let prob_success_to_next_star: number[] = [];
  for (let i = 0; i < MAX_STARS; i++) {
    cost_to_next_star[i] = expected_cost_to_next(config, i, cost_to_next_star);
    booms_to_next_star[i] = expected_booms_to_next(config, i, booms_to_next_star);
    prob_success_to_next_star[i] = prob_success_to_next(config, i);
  }

  let cost = 0;
  let booms = 0;
  let prob_success = 1;
  for (let i = config.item_from_star; i < config.item_to_star; i++) {
    cost += cost_to_next_star[i];
    booms += booms_to_next_star[i];
    prob_success *= prob_success_to_next_star[i];

    if (config.event === Event.ONE_PLUS_ONE && i < 10) {
      i++;
    }
  }

  return { cost, booms, prob_success };
};
