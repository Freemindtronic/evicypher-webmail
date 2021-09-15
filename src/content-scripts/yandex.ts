/* eslint-disable sonarjs/cognitive-complexity */
/**
 * Yandex content script.
 *
 * @module
 */

import type { Report } from '$/report'
import { debug } from 'debug'
import tippy from 'tippy.js'
import { ErrorMessage, ExtensionError } from '$/error'
import { _ } from '$/i18n'
import EncryptButton from './EncryptButton.svelte'
import {
  addClickListener,
  encryptButtonSibling,
  encryptString,
  FLAG,
  handleMailElement,
  Options,
  Selectors,
} from './common'
import { Design } from './design'

/** Adds an encryption button in the toolbar. */
// eslint-disable-next-line complexity
const handleToolbar = (
  toolbar: HTMLElement,
  { selectors, design }: Options
) => {
  const editor = toolbar.closest(selectors.editor)
  const contentEditable = editor?.querySelectorAll(selectors.editorContent)
  if (!contentEditable) return

  const mail =
    contentEditable.length > 1
      ? contentEditable.length === 6
        ? contentEditable.item(4)
        : contentEditable.item(6)
      : contentEditable.item(0)

  const sendButton = editor?.querySelector(selectors.send)
  const node = encryptButtonSibling(selectors, toolbar, editor)

  console.log('editor', editor)
  console.log('contentEditable', contentEditable)
  console.log('mail', mail)
  console.log('sendButton', sendButton)

  if (!editor || !mail || !sendButton || !node) return

  if (FLAG in toolbar.dataset) return
  toolbar.dataset[FLAG] = '1'

  const target = document.createElement('span')
  target.style.display = 'contents'
  const button = new EncryptButton({
    target,
    props: { design },
  })
  node.before(target)

  const tooltip = tippy(sendButton, {
    theme: 'light-border',
  })
  _.subscribe(($_) => {
    tooltip.setContent($_('this-mail-is-not-encrypted'))
  })

  addClickListener(button, async (promise, resolved, rejected, signal) => {
    if (promise && !resolved && !rejected) return promise

    if (!mail.textContent)
      throw new ExtensionError(ErrorMessage.MailContentUndefined)

    button.$set({ report: undefined })

    // Encrypt and replace
    return encryptString(
      // Use innerHTML instead of textContent to support rich text
      mail.innerHTML,
      (report: Report) => {
        button.$set({ report })
      },
      signal
    ).then((encryptedString) => {
      /** Events */
      const ke = new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        keyCode: 13,
      })

      const event = document.createEvent('Event')
      event.initEvent('input', true, true)

      // For example we have the following string -> "Hola que tal estas"
      // We want to change every space for an enter
      // to do this we want to make a loop that when it encounters
      // an space it has to focus or position the mouse on it and trigger the crfl (enter) event
      // and when all the string is done, we call the input event
      // to make the second panel notice the changes of the text we did.
      // mail.textContent = encryptedString.replaceAll(' ', '\u00A0')
      mail.textContent = encryptedString
      console.log(mail.textContent)
      mail.textContent.replaceAll('\n', '\r\n')
      let x = 0
      for (x; x < mail.textContent.length; x++) {
        /** Inputs */
        if (mail.textContent.charAt(x) === '\n') mail.dispatchEvent(ke)
      }

      mail.dispatchEvent(event)
      tooltip.destroy()
    })
  })
}

/**
 * Handles mutations observed by the `MutationObserver` below, i.e.
 * notifications of elements added or removed from the page.
 */
const handleMutations = (options: Options) => {
  // The user opens a mail
  const mails = document.body.querySelectorAll<HTMLElement>(
    options.selectors.mail
  )
  for (const mail of mails) handleMailElement(mail, options)

  // The user starts writing a mail
  const toolbars = document.body.querySelectorAll<HTMLElement>(
    options.selectors.toolbar
  )
  //
  // const editors = document.body.querySelectorAll<HTMLElement>(
  // options.selectors.editor
  // )
  //
  for (const toolbar of toolbars) handleToolbar(toolbar, options)
}

/** Observes the DOM for changes. Should work for most webmails. */
export const observe = (options: Options): void => {
  // Run the listener on page load
  handleMutations(options)
  // Start observing the DOM for changes
  new MutationObserver(() => {
    handleMutations(options)
  }).observe(document.body, {
    subtree: true,
    childList: true,
  })
}

/** Selectors for interesting HTML Elements of Yandex. */
const selectors: Selectors = {
  mail: '.js-message-body-content.mail-Message-Body-Content',
  toolbar:
    '.mail-Compose-Field-Actions_left, .ComposeControlPanel.ComposeControlPanel_desktop',
  // Selectors below are not used
  editor:
    '.ns-view-quick-reply.js-form.js-pastefile-compose, .composeReact__inner',
  editorContent: '[contenteditable]',
  send: '.ui-button-text, .new__root--3qgLa.ComposeControlPanel-Button.ComposeControlPanel-Button_new.ComposeControlPanel-SendButton.ComposeSendButton.ComposeSendButton_desktop',
  encryptButtonSibling:
    '.ns-view-compose-send-link.mail-Compose-From-SendButton.nb-with-xs-right-gap, .new__root--3qgLa.ComposeControlPanel-Button.ComposeControlPanel-Button_new.ComposeControlPanel-SendButton.ComposeSendButton.ComposeSendButton_desktop',
}

// Enable logging in the page console (not the extension console)
if (process.env.NODE_ENV !== 'production') debug.enable('*')

observe({ selectors, design: Design.Yandex })
