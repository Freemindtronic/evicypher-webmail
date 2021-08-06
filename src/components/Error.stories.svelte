<script>
  import { Meta, Story, Template } from '@storybook/addon-svelte-csf'
  import Error from './Error.svelte'
</script>

<Meta title="Components/Error" component={Error} />

<Template>
  <Error>
    Wrong email or password.
    <a href="/reset-password" on:click|preventDefault>
      Click here to reset your password.
    </a>
  </Error>
</Template>

<Story name="Error" />
