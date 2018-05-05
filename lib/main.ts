import { jsonToHTML, errorPage } from "./jsonformatter";

const jsonRequestIds = new Set<string>();

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
  console.log("JSONView listener", details);
  if (!jsonRequestIds.has(details.requestId)) {
    console.log("JSONView this isn't JSON");
    return;
  }

  const requestId = details.requestId;
  const filter = browser.webRequest.filterResponseData(details.requestId);

  // TODO: figure out encoding I guess
  const dec = new TextDecoder("utf-8");
  const enc = new TextEncoder();
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
    data: ArrayBuffer;
  }) => {
    console.log(event.data, event);
    if (jsonRequestIds.has(requestId)) {
      console.log("JSONView YEAH data");
    }
    content = content + dec.decode(event.data);
  };

  filter.onstop = (event: Event) => {
    console.log("JSONView finished", event, details);
    console.log("CONTENT", content);

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
    if (header.name === "Content-Type" && header.value && header.value.includes("application/json")) {
      console.log("JSONView found some JSON!");
      // TODO: replace headers
      header.value = "text/html";
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
  { urls: ["<all_urls>"], types: ["main_frame"] },
  ["blocking", "responseHeaders"]
);

// TODO: as far as I can tell, there's no way to intercept local files

/*
  *  Takes a JSON string and replaces number values with strings with a leading \u200B.
  *  Prior to this, it doubles any pre-existing \u200B characters. This Unicode value is
  *  a zero-width space, so doubling it won't affect the HTML view.
  *
  *  This addresses JSONView issue 21 (https://github.com/bhollis/jsonview/issues/21),
  *  where numbers larger than Number.MAX_SAFE_INTEGER get rounded to the nearest value
  *  that can fit in the mantissa. Instead we will string encode those numbers, and rely
  *  on JSONFormatter to detect the leading zero-width space, check the remainder of the
  *  string with !isNaN() for number-ness, and render it with number styling, sans-quotes.
  */
function safeStringEncodeNums(jsonString: string) {
  const viewString = jsonString.replace(/\u200B/g, "\u200B\u200B");

  // This has some memory of what its last state was
  let wasInQuotes = false;
  function isInsideQuotes(str: string) {
    let inQuotes = false;
    for (let i = 0; i < str.length; i++) {
      if (str[i] === '"') {
        let escaped = false;
        for (let lookback = i - 1; lookback >= 0; lookback--) {
          if (str[lookback] === '\\') {
            escaped = !escaped;
          } else {
            break;
          }
        }
        if (!escaped) {
          inQuotes = !inQuotes;
        }
      }
    }
    if (wasInQuotes) {
      inQuotes = !inQuotes;
    }
    wasInQuotes = inQuotes;
    return inQuotes;
  }

  let startIndex = 0;
  function replaceNumbers(match: string, index: number) {
    // Substring should be copy-on-write, and thus cheap
    const lookback = viewString.substring(startIndex, index);
    const insideQuotes = isInsideQuotes(lookback);
    startIndex = index + match.length;
    return insideQuotes ? match : `"\u200B${match}"`;
  }

  // JSON legal number matcher, Andrew Cheong, http://stackoverflow.com/questions/13340717
  const numberFinder = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/g;
  return viewString.replace(numberFinder, replaceNumbers);
}
