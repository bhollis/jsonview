/**
 * @author Benjamin Hollis
 * @author Quoc-Viet Nguyen
 */
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

// Called from onPrefChange
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

function onPrefChange(prefName) {
  if (prefName == JSON_HTTP_ACCEPT_PREF_NAME) {
    saveHttpAcceptPref(prefs.prefs[JSON_HTTP_ACCEPT_PREF_NAME]);
  }
}

function register() {
  prefs.on("", onPrefChange);
}

function unregister() {
  prefs.removeListener("", onPrefChange);
  // Remove JSON from HTTP Accept header if it has been inserted
  if (prefs.prefs[JSON_HTTP_ACCEPT_PREF_NAME]) {
    saveHttpAcceptPref(false);
  }
}

exports.register = register;
exports.unregister = unregister;
