/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable complexity */
/**
 * Content script that manage auto-login in the page
 *
 * - It looks for login field in the page
 * - It adds an auto-login button to each login field found
 * - It fills login field on button press
 *
 * @remarks
 *   It work by adding a background image to each input field found. The
 *   background image is set to not repeat and be located at the end of the
 *   input fields. It also add a listener for mouse-event on the input and if
 *   the mouse if close enough to the background image it add an onclick
 *   listener to catch any user click
 * @module
 */

import type { login as loginTask } from '$/background/tasks/login'
import type { Report } from '~src/report'
import { writable } from 'svelte/store'
import { ForegroundTask, startBackgroundTask, Task } from '~src/task'
import { checkPassword, setImage } from '../evipass/have-i-been-pwned'
import AutofillButton from './AutofillButton.svelte'
export let isSafe: boolean | undefined = false

/** Keeps track of which password fields have been processed. */
const processed = new Set()

/** A basic last-resort regex to find login fields. */
const loginRegex =
  /\b(login|user|username|loginusername|email|mail|phone|telephone|account)\b/i

/** Adds a data attribute to an input. */
function processInput(input: HTMLInputElement, type: 'login' | 'password') {
  input.dataset.autofillPrototypeInput = type
  addButton(input)
}

/** Processes inputs grouped in a form. */
function processGroup(inputs: HTMLInputElement[]) {
  // Stop there if there are no fields
  if (inputs.length === 0) return

  // If there is only one input on the page, check if it is a login or password field
  if (inputs.length === 1) {
    const input = inputs[0]
    if (processed.has(input)) return

    if (input.type === 'password' || input.type === 'email') {
      processed.add(input)
      processInput(input, input.type === 'email' ? 'login' : 'password')
      return
    }

    // Filter out search inputs
    if (
      loginRegex.test(input.name) ||
      loginRegex.test(input.id) ||
      loginRegex.test(input.className)
    ) {
      processed.add(input)
      processInput(input, 'login')
      return
    }

    // There is nothing else to do
    return
  }

  // If there are two inputs, check if they are login and password fields
  if (inputs.length === 2) {
    if (
      Number(inputs[0].type === 'password') +
        Number(inputs[1].type === 'password') !==
      1
    )
      return

    for (const input of inputs) {
      if (!processed.has(input)) {
        processed.add(input)
        processInput(input, input.type === 'password' ? 'password' : 'login')
      }
    }

    return
  }

  // There are more fields than two, this is more complicated than expected
  const passwords = inputs.filter((input) => input.type === 'password')

  // If there is more than one password field, it may be a registration form
  if (passwords.length === 1) {
    const password = passwords[0]
    // Ignore already processed fields
    if (processed.has(password)) return
    processed.add(password)
    processInput(password, 'password')

    // Find the closest login field
    const previousInputs = inputs.slice(0, inputs.indexOf(password)).reverse()
    for (const type of ['email', 'text', 'tel']) {
      const login = previousInputs.find((input) => type === input.type)
      if (login) {
        processInput(login, 'login')
        processed.add(login)
        break
      }
    }

    return
  }

  // Ignore forms containing more than one password fields (for now)
  if (passwords.length > 1) return

  // If there are isolated fields, run a basic regex on them
  for (const input of inputs) {
    if (processed.has(input)) continue
    if (loginRegex.test(input.name) || loginRegex.test(input.id)) {
      processed.add(input)
      processInput(input, 'login')
    }
  }
}

/** Finds and process form fields. */
function findForms() {
  // Find all fields
  // Inputs without the `type` attribute are text inputs
  const inputs = [
    ...document.querySelectorAll<HTMLInputElement>(
      'input[type=password], input[type=email], input[type=text], input[type=tel], input:not([type])'
    ),
  ].filter((input) => input.style.display !== 'none')

  // Group these inputs by form
  const groups = new Map<HTMLFormElement | null, HTMLInputElement[]>()
  for (const input of inputs) {
    if (!groups.has(input.form)) groups.set(input.form, [])
    groups.get(input.form)?.push(input)
  }

  for (const inputs of groups.values()) processGroup(inputs)
}

// Run the script on page load
findForms()

// Start observing the DOM for changes
new MutationObserver(findForms).observe(document.body, {
  subtree: true,
  childList: true,
})

