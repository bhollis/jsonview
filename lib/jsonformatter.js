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
   * Is this a valid "bare" property name?
   */
  isBareProp: function(prop) {
    return /^[A-Za-z_$][A-Za-z0-9_\-$]*$/.test(prop);
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
    if (json.length == 0) {
      return '[ ]';
    }

    var output = '';
    for (var i = 0; i < json.length; i++) {
      var subPath = path + '[' + i + ']';
      output += '<li>' + this.valueToHTML(json[i], subPath);
      if (i < json.length - 1) {
        output += ',';
      }
      output += '</li>';
    }
    return '<span class="collapser"></span>[<ul class="array collapsible">' + output + '</ul>]';
  },

  // Convert a JSON object to an HTML fragment
  objectToHTML: function(json, path) {
    var numProps = Object.keys(json).length;
    if (numProps == 0) {
      return '{ }';
    }

    var output = '';
    for (var prop in json) {
      var subPath = '';
      var escapedProp = JSON.stringify(prop).slice(1, -1);
      var bare = this.isBareProp(prop);
      if (bare) {
        subPath = path + '.' + escapedProp;
      } else {
        escapedProp = '"' + escapedProp + '"';
      }
      output += '<li><span class="prop' + (bare ? '' : ' quoted') + '" title="' + this.htmlEncode(subPath) +
        '"><span class="q">&quot;</span>' + this.jsString(prop) +
        '<span class="q">&quot;</span></span>: ' + this.valueToHTML(json[prop], subPath);
      if (numProps > 1) {
        output += ',';
      }
      output += '</li>';
      numProps--;
    }

    return '<span class="collapser"></span>{<ul class="obj collapsible">' + output + '</ul>}';
  },

  // Convert a whole JSON value / JSONP response into a formatted HTML document
  jsonToHTML: function(json, callback, uri) {
    var output = '<div id="json">' + this.valueToHTML(json, '<root>') + '</div>';
    if (callback) {
      output = '<div class="callback">' + callback + '(</div>' + output + '<div class="callback">)</div>';
    }
    return this.toHTML(output, uri);
  },

  // Clean up a JSON parsing error message
  massageError: function(error) {
    var message = error.message.replace(/^JSON.parse: /, '').replace(/of the JSON data/, '');
    var parts = /line (\d+) column (\d+)/.exec(message);

    return {
      message: this.htmlEncode(message),
      line: +parts[1],
      column: +parts[2]
    }
  },

  highlightError: function(data, lineNum, columnNum) {
    if (!lineNum || !columnNum) {
      return this.htmlEncode(data);
    }

    var lines = data.match(/^.*((\r\n|\n|\r)|$)/gm);

    var output = '';
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];

      if (i == lineNum - 1) {
        output += '<span class="errorline">';
        output += this.htmlEncode(line.substring(0, columnNum - 1)) + '<span class="errorcolumn">' + this.htmlEncode(line[columnNum - 1]) + '</span>' + this.htmlEncode(line.substring(columnNum));
        output += '</span>';
      } else {
        output += this.htmlEncode(line);
      }
    }

    return output;
  },

  // Produce an error document for when parsing fails.
  errorPage: function(error, data, uri) {
    // Escape unicode nulls
    data = data.replace("\u0000","\uFFFD");

    var errorInfo = this.massageError(error);

    var output = '<div id="error">' + _('errorParsing')
    if (errorInfo.message) {
      output += '<div class="errormessage">' + errorInfo.message + '</div>';
    }
    output += '</div><div id="json">' + this.highlightError(data, errorInfo.line, errorInfo.column) + '</div>';
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
