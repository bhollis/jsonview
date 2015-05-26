/**
 * @author Benjamin Hollis
 * @author Quoc-Viet Nguyen
 */

let Cu = Components.utils;
let { devtools } = Cu.import("resource://gre/modules/devtools/Loader.jsm", {});
let require = devtools.require;

const prefsService = require('sdk/preferences/service');
let basePref = prefsService.get('extensions.jsonview@brh.numbera.com.sdk.baseURI');

const { Cc, Ci, components } = require("chrome");
const xpcom = require("sdk/platform/xpcom");

// This component is an implementation of nsIStreamConverter that converts
// application/json to html
const JSON_TYPE = "application/json";
const CONTRACT_ID = "@mozilla.org/streamconv;1?from=" + JSON_TYPE + "&to=*/*";
const CLASS_ID = "{64890660-53c4-11dd-ae16-0800200c9a66}";
const GECKO_VIEWER = "Gecko-Content-Viewers";

const { JSONView } = require(basePref + "lib/jsonview.js");
const prefs = require(basePref+"lib/prefs.js");

var service = xpcom.Service({
  id: components.ID(CLASS_ID),
  contract: CONTRACT_ID,
  Component: JSONView,
  register: false,
  unregister: false
});

// Handle messages from the parent process.
addMessageListener("jsonview-onload", onLoad);
addMessageListener("jsonview-onunload", onUnload);

function onLoad(options, callbacks) {
  // Create and register the service

  // Hack to remove FF8+'s built-in JSON-as-text viewer
  var categoryManager = Cc["@mozilla.org/categorymanager;1"].getService(Ci.nsICategoryManager);
  var geckoViewer;
  try {
    geckoViewer = categoryManager.getCategoryEntry(GECKO_VIEWER, JSON_TYPE);
  } catch (err) {
    // The category entry doesn't have to exist.
  }

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
