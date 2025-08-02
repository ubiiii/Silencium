import sodium from 'libsodium-wrappers';

let sodiumReady = false;

export async function initSodium() {
  if (!sodiumReady) {
    await sodium.ready;
    sodiumReady = true;
  }
}

// Generate an ECDH key pair (X25519)
export function generateKeyPair() {
  return sodium.crypto_kx_keypair();
}

// Derive a shared key using ECDH
export function deriveSharedKey(myKeys, theirPublicKey, isServer = true) {
  const keys = isServer
    ? sodium.crypto_kx_server_session_keys(myKeys.publicKey, myKeys.privateKey, theirPublicKey)
    : sodium.crypto_kx_client_session_keys(myKeys.publicKey, myKeys.privateKey, theirPublicKey);

  // Use the `sharedRx` (receive) key as the shared symmetric key
  return keys.sharedRx;
}

// Encrypt a message using AES-GCM with the shared key
export function encryptMessage(message, sharedKey) {
  const nonce = sodium.randombytes_buf(sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);
  const ciphertext = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
    sodium.from_string(message),
    null,
    null,
    nonce,
    sharedKey
  );
  return {
    nonce: sodium.to_base64(nonce),
    ciphertext: sodium.to_base64(ciphertext),
  };
}

// Decrypt a message using AES-GCM with the shared key
export function decryptMessage(ciphertextBase64, nonceBase64, sharedKey) {
  const nonce = sodium.from_base64(nonceBase64);
  const ciphertext = sodium.from_base64(ciphertextBase64);

  const plaintext = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
    null,
    ciphertext,
    null,
    nonce,
    sharedKey
  );

  return sodium.to_string(plaintext);
}
