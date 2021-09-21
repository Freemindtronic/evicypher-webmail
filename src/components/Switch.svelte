<script>
  export let checked = false

  export const color = '#2196F3'
</script>

<label class="switch">
  <input type="checkbox" bind:checked />
  <span class="slider" />
</label>

<style lang="scss">
  .switch {
    position: relative;
    display: inline-block;
    width: 50px;
    height: 20px;
  }

  .switch input {
    width: 0;
    height: 0;
    opacity: 0;
  }

  .slider {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background-color: #ccc;
    border-radius: 20px;
    cursor: pointer;
    -webkit-transition: 0.4s;
    transition: 0.4s;
  }

  .slider:before {
    position: absolute;
    bottom: 2px;
    left: 4px;
    width: 17px;
    height: 17px;
    background-color: white;
    border-radius: 50%;
    -webkit-transition: 0.4s;
    transition: 0.4s;
    content: '';
  }

  input:checked + .slider {
    background-color: $input-color;
    box-shadow: 0 0 1px $input-color;
  }

  input:checked + .slider:before {
    -webkit-transform: translateX(26px);
    -ms-transform: translateX(26px);
    transform: translateX(26px);
  }
</style>
