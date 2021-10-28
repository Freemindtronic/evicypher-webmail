<script lang="ts">
  import type { Report } from '$/report'
  import type { Writable } from 'svelte/store'
  import type { Instance, Placement } from 'tippy.js'
  import { afterUpdate, createEventDispatcher, onMount } from 'svelte'
  import { get } from 'svelte/store'
  import tippy from 'tippy.js'
  import Button from '$/components/Button.svelte'
  import { isLoading, translateError, translateReport, _ } from '$/i18n'

  /** Tooltip content. */
  export let report: Report | undefined = undefined

  /** A promise for the state of the process. */
  export let promise: Promise<void> | undefined = undefined

  /** Tooltip placement. */
  export let tooltipPlacement: Placement = tippy.defaultProps.placement

  /** Tooltip show arrow */
  export let tooltipArrow = tippy.defaultProps.arrow

  /** Default tooltip content, when the button is in idle state. */
  export let idleTooltip: string

  /** Tooltip content when the task completed successfully. */
  export let doneTooltip: string

  /** Enable or disable tooltip on demand */
  export let enable: Writable<boolean> | undefined = undefined

  /** Element tooltip have to attach to */
  export let element: HTMLElement

  let tippyElement: HTMLElement
  let tippyInstance: Instance | undefined

  const handleEnable = (value: boolean) => {
    if (tippyInstance === undefined || promise !== undefined) return

    if (value) {
      tippyInstance.enable()
      tippyInstance.show()
    } else {
      tippyInstance.hide()
      tippyInstance.disable()
    }
  }

  enable?.subscribe(handleEnable)

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
    tippyInstance = tippy(element, {
      content: tippyElement,
      hideOnClick: false,
      theme: 'light-border',
      interactive: true,
      placement: tooltipPlacement,
      arrow: tooltipArrow,
      // Works on all webmails, despite is targetting the iframe
      appendTo: document.querySelector('frame')?.contentDocument?.body,
    })

    // Once mounted check if it enabled
    if (enable !== undefined) handleEnable(get(enable))
  })

  afterUpdate(() => {
    // Recompute the location of the tooltip after each update
    if (!tippyInstance) return
    tippyInstance.setContent(tippyElement)
    if (promise !== undefined) tippyInstance.show()
  })
</script>

{#if !$isLoading}
  <div bind:this={tippyElement} class="tooltip">
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
{/if}

<style lang="scss">
  :global {
    @import '../assets/tippy';
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
