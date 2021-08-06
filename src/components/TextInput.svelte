<!--
  @component
  A styled and reactive text input.

  **Usage:**
  ```tsx
  <TextInput type="password" bind:value={password} required>Password:</TextInput>
  ```
-->
<script lang="ts">
  /** Unique identifier used to link the field and the label. */
  export let id = `input-${Math.random().toString(36).slice(2)}`

  /**
   * Field value. This property is bindable.
   *
   * @default ''
   */
  export let value = ''
</script>

{#if $$slots.default}
  <label for={id}><slot /></label>
{/if}
<input {id} bind:value on:input {...$$restProps} />

<style lang="scss">
  // Some rules come from https://csstools.github.io/sanitize.css/
  input {
    // $px is 1/16th of 1em, which is 1px when 1em=16px
    padding: 3 * $px 5 * $px;
    color: $text-color;
    font: inherit;
    letter-spacing: inherit;
    background-color: $background-color;
    border: $px solid $input-color;
    border-radius: 4 * $px;

    &:hover,
    &:focus {
      border-color: scale-color($input-color, $lightness: -30%);
    }

    &:focus {
      outline: 0;
      box-shadow: 0 $px 3 * $px $input-color, 0 0 $px $px $background-color;
    }
  }
</style>
