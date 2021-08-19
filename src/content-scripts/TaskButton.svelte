<script lang="ts">
  import type { Report } from '$/report'
  import type { SvelteComponent } from 'svelte/internal'
  import type { Instance, Placement } from 'tippy.js'
  import { afterUpdate, createEventDispatcher, onMount } from 'svelte'
  import tippy from 'tippy.js'
  import { browser } from 'webextension-polyfill-ts'
  import Button from '$/components/Button.svelte'
  import { translateError, translateReport, _ } from '$/i18n'
  import DoneIcon from './assets/done.svg'
  import FailedIcon from './assets/failed.svg'

  /** Tooltip content. */
  export let report: Report | undefined

  /** A promise for the state of the process. */
  export let promise: Promise<void> | undefined

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
  let tippyInstance: Instance | undefined

  const dispatch =
    createEventDispatcher<{ click: undefined; abort: undefined }>()

  const resetTippy = () => {
    if (tippyInstance) {
      tippyInstance.setProps({
        trigger: tippy.defaultProps.trigger,
      })
    }
  }

  // Make the tooltip persistent when the task is running
  $: if (promise === undefined) {
    resetTippy()
  } else {
    if (tippyInstance) {
      tippyInstance.setProps({
        trigger: 'manual',
      })
    }

    promise.then(resetTippy).catch(resetTippy)
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
    if (!tippyInstance) return
    tippyInstance.setContent(tippyElement)
    if (promise !== undefined) tippyInstance.show()
  })
</script>

<button
  on:click={() => {
    dispatch('click')
  }}
  bind:this={button}
  class:button={true}
  dir={$_('ltr')}
  {...$$restProps}
>
  <slot />
  {#if promise === undefined}
    <svelte:component this={IdleIcon} width="16" height="16" />
  {:else}
    {#await promise}
      <img
        src={browser.runtime.getURL('/loading.gif')}
        alt="..."
        width="16"
        height="16"
      />
    {:then}
      <DoneIcon width="16" height="16" />
    {:catch}
      <FailedIcon width="16" height="16" />
    {/await}
  {/if}
</button>

<div bind:this={tippyElement} class="tooltip" dir={$_('ltr')}>
  {#if promise === undefined}
    {idleTooltip}
  {:else}
    {#await promise}
      <span>
        {#if report === undefined}
          {$_('loading')}
        {:else}
          {$translateReport(report)}
        {/if}
      </span>
      <Button
        type="button"
        on:click={() => {
          dispatch('abort')
        }}>{$_('cancel')}</Button
      >
    {:then}
      {doneTooltip}
    {:catch { message }}
      {$translateError(message)}
    {/await}
  {/if}
</div>

<style lang="scss">
  :global {
    @import '../assets/tippy';
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

    :global(svg),
    :global(img) {
      vertical-align: bottom;
    }

    &:hover,
    &:focus {
      box-shadow: 0 2px 6px rgba(0, 8, 16, 0.7);
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
