import sodium from 'libsodium-wrappers';

let myKeyPair = null;
let sharedKey = null;
let sodiumReady = false;
let keyPairPromise = null;

export const initSodium = async () => {
  if (!sodiumReady) {
    await sodium.ready;
    sodiumReady = true;
  }
};

export const generateKeyPair = async () => {
  if (!keyPairPromise) {
    keyPairPromise = (async () => {
      await sodium.ready;
      myKeyPair = sodium.crypto_kx_keypair();
      return myKeyPair;
    })();
  }
  return keyPairPromise;
};

export const getMyKeyPair = () => myKeyPair;

export const deriveSharedKey = (theirPublicBase64, isClient = true) => {
  const theirPublicKey = sodium.from_base64(theirPublicBase64);

  const keys = isClient
    ? sodium.crypto_kx_client_session_keys(
        myKeyPair.publicKey,
        myKeyPair.privateKey,
        theirPublicKey
      )
    : sodium.crypto_kx_server_session_keys(
        myKeyPair.publicKey,
        myKeyPair.privateKey,
        theirPublicKey
      );

  sharedKey = keys.sharedTx;
  return sharedKey;
};

export const encryptMessage = (message, key) => {
  const nonce = new Uint8Array(sodium.crypto_secretbox_NONCEBYTES);
  crypto.getRandomValues(nonce);

  const ciphertext = sodium.crypto_secretbox_easy(
    message,
    nonce,
    key
  );

  return {
    nonce,
    ciphertext
  };
};

export const decryptMessage = (ciphertextBase64, nonceBase64, key) => {
  if (!key) throw new Error("Decryption key missing");

  try {
    const nonce = sodium.from_base64(nonceBase64);
    const ciphertext = sodium.from_base64(ciphertextBase64);

    const plaintext = sodium.crypto_secretbox_open_easy(
      ciphertext,
      nonce,
      key
    );

    return sodium.to_string(plaintext);
  } catch (err) {
    console.error("Decryption failed:", err);
    throw new Error("Failed to decrypt message");
  }
};
