<script lang="ts">
  import { favoritePhoneId, Phone } from 'phones'
  import { createEventDispatcher } from 'svelte'
  import { _ } from 'svelte-i18n'

  const dispatch = createEventDispatcher<{ delete: Phone }>()
  export let phone: Phone
</script>

<p>
  {#if $favoritePhoneId === phone.id}
    <button class="transparent" on:click={() => ($favoritePhoneId = -1)}
      >★</button
    >
  {:else}
    <button class="transparent" on:click={() => ($favoritePhoneId = phone.id)}
      >☆</button
    >
  {/if}
  <span>{phone}</span>
  <button class="button" on:click={() => dispatch('delete', phone)}
    >{$_('delete')}</button
  >
</p>

<style lang="scss">
  p {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .transparent {
    padding: 0 0 4px;
    color: $primary;
    font-size: 1.5rem;
    line-height: 1;
    border: 0;
  }
</style>
