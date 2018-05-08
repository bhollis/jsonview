import { errorPage, jsonToHTML } from './jsonformatter';
import { safeStringEncodeNums } from './safe-encode-numbers';
import { installCollapseEventListeners } from './collapse';

/**
 * This script runs on every page. It communicates with the background script
 * to help decide whether to treat the contents of the page as JSON.
 */
chrome.runtime.sendMessage({}, (response: boolean) => {
  if (!response) {
    return;
  }

  // At least in chrome, the JSON is wrapped in a pre tag.
  const content = document.getElementsByTagName('pre')[0].innerText;
  let outputDoc = '';

  try {
    const jsonObj = JSON.parse(safeStringEncodeNums(content));
    outputDoc = jsonToHTML(jsonObj, document.URL);
  } catch (e) {
    outputDoc = errorPage(e, content, document.URL);
  }

  document.documentElement.innerHTML = outputDoc;
  installCollapseEventListeners();
});
