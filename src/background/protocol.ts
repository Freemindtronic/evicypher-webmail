/**
 * This file contains the type definitions of the custom network protocol.
 *
 * ## Fetching encryption and decryption keys
 *
 * To encrypt or decrypt data, keys are requested to the phone, and the data is
 * processed locally. The keys exchange protocol is described by the diagram below:
 *
 * [<img
 * src="https://mermaid.ink/img/eyJjb2RlIjoic2VxdWVuY2VEaWFncmFtXG4gICAgTm90ZSBvdmVyIEV4dGVuc2lvbiwgUGhvbmU6IFRoZSBuYW1lIFBpbmcgaGFzIG5vdGhpbmcgdG8gZG8gd2l0aDxicj51c3VhbCBwaW5ncywgaXQgaXMgYWN0dWFsbHkgdGhlIHN0YXJ0IG9mPGJyPmFuIGVuY3J5cHRpb24gaGFuZHNoYWtlLlxuICAgIEV4dGVuc2lvbi0-PlBob25lOiBQaW5nUmVxdWVzdFxuICAgIE5vdGUgb3ZlciBQaG9uZTogVGhlIHBob25lIGdlbmVyYXRlcyBhbmQgcmVzcG9uZHMgd2l0aCBrZXlzPGJyPnRvIHVzZSBmb3IgdGhlIHJlc3Qgb2YgdGhlIGV4Y2hhbmdlLiBTaW5jZSB0aGlzPGJyPm9wZXJhdGlvbiBpcyBleHBlbnNpdmUsIHRoZXJlIGlzIGEgM3MgY29vbGRvd24uXG4gICAgUGhvbmUtPj5FeHRlbnNpb246IFBpbmdSZXNwb25zZVxuICAgIEV4dGVuc2lvbi0-PlBob25lOiBDaXBoZXJLZXlSZXF1ZXN0XG4gICAgTm90ZSBvdmVyIEV4dGVuc2lvbjogSWYgYSBzcGVjaWZpYyBrZXkgaXMgd2FudGVkLDxicj5pdHMgSUQgaXMgYWRkZWQgdG8gdGhlIHJlcXVlc3QuXG4gICAgUGhvbmUtPj5FeHRlbnNpb246IENpcGhlcktleVJlc3BvbnNlXG4gICAgTm90ZSBvdmVyIEV4dGVuc2lvbiwgUGhvbmU6IFRoZSByZW1haW5pbmcgc3RlcHMgYXJlIHRoZTxicj5uZWdvY2lhdGlvbiBvZiB0aGUga2V5cyB0byB1c2UgaW4gdGhlPGJyPm5leHQgZXhjaGFuZ2UuXG4gICAgRXh0ZW5zaW9uLT4-UGhvbmU6IEVuZFJlcXVlc3RcbiAgICBQaG9uZS0-PkV4dGVuc2lvbjogRW5kUmVzcG9uc2VcbiAgICBFeHRlbnNpb24tPj5QaG9uZTogRW5kT2tSZXF1ZXN0XG4gICAgUGhvbmUtPj5FeHRlbnNpb246IEVuZE9rUmVzcG9uc2VcbiIsIm1lcm1haWQiOnsidGhlbWUiOiJkZWZhdWx0In0sInVwZGF0ZUVkaXRvciI6ZmFsc2UsImF1dG9TeW5jIjp0cnVlLCJ1cGRhdGVEaWFncmFtIjpmYWxzZX0"
 * alt="Diagram">](https://mermaid-js.github.io/mermaid-live-editor/edit/#eyJjb2RlIjoic2VxdWVuY2VEaWFncmFtXG4gICAgTm90ZSBvdmVyIEV4dGVuc2lvbiwgUGhvbmU6IFRoZSBuYW1lIFBpbmcgaGFzIG5vdGhpbmcgdG8gZG8gd2l0aDxicj51c3VhbCBwaW5ncywgaXQgaXMgYWN0dWFsbHkgdGhlIHN0YXJ0IG9mPGJyPmFuIGVuY3J5cHRpb24gaGFuZHNoYWtlLlxuICAgIEV4dGVuc2lvbi0-PlBob25lOiBQaW5nUmVxdWVzdFxuICAgIE5vdGUgb3ZlciBQaG9uZTogVGhlIHBob25lIGdlbmVyYXRlcyBhbmQgcmVzcG9uZHMgd2l0aCBrZXlzPGJyPnRvIHVzZSBmb3IgdGhlIHJlc3Qgb2YgdGhlIGV4Y2hhbmdlLiBTaW5jZSB0aGlzPGJyPm9wZXJhdGlvbiBpcyBleHBlbnNpdmUsIHRoZXJlIGlzIGEgM3MgY29vbGRvd24uXG4gICAgUGhvbmUtPj5FeHRlbnNpb246IFBpbmdSZXNwb25zZVxuICAgIEV4dGVuc2lvbi0-PlBob25lOiBDaXBoZXJLZXlSZXF1ZXN0XG4gICAgTm90ZSBvdmVyIEV4dGVuc2lvbjogSWYgYSBzcGVjaWZpYyBrZXkgaXMgd2FudGVkLDxicj5pdHMgSUQgaXMgYWRkZWQgdG8gdGhlIHJlcXVlc3QuXG4gICAgUGhvbmUtPj5FeHRlbnNpb246IENpcGhlcktleVJlc3BvbnNlXG4gICAgTm90ZSBvdmVyIEV4dGVuc2lvbiwgUGhvbmU6IFRoZSByZW1haW5pbmcgc3RlcHMgYXJlIHRoZTxicj5uZWdvY2lhdGlvbiBvZiB0aGUga2V5cyB0byB1c2UgaW4gdGhlPGJyPm5leHQgZXhjaGFuZ2UuXG4gICAgRXh0ZW5zaW9uLT4-UGhvbmU6IEVuZFJlcXVlc3RcbiAgICBQaG9uZS0-PkV4dGVuc2lvbjogRW5kUmVzcG9uc2VcbiAgICBFeHRlbnNpb24tPj5QaG9uZTogRW5kT2tSZXF1ZXN0XG4gICAgUGhvbmUtPj5FeHRlbnNpb246IEVuZE9rUmVzcG9uc2VcbiIsIm1lcm1haWQiOiJ7XG4gIFwidGhlbWVcIjogXCJkZWZhdWx0XCJcbn0iLCJ1cGRhdGVFZGl0b3IiOmZhbHNlLCJhdXRvU3luYyI6dHJ1ZSwidXBkYXRlRGlhZ3JhbSI6ZmFsc2V9)
 *
 * The exchange is in four consecutive steps:
 *
 * - **Ping:** the beginning of the handshake. (The name Ping is improperly used.)
 * - **CypherKey:** effective exchange, the keys are encrypted by the phone, sent
 *   and decrypted by the extension.
 * - **EndRequest:** a new key is generated for the next exchange with the phone.
 * - **EndOkRequest:** acknowledgement of the end of the exchange.
 *
 * ## Pairing with a phone
 *
 * To pair with a phone, the exchange is started by the extension, and not the
 * phone. Since it is not possible to know the address of the phone that wants
 * to pair, the extension reaches all the phones found. When a phone enters in
 * pairing mode, it answers the request. All other phones ignore the request.
 *
 * [<img
 * src="https://mermaid.ink/img/eyJjb2RlIjoic2VxdWVuY2VEaWFncmFtXG4gICAgTm90ZSBvdmVyIEV4dGVuc2lvbiwgUGhvbmU6IFRoZSBleHRlbnNpb24gc2VuZHMgcmVxdWVzdHMgdG8gYWxsPGJyPnBob25lcyBvbiB0aGUgbmV0d29ya1xuICAgIEV4dGVuc2lvbi0-PlBob25lOiBQYWlyaW5nU3RhcnRSZXF1ZXN0XG4gICAgTm90ZSByaWdodCBvZiBQaG9uZTogVGhlIHBob25lIG9ubHkgYW53c2Vyczxicj53aGVuIGl0IHdhbnRzIHRvIHBhaXJcbiAgICBQaG9uZS0-PkV4dGVuc2lvbjogUGFpcmluZ1N0YXJ0UmVzcG9uc2VcbiAgICBFeHRlbnNpb24tPj5QaG9uZTogUGFpcmluZ1NhbHRSZXF1ZXN0XG4gICAgUGhvbmUtPj5FeHRlbnNpb246IFBhaXJpbmdTYWx0UmVzcG9uc2VcbiAgICBFeHRlbnNpb24tPj5QaG9uZTogUGFpcmluZ05hbWVSZXF1ZXN0XG4gICAgUGhvbmUtPj5FeHRlbnNpb246IFBhaXJpbmdOYW1lUmVzcG9uc2VcblxuXG4gICAgICAgICAgICAiLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9LCJ1cGRhdGVFZGl0b3IiOmZhbHNlLCJhdXRvU3luYyI6dHJ1ZSwidXBkYXRlRGlhZ3JhbSI6ZmFsc2V9"
 * alt="Diagram">](https://mermaid-js.github.io/mermaid-live-editor/edit/##eyJjb2RlIjoic2VxdWVuY2VEaWFncmFtXG4gICAgTm90ZSBvdmVyIEV4dGVuc2lvbiwgUGhvbmU6IFRoZSBleHRlbnNpb24gc2VuZHMgcmVxdWVzdHMgdG8gYWxsPGJyPnBob25lcyBvbiB0aGUgbmV0d29yXG4gICAgRXh0ZW5zaW9uLT4-UGhvbmU6IFBhaXJpbmdTdGFydFJlcXVlc3RcbiAgICBOb3RlIHJpZ2h0IG9mIFBob25lOiBUaGUgcGhvbmUgb25seSBhbndzZXJzPGJyPndoZW4gaXQgd2FudHMgdG8gcGFpclxuICAgIFBob25lLT4-RXh0ZW5zaW9uOiBQYWlyaW5nU3RhcnRSZXNwb25zZVxuICAgIEV4dGVuc2lvbi0-PlBob25lOiBQYWlyaW5nU2FsdFJlcXVlc3RcbiAgICBQaG9uZS0-PkV4dGVuc2lvbjogUGFpcmluZ1NhbHRSZXNwb25zZVxuICAgIEV4dGVuc2lvbi0-PlBob25lOiBQYWlyaW5nTmFtZVJlcXVlc3RcbiAgICBQaG9uZS0-PkV4dGVuc2lvbjogUGFpcmluZ05hbWVSZXNwb25zZVxuXG5cbiAgICAgICAgICAgICIsIm1lcm1haWQiOiJ7XG4gIFwidGhlbWVcIjogXCJkZWZhdWx0XCJcbn0iLCJ1cGRhdGVFZGl0b3IiOmZhbHNlLCJhdXRvU3luYyI6dHJ1ZSwidXBkYXRlRGlhZ3JhbSI6ZmFsc2V9)
 *
 * The exchange is in three consecutive steps:
 *
 * - **PairingStart:** the request sent to all phones, to know which one wants to pair.
 * - **PairingSalt:** produces a key pair for the next exchange.
 * - **PairingName:** saves the key pair on both ends, with the name provided.
 *
 * @module
 */

