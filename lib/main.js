/**
 * @author Benjamin Hollis
 * @author Quoc-Viet Nguyen
 */
const { Cu, Cc, Ci, components } = require("chrome");

// Platform
const globalMM = Cc["@mozilla.org/globalmessagemanager;1"].
  getService(Ci.nsIMessageListenerManager);

const url = module.uri.replace("main.js", "registrar.js");

function onLoad(options, callbacks) {
  globalMM.loadFrameScript(url, true);
  globalMM.broadcastAsyncMessage("jsonview-onload");
};

function onUnload(reason) {
  globalMM.broadcastAsyncMessage("jsonview-onunload");
  globalMM.removeDelayedFrameScript(url);
};

exports.main = onLoad;
exports.onUnload = onUnload;
