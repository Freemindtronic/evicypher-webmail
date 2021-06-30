/**
 * All the requests possible, according to the undocumented protocol available
 * here:
 * https://github.com/Freemindtronic/Evitoken_Android/blob/828431a90fd6449a769849ad537d3d04d1fedca7/app/src/main/java/com/fulltoken/NetworkManage/http/HttpServer.java
 */
export const Request = {
  PONG: '/P',
  CIPHER_KEY: '/CK',
  END: '/f2',
  END_OK: '/o',
} as const

/** Maps Request constants to the correct request type. */
export interface RequestMap {
  [Request.PONG]: PingRequest
  [Request.CIPHER_KEY]: CipherKeyRequest
  [Request.END]: EndRequest
  [Request.END_OK]: EndOkRequest
}

/** Maps Request constants to the correct response type. */
export interface ResponseMap {
  [Request.PONG]: PingResponse
  [Request.CIPHER_KEY]: CipherKeyResponse
  [Request.END]: EndResponse
  [Request.END_OK]: EndOkResponse
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
  t: string
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

export interface CipherKeyRequest {
  sd: Uint8Array
  id: Uint8Array
  dh: Uint8Array
}

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
