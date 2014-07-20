/**
 * @author Benjamin Hollis
 * @author Quoc-Viet Nguyen
 */
const { Cc, Ci, components } = require("chrome");
const xpcom = require("sdk/platform/xpcom");
const { JSONView } = require("./jsonview");
const prefs = require("./prefs");

// This component is an implementation of nsIStreamConverter that converts
// application/json to html
const JSON_TYPE = "application/json";
const JSON_TYPES = ["application/json", "application/hal+json"];
const GECKO_VIEWER = "Gecko-Content-Viewers";

// Create and register the service
var services = [];
for (var i=0; i < JSON_TYPES.length; i++) {
  services[i] = xpcom.Service({
    contract: "@mozilla.org/streamconv;1?from=" + JSON_TYPES[i] + "&to=*/*",
    Component: JSONView,
    register: false,
    unregister: false
  });
}

// Hack to remove FF8+'s built-in JSON-as-text viewer
var categoryManager = Cc["@mozilla.org/categorymanager;1"].getService(Ci.nsICategoryManager);
var geckoViewer = categoryManager.getCategoryEntry(GECKO_VIEWER, JSON_TYPE);

function onLoad(options, callbacks) {
  console.debug(options.loadReason);
  for (var i=0; i < services.length; i++) {
    if (!xpcom.isRegistered(services[i])) {
      xpcom.register(services[i]);
    }
  }
  // Remove built-in JSON viewer
  categoryManager.deleteCategoryEntry(GECKO_VIEWER, JSON_TYPE, false);
  
  // Tell Firefox that .json files are application/json
  categoryManager.addCategoryEntry('ext-to-type-mapping', 'json', 'application/json', false, true);
  prefs.register();
};

function onUnload(reason) {
  for (var i=0; i < services.length; i++) {
    if (xpcom.isRegistered(services[i])) {
      xpcom.unregister(services[i]);
    }
  }
  // Re-add built-in JSON viewer
  categoryManager.addCategoryEntry(GECKO_VIEWER, JSON_TYPE, geckoViewer, false, false);
  prefs.unregister();
};

exports.main = onLoad;
exports.onUnload = onUnload;
