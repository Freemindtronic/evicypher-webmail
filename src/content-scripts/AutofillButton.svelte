<script lang="ts">
  import type { Report } from '$/report'
  import type { Writable } from 'svelte/store'
  import { _ } from '$/i18n'
  import TaskTippy from './TaskTippy.svelte'

  export let element: HTMLElement

  export let enable: Writable<boolean>

  /** Tooltip content. */
  export let report: Report | undefined = undefined

  /** A promise for the state of the process. */
  export let promise: Promise<void> | undefined = undefined

  const tooltipArrow = false
</script>

<!-- Svelte favors composition over inheritance, so this is the "Svelte-way" of recycling components -->
<TaskTippy
  bind:report
  bind:promise
  {element}
  {enable}
  {tooltipArrow}
  tooltipPlacement="top-end"
  idleTooltip={$_('click-to-autofill')}
  doneTooltip={$_('autofill-successful')}
  on:abort
/>
