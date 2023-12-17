/**
 * This is the background script that runs independent of any document. It
 * listens to main frame requests and kicks in if the headers indicate JSON. If
 * we have the filterResponseData API available, we will use that to change the
 * page to what Chrome displays for JSON (this is only used in Firefox). Then a
 * content script reformats the page.
 */

import { isJSONContentType } from "./content-type";

// Keep track globally of URLs that contain JSON content.
const jsonUrls = new Set<string>();

function isRedirect(status: number) {
  return status >= 300 && status < 400;
}

function detectJSON(event: chrome.webRequest.WebResponseHeadersDetails) {
  if (!event.responseHeaders || isRedirect(event.statusCode)) {
    return;
  }
  for (const header of event.responseHeaders) {
    if (
      header.name.toLowerCase() === "content-type" &&
      header.value &&
      isJSONContentType(header.value)
    ) {
      jsonUrls.add(event.url);
    }
  }

  return { responseHeaders: event.responseHeaders };
}

// Listen for onHeaderReceived for the target page.
chrome.webRequest.onHeadersReceived.addListener(
  detectJSON,
  { urls: ["<all_urls>"], types: ["main_frame"] },
  ["responseHeaders"]
);

// Listen for a message from the content script to decide whether to operate on
// the page. Calls sendResponse with a boolean that's true if the content script
// should run, and false otherwise.
chrome.runtime.onMessage.addListener((_message, sender, sendResponse) => {
  if (sender.url?.startsWith("file://") && sender.url.endsWith(".json")) {
    sendResponse(true);
    return;
  }
  sendResponse(sender.url && jsonUrls.has(sender.url));
  if (sender.url) {
    jsonUrls.delete(sender.url);
  }
});
