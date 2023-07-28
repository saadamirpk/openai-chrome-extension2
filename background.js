let apiKey = "";
let contentPort;

chrome.storage.local.get(["key"]).then((result) => {
    if (result.key) {
        apiKey = result.key;
    }
});

// Handle connections from content scripts
chrome.runtime.onConnect.addListener((port) => {
    if (port.name === "content") {
        contentPort = port;
        port.onMessage.addListener((message) => {
            if (message.action === "NewPrompt") {
                makePromptRequest(message.promptInput, message.promptAction);
            }
        });
    }
});

function postMessagetoContent(message) {
    if (message && contentPort) {
        contentPort.postMessage(message);
    }
}

async function makePromptRequest(prompt, promptAction) {
    if (apiKey) {
        console.log("Making Request For:", prompt);

        const body = {
            model: "text-davinci-003",
            prompt: promptAction + " " + prompt,
            temperature: 1,
            max_tokens: 256,
        };

        fetch("https://api.openai.com/v1/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + apiKey,
            },
            body: JSON.stringify(body),
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(
                        "API call failed with status " + response.status
                    );
                }
                return response.json();
            })
            .then((data) => {
                postMessagetoContent({
                    promptInput: prompt,
                    result: data.choices[0].text,
                });
            })
            .catch((error) => {
                console.log(error);
            });
    } else {
        console.log("Key not available to make Request");
    }
}
