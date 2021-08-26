<script>
  import { Meta, Template, Story } from '@storybook/addon-svelte-csf'
  import Select from './Select.svelte'
  let value
</script>

<Meta
  title="Components/Select"
  component={Select}
  argTypes={{
    label: { control: { type: 'text' } },
    value: { control: { type: 'text' } },
    options: { control: { type: 'object' } },
    onInput: { action: 'input' },
  }}
/>

<Template let:args>
  <Select on:input={args.onInput} {...args}>{args.label}</Select>
</Template>

<Story
  name="Standard Usage"
  args={{
    label: 'Favorite day:',
    options: [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ],
  }}
/>

<Story
  name="Without label"
  args={{
    options: ['English', 'French'],
  }}
  let:args
>
  <Select on:input={args.onInput} {...args} />
</Story>

<Story
  name="Reactivity"
  args={{
    options: ['English', 'French'],
  }}
  let:args
>
  <Select bind:value {...args} />
  <p>{value}</p>
</Story>

<Story
  name="Keys and values"
  args={{
    options: new Map([
      ['en', 'English'],
      ['fr', 'French'],
    ]),
  }}
  let:args
>
  <Select bind:value {...args} />
  <p>{value}</p>
</Story>

<Story
  name="Record"
  args={{
    options: {
      ara: 'عربي',
      cat: 'Catalá',
      de: 'Deutsch',
      en: 'English',
      fr: 'Français',
      it: 'Italiano',
      ja: '日本の',
      pt: 'Português',
      ro: 'Românesc',
      ru: 'Русский',
      es: 'Español',
      zhs: '简体中文',
    },
  }}
  let:args
>
  <Select bind:value {...args} />
  <p>{value}</p>
</Story>
