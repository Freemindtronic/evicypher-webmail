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
 *   Ma remarque
 * @module
 */

import type { login as loginTask } from '$/background/tasks/login'
import type { Report } from '~src/report'
import { ForegroundTask, startBackgroundTask, Task } from '~src/task'

/** Keeps track of which password fields have been processed. */
const processed = new Set()

export {}

/** A basic last-resort regex to find login fields. */
const loginRegex = /\b(login|user|username|email|mail|phone|telephone)\b/i

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
    if (loginRegex.test(input.name) || loginRegex.test(input.id)) {
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

const iconFocus =
  "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAl0lEQVQ4jb3SvQkCQRCG4cef0NQGTKxBMDAxMLGmq0EtRURMDKzCxBI0MTPYS044hHEXD3xhYNiZ/b7dYehILzjfYVpw/xoJJNyaiJg0EQpUGfcKqZ9pyhIJbHFs5SeMfjVZ44XLh0iFNFQ28Tvm2GPRLnSeQQlfvxC9YINZky9xxgrPUtf/7UHnVR4ExTGi2psHDpmePDWvfx8XBIor3gAAAABJRU5ErkJggg==')"

const iconBlur =
  "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAA70lEQVQ4jaWTMU4DMRBF3yBvxynS5AxIFCBBgYQouIO90kK4AjkDIVvMbkdNhwCJggYJrkCTI6SitDQ0WwU7XpQvufEfzzzNjGFHSeoyhHAPTEe8/3YZ4wpYDSenCXCSSwDwoKrznBlCmAO3ewXEopIEZrYws9eh0sLMplVVXbZt+7MZmyTouu6m7/uvIdmbiBzHGF+aptn/QzCy42vgMMb4BBwVCf4jp6rX2wK89xci8gh8OOfON/0kgff+rq7rAwAROTWzd+fcWaqJySmIyMzM1sCnqs62Ee7cg9xfMMat8iS3ykvKo10BzyXCon4Bst5MTSd6lpEAAAAASUVORK5CYII=')"

function addButton(input: HTMLInputElement) {
  let isFocus = false

  setTimeout(() => {
    input.style.backgroundImage = iconBlur
    input.style.backgroundRepeat = 'no-repeat'
    input.style.backgroundAttachment = 'scroll'
    input.style.backgroundSize = '16px 18px'
    input.style.backgroundPosition = '98% 50%'
    input.style.cursor = 'auto'
  })

  const clickHandler = async () => {
    const controller = new AbortController()

    const credential = await startBackgroundTask(Task.Login, login, {
      signal: controller.signal,
      reporter,
    })

    const loginFields: NodeListOf<HTMLInputElement> =
      document.querySelectorAll('[data-autofill-prototype-input=login]') ??
      undefined

    const passwordFields: NodeListOf<HTMLInputElement> =
      document.querySelectorAll('[data-autofill-prototype-input=password]') ??
      undefined

    for (const field of loginFields) {
      field.value = credential.login
      field.focus()
    }

    for (const field of passwordFields) {
      field.value = credential.password
      field.focus()
    }

    input.focus()
  }

  const focusButton = () => {
    isFocus = true
    input.style.backgroundImage = iconFocus
    input.style.cursor = 'pointer'
    input.addEventListener('click', clickHandler)
  }

  const blurButton = () => {
    input.style.backgroundImage = iconBlur
    input.style.cursor = 'auto'
    input.removeEventListener('click', clickHandler)
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

// A reporter to get the status of the task
const reporter = (report: Report) => {
  console.log(report)
}

const login: ForegroundTask<typeof loginTask> = async function* () {
  // Suspend the task until the front sends the first request
  yield

  yield getHostname()
}

const getHostname = () => {
  const array = window.location.hostname.split('.')
  return array[array.length - 2]
}
