import { browser } from "webextension-polyfill-ts";

browser.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === "install") {
    console.log("Hello");
  }
});
