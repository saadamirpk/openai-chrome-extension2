// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    console.log('Received message:', message);
    if (message.action === "selectedText") {
        // Extract data from the message
        const selectedText = message.selectedText;
        const selectedApi = message.selectedApi;
        const selectedPrompt = message.selectedPrompt;
        const apiKey = message.apiKey;

        // Your API call logic here using apiKey, selectedApi, selectedPrompt, and selectedText
        const apiUrl = getApiUrl(selectedApi);

        if (apiUrl && selectedText && selectedPrompt && apiKey) {
            const data = {
                model: 'text-davinci-003',
                prompt: selectedPrompt + ' ' + selectedText,
                temperature: 1,
                max_tokens: 256,
                api_key: apiKey
            };

            // Make the API call using fetch()
            fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + apiKey,
                },
                body: JSON.stringify(data)
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('API call failed with status ' + response.status);
                    }
                    return response.json();
                })
                .then(data => {
                    // Send the API response data back to the popup
                    sendResponse({ success: true, response: data });
                })
                .catch(error => {
                    sendResponse({ success: false, error: 'API call error: ' + error });
                });

            // Return true to indicate that we will be sending the response asynchronously
            return true;
        } else {
            sendResponse({ success: false, error: 'Invalid API configuration. Please check your API options.' });
        }
    }
});
