import { jsonToHTML, errorPage } from './jsonformatter';
import { safeStringEncodeNums } from './safe-encode-numbers';

console.log("JSONView init!");

const jsonUrls = new Set<string>();

// TODO: Do something for chrome in concert with a content script?
// Or maybe save the content off somehow and load it up again in a redirected page

function transformResponseToJSON(details: chrome.webRequest.WebResponseHeadersDetails) {
  // const requestId = details.requestId;
  const filter = browser.webRequest.filterResponseData(details.requestId);

  // TODO: figure out encoding I guess
  const dec = new TextDecoder("utf-8");
  const enc = new TextEncoder();
  let content = "";

  function disconnect() {
    filter.disconnect();
  }

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

    disconnect();
  };
}

function detectJSON(event: chrome.webRequest.WebResponseHeadersDetails) {
  console.log("JSONView headers", event);
  if (!event.responseHeaders) {
    return;
  }
  for (const header of event.responseHeaders) {
    // TODO: look for weird x+json types
    if (header.name === "Content-Type" && header.value && header.value.includes("application/json")) {
      console.log("JSONView found JSON!");
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

chrome.runtime.onMessage.addListener((message: any, sender: { url: string }, sendResponse: (response: any) => void) => {
  if ('filterResponseData' in chrome.webRequest) {
    sendResponse(false);
    return;
  }
  console.log("JSONView message: ", message, sender);
  sendResponse(jsonUrls.has(sender.url));
  jsonUrls.delete(sender.url);
});

// TODO: as far as I can tell, there's no way to intercept local files
