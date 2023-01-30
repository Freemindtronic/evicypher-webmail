<script lang="ts">
  import Button from '$/components/Button.svelte'
  import { isLoading, _ } from '$/i18n'
  import { checkPassword } from './have-i-been-pwned'

  let divElement: HTMLElement
  let password: string
  let message = ''
  let isSafe: boolean | undefined

  /** Call the function to check if the password has been pwned */
  const validatePassword = async () => {
    if (password) {
      isSafe = await checkPassword(password)
      message = isSafe ? $_('password-no-pwned') : $_('password-pwned')
    } else {
      message = $_('password-not-inserted')
    }
  }
</script>

{#if !$isLoading}
  <h3 class="header">{$_('password-pwned-title')}</h3>
  <div class="flex" bind:this={divElement}>
    <label style="margin: 3%;" for="password">{$_('password')}:</label>
    <input class="input" type="password" id="password" bind:value={password} />
    <div style="margin: 3%;">
      <Button on:click={validatePassword}>{$_('verify')}</Button>
    </div>
    <p class={isSafe ? 'success' : 'danger'}>{message}</p>
  </div>
{/if}

<style lang="scss">
  .input {
    width: 50%;
    border-color: black;
  }

  .flex {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .success {
    color: green;
  }
  .danger {
    color: red;
  }

  .header {
    margin: 2%;
    border-bottom: 2px solid #f0f2f5;
  }
</style>
