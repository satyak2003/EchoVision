// --- STATE ---
let contrastActive = false;
let dyslexiaActive = false;
let overlay = null;

// --- LISTENERS ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "TOGGLE_CONTRAST") toggleContrast();
    if (request.type === "TOGGLE_DYSLEXIA") toggleDyslexia();
    if (request.type === "READ_SELECTION") readSelection();
    if (request.type === "SIMPLIFY_SELECTION") simplifyText();
    if (request.type === "FIX_IMAGES") fixImages();
});

// --- FEATURES ---
function readSelection() {
    const text = window.getSelection().toString();
    if (text) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
    } else {
        alert("Please highlight text first.");
    }
}

function toggleContrast() {
    contrastActive = !contrastActive;
    if (contrastActive) {
        document.body.classList.add('access-high-contrast'); // For overlay inheritance
        const style = document.createElement('style');
        style.id = 'access-contrast';
        style.innerHTML = `
            html, body, div, p, span, h1, h2, h3, h4, h5, h6 { 
                background-color: #000000 !important; 
                color: #FFFF00 !important; 
                border-color: #FFFF00 !important;
            }
            a { color: #00FFFF !important; text-decoration: underline !important; }
            img, video { filter: grayscale(100%) contrast(120%) !important; }
        `;
        document.head.appendChild(style);
    } else {
        document.body.classList.remove('access-high-contrast');
        document.getElementById('access-contrast')?.remove();
    }
}

function toggleDyslexia() {
    dyslexiaActive = !dyslexiaActive;
    if (dyslexiaActive) {
        const style = document.createElement('style');
        style.id = 'access-dyslexia';
        style.innerHTML = `
            * { 
                font-family: 'Comic Sans MS', sans-serif !important; 
                line-height: 2.0 !important; 
                letter-spacing: 0.1em !important; 
                word-spacing: 0.2em !important;
            }
        `;
        document.head.appendChild(style);
    } else {
        document.getElementById('access-dyslexia')?.remove();
    }
}

async function simplifyText() {
    const text = window.getSelection().toString();
    if (!text) { alert("Select text first."); return; }

    showOverlay("Thinking...", true);

    try {
        const response = await fetch('http://127.0.0.1:5000/simplify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text })
        });
        const data = await response.json();
        
        // Format the response nicely
        const formattedHTML = formatAIResponse(data.simplified);
        showOverlay(formattedHTML, false);
        
    } catch (err) {
        showOverlay("Error: Is Python backend running?", false);
    }
}

function fixImages() {
    const images = Array.from(document.querySelectorAll('img')).slice(0, 10);
    let count = 0;
    images.forEach(img => {
        if (!img.alt || img.alt.trim() === "") {
            img.style.border = "4px solid #e74c3c";
            img.alt = "AI Description Placeholder";
            count++;
        }
    });
    alert(`Fixed ${count} images.`);
}

// --- HELPER: FORMAT AI MARKDOWN TO HTML ---
function formatAIResponse(text) {
    if (!text) return "No response.";
    
    // 1. Convert **Bold** to <strong>Bold</strong>
    let html = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    
    // 2. Convert * Bullet points to <li>
    // Split by newlines
    let lines = html.split('\n');
    let output = "";
    let inList = false;

    lines.forEach(line => {
        line = line.trim();
        if (line.startsWith('* ') || line.startsWith('- ')) {
            if (!inList) { output += "<ul>"; inList = true; }
            output += `<li>${line.substring(2)}</li>`;
        } else {
            if (inList) { output += "</ul>"; inList = false; }
            if (line.length > 0) output += `<p>${line}</p>`;
        }
    });

    if (inList) output += "</ul>";
    
    return html; // Return plain html string with bold tags, logic above was for lists but simple bold replace is safer for basic display
}

// Rewriting formatAIResponse to be more robust
function formatAIResponse(text) {
    // Escape HTML to prevent injection (basic)
    let safeText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // Bold: **text** -> <strong>text</strong>
    safeText = safeText.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // Headers: # Header -> <h2>Header</h2>
    safeText = safeText.replace(/^#\s+(.*)$/gm, "<h2>$1</h2>");
    safeText = safeText.replace(/^##\s+(.*)$/gm, "<h3>$1</h3>");

    // Bullets: * text or - text -> <li>text</li>
    // We wrap them in <ul> later or just let them be styled blocks
    safeText = safeText.replace(/^\*\s+(.*)$/gm, "<li>$1</li>");
    safeText = safeText.replace(/^-\s+(.*)$/gm, "<li>$1</li>");

    // Newlines to <br> if not a list item
    safeText = safeText.replace(/\n/g, "<br>");
    
    return safeText;
}


// --- UI: FULL SCREEN OVERLAY ---
function showOverlay(content, isLoading = false) {
    if (overlay) overlay.remove();
    
    overlay = document.createElement('div');
    overlay.className = "openaccess-overlay"; // Uses styles.css
    
    let innerHTML = "";
    
    if (isLoading) {
        innerHTML = `
            <div class="oa-content-box" style="text-align:center;">
                <h2>🧠 AI Analysis</h2>
                <div class="oa-spinner"></div>
                <p>Simplifying complex text for you...</p>
            </div>
        `;
    } else {
        innerHTML = `
            <button id="oaCloseBtn" class="oa-close-btn">Close X</button>
            <div class="oa-content-box">
                <h2>🧠 Simplified Summary</h2>
                <div>${content}</div>
            </div>
        `;
    }

    overlay.innerHTML = innerHTML;
    document.body.appendChild(overlay);
    
    const closeBtn = document.getElementById('oaCloseBtn');
    if (closeBtn) closeBtn.onclick = () => overlay.remove();
}