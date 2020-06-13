const fs = require('fs');
const path = require('path');

const { expect } = require('chai');

const { htmlToText } = require('..');


describe('html-to-text', function () {
  describe('.fromString()', function () {
    describe('wordwrap option', function () {

      let longStr;

      beforeEach(function () {
        longStr = '111111111 222222222 333333333 444444444 555555555 666666666 777777777 888888888 999999999';
      });

      it('should wordwrap at 80 characters by default', function () {
        expect(htmlToText(longStr)).to.equal('111111111 222222222 333333333 444444444 555555555 666666666 777777777 888888888\n999999999');
      });

      it('should wordwrap at given amount of characters when give a number', function () {

        expect(htmlToText(longStr, { wordwrap: 20 })).to.equal('111111111 222222222\n333333333 444444444\n555555555 666666666\n777777777 888888888\n999999999');

        expect(htmlToText(longStr, { wordwrap: 50 })).to.equal('111111111 222222222 333333333 444444444 555555555\n666666666 777777777 888888888 999999999');

        expect(htmlToText(longStr, { wordwrap: 70 })).to.equal('111111111 222222222 333333333 444444444 555555555 666666666 777777777\n888888888 999999999');
      });

      it('should not wordwrap when given null', function () {
        expect(htmlToText(longStr, { wordwrap: null })).to.equal(longStr);
      });

      it('should not wordwrap when given false', function () {
        expect(htmlToText(longStr, { wordwrap: false })).to.equal(longStr);
      });

      it('should not exceed the line width when processing embedded format tags', function () {
        const testString = '<p><strong>This text isn\'t counted</strong> when calculating where to break a string for 80 character line lengths.</p>';
        expect(htmlToText(testString, {})).to.equal('This text isn\'t counted when calculating where to break a string for 80\ncharacter line lengths.');
      });

      it('should work with a long string containing line feeds', function () {
        const testString = '<p>If a word with a line feed exists over the line feed boundary then\nyou\nmust\nrespect it.</p>';
        expect(htmlToText(testString, {})).to.equal('If a word with a line feed exists over the line feed boundary then you must\nrespect it.');
      });

      it('should not wrongly truncate lines when processing embedded format tags', function () {
        const testString = '<p><strong>This text isn\'t counted</strong> when calculating where to break a string for 80 character line lengths.  However it can affect where the next line breaks and this could lead to having an early line break</p>';
        expect(htmlToText(testString, {})).to.equal('This text isn\'t counted when calculating where to break a string for 80\ncharacter line lengths. However it can affect where the next line breaks and\nthis could lead to having an early line break');
      });

      it('should not exceed the line width when processing anchor tags', function () {
        const testString = "<p>We appreciate your business. And we hope you'll check out our <a href=\"http://example.com/\">new products</a>!</p>";
        expect(htmlToText(testString, {})).to.equal('We appreciate your business. And we hope you\'ll check out our new products\n[http://example.com/]!');
      });

      it('should honour line feeds from a long word across the wrap, where the line feed is before the wrap', function () {
        const testString = '<p>This string is meant to test if a string is split properly across a\nnewlineandlongword with following text.</p>';
        expect(htmlToText(testString, {}))
          .to.equal('This string is meant to test if a string is split properly across a\nnewlineandlongword with following text.');
      });

      it('should remove line feeds from a long word across the wrap, where the line feed is after the wrap', function () {
        const testString = '<p>This string is meant to test if a string is split properly across anewlineandlong\nword with following text.</p>';
        expect(htmlToText(testString, {}))
          .to.equal('This string is meant to test if a string is split properly across\nanewlineandlong word with following text.');
      });
    });

    describe('preserveNewlines option', function () {

      let newlineStr;

      beforeEach(function () {
        newlineStr = '<p\n>One\nTwo\nThree</p>';
      });

      it('should not preserve newlines by default', function () {
        expect(htmlToText(newlineStr)).to.not.contain('\n');
      });

      it('should preserve newlines when provided with a truthy value', function () {
        expect(htmlToText(newlineStr, { preserveNewlines: true })).to.contain('\n');
      });

      it('should not preserve newlines in the tags themselves', function () {
        const result = htmlToText(newlineStr, { preserveNewlines: true });
        expect(result.slice(0, 1)).to.equal('O');
      });

      it('should preserve line feeds in a long wrapping string containing line feeds', function () {
        const testString = '<p>If a word with a line feed exists over the line feed boundary then\nyou\nmust\nrespect it.</p>';
        expect(htmlToText(testString, { preserveNewlines: true }))
          .to.equal('If a word with a line feed exists over the line feed boundary then\nyou\nmust\nrespect it.');
      });

      it('should preserve line feeds in a long string containing line feeds across the wrap', function () {
        const testString = '<p>If a word with a line feed exists over the line feed boundary then\nyou must respect it.</p>';
        expect(htmlToText(testString, { preserveNewlines: true }))
          .to.equal('If a word with a line feed exists over the line feed boundary then\nyou must respect it.');
      });

      it('should preserve line feeds in a long string containing line feeds across the wrap with a line feed before 80 chars', function () {
        const testString = '<p>This string is meant to test if a string is split properly across a\nnewlineandlongword with following text.</p>';
        expect(htmlToText(testString, { preserveNewlines: true }))
          .to.equal('This string is meant to test if a string is split properly across a\nnewlineandlongword with following text.');
      });

      it('should preserve line feeds in a long string containing line feeds across the wrap with a line feed after 80 chars', function () {
        const testString = '<p>This string is meant to test if a string is split properly across anewlineandlong\nword with following text.</p>';
        expect(htmlToText(testString, { preserveNewlines: true }))
          .to.equal('This string is meant to test if a string is split properly across\nanewlineandlong\nword with following text.');
      });

      it('should split long lines', function () {
        const testString = '<p>If a word with a line feed exists over the line feed boundary then you must respect it.</p>';
        expect(htmlToText(testString, { preserveNewlines: true }))
          .to.equal('If a word with a line feed exists over the line feed boundary then you must\nrespect it.');
      });
    });

    describe('single line paragraph option', function () {

      let paragraphsString;

      beforeEach(function () {
        paragraphsString = '<p>First</p><p>Second</p>';
      });

      it('should not use single new line when given null', function () {
        expect(htmlToText(paragraphsString, { singleNewLineParagraphs: null })).to.equal('First\n\nSecond');
      });

      it('should not use single new line when given false', function () {
        expect(htmlToText(paragraphsString, { singleNewLineParagraphs: false })).to.equal('First\n\nSecond');
      });

      it('should use single new line when given true', function () {
        expect(htmlToText(paragraphsString, { singleNewLineParagraphs: true })).to.equal('First\nSecond');
      });
    });
  });

  describe('tables', function () {
    it('should handle center tag in tables', function () {
      const html = `Good morning Jacob, \
        <TABLE>
        <CENTER>
        <TBODY>
        <TR>
        <TD>Lorem ipsum dolor sit amet.</TD>
        </TR>
        </CENTER>
        </TBODY>
        </TABLE>
      `;
      const resultExpected = 'Good morning Jacob, Lorem ipsum dolor sit amet.';
      const result = htmlToText(html, { tables: true });
      expect(result).to.equal(resultExpected);
    });

    it('should handle non-integer colspan on td element gracefully', function () {
      const html = `Good morning Jacob,
        <TABLE>
        <CENTER>
        <TBODY>
        <TR>
        <TD colspan="abc">Lorem ipsum dolor sit amet.</TD>
        </TR>
        </CENTER>
        </TBODY>
        </TABLE>
      `;
      const resultExpected = 'Good morning Jacob, Lorem ipsum dolor sit amet.';
      const result = htmlToText(html, { tables: true });
      expect(result).to.equal(resultExpected);
    });
  });

  describe('a', function () {
    it('should decode html attribute entities from href', function () {
      const result = htmlToText('<a href="/foo?a&#x3D;b">test</a>');
      expect(result).to.equal('test [/foo?a=b]');
    });

    it('should strip mailto: from email links', function () {
      const result = htmlToText('<a href="mailto:foo@example.com">email me</a>');
      expect(result).to.equal('email me [foo@example.com]');
    });

    it('should return link with brackets', function () {
      const result = htmlToText('<a href="http://my.link">test</a>');
      expect(result).to.equal('test [http://my.link]');
    });

    it('should return link without brackets', function () {
      const result = htmlToText(
        '<a href="http://my.link">test</a>',
        { noLinkBrackets: true }
      );
      expect(result).to.equal('test http://my.link');
    });

    it('should not return link for anchor if noAnchorUrl is set to true', function () {
      const result = htmlToText(
        '<a href="#link">test</a>',
        { noAnchorUrl: true }
      );
      expect(result).to.equal('test');
    });

    it('should return link for anchor if noAnchorUrl is set to false', function () {
      const result = htmlToText(
        '<a href="#link">test</a>',
        { noAnchorUrl: false }
      );
      expect(result).to.equal('test [#link]');
    });
  });

  describe('lists', function () {
    describe('ul', function () {
      it('should handle empty unordered lists', function () {
        const testString = '<ul></ul>';
        expect(htmlToText(testString)).to.equal('');
      });

      it('should handle an unordered list with multiple elements', function () {
        const testString = '<ul><li>foo</li><li>bar</li></ul>';
        expect(htmlToText(testString)).to.equal(' * foo\n * bar');
      });

      it('should handle an unordered list prefix option', function () {
        const testString = '<ul><li>foo</li><li>bar</li></ul>';
        const options = { unorderedListItemPrefix: ' test ' };
        expect(htmlToText(testString, options)).to.equal(' test foo\n test bar');
      });

      it('should handle nested ul correctly', function () {
        const testString = '<ul><li>foo<ul><li>bar<ul><li>baz.1</li><li>baz.2</li></ul></li></ul></li></ul>';
        expect(htmlToText(testString)).to.equal(' * foo\n    * bar\n       * baz.1\n       * baz.2');
      });
    });

    describe('ol', function () {
      it('should handle empty ordered lists', function () {
        const testString = '<ol></ol>';
        expect(htmlToText(testString)).to.equal('');
      });

      it('should handle an ordered list with multiple elements', function () {
        const testString = '<ol><li>foo</li><li>bar</li></ol>';
        expect(htmlToText(testString)).to.equal(' 1. foo\n 2. bar');
      });

      it('should support the ordered list type="1" attribute', function () {
        const testString = '<ol type="1"><li>foo</li><li>bar</li></ol>';
        expect(htmlToText(testString)).to.equal(' 1. foo\n 2. bar');
      });

      it('should fallback to type="!" behavior if type attribute is invalid', function () {
        const testString = '<ol type="1"><li>foo</li><li>bar</li></ol>';
        expect(htmlToText(testString)).to.equal(' 1. foo\n 2. bar');
      });

      it('should support the ordered list type="a" attribute', function () {
        const testString = '<ol type="a"><li>foo</li><li>bar</li></ol>';
        expect(htmlToText(testString)).to.equal(' a. foo\n b. bar');
      });

      it('should support the ordered list type="A" attribute', function () {
        const testString = '<ol type="A"><li>foo</li><li>bar</li></ol>';
        expect(htmlToText(testString)).to.equal(' A. foo\n B. bar');
      });

      it('should support the ordered list type="i" attribute by falling back to type="1"', function () {
        const testString = '<ol type="i"><li>foo</li><li>bar</li></ol>';
        // TODO Implement lowercase roman numerals
        // expect(htmlToText(testString)).to.equal('i. foo\nii. bar');
        expect(htmlToText(testString)).to.equal(' 1. foo\n 2. bar');
      });

      it('should support the ordered list type="I" attribute by falling back to type="1"', function () {
        const testString = '<ol type="I"><li>foo</li><li>bar</li></ol>';
        // TODO Implement uppercase roman numerals
        // expect(htmlToText(testString)).to.equal('I. foo\nII. bar');
        expect(htmlToText(testString)).to.equal(' 1. foo\n 2. bar');
      });

      it('should support the ordered list start attribute', function () {
        const testString = '<ol start="2"><li>foo</li><li>bar</li></ol>';
        expect(htmlToText(testString)).to.equal(' 2. foo\n 3. bar');
      });

      it('should handle nested ol correctly', function () {
        const testString = '<ol><li>foo<ol><li>bar<ol><li>baz</li><li>baz</li></ol></li></ol></li></ol>';
        expect(htmlToText(testString)).to.equal(' 1. foo\n    1. bar\n       1. baz\n       2. baz');
      });

      /*
       * Currently failing tests for continuing to fill out the specification
       *  Spec: https://html.spec.whatwg.org/multipage/semantics.html#the-ol-element
       *
      it('should support the ordered list type="a" attribute past 26 characters', function() {
        var testString = '<ol start="26" type="a"><li>foo</li><li>bar</li></ol>';
        expect(htmlToText(testString)).to.equal('z. foo\naa. bar');
      });

      it('should support the ordered list type="A" attribute past 26 characters', function() {
        var testString = '<ol start="26" type="A"><li>foo</li><li>bar</li></ol>';
        expect(htmlToText(testString)).to.equal('Z. foo\nAA. bar');
      });
      */
    });

    it('should not wrap li when wordwrap is disabled', function () {
      const html = `Good morning Jacob,
        <p>Lorem ipsum dolor sit amet</p>
        <p><strong>Lorem ipsum dolor sit amet.</strong></p>
        <ul>
          <li>run in the park <span style="color:#888888;">(in progress)</span></li>
        </ul>
      `;
      const resultExpected = 'Good morning Jacob, Lorem ipsum dolor sit amet\n\nLorem ipsum dolor sit amet.\n\n * run in the park (in progress)';
      const result = htmlToText(html, { wordwrap: false });
      expect(result).to.equal(resultExpected);
    });
  });

  describe('entities', function () {
    it('should not insert null bytes', function () {
      const html = '<a href="some-url?a=b&amp;b=c">Testing &amp; Done</a>';

      const result = htmlToText(html);
      expect(result).to.equal('Testing & Done [some-url?a=b&b=c]');
    });

    it('should replace entities inside `alt` attributes of images', function () {
      const html = '<img src="test.png" alt="&quot;Awesome&quot;">';

      const result = htmlToText(html);
      expect(result).to.equal('"Awesome" [test.png]');
    });

    it('should update relatively sourced entities with linkHrefBaseUrl', function () {
      const html1 = '<img src="/test.png">';
      const html2 = '<a href="/test.html">test</a>';

      const options = { linkHrefBaseUrl: 'http://www.domain.com' };

      const result1 = htmlToText(html1, options);
      expect(result1).to.equal('[http://www.domain.com/test.png]');
      const result2 = htmlToText(html2, options);
      expect(result2).to.equal('test [http://www.domain.com/test.html]');
    });
  });

  describe('unicode support', function () {
    it('should decode &#128514; to 😂', function () {
      const result = htmlToText('&#128514;');
      expect(result).to.equal('😂');
    });
  });

  describe('disable uppercaseHeadings', function () {
    for (const i of [1, 2, 3, 4, 5, 6]) {
      it('should return h' + i + ' in lowercase', function () {
        const result = htmlToText(
          '<h' + i + '>test</h' + i + '>',
          { uppercaseHeadings: false }
        );
        expect(result).to.equal('test');
      });
    }
  });

  describe('custom formatting', function () {
    it('should allow to pass custom formatting functions: heading', function () {
      const result = htmlToText('<h1>TeSt</h1>', {
        format: {
          heading: function (elem, fn, options) {
            const h = fn(elem.children, options);
            return '====\n' + h.toLowerCase() + '\n====';
          }
        }
      });
      expect(result).to.equal('====\ntest\n====');
    });

    it('should allow to pass custom formatting functions: div', function () {
      const result = htmlToText('<div>Hello</div><div>World</div>!', {
        format: {
          div: function (elem, fn, options) {
            const h = fn(elem.children, options);
            return h + '\n';
          }
        }
      });
      expect(result).to.equal('Hello\nWorld\n!');
    });
  });

  describe('Base element', function () {
    it('should retrieve and convert the entire document under `body` by default', function () {
      const htmlFile = fs.readFileSync(path.join(__dirname, 'test.html'), 'utf8');
      const txtFile = fs.readFileSync(path.join(__dirname, 'test.txt'), 'utf8');

      const options = { tables: ['#invoice', '.address'] };

      const text = htmlToText(htmlFile, options);
      expect(text).to.equal(txtFile);
    });

    it('should only retrieve and convert content under the specified base element if found', function () {
      const htmlFile = fs.readFileSync(path.join(__dirname, 'test.html'), 'utf8');
      const txtFile = fs.readFileSync(path.join(__dirname, 'test-address.txt'), 'utf8');

      const options = {
        tables: ['.address'],
        baseElement: 'table.address'
      };
      const text = htmlToText(htmlFile, options);
      expect(text).to.equal(txtFile);
    });

    it('should retrieve and convert content under multiple base elements', function () {
      const htmlFile = fs.readFileSync(path.join(__dirname, 'test.html'), 'utf8');
      const txtFile = fs.readFileSync(path.join(__dirname, 'test-address-dup.txt'), 'utf8');

      const options = {
        tables: ['.address'],
        baseElement: ['table.address', 'table.address']
      };
      const text = htmlToText(htmlFile, options);
      expect(text).to.equal(txtFile);
    });

    it('should retrieve and convert content under multiple base elements in any order', function () {
      const htmlFile = fs.readFileSync(path.join(__dirname, 'test.html'), 'utf8');
      const txtFile = fs.readFileSync(path.join(__dirname, 'test-any-order.txt'), 'utf8');

      const options = {
        tables: ['.address'],
        baseElement: ['table.address', 'p.normal-space', 'table.address']
      };
      const text = htmlToText(htmlFile, options);
      expect(text).to.equal(txtFile);
    });

    it('should process the first base element found when multiple exist', function () {
      const htmlFile = fs.readFileSync(path.join(__dirname, 'test.html'), 'utf8');
      const txtFile = fs.readFileSync(path.join(__dirname, 'test-first-element.txt'), 'utf8');

      const options = {
        tables: ['.address'],
        baseElement: 'p.normal-space'
      };
      const text = htmlToText(htmlFile, options);
      expect(text).to.equal(txtFile);
    });

    it('should retrieve and convert the entire document by default if no base element is found', function () {
      const htmlFile = fs.readFileSync(path.join(__dirname, 'test.html'), 'utf8');
      const txtFile = fs.readFileSync(path.join(__dirname, 'test.txt'), 'utf8');

      const options = {
        tables: ['#invoice', '.address'],
        baseElement: 'table.notthere'
      };
      const text = htmlToText(htmlFile, options);
      expect(text).to.equal(txtFile);
    });

    it('should return null if the base element isn\'t found and we\'re not returning the DOM by default', function () {
      const htmlFile = fs.readFileSync(path.join(__dirname, 'test.html'), 'utf8');

      const expectedTxt = '';
      const options = {
        baseElement: 'table.notthere',
        returnDomByDefault: false,
        tables: ['#invoice', '.address']
      };
      const text = htmlToText(htmlFile, options);
      expect(text).to.equal(expectedTxt);
    });
  });

  describe('Long words', function () {
    it('should split long words if forceWrapOnLimit is set, existing linefeeds converted to space', function () {
      const testString = '<p>_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlong\nword_with_following_text.</p>';
      expect(htmlToText(testString, { longWordSplit: { wrapCharacters: ['/'], forceWrapOnLimit: true } }))
        .to.equal('_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlo\nng word_with_following_text.');
    });

    it('should not wrap a string if longWordSplit is not set', function () {
      const testString = '<p>_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlongword_with_following_text.</p>';
      expect(htmlToText(testString, {}))
        .to.equal('_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlongword_with_following_text.');
    });

    it('should not wrap a string if not wrapCharacters are found and forceWrapOnLimit is not set', function () {
      const testString = '<p>_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlong\nword_with_following_text.</p>';
      expect(htmlToText(testString, { longWordSplit: { wrapCharacters: ['/'], forceWrapOnLimit: false } }))
        .to.equal('_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlong\nword_with_following_text.');
    });

    it('should not wrap a string if no wrapCharacters are set and forceWrapOnLimit is not set', function () {
      const testString = '<p>_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlong\nword_with_following_text.</p>';
      expect(htmlToText(testString, { longWordSplit: { wrapCharacters: [], forceWrapOnLimit: false } }))
        .to.equal('_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlong\nword_with_following_text.');
    });

    it('should wrap on the last instance of a wrap character before the wordwrap limit.', function () {
      const testString = '<p>_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlong\nword_with_following_text.</p>';
      expect(htmlToText(testString, { longWordSplit: { wrapCharacters: ['/', '_'], forceWrapOnLimit: false } }))
        .to.equal('_This_string_is_meant_to_test_if_a_string_is_split_properly_across_\nanewlineandlong word_with_following_text.');
    });

    it('should wrap on the last instance of a wrap character before the wordwrap limit. Content of wrapCharacters shouldn\'t matter.', function () {
      const testString = '<p>_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlong\nword_with_following_text.</p>';
      expect(htmlToText(testString, { longWordSplit: { wrapCharacters: ['/', '-', '_'], forceWrapOnLimit: false } }))
        .to.equal('_This_string_is_meant_to_test_if_a_string_is_split_properly_across_\nanewlineandlong word_with_following_text.');
    });

    it('should wrap on the last instance of a wrap character before the wordwrap limit. Order of wrapCharacters shouldn\'t matter.', function () {
      const testString = '<p>_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlong\nword_with_following_text.</p>';
      expect(htmlToText(testString, { longWordSplit: { wrapCharacters: ['_', '/'], forceWrapOnLimit: false } }))
        .to.equal('_This_string_is_meant_to_test_if_a_string_is_split_properly_across_\nanewlineandlong word_with_following_text.');
    });

    it('should wrap on the last instance of a wrap character before the wordwrap limit. Should preference wrapCharacters in order', function () {
      const testString = '<p>_This_string_is_meant_to_test_if_a_string_is_split-properly_across_anewlineandlong\nword_with_following_text.</p>';
      expect(htmlToText(testString, { longWordSplit: { wrapCharacters: ['-', '_', '/'], forceWrapOnLimit: false } }))
        .to.equal('_This_string_is_meant_to_test_if_a_string_is_split-\nproperly_across_anewlineandlong word_with_following_text.');
    });

    it('should not wrap a string that is too short', function () {
      const testString = '<p>https://github.com/werk85/node-html-to-text/blob/master/lib/html-to-text.js</p>';
      expect(htmlToText(testString, { longWordSplit: { wrapCharacters: ['/', '-'], forceWrapOnLimit: false } }))
        .to.equal('https://github.com/werk85/node-html-to-text/blob/master/lib/html-to-text.js');
    });

    it('should wrap a url string using \'/\'', function () {
      const testString = '<p>https://github.com/AndrewFinlay/node-html-to-text/commit/64836a5bd97294a672b24c26cb8a3ccdace41001</p>';
      expect(htmlToText(testString, { longWordSplit: { wrapCharacters: ['/', '-'], forceWrapOnLimit: false } }))
        .to.equal('https://github.com/AndrewFinlay/node-html-to-text/commit/\n64836a5bd97294a672b24c26cb8a3ccdace41001');
    });

    it('should wrap very long url strings using \'/\'', function () {
      const testString = '<p>https://github.com/werk85/node-html-to-text/blob/master/lib/werk85/node-html-to-text/blob/master/lib/werk85/node-html-to-text/blob/master/lib/werk85/node-html-to-text/blob/master/lib/werk85/node-html-to-text/blob/master/lib/html-to-text.js</p>';
      expect(htmlToText(testString, { longWordSplit: { wrapCharacters: ['/', '-'], forceWrapOnLimit: false } }))
        .to.equal('https://github.com/werk85/node-html-to-text/blob/master/lib/werk85/\nnode-html-to-text/blob/master/lib/werk85/node-html-to-text/blob/master/lib/\nwerk85/node-html-to-text/blob/master/lib/werk85/node-html-to-text/blob/master/\nlib/html-to-text.js');
    });

    it('should wrap very long url strings using limit', function () {
      const testString = '<p>https://github.com/werk85/node-html-to-text/blob/master/lib/werk85/node-html-to-text/blob/master/lib/werk85/node-html-to-text/blob/master/lib/werk85/node-html-to-text/blob/master/lib/werk85/node-html-to-text/blob/master/lib/html-to-text.js</p>';
      expect(htmlToText(testString, { longWordSplit: { wrapCharacters: [], forceWrapOnLimit: true } }))
        .to.equal('https://github.com/werk85/node-html-to-text/blob/master/lib/werk85/node-html-to-\ntext/blob/master/lib/werk85/node-html-to-text/blob/master/lib/werk85/node-html-t\no-text/blob/master/lib/werk85/node-html-to-text/blob/master/lib/html-to-text.js');
    });

    it('should honour preserveNewlines and split long words', function () {
      const testString = '<p>_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlong\nword_with_following_text.</p>';
      expect(htmlToText(testString, { preserveNewlines: true, longWordSplit: { wrapCharacters: ['/', '_'], forceWrapOnLimit: false } }))
        .to.equal('_This_string_is_meant_to_test_if_a_string_is_split_properly_across_\nanewlineandlong\nword_with_following_text.');
    });

    it('should not put in extra linefeeds if the end of the untouched long string coincides with a preserved line feed', function () {
      const testString = '<p>_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlong\nword_with_following_text.</p>';
      expect(htmlToText(testString, { preserveNewlines: true }))
        .to.equal('_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlong\nword_with_following_text.');
    });

    it('should split long strings buried in links and hide the href', function () {
      const testString = '<a href="http://images.fb.com/2015/12/21/ivete-sangalo-launches-360-music-video-on-facebook/">http://images.fb.com/2015/12/21/ivete-sangalo-launches-360-music-video-on-facebook/</a>';
      expect(htmlToText(testString, { hideLinkHrefIfSameAsText: true, longWordSplit: { wrapCharacters: ['/', '_'], forceWrapOnLimit: false } }))
        .to.equal('http://images.fb.com/2015/12/21/\nivete-sangalo-launches-360-music-video-on-facebook/');
    });

    it('should split long strings buried in links and show the href', function () {
      const testString = '<a href="http://images.fb.com/2015/12/21/ivete-sangalo-launches-360-music-video-on-facebook/">http://images.fb.com/2015/12/21/ivete-sangalo-launches-360-music-video-on-facebook/</a>';
      expect(htmlToText(testString, { hideLinkHrefIfSameAsText: false, longWordSplit: { wrapCharacters: ['/', '_'], forceWrapOnLimit: false } }))
        .to.equal('http://images.fb.com/2015/12/21/\nivete-sangalo-launches-360-music-video-on-facebook/\n[http://images.fb.com/2015/12/21/\nivete-sangalo-launches-360-music-video-on-facebook/]');
    });
  });

  describe('whitespace', function () {
    it('should not be ignored inside a whitespace-only node', function () {
      const testString = 'foo<span> </span>bar';
      expect(htmlToText(testString)).to.equal('foo bar');
    });

    it('should not add additional whitespace after <sup>', function () {
      const testString = '<p>This text contains <sup>superscript</sup> text.</p>';
      const options = { preserveNewlines: true };

      expect(htmlToText(testString, options)).to.equal('This text contains superscript text.');
    });

    it('should handle different whitespace characters equally at leading/trailing position', function () {
      const withTrailingSpace = '<span>first span' + String.fromCharCode(160) + '</span><span>last span</span>';
      const withLeadingSpace = '<span>first span</span><span>' + String.fromCharCode(160) + 'last span</span>';
      const expected = 'first span last span';
      expect(htmlToText(withTrailingSpace)).to.equal(expected);
      expect(htmlToText(withLeadingSpace)).to.equal(expected);
    });
  });

  describe('lots of tags, limits', function () {
    it('should handle a large number of wbr tags w/o stack overflow', function () {
      let testString = '<!DOCTYPE html><html><head></head><body>\n';
      let expectedResult = '';
      for (let i = 0; i < 10000; i++) {
        if (i !== 0 && i % 80 === 0) {
          expectedResult += '\n';
        }
        expectedResult += 'n';
        testString += '<wbr>n';
      }
      testString += '</body></html>';
      expect(htmlToText(testString)).to.equal(expectedResult);
    });

    it('should handle a very large number of wbr tags with limits', function () {
      let testString = '<!DOCTYPE html><html><head></head><body>\n';
      for (let i = 0; i < 70000; i++) {
        testString += '<wbr>n';
      }
      testString += '</body></html>';
      const options = {
        limits: {
          maxChildNodes: 10,
          ellipsis: '(...)'
        }
      };
      const expectedResult = 'nnnn(...)';
      expect(htmlToText(testString, options)).to.equal(expectedResult);
    });

    it('should respect maxDepth limit', function () {
      const testString = /*html*/`<!DOCTYPE html><html><head></head><body><div>a<div>b<div>c<div>d</div>e</div>f</div>g<div>h<div>i<div>j</div>k</div>l</div>m</div></body></html>`;
      const options = {
        limits: {
          maxDepth: 2,
          ellipsis: '(...)'
        }
      };
      const expectedResult = 'a(...)g(...)m';
      expect(htmlToText(testString, options)).to.equal(expectedResult);
    });

    it('should respect maxChildNodes limit', function () {
      const testString = /*html*/`<!DOCTYPE html><html><head></head><body><p>a</p><p>b</p><p>c</p><p>d</p><p>e</p><p>f</p><p>g</p><p>h</p><p>i</p><p>j</p></body></html>`;
      const options = {
        singleNewLineParagraphs: true,
        limits: {
          maxChildNodes: 6,
          ellipsis: '(skipped the rest)'
        }
      };
      const expectedResult = 'a\nb\nc\nd\ne\nf\n(skipped the rest)';
      expect(htmlToText(testString, options)).to.equal(expectedResult);
    });

    it('should not add ellipsis when maxChildNodes limit is exact match', function () {
      const testString = /*html*/`<!DOCTYPE html><html><head></head><body><p>a</p><p>b</p><p>c</p><p>d</p><p>e</p><p>f</p><p>g</p><p>h</p><p>i</p><p>j</p></body></html>`;
      const options = {
        singleNewLineParagraphs: true,
        limits: {
          maxChildNodes: 10,
          ellipsis: 'can\'t see me'
        }
      };
      const expectedResult = 'a\nb\nc\nd\ne\nf\ng\nh\ni\nj';
      expect(htmlToText(testString, options)).to.equal(expectedResult);
    });
  });

  describe('blockquote', function () {
    it('should handle format single-line blockquote', function () {
      const testString = 'foo<blockquote>test</blockquote>bar';
      const expectedResult = 'foo> test\nbar';
      expect(htmlToText(testString)).to.equal(expectedResult);
    });
    it('should format multi-line blockquote', function () {
      const testString = '<blockquote>a<br/>b</blockquote>';
      const expectedResult = '> a\n> b';
      expect(htmlToText(testString)).to.equal(expectedResult);
    });
    it('should trim newlines', function () {
      const testString = '<blockquote><br/>a<br/><br/><br/></blockquote>';
      const expectedResult = '> a';
      expect(htmlToText(testString)).to.equal(expectedResult);
    });
  });
});
