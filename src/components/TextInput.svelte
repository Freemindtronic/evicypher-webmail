<script lang="ts">
  /** Unique identifier used to link the field and the label. */
  export const id = `input-${Math.random().toString(36).slice(2)}`

  /**
   * Input type, see
   * https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#input_types
   *
   * @default 'text'
   */
  export let type = 'text'

  /**
   * Required?
   *
   * @default false
   */
  export let required = false

  /**
   * Field value.
   *
   * @default ''
   */
  export let value: string | number = ''

  /** Sets the type when the component is mounted. */
  const setType = (element: HTMLInputElement) => {
    element.type = type
  }
</script>

{#if $$slots.default}
  <label for={id}><slot /></label>
{/if}
<input use:setType {required} {id} bind:value on:input {...$$restProps} />

<style lang="scss">
  input {
    padding: 0.25em 0.375em;
    color: $text-color;
    font: inherit;
    letter-spacing: inherit;
    background-color: $background-color;
    border: 1px solid $input-color;
    border-radius: 4px;

    &:hover,
    &:focus {
      border-color: scale-color($input-color, $lightness: -30%);
    }

    &:focus {
      outline: 0;
      box-shadow: 0 1px 3px $input-color, 0 0 1px 1px $background-color;
    }
  }
</style>
