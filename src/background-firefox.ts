/**
 * This is the background script that runs independent of any document. It
 * listens to main frame requests and records if the headers indicate the URL is
 * JSON. When the content script runs, it can ask this script if the page is
 * JSON, and if so, it will format the page.
 */

import { addJsonUrl, installMessageListener, isEventJSON } from "./background-common";

function detectJSON(event: chrome.webRequest.WebResponseHeadersDetails) {
  const header = isEventJSON(event);
  if (header) {
    addJsonUrl(event.url);
    // We need to change the content type to text/plain to prevent Firefox
    // from using its built-in JSON viewer.
    header.value = "text/plain; charset=UTF-8";
  }

  return { responseHeaders: event.responseHeaders };
}

// Listen for onHeaderReceived for the target page.
chrome.webRequest.onHeadersReceived.addListener(
  detectJSON,
  // Firefox cannot fire onHeadersReceived for local files.
  { urls: ["<all_urls>"], types: ["main_frame"] },
  // The blocking option is required to modify the response headers in detectJSON.
  ["blocking", "responseHeaders"],
);

installMessageListener();
