/* eslint-disable unicorn/filename-case */
/* eslint-disable camelcase */
import * as Base64 from 'base64-arraybuffer'
import axlsign from 'axlsign'

import * as lanUtil from './lanUtils'
import * as utils from './utils'
import { AesUtil, removeJamming } from './AesUtil'
import { Certificate } from './Certificate'
import type { Phone } from 'phones'

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
  ECC1: Uint8Array
  ECC2: Uint8Array
  ECC3: Uint8Array
  URL: string
}

export class Client {
  keysExchange: KeysExchange | undefined
  stopClient: boolean
  phone: Phone

  constructor(phone: Phone) {
    this.phone = phone
    this.stopClient = false
  }

  requestKey(keyToGet?: Uint8Array): Promise<{
    high: Uint8Array
    low: Uint8Array
  }> {
    const exchange = {
      name: this.phone.name,
      type: '/CK',
      link: keyToGet,
    }

    return this.getInformation(exchange)
  }

  async getInformation(exchange: Exchange): Promise<{
    high: Uint8Array
    low: Uint8Array
  }> {
    return this.sendRequest(exchange, this.phone.certificate)
  }

  async sendRequest(
    exchange: Exchange,
    certificate: Certificate
  ): Promise<{
    high: Uint8Array
    low: Uint8Array
  }> {
    const answer = await lanUtil.search(Base64.encode(certificate.id), '/P')
    const data = utils.b64ToObject(answer.data as Record<string, string>)
    const crypt: Crypt = {
      KEY: certificate,
      ECC1: AES.decryptCTR(data.iv1, data.sa1, certificate.tKey, data.k1),
      ECC2: AES.decryptCTR(data.iv2, data.sa2, certificate.tKey, data.k2),
      ECC3: AES.decryptCTR(data.iv3, data.sa3, certificate.tKey, data.k3),
      URL: answer.origin,
    }

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

    for (const [sk, ecc] of [
      ['SK1', 'ECC1'],
      ['SK2', 'ECC2'],
      ['SK3', 'ECC3'],
    ] as ['SK1' | 'SK2' | 'SK3', 'ECC1' | 'ECC2' | 'ECC3'][]) {
      const k = axlsign.generateKeyPair(utils.random(32))
      keysExchange[sk] = axlsign.sharedKey(k.private, crypt[ecc] as Uint8Array)
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

    const answer = await lanUtil.sendCipher(exchange.type, crypt.URL, data)
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

  /**
   * Conclude the key exchange process and ask the device for the certificate to
   * use for the next exchange.
   *
   * @privateRemarks
   *   There are many design flaws in the protocol, and here is one more: the
   *   browser extension may never receive the new certificate if the connection
   *   is broken before receiving the new key. This leads to this annoying "303
   *   See Other" you will probably see more than once.
   */
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

    const data = await lanUtil.sendEnd(crypt.URL, utils.objectToB64(dataToSend))
    const newKey = utils.b64ToObject(data)
    const newId = axlsign.sharedKey(newShare.k4.private, newKey.k4)

    await lanUtil.sendOk(crypt.URL, Base64.encode(newId))

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
    const newCertificate = {
      name: crypt.KEY.name,
      fKey: nFkey,
      sKey: nSkey,
      tKey: nTkey,
      id: nId,
      jamming: nJam,
    }
    this.phone.certificate = new Certificate(newCertificate)
  }
}
