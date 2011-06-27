// http://xulsolutions.blogspot.com/2006/07/creating-uninstall-script-for.html

// in both cases:
// detect disable, cancel
// if disabled and disable not canceled, remove at shutdown
// ditto with uninstall?
// otherwise, always make pref match

// cancel can mean either "don't uninstall" or "don't disable". "don't uninstall" can still be disabled
// addon.userDisabled is the most interesting thing here (though uninstalling doesn't trigger it)

// also set up header via pref state

// detect disabling/uninstalling, set "needsCleanup " flag
// detect cancel, clear flag if no longer uninstalling/disabling (see pendingOperations == 0?)
// listen for app shutdown, if we need cleanup, clear out prefs

(function() {
  const JSONVIEW_EXTENSION_ID = "jsonview@brh.numbera.com";
  const jsonAcceptFragment = ',application/json';

  var AddonLifeCycleListener = {
    needsCleanup: false,
    isJSONView: function(addon) {
      return addon.id == JSONVIEW_EXTENSION_ID;
    },
    // Firefox 4+ has the AddonManager interface, which uses these events
    onDisabling: function(addon, needsRestart) {
      this.needsCleanup = true;
    },
    onUninstalling: function(addon, needsRestart) {
      this.needsCleanup = true;
    },
    onOperationCancelled: function(addon) {
      if (!(addon.pendingOperations & (PENDING_DISABLE | PENDING_UNINSTALL))) {
        this.needsCleanup = false;
      }
    },
	  observe : function(subject, topic, data) {
      // Firefox 3 sends Addon Manager events through this interface
		  if (topic == "em-action-requested") {
			  subject.QueryInterface(Components.interfaces.nsIUpdateItem);

        if (subject.id == JSONVIEW_EXTENSION_ID) {
				  if (data == "item-uninstalled") {
            this.needsCleanup = true;
				  } else if (data == "item-cancel-action") {
            this.needsCleanup = false;
				  } else if (data == "item-disabled") {
            this.needsCleanup = true;
				  }
        }
		  } else if (topic == "quit-application-granted") {
			  if (this.needsCleanup) {
          // Remove JSONView's customization of the http accept header
          var httpAcceptPref = Application.prefs.get('network.http.accept.default').value
          httpAcceptPref = httpAcceptPref.replace(jsonAcceptFragment, '');
          Application.prefs.get('network.http.accept.default').value = httpAcceptPref;
			  }
			  this.unregister();
		  }
	  },
    register : function() {
		  var observerService =
			  Components.classes["@mozilla.org/observer-service;1"].
			  getService(Components.interfaces.nsIObserverService);

		  observerService.addObserver(this, "em-action-requested", false);
		  observerService.addObserver(this, "quit-application-granted", false);
      if (AddonManager) {
        AddonManager.addAddonListener(this);
      }
	  },
	  unregister : function() {
		  var observerService =
			  Components.classes["@mozilla.org/observer-service;1"].
			  getService(Components.interfaces.nsIObserverService);

		  observerService.removeObserver(this,"em-action-requested");
		  observerService.removeObserver(this,"quit-application-granted");
      if (AddonManager) {
        AddonManager.removeAddonListener(this);
      }
	  }
  }

  // TODO: Bug? Disabling / uninstalling JSONView then putting it back clears the accept header pref
  
  window.addEventListener("load", function() { AddonLifeCycleListener.register() }, false);
})();