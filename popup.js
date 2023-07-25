document.addEventListener("DOMContentLoaded", function () {
    const apiKeyEntrySection = document.getElementById("api-key-entry");
    const mainFunctionalitiesSection = document.getElementById(
        "main-functionalities"
    );
    const apiKeyInput = document.getElementById("apiKey");
    const submitApiKeyButton = document.getElementById("submitApiKeyButton");
    const apiOptions = document.getElementById("apiOptions");
    const promptOptions = document.getElementById("promptOptions");
    const toggleContainer = document.getElementById("toggleContainer"); // Toggle switch container
    const toggleSwitch = document.getElementById("toggleSwitch"); // Toggle switch input
    let apiKey = "";
    let selectedText = "";
    let floatingButton; // Reference to the dynamically created floating button
    const dropdownMenu = document.createElement("div"); // Create the dropdown menu
    let popupCloseTimeout;

    // Set the id and styles for the dropdown menu
    dropdownMenu.id = "dropdown-menu";
    dropdownMenu.style.display = "none";
    dropdownMenu.innerHTML = '<select id="promptOptions"></select>';
    document.body.appendChild(dropdownMenu);

    // Check if API key is already stored in extension storage
    chrome.storage.sync.get(["apiKey"], function (result) {
        if (result.apiKey) {
            // If API key is already stored, hide the API key entry section and show the main functionalities section
            apiKey = result.apiKey;
            apiKeyEntrySection.style.display = "none";
            mainFunctionalitiesSection.style.display = "block";
            // Show the toggle switch container
            toggleContainer.style.display = "flex";
        }
    });

    // Event listener to detect when the user selects text on the page
    document.addEventListener("mouseup", function () {
        selectedText = window.getSelection().toString().trim();

        if (selectedText) {
            // If text is selected, create the floating button unless it's hidden by the toggle switch
            if (!toggleSwitch.checked) {
                createFloatingButton();
            }
        } else {
            // If no text is selected, remove the floating button and hide the dropdown menu
            removeFloatingButton();
        }
    });

    // Function to toggle the floating button based on the toggle switch
    function toggleFloatingButton() {
        if (floatingButton) {
            if (toggleSwitch.checked) {
                // Hide the floating button
                floatingButton.style.display = "none";
            } else {
                // Show the floating button
                floatingButton.style.display = "block";
            }
        }
    }

    function createFloatingButton() {
        console.log("Creating floating button...");
        if (!floatingButton) {
            floatingButton = document.createElement("button");
            floatingButton.textContent = "Pass & Replace Selected Text";
            floatingButton.classList.add("floating-button");
            document.body.appendChild(floatingButton);

            // Add event listener to the floating button
            floatingButton.addEventListener("click", function () {
                // Show the dropdown menu when the button is clicked
                dropdownMenu.style.display = "block";

                // Clear previous prompt options in the dropdown menu
                promptOptions.innerHTML = "";

                // Populate the prompt options in the dropdown menu based on the selected API
                const selectedApi = apiOptions.value;
                populatePromptOptions(selectedApi);
                console.log("Floating button element created:", floatingButton);
            });
        }
    }

    function showPopup(message) {
        const popup = document.getElementById("popup");
        const popupText = document.getElementById("popupText");
        popupText.textContent = message;
        popup.style.display = "block";

        // Hide the pop-up after a few seconds (adjust the time as needed)
        setTimeout(function () {
            popup.style.display = "none";
        }, 3000); // 3 seconds
    }

    function removeFloatingButton() {
        if (floatingButton) {
            floatingButton.remove();
            floatingButton = null;
            dropdownMenu.style.display = "none";
        }
    }

    // Event listener for submitting the API key
    submitApiKeyButton.addEventListener("click", function () {
        apiKey = apiKeyInput.value.trim();
        console.log("API key to be saved:", apiKey); // Add this line for debugging
        if (apiKey) {
            // Store the API key in extension storage
            chrome.storage.sync.set({ apiKey: apiKey }, function () {
                console.log("API key saved successfully.");
                // Hide the API key entry section and show the main functionalities section
                apiKeyEntrySection.style.display = "none";
                mainFunctionalitiesSection.style.display = "block";

                // Show the toggle switch container
                toggleContainer.style.display = "flex";

                // Show the floating button
                createFloatingButton(); // Make sure this function exists
                console.log("Floating button created");

                // Debugging: Check if the floating button exists and is displayed
                console.log(
                    "Is floating button displayed?",
                    floatingButton.style.display
                );

                // Debugging: Check if dropdown menu exists and is displayed
                console.log(
                    "Is dropdown menu displayed?",
                    dropdownMenu.style.display
                );
            });
        } else {
            alert("Please enter a valid API key.");
        }
    });

    // Event listener for the toggle switch
    toggleSwitch.addEventListener("change", function () {
        const isChecked = this.checked;

        if (floatingButton) {
            if (isChecked) {
                // Hide the floating button
                floatingButton.style.display = "none";
            } else {
                // Show the floating button
                floatingButton.style.display = "block";
            }
        }
    });

    // Event listener for the prompt selection in the dropdown menu
    promptOptions.addEventListener("change", function () {
        const selectedApi = apiOptions.value;
        const selectedPrompt = promptOptions.value;

        // Your API call logic here using apiKey, selectedApi, selectedPrompt, and selectedText
        const apiUrl = getApiUrl(selectedApi);

        if (apiUrl && selectedText && selectedPrompt) {
            const data = {
                model: "text-davinci-003",
                prompt: selectedPrompt + " " + selectedText,
                temperature: 1,
                max_tokens: 256,
                api_key: apiKey,
            };

            // Make the API call using fetch()
            fetch(apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + apiKey, // Include the bearer token here
                },
                body: JSON.stringify(data),
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
                    // Handle the API response data
                    showPopup(data.choices[0].text);
                    // Replace the selected text with the generated output
                    replaceSelectedText(data.choices[0].text);
                })
                .catch((error) => {
                    // Handle errors that occurred during the API call
                    showPopup("API call error: " + error);
                });
        } else {
            alert("Invalid API configuration. Please check your API options.");
        }
    });

    document
        .getElementById("passAndReplaceButton")
        .addEventListener("click", function () {
            // Get the selected API, prompt, and apiKey from the popup
            const selectedApi = document.getElementById("apiOptions").value;
            const selectedPrompt =
                document.getElementById("promptOptions").value;
            const apiKey = document.getElementById("apiKey").value.trim();

            /* Get the selected text from the content
            
            chrome.tabs.query(
                { active: true, currentWindow: true },
                async function (tabs) {
                    const tab = tabs[0];
                    if (!tab || !tab.id) {
                        console.error("Unable to get active tab ID.");
                        return;
                    }
                }

            
                // Send a message to the content script to get the selected text
            chrome.tabs.sendMessage(
                tab.id,
                { action: "getSelectedText" },
                function (response) {
                    if (chrome.runtime.lastError) {
                        console.error(
                            "Error handling response:",
                            chrome.runtime.lastError.message
                        );
                        return;
                    } 

                    const selectedText = response.selectedText;
            
                    */

            // Send a message to the background script to perform the API call

            const myKey = "";
            chrome.storage.sync.get(["apiKey"], function (result) {
                console.log(result);
                if (result.apiKey) {
                    myKey = result.apiKey;
                }
            });

            chrome.runtime.sendMessage(
                {
                    action: "selectedText",
                    selectedText: "SOMETHING DATA INFO",
                    selectedApi: getApiUrl(selectedApi),
                    selectedPrompt: selectedPrompt || "something",
                    apiKey: apiKey || myKey,
                },
                function (response) {
                    if (response.success) {
                        // Replace the selected text with the generated output
                        const generatedOutput =
                            response.response.choices[0].text;
                        replaceSelectedText(generatedOutput); // Call the function to replace the selected text
                    } else {
                        // Show an error message in the popup
                        alert("API call failed: " + response.error);
                    }
                    /*
                        }
                    );
                    
                        }
                    );
                    */
                }
            );
        });

    // Event listener for the toggle switch
    toggleSwitch.addEventListener("change", function () {
        // Call the function to toggle the floating button
        toggleFloatingButton();
    });

    // Call the function to toggle the floating button initially when the popup loads
    toggleFloatingButton();

    // Function to populate the prompt options in the dropdown menu
    function populatePromptOptions(selectedApi) {
        promptOptions.innerHTML = ""; // Clear any previous options

        // Define an object to map API options to their corresponding prompts
        const apiPromptMap = {
            api1: [
                "Fix Grammar in the following sentence",
                "Fix Spelling mistakes in the following sentence",
            ],
            api2: [
                "Fix Punctuation in the following sentence",
                "Remove Extra Spaces in the following sentence",
            ],
            api3: [
                "Make the following sentence more formal",
                "Make the following sentence more casual",
            ],
            // Add more API options and prompts as needed
        };

        // Get the prompts corresponding to the selected API option
        const prompts = apiPromptMap[selectedApi] || [];

        // Create option elements for each prompt and append them to the dropdown menu
        prompts.forEach((prompt) => {
            const option = document.createElement("option");
            option.value = prompt;
            option.textContent = prompt;
            promptOptions.appendChild(option);
        });
    }

    // Function to get the appropriate API URL based on selected API option
    function getApiUrl(selectedApi) {
        // Replace 'URLAPI1', 'URLAPI2', and 'URLAPI3' with the actual API URLs for each option
        if (selectedApi === "api1") {
            return "https://api.openai.com/v1/models"; // Replace this with the actual API URL for API Option 1
        } else if (selectedApi === "api2") {
            return "https://api.openai.com/v1/models/text-davinci-003"; // Replace this with the actual API URL for API Option 2
        } else if (selectedApi === "api3") {
            return "https://api.openai.com/v1/models/text-davinci-003"; // Replace this with the actual API URL for API Option 3
        } else {
            // Handle other API options if needed
            return null;
        }
    }

    // Function to replace the selected text with the generated output
    function replaceSelectedText(generatedOutput) {
        if (selectedText && generatedOutput) {
            // Get the currently focused element (where the selected text is located)
            const focusedElement = document.activeElement;

            if (focusedElement) {
                // Check if the focused element is an input or textarea
                if (
                    focusedElement.tagName === "INPUT" ||
                    focusedElement.tagName === "TEXTAREA"
                ) {
                    // Replace the selected text in the input or textarea
                    const start = focusedElement.selectionStart;
                    const end = focusedElement.selectionEnd;
                    const beforeText = focusedElement.value.substring(0, start);
                    const afterText = focusedElement.value.substring(end);
                    focusedElement.value =
                        beforeText + generatedOutput + afterText;
                } else {
                    // For other elements, use the standard DOM manipulation to replace the text
                    const selection = window.getSelection();
                    if (selection.rangeCount > 0) {
                        const range = selection.getRangeAt(0);
                        range.deleteContents();
                        range.insertNode(
                            document.createTextNode(generatedOutput)
                        );
                    }
                }
            }
        }
    }
});