/**
 * All the requests possible, according to the undocumented protocol available here:
 *
 * - https://github.com/Freemindtronic/Evitoken_Android/blob/828431a90fd6449a769849ad537d3d04d1fedca7/app/src/main/java/com/fulltoken/NetworkManage/http/HttpServer.java
 * - https://github.com/Freemindtronic/Evitoken_Android/blob/828431a90fd6449a769849ad537d3d04d1fedca7/app/src/main/java/com/fulltoken/NetworkManage/dialog/HttpServerPairing.java
 */
export enum Request {
  /**
   * Not a ping at all. The request contains a certificate hash, and the
   * response, the keys to use for the rest of the exchange. It's the first step
   * of a handshake.
   */
  Ping = '/P',
  /** A request to get credential information to login a website */
  Credential = '/C',
  /** A request to get cloud key data */
  CloudKey = '/CD',
  /** A request to get encryption keys. */
  CipherKey = '/CK',
  /** End of an exchange, request for a new certificate. */
  End = '/f2',
  /** Acknowledgement of receipt of the `END` request. */
  EndOk = '/o',
  /** The first request of the pairing process. */
  PairingStart = '/t',
  /** A key exchange during the pairing process. */
  PairingSalt = '/c',
  /**
   * The final part of the pairing process, when the response is received, the
   * device have to be saved in persistent storage.
   */
  PairingName = '/n',
  /**
   * A request to check if the phone is accepting connections.
   *
   * @remarks
   *   Not officially implemented, but requests not matching a given pattern are
   *   responded with a 202 Accepted and an empty body.
   */
  IsAlive = '/is-alive',
}

