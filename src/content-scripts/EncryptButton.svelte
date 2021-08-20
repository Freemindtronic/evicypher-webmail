<script lang="ts">
  import type { Report } from '$/report'
  import { _ } from '$/i18n'
  import Button from './TaskButton.svelte'
  import EncryptIdle from './assets/encrypt.svg'

  /** Tooltip content. */
  export let report: Report | undefined

  /** A promise for the state of the process. */
  export let promise: Promise<void> | undefined

  /** Design option. */
  export let design: 'gmail' | 'outlook' | undefined
</script>

<!-- Svelte favors composition over inheritence, so this is the "Svelte-way" of recycling components -->
<Button
  bind:report
  bind:promise
  {design}
  tooltipPlacement="top"
  IdleIcon={EncryptIdle}
  idleTooltip={$_('click-to-encrypt-this-message')}
  doneTooltip={$_('mail-encrypted-successfully-click-to-encrypt-once-again')}
  on:click
  on:abort
  --margin-left={design === 'gmail' ? '12px' : '0px'}
>
  {$_('encrypt')}
</Button>
