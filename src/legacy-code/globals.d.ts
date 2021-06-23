import type { Browser } from 'webextension-polyfill-ts'

type Port = Browser.runtime.Port
type ComposeDetails = Browser.compose.ComposeDetails
type Tab = Browser.tabs.Tab
type MessagingOrigin = 'from-injector' | 'from-message' | 'from-compositor'

interface MyPort extends Browser.runtime.Port {
  status: string
}

interface MessageDisplay {
  action: string
  data: string
  error?: string
}

interface MessageComposerPing {
  answer: boolean
}

interface MessageComposerPong {
  cancel: boolean
  details?: ComposeDetails
}

interface MessagingAction {
  tabId: number
  action: string
}

interface MessagingMessageToBack {
  tabId: number
  cancel: boolean
  decrypt?: boolean
}

interface MessagingMessageToFront {
  tabId: number
  isDecrypted?: boolean
}

type MessagingInject =
  | MessagingInjectDecrypt
  | MessagingInjectStartDecrypt
  | MessagingInjectOriginal
  | MessagingInjectLoading
  | MessagingInjectState
  | MessagingError

interface MessagingInjectStartDecrypt {
  action: 'startDecrypt'
}

interface MessagingInjectDecrypt {
  action: 'decrypt'
  data: string
}

interface MessagingError {
  action: 'error'
  error: string
}

interface MessagingInjectOriginal {
  action: 'original'
}

interface MessagingInjectLoading {
  action: 'loading'
}

interface MessagingInjectState {
  action: 'getState'
}
