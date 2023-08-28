// content.js
let buttonIds = [];
const port = chrome.runtime.connect({ name: "content" });

function createButton(
    text,
    position,
    promptInput,
    promptAction,
    boundingX,
    boundingY
) {
    const button = document.createElement("button");
    button.innerText = text;
    button.className = "IntBtnActions";
    button.id = "Intellithing-" + text + "-Button";
    buttonIds.push(button.id);

    button.style.position = "fixed";
    button.style.top = `${boundingX - 32 + position * 32}px`;
    button.style.left = `${boundingY + 30}px`;

    button.style.width = "30px";
    button.style.height = "30px";
    button.style.borderRadius = "50%";
    button.style.zIndex = "900";

    button.style.color = "#fff";
    button.style.textAlign = "center";
    button.style.fontSize = "24px";
    button.style.backgroundColor = "#1ca4ad";

    button.addEventListener("click", () => {
        port.postMessage({
            action: "NewPrompt",
            promptInput: promptInput,
            promptAction: promptAction,
        });
    });
    document.body.appendChild(button);
}

document.addEventListener("mouseup", function (event) {
    const promptInput = window.getSelection().toString().trim();
    if (event.target.className === "IntBtnActions") {
        return;
    }
    if (promptInput) {
        chrome.storage.local.get(["appStatus"]).then((result) => {
            if (result.appStatus) {
                createButton(
                    "Grammar",
                    3,
                    promptInput,
                    "Fix grammar and puctuation in the following sentence: ",
                    event.clientY,
                    event.clientX
                );
                createButton(
                    "Spelling",
                    2,
                    promptInput,
                    "Fix spelling in the following sentence: ",
                    event.clientY,
                    event.clientX
                );
                createButton(
                    "Casual",
                    1,
                    promptInput,
                    "Make the following sentence more casual: ",
                    event.clientY,
                    event.clientX
                );

                createButton(
                    "Formal",
                    0,
                    promptInput,
                    "Make the following sentence more formal: ",
                    event.clientY,
                    event.clientX
                );
            }
        });
    } else {
        removeAllButtons();
    }
});

port.onMessage.addListener((message) => {
    if (message.result) {
        // Replace the content on the page with the fetched data
        console.log("Requesting to replace content on page");
        replaceTextOnPage(
            message.promptInput,
            convertLatexToSimpleText(message.result)
        );
    }
});

function removeAllButtons() {
    for (let i = 0; i < buttonIds.length; i++) {
        const btn = document.getElementById(buttonIds[i]);
        if (btn) {
            btn.remove();
        }
    }
}

function convertLatexToSimpleText(latexText) {
    // Remove LaTeX commands and symbols
    let simpleText = latexText
        .replace(/\\be/g, "") // Remove \be
        .replace(/\\env/g, "") // Remove \env
        .replace(/\\ee/g, "") // Remove \ee
        .replace(/\\cong/g, "is congruent to ") // Replace \cong with "is congruent to "
        .replace(/\\left/g, "") // Remove \left
        .replace(/\\right/g, "") // Remove \right
        .replace(/\\frac{([^}]+)}/g, "$1") // Remove \frac{...}
        .replace(/\{([^}]+)}/g, "$1") // Remove curly braces {...}
        .replace(/\$\$([^$]+)\$\$/g, "$1") // Remove $$...$$

        // Handle equations enclosed in $...$
        .replace(/\$([^$]+)\$/g, "$1") // Remove $...$

        // Replace LaTeX symbols with their corresponding text
        .replace(/\\bigcup/g, "union")
        .replace(/\\times/g, "times")
        .replace(/\\equiv/g, "equivalent to ")
        .replace(/\\partial/g, "partial");

    // Replace newlines and multiple spaces with single space
    simpleText = simpleText.replace(/\s+/g, " ").trim();

    return simpleText;
}

function replaceTextOnPage(promptInput, promptResult) {
    const textNodesAndInputs = document.evaluate(
        "//text() | //input[@type='text'] | //textarea",
        document,
        null,
        XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
        null
    );

    for (let i = 0; i < textNodesAndInputs.snapshotLength; i++) {
        const node = textNodesAndInputs.snapshotItem(i);

        if (
            node.nodeType === Node.ELEMENT_NODE &&
            (node.tagName === "INPUT" || node.tagName === "TEXTAREA")
        ) {
            // Handle input elements differently
            const inputValue = node.value;
            const modifiedInputValue = inputValue.replace(
                new RegExp(promptInput, "g"),
                promptResult
            );
            node.value = modifiedInputValue;
        } else if (node.nodeType === Node.TEXT_NODE) {
            // Handle text nodes
            const modifiedText = node.nodeValue.replace(
                new RegExp(promptInput, "g"),
                promptResult
            );
            node.nodeValue = modifiedText;
        }
    }
}

// From Plugin
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.promptInput && message.promptResult) {
        replaceTextOnPage(
            message.promptInput,
            convertLatexToSimpleText(message.promptResult)
        );
    }
});
