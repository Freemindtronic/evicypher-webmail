/// <reference types="cypress" />

const path = require('path')

/** @type {Cypress.PluginConfig} */
module.exports = (on, config) => {
  // Load the extension on browser launch
  on('before:browser:launch', (browser, launchOptions) => {
    launchOptions.extensions.push(path.join(__dirname, '..', '..', 'extension'))
    return launchOptions
  })
}
