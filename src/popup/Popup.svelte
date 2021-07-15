<script lang="ts">
  import { locale, locales, _ } from 'svelte-i18n'
  import Phones from './Phones.svelte'
</script>

<main>
  <h1>Freemindtronic</h1>
  <Phones />
  <select bind:value={$locale}>
    {#each $locales as locale}
      <option value={locale}>{locale}</option>
    {/each}
  </select>
</main>
