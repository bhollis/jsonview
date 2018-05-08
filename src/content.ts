import { errorPage, jsonToHTML } from './jsonformatter';
import { safeStringEncodeNums } from './safe-encode-numbers';
import { installCollapseEventListeners } from './collapse';

chrome.runtime.sendMessage({}, (response: boolean) => {
  if (!response) {
    return;
  }

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
