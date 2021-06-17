import { browser } from 'webextension-polyfill-ts'

const key = 'color'
browser.storage.local.get(key).then((data) => {
  document.body.style.backgroundColor = data[key] as string
})
