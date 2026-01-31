<script lang="ts">
  import type { Config } from "./types";
  import { MAX_STARS, Event } from "./types";

  export let config: Config;

  const reject_non_numeric = (e: InputEvent) => {
    if (e.data) {
      if (/[^0-9]/.test(e.data)) {
        e.preventDefault();
      }
    }
  };

  const between = (a: number | null, b: number | null, x: number) => {
    if (a === x || b === x) {
      return true;
    }

    if (a === null || b === null) {
      return false;
    }
    let [start, end] = a < b ? [a, b] : [b, a];
    return x >= start && x <= end;
  };

  let starcatch_drag_start_index: number | null = null;
  let starcatch_drag_end_index: number | null = null;
  const starcatch_enabling = (star: number) => !config.starcatch.includes(star);
  const starcatch_drag_start = (star: number) => (e: PointerEvent) => {
    starcatch_drag_start_index = star;
    const target = e.target as HTMLElement;
    target.releasePointerCapture(e.pointerId);
  };
  const starcatch_drag_continue = (star: number) => () => {
    if (starcatch_drag_start_index != null) {
      starcatch_drag_end_index = star;
    }
  };
  const starcatch_drag_cancel = () => {
    starcatch_drag_end_index = null;
  };
  const starcatch_drag_commit = () => {
    if (
      starcatch_drag_start_index != null &&
      starcatch_drag_end_index != null &&
      starcatch_drag_start_index !== starcatch_drag_end_index
    ) {
      let new_starcatch = [];
      for (let i = 0; i < MAX_STARS; i++) {
        if (between(starcatch_drag_start_index, starcatch_drag_end_index, i)) {
          if (starcatch_enabling(starcatch_drag_start_index)) {
            new_starcatch.push(i);
          }
        } else if (config.starcatch.includes(i)) {
          new_starcatch.push(i);
        }
      }
      config.starcatch = new_starcatch;
    }
    starcatch_drag_start_index = starcatch_drag_end_index = null;
  };

  let safeguard_drag_start_index: number | null = null;
  let safeguard_drag_end_index: number | null = null;
  const safeguard_values = [15, 16, 17];
  const safeguard_enabling = (star: number) => !config.safeguard.includes(star);
  const safeguard_drag_start = (star: number) => (e: PointerEvent) => {
    safeguard_drag_start_index = star;
    const target = e.target as HTMLElement;
    target.releasePointerCapture(e.pointerId);
  };
  const safeguard_drag_continue = (star: number) => () => {
    if (safeguard_drag_start_index != null) {
      safeguard_drag_end_index = star;
    }
  };
  const safeguard_drag_cancel = () => {
    safeguard_drag_end_index = null;
  };
  const safeguard_drag_commit = () => {
    if (
      safeguard_drag_start_index != null &&
      safeguard_drag_end_index != null &&
      safeguard_drag_start_index !== safeguard_drag_end_index
    ) {
      let new_safeguard = [];
      for (let val of safeguard_values) {
        if (between(safeguard_drag_start_index, safeguard_drag_end_index, val)) {
          if (safeguard_enabling(safeguard_drag_start_index)) {
            new_safeguard.push(val);
          }
        } else if (config.safeguard.includes(val)) {
          new_safeguard.push(val);
        }
      }
      config.safeguard = new_safeguard;
    }
    safeguard_drag_start_index = safeguard_drag_end_index = null;
  };
</script>

<fieldset>
  <legend><span>Item info</span></legend>

  <div class="inputs item-info">
    <label class="numeric level">
      <span>Level</span>
      <input
        type="number"
        placeholder="#"
        on:beforeinput={reject_non_numeric}
        bind:value={config.item_level}
      />
    </label>

    <span class="inputs-group">
      <label class="numeric from-stars">
        <input
          type="number"
          placeholder="#"
          on:beforeinput={reject_non_numeric}
          bind:value={config.item_from_star}
        />
        <span>stars</span>
      </label>

      <span>⟩</span>

      <label class="numeric to-stars">
        <input
          type="number"
          placeholder="#"
          on:beforeinput={reject_non_numeric}
          bind:value={config.item_to_star}
        />
        <span>stars</span>
      </label>
    </span>

    <label class="numeric replacement-cost">
      <span>Replacement cost</span>
      <input
        type="number"
        placeholder="#"
        on:beforeinput={reject_non_numeric}
        bind:value={config.replacement_cost}
      />
    </label>
  </div>
</fieldset>

<fieldset>
  <legend><span>Events</span></legend>

  <div class="inputs">
    <label class="button" class:checked={config.event === null}>
      <input type="radio" bind:group={config.event} value={null} />
      <span>None</span>
    </label>

    <label class="button" class:checked={config.event === Event.ONE_PLUS_ONE}>
      <input type="radio" bind:group={config.event} value={Event.ONE_PLUS_ONE} />
      <span>1+1</span>
    </label>

    <label class="button" class:checked={config.event === Event.THIRTY_OFF_PRICE}>
      <input type="radio" bind:group={config.event} value={Event.THIRTY_OFF_PRICE} />
      <span>30% off</span>
    </label>

    <label class="button" class:checked={config.event === Event.THIRTY_OFF_BOOM}>
      <input type="radio" bind:group={config.event} value={Event.THIRTY_OFF_BOOM} />
      <span>-30% boom ≤21</span>
    </label>

    <label class="button" class:checked={config.event === Event.SHINING}>
      <input type="radio" bind:group={config.event} value={Event.SHINING} />
      <span>shining</span>
    </label>

    <label class="button" class:checked={config.event === Event.GUARDIAN}>
      <input type="radio" bind:group={config.event} value={Event.GUARDIAN} />
      <span>guardian</span>
    </label>
  </div>
