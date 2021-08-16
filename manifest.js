/* eslint-disable camelcase */
import { writeFileSync } from 'fs'
import { fileURLToPath } from 'url'

/** A dynamically generated manifest, to keep the version number consistent. */
export const manifest = {
  manifest_version: 2,
  name: 'EviCypher Webmail',
  // The extension version is the same as the package.json version
  version: process.env.npm_package_version,
  icons: {
    48: '~/assets/favicon.png',
    96: '~/assets/icon.svg',
  },
  permissions: ['storage', 'nativeMessaging'],
  background: {
    scripts: ['~/src/background/main.ts'],
    persistent: true,
  },
  browser_action: {
    default_popup: 'popup.html',
  },
  content_scripts: [
    {
      matches: ['https://mail.google.com/mail/*'],
      js: ['content-script-gmail.js'],
    },
    {
      matches: ['https://outlook.live.com/mail/*'],
      js: ['content-script-outlook.js'],
    },
  ],
  browser_specific_settings: {
    gecko: {
      id: 'evicypher-webmail@freemindtronic.com',
    },
  },
  web_accessible_resources: ['loading.gif', 'blank.html'],
}

/** Writes `manifest` to `extension/manifest.json`. */
export const writeManifest = () => {
  writeFileSync('./build/manifest.json', JSON.stringify(manifest, undefined, 2))
  console.log('\u001B[32m%s\u001B[0m', 'created build/manifest.json')
}

// Save the manifest if the file is run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) writeManifest()
