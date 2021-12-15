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

<div class="secret-input">
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
</div>

<style lang="scss">
  .secret-input {
    margin: 1rem;
  }
</style>
