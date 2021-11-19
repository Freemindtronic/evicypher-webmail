/* eslint-disable complexity */
/* eslint-disable sonarjs/cognitive-complexity */

/**
 * Yandex functions for content scripts.
 *
 * @module
 * @see {@link Yandex}
 */

import type { Report } from '$/report'
import { debug } from 'debug'
import tippy from 'tippy.js'
import { _ } from '$/i18n'
import { ErrorMessage, ExtensionError } from '~src/error'
import EncryptButton from './EncryptButton.svelte'
import { Design } from './design'
import { Webmail, FLAG, Selectors } from './webmail'

/** HTMLElements from all the parts of a certain window */
export interface MailElements {
  toolbar?: HTMLElement | null
  editor?: HTMLElement | null
  editorContent?: HTMLElement | null
  send?: HTMLElement | null
}

/**
 * Yandex has two different window editors that can pop up at the same time, one
 * is from the response of a mail, and the other one is from the one that
 * appears when you want to create a new mail, so we always have to keep track
 * of the elements that corresponds to each window editor, to handle the double
 * editor, every time we call the {@link handleToolbar} we send the entire
 * interface of each window editors so every one knows where its elements are
 * and don't interfere with the other window editor
 */

export class Yandex extends Webmail {
  /**
   * Handles mutations observed by the `MutationObserver` below, i.e.
   * notifications of elements added or removed from the page.
   */
  protected handleMutations = (): void => {
    const mails = document.body.querySelectorAll<HTMLElement>(
      this.selectors.mail
    )
    for (const mail of mails) this.handleMailElement(mail)

    // First window of yandex editor
    const firstWindow = document.querySelector(
      '.ns-view-quick-reply-form-wrap.mail-QuickReply-FormWrap'
    )
    // Second window of yandex editor
    const secondWindow = document.querySelector('.ComposePopup-Content')

    if (!firstWindow && !secondWindow) return

    /** Create a new MailElement */
    const mailElement: MailElements = {}

    /** If both windows are shown */
    if (firstWindow && secondWindow) {
      /** Array of Elements to iterate over all elements for both windows editors in Yandex */
      const windows: Element[] = [firstWindow, secondWindow]

      for (const window_ of windows) {
        mailElement.toolbar = window_.querySelector<HTMLElement>(
          this.selectors.toolbar
        )
        console.log('mailElement.toolbar:', mailElement.toolbar)
        mailElement.editor = window_.querySelector<HTMLElement>(
          this.selectors.editor
        )
        console.log('mailElement.editor:', mailElement.editor)
        mailElement.editorContent = window_.querySelector<HTMLElement>(
          this.selectors.editorContent
        )
        console.log('mailElement.editorContent:', mailElement.editorContent)
        mailElement.send = window_.querySelector<HTMLElement>(
          this.selectors.send
        )
        console.log('mailElement.send:', mailElement.send)
        this.handleToolbarYandex(mailElement)
      }
    } else {
      /**
       * If only one of both the windows are shown generalWindow variable will
       * be the only active window, and then do the same as above, assign all
       * the elements from the Selectors and the call the function
       */
      let generalWindow: Element | undefined | null
      if (firstWindow) generalWindow = firstWindow
      else if (secondWindow) generalWindow = secondWindow

      mailElement.toolbar = generalWindow?.querySelector<HTMLElement>(
        this.selectors.toolbar
      )
      mailElement.editor = generalWindow?.querySelector<HTMLElement>(
        this.selectors.editor
      )
      mailElement.editorContent = generalWindow?.querySelector<HTMLElement>(
        this.selectors.editorContent
      )
      mailElement.send = generalWindow?.querySelector<HTMLElement>(
        this.selectors.send
      )
      this.handleToolbarYandex(mailElement)
    }
  }

  /** Adds an encryption button in the toolbar. */
  protected handleToolbarYandex = (mailElements: MailElements): void => {
    if (mailElements.toolbar === null || mailElements.toolbar === undefined)
      return

    const node = mailElements.toolbar.firstElementChild

    if (
      !mailElements.editor ||
      !mailElements.editorContent ||
      !mailElements.send ||
      !node
    )
      return

    if (FLAG in mailElements.toolbar.dataset) return
    mailElements.toolbar.dataset[FLAG] = '1'

    const target = document.createElement('span')
    target.id = 'EncryptButton'
    target.style.display = 'contents'
    const { design } = this
    const button = new EncryptButton({
      target,
      props: { design },
    })
    node.after(target)

    const tooltip = tippy(mailElements.send, {
      theme: 'light-border',
    })
    _.subscribe(($_) => {
      tooltip.setContent($_('this-mail-is-not-encrypted'))
    })

    this.addClickListener(
      button,
      async (promise, resolved, rejected, signal) => {
        if (promise && !resolved && !rejected) return promise
        if (mailElements.editorContent === undefined) return
        if (mailElements.editorContent?.textContent === '')
          throw new ExtensionError(ErrorMessage.MailContentUndefined)

        button.$set({ report: undefined })
        if (mailElements.editorContent === null) return
        // Encrypt and replace
        let encryptedString = await this.encryptString(
          // Use innerHTML instead of textContent to support rich text
          mailElements.editorContent.innerHTML,
          (report: Report) => {
            button.$set({ report })
          },
          signal
        )

        encryptedString += '\r'

        mailElements.editorContent.innerHTML = ''
        // For some reason yandex messages needs to be in the following format to be able to detect
        // injected text like our encrypted string
        // part message 1<br>
        // part message 2<br> etc...
        let position: number
        let aux = encryptedString
        const pre = document.createElement('pre')
        /**
         * The way I do it it always remains one \n at the end to the final
         * length is going to be 1
         */
        while (encryptedString.length !== 1) {
          position = encryptedString.indexOf('\n')
          aux = encryptedString.slice(0, position)
          encryptedString = encryptedString.slice(
            position + 1,
            encryptedString.length
          )

          const br = document.createElement('br')
          pre.append(aux)
          pre.append(br)
        }

        mailElements.editorContent.append(pre)
        const event = new InputEvent('input', { bubbles: true })
        mailElements.editorContent.dispatchEvent(event)

        tooltip.destroy()
      }
    )
  }
}

/** Selectors for interesting HTML Elements of Yandex. */
/** Both windows from yandex shares the same class selectors */
const selectors: Selectors = {
  /** The mail selectors */
  mail: '.js-message-body-content.mail-Message-Body-Content',
  /**
   * First selector is from the window of the new mail and second selector is
   * from the second window
   */
  toolbar:
    'div.ComposeControlPanel-Part:nth-child(1), .mail-Compose-Field-Actions_left',
  /** For editor and editorContent both window editors share the same selectors */
  editor: '.cke_inner.cke_reset',
  editorContent: '.cke_editable.cke_editable_themed',
  /**
   * First selector is from the window of the new mail and second selector is
   * from the second window
   */
  send: '.ComposeControlPanel-SendButton, .mail-Compose-From-SendButton',
}

// Enable logging in the page console (not the extension console)
if (process.env.NODE_ENV !== 'production') debug.enable('*')

setTimeout(() => {
  const webmail = new Yandex(selectors, Design.Yandex)
  webmail.observe()
}, 2000)
