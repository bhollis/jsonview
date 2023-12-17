import { errorPage, jsonToHTML } from "./jsonformatter";

import { installCollapseEventListeners } from "./collapse";
import { safeStringEncodeNums } from "./safe-encode-numbers";

/**
 * This script runs on every page. It communicates with the background script
 * to help decide whether to treat the contents of the page as JSON.
 */
chrome.runtime.sendMessage("jsonview-is-json", (response: boolean) => {
  if (!response) {
    return;
  }

  // At least in chrome, the JSON is wrapped in a pre tag.
  const jsonElems = document.getElementsByTagName("pre");
  let content: string | null = null;
  if (jsonElems.length >= 1) {
    content = jsonElems[0].textContent;
  } else {
    // Sometimes there's no pre? I'm not sure why this would happen
    content = document.body.textContent;
  }
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
});
