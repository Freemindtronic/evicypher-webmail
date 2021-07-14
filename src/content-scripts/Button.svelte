<script lang="ts">
  import { afterUpdate, createEventDispatcher, onMount } from 'svelte'
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

  /** Tooltip */
  export let idleIcon: string
  export let idleTooltip: string
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
    tippyInstance = tippy(button, {
      content: tippyElement,
      hideOnClick: false,
      theme: 'light-border',
      interactive: true,
      placement: tooltipPlacement,
    })
  })

  afterUpdate(() => {
    // Recompute the location of the tooltip
    tippyInstance?.setContent(tippyElement)
    if (state !== ButtonState.IDLE) tippyInstance?.show()
  })
</script>

<span class="wrapper">
  <button on:click={() => dispatch('click')} bind:this={button}>
    {#if state === ButtonState.IDLE}
      {idleIcon}
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
</span>

<div bind:this={tippyElement} class="tooltip">
  {#if state === ButtonState.IDLE}
    {idleTooltip}
  {:else if state === ButtonState.IN_PROGRESS}
    {tooltip}
    <br />
    <button on:click={() => dispatch('abort')}>Abort</button>
  {:else if state === ButtonState.DONE}
    {doneTooltip}
  {:else if state === ButtonState.FAILED}
    {tooltip}
    Click to retry.
  {/if}
</div>

<style lang="scss">
  :global {
    @import './tooltip';
  }

  button {
    all: revert;
    padding: 0.5em;
  }

  .tooltip {
    width: max-content;
    max-width: 100%;
    white-space: pre-line;
  }
</style>
