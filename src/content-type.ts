const jsonContentType = /^application\/([\w!#$&.\-^+]+\+)?json($|;)/;

/**
 * Look for JSON if the content type is "application/json",
 * or "application/whatever+json" or "application/json; charset=utf-8"
 */
export function isJSONContentType(contentType: string) {
  return jsonContentType.test(contentType);
}
