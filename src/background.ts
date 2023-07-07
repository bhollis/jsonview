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

/**
 * Use the filterResponseData API to transform a JSON document to HTML. This
 * converts to the same HTML that Chrome does by default - it's only used in
 * Firefox.
 */
function transformResponseToJSON(details: chrome.webRequest.WebResponseHeadersDetails) {
  const filter = browser.webRequest.filterResponseData(details.requestId);

  const dec = new TextDecoder("utf-8");
  const enc = new TextEncoder();
  let content = "";

  filter.ondata = (event) => {
    content += dec.decode(event.data, { stream: true });
  };

  filter.onstop = (_event: Event) => {
    content += dec.decode();
    const outputDoc = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><pre>${content}</pre></body></html>`;
    filter.write(enc.encode(outputDoc));
    filter.disconnect();
  };
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
      if (typeof browser !== "undefined" && "filterResponseData" in browser.webRequest) {
        header.value = "text/html";
        transformResponseToJSON(event);
      }
    }
  }

  return { responseHeaders: event.responseHeaders };
}

// Listen for onHeaderReceived for the target page.
// Set "blocking" and "responseHeaders".
chrome.webRequest.onHeadersReceived.addListener(
  detectJSON,
  { urls: ["<all_urls>"], types: ["main_frame"] },
  ["blocking", "responseHeaders"]
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
