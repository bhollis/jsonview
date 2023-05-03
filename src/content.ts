import { errorPage, jsonToHTML } from "./jsonformatter";

import { installCollapseEventListeners } from "./collapse";
import { safeStringEncodeNums } from "./safe-encode-numbers";

function setJsonAsGlobalVariable(this: any, jsonObj: any) {
  const script = document.createElement("script");
  script.text = `Object.defineProperty(window, 'data', { value: ${JSON.stringify(
    jsonObj
  )}, writable: false, configurable: false });`;
  document.documentElement.appendChild(script);

  // log info message
  // with this queueMicrotask user can not see source file information in log
  queueMicrotask(() => console.log('JSON is exposed as a global variable called "data"'));
}

/**
 * This script runs on every page. It communicates with the background script
 * to help decide whether to treat the contents of the page as JSON.
 */
chrome.runtime.sendMessage({}, (response: boolean) => {
  if (!response) {
    return;
  }

  // At least in chrome, the JSON is wrapped in a pre tag.
  const content = document.getElementsByTagName("pre")[0].textContent;
  let outputDoc = "";
  let jsonObj = null;

  if (content === null) {
    outputDoc = errorPage(new Error("No content"), "", document.URL);
  } else {
    try {
      jsonObj = JSON.parse(safeStringEncodeNums(content));
      outputDoc = jsonToHTML(jsonObj, document.URL);
    } catch (e: any) {
      outputDoc = errorPage(
        e instanceof Error ? e : new Error(e.toString()),
        content,
        document.URL
      );
    }
  }

  document.documentElement.innerHTML = outputDoc;
  installCollapseEventListeners();
  setJsonAsGlobalVariable(jsonObj);
});
