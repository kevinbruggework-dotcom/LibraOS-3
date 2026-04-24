function addMessage(sender, text) {
  const box = document.getElementById("chatBox");

  const div = document.createElement("div");
  div.className = "msg";

  div.innerHTML = `<b>${sender}</b>: ${text}`;

  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}
