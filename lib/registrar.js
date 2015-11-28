/**
 * @author Benjamin Hollis
 * @author Quoc-Viet Nguyen
 */

let Cu = Components.utils;
let { devtools } = Cu.import("resource://gre/modules/devtools/Loader.jsm", {});
let require = devtools.require;

const prefsService = require('sdk/preferences/service');
const basePref = prefsService.get('extensions.jsonview@brh.numbera.com.sdk.baseURI');

const { Cc, Ci, components } = require("chrome");
const xpcom = require("sdk/platform/xpcom");

const { JSONView } = require(basePref + "lib/jsonview.js");
const categoryManager = Cc["@mozilla.org/categorymanager;1"].getService(Ci.nsICategoryManager);

const GECKO_VIEWER = "Gecko-Content-Viewers";

var services = [];

// Handle messages from the parent process.
addMessageListener("jsonview-onload", onLoad);
addMessageListener("jsonview-onunload", onUnload);

// Get a list of MIME types we should treat as JSON. This will
// always be a unique list that includes "application/json".
function getJsonContentTypes() {
  var contentTypes = prefsService.get('extensions.jsonview@brh.numbera.com.alternateContentTypes').split(/[,\s]+/);
  contentTypes.push("application/json");

  var unique = {};
  contentTypes = contentTypes
    // reject non-mime-type-looking stuff
    .filter(function(c) {
      // Note: allowing JSONView to handle text/html breaks the world
      return (c !== '') && (c !== 'text/html') && /\w+\/\w+/.test(c);
    })
    // unique
    .filter(function(e) {
      return !(e in unique) && (unique[e] = true);
    });

  return contentTypes;
}

function onLoad(options, callbacks) {
  getJsonContentTypes().forEach(function(contentType) {
    // Get a reference to the existing Gecko viewer for this content type, if it exists
    var geckoViewer;
    try {
      geckoViewer = categoryManager.getCategoryEntry(GECKO_VIEWER, contentType);
    } catch (err) {
      // The category entry doesn't have to exist.
    }

    // Create and register the a service for each content type
    // This component is an implementation of nsIStreamConverter that converts
    // application/json to html
    var contractId = "@mozilla.org/streamconv;1?from=" + contentType + "&to=*/*";
    var service = xpcom.Service({
      contract: contractId,
      Component: JSONView,
      register: false,
      unregister: false
    });

    // Keep track of everything so we can undo it in onUnload
    services.push({
      service: service,
      contentType: contentType,
      geckoViewer: geckoViewer
    });

    if (!xpcom.isRegistered(service)) {
      xpcom.register(service);
    }

    // Remove built-in JSON viewer
    categoryManager.deleteCategoryEntry(GECKO_VIEWER, contentType, false);
  });
}

function onUnload(reason) {
   services.forEach(function(serviceInfo) {
    if (xpcom.isRegistered(serviceInfo.service)) {
      xpcom.unregister(serviceInfo.service);
    }

    // Re-add built-in JSON viewer
    if (serviceInfo.geckoViewer) {
      categoryManager.addCategoryEntry(GECKO_VIEWER, serviceInfo.contentType, serviceInfo.geckoViewer, false, false);
    }
  });
  services = [];
}

// Register right away
onLoad();