/** Maps {@link Request} constants to the correct request type. */
export interface RequestMap {
  [Request.Ping]: PingRequest
  [Request.Credential]: CredentialRequest
  [Request.CloudKey]: CredentialRequest
  [Request.CipherKey]: CipherKeyRequest
  [Request.End]: EndRequest
  [Request.EndOk]: EndOkRequest
  [Request.PairingStart]: PairingStartRequest
  [Request.PairingSalt]: PairingSaltRequest
  [Request.PairingName]: PairingNameRequest
  [Request.IsAlive]: IsAliveRequest
}

/**
 * Maps {@link Request} constants to the correct response type.
 *
 * Some responses are empty, therefore typed by `Record<string, never>`.
 */
export interface ResponseMap {
  [Request.Ping]: PingResponse
  [Request.Credential]: CredentialResponse
  [Request.CloudKey]: CredentialResponse
  [Request.CipherKey]: CipherKeyResponse
  [Request.End]: EndResponse
  [Request.EndOk]: Record<string, never>
  [Request.PairingStart]: Record<string, never>
  [Request.PairingSalt]: PairingSaltResponse
  [Request.PairingName]: PairingNameResponse
  [Request.IsAlive]: Record<string, never>
}

/**
 * Every exchange starts with a handshake improperly named "ping". It contains a
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
  /** Initialization vector. */
  iv1: Uint8Array
  /** Salt. */
  sa1: Uint8Array
  /** Public ECC Cipher. */
  k1: Uint8Array
  /** Initialization vector. */
  iv2: Uint8Array
  /** Salt. */
  sa2: Uint8Array
  /** Public ECC Cipher. */
  k2: Uint8Array
  /** Initialization vector. */
  iv3: Uint8Array
  /** Salt. */
  sa3: Uint8Array
  /** Public ECC Cipher. */
  k3: Uint8Array
}

