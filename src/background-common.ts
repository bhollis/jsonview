import { isJSONContentType } from "./content-type";

function isRedirect(status: number) {
  return status >= 300 && status < 400;
}

export function isEventJSON(
  event: chrome.webRequest.WebResponseHeadersDetails,
): chrome.webRequest.HttpHeader | undefined {
  if (
    !event.responseHeaders ||
    event.type !== "main_frame" ||
    event.tabId === -1 ||
    isRedirect(event.statusCode)
  ) {
    return undefined;
  }
  let contentTypeHeader: chrome.webRequest.HttpHeader | undefined = undefined;
  for (const header of event.responseHeaders) {
    if (header.name.toLowerCase() === "content-type") {
      if (header.value && isJSONContentType(header.value)) {
        // It's JSON, but it might be a Sharepoint page which is not actually
        // JSON. So save it, but don't return yet.
        contentTypeHeader = header;
      } else {
        // It's not JSON
        return undefined;
      }
    } else if (header.name.toLowerCase() === "microsoftsharepointteamservices") {
      // This is a Sharepoint page. Sharepoint's service worker will fetch JSON
      // page contents and turn it into HTML, but fails to change the
      // content-type of the response to be text/html. We must special case this
      // or else Sharepoint pages will be treated as JSON. See
      // https://github.com/bhollis/jsonview/issues/210
      return undefined;
    }
  }

  return contentTypeHeader;
}

// Install a message listener that listens for messages from the content script.
// The content script will ask if the page is JSON. We load our saved info and
// respond accordingly.
export function installMessageListener() {
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
    return true; // this means "we're going to call sendResponse asynchronously"
  });
}

// Add a URL to the session storage. This is used to remember that we
// have seen a JSON page.
export async function addJsonUrl(url: string) {
  await chrome.storage.session.set({ [url]: true });
}

// Check if we have a URL in the session storage. This is used to
// remember that we have seen a JSON page.
export async function hasJsonUrl(url: string) {
  const stored = await chrome.storage.session.get(url);
  const present = url in stored;
  await chrome.storage.session.remove(url);
  return present;
}
