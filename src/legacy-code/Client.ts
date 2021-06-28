/* eslint-disable unicorn/filename-case */
/* eslint-disable camelcase */
import * as Base64 from 'base64-arraybuffer'
import axlsign from 'axlsign'

import * as lanUtil from './lanUtils'
import * as utils from './utils'
import { AesUtil, removeJamming } from './AesUtil'
import { Certificate } from './Certificate'
import { browser, Storage } from 'webextension-polyfill-ts'

const AES = new AesUtil(256, 1000)

interface Exchange {
  name: string
  type: string
  link?: Uint8Array
}

interface KeysExchange {
  SK1: Uint8Array
  SK2: Uint8Array
  SK3: Uint8Array
}

interface Crypt {
  KEY: Certificate
  ECC1?: Uint8Array
  ECC2?: Uint8Array
  ECC3?: Uint8Array
  URL?: string
}

export class Client {
  keysExchange: KeysExchange | undefined
  stopClient: boolean
  storage: Storage.StorageArea

  constructor(storage: Storage.StorageArea) {
    this.stopClient = false
    this.storage = storage
  }

  requestKey(
    name: string,
    keyToGet?: Uint8Array
  ): Promise<{
    high: Uint8Array
    low: Uint8Array
  }> {
    const exchange = {
      name,
      type: '/CK',
      link: keyToGet,
    }

    return this.getInformation(exchange)
  }

  async getInformation(exchange: Exchange): Promise<{
    high: Uint8Array
    low: Uint8Array
  }> {
    const crypt = {
      KEY: await Certificate.load(exchange.name, this.storage),
      ECC1: undefined,
      ECC2: undefined,
      ECC3: undefined,
      URL: undefined,
    }
    return this.sendRequest(exchange, crypt)
  }

  async sendRequest(
    exchange: Exchange,
    crypt: Crypt
  ): Promise<{
    high: Uint8Array
    low: Uint8Array
  }> {
    const answer = await lanUtil.search(Base64.encode(crypt.KEY.id), '/P')
    const data = utils.b64ToObject(answer.data as Record<string, string>)
    crypt.ECC1 = AES.decryptCTR(data.iv1, data.sa1, crypt.KEY.tKey, data.k1)
    crypt.ECC2 = AES.decryptCTR(data.iv2, data.sa2, crypt.KEY.tKey, data.k2)
    crypt.ECC3 = AES.decryptCTR(data.iv3, data.sa3, crypt.KEY.tKey, data.k3)
    crypt.URL = answer.origin
    return this.sendKey(exchange, crypt)
  }

  async sendKey(
    exchange: Exchange,
    crypt: Crypt
  ): Promise<{
    high: Uint8Array
    low: Uint8Array
  }> {
    const keysExchange: {
      SK1: Uint8Array | undefined
      SK2: Uint8Array | undefined
      SK3: Uint8Array | undefined
    } = {
      SK1: undefined,
      SK2: undefined,
      SK3: undefined,
    }

    const ivList = []
    const saltList = []
    const encList = []
    const keysSK = ['SK1', 'SK2', 'SK3']
    const keysECC = ['ECC1', 'ECC2', 'ECC3']

    for (let i = 0; i < 3; i++) {
      const k = axlsign.generateKeyPair(utils.random(32))
      keysExchange[keysSK[i] as keyof KeysExchange] = axlsign.sharedKey(
        k.private,
        crypt[keysECC[i] as 'ECC1' | 'ECC2' | 'ECC3'] as Uint8Array
      )
      const iv = utils.random(16)
      const salt = utils.random(16)
      const enc = AES.encryptCTR(iv, salt, crypt.KEY.tKey, k.public)
      ivList.push(iv)
      saltList.push(salt)
      encList.push(enc)
    }

    this.keysExchange = keysExchange as KeysExchange

    const data: Record<string, string> = {
      i1: Base64.encode(ivList[0]),
      i2: Base64.encode(ivList[1]),
      i3: Base64.encode(ivList[2]),
      s1: Base64.encode(saltList[0]),
      s2: Base64.encode(saltList[1]),
      s3: Base64.encode(saltList[2]),
      d1: Base64.encode(encList[0]),
      d2: Base64.encode(encList[1]),
      d3: Base64.encode(encList[2]),
    }

    if (exchange.link !== undefined) {
      const ivd = utils.random(16)
      const saltd = utils.random(16)
      const keyd = utils.xor(this.keysExchange.SK2, crypt.KEY.sKey)
      const encd = AES.encryptCTR(ivd, saltd, keyd, exchange.link)
      data.ih = Base64.encode(ivd)
      data.sh = Base64.encode(saltd)
      data.dh = Base64.encode(encd)
    }

    const answer = await lanUtil.sendCipher(
      exchange.type,
      crypt.URL as string,
      data
    )
    const keys = this.getKey(crypt, answer)
    this.endAndUpdate(crypt)
    return keys
  }

