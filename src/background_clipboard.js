//
// Routines for accessing the clipboard from the background service worker.
//


//
// As of September 2023, manifest version 3 requires a workaround to
// achieve this using an offscreen document.
//

let creating; // A global promise to avoid concurrency issues
async function setupOffscreenDocument(path) {
    // Check all windows controlled by the service worker to see if one
    // of them is the offscreen document with the given path.
    const offscreenUrl = chrome.runtime.getURL(path);
    const existingContexts = await chrome.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT'],
        documentUrls: [offscreenUrl]
    });

    if (existingContexts.length > 0) {
        return;
    }

    // create offscreen document
    if (creating) {
        await creating;
    } else {
        creating = chrome.offscreen.createDocument({
            url: path,
            reasons: ['CLIPBOARD'],
            justification: 'Reading and writing text from/to the clipboard',
        });
        await creating;
        creating = null;
    }
}

async function createOffscreenDocument() {
    await setupOffscreenDocument('background_clipboard_offscreen.html');
}


//
// The actual routines using the offscreen document.
//

export async function getClipboard() {
    await createOffscreenDocument();
    let response = await chrome.runtime.sendMessage({
        type: 'getClipboard',
        target: 'background_clipboard_offscreen'
    });
    return response.value;
};

export async function putClipboard(text) {
    await createOffscreenDocument();
    await chrome.runtime.sendMessage({
        type: 'putClipboard',
        target: 'background_clipboard_offscreen',
        value: text
    });
};
