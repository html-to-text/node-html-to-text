
// eslint-disable-next-line no-unused-vars
const { InlineTextBuilder } = require('./inline-text-builder');

// eslint-disable-next-line import/no-unassigned-import
require('./typedefs');


function charactersToCodes (str) {
  return [...str]
    .map(c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'))
    .join('');
}

/**
 * Helps to handle HTML whitespaces.
 *
 * @class WhitespaceProcessor
 */
class WhitespaceProcessor {

  /**
   * Creates an instance of WhitespaceProcessor.
   *
   * @param { Options } options    HtmlToText options.
   * @memberof WhitespaceProcessor
   */
  constructor (options) {
    this.whitespaceChars = (options.preserveNewlines)
      ? options.whitespaceCharacters.replace(/\n/g, '')
      : options.whitespaceCharacters;
    const whitespaceCodes = charactersToCodes(this.whitespaceChars);
    this.leadingWhitespaceRe = new RegExp(`^[${whitespaceCodes}]`);
    this.trailingWhitespaceRe = new RegExp(`[${whitespaceCodes}]$`);
    this.allWhitespaceOrEmptyRe = new RegExp(`^[${whitespaceCodes}]*$`);

    if (options.preserveNewlines) {

      const wordOrNewlineRe = new RegExp(`\n|[^\n${whitespaceCodes}]+`, 'gm');

      /**
       * Shrink whitespaces and wrap text, add to the builder.
       *
       * @param { string }                  text              Input text.
       * @param { InlineTextBuilder }       inlineTextBuilder A builder to receive processed text.
       * @param { (str: string) => string } [ transform ]     A transform to be applied to words.
       */
      this.shrinkWrapAdd = function (text, inlineTextBuilder, transform = (str => str)) {
        if (!text) { return; }
        const previouslyStashedSpace = inlineTextBuilder.stashedSpace;
        let anyMatch = false;
        let m = wordOrNewlineRe.exec(text);
        if (m) {
          anyMatch = true;
          if (m[0] === '\n') {
            inlineTextBuilder.startNewLine();
          } else if (previouslyStashedSpace || this.testLeadingWhitespace(text)) {
            inlineTextBuilder.pushWord(transform(m[0]));
          } else {
            inlineTextBuilder.concatWord(transform(m[0]));
          }
          while ((m = wordOrNewlineRe.exec(text)) !== null) {
            if (m[0] === '\n') {
              inlineTextBuilder.startNewLine();
            } else {
              inlineTextBuilder.pushWord(transform(m[0]));
            }
          }
        }
        inlineTextBuilder.stashedSpace = (previouslyStashedSpace && !anyMatch) || (this.testTrailingWhitespace(text));
        // No need to stash a space in case last added item was a new line,
        // but that won't affect anything later anyway.
      };

    } else {

      const wordRe = new RegExp(`[^${whitespaceCodes}]+`, 'g');

      this.shrinkWrapAdd = function (text, inlineTextBuilder, transform = (str => str)) {
        if (!text) { return; }
        const previouslyStashedSpace = inlineTextBuilder.stashedSpace;
        let anyMatch = false;
        let m = wordRe.exec(text);
        if (m) {
          anyMatch = true;
          if (previouslyStashedSpace || this.testLeadingWhitespace(text)) {
            inlineTextBuilder.pushWord(transform(m[0]));
          } else {
            inlineTextBuilder.concatWord(transform(m[0]));
          }
          while ((m = wordRe.exec(text)) !== null) {
            inlineTextBuilder.pushWord(transform(m[0]));
          }
        }
        inlineTextBuilder.stashedSpace = (previouslyStashedSpace && !anyMatch) || this.testTrailingWhitespace(text);
      };

    }
  }

  /**
   * Test whether the given text starts with HTML whitespace character.
   *
   * @param   { string }  text  The string to test.
   * @returns { boolean }
   */
  testLeadingWhitespace (text) {
    return this.leadingWhitespaceRe.test(text);
  }

  /**
   * Test whether the given text ends with HTML whitespace character.
   *
   * @param   { string }  text  The string to test.
   * @returns { boolean }
   */
  testTrailingWhitespace (text) {
    return this.trailingWhitespaceRe.test(text);
  }

  /**
   * Test whether the given text contains any non-whitespace characters.
   *
   * @param   { string }  text  The string to test.
   * @returns { boolean }
   */
  testContainsWords (text) {
    return !this.allWhitespaceOrEmptyRe.test(text);
  }

}

module.exports = { WhitespaceProcessor: WhitespaceProcessor };
