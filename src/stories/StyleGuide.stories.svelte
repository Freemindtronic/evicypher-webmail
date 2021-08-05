<script lang="ts">
  import { Meta, Story } from '@storybook/addon-svelte-csf'
  import Color from './Color.svelte'

  const white = '#ffffff'
  const black = '#0c0b0b'
  const lightGold = '#ffc26e'
  const gold = '#d9a55d'
  const blue = '#1a7b9c'
  const darkBlue = '#092a35'
</script>

<Meta title="Style Guide" />

<Story name="Colors">
  <h1>Colors</h1>
  <div class="row">
    <Color color={white}>White</Color>
    <Color color={black} dark>Black</Color>
    <Color color={lightGold}>Light Gold</Color>
    <Color color={gold}>Gold</Color>
    <Color color={blue} dark>Blue</Color>
    <Color color={darkBlue} dark>Dark Blue</Color>
  </div>
  <h2>Usage</h2>
  <ul>
    <li>Texts must be either black or white.</li>
    <li style="margin-top: .5em">
      Use <span style="background-color: {gold}">gold</span> on white, and
      <span style="padding: .5em; color: {white}; background-color: {darkBlue}"
        ><span style="color: {black}; background-color: {lightGold}"
          >light gold</span
        > on dark blue.</span
      > The two tints should appear the same.
    </li>
  </ul>
  <h2>Examples</h2>
  <section
    class="color-example"
    style="color: {black}; background-color: {white}"
  >
    Black on white
    <button style="background-color: {gold}; border: 0"> Gold on white </button>
    <button style="color: {white}; background-color: {blue}; border: 0">
      Blue on white
    </button>
    Separators are dark blue
    <span
      style="
      display: inline-block;
      width: 2em;
      height: 2px;
      vertical-align: middle;
      background-color: {darkBlue};
      border-radius: 1px;"
    />
  </section>
  <section
    class="color-example"
    style="color: {white}; background-color: {darkBlue}"
  >
    White on dark blue
    <button
      style="
      color: {black};
      background-color: {lightGold};
      border: 0;"
    >
      Light gold on dark blue
    </button>
    <strong style="color: {lightGold}">Light gold on dark blue</strong>
  </section>
  <section
    class="color-example"
    style="color: {white}; background-color: {black}"
  >
    White on black
    <button
      style="
      color: {white};
      background-color: {blue};
      border: 0;"
    >
      Blue on black
    </button>
    <strong style="color: {lightGold}">Light gold on black</strong>
  </section>
  <h2>Contrast</h2>
  <p>
    To ensure an AA contrast rating, text <strong>must</strong> be white on blue
    backgrounds and black on gold backgrounds.
  </p>
  <p><strong>Do not write in gold, blue or dark blue.</strong></p>
</Story>

<Story name="Fonts">
  <h1>Fonts</h1>
  <table>
    <tr>
      <td style="font: 700 24px Sen, sans-serif">EviCypher</td>
      <td style="width: 8px" />
      <td style="font: 400 24px Sen, sans-serif">Webmail</td>
    </tr>
    <tr style="font: bold 12px sans-serif">
      <td>Sen, 24px, 700</td>
      <td />
      <td>Sen, 24px, 400</td>
    </tr>
  </table>
  <p>EviCypher and Webmail have 8 pixels in between.</p>
</Story>

<Story name="Logo">
  <h1>Logo</h1>
  <table style="color: {white}; background-color: {darkBlue}">
    <tr>
      <td style="height: 16px" colspan="7" title="↕ 16px" />
    </tr>
    <tr>
      <td style="width: 16px" title="↕ 16px" />
      <td title="32px × 32px">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 504.39 504.39"
          style="width: 32px; height: 32px; fill: {lightGold}"
        >
          <path
            d="M282.46 386.33V175.87h221.93v210.46l-118 118H0v-118zM115.35.03h389v115.31H221.93v210.47H0V115.34z"
          />
        </svg>
      </td>
      <td style="width: 12px" title="↔ 12px" />
      <td style="font: 700 24px Sen, sans-serif" title="↕ 24px">EviCypher</td>
      <td style="width: 8px" title="↔ 8px" />
      <td style="font: 400 24px Sen, sans-serif" title="↕ 24px">Webmail</td>
      <td style="width: 16px" title="↔ 16px" />
    </tr>
    <tr>
      <td style="height: 16px" colspan="7" title="↕ 16px" />
    </tr>
  </table>
  <p>Move the mouse over the logo to display the margins and sizes.</p>
  <p>
    Note: all sizes should be relative to 16px = 1rem. (For instance, 12px =
    0.75rem.)
  </p>
</Story>

<style lang="scss">
  @import '../assets/fonts.scss';

  :global(body) {
    color: #0c0b0b;
  }

  h1 {
    margin-top: 0;
  }

  td {
    padding: 0;
  }

  button {
    border-radius: 16px;
  }

  .row {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
  }

  .color-example {
    margin: 1em 0;
    padding: 1em;
  }
</style>
