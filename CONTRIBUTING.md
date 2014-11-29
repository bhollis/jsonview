Contributing to JSONView
---

The goal of JSONView is to be a very simple, straightforward add-on that formats JSON. Given that, even though I'm very appreciative of the time and thought put into contributions, I regularly reject them because they add complexity to the add-on that I don't think should be there. Please consider [filing an issue](https://github.com/bhollis/jsonview/issues) before doing any work, so you don't accidentally waste time on something I won't accept.

There are no hard and fast rules for what I will and will not accept - please just ask via an issue before implementing. Generally, things I have rejected in the past:

* Adding new MIME types to the set supported by JSONView. I have [an open issue](https://github.com/bhollis/jsonview/issues/7) for how I'd like to see additional MIME types handled, and will not accept patches that add arbitrary new MIME types.
* Adding new options. While I'm not opposed to adding an option if it really makes sense, the bar is very high for adding anything configurable to the add-on.
* Interpreting JSON in any application-specific way. While in the past I've allowed a few feature additions that attempt to interpret JSON (such as recognizing and linkifying URLs), I want JSONView to be a general JSON viewer, and as such will reject any patch that seeks to priviledge specific interpretations of JSON structure.
* Adding switches or options to the screen that shows JSON. I don't want to clutter up the JSON view itself with control panels and options, so anything that relies on adding such a thing is likely to be rejected.

Please, don't let this discourage you! Just file an issue first so we can discuss the change you plan to make.


Code Guidelines
---

Please match the formatting of existing code - that includes whitespace, documentation, code style, and naming conventions. Look at the code around your patch and just copy that style.