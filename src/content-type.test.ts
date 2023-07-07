import { strict as assert } from "node:assert";
import test from "node:test";
import { isJSONContentType } from "./content-type.js";

const jsonContentTypes = [
  "application/json",
  "application/hal+json",
  "application/jrd+json",
  "application/ld+json",
  "application/vnd.collection+json",
  "application/vnd.XYZ-v1+json",
  "application/json; charset=utf-8",
  "application/json;  charset=utf-8",
  "application/hal+json; charset=utf-8",
  "application/vnd.collection+json; charset=utf-8",
  "application/json; charset=windows-1252",
];
const notJsonContentTypes = ["text/html", "text/json", "text/text", ""];

for (const contentType of jsonContentTypes) {
  test(`correctly identifies ${contentType} as JSON`, () => {
    assert.ok(isJSONContentType(contentType));
  });
}

for (const contentType of notJsonContentTypes) {
  test(`correctly identifies ${contentType} as NOT JSON`, () => {
    assert.ok(!isJSONContentType(contentType));
  });
}
