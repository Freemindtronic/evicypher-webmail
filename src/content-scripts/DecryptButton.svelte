<script lang="ts">
  import type { Report } from 'report'
  import { _ } from 'i18n'
  import Button from './TaskButton.svelte'
  import DecryptIdle from './assets/decrypt.svg'

  /** Tooltip content. */
  export let report: Report | undefined

  /** A promise for the state of the process. */
  export let promise: Promise<void> | undefined
</script>

<!-- Svelte favors composition over inheritence, so this is the "Svelte-way" of recycling components -->
<Button
  bind:report
  bind:promise
  tooltipPlacement="bottom-start"
  IdleIcon={DecryptIdle}
  idleTooltip={$_('click-to-decrypt-this-message')}
  doneTooltip={$_('click-to-close-the-decrypted-mail')}
  on:click
  on:abort
/>
