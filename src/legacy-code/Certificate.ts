/* eslint-disable unicorn/filename-case */
import Base64 from 'base64-arraybuffer'
import type { Storage } from 'webextension-polyfill-ts'

import { Settings } from './Settings'
import * as utils from './utils'

const CERT_PREFIX = 'device-'

interface CertData {
  name: string
  id: Uint8Array
  jamming: Uint8Array
  fKey: Uint8Array
  sKey: Uint8Array
  tKey: Uint8Array
}

interface CertDataB64 {
  name: string
  id: string
  jamming: string
  fKey: string
  sKey: string
  tKey: string
}

export class Certificate {
  name: string
  id: Uint8Array
  jamming: Uint8Array
  fKey: Uint8Array
  sKey: Uint8Array
  tKey: Uint8Array

  /** Where to store certificates. */
  storage: Storage.StorageArea

  constructor(data: CertData, storage: Storage.StorageArea) {
    this.name = data.name
    this.id = data.id
    this.jamming = data.jamming
    this.fKey = data.fKey
    this.sKey = data.sKey
    this.tKey = data.tKey
    this.storage = storage
  }

  async saveNew(): Promise<unknown> {
    const promiseDevice = this.update()

    const promiseList = Certificate.listAll(this.storage).then(async (list) => {
      let pFav
      if (list.length === 0) {
        pFav = Settings.setFavorite(this.name)
      }

      list.push(this.name)
      list.sort()
      return Promise.all([pFav, this.storage.set({ devices: list })])
    })

    return Promise.all([promiseDevice, promiseList])
  }

  async update(): Promise<void> {
    return this.storage.set({ [CERT_PREFIX + this.name]: certToB64(this) })
  }

  static async load(
    name: string,
    storage: Storage.StorageArea
  ): Promise<Certificate> {
    const key = CERT_PREFIX + name
    return storage
      .get(key)
      .then((result) => new Certificate(b64ToCert(result[key]), storage))
  }

  static async listAll(storage: Storage.StorageArea): Promise<string[]> {
    return storage
      .get('devices')
      .then((val) => (val.devices === undefined ? [] : val.devices))
  }

  static async remove(
    device: string,
    storage: Storage.StorageArea
  ): Promise<unknown> {
    const pDevice = storage.remove(CERT_PREFIX + device)
    const pList = Certificate.listAll(storage).then((list) => {
      const index = list.indexOf(device)
      if (index > -1) {
        list.splice(index, 1)
        return storage.set({ devices: list })
      }
    })
    return Promise.all([pDevice, pList])
  }

  static async removeMultiple(
    devices: string[],
    storage: Storage.StorageArea
  ): Promise<unknown> {
    const pDevices = []
    for (const device of devices) {
      pDevices.push(storage.remove(CERT_PREFIX + device))
    }

    const pList = Certificate.listAll(storage).then((list) => {
      for (const device of devices) {
        const index = list.indexOf(device)
        if (index > -1) {
          list.splice(index, 1)
        }
      }

      return storage.set({ devices: list })
    })
    return Promise.all([...pDevices, pList])
  }

  static generate(storage: Storage.StorageArea): Certificate {
    const data = {
      name: '',
      id: utils.random(16),
      jamming: utils.random(16),
      fKey: utils.random(16),
      sKey: utils.random(16),
      tKey: utils.random(16),
    }
    return new Certificate(data, storage)
  }
}

function certToB64(data: Certificate) {
  return {
    name: data.name,
    id: Base64.encode(data.id),
    jamming: Base64.encode(data.jamming),
    fKey: Base64.encode(data.fKey),
    sKey: Base64.encode(data.sKey),
    tKey: Base64.encode(data.tKey),
  }
}

function b64ToCert(data: CertDataB64): CertData {
  return {
    name: data.name,
    id: utils.b64ToUint8Array(data.id),
    jamming: utils.b64ToUint8Array(data.jamming),
    fKey: utils.b64ToUint8Array(data.fKey),
    sKey: utils.b64ToUint8Array(data.sKey),
    tKey: utils.b64ToUint8Array(data.tKey),
  }
}
