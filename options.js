document.addEventListener('DOMContentLoaded', function () {
    const apiKeyInput = document.getElementById('apiKey');
    const saveButton = document.getElementById('saveButton');

    saveButton.addEventListener('click', function () {
        const apiKey = apiKeyInput.value.trim();
        chrome.storage.sync.set({ 'apiKey': apiKey }, function () {
            alert('API key saved successfully!');
        });
    });
});