/** Image used as a background image for the input. It gives the illusion of a button */
const icon = {
  focus:
    "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAl0lEQVQ4jb3SvQkCQRCG4cef0NQGTKxBMDAxMLGmq0EtRURMDKzCxBI0MTPYS044hHEXD3xhYNiZ/b7dYehILzjfYVpw/xoJJNyaiJg0EQpUGfcKqZ9pyhIJbHFs5SeMfjVZ44XLh0iFNFQ28Tvm2GPRLnSeQQlfvxC9YINZky9xxgrPUtf/7UHnVR4ExTGi2psHDpmePDWvfx8XBIor3gAAAABJRU5ErkJggg==')",
  blur: "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAA70lEQVQ4jaWTMU4DMRBF3yBvxynS5AxIFCBBgYQouIO90kK4AjkDIVvMbkdNhwCJggYJrkCTI6SitDQ0WwU7XpQvufEfzzzNjGFHSeoyhHAPTEe8/3YZ4wpYDSenCXCSSwDwoKrznBlCmAO3ewXEopIEZrYws9eh0sLMplVVXbZt+7MZmyTouu6m7/uvIdmbiBzHGF+aptn/QzCy42vgMMb4BBwVCf4jp6rX2wK89xci8gh8OOfON/0kgff+rq7rAwAROTWzd+fcWaqJySmIyMzM1sCnqs62Ee7cg9xfMMat8iS3ykvKo10BzyXCon4Bst5MTSd6lpEAAAAASUVORK5CYII=')",
}

/**
 * Fill an HTMLInputElement with the specified value. It also dispatch some
 * event to trick website of a real input
 */
const fillField = (field: HTMLInputElement, value: string) => {
  field.value = value
  field.dispatchEvent(new Event('input', { bubbles: true }))
  field.dispatchEvent(new Event('change', { bubbles: true }))
}

/**
 * Add a so call button to an input. It does so by adding a background image to
 * the input and listeners. When the mouse is located at the far right activate
 * the button
 */
function addButton(input: HTMLInputElement) {
  /** Contains either if the mouse is currently over the button */
  let isFocus = false

  const controller = new AbortController()
  /** A target is needed for svelte to inject a component */
  const target = document.createElement('span')
  /** A writable use to communicate with tippy for when to show the tooltip */
  const isTippyEnabled = writable(false)

  /** The tooltip that will be display above the input */
  const tooltip = new AutofillButton({
    target,
    props: {
      element: input,
      enable: isTippyEnabled,
    },
  })

  // Manage user click on abort
  tooltip.$on('abort', () => {
    // Propagate the information to the background task
    controller.abort()
    // Reset tooltip
    tooltip.$set({ promise: undefined })
  })

  // Style modifications can't be made on the same thread, hence the setTimeout
  setTimeout(() => {
    input.style.backgroundImage = icon.blur
    input.style.backgroundRepeat = 'no-repeat'
    input.style.backgroundAttachment = 'scroll'
    input.style.backgroundSize = '16px 18px'
    input.style.backgroundPosition = '98% 50%'
    input.style.cursor = 'auto'
  })

  // Manage button click event
  const clickHandler = async () => {
    // Set tooltip to manual to make it stay on screen
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    tooltip.$set({ promise: new Promise(() => {}) })

    // Start a background task to fetch login credentials
    const credential = await startBackgroundTask(Task.Login, login, {
      signal: controller.signal,
      reporter: (report: Report) => {
        console.log(report)
        tooltip.$set({ report })
      },
    })

    /** List of all login field detected */
    const loginFields: NodeListOf<HTMLInputElement> = document.querySelectorAll(
      '[data-autofill-prototype-input=login]'
    )

    /** List of all password field detected */
    const passwordFields: NodeListOf<HTMLInputElement> =
      document.querySelectorAll('[data-autofill-prototype-input=password]')

    for (const fieldLogin of loginFields)
      fillField(fieldLogin, credential.login)

    for (const field of passwordFields) fillField(field, credential.password)

    isSafe = await checkPassword(credential.password)

    const allFields = [...loginFields, ...passwordFields]

    for (const element of allFields) setImage(element, icon, isSafe)

    tooltip.$set({ isSafe })
    tooltip.$set({ promise: Promise.resolve() })
  }

  const focusButton = () => {
    isFocus = true
    input.style.backgroundImage = icon.focus
    input.style.cursor = 'pointer'
    input.addEventListener('click', clickHandler)
    isTippyEnabled.set(true)
  }

  const blurButton = () => {
    input.style.backgroundImage = icon.blur
    input.style.cursor = 'auto'
    input.removeEventListener('click', clickHandler)
    isTippyEnabled.set(false)
    isFocus = false
  }

  const mouseoverHandler = (e: MouseEvent) => {
    const rect = input.getBoundingClientRect()
    const x = e.clientX - rect.left
    const threshold = rect.width * 0.98 - 24

    if (x >= threshold && !isFocus) focusButton()
    else if (x < threshold && isFocus) blurButton()
  }

  const mouseoutHandler = () => {
    if (isFocus) blurButton()
  }

  input.addEventListener('mousemove', mouseoverHandler)
  input.addEventListener('mouseout', mouseoutHandler)
}

/** Foreground task, tasked to send the hostname of the current page to the background task */
const login: ForegroundTask<typeof loginTask> = async function* () {
  // Suspend the task until the front sends the first request
  yield

  yield getHostname()
}

/**
 * Get the hostname of the current page
 *
 * @example
 *   // on 'www.google.com'
 *   // returns 'google'
 *   getHostname()
 *
 * @returns Return the hostname
 */
const getHostname = () => {
  const array = window.location.hostname.split('.')
  return array[array.length - 2]
}
