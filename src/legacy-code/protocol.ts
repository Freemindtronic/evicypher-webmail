/**
 * All the requests possible, according to the undocumented protocol available
 * here:
 * https://github.com/Freemindtronic/Evitoken_Android/blob/828431a90fd6449a769849ad537d3d04d1fedca7/app/src/main/java/com/fulltoken/NetworkManage/http/HttpServer.java
 */
export const Request = {
  PING: '/P',
  CIPHER_KEY: '/CK',
  END: '/f2',
  END_OK: '/o',
  PAIRING_START: '/t',
  PAIRING_SALT: '/c',
  PAIRING_NAME: '/n',
} as const

/** Maps Request constants to the correct request type. */
export interface RequestMap {
  [Request.PING]: PingRequest
  [Request.CIPHER_KEY]: CipherKeyRequest
  [Request.END]: EndRequest
  [Request.END_OK]: EndOkRequest
  [Request.PAIRING_START]: PairingStartRequest
  [Request.PAIRING_SALT]: PairingSaltRequest
  [Request.PAIRING_NAME]: PairingNameRequest
}

/** Maps Request constants to the correct response type. */
export interface ResponseMap {
  [Request.PING]: PingResponse
  [Request.CIPHER_KEY]: CipherKeyResponse
  [Request.END]: EndResponse
  [Request.END_OK]: EndOkResponse
  [Request.PAIRING_START]: PairingStartResponse
  [Request.PAIRING_SALT]: PairingSaltResponse
  [Request.PAIRING_NAME]: PairingNameResponse
}

/**
 * Every exchange starts with a handcheck improperly named "ping". It contains a
 * hash sent to all available devices, used by the devices to know if they are
 * the correct recipient:
 *
 * - If so, the device responds "202 Accepted" with three keys.
 * - Else, the device responds "303 See Other".
 */
export interface PingRequest {
  t: Uint8Array
}

export interface PingResponse {
  iv1: Uint8Array
  sa1: Uint8Array
  k1: Uint8Array
  iv2: Uint8Array
  sa2: Uint8Array
  k2: Uint8Array
  iv3: Uint8Array
  sa3: Uint8Array
  k3: Uint8Array
}

export interface CipherKeyRequestWithoutKey {
  i1: Uint8Array
  i2: Uint8Array
  i3: Uint8Array
  s1: Uint8Array
  s2: Uint8Array
  s3: Uint8Array
  d1: Uint8Array
  d2: Uint8Array
  d3: Uint8Array
}

export type CipherKeyRequest =
  | CipherKeyRequestWithoutKey
  | (CipherKeyRequestWithoutKey & {
      ih: Uint8Array
      sh: Uint8Array
      dh: Uint8Array
    })

export interface CipherKeyResponse {
  i: Uint8Array
  s: Uint8Array
  d: Uint8Array
  i2: Uint8Array
  s2: Uint8Array
  d2: Uint8Array
}

export interface EndRequest {
  id: Uint8Array
  k1: Uint8Array
  k2: Uint8Array
  k3: Uint8Array
  k4: Uint8Array
}

export interface EndResponse {
  id: Uint8Array
  k1: Uint8Array
  k2: Uint8Array
  k3: Uint8Array
  k4: Uint8Array
}

export interface EndOkRequest {
  d: Uint8Array
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface EndOkResponse {}

export interface PairingStartRequest {
  t: Uint8Array
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PairingStartResponse {}

export interface PairingSaltRequest {
  /** Initialization vector. */
  i: Uint8Array
  /** Data. */
  s: Uint8Array
  /** UUID. */
  t: Uint8Array
}

/** This is currently annotated with variable names found in the Android app code. */
export interface PairingSaltResponse {
  /** PublicECCCipher */
  ek: Uint8Array
  /** NameCipher */
  n: Uint8Array
  /** UUIDCipher */
  u: Uint8Array
  /** IvForEcc */
  ik: Uint8Array
  /** IvForName */
  in: Uint8Array
  /** IvForUUID */
  iu: Uint8Array
  /** SaltForEcc */
  sk: Uint8Array
  /** SaltForName */
  sn: Uint8Array
  /** SaltForUUID */
  su: Uint8Array
  /** SaltForName */
  h: Uint8Array
}

export interface PairingNameRequest {
  i: Uint8Array
  s: Uint8Array
  n: Uint8Array
}

export interface PairingNameResponse {
  h: Uint8Array
}
