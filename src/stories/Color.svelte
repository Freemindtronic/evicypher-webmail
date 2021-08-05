<script lang="ts">
  export let color: string
  export let dark = false
</script>

<div style="--color: {color}" class:dark>
  <slot /><br />
  {color}
</div>

<style lang="scss">
  div {
    display: flex;
    align-items: flex-end;
    justify-content: flex-start;
    width: 150px;
    height: 150px;
    padding: 0.5em;
    color: $black;
    background-color: var(--color);
  }

  div.dark {
    color: $white;
  }
</style>