</fieldset>

<fieldset>
  <legend><span>VIP Discount</span></legend>

  <div class="inputs">
    <label class="button" class:checked={config.mvp_discount === 0}>
      <input type="radio" bind:group={config.mvp_discount} value={0} />
      <span>None</span>
    </label>

    <label class="button" class:checked={config.mvp_discount === 0.03}>
      <input type="radio" bind:group={config.mvp_discount} value={0.03} />
      <span>Gold</span>
    </label>

    <label class="button" class:checked={config.mvp_discount === 0.05}>
      <input type="radio" bind:group={config.mvp_discount} value={0.05} />
      <span>Diamond</span>
    </label>

    <label class="button" class:checked={config.mvp_discount === 0.1}>
      <input type="radio" bind:group={config.mvp_discount} value={0.1} />
      <span>Royal+</span>
    </label>
  </div>
</fieldset>

<fieldset on:pointerleave={safeguard_drag_cancel}>
  <legend>
    <span>Safeguard</span>
    <span class="help">(click and drag)</span>
  </legend>

  <div class="inputs">
    {#each safeguard_values as star}
      <label
        class="button draggable"
        class:checked={config.safeguard.includes(star)}
        class:disabling={!safeguard_enabling(safeguard_drag_start_index)}
        class:active={between(safeguard_drag_start_index, safeguard_drag_end_index, star)}
        on:pointerdown={safeguard_drag_start(star)}
        on:pointerenter={safeguard_drag_continue(star)}
      >
        <input type="checkbox" bind:group={config.safeguard} value={star} />
        <span>
          {star}
        </span>
      </label>
    {/each}
  </div>
</fieldset>

<fieldset on:pointerleave={starcatch_drag_cancel}>
  <legend>
    <span>Starcatch</span>
    <span class="help">(click and drag)</span>
  </legend>

  <div class="inputs">
    {#each { length: MAX_STARS } as _, star}
      <label
        class="button draggable"
        class:checked={config.starcatch.includes(star)}
        class:disabling={!starcatch_enabling(starcatch_drag_start_index)}
        class:active={between(starcatch_drag_start_index, starcatch_drag_end_index, star)}
        on:pointerdown={starcatch_drag_start(star)}
        on:pointerenter={starcatch_drag_continue(star)}
      >
        <input type="checkbox" bind:group={config.starcatch} value={star} />
        <span>
          {star}
        </span>
      </label>
    {/each}
  </div>
</fieldset>

<svelte:window on:pointerup={starcatch_drag_commit} on:pointerup={safeguard_drag_commit} />

<style lang="postcss">
  @tailwind utilities;

  fieldset {
    @apply py-3;
    @apply my-6;
    @apply lg:border-l lg:border-slate-600;

    user-select: none;

    position: relative;

    legend {
      @apply lg:absolute;
      @apply lg:px-3;
      right: 100%;

      top: 0;
      bottom: 0;
      display: flex;
      @apply items-baseline gap-x-1 lg:flex-col lg:items-end lg:justify-center;

      span {
        @apply text-slate-600;
        @apply text-2xl;
        font-weight: 500;
        white-space: nowrap;

        &.help {
          @apply text-sm;
          font-weight: 300;
        }
      }
    }

    .inputs {
      @apply lg:px-3;
      display: flex;
      place-items: baseline center;
      flex-wrap: wrap;
      @apply gap-x-2 gap-y-2;

      &.item-info {
        justify-content: space-between;
      }

      .inputs-group {
        display: flex;
        place-items: baseline center;
        @apply gap-x-2;
      }
    }
  }

  label {
    @apply py-1.5;
    @apply border-b-4 border-slate-600;
    transition: background-color ease-out 0.3s, border-color ease-out 0.3s;

    &:hover {
      @apply border-slate-400;
    }
  }

  label.button {
    @apply px-3;
    cursor: pointer;
    touch-action: none;

    &:focus-within {
      @apply bg-slate-700;
    }

    &.checked {
      @apply font-medium;
      @apply border-amber-400;
    }

    &:not(.draggable):active,
    &.active {
      transition: none;
      @apply font-medium;
      @apply bg-amber-400;
      @apply border-slate-50;
    }

    &.checked:not(.draggable):active,
    &.active.disabling {
      @apply font-light;
      @apply text-slate-900;
      @apply bg-slate-50;
      @apply border-none;
    }

    input[type="checkbox"],
    input[type="radio"] {
      @apply sr-only;
    }
  }

  label.numeric {
    &:focus-within {
      @apply border-slate-50;
    }

    input[type="number"] {
      @apply bg-transparent;
      @apply font-medium;
      text-align: right;
    }

    &.level input {
      @apply ml-1;
      @apply w-8;
    }

    &.from-stars input {
      @apply mr-1;
      @apply w-6;
    }

    &.to-stars input {
      @apply mr-1;
      @apply w-6;
    }

    &.replacement-cost input {
      @apply ml-1;
      @apply w-32;
    }
  }
</style>
