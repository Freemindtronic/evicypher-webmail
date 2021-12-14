<script lang="ts">
  import type { login as loginTask } from '$/background/tasks/login'
  import type { Report } from '$/report'
  import type { ForegroundTask } from '~src/task'
  import { onMount } from 'svelte'
  import { browser } from 'webextension-polyfill-ts'
  import Button from '$/components/Button.svelte'
  import { isLoading, _ } from '$/i18n'
  import { startBackgroundTask, Task } from '~src/task'
  import TaskTippy from '../content-scripts/TaskTippy.svelte'
  import FailedIcon from '../content-scripts/assets/failed.svg'
  import SecretInput from './SecretInput.svelte'

  /** Store the login of the label */
  let login: string
  /** Store the password of the label */
  let password: string
  /** Store a promise that resolve when this component finish initialize */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  let isInit = new Promise(() => {})

  let fetchButton: Element
  let divElement: HTMLElement
  let tippyElement: TaskTippy

  /** State of the current component */
  enum State {
    None,
    Display,
  }

  /** Store current state */
  let state = State.None

  /** Tooltip content. */
  let report: Report | undefined = undefined

  /** A promise for the state of the process. */
  let promise: Promise<void> | undefined = undefined

  // On mount try to initialize variables
  onMount(() => {
    if (!$isLoading) initVariables()
  })

  /** Initialize variables that will be use during the lifetime of this component */
  function initVariables() {
    const query = divElement.querySelector('#login_btn')
    if (query === null) return

    fetchButton = query
    isInit = Promise.resolve()
  }

  const controller = new AbortController()

  async function clickHandler() {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    promise = new Promise(() => {})

    const credential = await startBackgroundTask(
      Task.Login,
      loginForegroundTask,
      {
        signal: controller.signal,
        reporter: (reportToCopy: Report) => {
          console.log(report)
          report = reportToCopy
        },
      }
    ).catch((error) => {
      promise = Promise.reject(error)
    })

    if (credential === undefined) return

    login = credential.login
    password = credential.password

    promise = Promise.resolve()
    state = State.Display
  }

  /**
   * Foreground task, tasked to send the hostname of the current page to the
   * background task
   */
  const loginForegroundTask: ForegroundTask<typeof loginTask> =
    async function* () {
      // Suspend the task until the front sends the first request
      yield

      yield '#'
    }

  $: if (divElement) initVariables()
  $: if (tippyElement) {
    tippyElement.$on('abort', () => {
      // Propagate the information to the background task
      controller.abort()
      // Reset tooltip
      promise = undefined
    })
  }
</script>

{#if !$isLoading}
  <h3>{$_('login-credential')}</h3>
  <div bind:this={divElement}>
    <Button id="login_btn" on:click={clickHandler}>
      {#if promise === undefined}
        <i class="fas fa-download" />
      {:else}
        {#await promise}
          <img
            src={browser.runtime.getURL('/loading-light.gif')}
            alt="..."
            width="16"
            height="16"
          />
        {:then}
          <i class="fas fa-download" />
        {:catch}
          <FailedIcon width="16" height="16" />
        {/await}
      {/if}
      {$_('fetch')}
    </Button>
    {#await isInit then _value}
      <TaskTippy
        bind:this={tippyElement}
        bind:report
        bind:promise
        tooltipPlacement="top"
        idleTooltip={$_('click-to-fetch')}
        doneTooltip={$_('successful-data-retrieval')}
        element={fetchButton}
      />
    {/await}
    {#if state === State.Display}
      <br />
      <SecretInput name="login" bind:value={login} />
      <br />
      <SecretInput name="password" bind:value={password} />
    {/if}
  </div>
{/if}
