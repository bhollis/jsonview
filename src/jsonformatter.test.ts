import { strict as assert } from "node:assert";
import test from "node:test";
import { valueToHTML } from "./jsonformatter.js";
import { safeStringEncodeNums } from "./safe-encode-numbers.js";

const jsonContent = [
  [`{}`, `{ }`],
  [
    `{ "hey": "guy" }`,
    `<span class="collapser"></span>{<ul class="obj collapsible"><li><span class="spacer">&nbsp;&nbsp;</span><span class="prop" title="&lt;root&gt;.hey"><span class="q">&quot;</span>hey<span class="q">&quot;</span></span>: <span class="string">&quot;guy&quot;</span></li></ul><span class="spacer"></span>}`,
  ],
  [
    `{ "float": 10.5 }`,
    `<span class="collapser"></span>{<ul class="obj collapsible"><li><span class="spacer">&nbsp;&nbsp;</span><span class="prop" title="&lt;root&gt;.float"><span class="q">&quot;</span>float<span class="q">&quot;</span></span>: <span class="num">10.5</span></li></ul><span class="spacer"></span>}`,
  ],
  [
    `{ "10.5": "hello" }`,
    `<span class="collapser"></span>{<ul class="obj collapsible"><li><span class="spacer">&nbsp;&nbsp;</span><span class="prop quoted" title=""><span class="q">&quot;</span>10.5<span class="q">&quot;</span></span>: <span class="string">&quot;hello&quot;</span></li></ul><span class="spacer"></span>}`,
  ],
  [
    // bigger than max safe integer
    `{ "anumber": 9117199254740991 }`,
    `<span class="collapser"></span>{<ul class="obj collapsible"><li><span class="spacer">&nbsp;&nbsp;</span><span class="prop" title="&lt;root&gt;.anumber"><span class="q">&quot;</span>anumber<span class="q">&quot;</span></span>: <span class="num">9117199254740992</span></li></ul><span class="spacer"></span>}`,
  ],
  [
    `{ "anobject": {"whoa": "nuts","anarray": [1,2,"thr<h1>ee"], "more":"stuff"} }`,
    `<span class="collapser"></span>{<ul class="obj collapsible"><li><span class="spacer">&nbsp;&nbsp;</span><span class="prop" title="&lt;root&gt;.anobject"><span class="q">&quot;</span>anobject<span class="q">&quot;</span></span>: <span class="collapser"></span>{<ul class="obj collapsible"><li><span class="spacer">&nbsp;&nbsp;&nbsp;&nbsp;</span><span class="prop" title="&lt;root&gt;.anobject.whoa"><span class="q">&quot;</span>whoa<span class="q">&quot;</span></span>: <span class="string">&quot;nuts&quot;</span>,</li><li><span class="spacer">&nbsp;&nbsp;&nbsp;&nbsp;</span><span class="prop" title="&lt;root&gt;.anobject.anarray"><span class="q">&quot;</span>anarray<span class="q">&quot;</span></span>: <span class="collapser"></span>[<ul class="array collapsible"><li><span class="spacer">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span><span class="num">1</span>,</li><li><span class="spacer">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span><span class="num">2</span>,</li><li><span class="spacer">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span><span class="string">&quot;thr&lt;h1&gt;ee&quot;</span></li></ul><span class="spacer">&nbsp;&nbsp;&nbsp;&nbsp;</span>],</li><li><span class="spacer">&nbsp;&nbsp;&nbsp;&nbsp;</span><span class="prop" title="&lt;root&gt;.anobject.more"><span class="q">&quot;</span>more<span class="q">&quot;</span></span>: <span class="string">&quot;stuff&quot;</span></li></ul><span class="spacer">&nbsp;&nbsp;</span>}</li></ul><span class="spacer"></span>}`,
  ],
  [
    `{ "awesome": true }`,
    `<span class="collapser"></span>{<ul class="obj collapsible"><li><span class="spacer">&nbsp;&nbsp;</span><span class="prop" title="&lt;root&gt;.awesome"><span class="q">&quot;</span>awesome<span class="q">&quot;</span></span>: <span class="bool">true</span></li></ul><span class="spacer"></span>}`,
  ],
  [
    `{ "bogus": false }`,
    `<span class="collapser"></span>{<ul class="obj collapsible"><li><span class="spacer">&nbsp;&nbsp;</span><span class="prop" title="&lt;root&gt;.bogus"><span class="q">&quot;</span>bogus<span class="q">&quot;</span></span>: <span class="bool">false</span></li></ul><span class="spacer"></span>}`,
  ],
  [
    `{ "meaning": null }`,
    `<span class="collapser"></span>{<ul class="obj collapsible"><li><span class="spacer">&nbsp;&nbsp;</span><span class="prop" title="&lt;root&gt;.meaning"><span class="q">&quot;</span>meaning<span class="q">&quot;</span></span>: <span class="null">null</span></li></ul><span class="spacer"></span>}`,
  ],
  [
    `{ "japanese": "明日がある。" }`,
    `<span class="collapser"></span>{<ul class="obj collapsible"><li><span class="spacer">&nbsp;&nbsp;</span><span class="prop" title="&lt;root&gt;.japanese"><span class="q">&quot;</span>japanese<span class="q">&quot;</span></span>: <span class="string">&quot;明日がある。&quot;</span></li></ul><span class="spacer"></span>}`,
  ],
  [
    `{ "link": "http://jsonview.com" }`,
    `<span class="collapser"></span>{<ul class="obj collapsible"><li><span class="spacer">&nbsp;&nbsp;</span><span class="prop" title="&lt;root&gt;.link"><span class="q">&quot;</span>link<span class="q">&quot;</span></span>: <a href="http://jsonview.com"><span class="q">&quot;</span>http://jsonview.com<span class="q">&quot;</span></a></li></ul><span class="spacer"></span>}`,
  ],
  [
    `{ "notLink": "http://jsonview.com is great" }`,
    `<span class="collapser"></span>{<ul class="obj collapsible"><li><span class="spacer">&nbsp;&nbsp;</span><span class="prop" title="&lt;root&gt;.notLink"><span class="q">&quot;</span>notLink<span class="q">&quot;</span></span>: <span class="string">&quot;http://jsonview.com is great&quot;</span></li></ul><span class="spacer"></span>}`,
  ],
  [
    `{ "aZero": 0 }`,
    `<span class="collapser"></span>{<ul class="obj collapsible"><li><span class="spacer">&nbsp;&nbsp;</span><span class="prop" title="&lt;root&gt;.aZero"><span class="q">&quot;</span>aZero<span class="q">&quot;</span></span>: <span class="num">0</span></li></ul><span class="spacer"></span>}`,
  ],
  [
    `{ "emptyString": "" }`,
    `<span class="collapser"></span>{<ul class="obj collapsible"><li><span class="spacer">&nbsp;&nbsp;</span><span class="prop" title="&lt;root&gt;.emptyString"><span class="q">&quot;</span>emptyString<span class="q">&quot;</span></span>: <span class="string">&quot;&quot;</span></li></ul><span class="spacer"></span>}`,
  ],
  [
    `{"string_with_nulls":"\\u0000*\\u0000_hello"}`,
    `<span class="collapser"></span>{<ul class="obj collapsible"><li><span class="spacer">&nbsp;&nbsp;</span><span class="prop" title="&lt;root&gt;.string_with_nulls"><span class="q">&quot;</span>string_with_nulls<span class="q">&quot;</span></span>: <span class="string">&quot;\\u0000*\\u0000_hello&quot;</span></li></ul><span class="spacer"></span>}`,
  ],
  [
    `{"":"18"}`,
    `<span class="collapser"></span>{<ul class="obj collapsible"><li><span class="spacer">&nbsp;&nbsp;</span><span class="prop quoted" title=""><span class="q">&quot;</span><span class="q">&quot;</span></span>: <span class="string">&quot;18&quot;</span></li></ul><span class="spacer"></span>}`,
  ],
  [`[]`, `[ ]`],
  [`null`, `<span class="null">null</span>`],
  [`true`, `<span class="bool">true</span>`],
  [`1`, `<span class="num">1</span>`],
  [
    `[1,2,"thr<h1>ee"]`,
    `<span class="collapser"></span>[<ul class="array collapsible"><li><span class="spacer">&nbsp;&nbsp;</span><span class="num">1</span>,</li><li><span class="spacer">&nbsp;&nbsp;</span><span class="num">2</span>,</li><li><span class="spacer">&nbsp;&nbsp;</span><span class="string">&quot;thr&lt;h1&gt;ee&quot;</span></li></ul><span class="spacer"></span>]`,
  ],
  [
    `{"hey": "g'uy'"}`,
    `<span class="collapser"></span>{<ul class="obj collapsible"><li><span class="spacer">&nbsp;&nbsp;</span><span class="prop" title="&lt;root&gt;.hey"><span class="q">&quot;</span>hey<span class="q">&quot;</span></span>: <span class="string">&quot;g&apos;uy&apos;&quot;</span></li></ul><span class="spacer"></span>}`,
  ],
  [
    `{ "value":[ { "@some.text":"W/\\"12241774\\"" } ] }`,
    `<span class="collapser"></span>{<ul class="obj collapsible"><li><span class="spacer">&nbsp;&nbsp;</span><span class="prop" title="&lt;root&gt;.value"><span class="q">&quot;</span>value<span class="q">&quot;</span></span>: <span class="collapser"></span>[<ul class="array collapsible"><li><span class="spacer">&nbsp;&nbsp;&nbsp;&nbsp;</span><span class="collapser"></span>{<ul class="obj collapsible"><li><span class="spacer">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span><span class="prop quoted" title=""><span class="q">&quot;</span>@some.text<span class="q">&quot;</span></span>: <span class="string">&quot;W/\\&quot;12241774\\&quot;&quot;</span></li></ul><span class="spacer">&nbsp;&nbsp;&nbsp;&nbsp;</span>}</li></ul><span class="spacer">&nbsp;&nbsp;</span>]</li></ul><span class="spacer"></span>}`,
  ],
  [
    `{"key":"\\"value\\u201d"}`,
    `<span class="collapser"></span>{<ul class="obj collapsible"><li><span class="spacer">&nbsp;&nbsp;</span><span class="prop" title="&lt;root&gt;.key"><span class="q">&quot;</span>key<span class="q">&quot;</span></span>: <span class="string">&quot;\\&quot;value”&quot;</span></li></ul><span class="spacer"></span>}`,
  ],
];

Object.defineProperties(globalThis, {
  chrome: {
    value: {
      i18n: {
        getMessage: (message: string) => message,
      },
      runtime: {
        getURL: (url: string) => url,
      },
    },
  },
});

for (const [content, result] of jsonContent) {
  test(`valueToHTML ${content}`, () => {
    assert.equal(valueToHTML(JSON.parse(safeStringEncodeNums(content)), "<root>", 0), result);
  });
}
