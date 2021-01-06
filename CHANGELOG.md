JSONView 2.3.0
---
* Switch to a dark theme when your system is set to dark mode.

JSONView 2.2.1
---
* Escape single quotes in generated HTML.

JSONView 2.2.0
---
* Do not read content type from redirect responses

JSONView 2.1.0
---
* Ignore case when checking headers.

JSONView 2.0.1
---
* Force encoding to UTF-8.

JSONView 2.0.0
---
* JSONView has been rewritten with the new WebExtension model, and is now compatible with Firefox 57+ and Google Chrome.
* JSONView will now highlight any content type matching "application/*+json" in addition to "application/json".
* Due to the new extension model, the ability to add "application/json" to the Accept header has been removed.
* Removed the preference to use the built-in Firefox JSON viewer.

JSONView 1.2.4
---
* Fixed a case where JSON would fail to parse if a string containing a number was preceded by a quote that was preceded by a lot of escaped slashes, or occurred near another number.

JSONView 1.2.3
---
* Fixed a case where JSON would fail to parse if a string containing a number was preceded by a quote that was preceded by an escaped slash.

JSONView 1.2.2
---
* Fixed a case where JSON would fail to parse if a string containing a number also contained escaped quotes.

JSONView 1.2.1
---
* Fixed a case where JSON would fail to parse if a string contains a number and the JSON isn't indented.

JSONView 1.2.0
---
* Add a preference to use the built-in Firefox JSON viewer.
* Tell Firefox we support multi-process mode.
* Fix a performance regression that could severely slow down rendering large documents.

JSONView 1.1.1
---
* Fix a bug where copy-pasted numbers would include a unicode space.
* Fix copy-pasting JSON to not introduce unnecessary whitespace.
* Empty arrays no longer have collapsers.

JSONView 1.1.0
---
* Large numbers will now display as they appear in the original JSON document, even if they can't be represented correctly in JavaScript.
* Updated ru-RU localization.
* Rebuilt to support newer Firefoxes.


JSONView 1.0.2
---
* JSONView now works with Firefox's multi-process mode (electrolysis).
* Ellipses once again appear when arrays and objects are collapsed.
* Users can opt in to treating content types other than "application/json" as JSON. Add new content types in the extension preferences. Please be careful with this setting!
* JSONP support has been removed. Please consider using cross-origin resource sharing (CORS) instead. See https://github.com/bhollis/jsonview/issues/9#issuecomment-75919259 for rationale.
* Empty JSON responses no longer cause the page to load forever.
* Added hi-IN translation courtesy of Kishu Agarwal.

JSONView 0.9
---
* JSON parsing errors now include details and highlight the line/column of the error.
* Expanding and collapsing with arrow keys now does not collapse the top-level object/array.
* Object keys that are not valid JS identifiers are now displayed with quotes around them.
* Dragging a .json file onto Firefox should syntax-highlight it correctly, again.
* Navigating in Firefox with keyboard shortcuts will no longer trigger expanding/collapsing JSON.
* Updated compatibility to state that JSONView is now only compatible with Firefox 21+. This was true of 0.8 as well but was not documented correctly. It is possible to install JSONView 0.7 on older Firefox.

JSONView 0.8
---
* Rewritten as a restartless addon using the Addon SDK thanks to Quoc-Viet Nguyen.
* file:// links are recognized as URLs thanks to Marcin Wojnarski.
* Firefox < 4.0 compatibility has been dropped.
* More-efficient array/object collapsing, switch to arrows from +/-.
* HTML-encode links.
* Fix empty arrays being displayed as objects thanks to Quoc-Viet Nguyen.
* Keyboard shortcuts to collapse all or expand all using the left and right arrow keys thanks to Harshit Rohatgi.
* Path tooltips on object keys thanks to Adrian Vogelsgesang.
* Escaping of quotes in generated HTML thanks to Adrian Vogelsgesang.

JSONView 0.7
---

* Firefox 8+ compatibility.

JSONView 0.6
---

* Several new and updated localizations.
* Copying the formatted JSON and then pasting it now pastes valid JSON.
* Preserve formatting for JSON error responses.
* When disabling or uninstalling JSONView, make sure to remove the HTTP Accept header customization.
* Better escaping of potentially display-breaking Unicode characters in strings, and some other tweaks. Extracted from a patch by Johan Sundström.
* Some services are now loaded lazily in hopes of decreasing any effect JSONView might have on Firefox startup time.
* Unicode NUL character is now escaped when showing the body of an unparseable string.

JSONView 0.5
---

* Fixed display of newlines and multiple spaces - formatting is now better preserved.
* Fixed display of ECMAScript 5th Edition style JSON (with non-object/array root values) thanks to a patch from Josh Kline.
* URLs are matched even with uppercase scheme (such as "httpS://")

JSONView 0.4
---

* Preference dialog with an option to send "application/json" in the HTTP Accept header.
* Fixed a bug where values that were 0 or false would not show up.
* Fixed a bug where documents would sometimes show up as invalid when Firebug was enabled
* Bumped compatibility for 3.7a1pre

JSONView 0.3
---

* Detects and displays JSONP, including display of the callback.
* Doesn't show empty arrays and objects as collapsible, and displays them on one line.
* Fixed an error reading large files.

JSONView 0.2
---

* .json files can be opened in JSONView from the local machine.
* Added Bulgarian, German, Hungarian, and (partial) Turkish translations. Thanks to Стоян Димитров, Archaeopteryx, Team erweiterungen.de, MIKES KASZMÁN István and Ersen Yolda from BabelZilla.org.
* Compatible with FF 3.5.*

JSONView 0.1
---

* String values which contain only a URL are displayed as a clickable link. Props to stig.murberg for the patch.
* Added Catalan, Spanish, Japanese, Portugese (Brazil), Russian, and Simplified Chinese translations. Thanks to Fani Kozolchyk, and Xavi Ivars - Softcatalà, hoolooday, drry, Marcelo Ghelman (ghelman.net), Пирятинский Виталий, and urko from BabelZilla.org.

JSONView 0.1b3:
---

* Compatible with FF 3.1 Beta 3
* Fixed a bug where documents >8KB wouldn't be parsed.
* Added Czech, French, and Dutch translations. Thanks to funTomas, Goofy, and markh at babelzilla.org.
* Removed dependency on jQuery - extension is smaller, faster, no more warnings in strict mode.

JSONView 0.1b2:
---

* Compatible with FF 3.1 Beta 2

JSONView 0.1b1:
---

* First beta release
