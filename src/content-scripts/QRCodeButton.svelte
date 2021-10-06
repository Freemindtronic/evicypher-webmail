<script lang="ts">
  import type { Report } from '$/report'
  import { _ } from '$/i18n'
  import Button from './TaskButton.svelte'
  import QRIdle from './assets/qr.svg'
  import { Design } from './design'

  /** Tooltip content. */
  export let report: Report | undefined = undefined

  /** A promise for the state of the process. */
  export let promise: Promise<void> | undefined = undefined

  /** Design option. */
  export let design: Design = Design.None
</script>

<!-- Svelte favors composition over inheritance, so this is the "Svelte-way" of recycling components -->
<Button
  bind:report
  bind:promise
  {design}
  tooltipPlacement="top-start"
  IdleIcon={QRIdle}
  idleTooltip={$_('scan-the-qr-code-with-the-application')}
  doneTooltip={$_('click-to-close-the-qr-code')}
  task="qr-code"
  on:click
  on:abort
>
  {$_('qr-code')}
</Button>