  getKey(
    crypt: Crypt,
    data: Record<string, string>
  ): {
    high: Uint8Array
    low: Uint8Array
  } {
    const iv_low = utils.b64ToUint8Array(data.i2)
    const salt_low = utils.b64ToUint8Array(data.s2)
    const data_low_jam = utils.b64ToUint8Array(data.d2)

    const iv_high = utils.b64ToUint8Array(data.i)
    const salt_high = utils.b64ToUint8Array(data.s)
    const data_high_jam = utils.b64ToUint8Array(data.d)

    const key_high = utils.xor(
      this.keysExchange?.SK3 as Uint8Array,
      crypt.KEY.fKey
    )
    const key_low = utils.xor(
      this.keysExchange?.SK2 as Uint8Array,
      crypt.KEY.fKey
    )

    const { jamming } = crypt.KEY
    const jamming_low = utils.sha512(
      utils.concatUint8Array(jamming, this.keysExchange?.SK1 as Uint8Array)
    )
    const jamming_high = utils.sha512(
      utils.concatUint8Array(jamming, this.keysExchange?.SK2 as Uint8Array)
    )

    const position_jamming_low =
      jamming[1] ^ (this.keysExchange?.SK1[1] as number)
    const position_jamming_high =
      jamming[2] ^ (this.keysExchange?.SK1[2] as number)

    const jammingValueOnLength_low =
      // eslint-disable-next-line unicorn/consistent-destructuring
      (crypt.KEY.sKey[0] ^ (this.keysExchange?.SK1[3] as number)) &
      (jamming_low.length - 1)
    const jammingValueOnLength_high =
      // eslint-disable-next-line unicorn/consistent-destructuring
      (crypt.KEY.tKey[0] ^ (this.keysExchange?.SK1[4] as number)) &
      (jamming_high.length - 1)

    const shift_jamming_low =
      jamming[0] + ((this.keysExchange?.SK1[5] as number) << 8)
    const shift_jamming_high =
      jamming[1] + ((this.keysExchange?.SK1[6] as number) << 8)

    const unjam_low = removeJamming(
      jamming_low,
      data_low_jam,
      jammingValueOnLength_low,
      position_jamming_low,
      shift_jamming_low
    )

    const unjam_high = removeJamming(
      jamming_high,
      data_high_jam,
      jammingValueOnLength_high,
      position_jamming_high,
      shift_jamming_high
    )

    const low = AES.decryptCTR(iv_low, salt_low, key_low, unjam_low)
    const high = AES.decryptCTR(iv_high, salt_high, key_high, unjam_high)

    return { high, low }
  }

  async endAndUpdate(crypt: Crypt): Promise<void> {
    const newShare = {
      id: axlsign.generateKeyPair(utils.random(32)),
      k1: axlsign.generateKeyPair(utils.random(32)),
      k2: axlsign.generateKeyPair(utils.random(32)),
      k3: axlsign.generateKeyPair(utils.random(32)),
      k4: axlsign.generateKeyPair(utils.random(32)),
    }

    const dataToSend = {
      id: newShare.id.public,
      k1: newShare.k1.public,
      k2: newShare.k2.public,
      k3: newShare.k3.public,
      k4: newShare.k4.public,
    }

    return lanUtil
      .sendEnd(crypt.URL as string, utils.objectToB64(dataToSend))
      .then(async (data) => {
        const newKey = utils.b64ToObject(data)
        const newId = axlsign.sharedKey(newShare.k4.private, newKey.k4)
        return lanUtil
          .sendOk(crypt.URL as string, Base64.encode(newId))
          .then(() => {
            const SKid = axlsign.sharedKey(newShare.id.private, newKey.id)
            const SK1 = axlsign.sharedKey(newShare.k1.private, newKey.k1)
            const SK2 = axlsign.sharedKey(newShare.k2.private, newKey.k2)
            const SK3 = axlsign.sharedKey(newShare.k3.private, newKey.k3)
            const SK4 = axlsign.sharedKey(newShare.k4.private, newKey.k4)
            const nFkey = utils.xor(SK1, crypt.KEY.fKey)
            const nSkey = utils.xor(SK2, crypt.KEY.sKey)
            const nTkey = utils.xor(SK3, crypt.KEY.tKey)
            const nId = utils.xor(SKid, crypt.KEY.id)
            const nJam = utils.xor(SK4, crypt.KEY.jamming)
            const data = {
              name: crypt.KEY.name,
              fKey: nFkey,
              sKey: nSkey,
              tKey: nTkey,
              id: nId,
              jamming: nJam,
            }
            new Certificate(data, browser.storage.local).update()
          })
      })
  }
}
