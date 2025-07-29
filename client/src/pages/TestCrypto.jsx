import React, { useEffect, useState } from 'react';
import {
  initSodium,
  generateKeyPair,
  deriveSharedKey,
  encryptMessage,
  decryptMessage,
} from '../crypto/sodium';

export default function TestCrypto() {
  const [myKeys, setMyKeys] = useState(null);
  const [theirKeys, setTheirKeys] = useState(null);
  const [sharedKey, setSharedKey] = useState(null);
  const [encrypted, setEncrypted] = useState(null);
  const [decrypted, setDecrypted] = useState(null);

  useEffect(() => {
    const runCryptoTest = async () => {
      await initSodium();

      const me = generateKeyPair();
      const them = generateKeyPair();

      setMyKeys(me);
      setTheirKeys(them);

      // Simulate one side being client, one being server
      const sharedA = deriveSharedKey(me, them.publicKey, true);   // A is server
      const sharedB = deriveSharedKey(them, me.publicKey, false);  // B is client

      // Check: sharedA and sharedB should be the same
      if (sharedA.toString() !== sharedB.toString()) {
        console.error("❌ Shared keys do not match");
      } else {
        console.log("✅ Shared keys match");
        setSharedKey(sharedA);

        // Encrypt message with shared key
        const message = "Hello from Silencium 👋🔐";
        const encryptedMsg = encryptMessage(message, sharedA);
        setEncrypted(encryptedMsg);

        // Decrypt on other side
        const decryptedMsg = decryptMessage(encryptedMsg.ciphertext, encryptedMsg.nonce, sharedB);
        setDecrypted(decryptedMsg);
      }
    };

    runCryptoTest();
  }, []);

  return (
    <div style={{ padding: '1rem', fontFamily: 'monospace' }}>
      <h2>🔐 Silencium Crypto Test</h2>

      <p><strong>Original Message:</strong> Hello from Silencium 👋🔐</p>

      {encrypted && (
        <>
          <p><strong>Encrypted:</strong></p>
          <p>Nonce: {encrypted.nonce}</p>
          <p>Ciphertext: {encrypted.ciphertext}</p>
        </>
      )}

      {decrypted && (
        <p><strong>Decrypted:</strong> {decrypted}</p>
      )}
    </div>
  );
}
