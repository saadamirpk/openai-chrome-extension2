// popup.js

let apiKey = "";
let result = "";
let appActive = false;

document.addEventListener("DOMContentLoaded", function () {
    isAPIKeySaved();
    isAppActive();
    //clearAPIKey();

    const statusButton = document.getElementById("statusButton");
    statusButton.addEventListener("click", function () {
        if (apiKey) {
            if (appActive) {
                appDeactivate();
            } else {
                appActivate();
            }
        } else {
            appDeactivate();
        }
    });

    /* HIDDEN FIND AND REPLACE INPUTS
    const findReplaceButton = document.getElementById("findReplaceButton");
    findReplaceButton.addEventListener("click", function () {
        const promptInput = document.getElementById("promptInput").value;
        makePromptRequest(promptInput);
    });
    */
});

function isAPIKeySaved() {
    const saveAPIButton = document.getElementById("saveAPIButton");
    const apiKeyInput = document.getElementById("apiInput");
    const apiInputSection = document.getElementById("apiInputSection");

    chrome.storage.local.get(["key"]).then((result) => {
        if (result.key) {
            console.log("Key Found");
            apiInputSection.style.display = "none";
            apiKey = result.key;
            return true;
        } else {
            apiKey = "";
            saveAPIButton.addEventListener("click", function () {
                chrome.storage.local
                    .set({ key: apiKeyInput.value })
                    .then(() => {
                        console.log("Key Saved");
                        apiInputSection.style.display = "none";
                        apiKey = apiKeyInput.value;
                        appActivate();
                    });
            });
            return false;
        }
    });
}

function isAppActive() {
    chrome.storage.local.get(["appStatus"]).then((result) => {
        if (result.appStatus) {
            return appActivate();
        } else {
            return appDeactivate();
        }
    });
}

function appActivate() {
    const statusLabel = document.getElementById("statusLabel");
    const statusButton = document.getElementById("statusButton");

    chrome.storage.local.set({ appStatus: true }).then(() => {
        console.log("App Activated");
        appActive = true;

        // Design Updates
        statusLabel.innerHTML = "ON";
        statusButton.className = "statusOn";

        return true;
    });
}

function appDeactivate() {
    const statusLabel = document.getElementById("statusLabel");
    const statusButton = document.getElementById("statusButton");

    chrome.storage.local.set({ appStatus: false }).then(() => {
        console.log("App Deactivated");
        appActive = false;

        // Design Updates
        statusLabel.innerHTML = "OFF";
        statusButton.className = "";

        return true;
    });
}

function clearAPIKey() {
    chrome.storage.local.set({ key: "" }).then(() => {
        console.log("Key Cleared");
        appDeactivate();
    });
}

function makePromptRequest(prompt) {
    if (apiKey) {
        console.log("Making Request For: ", prompt);

        const body = {
            model: "text-davinci-003",
            prompt: prompt,
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
                replaceTextwithResult(prompt, data.choices[0].text);
            })
            .catch((error) => {
                console.log(error);
            });
    } else {
        console.log("Key not available to make Request");
    }
}

function replaceTextwithResult(promptInput, promptResult) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
            promptInput,
            promptResult,
        });
    });
}
