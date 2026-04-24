let sessionKey = null;

// ======================
// SKAPA SESSIONNYCKEL
// ======================
async function createSessionKey() {
  sessionKey = await crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256
    },
    true,
    ["encrypt", "decrypt"]
  );

  return sessionKey;
}

// ======================
// KRYPTA
// ======================
async function encrypt(text) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(text);

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    sessionKey,
    encoded
  );

  return {
    iv: arrayBufferToBase64(iv),
    data: arrayBufferToBase64(new Uint8Array(encrypted))
  };
}

// ======================
// DEKRYPTA
// ======================
async function decrypt(payload) {
  const iv = base64ToArrayBuffer(payload.iv);
  const data = base64ToArrayBuffer(payload.data);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    sessionKey,
    data
  );

  return new TextDecoder().decode(decrypted);
}

// ======================
// HELPERS
// ======================
function arrayBufferToBase64(buffer) {
  return btoa(String.fromCharCode(...buffer));
}

function base64ToArrayBuffer(base64) {
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
}
