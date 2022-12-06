<script lang="ts">
  import { _ } from '$/i18n'
</script>

<div id="bitb" class="bitb-div">
  <h2 id="title" class="bitb-h2">{$_('warning-bitb-header')}</h2>
  <p id="message1" class="bitb-p">{$_('warning-bitb-url')}</p>
  <span id="url" class="bitb-span" />
</div>

<style lang="scss">
  .bitb-div {
    position: fixed;
    bottom: 0px;
    left: 0px;
    z-index: 9999;
    display: block;
    width: 100%;
    margin: 0px;
    padding: 20px;
    color: white;
    font-size: 14px;
    font-family: Arial, Helvetica, sans-serif;
    background-color: rgb(9, 42, 53);
  }

  .bitb-h2 {
    margin: 0px 0px 15px;
    padding: 0px;
    color: white;
    font-weight: normal;
    font-size: 18px;
    font-family: Arial, Helvetica, sans-serif;
  }

  .bitb-p {
    display: inline-block;
    margin: 0px 5px 15px 0px;
    padding: 0px;
    color: white;
    font-weight: normal;
    font-size: 14px;
    font-family: Arial, Helvetica, sans-serif;
  }

  .bitb-span {
    display: inline-block;
    margin: 0px 0px 15px;
    padding: 0px;
    color: white;
    font-weight: bold;
    font-size: 14px;
    font-family: Arial, Helvetica, sans-serif;
    text-decoration: underline;
  }
</style>
