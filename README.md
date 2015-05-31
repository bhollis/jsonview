JSONView
========

[JSONView](http://jsonview.com) is a Firefox extension that helps you view JSON documents in the browser.

Normally when encountering a [JSON](http://json.org) document (content type `application/json`), Firefox simply prompts you to download the view. With the JSONView extension, JSON documents are shown in the browser similar to how XML documents are shown. The document is formatted, highlighted, and arrays and objects can be collapsed. Even if the JSON document contains errors, JSONView will still show the raw text.

Once you've got JSONView installed, check out [this example JSON file](http://jsonview.com/example.json) to see the extension in action!

[CouchDB](http://couchdb.apache.org/) users and others who need to have `application/json` sent in the HTTP Accept header to serve JSON properly should set that option in JSONView's options panel. Be aware that telling sites that you accept JSON can mess up some sites that don't expect it.

If you'd like to contribute to JSONView but don't want to code, consider contributing a translation. Copy the existing localization files from `locale` and `src/locale` and fill them in for your own language, then send a pull request. You can do it all from the GitHub interface. There's not much there to translate!

Keyboard Shortcuts
----------------

* Left Arrow - Collapses the json on key up
* Right Arrow - Expands the json on key up

Reporting Issues
----------------

Use the GitHub [Issue tracker for JSONView](https://github.com/bhollis/jsonview/issues) to file issues. Pull requests are especially welcome.

Developing JSONView
-------------------

Before contributing to JSONView, make sure to read the [Contributing Guidelines](CONTRIBUTING.md). I appreciate contributions people make to JSONView, but the goal of the add-on is to be simple and straightforward, so I frequently reject contributions that add complexity or unnecessary features. Please consider filing an issue before doing any work, so you don't waste time on something I won't accept.

* Install [Add-on SDK](https://developer.mozilla.org/en-US/Add-ons/SDK/Tools/jpm#Installation)
* Run `jpm run` to test in Firefox.
* Run `jpm xpi` to create an xpi.
* Run `python build.py fix` to fix localized description in the generated xpi. See [Bug 1123428](https://bugzilla.mozilla.org/show_bug.cgi?id=1123428).

The build script also comes with a HTTP server which can be used to test JSON files in `tests` folder. To start the integrated server, listening on port 8000, along with Firefox, run `python build.py -b 8000 run`.

Unofficial Ports
----------------
* [jsonview-chrome](https://github.com/jamiew/jsonview-chrome)
* [jsonview-opera](https://github.com/fearphage/jsonview-opera)
* [jsonview-safari](https://github.com/acrogenesis/jsonview-safari)

Common Issues
-------------
* **JSONView isn't displaying my file as JSON**: You are probably not serving
  the JSON with the "application/json" MIME type.
* **JSONView is mangling large numbers**:
  [Here's the explanation](https://github.com/bhollis/jsonview/issues/21).

JSONView is open source software under the MIT licence.
