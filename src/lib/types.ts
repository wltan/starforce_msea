export const MAX_STARS: number = 30;

export const max_stars_for_level = (level: number): number => {
  if (level <= 94) return 5;
  if (level <= 107) return 8;
  if (level <= 117) return 10;
  if (level <= 127) return 15;
  if (level <= 137) return 20;
  return MAX_STARS;
};

export enum Event {
  THIRTY_OFF_PRICE,
  THIRTY_OFF_BOOM,
  ONE_PLUS_ONE,
  SHINING,
  GUARDIAN,
}

export type Config = {
  item_level: number;
  item_from_star: number;
  item_to_star: number;
  replacement_cost: number;
  replacement_cost_unit: "B" | "M";
  safeguard: number[];
  event: Event | null;
  mvp_discount: number;
};

export const DEFAULT_CONFIG: Config = {
  item_level: 200,
  item_from_star: 12,
  item_to_star: 22,
  replacement_cost: 0,
  replacement_cost_unit: "B",
  safeguard: [],
  event: null,
  mvp_discount: 0,
};

const VALID_EVENTS = new Set<number>([
  Event.THIRTY_OFF_PRICE,
  Event.THIRTY_OFF_BOOM,
  Event.ONE_PLUS_ONE,
  Event.SHINING,
  Event.GUARDIAN,
]);

const parseNumber = (value: unknown, fallback: number): number => {
  if (typeof value !== "string" && typeof value !== "number") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const make_config = (obj: Record<string, unknown>): Config => {
  const eventValue = obj.event == null || obj.event === "" ? null : Number(obj.event);
  const safeguardValues =
    obj.safeguard === undefined
      ? DEFAULT_CONFIG.safeguard
      : Array.isArray(obj.safeguard)
        ? obj.safeguard
        : [obj.safeguard];

  const config: Config = {
    item_level: Math.min(
      250,
      Math.max(10, Math.round(parseNumber(obj.item_level, DEFAULT_CONFIG.item_level))),
    ),
    item_from_star: parseNumber(obj.item_from_star, DEFAULT_CONFIG.item_from_star),
    item_to_star: parseNumber(obj.item_to_star, DEFAULT_CONFIG.item_to_star),
    replacement_cost: parseNumber(obj.replacement_cost, DEFAULT_CONFIG.replacement_cost),
    replacement_cost_unit: obj.replacement_cost_unit === "M" ? "M" : "B",
    safeguard: safeguardValues
      .map((value) => parseNumber(value, NaN))
      .filter((value) => [15, 16, 17].includes(value)),
    event:
      eventValue !== null && VALID_EVENTS.has(eventValue)
        ? (eventValue as Event)
        : DEFAULT_CONFIG.event,
    mvp_discount: [0, 0.03, 0.05, 0.1].includes(Number(obj.mvp_discount))
      ? Number(obj.mvp_discount)
      : DEFAULT_CONFIG.mvp_discount,
  };

  const maxStars = max_stars_for_level(config.item_level);
  config.item_to_star = Math.min(maxStars, Math.max(0, Math.round(config.item_to_star)));
  config.item_from_star = Math.min(
    config.item_to_star,
    Math.max(0, Math.min(maxStars, Math.round(config.item_from_star))),
  );
  return config;
};
