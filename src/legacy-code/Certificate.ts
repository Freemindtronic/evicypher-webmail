/* eslint-disable unicorn/filename-case */
import Base64 from 'base64-arraybuffer'
import type { Serialize } from './lanUtils'

import * as utils from './utils'

export interface CertData {
  id: Uint8Array
  jamming: Uint8Array
  fKey: Uint8Array
  sKey: Uint8Array
  tKey: Uint8Array
}

export class Certificate implements CertData {
  id: Uint8Array
  jamming: Uint8Array
  fKey: Uint8Array
  sKey: Uint8Array
  tKey: Uint8Array

  constructor(data: CertData) {
    this.id = data.id
    this.jamming = data.jamming
    this.fKey = data.fKey
    this.sKey = data.sKey
    this.tKey = data.tKey
  }

  static generate(): Certificate {
    const data = {
      name: '',
      id: utils.random(16),
      jamming: utils.random(16),
      fKey: utils.random(16),
      sKey: utils.random(16),
      tKey: utils.random(16),
    }
    return new Certificate(data)
  }

  static fromJSON(data: Serialize<CertData>): Certificate {
    return new Certificate({
      id: utils.b64ToUint8Array(data.id),
      jamming: utils.b64ToUint8Array(data.jamming),
      fKey: utils.b64ToUint8Array(data.fKey),
      sKey: utils.b64ToUint8Array(data.sKey),
      tKey: utils.b64ToUint8Array(data.tKey),
    })
  }

  toJSON(): Serialize<CertData> {
    return {
      id: Base64.encode(this.id),
      jamming: Base64.encode(this.jamming),
      fKey: Base64.encode(this.fKey),
      sKey: Base64.encode(this.sKey),
      tKey: Base64.encode(this.tKey),
    }
  }
}
