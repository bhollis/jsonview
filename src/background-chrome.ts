/**
 * This is the background script that runs independent of any document. It
 * listens to main frame requests and records if the headers indicate the URL is
 * JSON. When the content script runs, it can ask this script if the page is
 * JSON, and if so, it will format the page.
 */

import { addJsonUrl, installMessageListener, isEventJSON } from "./background-common";

function detectJSON(event: chrome.webRequest.WebResponseHeadersDetails) {
  if (isEventJSON(event)) {
    addJsonUrl(event.url);
  }

  return { responseHeaders: event.responseHeaders };
}

// Listen for onHeaderReceived for the target page.
chrome.webRequest.onHeadersReceived.addListener(
  detectJSON,
  { urls: ["<all_urls>"], types: ["main_frame"] },
  ["responseHeaders"],
);

installMessageListener();
