// popup.js

function sendMessageToActiveTab(message) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) return;
    chrome.tabs.sendMessage(tabs[0].id, message);
  });
}

document.getElementById("btnRead").addEventListener("click", () => {
  sendMessageToActiveTab({ type: "READ_SELECTION" });
});

document.getElementById("btnContrast").addEventListener("click", () => {
  sendMessageToActiveTab({ type: "TOGGLE_CONTRAST" });
});

document.getElementById("btnDyslexia").addEventListener("click", () => {
  sendMessageToActiveTab({ type: "TOGGLE_DYSLEXIA" });
});

document.getElementById("btnSimplify").addEventListener("click", () => {
  sendMessageToActiveTab({ type: "SIMPLIFY_SELECTION" });
});

// Optional: receive state updates from content.js
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "STATE_UPDATE") {
    if (typeof message.highContrastEnabled === "boolean") {
      document.getElementById("contrastState").textContent =
        message.highContrastEnabled ? "On" : "Off";
    }
    if (typeof message.dyslexiaModeEnabled === "boolean") {
      document.getElementById("dyslexiaState").textContent =
        message.dyslexiaModeEnabled ? "On" : "Off";
    }
  }
});
