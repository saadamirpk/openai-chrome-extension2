// content.js
document.addEventListener('mouseup', function () {
    const selectedText = window.getSelection().toString().trim();
    if (selectedText) {
        // Send the selected text to the background script with the correct key "action"

        chrome.runtime.sendMessage({ selectedText: selectedText });
    }
});
