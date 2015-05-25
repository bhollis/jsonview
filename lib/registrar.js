/**
 * @author Benjamin Hollis
 * @author Quoc-Viet Nguyen
 */

let Cu = Components.utils;
let { devtools } = Cu.import("resource://gre/modules/devtools/Loader.jsm", {});
let require = devtools.require;

const { Cc, Ci, components } = require("chrome");
const xpcom = require("sdk/platform/xpcom");
const { JSONView } = require("resource://jsonview-at-brh-dot-numbera-dot-com/jsonview/lib/jsonview.js");
const prefs = require("resource://jsonview-at-brh-dot-numbera-dot-com/jsonview/lib/prefs.js");

// This component is an implementation of nsIStreamConverter that converts
// application/json to html
const JSON_TYPE = "application/json";
const CONTRACT_ID = "@mozilla.org/streamconv;1?from=" + JSON_TYPE + "&to=*/*";
const CLASS_ID = "{64890660-53c4-11dd-ae16-0800200c9a66}";
const GECKO_VIEWER = "Gecko-Content-Viewers";

// Create and register the service
var service = xpcom.Service({
  id: components.ID(CLASS_ID),
  contract: CONTRACT_ID,
  Component: JSONView,
  register: false,
  unregister: false
});

// Hack to remove FF8+'s built-in JSON-as-text viewer
var categoryManager = Cc["@mozilla.org/categorymanager;1"].getService(Ci.nsICategoryManager);
var geckoViewer;
try {
  geckoViewer = categoryManager.getCategoryEntry(GECKO_VIEWER, JSON_TYPE);
} catch (err) {
  // The category entry doesn't have to exist.
}

// Handle messages from the parent process.
addMessageListener("jsonview-onload", onLoad);
addMessageListener("jsonview-onunload", onUnload);

function onLoad(options, callbacks) {
  //console.debug(options.loadReason);
  if (!xpcom.isRegistered(service)) {
    xpcom.register(service);
  }
  // Remove built-in JSON viewer
  categoryManager.deleteCategoryEntry(GECKO_VIEWER, JSON_TYPE, false);
  
  // Tell Firefox that .json files are application/json
  categoryManager.addCategoryEntry('ext-to-type-mapping', 'json', 'application/json', false, true);
  prefs.register();
};

function onUnload(reason) {
  if (xpcom.isRegistered(service)) {
    xpcom.unregister(service);
  }
  // Re-add built-in JSON viewer
  if (geckoViewer) {
    categoryManager.addCategoryEntry(GECKO_VIEWER, JSON_TYPE, geckoViewer, false, false);
  }
  prefs.unregister();
};
