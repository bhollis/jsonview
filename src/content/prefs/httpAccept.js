// This is what we'll insert into the HTTP Accept header
// Technically we should include a quality parameter like "q=0.6" to 
// say that we prefer non-JSON responses (like HTML) if possible. 
// However, the primary need for sending this header is to work with 
// CouchDB, and CouchDB has a bug (https://issues.apache.org/jira/browse/COUCHDB-234) 
// that prevents it from understanding Accept headers with a quality parameter. 
const jsonAcceptFragment = ',application/json';

// Little helper to get the right pref
function getHttpAcceptPref() {
  return Application.prefs.get('network.http.accept.default').value;
}

// Helper for getting the checkbox
function getHttpAcceptCheckbox() {
  return document.getElementById('httpAcceptCheckbox');
}

// Called when the prefpane loads. Set the checkbox state from the preferences
function setupUIFromPrefs() {
  getHttpAcceptCheckbox().checked = (getHttpAcceptPref().indexOf(jsonAcceptFragment) >= 0);
}

// Called from ondialogaccept
function saveHttpAcceptPref() {     
  var httpAcceptPref = getHttpAcceptPref();
    
  // Clear the fragment if it was already there
  httpAcceptPref = httpAcceptPref.replace(jsonAcceptFragment, '');
  
  // Add it back in if our checkbox is checked  
  if ( getHttpAcceptCheckbox().checked ) {
    httpAcceptPref = httpAcceptPref + jsonAcceptFragment;
  }

  // Set the value on the preference element, which sets the actual preference in a roundabout way
  document.getElementById('httpAcceptDefault').value = httpAcceptPref;
}
