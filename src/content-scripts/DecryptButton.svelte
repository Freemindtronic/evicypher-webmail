<script lang="ts">
  import type { Report } from '$/report'
  import { isLoading, _ } from '$/i18n'
  import Button from './TaskButton.svelte'
  import DecryptIdle from './assets/decrypt.svg'
  import { Design } from './design'

  /** Tooltip content. */
  export let report: Report | undefined = undefined

  /** A promise for the state of the process. */
  export let promise: Promise<void> | undefined = undefined

  /** Design option. */
  export let design: Design = Design.None
</script>

{#if !$isLoading}
  <!-- Svelte favors composition over inheritance, so this is the "Svelte-way" of recycling components -->
  <Button
    bind:report
    bind:promise
    {design}
    tooltipPlacement="top-start"
    idleIcon={DecryptIdle}
    idleTooltip={$_('click-to-decrypt-this-message')}
    doneTooltip={$_('click-to-close-the-decrypted-mail')}
    task="decrypt"
    on:click
    on:abort
  >
    {#if promise === undefined}
      {$_('decrypt')}
    {:else}
      {#await promise}
        {$_('decrypt')}
      {:then}
        {$_('close')}
      {:catch error}
        {$_('decrypt')}
      {/await}
    {/if}
  </Button>
{/if}
