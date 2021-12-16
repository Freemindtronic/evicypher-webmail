<script lang="ts">
  import Button from '$/components/Button.svelte'
  import TextInput from '$/components/TextInput.svelte'
  import { isLoading, _ } from '$/i18n'

  export let name: string
  export let value: string

  let input: TextInput

  function enter() {
    input.$set({ type: '' })
  }

  function leave() {
    input.$set({ type: 'password' })
  }

  function copyToClipboard() {
    void navigator.clipboard.writeText(value)
  }
</script>

{#if !$isLoading}
  <span on:mouseenter={enter} on:mouseleave={leave}>
    <TextInput bind:this={input} type="password" bind:value readonly
      >{$_(name)}:</TextInput
    >
  </span>

  <Button id="refresh" on:click={copyToClipboard}
    ><i class="fas fa-clipboard" /></Button
  >
{/if}
