import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ButtonGroup } from "@astryxdesign/core/ButtonGroup";
import { CheckboxInput } from "@astryxdesign/core/CheckboxInput";
import { Heading } from "@astryxdesign/core/Heading";
import { NumberInput } from "@astryxdesign/core/NumberInput";
import { Slider } from "@astryxdesign/core/Slider";
import { ToggleButton, ToggleButtonGroup } from "@astryxdesign/core/ToggleButton";
import { Theme } from "@astryxdesign/core/theme";
import { neutralTheme } from "@astryxdesign/theme-neutral/built";
import type { CSSProperties } from "react";
import qs from "qs";
import {
  estimate_trace_restoration,
  expected_from_config,
  round_up_significant_figures,
} from "./lib/calcs";
import type { Config } from "./lib/types";
import { DEFAULT_CONFIG, Event, make_config, max_stars_for_level } from "./lib/types";

const SAFEGUARD_VALUES = [15, 16, 17];
const ITEM_LEVEL_PRESETS = [130, 140, 150, 160, 200, 250];

const EVENT_OPTIONS = [
  { label: "None", value: null },
  { label: "1+1", value: Event.ONE_PLUS_ONE },
  { label: "30% off", value: Event.THIRTY_OFF_PRICE },
  { label: "−30% boom ≤21", value: Event.THIRTY_OFF_BOOM },
  { label: "Shining", value: Event.SHINING },
  { label: "Guardian", value: Event.GUARDIAN },
];

const DISCOUNT_OPTIONS = [
  { label: "None", value: 0 },
  { label: "Gold · 3%", value: 0.03 },
  { label: "Diamond · 5%", value: 0.05 },
  { label: "Royal+ · 10%", value: 0.1 },
];

function deserialize(serialized: string): Config {
  const [url = "", query = ""] = serialized.split("?");
  const legacyPath = /^\/(\d+)\/(\d+)\/(\d+)\/?$/.exec(url);
  const legacyValues = legacyPath
    ? {
        item_level: legacyPath[1],
        item_from_star: legacyPath[2],
        item_to_star: legacyPath[3],
      }
    : {};

  return make_config({ ...legacyValues, ...qs.parse(query) });
}

function serialize(config: Config): string {
  const options = { ...config };

  for (const [key, value] of Object.entries(options)) {
    if (
      !["item_level", "item_from_star", "item_to_star"].includes(key) &&
      JSON.stringify(DEFAULT_CONFIG[key as keyof Config]) === JSON.stringify(value)
    ) {
      delete options[key as keyof typeof options];
    }
  }

  return `/?${qs.stringify(options)}`;
}

