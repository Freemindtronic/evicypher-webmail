<script lang="ts">
  import DecryptIdle from './assets/DecryptIdle.svelte'
  import Button from './Button.svelte'
  import { ButtonState } from './encryption'

  /** Tooltip content. */
  export let tooltip: string | undefined = undefined

  /** Button state. */
  export let state: ButtonState = ButtonState.IDLE
</script>

<Button
  bind:tooltip
  bind:state
  tooltipPlacement="bottom-start"
  IdleIcon={DecryptIdle}
  idleTooltip="Click to decrypt this message."
  doneTooltip="Click to close the decrypted mail."
  on:click
  on:abort
/>
