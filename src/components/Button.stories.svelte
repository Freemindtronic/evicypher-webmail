<script>
  import { Meta, Template, Story } from '@storybook/addon-svelte-csf'
  import Button from './Button.svelte'
</script>

<Meta
  title="Components/Button"
  component={Button}
  argTypes={{
    label: { control: { type: 'text' } },
    type: {
      options: ['submit', 'reset', 'button'],
      control: { type: 'inline-radio' },
    },
    onClick: { action: 'clicked' },
  }}
/>

<Template let:args>
  <Button on:click={args.onClick} {...args}>{args.label}</Button>
</Template>

<Story
  name="Primary"
  args={{
    label: 'Button',
    type: 'submit',
  }}
/>
