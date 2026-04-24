const socket = io();

let currentUser = null;
let currentRoom = null;

// ======================
// LOGIN
// ======================
async function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  if (!username || !password) {
    alert("Fyll i användarnamn och lösenord");
    return;
  }

  // enkel “login” (vi bygger riktig auth senare)
  currentUser = username;

  document.getElementById("login").style.display = "none";
  document.getElementById("chat").style.display = "block";
}

// ======================
// GÅ MED I RUM
// ======================
async function joinRoom() {
  const room = document.getElementById("room").value;

  if (!room) return;

  currentRoom = room;

  socket.emit("join_room", room);

  // skapa ny sessionsnyckel för rummet
  await createSessionKey();

  addMessage("System", "Du gick med i rum: " + room);
}

// ======================
// SKICKA MEDDELANDE
// ======================
async function sendMessage() {
  const msgInput = document.getElementById("message");
  const message = msgInput.value;

  if (!message || !currentRoom) return;

  // kryptera innan skick
  const encrypted = await encrypt(message);

  socket.emit("send_message", {
    room: currentRoom,
    message: encrypted,
    sender: currentUser
  });

  msgInput.value = "";
}

// ======================
// TA EMOT MEDDELANDE
// ======================
socket.on("receive_message", async (data) => {
  try {
    const decrypted = await decrypt(data);

    addMessage("Anonym", decrypted);
  } catch (err) {
    console.error("Kunde inte dekryptera:", err);
  }
});

// ======================
// UI HELPERS
// ======================
function addMessage(sender, text) {
  const box = document.getElementById("chatBox");

  const div = document.createElement("div");
  div.className = "msg";
  div.innerText = sender + ": " + text;

  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

// gör funktioner globala (för HTML knappar)
window.login = login;
window.joinRoom = joinRoom;
window.sendMessage = sendMessage;
