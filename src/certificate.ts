/**
 * See {@link Certificate}.
 *
 * @module
 */

import { fromUint8Array, toUint8Array } from 'js-base64'

const KEY_SIZE = 16

/** A class to produce new certificates and to serialize them. */
export class Certificate {
  /** Produces a new certificate, with random keys. */
  static generate(): Certificate {
    return new Certificate({
      id: crypto.getRandomValues(new Uint8Array(KEY_SIZE)),
      fKey: crypto.getRandomValues(new Uint8Array(KEY_SIZE)),
      sKey: crypto.getRandomValues(new Uint8Array(KEY_SIZE)),
      tKey: crypto.getRandomValues(new Uint8Array(KEY_SIZE)),
      jamming: crypto.getRandomValues(new Uint8Array(KEY_SIZE)),
    })
  }

  /** Unserialize the certificate. */
  static fromJSON({
    id,
    fKey,
    sKey,
    tKey,
    jamming,
  }: ReturnType<Certificate['toJSON']>): Certificate {
    return new Certificate({
      id: toUint8Array(id),
      fKey: toUint8Array(fKey),
      sKey: toUint8Array(sKey),
      tKey: toUint8Array(tKey),
      jamming: toUint8Array(jamming),
    })
  }

  /** Unique identifier. */
  readonly id: Uint8Array
  /** First key. */
  readonly fKey: Uint8Array
  /** Second key. */
  readonly sKey: Uint8Array
  /** Third key. */
  readonly tKey: Uint8Array
  /** Jamming key. */
  readonly jamming: Uint8Array

  /** Initializes a certificate with the data given. */
  constructor({
    id,
    jamming,
    fKey,
    sKey,
    tKey,
  }: {
    /** Unique identifier. */
    id: Uint8Array
    /** First key. */
    fKey: Uint8Array
    /** Second key. */
    sKey: Uint8Array
    /** Third key. */
    tKey: Uint8Array
    /** Jamming key. */
    jamming: Uint8Array
  }) {
    this.id = id
    this.fKey = fKey
    this.sKey = sKey
    this.tKey = tKey
    this.jamming = jamming
  }

  /** Produces a JSON-serializable object. */
  toJSON(): {
    id: string
    fKey: string
    sKey: string
    tKey: string
    jamming: string
  } {
    return {
      id: fromUint8Array(this.id),
      fKey: fromUint8Array(this.fKey),
      sKey: fromUint8Array(this.sKey),
      tKey: fromUint8Array(this.tKey),
      jamming: fromUint8Array(this.jamming),
    }
  }
}
