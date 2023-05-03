import { errorPage, jsonToHTML } from "./jsonformatter";

import { installCollapseEventListeners } from "./collapse";
import { safeStringEncodeNums } from "./safe-encode-numbers";

function setJsonAsGlobalVariable(jsonObj: JSON) {
  const script = document.createElement("script");
  const jsonStr = JSON.stringify(jsonObj).replace(/\\/g, "\\\\");
  script.text = `window.data=JSON.parse('${jsonStr}');`;
  document.documentElement.appendChild(script);

  // log info message
  // with this queueMicrotask user can not see source file information in log
  queueMicrotask(() =>
    console.log(
      "%c%s%c%s",
      "color: green; font-size: 16px;",
      "JSON is exposed as variable called ",
      "background-color: rgba(175, 184, 193, 0.2); font-size: 16px; margin: 0; padding: 0.2em 0.4em; border-radius: 6px",
      "data"
    )
  );
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

  if (content === null) {
    outputDoc = errorPage(new Error("No content"), "", document.URL);
  } else {
    try {
      const jsonObj = JSON.parse(safeStringEncodeNums(content));
      outputDoc = jsonToHTML(jsonObj, document.URL);

      setJsonAsGlobalVariable(jsonObj);
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
