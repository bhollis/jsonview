/**
 * This is the background script that runs independent of any document. It
 * listens to main frame requests and kicks in if the headers indicate JSON. If
 * we have the filterResponseData API available, we will use that to change the
 * page to what Chrome displays for JSON (this is only used in Firefox). Then a
 * content script reformats the page.
 */

import { isJSONContentType } from "./content-type";

function isRedirect(status: number) {
  return status >= 300 && status < 400;
}

function detectJSON(event: chrome.webRequest.WebResponseHeadersDetails) {
  if (!event.responseHeaders || event.type !== "main_frame" || isRedirect(event.statusCode)) {
    return;
  }
  for (const header of event.responseHeaders) {
    if (
      header.name.toLowerCase() === "content-type" &&
      header.value &&
      isJSONContentType(header.value)
    ) {
      addJsonUrl(event.url);
      if (typeof browser !== "undefined" && "filterResponseData" in browser.webRequest) {
        // We need to change the content type to text/plain to prevent Firefox
        // from using its built-in JSON viewer.
        header.value = "text/plain; charset=UTF-8";
      }
      break;
    }
  }

  return { responseHeaders: event.responseHeaders };
}

// Listen for onHeaderReceived for the target page.
chrome.webRequest.onHeadersReceived.addListener(
  detectJSON,
  // Firefox cannot fire onHeadersReceived for local files.
  { urls: ["<all_urls>"], types: ["main_frame"] },
  ["blocking", "responseHeaders"],
);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message !== "jsonview-is-json") {
    return;
  }

  if (!sender.url) {
    sendResponse(false);
    return;
  }

  if (sender.url.startsWith("file://") && sender.url.endsWith(".json")) {
    sendResponse(true);
    return;
  }

  hasJsonUrl(sender.url).then(sendResponse);
  return true; // this means "we're going to sendResponse asynchronously"
});

async function addJsonUrl(url: string) {
  await chrome.storage.session.set({ [url]: true });
}

async function hasJsonUrl(url: string) {
  const stored = await chrome.storage.session.get(url);
  const present = url in stored;
  await chrome.storage.session.remove(url);
  return present;
}
