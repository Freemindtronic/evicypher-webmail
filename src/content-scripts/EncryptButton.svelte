<script lang="ts">
  import 'i18n'
  import type { Report } from 'report'
  import { _ } from 'svelte-i18n'
  import EncryptIdle from './assets/encrypt.svg'
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
  tooltipPlacement="top-end"
  IdleIcon={EncryptIdle}
  idleTooltip={$_('click-to-encrypt-this-message')}
  doneTooltip={$_('mail-encrypted-successfully-click-to-encrypt-once-again')}
  class="encrypt-button"
  on:click
  on:abort
/>

<style lang="scss">
  :global(.encrypt-button) {
    // While `!important` is usually a bad practice, I'd rather not use a
    // hack to ensure that this css is computed after the one of Button
    margin-left: 14px !important;
  }
</style>
