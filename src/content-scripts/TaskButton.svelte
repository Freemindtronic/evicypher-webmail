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
  export let report: Report | undefined = undefined

  /** A promise for the state of the process. */
  export let promise: Promise<void> | undefined = undefined

  /** Button style. */
  export let design: 'gmail' | 'outlook' | undefined = undefined

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
  class:gmail={design === 'gmail'}
  class:outlook={design === 'outlook'}
>
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
  <slot />
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
    margin: 2px;
    margin-right: var(--margin-right, 2px);
    margin-left: var(--margin-left, 2px);
    padding: 3px;
    background-color: #fff;
    border: 0;
    border-radius: 4px;

    :global(svg),
    :global(img) {
      vertical-align: bottom;
    }
  }

  .button.gmail {
    padding: 10px;
    color: #5f6368;
    font-weight: 500;
    font-size: 0.875rem;
    font-family: 'Google Sans', Roboto, RobotoDraft, Helvetica, Arial,
      sans-serif;
    line-height: 1;
    box-shadow: inset 0 0 0 1px #dadce0;

    &:hover,
    &:focus {
      background-color: rgba(32, 33, 36, 0.039);
    }

    &:active {
      background-color: rgba(32, 33, 36, 0.122);
      box-shadow: 0 1px 2px 0 rgba(60, 64, 67, 0.302),
        0 1px 3px 1px rgba(60, 64, 67, 0.149);
    }

    // Enable animations if the user have not disabled them
    @media (prefers-reduced-motion: no-preference) {
      transition: box-shadow 0.5s;
    }
  }

  .button.outlook {
    position: relative;
    padding: 6px 8px;
    color: var(--neutralPrimary);
    font-weight: 400;
    font-weight: 600;
    font-size: 14px;
    font-family: 'Segoe UI', 'Segoe UI Web (West European)', -apple-system,
      BlinkMacSystemFont, 'Roboto', 'Helvetica Neue', sans-serif;
    background-color: var(--white);
    border: 1px solid rgb(138, 136, 134);
    border-radius: 2px;
    outline: transparent none medium;
    cursor: pointer;

    &:hover,
    &:focus {
      background-color: var(--neutralQuaternaryAlt);
    }

    &:active {
      background-color: var(--neutralTertiaryAlt);
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
