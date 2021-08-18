/* eslint-disable camelcase */
// Run `yarn tsc manifest.js --declaration --allowJs` to update this file.
export function manifest(production?: boolean): {
  manifest_version: number
  name: string
  version: string
  icons: {
    48: string
    96: string
  }
  permissions: string[]
  background: {
    scripts: string[]
    persistent: boolean
  }
  browser_action: {
    default_popup: string
  }
  content_scripts: Array<{
    matches: string[]
    js: string[]
  }>
  browser_specific_settings: {
    gecko: {
      id: string
    }
  }
  web_accessible_resources: string[]
}
export function writeManifest(): void