export interface BasicLabelRequest {
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

export interface BasicLabelResponse {
  i: Uint8Array
  s: Uint8Array
  d: Uint8Array
  i2: Uint8Array
  s2: Uint8Array
  d2: Uint8Array
}

export type CredentialRequestWithoutUrl = BasicLabelRequest

/** Type of a credential request, when the user has a label with login information. */

export interface CredentialRequestWithUrl extends CredentialRequestWithoutUrl {
  dd: Uint8Array
  id: Uint8Array
  sd: Uint8Array
}

export type CredentialRequest =
  | CredentialRequestWithUrl
  | CredentialRequestWithoutUrl

/** Type of a credential response, it is automatically picked if web url already known */
export interface CredentialResponse extends BasicLabelResponse {
  n: Uint8Array
  t: Uint8Array
}

/** Type of a key request, when the user has to pick a key. */
export type CipherKeyRequestWithoutKey = BasicLabelRequest

/** Type of a key request, when the key is automatically picked. */
export interface CipherKeyRequestWithKey extends CipherKeyRequestWithoutKey {
  ih: Uint8Array
  sh: Uint8Array
  dh: Uint8Array
}

/** See {@link CipherKeyRequestWithoutKey}`and`{@link CipherKeyRequestWithKey}. */
export type CipherKeyRequest =
  | CipherKeyRequestWithoutKey
  | CipherKeyRequestWithKey

export type CipherKeyResponse = BasicLabelResponse

/** There are four keys, probably because three were not enough. Who knows. */
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

export interface PairingStartRequest {
  t: Uint8Array
}

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
  /** PublicECCCipher. */
  ek: Uint8Array
  /** NameCipher. */
  n: Uint8Array
  /** UUIDCipher. */
  u: Uint8Array
  /** IvForEcc. */
  ik: Uint8Array
  /** IvForName. */
  in: Uint8Array
  /** IvForUUID. */
  iu: Uint8Array
  /** SaltForEcc. */
  sk: Uint8Array
  /** SaltForName. */
  sn: Uint8Array
  /** SaltForUUID. */
  su: Uint8Array
  /** SaltForName. */
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

// CSpell:words oskour
export interface IsAliveRequest {
  /**
   * The Android application crashes if the request body is empty, so let's add
   * a dummy field.
   */
  oskour: 1
}
