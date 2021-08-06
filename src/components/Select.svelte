<!--
  @component
  A styled and reactive select component.

  **Usage:**
  ```tsx
  <Select bind:value={language} options={['English', 'French']}>Language:</Select>
  ```
-->
<script lang="ts">
  /** Unique identifier used to link the field and the label. */
  export let id = `select-${Math.random().toString(36).slice(2)}`

  type T = $$Generic

  /** The value of the option selected. This property is bindable. */
  export let value: T

  /**
   * All the options available.
   *
   * @default An empty array
   */
  export let options: T[] = []
</script>

{#if $$slots.default}
  <label for={id}><slot /></label>
{/if}
<select {id} bind:value on:input {...$$restProps}>
  {#each options as option (option)}
    <option value={option}>{option}</option>
  {/each}
</select>

<style lang="scss">
  // Some rules come from https://csstools.github.io/sanitize.css/
  select {
    // $px is 1/16th of 1em, which is 1px when 1em=16px
    padding: 3 * $px 15 * $px 3 * $px 5 * $px;
    color: $text-color;
    font: inherit;
    letter-spacing: inherit;
    background: no-repeat right center / 1em;
    background-color: $background-color;
    background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='4'%3E%3Cpath d='M4 0h6L7 4'/%3E%3C/svg%3E");
    border: $px solid $input-color;
    border-radius: 4 * $px;
    -moz-appearance: none;
    -webkit-appearance: none;

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
