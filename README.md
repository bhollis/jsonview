JSONView
========

[JSONView](http://jsonview.com) is a Web extension compatible with Firefox and Google Chrome that helps you view JSON documents in the browser.

* [Install for Firefox](https://addons.mozilla.org/en-US/firefox/addon/jsonview/)
* [Install for Chrome](https://chrome.google.com/webstore/detail/jsonview/gmegofmjomhknnokphhckolhcffdaihd)

Normally when encountering a [JSON](http://json.org) document (content type `application/json`), Firefox simply prompts you to download the view. With the JSONView extension, JSON documents are shown in the browser similar to how XML documents are shown. The document is formatted, highlighted, and arrays and objects can be collapsed. Even if the JSON document contains errors, JSONView will still show the raw text.

Once you've got JSONView installed, check out [this example JSON file](http://jsonview.com/example.json) to see the extension in action!

If you'd like to contribute to JSONView but don't want to code, consider contributing a translation. Copy the existing localization files from `src/_locale` and fill them in for your own language, then send a pull request. You can do it all from the GitHub interface. There's not many strings to translate!

Keyboard Shortcuts
----------------

* Left Arrow - Collapses the json on key up
* Right Arrow - Expands the json on key up

Reporting Issues
----------------

Use the GitHub [Issue tracker for JSONView](https://github.com/bhollis/jsonview/issues) to file issues. Pull requests are especially welcome.

Developing JSONView
-------------------

Before contributing to JSONView, make sure to read the [Contributing Guidelines](CONTRIBUTING.md). I appreciate contributions people make to JSONView, but the goal of the extension is to be simple and straightforward, so I frequently reject contributions that add complexity or unnecessary features. Please consider filing an issue before doing any work, so you don't waste time on something I won't accept.

* Install [NodeJS](https://nodejs.org/en/) and [Yarn](https://yarnpkg.com/en/docs/install).
* Check out jsonview.
* Run `yarn` inside the jsonview repository.
* Run `yarn start` to build the extension.
* In Firefox, go to `about:debugging#addons` in the address bar, check "Enable add-on debugging", select "Load Temporary Add-on", and choose the `jsonview/build` folder.
* In Chrome, go to `chrome://extensions/` in the address bar, select "Load Unpacked", and choose the `jsonview/build` folder.

JSONView makes use of [TypeScript](https://www.typescriptlang.org/). I recommend [VSCode](https://code.visualstudio.com/) for editing the code - it will automatically prompt to install the correct extensions, and will highlight errors. All of the code that makes up the extension itself are in `src/`.

Common Issues
-------------
* **JSONView isn't displaying my file as JSON**: You are probably not serving
  the JSON with the "application/json" MIME type.
* **Opening a local .json file uses the Firefox default JSON viewer**: You need to disable the built-in JSON viewer to use JSONView. Go to "about:config" and set "devtools.jsonview.enabled" to "false".

JSONView is open source software under the MIT licence.

Publishing
----------

```
npm start
```

`jsonview.zip` can then be manually uploaded to the extension sites.