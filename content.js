// content.js
let buttonIds = [];
const port = chrome.runtime.connect({ name: "content" });

function createButton(text, position, promptInput, promptAction, boundingRect) {
    const button = document.createElement("button");
    button.innerText = text;
    button.id = "Intellithing-" + text + "-Button";
    buttonIds.push(button.id);

    button.style.position = "fixed";
    button.style.top = `${boundingRect.top - position * 32}px`;
    button.style.left = `${boundingRect.right}px`;

    button.style.width = "30px";
    button.style.height = "30px";
    button.style.borderRadius = "50%";
    button.style.zIndex = "900";

    button.style.color = "#fff";
    button.style.textAlign = "center";
    button.style.backgroundColor = "#1ca4ad";
    button.style.border = "none";

    button.addEventListener("click", () => {
        console.log("Button Click");
        port.postMessage({
            action: "NewPrompt",
            promptInput: promptInput,
            promptAction: promptAction,
        });
    });
    document.body.appendChild(button);
}

document.addEventListener("mouseup", function () {
    const promptInput = window.getSelection().toString().trim();
    const selectionRange = window.getSelection().getRangeAt(0);
    const boundingRect = selectionRange.getBoundingClientRect();

    if (promptInput) {
        createButton("R", 3, promptInput, "", boundingRect);
        createButton(
            "P",
            2,
            promptInput,
            "Fix Punctuation Mistakes",
            boundingRect
        );
        createButton(
            "S",
            1,
            promptInput,
            "Fix Spelling Mistakes",
            boundingRect
        );

        createButton("G", 0, promptInput, "Fix Grammar Mistakes", boundingRect);
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
    const textNodes = document.evaluate(
        "//text()",
        document,
        null,
        XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
        null
    );

    for (let i = 0; i < textNodes.snapshotLength; i++) {
        const node = textNodes.snapshotItem(i);
        const modifiedText = node.nodeValue.replace(
            new RegExp(promptInput, "g"),
            promptResult
        );
        node.nodeValue = modifiedText;
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
