/* eslint-disable unicorn/filename-case */
/* eslint-disable camelcase */
import { storage } from './storage'

const SETTINGS_PREFIX = 'settings-'
const KEY_VERSION = SETTINGS_PREFIX + 'version'
const KEY_FAVORITE = SETTINGS_PREFIX + 'favorite'
const KEY_LOCAL_DB = SETTINGS_PREFIX + 'localDB'
const KEY_DECRYPT_MODE = SETTINGS_PREFIX + 'decrypt_mode'
const KEY_ENCRYPT_MODE = SETTINGS_PREFIX + 'encrypt_mode'
const KEY_DEFAULT_TAB = SETTINGS_PREFIX + 'defaultTab'

const defaultOptions = {
  version: 0,
  localDB: false,
  // eslint-disable-next-line unicorn/no-null
  favorite: null,
  decrypt_mode: 0,
  encrypt_mode: 1,
  defaultTab: 0,
}

// eslint-disable-next-line unicorn/no-static-only-class
export class Settings {
  static queue: Promise<unknown>

  static async init(): Promise<void> {
    const version = await get(KEY_VERSION)
    if (version === 0) {
      set(KEY_VERSION, 1)
    }
  }

  static async getDecryptMode(): Promise<number> {
    return get(KEY_DECRYPT_MODE)
  }

  static async setDecryptMode(mode: number): Promise<void> {
    return set(KEY_DECRYPT_MODE, mode)
  }

  static async getEncryptMode(): Promise<number> {
    return get(KEY_ENCRYPT_MODE)
  }

  static async setEncryptMode(mode: number): Promise<void> {
    return set(KEY_ENCRYPT_MODE, mode)
  }

  static async getFavorite(): Promise<string> {
    return get(KEY_FAVORITE)
  }

  static async setFavorite(name: string): Promise<void> {
    return set(KEY_FAVORITE, name)
  }

  static async getDefaultTab(): Promise<number> {
    return get(KEY_DEFAULT_TAB)
  }

  static async setDefaultTab(id: number): Promise<void> {
    return set(KEY_DEFAULT_TAB, id)
  }

  static async isLocalDB(): Promise<boolean> {
    return get(KEY_LOCAL_DB)
  }
}

async function get(key: string) {
  return storage()
    .get(key)
    .then((value) => {
      if (value[key] === undefined) {
        return defaultOptions[
          key.replace(SETTINGS_PREFIX, '') as keyof typeof defaultOptions
        ]
      }

      return value[key]
    })
}

async function set(key: string, value: unknown) {
  return storage().set({ [key]: value })
}
