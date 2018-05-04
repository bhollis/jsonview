const jsonRequestIds = new Set<string>();

interface RequestDetails {
  requestId: string,
  url: string,
  method: string,
  frameId: number,
  parentFrameId: number,
  tabId: number,
  type: browser.webRequest.ResourceType,
  timeStamp: number,
  originUrl: string,
  statusLine: string,
  responseHeaders?: browser.webRequest.HttpHeaders,
  statusCode: number,
}

function listener(details: RequestDetails) {
  console.log("JSONView listener", details);
  if (!jsonRequestIds.has(details.requestId)) {
    console.log("JSONView this isn't JSON");
    return;
  }

  const requestId = details.requestId;
  const filter = browser.webRequest.filterResponseData(details.requestId);

  // TODO: figure out encoding I guess
  const enc = new TextDecoder("utf-8");
  let content = "";

  function disconnect() {
    console.log("JSONView disconnect filter");
    filter.disconnect();
    jsonRequestIds.delete(requestId);
  }

  filter.onstart = (event: Event) => {
    console.log("JSONView started", event, details);

    if (jsonRequestIds.has(requestId)) {
      console.log("JSONView YEAH start");
    } else {
      disconnect();
    }
  };

  filter.ondata = (event: Event & {
    data: ArrayBuffer
  }) => {
    console.log(event.data, event);
    filter.write(event.data);
    if (jsonRequestIds.has(requestId)) {
      console.log("JSONView YEAH data");
    }
    content = content + enc.decode(event.data);
  };

  filter.onstop = (event: Event) => {
    console.log("JSONView finished", event, details);
    console.log("CONTENT", content);
    disconnect();
  };
}

function detectJSON(event: RequestDetails) {
  console.log("JSONView headers", event);
  if (!event.responseHeaders) {
    return;
  }
  for (const header of event.responseHeaders) {
    if (header.name === "Content-Type" && header.value && header.value.includes("application/json")) {
      console.log("JSONView found some JSON!");
      jsonRequestIds.add(event.requestId);
      listener(event);
    }
  }

  return { responseHeaders: event.responseHeaders };
}

// Listen for onHeaderReceived for the target page.
// Set "blocking" and "responseHeaders".
browser.webRequest.onHeadersReceived.addListener(
  detectJSON,
  { urls: ["https://jsonview.com/*"], types: ["main_frame"] },
  ["blocking", "responseHeaders"]
);
