// This is what we'll insert into the HTTP Accept header
const jsonAcceptFragment = ',application/json;q=0.6';

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