function loadConfig(): Config {
  try {
    return deserialize(window.location.hash.slice(1));
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

function roundTo(value: number, precision: number): number {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function displayCost(value: number): string {
  if (Number.isNaN(value)) return "";
  if (value <= 0) return "0m";
  const roundedValue = round_up_significant_figures(value, 3);
  const divisor = roundedValue < 1_000_000_000 ? 1e6 : roundedValue < 1e12 ? 1e9 : 1e12;
  const suffix = divisor === 1e6 ? "m" : divisor === 1e9 ? "b" : "t";
  const valueInUnit = roundedValue / divisor;
  const fractionDigits = Math.max(0, 2 - Math.floor(Math.log10(valueInUnit)));
  const formatter = Intl.NumberFormat(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
  return `${formatter.format(valueInUnit)}${suffix}`;
}

function displayRestorationCost(value: number): string {
  return displayCost(value);
}

function displayRounded(value: number): number | "" {
  return Number.isNaN(value) ? "" : roundTo(value, 2);
}

function RestorationTable({
  config,
  onToggleStar,
  onDiscountChange,
}: {
  config: Config;
  onToggleStar: (star: number) => void;
  onDiscountChange: (hasDiscount: boolean) => void;
}) {
  const { item_level: itemLevel, restoration_discount: hasDiscount } = config;
  const selectedStars = config.restoration_stars_by_level[itemLevel] ?? [];
  const restorationRows = useMemo(() => {
    const maxStar = Math.min(22, max_stars_for_level(itemLevel));
    const rows = [];
    for (let star = 15; star <= maxStar; star++) {
      const estimate = estimate_trace_restoration(config, star);
      if (estimate) rows.push({ star, ...estimate });
    }
    return rows;
  }, [config, itemLevel]);

  if (itemLevel < 128 || itemLevel > 250) return null;

  return (
    <section className="restoration-panel" aria-labelledby="restoration-heading">
      <div className="restoration-heading">
        <div className="restoration-heading-row">
          <div>
            <p className="eyebrow">Restoration</p>
            <h2 id="restoration-heading">Trace restoration</h2>
          </div>
          <CheckboxInput
            className="restoration-discount-toggle"
            label="20% off"
            size="sm"
            value={hasDiscount}
            onChange={onDiscountChange}
          />
        </div>
        <p>Select a row to apply that restoration after a boom.</p>
      </div>
      <div className="restoration-table-scroll">
        <table className="results-table restoration-table">
          <thead>
            <tr>
              <th scope="col">Restoration star</th>
              <th scope="col">Equipment copies</th>
              <th scope="col">Required mesos</th>
            </tr>
          </thead>
          <tbody>
            {restorationRows.map(({ star, spares, cost }) => {
              const isSelected = selectedStars.includes(star);
              return (
                <tr
                  key={star}
                  className={isSelected ? "restoration-row-selected" : undefined}
                  aria-selected={isSelected}
                  onClick={() => onToggleStar(star)}
                >
                  <th scope="row">
                    <button
                      type="button"
                      className="restoration-row-toggle"
                      aria-label={`${isSelected ? "Remove" : "Select"} ${star}-star restoration at level ${itemLevel}`}
                      aria-pressed={isSelected}
                      onClick={(event) => {
                        event.stopPropagation();
                        onToggleStar(star);
                      }}
                    >
                      {star}★
                    </button>
                  </th>
                  <td>{spares}</td>
                  <td>{displayRestorationCost(cost)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function NumericField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div className="numeric-field">
      <NumberInput
        label={label}
        value={value}
        min={min}
        max={max}
        step={step}
        isIntegerOnly
        onChange={onChange}
      />
    </div>
  );
}

function StarRange({
  start,
  target,
  maxTarget,
  onChange,
}: {
  start: number;
  target: number;
  maxTarget: number;
  onChange: (start: number, target: number) => void;
}) {
  const startValue = Math.min(maxTarget, Math.max(0, Math.round(start)));
  const targetValue = Math.min(maxTarget, Math.max(startValue, Math.round(target)));
  const thumbPosition = (star: number) => {
    const progress = star / maxTarget;
    return `calc(${progress * 100}% + ${10 - progress * 20}px)`;
  };
  const controlStyle: CSSProperties & {
    "--star-rail-start": string;
    "--star-rail-end": string;
  } = {
    "--star-rail-start": thumbPosition(0),
    "--star-rail-end": thumbPosition(maxTarget),
  };
  const marks = Array.from(
    new Set([
      ...Array.from({ length: Math.floor(maxTarget / 5) + 1 }, (_, index) => index * 5),
      maxTarget,
    ]),
    (star) => ({
      value: star,
      label: star % 5 === 0 || star === maxTarget ? String(star) : undefined,
    }),
  );

  return (
    <section className="star-range-section" aria-label="Star range">
      <div className="star-range-labels">
        <span>
          <strong>Start</strong> {startValue}★
        </span>
        <span>
          <strong>Target</strong> {targetValue}★
        </span>
      </div>
      <Slider
        label="Start and target stars"
        isLabelHidden
        containerClassName="star-slider-field"
        controlClassName="star-slider-control"
        controlStyle={controlStyle}
        value={[startValue, targetValue]}
        min={0}
        max={maxTarget}
        step={1}
        minStepsBetweenThumbs={0}
        marks={marks}
        formatValue={(star) => `${star} stars`}
        onChange={([nextStart, nextTarget]) => onChange(nextStart, nextTarget)}
      />
    </section>
  );
}

function ChoiceGroup<T extends string | number | null>({
  label,
  subtitle,
  options,
  value,
  onChange,
}: {
  label: string;
  subtitle?: string;
  options: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <section className="option-section" aria-label={label}>
      {subtitle ? (
        <div className="section-title">
          <h2>{label}</h2>
          <span className="section-title-separator" aria-hidden="true">
            ·
          </span>
          <span>{subtitle}</span>
        </div>
      ) : (
        <h2>{label}</h2>
      )}
      <ToggleButtonGroup
        className="choice-list"
        label={label}
        size="sm"
        value={String(value)}
        onChange={(next) => {
          const option = options.find(({ value: optionValue }) => String(optionValue) === next);
          onChange(option ? option.value : options[0].value);
        }}
      >
        {options.map((option) => (
          <ToggleButton
            key={String(option.value)}
            className="choice-button"
            label={option.label}
            value={String(option.value)}
            size="sm"
          />
        ))}
      </ToggleButtonGroup>
    </section>
  );
}

function AppContent() {
  const [config, setConfig] = useState<Config>(loadConfig);
  const dragStart = useRef<number | null>(null);
  const dragEnd = useRef<number | null>(null);
  const dragCommitted = useRef(false);

  const updateConfig = useCallback((update: Partial<Config>) => {
    setConfig((current) => make_config({ ...current, ...update }));
  }, []);
  const toggleRestorationStar = useCallback((star: number) => {
    setConfig((current) => {
      if (current.item_level < 128 || current.item_level > 250) return current;

      const itemLevel = current.item_level;
      const selectedStars = current.restoration_stars_by_level[itemLevel] ?? [];
      const nextStars = selectedStars.includes(star)
        ? selectedStars.filter((selectedStar) => selectedStar !== star)
        : [...selectedStars, star];
      const restoration_stars_by_level = { ...current.restoration_stars_by_level };
      if (nextStars.length > 0) restoration_stars_by_level[itemLevel] = nextStars;
      else delete restoration_stars_by_level[itemLevel];
      return make_config({ ...current, restoration_stars_by_level });
    });
  }, []);

  useEffect(() => {
    const handleHashChange = () => setConfig(loadConfig());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.hash = `#${serialize(config)}`;
    window.history.replaceState({}, "", url);
  }, [config]);

  useEffect(() => {
    const handlePointerUp = () => {
      const start = dragStart.current;
      const end = dragEnd.current;
      if (start !== null && end !== null && start !== end) {
        dragCommitted.current = true;
        const low = Math.min(start, end);
        const high = Math.max(start, end);
        setConfig((current) => {
          const enabling = !current.safeguard.includes(start);
          const safeguard = current.safeguard.filter((star) => star < low || star > high);
          if (enabling) {
            safeguard.push(...SAFEGUARD_VALUES.filter((star) => star >= low && star <= high));
          }
          return { ...current, safeguard: safeguard.sort((a, b) => a - b) };
        });
        window.setTimeout(() => {
          dragCommitted.current = false;
        }, 0);
      }
      dragStart.current = null;
      dragEnd.current = null;
    };

    window.addEventListener("pointerup", handlePointerUp);
    return () => window.removeEventListener("pointerup", handlePointerUp);
  }, []);

  const resultsByTarget = useMemo(() => {
    const results = [];
    const maxStars = max_stars_for_level(config.item_level);
    for (let targetStar = config.item_from_star; targetStar <= maxStars; targetStar++) {
      results.push({
        targetStar,
        ...expected_from_config({ ...config, item_to_star: targetStar }),
      });
    }
    return results;
  }, [config]);

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="brand-mark" aria-hidden="true">
          ★
        </div>
        <div className="app-heading-copy">
          <Heading level={1} className="app-title">
            Starforce <span>Calculator (MSEA)</span>
          </Heading>
          <p className="app-subtitle">
            Estimate the mesos, success chance, and spare equipment needed to reach your target
            star.
          </p>
        </div>
        <p className="app-header-note">
          Settings are saved in the page URL, so you can share your calculation.
        </p>
      </header>

      <div className="calculator-layout">
        <div className="configuration-column">
          <section className="calculator-panel" aria-label="Starforce settings">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Configuration</p>
                <h2>Upgrade details</h2>
              </div>
              <span className="star-range">
                {config.item_from_star}★ <span aria-hidden="true">→</span> {config.item_to_star}★
              </span>
            </div>

            <div className="numeric-grid">
              <div className="item-level-field">
                <NumericField
                  label="Item level"
                  value={config.item_level}
                  min={10}
                  max={250}
                  step={10}
                  onChange={(item_level) => updateConfig({ item_level })}
                />
                <ButtonGroup className="item-level-presets" label="Item level presets" size="sm">
                  {ITEM_LEVEL_PRESETS.map((level) => (
                    <ToggleButton
                      key={level}
                      className="choice-button item-level-preset"
                      label={`${level} item level`}
                      size="sm"
                      isPressed={config.item_level === level}
                      onPressedChange={(isPressed) => {
                        if (isPressed) updateConfig({ item_level: level });
                      }}
                    >
                      {level}
                    </ToggleButton>
                  ))}
                </ButtonGroup>
              </div>
              <div className="replacement-cost-field">
                <NumberInput
                  label="Replacement cost"
                  value={
                    config.replacement_cost /
                    (config.replacement_cost_unit === "B" ? 1_000_000_000 : 1_000_000)
                  }
                  hasClear
                  min={0}
                  step={1}
                  onChange={(value) =>
                    updateConfig({
                      replacement_cost:
                        value === null
                          ? DEFAULT_CONFIG.replacement_cost
                          : value *
                            (config.replacement_cost_unit === "B" ? 1_000_000_000 : 1_000_000),
                    })
                  }
                />
                <ToggleButtonGroup
                  className="replacement-cost-units"
                  label="Replacement cost unit"
                  size="sm"
                  value={config.replacement_cost_unit}
                  onChange={(unit) => {
                    if (unit !== "B" && unit !== "M") return;
                    const currentMultiplier =
                      config.replacement_cost_unit === "B" ? 1_000_000_000 : 1_000_000;
                    const nextMultiplier = unit === "B" ? 1_000_000_000 : 1_000_000;
                    updateConfig({
                      replacement_cost:
                        (config.replacement_cost / currentMultiplier) * nextMultiplier,
                      replacement_cost_unit: unit,
                    });
                  }}
                >
                  <ToggleButton label="Billions" value="B" size="sm">
                    B
                  </ToggleButton>
                  <ToggleButton label="Millions" value="M" size="sm">
                    M
                  </ToggleButton>
                </ToggleButtonGroup>
              </div>
            </div>
            <StarRange
              start={config.item_from_star}
              target={config.item_to_star}
              maxTarget={max_stars_for_level(config.item_level)}
              onChange={(item_from_star, item_to_star) =>
                updateConfig({ item_from_star, item_to_star })
              }
            />
            <div className="settings-grid">
              <ChoiceGroup
                label="Event"
                options={EVENT_OPTIONS}
                value={config.event}
                onChange={(event) => updateConfig({ event })}
              />
              <ChoiceGroup
                label="MVP discount"
                subtitle="Applies to 16★ and below"
                options={DISCOUNT_OPTIONS}
                value={config.mvp_discount}
                onChange={(mvp_discount) => updateConfig({ mvp_discount })}
              />
              <section className="option-section safeguard-section" aria-label="Safeguard">
                <div className="section-title">
                  <h2>Safeguard</h2>
                  <span className="section-title-separator" aria-hidden="true">
                    ·
                  </span>
                  <span>Click or drag to select</span>
                </div>
                <ButtonGroup className="choice-list" label="Safeguard stars" size="sm">
                  {SAFEGUARD_VALUES.map((star) => {
                    const checked = config.safeguard.includes(star);
                    return (
                      <ToggleButton
                        key={star}
                        className="choice-button safeguard-button"
                        label={`${star} stars`}
                        size="sm"
                        isPressed={checked}
                        onPressedChange={(isPressed) => {
                          const safeguard = isPressed
                            ? [...config.safeguard, star]
                            : config.safeguard.filter((value) => value !== star);
                          updateConfig({ safeguard });
                        }}
                        onClick={(event) => {
                          if (dragCommitted.current) {
                            dragCommitted.current = false;
                            event.preventDefault();
                          }
                        }}
                        onPointerDown={(event) => {
                          if (event.button === 0) {
                            dragStart.current = star;
                            dragEnd.current = null;
                          }
                        }}
                        onPointerEnter={() => {
                          if (dragStart.current !== null) dragEnd.current = star;
                        }}
                        onPointerCancel={() => {
                          dragStart.current = null;
                          dragEnd.current = null;
                        }}
                      >
                        {star}
                      </ToggleButton>
                    );
                  })}
                </ButtonGroup>
              </section>
            </div>
          </section>
          <RestorationTable
            config={config}
            onToggleStar={toggleRestorationStar}
            onDiscountChange={(restoration_discount) => updateConfig({ restoration_discount })}
          />
        </div>

        <section className="results-panel" aria-label="Expected results">
          <div className="results-heading">
            <div>
              <p className="eyebrow">Star-by-star estimate</p>
              <h2>Expected results</h2>
              <p className="results-instruction">Select a row to adjust target.</p>
            </div>
            <p>
              From {config.item_from_star}★ to {max_stars_for_level(config.item_level)}★
            </p>
          </div>
          <div className="results-table-scroll">
            <table className="results-table">
              <thead>
                <tr>
                  <th scope="col">Target star</th>
                  <th scope="col">Expected mesos</th>
                  <th scope="col">Success without Boom</th>
                  <th scope="col">Expected Spares Required</th>
                </tr>
              </thead>
              <tbody aria-live="polite">
                {resultsByTarget.map(({ targetStar, cost, prob_success, spares }) => {
                  const isStartingStar = targetStar === config.item_from_star;
                  const isSelectedTarget = targetStar === config.item_to_star;
                  return (
                    <tr
                      key={targetStar}
                      className={isSelectedTarget ? "result-row-target" : undefined}
                      aria-current={isSelectedTarget ? "true" : undefined}
                      onClick={() => updateConfig({ item_to_star: targetStar })}
                    >
                      <th scope="row">
                        <button
                          type="button"
                          className="result-target-toggle"
                          aria-label={`Set target to ${targetStar} stars`}
                          aria-pressed={isSelectedTarget}
                          onClick={(event) => {
                            event.stopPropagation();
                            updateConfig({ item_to_star: targetStar });
                          }}
                        >
                          {targetStar}★
                        </button>
                        {isStartingStar && <span className="row-badge">Start</span>}
                        {isSelectedTarget && <span className="row-badge">Target</span>}
                      </th>
                      <td>{displayCost(cost)}</td>
                      <td>{displayRounded(100 * prob_success)}%</td>
                      <td>{displayRounded(spares)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <Theme theme={neutralTheme}>
      <AppContent />
    </Theme>
  );
}
