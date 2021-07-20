<script lang="ts">
  import { afterUpdate, createEventDispatcher, onMount } from 'svelte'
  import type { SvelteComponent } from 'svelte/internal'
  import type { Instance, Placement } from 'tippy.js'
  import tippy from 'tippy.js'
  import { browser } from 'webextension-polyfill-ts'
  import { ButtonState } from './encryption'

  /** Tooltip content. */
  export let tooltip: string | undefined = undefined

  /** Button state. */
  export let state: ButtonState = ButtonState.IDLE

  /** Tootlip placement. */
  export let tooltipPlacement: Placement = tippy.defaultProps.placement

  /** Default icon, when the button is in idle state. */
  export let IdleIcon: new (...args: never[]) => SvelteComponent

  /** Default tooltip content, when the button is in idle state. */
  export let idleTooltip: string

  /** Tooltip content when the task completed successfully. */
  export let doneTooltip: string

  let button: HTMLButtonElement
  let tippyElement: HTMLElement
  let tippyInstance: Instance

  const dispatch =
    createEventDispatcher<{ click: undefined; abort: undefined }>()

  // Make the tooltip persistent when the task is running
  $: {
    tippyInstance?.setProps({
      trigger:
        state === ButtonState.IN_PROGRESS
          ? 'manual'
          : tippy.defaultProps.trigger,
    })
  }

  onMount(() => {
    // Create a new tippy instance when the component is mounted
    tippyInstance = tippy(button, {
      content: tippyElement,
      hideOnClick: false,
      theme: 'light-border',
      interactive: true,
      placement: tooltipPlacement,
    })
  })

  afterUpdate(() => {
    // Recompute the location of the tooltip after each update
    tippyInstance?.setContent(tippyElement)
    if (state !== ButtonState.IDLE) tippyInstance?.show()
  })
</script>

<button
  on:click={() => dispatch('click')}
  bind:this={button}
  class:button={true}
  {...$$restProps}
>
  {#if state === ButtonState.IDLE}
    <svelte:component this={IdleIcon} width="16" height="16" />
  {:else if state === ButtonState.IN_PROGRESS}
    <img
      src={browser.runtime.getURL('/loading.gif')}
      alt="..."
      width="16"
      height="16"
    />
  {:else if state === ButtonState.DONE}
    ✔
  {:else if state === ButtonState.FAILED}
    ❌
  {/if}
</button>

<div bind:this={tippyElement} class="tooltip">
  {#if state === ButtonState.IDLE}
    {idleTooltip}
  {:else if state === ButtonState.IN_PROGRESS}
    <span>{tooltip}</span>
    <button on:click={() => dispatch('abort')}>Cancel</button>
  {:else if state === ButtonState.DONE}
    {doneTooltip}
  {:else if state === ButtonState.FAILED}
    {tooltip}
    Click to retry.
  {/if}
</div>

<style lang="scss">
  :global {
    @import './assets/tippy';
  }

  .button {
    all: revert;
    margin: 2px 5px;
    padding: 3px;
    background-color: #fff;
    border: 0;
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0, 8, 16, 0.7);

    // Enable animations if the user have not disabled them
    @media (prefers-reduced-motion: no-preference) {
      transition: box-shadow 0.1s;
    }

    :global(svg) {
      vertical-align: bottom;
      // This is a Gmail color, using https://svelte.dev/docs#style_props
      // would be nice in the future if more webmails are supported
      fill: #4a4a4a;
    }

    &:hover,
    &:focus {
      box-shadow: 0 2px 6px rgba(0, 8, 16, 0.7);

      :global(svg) {
        fill: #1f1f1f;
      }
    }

    &:active {
      box-shadow: 0 1px 2px rgba(0, 8, 16, 0.4),
        0 1px 2px rgba(0, 8, 16, 0.8) inset;
    }
  }

  // Make the tooltip a flex container, to allow the Cancel button
  // to be in the right-hand side of the tooltip
  .tooltip {
    display: flex;
    gap: 0.5em;
    align-items: center;
    width: max-content;
    max-width: 100%;
    white-space: pre-line;
  }
</style>
