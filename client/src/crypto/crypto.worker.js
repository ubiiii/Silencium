import sodium from 'libsodium-wrappers';

let sodiumReady = false;
await sodium.ready;
sodiumReady = true;

self.onmessage = async (e) => {
  const { id, type, data } = e.data;

  try {
    switch (type) {
      case 'generateKeyPair': {
        const keyPair = sodium.crypto_kx_keypair();
        self.postMessage({
          id,
          result: {
            publicKey: Array.from(keyPair.publicKey),
            privateKey: Array.from(keyPair.privateKey)
          }
        });
        break;
      }

case 'deriveSharedKey': {
  const myPublicKey = new Uint8Array(data.myPublicKey);
  const myPrivateKey = new Uint8Array(data.myPrivateKey);
  const theirPublicKey = new Uint8Array(data.theirPublicKey);

  const keys = data.isClient
    ? sodium.crypto_kx_client_session_keys(myPublicKey, myPrivateKey, theirPublicKey)
    : sodium.crypto_kx_server_session_keys(myPublicKey, myPrivateKey, theirPublicKey);

  const sharedKey = data.isClient ? keys.sharedTx : keys.sharedRx;

  self.postMessage({
    id,
    result: Array.from(sharedKey) // ✅ use the correct one!
  });
  break;
}


      case 'encrypt': {
        const nonce = data.nonce
          ? new Uint8Array(data.nonce)
          : sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);

        const message = new Uint8Array(data.message);
        const key = new Uint8Array(data.key);

        const ciphertext = sodium.crypto_secretbox_easy(message, nonce, key);

        self.postMessage({
          id,
          result: {
            ciphertext: Array.from(ciphertext),
            nonce: Array.from(nonce)
          }
        });
        break;
      }

      case 'decrypt': {
        const ciphertext = new Uint8Array(data.ciphertext);
        const nonce = new Uint8Array(data.nonce);
        const key = new Uint8Array(data.key);

        const plaintext = sodium.crypto_secretbox_open_easy(ciphertext, nonce, key);

        self.postMessage({
          id,
          result: new TextDecoder().decode(plaintext)
        });
        break;
      }

      default:
        self.postMessage({ id, error: 'Unknown operation type' });
    }
  } catch (error) {
    self.postMessage({ id, error: error.message });
  }
};
