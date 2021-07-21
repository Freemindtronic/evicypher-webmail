<script lang="ts">
  import EncryptIdle from './assets/encrypt.svg'
  import Button from './Button.svelte'
  import { ButtonState } from './encryption'

  /** Tooltip content. */
  export let tooltip: string | undefined = undefined

  /** Button state. */
  export let state: ButtonState = ButtonState.IDLE
</script>

<!-- Svelte favors composition over inheritence, so this is the "Svelte-way" of recycling components -->
<Button
  bind:tooltip
  bind:state
  tooltipPlacement="top-end"
  IdleIcon={EncryptIdle}
  idleTooltip="Click to encrypt this message."
  doneTooltip="Mail encrypted successfully!
  Click to encrypt once again."
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
