import { Storage, browser } from 'webextension-polyfill-ts'

export function storage(): Storage.StorageArea {
  return browser.storage.local
}
