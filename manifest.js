/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable camelcase */
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'

const webmails = JSON.parse(readFileSync('./webmails.json'))

// List of content script running on each webmail supported
const contentScriptWebmail = Object.entries(webmails).map(([key, matches]) => ({
  matches,
  all_frames: true,
  js: [`content-script-${key}.js`],
}))
const contentScript = [
  ...contentScriptWebmail,
  {
    matches: ['<all_urls>'],
    js: ['content-script-autofill.js'],
    all_frames: true,
    run_at: 'document_end',
  },
]

/** A dynamically generated manifest, to keep the version number consistent. */
export const manifest = {
  manifest_version: 2,
  name: 'EviCypher Webmail Encryption',
  description:
    "Contactless encryption of instant messaging, email and social networks via Freemindtronic's EviCypher NFC device technology",
  // The extension version is the same as the package.json version
  version: process.env.npm_package_version,
  icons: {
    48: '~/assets/favicon.png',
  },
  permissions: ['storage', 'nativeMessaging'],
  background: {
    scripts: ['~/src/background/main.ts'],
    persistent: true,
  },
  browser_action: {
    default_popup: 'popup.html',
  },
  content_scripts: contentScript,
  browser_specific_settings: {
    gecko: {
      id: 'evicypher-webmail@freemindtronic.com',
    },
  },
  web_accessible_resources: ['loading.gif', 'locales/*/strings.json'],
}

/** Writes `manifest` to `build/manifest.json`. */
export const writeManifest = () => {
  writeFileSync('./build/manifest.json', JSON.stringify(manifest, undefined, 2))
  console.log('\u001B[32m%s\u001B[0m', `created build/manifest.json`)
}

/** Patches `extension/manifest.json`. */
export const patchManifest = () => {
  const patchedManifest = JSON.parse(readFileSync('./extension/manifest.json'))
  patchedManifest.web_accessible_resources = manifest.web_accessible_resources
  writeFileSync(
    './extension/manifest.json',
    JSON.stringify(patchedManifest, undefined, 2)
  )
  console.log('\u001B[32m%s\u001B[0m', `patched extension/manifest.json`)
}

// Save the manifest if the file is run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === '--patch') patchManifest()
  else writeManifest()
}
