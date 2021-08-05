<script>
  import { Meta, Template, Story } from '@storybook/addon-svelte-csf'
  import TextInput from './TextInput.svelte'
  let value
</script>

<Meta
  title="Components/TextInput"
  component={TextInput}
  argTypes={{
    label: { control: { type: 'text' } },
    type: {
      control: { type: 'text' },
    },
    required: {
      control: { type: 'boolean' },
    },
    value: {
      control: { type: 'text' },
    },
    onInput: { action: 'input' },
  }}
/>

<Template let:args>
  <form action="#" on:submit|preventDefault>
    <TextInput on:input={args.onInput} {...args}>{args.label}</TextInput>
  </form>
</Template>

<Story
  name="Standard usage"
  args={{
    label: 'Name:',
  }}
/>

<Story
  name="Password"
  args={{
    label: 'Password:',
    type: 'password',
    required: true,
  }}
/>

<Story name="Without label" let:args>
  <form action="#" on:submit|preventDefault>
    <TextInput on:input={args.onInput} />
  </form>
</Story>

<Story
  name="Default value"
  args={{
    label: 'Name:',
    value: 'Default value',
  }}
/>

<Story
  name="Other attributes"
  args={{
    label: 'Credit card password:',
    type: 'text',
    required: false,
    pattern: '[0-9]{4}',
    placeholder: '4-number pin',
  }}
/>

<Story name="Reactivity">
  <TextInput bind:value />
  <p>{value}</p>
</Story>
