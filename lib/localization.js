/* This is a fork of sdk/l10n/properties/core.js that correctly sets the baseURI. */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtqain one at http://mozilla.org/MPL/2.0/. */
"use strict";

const { Cu } = require("chrome");
const { newURI } = require('sdk/url/utils');
const { getRulesForLocale } = require("sdk/l10n/plural-rules");
const { getPreferedLocales } = require('sdk/l10n/locale');
const { Services } = Cu.import("resource://gre/modules/Services.jsm", {});

const prefsService = require('sdk/preferences/service');
const baseURI = prefsService.get('extensions.jsonview@brh.numbera.com.sdk.baseURI') + "locale/";
const preferedLocales = getPreferedLocales(true);

function getLocaleURL(locale) {
  // if the locale is a valid chrome URI, return it
  try {
    const uri = newURI(locale);
    if (uri.scheme === 'chrome') {
      return uri.spec;
    }
  }
  catch (_) {} // eslint-disable-line no-empty
  // otherwise try to construct the url
  return baseURI + locale + ".properties";
}

function getKey(locale, key) {
  const bundle = Services.strings.createBundle(getLocaleURL(locale));
  try {
    return String(bundle.GetStringFromName(key));
  }
  catch (_) {} // eslint-disable-line no-empty
  return undefined;
}

function get(key, n, locales) {
  // try this locale
  const locale = locales.shift();
  let localized;

  if (typeof n === 'number') {
    if (n === 0) {
      localized = getKey(locale, key + '[zero]');
    } else if (n === 1) {
      localized = getKey(locale, key + '[one]');
    } else if (n === 2) {
      localized = getKey(locale, key + '[two]');
    }

    if (!localized) {
      // Retrieve the plural mapping function
      const pluralForm = (getRulesForLocale(locale.split("-")[0].toLowerCase()) ||
                        getRulesForLocale("en"))(n);
      localized = getKey(locale, key + '[' + pluralForm + ']');
    }

    if (!localized) {
      localized = getKey(locale, key + '[other]');
    }
  }

  if (!localized) {
    localized = getKey(locale, key);
  }

  if (!localized) {
    localized = getKey(locale, key + '[other]');
  }

  if (localized) {
    return localized;
  }

  // try next locale
  if (locales.length) {
    return get(key, n, locales);
  }

  return undefined;
}
exports.get = function(k, n) {
  return get(k, n, Array.slice(preferedLocales));
};
