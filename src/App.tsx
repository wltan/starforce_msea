import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Theme } from "@astryxdesign/core/theme";
import { neutralTheme } from "@astryxdesign/theme-neutral/built";
import qs from "qs";
import UrlPattern from "url-pattern";
import { expected_from_config } from "./lib/calcs";
import type { Config } from "./lib/types";
import { DEFAULT_CONFIG, Event, make_config } from "./lib/types";

const PATTERN = new UrlPattern("/:level/:from/:to/");
const SAFEGUARD_VALUES = [15, 16, 17];

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
  const match = PATTERN.match(url);
  const urlParts = match
    ? {
        item_level: match.level,
        item_from_star: match.from,
        item_to_star: match.to,
      }
    : {};

  return make_config({ ...qs.parse(query), ...urlParts });
}

function serialize(config: Config): string {
  const { item_level, item_from_star, item_to_star, ...rest } = config;
  const options = { ...rest };

  for (const [key, value] of Object.entries(options)) {
    if (DEFAULT_CONFIG[key as keyof Config] === value) {
      delete options[key as keyof typeof options];
    }
  }

  return `/${item_level}/${item_from_star}/${item_to_star}/?${qs.stringify(options)}`;
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
  const formatter = Intl.NumberFormat();
  if (value < 1_000_000_000) return `${formatter.format(roundTo(value / 1e6, 2))}m`;
  if (value < 1_000_000_000_000) return `${formatter.format(roundTo(value / 1e9, 2))}b`;
  return `${formatter.format(roundTo(value / 1e12, 2))}t`;
}

function displayRounded(value: number): number | "" {
  return Number.isNaN(value) ? "" : roundTo(value, 2);
}

function NumericField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => setDraft(String(value)), [value]);

  return (
    <div className="numeric-field">
      <TextInput
        label={label}
        value={draft}
        inputMode="numeric"
        onChange={(next) => {
          const numeric = next.replace(/\D/g, "");
          setDraft(numeric);
          if (numeric !== "") onChange(Number(numeric));
        }}
        onBlur={() => {
          if (draft === "") setDraft(String(value));
        }}
      />
    </div>
  );
}

function ChoiceGroup<T extends string | number | null>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <section className="option-section" aria-label={label}>
      <h2>{label}</h2>
      <div className="choice-list" role="group" aria-label={label}>
        {options.map((option) => (
          <Button
            key={String(option.value)}
            className="choice-button"
            label={option.label}
            size="sm"
            variant={value === option.value ? "primary" : "secondary"}
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
          />
        ))}
      </div>
    </section>
  );
}

function AppContent() {
  const [config, setConfig] = useState<Config>(loadConfig);
  const dragStart = useRef<number | null>(null);
  const dragEnd = useRef<number | null>(null);
  const dragCommitted = useRef(false);

  const updateConfig = useCallback((update: Partial<Config>) => {
    setConfig((current) => ({ ...current, ...update }));
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

  const result = expected_from_config(config);

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="brand-mark" aria-hidden="true">
          ★
        </div>
        <div>
          <p className="eyebrow">MapleStory Southeast Asia</p>
          <h1>
            Starforce <span>Calculator</span>
          </h1>
        </div>
        <span className="region-badge">MSEA</span>
      </header>

      <p className="intro">
        Estimate the mesos, success chance, and booms needed to reach your target star.
      </p>

      <section className="calculator-panel" aria-label="Starforce settings">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Configuration</p>
            <h2>Upgrade details</h2>
          </div>
          <span className="star-range">
            {config.item_from_star} <span aria-hidden="true">→</span> {config.item_to_star} stars
          </span>
        </div>

        <div className="numeric-grid">
          <NumericField
            label="Item level"
            value={config.item_level}
            onChange={(item_level) => updateConfig({ item_level })}
          />
          <NumericField
            label="Starting stars"
            value={config.item_from_star}
            onChange={(item_from_star) => updateConfig({ item_from_star })}
          />
          <NumericField
            label="Target stars"
            value={config.item_to_star}
            onChange={(item_to_star) => updateConfig({ item_to_star })}
          />
          <NumericField
            label="Replacement cost"
            value={config.replacement_cost}
            onChange={(replacement_cost) => updateConfig({ replacement_cost })}
          />
        </div>

        <div className="settings-grid">
          <ChoiceGroup
            label="Event"
            options={EVENT_OPTIONS}
            value={config.event}
            onChange={(event) => updateConfig({ event })}
          />
          <ChoiceGroup
            label="MVP discount"
            options={DISCOUNT_OPTIONS}
            value={config.mvp_discount}
            onChange={(mvp_discount) => updateConfig({ mvp_discount })}
          />
          <section className="option-section safeguard-section" aria-label="Safeguard">
            <div className="section-title">
              <h2>Safeguard</h2>
              <span>Click or drag to select</span>
            </div>
            <div className="choice-list" role="group" aria-label="Safeguard stars">
              {SAFEGUARD_VALUES.map((star) => {
                const checked = config.safeguard.includes(star);
                return (
                  <Button
                    key={star}
                    className="choice-button safeguard-button"
                    label={`${star} stars`}
                    size="sm"
                    variant={checked ? "primary" : "secondary"}
                    aria-pressed={checked}
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
                    onClick={() => {
                      if (dragCommitted.current) {
                        dragCommitted.current = false;
                        return;
                      }
                      const safeguard = checked
                        ? config.safeguard.filter((value) => value !== star)
                        : [...config.safeguard, star];
                      updateConfig({ safeguard });
                    }}
                  >
                    {star}
                  </Button>
                );
              })}
            </div>
          </section>
        </div>
      </section>

      <section className="results-panel" aria-label="Expected results" aria-live="polite">
        <div className="result-card result-cost">
          <p className="result-label">Expected mesos</p>
          <p className="result-value">{displayCost(result.cost)}</p>
          <p className="result-caption">Average upgrade cost</p>
        </div>
        <div className="result-card">
          <p className="result-label">Success chance</p>
          <p className="result-value">{displayRounded(100 * result.prob_success)}%</p>
          <p className="result-caption">Before any boom</p>
        </div>
        <div className="result-card result-booms">
          <p className="result-label">Expected booms</p>
          <p className="result-value">{displayRounded(result.booms)}</p>
          <p className="result-caption">Items destroyed on average</p>
        </div>
      </section>

      <footer className="app-footer">
        Settings are saved in the page URL, so you can share your calculation.
      </footer>
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
