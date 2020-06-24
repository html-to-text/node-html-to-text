// eslint-disable-next-line import/no-unassigned-import
require('./typedefs');

/**
 * Helps to build text from words.
 *
 * @class TextBuilder
 */
class TextBuilder {
  /**
   * Creates an instance of TextBuilder.
   *
   * @param { Options } options            HtmlToText options.
   * @param { number }  firstLineCharCount Number of characters preoccupied in the first line.
   * @memberof TextBuilder
   */
  constructor (options, firstLineCharCount) {
    /** @type { string[][] } */ this.lines = [];
    /** @type { string[] }   */ this.nextLineWords = [];
    this.maxLineLength = options.wordwrap || Number.MAX_VALUE;
    this.nextLineAvailableChars = this.maxLineLength - firstLineCharCount;
    this.wrapCharacters = options.longWordSplit.wrapCharacters || [];
    this.forceWrapOnLimit = options.longWordSplit.forceWrapOnLimit || false;
  }

  /**
   * Add a new word. Add empty string when extra space is needed.
   *
   * @param { string } word A word to add.
   * @memberof TextBuilder
   */
  addWord (word) {
    if (this.nextLineAvailableChars <= 0) {
      this.startNewLine();
    }
    const isLineStart = this.nextLineWords.length === 0;
    const cost = word.length + (isLineStart ? 0 : 1);
    if (cost <= this.nextLineAvailableChars) { // Fits into available budget

      this.nextLineWords.push(word);
      this.nextLineAvailableChars -= cost;

    } else { // Does not fit - try to split the word

      // The word is moved to a new line - make the split as late as possible
      const [first, ...rest] = this.splitLongWord(word);
      if (!isLineStart) { this.startNewLine(); }
      this.nextLineWords.push(first);
      this.nextLineAvailableChars -= first.length;
      for (const part of rest) {
        this.startNewLine();
        this.nextLineWords.push(part);
        this.nextLineAvailableChars -= part.length;
      }

    }
  }

  /**
   * Add current line to the list of complete lines and start a new one.
   *
   * @memberof TextBuilder
   */
  startNewLine () {
    this.lines.push(this.nextLineWords);
    this.nextLineWords = [];
    this.nextLineAvailableChars = this.maxLineLength;
  }

  /**
   * Join all lines of words inside the TextBuilder into a complete string.
   *
   * @returns { string }
   * @memberof TextBuilder
   */
  toString () {
    return [...this.lines, this.nextLineWords]
      .map(words => words.join(' '))
      .join('\n');
  }

  /**
   * Split a long word up to fit within the word wrap limit.
   * Use either a character to split looking back from the word wrap limit,
   * or truncate to the word wrap limit.
   *
   * @param   { string }   word Input word.
   * @returns { string[] }      Parts of the word.
   * @memberof TextBuilder
   */
  splitLongWord (word) {
    const parts = [];
    let idx = 0;
    while (word.length > this.maxLineLength) {

      const firstLine = word.substring(0, this.maxLineLength);
      const remainingChars = word.substring(this.maxLineLength);

      const splitIndex = firstLine.lastIndexOf(this.wrapCharacters[idx]);

      if (splitIndex > -1) { // Found a character to split on

        word = firstLine.substring(splitIndex + 1) + remainingChars;
        parts.push(firstLine.substring(0, splitIndex + 1));

      } else { // Not found a character to split on

        idx++;
        if (idx < this.wrapCharacters.length) { // There is next character to try

          word = firstLine + remainingChars;

        } else { // No more characters to try

          if (this.forceWrapOnLimit) {
            parts.push(firstLine);
            word = remainingChars;
            if (word.length > this.maxLineLength) {
              continue;
            }
          } else {
            word = firstLine + remainingChars;
          }
          break;

        }

      }

    }
    parts.push(word); // Add remaining part to array
    return parts;
  }
}

module.exports = { TextBuilder: TextBuilder };
