<script lang="ts">
  import qs from "qs";
  import UrlPattern from "url-pattern";

  import type { Config } from "./types";
  import { DEFAULT_CONFIG, make_config } from "./types";

  export let config: Config;

  const PATTERN = new UrlPattern("/:level/:from/:to/");

  const deserialize = (ser: string) => {
    let [url, query] = ser.split("?");

    let url_parts = null;
    let match = PATTERN.match(url);
    if (match != null) {
      url_parts = {
        item_level: match.level,
        item_from_star: match.from,
        item_to_star: match.to,
      };
    }

    let opts = qs.parse(query);
    return make_config({ ...opts, ...url_parts });
  };

  const serialize = (config: Config) => {
    let { item_level, item_from_star, item_to_star, ...rest } = config;

    // Remove default values.
    for (let [k, v] of Object.entries(rest)) {
      if (DEFAULT_CONFIG[k] === v) {
        delete rest[k];
      }
    }

    return `/${item_level}/${item_from_star}/${item_to_star}/?${qs.stringify(rest)}`;
  };

  const load_config = () => {
    try {
      config = deserialize(window.location.hash.slice(1));
    } catch (e) {
      config = { ...DEFAULT_CONFIG };
    }
  };

  const store_config = (config: Config) => {
    let url = new URL(window.location.href);
    url.hash = `#${serialize(config)}`;
    window.history.replaceState({}, "", url);
  };

  load_config();
  $: store_config(config);
</script>

<svelte:window on:hashchange={load_config} />
