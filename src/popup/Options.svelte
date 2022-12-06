<script lang="ts">
  import Switch from '$/components/Switch.svelte'
  import { _ } from '$/i18n'
  import { isOpenpgpEnabled, isBITBEnabled } from '$/options'
</script>

<h2>{$_('parameters')}</h2>

<div id="flex-container">
  <div class="flex-item" id="Legacy">Legacy</div>
  <div class="flex-switch">
    <Switch bind:checked={$isOpenpgpEnabled} />
  </div>
  <div class="flex-item" id="OpenPGP">OpenPGP</div>
</div>

<div id="flex-container">
  <div class="flex-item" id="Enable">BITB</div>
  <div class="flex-switch">
    <Switch bind:checked={$isBITBEnabled} />
  </div>
  <div class="flex-item" id="Disable" />
</div>

<style lang="scss">
  #flex-container {
    display: flex;
    flex-direction: row;
  }
  #flex-container > .flex-switch {
    flex: none;
    width: 60px;
    text-align: center;
  }
  #flex-container > .flex-item {
    flex: 1;
  }
  #Legacy {
    text-align: end;
  }
  #OpenPGP {
    text-align: start;
  }
  #Enable {
    text-align: end;
  }
  #Disable {
    text-align: start;
  }
</style>
