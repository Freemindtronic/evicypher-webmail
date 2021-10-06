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
  import { Design } from './design'

  /** Tooltip content. */
  export let report: Report | undefined = undefined

  /** A promise for the state of the process. */
  export let promise: Promise<void> | undefined = undefined

  /** Button style. */
  export let design: Design = Design.None

  /** Tooltip placement. */
  export let tooltipPlacement: Placement = tippy.defaultProps.placement

  /** Default icon, when the button is in idle state. */
  export let IdleIcon: new (...args: never[]) => SvelteComponent

  /** Default tooltip content, when the button is in idle state. */
  export let idleTooltip: string

  /** Tooltip content when the task completed successfully. */
  export let doneTooltip: string

  /** Additional class. */
  export let task = ''

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
      appendTo: document.body,
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
  type="button"
  on:click={() => {
    dispatch('click')
  }}
  bind:this={button}
  class:button={true}
  class="{design} {task}"
  dir={$_('ltr')}
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
    background-color: #fff;
    border: 0;
    border-radius: 4px;
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

    &.decrypt {
      margin: 8px 3px;
    }

    &.encrypt {
      margin-left: 8px;
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
    line-height: 1.28571;
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

    &.decrypt {
      margin: 8px 0;
    }

    &.encrypt {
      margin-inline-end: 12px;
    }
  }

  .button.yahoo {
    padding: 10px 20px;
    color: #188fff;
    font-weight: 500;
    font-size: 13px;
    line-height: 1;
    background-color: #fff;
    border: 0;
    border-radius: 2px;
    box-shadow: inset 0 0 0 1px currentColor;

    &:hover,
    &:focus {
      color: rgb(0, 58, 188);
      background-color: rgb(224, 228, 233);
    }

    &:hover {
      background-color: #fff;
    }

    &.decrypt {
      margin: 8px 0;
    }

    &.encrypt {
      margin: 16px 16px 16px 0;
    }
  }

  .button.old-outlook {
    margin: 0;
    margin-right: 10px;
    padding: 0 20px;
    color: #333;
    font-weight: bold;
    font-size: 14px;
    font-family: 'wf_segoe-ui_semibold', 'Segoe UI Semibold',
      'Segoe WP Semibold', 'Segoe UI', 'Segoe WP', Tahoma, Arial, sans-serif;
    line-height: 2;
    background-color: #f4f4f4;
    border: 1px solid #f4f4f4;
    border-radius: 0;
    cursor: pointer;

    &:focus {
      border-color: #0078d7;
    }

    &:hover {
      background-color: #eaeaea;
      border-color: #eaeaea;
    }

    &:active {
      color: #ffffff;
      background-color: #0078d7;
      border-color: #0078d7;
    }

    &.decrypt {
      margin: 8px 0;
    }

    &.encrypt {
      float: left;
    }

    > :global(svg) {
      vertical-align: middle;
    }
  }

  .button.proton {
    margin: 0;
    margin-right: 10px;
    padding: 0 20px;
    color: white;
    font-weight: bold;
    font-size: 14px;
    font-family: 'wf_segoe-ui_semibold', 'Segoe UI Semibold',
      'Segoe WP Semibold', 'Segoe UI', 'Segoe WP', Tahoma, Arial, sans-serif;
    line-height: 2;
    background-color: #262a33;
    border: 1px solid #464b58;
    border-radius: var(--border-radius-medium);
    cursor: pointer;
    transition: border-color 0.2s, box-shadow 0.2s;

    &:focus,
    &:hover {
      border-color: #575d6b;
      box-shadow: 0 0 0 1px #575d6b inset;
    }

    &:active {
      border-color: #696f7d;
      box-shadow: 0 0 0 1px #696f7d inset;
    }

    &.decrypt {
      margin: 8px 0;
    }

    > :global(svg) {
      vertical-align: text-bottom;
    }
  }

  .button.andorratelecom {
    margin: 0;
    margin-right: 10px;
    padding: 0 20px;
    color: #333;
    font-weight: bold;
    font-size: 14px;
    font-family: 'wf_segoe-ui_semibold', 'Segoe UI Semibold',
      'Segoe WP Semibold', 'Segoe UI', 'Segoe WP', Tahoma, Arial, sans-serif;
    line-height: 2;
    background-color: #f7e0e2;
    border: 1px solid #f7e0e2;
    border-radius: 0;
    cursor: pointer;

    &:focus {
      border-color: #d5006d;
    }

    &:hover {
      background-color: #f0c1c5;
      border-color: #f0c1c5;
    }

    &:active {
      color: #ffffff;
      background-color: #d5006d;
      border-color: #d5006d;
    }

    &.decrypt {
      margin: 8px 0;
    }

    &.encrypt {
      float: left;
    }

    > :global(svg) {
      vertical-align: middle;
    }
  }

  .button.govern-andorra {
    margin: 0;
    margin-right: 10px;
    padding: 4 7px;
    color: #ffffff;
    font-weight: bold;
    font-size: 12px;
    font-family: 'Helvetica, Arial', 'Segoe UI Semibold', 'Segoe WP Semibold',
      'Segoe UI', 'Segoe WP', Tahoma, Arial, sans-serif;
    line-height: 2;
    background-image: url(/iNotes/Forms9.nsf/mButtonBlueGradient.png?OpenFileResource&amp;MX&amp;TS=20170116T174646,01Z);
    background-repeat: repeat-x;
    background-position: 0px -1px;
    border: 1px solid #19365f;
    border-radius: 0;
    cursor: pointer;

    &:focus {
      border-color: #bccad7;
    }

    &:hover {
      background-color: #bccad7;
      border-color: #39577a;
    }

    &.decrypt {
      margin: 8px 0;
    }

    &.encrypt {
      float: left;
    }

    > :global(svg) {
      vertical-align: middle;
    }
  }

  // Make the tooltip a flex container, to allow the Cancel button
  // to be in the right-hand side of the tooltip
  .tooltip {
    all: unset;
    display: flex;
    gap: 0.5em;
    align-items: center;
    width: max-content;
    max-width: 100%;
    font-family: system-ui, -apple-system, 'Segoe UI', 'Roboto', 'Ubuntu',
      'Cantarell', 'Noto Sans', sans-serif;
    white-space: pre-line;

    // stylelint-disable-next-line no-descending-specificity
    > :global(button) {
      // Keep the button on a single line
      flex-shrink: 0;
    }
  }
</style>
