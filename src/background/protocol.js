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
export var Request;
(function (Request) {
    /**
     * Not a ping at all. The request contains a certificate hash, and the
     * response, the keys to use for the rest of the exchange. It's the first step
     * of a handshake.
     */
    Request["Ping"] = "/P";
    /** A request to get credential information to login a website */
    Request["Credential"] = "/C";
    /** A request to get cloud key data */
    Request["CloudKey"] = "/CD";
    /** A request to get encryption keys. */
    Request["CipherKey"] = "/CK";
    /** End of an exchange, request for a new certificate. */
    Request["End"] = "/f2";
    /** Acknowledgement of receipt of the `END` request. */
    Request["EndOk"] = "/o";
    /** The first request of the pairing process. */
    Request["PairingStart"] = "/t";
    /** A key exchange during the pairing process. */
    Request["PairingSalt"] = "/c";
    /**
     * The final part of the pairing process, when the response is received, the
     * device have to be saved in persistent storage.
     */
    Request["PairingName"] = "/n";
    /**
     * A request to check if the phone is accepting connections.
     *
     * @remarks
     *   Not officially implemented, but requests not matching a given pattern are
     *   responded with a 202 Accepted and an empty body.
     */
    Request["IsAlive"] = "/is-alive";
})(Request || (Request = {}));
//# sourceMappingURL=protocol.js.map