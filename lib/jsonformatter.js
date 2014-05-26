/**
 * @author Benjamin Hollis
 *
 * This component provides a stream converter that can translate from JSON to HTML.
 */
const addonData = require("sdk/self").data;
const _ = require("sdk/l10n").get;

/*
 * The JSONFormatter helper object. This contains two major functions, jsonToHTML and errorPage,
 * each of which returns an HTML document.
 */
function JSONFormatter() { }

JSONFormatter.prototype = {
  /**
   * Encode a string to be used in HTML
   */
  htmlEncode: function(t) {
    return t !== null ? t.toString().replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;") : '';
  },

  /**
   * Completely escape a json string
   */
  jsString: function(s) {
    // Slice off the surrounding quotes
    s = JSON.stringify(s).slice(1, -1);
    return this.htmlEncode(s);
  },

  /**
   * Surround value with a span, including the given className
   */
  decorateWithSpan: function(value, className) {
    return '<span class="' + className + '">' + this.htmlEncode(value) + '</span>';
  },

  // Convert a basic JSON datatype (number, string, boolean, null, object, array) into an HTML fragment.
  valueToHTML: function(value, path) {
    var valueType = typeof value;

    if (value === null) {
      return this.decorateWithSpan('null', 'null');
    }
    else if (Array.isArray(value)) {
      return this.arrayToHTML(value, path);
    }
    else if (valueType == 'object') {
      return this.objectToHTML(value, path);
    }
    else if (valueType == 'number') {
      return this.decorateWithSpan(value, 'num');
    }
    else if (valueType == 'string') {
      if (/^(http|https|file):\/\/[^\s]+$/i.test(value)) {
        return '<a href="' + this.htmlEncode(value) + '"><span class="q">&quot;</span>' + this.jsString(value) + '<span class="q">&quot;</span></a>';
      } else {
        return '<span class="string">&quot;' + this.jsString(value) + '&quot;</span>';
      }
    }
    else if (valueType == 'boolean') {
      return this.decorateWithSpan(value, 'bool');
    }

    return '';
  },

  // Convert an array into an HTML fragment
  arrayToHTML: function(json, path) {
    var hasContents = false;
    var output = '';
    var numProps = 0;
    for (var prop in json) {
      numProps++;
    }

    for (var prop in json) {
      hasContents = true;
      var subPath = '';
      var escapedProp = JSON.stringify(prop).slice(1, -1);
      if(/^[0-9]{1,}$/.test(prop)) {
        subPath = path + '['+ escapedProp + ']';
      } else {
        subPath = path + '["' + escapedProp + '"]';
      }
      output += '<li>' + this.valueToHTML(json[prop], subPath);
      if ( numProps > 1 ) {
        output += ',';
      }
      output += '</li>';
      numProps--;
    }

    if ( hasContents ) {
      output = '<span class="collapser"></span>[<ul class="array collapsible">' + output + '</ul>]';
    } else {
      output = '[ ]';
    }

    return output;
  },

  // Convert a JSON object to an HTML fragment
  objectToHTML: function(json, path) {
    var hasContents = false;
    var output = '';
    var numProps = 0;
    for ( var prop in json ) {
      numProps++;
    }

    for ( var prop in json ) {
      hasContents = true;
      var subPath = '';
      var escapedProp = JSON.stringify(prop).slice(1, -1);
      if(/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(prop)) {
        subPath = path + '.' + escapedProp;
      } else {
        subPath = path + '["' + escapedProp + '"]';
      }
      output += '<li><span class="prop" title="' + this.htmlEncode(subPath) + '"><span class="q">&quot;</span>' + this.jsString(prop) +
                '<span class="q">&quot;</span></span>: ' + this.valueToHTML(json[prop], subPath);
      if ( numProps > 1 ) {
        output += ',';
      }
      output += '</li>';
      numProps--;
    }

    if ( hasContents ) {
      output = '<span class="collapser"></span>{<ul class="obj collapsible">' + output + '</ul>}';
    } else {
      output = '{ }';
    }

    return output;
  },

  // Convert a whole JSON value / JSONP response into a formatted HTML document
  jsonToHTML: function(json, callback, uri) {
    var output = '<div id="json">' +
                 this.valueToHTML(json, '<root>') +
                 '</div>';
    if (callback) {
      output = '<div class="callback">' + callback + '(</div>' +
               output +
               '<div class="callback">)</div>';
    }
    return this.toHTML(output, uri);
  },

  // Produce an error document for when parsing fails.
  errorPage: function(error, data, uri) {
    // Escape unicode nulls
    data = data.replace("\u0000","\uFFFD");

    var output = '<div id="error">' + _('errorParsing') + '</div>' +
                 '<h1>' + _('docContents') + ':</h1>' +
                 '<div id="json">' + this.htmlEncode(data) + '</div>';
    return this.toHTML(output, uri + ' - Error');
  },

  // Wrap the HTML fragment in a full document. Used by jsonToHTML and errorPage.
  toHTML: function(content, title) {
    return '<!DOCTYPE html>\n' +
      '<html><head><title>' + this.htmlEncode(title) + '</title>' +
      '<link rel="stylesheet" type="text/css" href="' + addonData.url("default.css") + '">' +
      '<script type="text/javascript" src="' + addonData.url("default.js") + '"></script>' +
      '</head><body>' +
      content +
      '</body></html>';
  }
};

exports.JSONFormatter = JSONFormatter;
