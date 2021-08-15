<!--
  @component
  A component that displays an error message if the Zeroconf service is not available.

  **Usage:**
  ```tsx
  <IsZeroconfRunning />
  ```
-->
<script lang="ts">
  import { browser } from 'webextension-polyfill-ts'
  import Error from '$/components/Error.svelte'
  import { _ } from '$/i18n'
  import { startBackgroundTask, Task } from '$/task'

  /** A promise wrapping the current state of the zeroconf service. */
  const zeroconfRunning = startBackgroundTask(
    Task.IS_ZEROCONF_RUNNING,
    async function* () {
      yield
    },
    {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      reporter: () => {},
      signal: new AbortController().signal,
    }
  )
</script>

{#await zeroconfRunning then running}
  {#if !running}<Error>
      {$_('zeroconf-unavailable')}
      <a
        href={browser.runtime.getURL('/zeroconf-unavailable.html')}
        target="_zeroconf-unavailable"
      >
        {$_('click-here-for-help')}</a
      >
    </Error>{/if}
{/await}
