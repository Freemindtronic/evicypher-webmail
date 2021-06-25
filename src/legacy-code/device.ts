import { Certificate } from './Certificate'
import * as utils from './utils'
import { AesUtil } from './AesUtil'
import axlsign, { KeyPair } from 'axlsign'
import * as Base64 from 'base64-arraybuffer'
import {
  search,
  sendCipherADD,
  sendName,
  extractIP,
  WebAnswer,
} from './lanUtils'
import { browser } from 'webextension-polyfill-ts'

export class Device {
  certificate: Certificate | undefined
  port: number | undefined
  key: Uint8Array | undefined
  salt: Uint8Array | undefined
  AES: AesUtil | undefined
  IP: string | undefined
  Tkey: Uint8Array | undefined
  iv: Uint8Array | undefined
  k1: KeyPair | undefined
  stopPairing: boolean

  constructor() {
    this.stopPairing = false
  }

  async generatePairingKey(): Promise<string> {
    const myPORT = Math.floor(Math.random() * 61_000) + 1025
    const portA = utils.longToByteArray(myPORT)
    this.port = myPORT
    this.AES = new AesUtil(256, 1000)
    this.certificate = Certificate.generate(browser.storage.local)
    this.k1 = axlsign.generateKeyPair(utils.random(32))
    this.key = utils.random(16)
    this.iv = utils.random(16)
    this.salt = utils.random(16)
    this.Tkey = utils.sha256(utils.concatUint8Array(this.iv, this.salt))

    const enc = this.AES.encryptCTR(
      this.iv,
      this.salt,
      this.key,
      this.k1.public
    )

    const cA = new Uint8Array([
      ...this.certificate.id,
      ...portA,
      ...this.iv,
      ...this.certificate.sKey,
      ...this.key,
      ...enc,
    ])

    return Base64.encode(cA)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async clientHello(_ipRange?: string[]): Promise<void> {
    if (this.certificate === undefined) throw new Error('Certificate undefined')

    const hash = Base64.encode(utils.sha256(this.certificate.id))
    const answer = await search(hash, '/t', undefined, this.port, 0)
    this.IP = extractIP((answer as WebAnswer).url)
  }

  async clientKeyExchange(): Promise<{
    name: string
    UUID: string
    ECC: Uint8Array
  }> {
    if (
      this.AES === undefined ||
      this.certificate === undefined ||
      this.key === undefined ||
      this.salt === undefined ||
      this.IP === undefined ||
      this.port === undefined ||
      this.k1 === undefined ||
      this.Tkey === undefined
    )
      throw new Error('Certificate undefined')

    const ivS = utils.random(16)
    const enc = this.AES.encryptCTR(
      ivS,
      this.certificate.id,
      this.key,
      this.salt
    )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await sendCipherADD(
      this.IP,
      this.port,
      Base64.encode(ivS),
      Base64.encode(enc),
      Base64.encode(utils.sha256(utils.xor(this.certificate.id, this.salt)))
    )

    let iv = utils.b64ToUint8Array(data.ik)
    let salt = utils.xor(this.salt, utils.b64ToUint8Array(data.sk))
    let cipherText = utils.b64ToUint8Array(data.ek)
    const ECC = this.AES.decryptCTR(iv, salt, this.key, cipherText)
    const sharedKey = axlsign.sharedKey(this.k1.private, ECC)

    iv = utils.b64ToUint8Array(data.in)
    salt = utils.b64ToUint8Array(data.sn)
    cipherText = utils.b64ToUint8Array(data.n)
    const name = this.AES.decryptCTR(iv, salt, this.Tkey, cipherText)

    iv = utils.b64ToUint8Array(data.iu)
    salt = utils.b64ToUint8Array(data.su)
    cipherText = utils.b64ToUint8Array(data.u)
    const UUID_U8 = this.AES.decryptCTR(iv, salt, this.Tkey, cipherText)
    const UUID = utils.uint8ToHex(UUID_U8)

    return { name: utils.uint8ArrayToUTF8(name), UUID, ECC: sharedKey }
  }

  async initForm(
    name: string,
    _UUID: never,
    sharedKey: Uint8Array
  ): Promise<void> {
    this.sendNameInfo(name, sharedKey)
  }

  async sendNameInfo(name: string, sharedKey: Uint8Array): Promise<unknown> {
    if (
      this.AES === undefined ||
      this.certificate === undefined ||
      this.key === undefined ||
      this.iv === undefined ||
      this.IP === undefined ||
      this.port === undefined ||
      this.Tkey === undefined
    )
      throw new Error('Certificate undefined')

    const ivS = utils.random(16)
    const saltb = utils.random(16)
    const enc = this.AES.encryptCTR(
      ivS,
      saltb,
      this.Tkey,
      utils.utf8ToUint8Array(name)
    )
    await sendName(
      this.IP,
      this.port,
      Base64.encode(ivS),
      Base64.encode(saltb),
      Base64.encode(enc)
    )

    const certData = {
      name,
      fKey: sharedKey,
      sKey: utils.sha256(this.certificate.sKey),
      tKey: utils.sha256(this.key),
      jamming: utils.sha256(utils.concatUint8Array(this.iv, saltb)),
      id: utils.sha256(utils.concatUint8Array(this.Tkey, this.certificate.id)),
    }
    const certificate = new Certificate(certData, browser.storage.local)
    return certificate.saveNew()
  }
}
