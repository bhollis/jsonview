import { jsonToHTML, errorPage } from './jsonformatter';
import { safeStringEncodeNums } from './safe-encode-numbers';

// const jsonRequestIds = new Set<string>();

// TODO: Do something for chrome in concert with a content script?
// Or maybe save the content off somehow and load it up again in a redirected page

interface RequestDetails {
  requestId: string;
  url: string;
  method: string;
  frameId: number;
  parentFrameId: number;
  tabId: number;
  type: browser.webRequest.ResourceType;
  timeStamp: number;
  originUrl: string;
  statusLine: string;
  responseHeaders?: browser.webRequest.HttpHeaders;
  statusCode: number;
}

function listener(details: RequestDetails) {
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

function detectJSON(event: RequestDetails) {
  console.log("JSONView headers", event);
  if (!event.responseHeaders) {
    return;
  }
  for (const header of event.responseHeaders) {
    // TODO: look for weird x+json types
    if (header.name === "Content-Type" && header.value && header.value.includes("application/json")) {
      header.value = "text/html";
      // TODO: this could be for chrome
      // jsonRequestIds.add(event.requestId);
      listener(event);
    }
  }

  return { responseHeaders: event.responseHeaders };
}

// Listen for onHeaderReceived for the target page.
// Set "blocking" and "responseHeaders".
browser.webRequest.onHeadersReceived.addListener(
  detectJSON,
  { urls: ["<all_urls>"], types: ["main_frame"] },
  ["blocking", "responseHeaders"]
);

// TODO: as far as I can tell, there's no way to intercept local files
