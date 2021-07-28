/* eslint-disable camelcase */
import { writeFileSync } from 'fs'

/** A dynamically generated manifest, to keep the version number consistent. */
const manifest = {
  manifest_version: 2,
  name: 'EviCypher Webmail',
  version: process.env.npm_package_version,
  permissions: ['storage', 'nativeMessaging'],
  background: {
    scripts: ['build/background.js'],
    persistent: true,
  },
  browser_action: {
    default_popup: 'popup.html',
  },
  content_scripts: [
    {
      matches: ['https://mail.google.com/mail/*'],
      js: ['build/content-script-gmail.js'],
    },
  ],
  browser_specific_settings: {
    gecko: {
      id: 'evicypher-webmail@freemindtronic.com',
    },
  },
  web_accessible_resources: ['loading.gif', 'blank.html'],
}

// Save the manifest
writeFileSync(
  './extension/manifest.json',
  JSON.stringify(manifest, undefined, 2)
)