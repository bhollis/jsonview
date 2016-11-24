/**
 * @author Benjamin Hollis
 * @author Quoc-Viet Nguyen
 */
const { Cu, Cc, Ci, components } = require("chrome");
const categoryManager = Cc["@mozilla.org/categorymanager;1"].getService(Ci.nsICategoryManager);
const globalMM = Cc["@mozilla.org/globalmessagemanager;1"].getService(Ci.nsIMessageListenerManager);

// Append a timestamp to work around https://bugzilla.mozilla.org/show_bug.cgi?id=1051238
const url = module.uri.replace("main.js", "registrar.js") + "?" + Date.now();
const prefs = require("sdk/simple-prefs");
const prefsService = require('sdk/preferences/service');

// This is what we'll insert into the HTTP Accept header
// Technically we should include a quality parameter like "q=0.6" to
// say that we prefer non-JSON responses (like HTML) if possible.
// However, the primary need for sending this header is to work with
// CouchDB, and CouchDB has a bug (https://issues.apache.org/jira/browse/COUCHDB-234)
// that prevents it from understanding Accept headers with a quality parameter.
const JSON_HTTP_ACCEPT_FRAGMENT = ",application/json";
const JSON_HTTP_ACCEPT_PREF_NAME = "jsonHttpAccept";
const HTTP_ACCEPT_PREF_NAME = "network.http.accept.default";

// Called from httpAcceptChanged
function saveHttpAcceptPref(insertJSON) {
  var httpAcceptPref = prefsService.get(HTTP_ACCEPT_PREF_NAME);

  // Clear the fragment if it was already there
  httpAcceptPref = httpAcceptPref.replace(JSON_HTTP_ACCEPT_FRAGMENT, "");

  // Add it back in if our checkbox is checked
  if (insertJSON) {
    httpAcceptPref = httpAcceptPref + JSON_HTTP_ACCEPT_FRAGMENT;
  }

  // Set the value on the preference
  prefsService.set(HTTP_ACCEPT_PREF_NAME, httpAcceptPref);
}

function httpAcceptChanged(prefName) {
  if (prefName === JSON_HTTP_ACCEPT_PREF_NAME) {
    saveHttpAcceptPref(prefs.prefs[JSON_HTTP_ACCEPT_PREF_NAME]);
  }
}

// This is the entry point when the extension is loaded
function onLoad(options, callbacks) {
  globalMM.loadFrameScript(url, true);
  // The frame script will initialize itself when it loads, so no need to send it
  // a message.

  prefs.on(JSON_HTTP_ACCEPT_PREF_NAME, httpAcceptChanged);

  prefs.on("alternateContentTypes", debounce(function() {
    // Reload JSONView on content type change
    globalMM.broadcastAsyncMessage("jsonview-onunload");
    globalMM.broadcastAsyncMessage("jsonview-onload");
  }, 1000));

  // Tell Firefox that .json files are application/json
  categoryManager.addCategoryEntry('ext-to-type-mapping', 'json', 'application/json', false, true);
}

// This is called when the extension is unloaded
function onUnload(reason) {
  prefs.removeListener(JSON_HTTP_ACCEPT_PREF_NAME, httpAcceptChanged);
  // Remove JSON from HTTP Accept header if it has been inserted
  if (prefs.prefs[JSON_HTTP_ACCEPT_PREF_NAME]) {
    saveHttpAcceptPref(false);
  }

  globalMM.broadcastAsyncMessage("jsonview-onunload");
  globalMM.removeDelayedFrameScript(url);
}

// From Underscore, because preferences update on every keystroke!
const { setTimeout } = require("sdk/timers");
function debounce(func, wait) {
  var timeout;
  var args;
  var context;
  var timestamp;
  var result;

  var later = function() {
    var last = Date.now() - timestamp;

    if (last < wait && last >= 0) {
      timeout = setTimeout(later, wait - last);
    } else {
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) {
        context = args = null;
      }
    }
  };

  return function() {
    context = this;
    args = arguments;
    timestamp = Date.now();
    if (!timeout) {
      timeout = setTimeout(later, wait);
    }

    return result;
  };
}

exports.main = onLoad;
exports.onUnload = onUnload;
