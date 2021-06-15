import { browser } from "webextension-polyfill-ts";

const key = "background";
browser.storage.local.get(key).then((data) => {
  document.body.style.background = `url(${data[key]})`;
});
