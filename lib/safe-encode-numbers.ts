
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
export function safeStringEncodeNums(jsonString: string) {
  const viewString = jsonString.replace(/\u200B/g, "\u200B\u200B");

  // This has some memory of what its last state was
  let wasInQuotes = false;
  function isInsideQuotes(str: string) {
    let inQuotes = false;
    for (let i = 0; i < str.length; i++) {
      if (str[i] === '"') {
        let escaped = false;
        for (let lookback = i - 1; lookback >= 0; lookback--) {
          if (str[lookback] === '\\') {
            escaped = !escaped;
          } else {
            break;
          }
        }
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

  let startIndex = 0;
  function replaceNumbers(match: string, index: number) {
    // Substring should be copy-on-write, and thus cheap
    const lookback = viewString.substring(startIndex, index);
    const insideQuotes = isInsideQuotes(lookback);
    startIndex = index + match.length;
    return insideQuotes ? match : `"\u200B${match}"`;
  }

  // JSON legal number matcher, Andrew Cheong, http://stackoverflow.com/questions/13340717
  const numberFinder = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/g;
  return viewString.replace(numberFinder, replaceNumbers);
}
