import { jsonToHTML, errorPage } from './jsonformatter';
import { safeStringEncodeNums } from './safe-encode-numbers';

/**
 * This is the background script that runs independent of any document. It listens to main frame requests
 * and kicks in if the headers indicate JSON. If we have the filterResponseData API available, we will use
 * that to directly change the content of the response to HTML. Otherwise we interface with a content script
 * to reformat the page.
 */

// Look for JSON if the content type is "application/json",
// or "application/whatever+json" or "application/json; charset=utf-8"
const jsonContentType = /^application\/([a-z]+\+)?json($|;)/;

// Keep track globally of URLs that contain JSON content.
const jsonUrls = new Set<string>();

function isRedirect(status: number) {
  return status >= 300 && status < 400;
}

/** Use the filterResponseData API to transform a JSON document to HTML. */
function transformResponseToJSON(details: chrome.webRequest.WebResponseHeadersDetails) {
  const filter = browser.webRequest.filterResponseData(details.requestId);

  const dec = new TextDecoder("utf-8");
  const enc = new TextEncoder();
  let content = "";

  filter.ondata = (event: Event & {
    data: ArrayBuffer;
  }) => {
    content = content + dec.decode(event.data);
  };

  filter.onstop = (_event: Event) => {
    let outputDoc = '';

    try {
      const jsonObj = JSON.parse(safeStringEncodeNums(content));
      outputDoc = jsonToHTML(jsonObj, details.url);
    } catch (e) {
      outputDoc = errorPage(e, content, details.url);
    }

    filter.write(enc.encode(outputDoc));

    filter.disconnect();
  };
}

function detectJSON(event: chrome.webRequest.WebResponseHeadersDetails) {
  if (!event.responseHeaders || isRedirect(event.statusCode)) {
    return;
  }
  for (const header of event.responseHeaders) {
    if (header.name.toLowerCase() === "content-type" && header.value && jsonContentType.test(header.value)) {
      if (typeof browser !== 'undefined' && 'filterResponseData' in browser.webRequest) {
        header.value = "text/html";
        transformResponseToJSON(event);
      } else {
        jsonUrls.add(event.url);
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

chrome.runtime.onMessage.addListener((_message: any, sender: { url: string }, sendResponse: (response: boolean) => void) => {
  if (sender.url.startsWith("file://") && sender.url.endsWith(".json")) {
    sendResponse(true);
    return;
  }
  // If we support this API, we don't need to invoke the content script.
  if ('filterResponseData' in chrome.webRequest) {
    sendResponse(false);
    return;
  }
  sendResponse(jsonUrls.has(sender.url));
  jsonUrls.delete(sender.url);
});
