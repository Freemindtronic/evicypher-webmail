<script lang="ts">
  import phones, { nextPhoneId, Phone } from 'phones'
  import { _ } from 'svelte-i18n'
  import { link } from 'svelte-spa-router'
  import PhoneItem from './Phone.svelte'

  let value = ''

  const addPhone = async () => {
    $phones.push(new Phone(await nextPhoneId(), value))
    $phones = $phones
  }

  const removePhone = ({ detail: phone }: CustomEvent<Phone>) => {
    $phones = $phones.filter((p) => p.id != phone.id)
  }
</script>

<main>
  <h1>{$_('phones')}</h1>
  {#each $phones as phone (phone.id)}
    <PhoneItem {phone} on:delete={removePhone} />
  {/each}
  <form on:submit|preventDefault={addPhone}>
    <h2>{$_('register-a-new-phone')}</h2>
    <p>
      {$_('name')}
      <input type="text" bind:value />
      <button type="submit">{$_('add')}</button>
    </p>
  </form>
  <a href="/about/" use:link>{$_('about')}</a>
</main>
