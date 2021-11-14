
/**
 * Given a list of class and ID selectors (prefixed with '.' and '#'),
 * return them as separate lists of names without prefixes.
 *
 * @param { string[] } selectors Class and ID selectors (`[".class", "#id"]` etc).
 * @returns { { classes: string[], ids: string[] } }
 */
function splitClassesAndIds (selectors) {
  const classes = [];
  const ids = [];
  for (const selector of selectors) {
    if (selector.startsWith('.')) {
      classes.push(selector.substring(1));
    } else if (selector.startsWith('#')) {
      ids.push(selector.substring(1));
    }
  }
  return { classes: classes, ids: ids };
}

/**
 * Convert a number into alphabetic sequence representation (Sequence without zeroes).
 *
 * For example: `a, ..., z, aa, ..., zz, aaa, ...`.
 *
 * @param   { number } num              Number to convert. Must be >= 1.
 * @param   { string } [baseChar = 'a'] Character for 1 in the sequence.
 * @param   { number } [base = 26]      Number of characters in the sequence.
 * @returns { string }
 */
function numberToLetterSequence (num, baseChar = 'a', base = 26) {
  const digits = [];
  do {
    num -= 1;
    digits.push(num % base);
    num = (num / base) >> 0; // quick `floor`
  } while (num > 0);
  const baseCode = baseChar.charCodeAt(0);
  return digits
    .reverse()
    .map(n => String.fromCharCode(baseCode + n))
    .join('');
}

const I = ['I', 'X', 'C', 'M'];
const V = ['V', 'L', 'D'];

/**
 * Convert a number to it's Roman representation. No large numbers extension.
 *
 * @param   { number } num Number to convert. `0 < num <= 3999`.
 * @returns { string }
 */
function numberToRoman (num) {
  return [...(num) + '']
    .map(n => +n)
    .reverse()
    .map((v, i) => ((v % 5 < 4)
      ? (v < 5 ? '' : V[i]) + I[i].repeat(v % 5)
      : I[i] + (v < 5 ? V[i] : I[i + 1])))
    .reverse()
    .join('');
}

/**
 * Return the same string or a substring with the given character occurrences removed from each end if any.
 *
 * @param   { string } str  A string to trim.
 * @param   { string } char A character to be trimmed.
 * @returns { string }
 */
function trimCharacter (str, char) {
  let start = 0;
  let end = str.length;
  while (start < end && str[start] === char) { ++start; }
  while (end > start && str[end - 1] === char) { --end; }
  return (start > 0 || end < str.length)
    ? str.substring(start, end)
    : str;
}

/**
 * Get a nested property from an object.
 *
 * @param   { object }   obj  The object to query for the value.
 * @param   { string[] } path The path to the property.
 * @returns { any }
 */
function get (obj, path) {
  for (const key of path) {
    if (!obj) { return undefined; }
    obj = obj[key];
  }
  return obj;
}

module.exports = {
  get: get,
  numberToLetterSequence: numberToLetterSequence,
  numberToRoman: numberToRoman,
  splitClassesAndIds: splitClassesAndIds,
  trimCharacter: trimCharacter
};
