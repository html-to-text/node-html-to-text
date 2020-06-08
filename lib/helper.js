const trimEnd = require('lodash/trimEnd');


// Split a long word up to fit within the word wrap limit.  Use either a
// character to split looking back from the word wrap limit, or
// truncate to the word wrap limit.
function splitLongWord (word, options) {
  const wrapCharacters = options.longWordSplit.wrapCharacters || [];
  const forceWrapOnLimit = options.longWordSplit.forceWrapOnLimit || false;
  const max = options.wordwrap;

  const fuseWord = [];
  let idx = 0;
  while (word.length > max) {
    const firstLine = word.substr(0, max);
    const remainingChars = word.substr(max);

    const splitIndex = firstLine.lastIndexOf(wrapCharacters[idx]);

    if (splitIndex > -1) {
      // We've found a character to split on, store before the split then check if we
      // need to split again
      word = firstLine.substr(splitIndex + 1) + remainingChars;
      fuseWord.push(firstLine.substr(0, splitIndex + 1));
    } else {
      idx++;
      if (idx >= wrapCharacters.length) {
        // Cannot split on character, so either split at 'max' or preserve length
        if (forceWrapOnLimit) {
          fuseWord.push(firstLine);
          word = remainingChars;
          if (word.length > max) {
            continue;
          }
        } else {
          word = firstLine + remainingChars;
          if (!options.preserveNewlines) {
            word += '\n';
          }
        }
        break;
      } else {
        word = firstLine + remainingChars;
      }
    }
  }
  fuseWord.push(word);

  return fuseWord.join('\n');
}

function wordwrap (text, options) {
  const max = options.wordwrap;
  let length = options.lineCharCount;

  // Preserve leading space
  let result = /^[^\S\r\n\t]/.test(text) ? ' ' : ''; // tests for any leading whitespace excluding new lines and tabs
  length += result.length;
  const buffer = [];
  // Split the text into words, decide to preserve new lines or not.
  const words = (options.preserveNewlines)
    ? text
      .trim()
      .replace(/\n/g, '\n ')
      .split(/ +/)
    : text
      .trim()
      .split(/\s+/);

  // Determine where to end line word by word.
  for (let word of words) {
    // Add buffer to result if we can't fit any more words in the buffer.
    if ((max || max === 0) && length > 0 && ((length + word.length > max) || (length + word.indexOf('\n') > max))) {
      // Concat buffer and add it to the result
      result += buffer.join(' ') + '\n';
      // Reset buffer and length
      buffer.length = length = 0;
    }

    // Check if the current word is long enough to be wrapped
    if ((max || max === 0) && (options.longWordSplit) && (word.length > max)) {
      word = splitLongWord(word, options);
    }

    buffer.push(word);

    // If the word contains a newline then restart the count and add the buffer to the result
    if (word.indexOf('\n') === -1) {
      // Add word length + one whitespace
      length += word.length + 1;
    } else {
      result += buffer.join(' ');

      // Reset the buffer, let the length include any characters after the last newline
      buffer.length = 0;
      length = word.length - (word.lastIndexOf('\n') + 1);
      // If there are characters after the newline, add a space and increase the length by 1
      if (length) {
        result += ' ';
        length++;
      }
    }
  }
  // Add the rest to the result.
  result += buffer.join(' ');

  // Preserve trailing space
  if (!/[^\S\r\n\t]$/.test(text)) { // tests for any trailing whitespace excluding new lines and tabs
    result = trimEnd(result);
  } else if (!result.endsWith(' ')) {
    result = result + ' ';
  }

  return result;
}

function splitCssSearchTag (tagString) {
  function getParams (re, string) {
    const captures = [];
    let found;
    while ((found = re.exec(string)) !== null) {
      captures.push(found[1]);
    }
    return captures;
  }

  const elementRe = /(^\w*)/g;
  return {
    classes: getParams(/\.([\d\w-]*)/g, tagString),
    element: elementRe.exec(tagString)[1],
    ids: getParams(/#([\d\w-]*)/g, tagString)
  };
}

/**
 * Make a recursive function that will only run to a given depth
 * and switches to an alternative function at that depth.
 * No limitation if `n` is `undefined`.
 *
 * @param {number} n Allowed depth of recursion.
 * @param {Function} f Function that accepts recursive callback as the first argument.
 * @param {Function} g Function to run instead, when maximum depth was reached.
 */
function limitedDepthRecursive (n, f, g) {
  if (n === undefined) {
    const f1 = function (...args) { return f(f1, ...args); };
    return f1;
  }
  if (n >= 0) {
    return function (...args) { return f(limitedDepthRecursive(n - 1, f, g), ...args); };
  }
  return g;
}

module.exports = {
  limitedDepthRecursive: limitedDepthRecursive,
  splitCssSearchTag: splitCssSearchTag,
  wordwrap: wordwrap
};
