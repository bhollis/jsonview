/**
 * @author Benjamin Hollis
 * @author Quoc-Viet Nguyen
 */
const { Cu, Cc, Ci, components } = require("chrome");
const categoryManager = Cc["@mozilla.org/categorymanager;1"].getService(Ci.nsICategoryManager);
const globalMM = Cc["@mozilla.org/globalmessagemanager;1"].getService(Ci.nsIMessageListenerManager);

const prefs = require("./prefs");
const simplePrefs = require("sdk/simple-prefs");

// Append a timestamp to work around https://bugzilla.mozilla.org/show_bug.cgi?id=1051238
const url = module.uri.replace("main.js", "registrar.js") + "?" + Date.now();

function onLoad(options, callbacks) {
  globalMM.loadFrameScript(url, true);
  globalMM.broadcastAsyncMessage("jsonview-onload", prefs.getJsonContentTypes());

  prefs.register()
  simplePrefs.on("alternateContentTypes", debounce(function() {
    // Reload JSONView on content type change
    globalMM.broadcastAsyncMessage("jsonview-onunload");
    globalMM.broadcastAsyncMessage("jsonview-onload", prefs.getJsonContentTypes());
  }, 1000));

  // Tell Firefox that .json files are application/json
  categoryManager.addCategoryEntry('ext-to-type-mapping', 'json', 'application/json', false, true);
}

function onUnload(reason) {
  prefs.unregister();
  globalMM.broadcastAsyncMessage("jsonview-onunload");
  globalMM.removeDelayedFrameScript(url);
}

// From Underscore, because preferences update on every keystroke!
const { setTimeout } = require("sdk/timers");
function debounce(func, wait) {
  var timeout, args, context, timestamp, result;

  var later = function() {
    var last = Date.now() - timestamp;

    if (last < wait && last >= 0) {
      timeout = setTimeout(later, wait - last);
    } else {
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    }
  };

  return function() {
    context = this;
    args = arguments;
    timestamp = Date.now();
    if (!timeout) timeout = setTimeout(later, wait);

    return result;
  };
}

exports.main = onLoad;
exports.onUnload = onUnload;
