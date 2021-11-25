/* eslint-disable complexity */
/* eslint-disable sonarjs/cognitive-complexity */

/**
 * Linkedin functions for content scripts.
 *
 * @module
 * @see {@link Linkedin}
 */

import type { Report } from '$/report'
import { debug } from 'debug'
import { convert } from 'html-to-text'
import { get } from 'svelte/store'
import tippy from 'tippy.js'
import { _ } from '$/i18n'
import { ErrorMessage, ExtensionError } from '~src/error'
import { isOpenpgpEnabled } from '~src/options'
import EncryptButton from './EncryptButton.svelte'
import { Design } from './design'
import { Mail } from './mail'
import { Webmail, FLAG, Selectors } from './webmail'

/** HTMLElements from all the parts of a certain window */
export interface MailElements {
  toolbar?: HTMLElement | null
  editor?: HTMLElement | null
  editorContent?: HTMLElement | null
  send?: HTMLElement | null
}

/**
 * Linkedin has two different window editors that can pop up at the same time,
 * so we always have to keep track of the elements that corresponds to each
 * window editor, to handle the double editor, every time we call the
 * {@link handleToolbar} we send the entire interface of each window editors so
 * every one knows where its elements are and don't interfere with the other
 * window editor
 */
export class Linkedin extends Webmail {
  /**
   * Handles mutations observed by the `MutationObserver` below, i.e.
   * notifications of elements added or removed from the page.
   */
  protected handleMutations = (): void => {
    const mails = document.body.querySelectorAll<HTMLElement>(
      this.selectors.mail
    )
    for (const mail of mails) this.handleMailElement(mail)

    // First window of linkedin editor
    const firstWindow = document.querySelector(
      '.scaffold-layout__list-detail-inner'
    )
    // Second window of linkedin editor
    const secondWindow = document.querySelector(
      '.msg-convo-wrapper.msg-overlay-conversation-bubble'
    )

    if (!firstWindow && !secondWindow) return

    /** Create a new MailElement */
    const mailElement: MailElements = {}

    /** If both windows are shown */
    if (firstWindow && secondWindow) {
      /**
       * Array of Elements to iterate over all elements for both windows editors
       * in linkedin
       */
      const windows: Element[] = [firstWindow, secondWindow]

      /**
       * I loop for every window editor and then call the handleToolbarLinkedin
       * so inside the function know that a certain editor belongs in the window
       * and not from the other one, so when you click in encrypt he knows that
       * he has to put the content encrypted in the editorContent of his window.
       */
      for (const window of windows) {
        /**
         * Because both windows has the same class I can do a querySelector to
         * obtain the toolbar, ... from the certain window and the call the
         * handleToolbarLinkedin function
         */
        mailElement.toolbar = window.querySelector<HTMLElement>(
          this.selectors.toolbar
        )
        mailElement.editor = window.querySelector<HTMLElement>(
          this.selectors.editor
        )
        mailElement.editorContent = window.querySelector<HTMLElement>(
          this.selectors.editorContent
        )
        mailElement.send = window.querySelector<HTMLElement>(
          this.selectors.send
        )
        this.handleToolbarLinkedin(mailElement)
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
      this.handleToolbarLinkedin(mailElement)
    }
  }

  /** Adds an encryption button in the toolbar. */
  protected handleToolbarLinkedin = (mailElements: MailElements): void => {
    if (mailElements.toolbar === null || mailElements.toolbar === undefined)
      return

    const node = mailElements.toolbar.firstElementChild?.children[3]

    if (
      !mailElements.editor ||
      !mailElements.editorContent ||
      !mailElements.send ||
      !node
    )
      return

    const mail = new Mail(mailElements.editorContent)

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

        if (mail.getContent() === '<p>&nbsp;<br></p>')
          throw new ExtensionError(ErrorMessage.MailContentUndefined)

        button.$set({ report: undefined })
        let mailContent = mail.getContent()

        if (!get(isOpenpgpEnabled))
          mailContent = convert(mailContent, { wordwrap: 130 })

        // Encrypt and replace
        let encryptedString = await this.encryptString(
          // Use innerHTML instead of textContent to support rich text
          mailContent,
          (report: Report) => {
            button.$set({ report })
          },
          signal
        )

        encryptedString += '\r'

        // For some reason linkedin messages needs to be in the following format to be able to detect
        // injected text like our encrypted string
        // <p> message <br></p>
        mail.selector.innerHTML = ''
        const p = document.createElement('p')
        const br = document.createElement('br')
        p.append(encryptedString)
        p.append(br)
        mail.selector.append(p)

        const event = new InputEvent('input', { bubbles: true })
        mail.selector.dispatchEvent(event)

        tooltip.destroy()
      }
    )
  }

  /** Adds a button to a given element to decrypt all encrypted parts found. */
  protected handleMailElement = (mailElement: HTMLElement): void => {
    // Mark the element
    if (FLAG in mailElement.dataset) return
    mailElement.dataset[FLAG] = '1'

    // If it's not an encrypted mail, ignore it
    if (mailElement === null) return

    const mailString = mailElement?.querySelector(
      '.msg-s-event-listitem__body'
    )?.textContent

    if (!mailString || !this.containsEncryptedText(mailString)) return

    // Find all encrypted parts
    const treeWalker = document.createTreeWalker(
      mailElement,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (textNode: Text) =>
          this.isEncryptedText(textNode.data)
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_SKIP,
      }
    )

    let node: Node | null
    while ((node = treeWalker.nextNode())) {
      // Add a "Decrypt" button next to the node
      if (!node.parentNode?.textContent) continue
      const encryptedString = this.extractEncryptedString(
        node.parentNode.textContent
      )

      const workspace = this.initInjectionTarget(node as Text)
      this.addDecryptButton(workspace, encryptedString)
      this.addQRDecryptButton(workspace, encryptedString)
    }
  }
}

/** Selectors for interesting HTML Elements of Linkedin. */
/** Both windows from linkedin shares the same class selectors */
const selectors: Selectors = {
  mail: '.msg-s-event__content',
  toolbar: '.msg-form__footer',
  editor: '.msg-form',
  editorContent: '.msg-form__contenteditable',
  send: '.msg-form__send-button',
}

// Enable logging in the page console (not the extension console)
if (process.env.NODE_ENV !== 'production') debug.enable('*')

setTimeout(() => {
  const webmail = new Linkedin(selectors, Design.Linkedin)
  webmail.observe()
}, 2000)
