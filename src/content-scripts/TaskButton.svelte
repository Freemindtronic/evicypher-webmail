<script lang="ts">
  import type { Report } from '$/report'
  import type { Placement } from 'tippy.js'
  import { createEventDispatcher } from 'svelte'
  import { onMount, SvelteComponent } from 'svelte/internal'
  import tippy from 'tippy.js'
  import { browser } from 'webextension-polyfill-ts'
  import { isLoading, _ } from '$/i18n'
  import TaskTippy from './TaskTippy.svelte'
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
  const isMounted = new Promise<void>((resolve) => {
    onMount(() => {
      resolve()
    })
  })

  const dispatch =
    createEventDispatcher<{ click: undefined; abort: undefined }>()
</script>

{#if !$isLoading}
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
{/if}

{#await isMounted then _}
  <TaskTippy
    bind:report
    bind:promise
    {tooltipPlacement}
    {idleTooltip}
    {doneTooltip}
    element={button}
    on:abort
  />
{/await}

<style lang="scss">
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

  .button.whatsapp {
    margin: 0;
    padding: 0px 3px;
    color: #ffffff;
    font-weight: bold;
    font-size: 12px;
    font-family: Consolas, Menlo, Monaco, Lucida Console, Liberation Mono,
      DejaVu Sans Mono, Bitstream Vera Sans Mono, Courier New, Courier,
      monospace;
    line-height: 1.6;
    text-transform: uppercase;
    background-color: var(--panel-background-colored);
    border: 2px solid white;
    border-radius: 3px;
    cursor: pointer;
    transition: box-shadow 0.18s ease-out, background 0.18s ease-out,
      color 0.18s ease-out;

    &:focus {
      border-color: #e5ddd5;
    }

    &:hover {
      color: var(--secondary);
      background-color: var(--rich-text-panel-background);
    }

    &.decrypt {
      margin: 8px 0;
    }

    &.encrypt {
      float: left;
    }

    > :global(svg) {
      display: inline !important;
      vertical-align: middle;
    }
  }

  .button.linkedin {
    padding: 5px 5px;
    color: var(--color-text-low-emphasis-shift);
    font-weight: 500;
    font-size: 1.4rem;
    font-family: -apple-system, system-ui, BlinkMacSystemFont, Segoe UI, Roboto,
      Helvetica Neue, Fira Sans, Ubuntu, Oxygen, Oxygen Sans, Cantarell,
      Droid Sans, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol,
      Lucida Grande, Helvetica, Arial, sans-serif;
    line-height: 1;
    background-color: #fff;
    border: 0;
    border-radius: var(--corner-radius-small) !important;
    box-shadow: inset 0 0 0 1px #dadce0;

    &:hover,
    &:focus {
      color: var(--color-text-low-emphasis-shift);
      background-color: var(--color-background-none-tint-hover);
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
      margin-left: 3px;
    }

    // Enable animations if the user have not disabled them
    @media (prefers-reduced-motion: no-preference) {
      transition: box-shadow 0.5s;
    }
  }

  .button.icloud {
    position: relative;
    padding: 6px 8px;
    color: black;
    font-weight: 400;
    font-size: 17px;
    font-family: 'SFUIText', Helvetica, sans-serif;
    line-height: 21px;
    background-color: rgb(228, 228, 230);
    border: 0;
    border-radius: 8px;
    outline: transparent none medium;
    cursor: pointer;

    &:focus {
      color: white;
      background-color: rgb(0, 113, 235);
    }

    &:active {
      color: black;
      background-color: rgb(228, 228, 230);
    }

    &.decrypt {
      margin: 8px 0;
    }

    &.encrypt {
      margin-inline-end: 12px;
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
  .linkedin.encrypt {
    padding: 5px 5px;
    color: var(--color-text-low-emphasis-shift);
    font-size: 0;
    background-color: var(--rich-text-panel-background);
    border: transparent;
    border-radius: 120px !important;
    box-shadow: none;
    content: '';
  }
  .whatsapp.encrypt {
    padding: 5px 5px;
    color: var(--icon);
    font-size: 0;
    background-color: var(--rich-text-panel-background);
    border: transparent;
    content: '';
  }
</style>
