<script lang="ts">
  import 'i18n'
  import type { Report } from 'report'
  import { _ } from 'svelte-i18n'
  import DecryptIdle from './assets/decrypt.svg'
  import Button from './Button.svelte'

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
