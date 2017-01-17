/**
 * @author Benjamin Hollis
 *
 * This component provides a stream converter that can translate from JSON to HTML.
 */
const { Class } = require("sdk/core/heritage");
const { Unknown } = require("sdk/platform/xpcom");
const { Cc, Ci } = require("chrome");
const { JSONFormatter } = require("./jsonformatter");

// This defines an object that implements our converter, and is set up to be XPCOM-ified by XPCOMUtils
var JSONView = Class({
  extends: Unknown,
  interfaces: [
    "nsIStreamConverter",
    "nsIStreamListener",
    "nsIRequestObserver"
  ],
  get wrappedJSObject() { return this; },

  // JSONView class constructor. Not much to see here.
  initialize: function() {
    this.jsonFormatter = new JSONFormatter();
  },

  /*
   * This component works as such:
   * 1. asyncConvertData captures the listener
   * 2. onStartRequest fires, initializes stuff, modifies the listener to match our output type
   * 3. onDataAvailable transcodes the data into a UTF-8 string
   * 4. onStopRequest gets the collected data and converts it, spits it to the listener
   * 5. convert does nothing, it's just the synchronous version of asyncConvertData
   */

  // nsIStreamConverter::convert
  convert: function(aFromStream, aFromType, aToType, aCtxt) {
    return aFromStream;
  },

  // nsIStreamConverter::asyncConvertData
  asyncConvertData: function(aFromType, aToType, aListener, aCtxt) {
    // Store the listener passed to us
    this.listener = aListener;
  },

  // nsIStreamListener::onDataAvailable
  onDataAvailable: function(aRequest, aContext, aInputStream, aOffset, aCount) {
    // From https://developer.mozilla.org/en/Reading_textual_data
    var is = Cc["@mozilla.org/intl/converter-input-stream;1"].createInstance(Ci.nsIConverterInputStream);
    is.init(aInputStream, this.charset, -1, Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);

    // This used to read in a loop until readString returned 0, but it caused it to crash Firefox on OSX/Win32 (but not Win64)
    // It seems just reading once with -1 (default buffer size) gets the file done.
    // However, *not* reading in a loop seems to cause problems with Firebug
    // So I read in a loop, but do whatever I can to avoid infinite-looping.
    var totalBytesRead = 0;
    var bytesRead = 1; // Seed it with something positive

    while (totalBytesRead < aCount && bytesRead > 0) {
      var str = {};
      bytesRead = is.readString(-1, str);
      totalBytesRead += bytesRead;
      this.data += str.value;
    }
  },

  // nsIRequestObserver::onStartRequest
  onStartRequest: function(aRequest, aContext) {
    this.data = '';
    this.uri = aRequest.QueryInterface(Ci.nsIChannel).URI.spec;

    // Sets the charset if it is available. (For documents loaded from the
    // filesystem, this is not set.)
    this.charset = aRequest.QueryInterface(Ci.nsIChannel).contentCharset || 'UTF-8';

    this.channel = aRequest;
    this.channel.contentType = "text/html";
    // All our data will be coerced to UTF-8
    this.channel.contentCharset = "UTF-8";

    this.listener.onStartRequest(this.channel, aContext);
  },

  /*
   *  Takes a JSON string and replaces number values with strings with a leading \u200B.
   *  Prior to this, it doubles any pre-existing \u200B characters. This Unicode value is
   *  a zero-width space, so doubling it won't affect the HTML view.
   *
   *  This addresses JSONView issue 21 (https://github.com/bhollis/jsonview/issues/21),
   *  where numbers larger than Number.MAX_SAFE_INTEGER get rounded to the nearest value
   *  that can fit in the mantissa. Instead we will string encode those numbers, and rely
   *  on JSONFormatter to detect the leading zero-width space, check the remainder of the
   *  string with !isNaN() for number-ness, and render it with number styling, sans-quotes.
   */
  safeStringEncodeNums: function(jsonString) {
    var viewString = jsonString.replace(/\u200B/g, "\u200B\u200B");

    // Find unescaped quotes by searching for a non-backslash followed by 0 or even
    // pairs of backslashes, then a quote
    var quoteFinder = /[^\\\n\r]*?(\\\\)*"/gm;

    // This has some memory of what its last state was
    var wasInQuotes = false;
    function isInsideQuotes(str) {
      var inQuotes = false;
      for (var i = 0; i < str.length; i++) {
        if (str[i] === '"') {
          var escaped =
                (i > 0 && str[i - 1] === '\\') &&
                (i > 1 && str[i - 2] !== '\\');
          if (!escaped) {
            inQuotes = !inQuotes;
          }
        }
      }
      if (wasInQuotes) {
        inQuotes = !inQuotes;
      }
      wasInQuotes = inQuotes;
      return inQuotes;
    }

    var startIndex = 0;
    function replaceNumbers(match, index) {
      // Substring should be copy-on-write, and thus cheap
      var lookback = viewString.substring(startIndex, index);
      var insideQuotes = isInsideQuotes(lookback);
      startIndex = index + match.length;
      return insideQuotes ? match : '"\u200B' + match + '"';
    }

    // JSON legal number matcher, Andrew Cheong, http://stackoverflow.com/questions/13340717
    var numberFinder = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/g;
    return viewString.replace(numberFinder, replaceNumbers);
  },

  // nsIRequestObserver::onStopRequest
  onStopRequest: function(aRequest, aContext, aStatusCode) {
    /*
     * This should go something like this:
     * 1. Make sure we have a unicode string.
     * 2. Convert it to a Javascript object.
     * 2.1 Removes the callback
     * 3. Convert that to HTML? Or XUL?
     * 4. Spit it back out at the listener
     */

    var outputDoc = '';

    try {
      var jsonObj = JSON.parse(this.safeStringEncodeNums(this.data));
      outputDoc = this.jsonFormatter.jsonToHTML(jsonObj, this.uri);
    } catch (e) {
      outputDoc = this.jsonFormatter.errorPage(e, this.data, this.uri);
    }

    // I don't really understand this part, but basically it's a way to get our UTF-8 stuff
    // spit back out as a byte stream
    // See http://www.mail-archive.com/mozilla-xpcom@mozilla.org/msg04194.html
    var storage = Cc["@mozilla.org/storagestream;1"].createInstance(Ci.nsIStorageStream);

    // I have no idea what to pick for the first parameter (segments)
    storage.init(4, 0xffffffff, null);
    var out = storage.getOutputStream(0);

    var binout = Cc["@mozilla.org/binaryoutputstream;1"]
    .createInstance(Ci.nsIBinaryOutputStream);
    binout.setOutputStream(out);
    binout.writeUtf8Z(outputDoc);
    binout.close();

    // I can't explain it, but we need to trim 4 bytes off the front or else it includes random crap
    var trunc = 4;
    var instream = storage.newInputStream(trunc);

    // Pass the data to the main content listener
    this.listener.onDataAvailable(this.channel, aContext, instream, 0, storage.length - trunc);

    this.listener.onStopRequest(this.channel, aContext, aStatusCode);
  }
});

exports.JSONView = JSONView;
