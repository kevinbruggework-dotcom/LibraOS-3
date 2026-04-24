const WS_URL = "wss://libraos-1.onrender.com";

let ws;
let me = JSON.parse(localStorage.getItem("me")) || {
  id: crypto.randomUUID(),
  contacts: {}
};

save();

/* ------------------ CONNECT ------------------ */
function connect() {
  ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    ws.send(JSON.stringify({ type: "REGISTER", id: me.id }));
  };

  ws.onmessage = async (e) => {
    const msg = JSON.parse(e.data);

    if (msg.type === "CONTACT_REQUEST") {
      if (confirm("Kontaktförfrågan från " + msg.from)) {
        ws.send(JSON.stringify({
          type: "CONTACT_ACCEPT",
          to: msg.from,
          from: me.id
        }));

        addContact(msg.from);
      }
    }

    if (msg.type === "CONTACT_ACCEPT") {
      addContact(msg.from);
      alert("Kontakt tillagd!");
    }

    if (msg.type === "DM") {
      const text = await decrypt(msg.data, msg.from);
      addMessage(msg.from, text);
    }
  };
}

connect();

/* ------------------ CONTACTS ------------------ */
function sendRequest() {
  const id = document.getElementById("addId").value;

  ws.send(JSON.stringify({
    type: "CONTACT_REQUEST",
    from: me.id,
    to: id
  }));
}

function addContact(id) {
  if (!me.contacts[id]) {
    me.contacts[id] = { messages: [] };
    save();
    renderContacts();
  }
}

/* ------------------ CHAT ------------------ */
async function sendMessage(to, text) {
  const enc = await encrypt(text, to);

  ws.send(JSON.stringify({
    type: "DM",
    to,
    from: me.id,
    data: enc
  }));

  addMessage(to, text, true);
}

function addMessage(id, text, own = false) {
  me.contacts[id].messages.push({ text, own });
  save();
  renderChats();
}

/* ------------------ CRYPTO ------------------ */
async function getKey(otherId) {
  const raw = new TextEncoder().encode(me.id + otherId);

  const keyMaterial = await crypto.subtle.importKey(
    "raw", raw, "PBKDF2", false, ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: new TextEncoder().encode("libra"),
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encrypt(text, to) {
  const key = await getKey(to);
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const enc = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(text)
  );

  return {
    iv: btoa(String.fromCharCode(...iv)),
    data: btoa(String.fromCharCode(...new Uint8Array(enc)))
  };
}

async function decrypt(payload, from) {
  const key = await getKey(from);

  const iv = new Uint8Array(atob(payload.iv).split("").map(c => c.charCodeAt(0)));
  const data = new Uint8Array(atob(payload.data).split("").map(c => c.charCodeAt(0)));

  const dec = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    data
  );

  return new TextDecoder().decode(dec);
}

/* ------------------ UI ------------------ */
function renderContacts() {
  const el = document.getElementById("contactList");
  el.innerHTML = "";

  Object.keys(me.contacts).forEach(id => {
    const div = document.createElement("div");
    div.textContent = id;
    div.onclick = () => openChat(id);
    el.appendChild(div);
  });
}

function openChat(id) {
  const chat = me.contacts[id];
  const el = document.getElementById("chatList");

  el.innerHTML = `
    <h3>${id}</h3>
    <div id="msgs"></div>
    <input id="msgInput" class="input">
    <button onclick="send()">Skicka</button>
  `;

  window.currentChat = id;

  chat.messages.forEach(m => {
    addMsgUI(m.text, m.own);
  });
}

function send() {
  const input = document.getElementById("msgInput");
  sendMessage(currentChat, input.value);
  addMsgUI(input.value, true);
  input.value = "";
}

function addMsgUI(text, own) {
  const msgs = document.getElementById("msgs");
  const div = document.createElement("div");

  div.textContent = text;
  div.style.textAlign = own ? "right" : "left";

  msgs.appendChild(div);
}

/* ------------------ NAV ------------------ */
function nav(id, el) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.getElementById(id).classList.add("active");

  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  el.classList.add("active");
}

/* ------------------ PROFILE ------------------ */
document.getElementById("myId").textContent = me.id;

function resetAccount() {
  if (!confirm("Radera konto?")) return;

  localStorage.clear();
  location.reload();
}

/* ------------------ SAVE ------------------ */
function save() {
  localStorage.setItem("me", JSON.stringify(me));
}
