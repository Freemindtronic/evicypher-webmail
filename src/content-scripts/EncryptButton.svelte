<script lang="ts">
  import type { Report } from '$/report'
  import { _ } from '$/i18n'
  import Button from './TaskButton.svelte'
  import EncryptIdle from './assets/encrypt.svg'
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
  tooltipPlacement="top"
  idleIcon={EncryptIdle}
  idleTooltip={$_('click-to-encrypt-this-message')}
  doneTooltip={$_('mail-encrypted-successfully-click-to-encrypt-once-again')}
  task="encrypt"
  on:click
  on:abort
>
  {$_('encrypt')}
</Button>
