/* eslint max-len: "off" */

var expect = require('chai').expect;
var htmlToText = require('..');
var path = require('path');
var fs = require('fs');

describe('html-to-text', function() {
  describe('.fromString()', function() {
    describe('wordwrap option', function() {

      var longStr;

      beforeEach(function() {
        longStr = '111111111 222222222 333333333 444444444 555555555 666666666 777777777 888888888 999999999';
      });

      it('should wordwrap at 80 characters by default', function() {
        expect(htmlToText.fromString(longStr)).to.equal('111111111 222222222 333333333 444444444 555555555 666666666 777777777 888888888\n999999999');
      });

      it('should wordwrap at given amount of characters when give a number', function() {

        expect(htmlToText.fromString(longStr, { wordwrap: 20 })).to.equal('111111111 222222222\n333333333 444444444\n555555555 666666666\n777777777 888888888\n999999999');

        expect(htmlToText.fromString(longStr, { wordwrap: 50 })).to.equal('111111111 222222222 333333333 444444444 555555555\n666666666 777777777 888888888 999999999');

        expect(htmlToText.fromString(longStr, { wordwrap: 70 })).to.equal('111111111 222222222 333333333 444444444 555555555 666666666 777777777\n888888888 999999999');
      });

      it('should not wordwrap when given null', function() {
        expect(htmlToText.fromString(longStr, { wordwrap: null })).to.equal(longStr);
      });

      it('should not wordwrap when given false', function() {
        expect(htmlToText.fromString(longStr, { wordwrap: false })).to.equal(longStr);
      });

      it('should not exceed the line width when processing embedded format tags', function() {
        var testString = '<p><strong>This text isn\'t counted</strong> when calculating where to break a string for 80 character line lengths.</p>';
        expect(htmlToText.fromString(testString, {} )).to.equal('This text isn\'t counted when calculating where to break a string for 80\ncharacter line lengths.');
      });

      it('should work with a long string containing line feeds', function() {
        var testString = '<p>If a word with a line feed exists over the line feed boundary then\nyou\nmust\nrespect it.</p>';
        expect(htmlToText.fromString(testString, {} )).to.equal('If a word with a line feed exists over the line feed boundary then you must\nrespect it.');
      });

      it('should not wrongly truncate lines when processing embedded format tags', function() {
        var testString = '<p><strong>This text isn\'t counted</strong> when calculating where to break a string for 80 character line lengths.  However it can affect where the next line breaks and this could lead to having an early line break</p>';
        expect(htmlToText.fromString(testString, {} )).to.equal('This text isn\'t counted when calculating where to break a string for 80\ncharacter line lengths. However it can affect where the next line breaks and\nthis could lead to having an early line break');
      });

      it('should not exceed the line width when processing anchor tags', function() {
        var testString = "<p>We appreciate your business. And we hope you'll check out our <a href=\"http://example.com/\">new products</a>!</p>";
        expect(htmlToText.fromString(testString, {} )).to.equal('We appreciate your business. And we hope you\'ll check out our new products\n[http://example.com/]!');
      });

      it('should honour line feeds from a long word across the wrap, where the line feed is before the wrap', function() {
        var testString = '<p>This string is meant to test if a string is split properly across a\nnewlineandlongword with following text.</p>';
        expect(htmlToText.fromString(testString, {} ))
            .to.equal('This string is meant to test if a string is split properly across a\nnewlineandlongword with following text.');
      });

      it('should remove line feeds from a long word across the wrap, where the line feed is after the wrap', function() {
        var testString = '<p>This string is meant to test if a string is split properly across anewlineandlong\nword with following text.</p>';
        expect(htmlToText.fromString(testString, {} ))
            .to.equal('This string is meant to test if a string is split properly across\nanewlineandlong word with following text.');
      });
    });

    describe('preserveNewlines option', function() {

      var newlineStr;

      beforeEach(function() {
        newlineStr = '<p\n>One\nTwo\nThree</p>';
      });

      it('should not preserve newlines by default', function() {
        expect(htmlToText.fromString(newlineStr)).to.not.contain('\n');
      });

      it('should preserve newlines when provided with a truthy value', function() {
        expect(htmlToText.fromString(newlineStr, { preserveNewlines: true })).to.contain('\n');
      });

      it('should not preserve newlines in the tags themselves', function() {
        var output_text = htmlToText.fromString(newlineStr, { preserveNewlines: true });
        expect(output_text.slice(0,1)).to.equal("O");
      });

      it('should preserve line feeds in a long wrapping string containing line feeds', function() {
        var testString = '<p>If a word with a line feed exists over the line feed boundary then\nyou\nmust\nrespect it.</p>';
        expect(htmlToText.fromString(testString, { preserveNewlines: true } ))
            .to.equal('If a word with a line feed exists over the line feed boundary then\nyou\nmust\nrespect it.');
      });

      it('should preserve line feeds in a long string containing line feeds across the wrap', function() {
        var testString = '<p>If a word with a line feed exists over the line feed boundary then\nyou must respect it.</p>';
        expect(htmlToText.fromString(testString, { preserveNewlines: true } ))
            .to.equal('If a word with a line feed exists over the line feed boundary then\nyou must respect it.');
      });

      it('should preserve line feeds in a long string containing line feeds across the wrap with a line feed before 80 chars', function() {
        var testString = '<p>This string is meant to test if a string is split properly across a\nnewlineandlongword with following text.</p>';
        expect(htmlToText.fromString(testString, { preserveNewlines: true } ))
            .to.equal('This string is meant to test if a string is split properly across a\nnewlineandlongword with following text.');
      });

      it('should preserve line feeds in a long string containing line feeds across the wrap with a line feed after 80 chars', function() {
        var testString = '<p>This string is meant to test if a string is split properly across anewlineandlong\nword with following text.</p>';
        expect(htmlToText.fromString(testString, { preserveNewlines: true } ))
            .to.equal('This string is meant to test if a string is split properly across\nanewlineandlong\nword with following text.');
      });

      it('should split long lines', function() {
        var testString = '<p>If a word with a line feed exists over the line feed boundary then you must respect it.</p>';
        expect(htmlToText.fromString(testString, { preserveNewlines: true } ))
            .to.equal('If a word with a line feed exists over the line feed boundary then you must\nrespect it.');
      });
    });

    describe('single line paragraph option', function() {

      var paragraphsString;

      beforeEach(function() {
        paragraphsString = '<p>First</p><p>Second</p>';
      });

      it('should not use single new line when given null', function() {
        expect(htmlToText.fromString(paragraphsString, { singleNewLineParagraphs: null } )).to.equal('First\n\nSecond');
      });

      it('should not use single new line when given false', function() {
        expect(htmlToText.fromString(paragraphsString, { singleNewLineParagraphs: false } )).to.equal('First\n\nSecond');
      });

      it('should use single new line when given true', function() {
        expect(htmlToText.fromString(paragraphsString, { singleNewLineParagraphs: true } )).to.equal('First\nSecond');
      });
    });
  });

  describe('tables', function () {
    it('does not process tables with uppercase tags / does not process tables with center tag', function () {
      var html = 'Good morning Jacob, \
        <TABLE> \
        <CENTER> \
        <TBODY> \
        <TR> \
        <TD>Lorem ipsum dolor sit amet.</TD> \
        </TR> \
        </CENTER> \
        </TBODY> \
        </TABLE> \
      ';
      var resultExpected = 'Good morning Jacob, Lorem ipsum dolor sit amet.';
      var result = htmlToText.fromString(html, { tables: true });
      expect(result).to.equal(resultExpected);
    });

    it('does handle non-integer colspan on td element gracefully', function () {
      var html = 'Good morning Jacob, \
        <TABLE> \
        <CENTER> \
        <TBODY> \
        <TR> \
        <TD colspan="abc">Lorem ipsum dolor sit amet.</TD> \
        </TR> \
        </CENTER> \
        </TBODY> \
        </TABLE> \
      ';
      var resultExpected = 'Good morning Jacob, Lorem ipsum dolor sit amet.';
      var result = htmlToText.fromString(html, { tables: true });
      expect(result).to.equal(resultExpected);
    });
  });

  describe('a', function () {
    it('should decode html attribute entities from href', function () {
      var result = htmlToText.fromString('<a href="/foo?a&#x3D;b">test</a>');
      expect(result).to.equal('test [/foo?a=b]');
    });

    it('should strip mailto: from email links', function () {
      var result = htmlToText.fromString('<a href="mailto:foo@example.com">email me</a>');
      expect(result).to.equal('email me [foo@example.com]');
    });

    it('should return link with brackets', function () {
      var result = htmlToText.fromString('<a href="http://my.link">test</a>');
      expect(result).to.equal('test [http://my.link]');
    });

    it('should return link without brackets', function () {
      var result = htmlToText.fromString('<a href="http://my.link">test</a>', {
        noLinkBrackets: true
      });
      expect(result).to.equal('test http://my.link');
    });

    it('should not return link for anchor if noAnchorUrl is set to true', function () {
      var result = htmlToText.fromString('<a href="#link">test</a>', {
        noAnchorUrl: true
      });
      expect(result).to.equal('test');
    });

    it('should return link for anchor if noAnchorUrl is set to false', function () {
      var result = htmlToText.fromString('<a href="#link">test</a>', {
        noAnchorUrl: false
      });
      expect(result).to.equal('test [#link]');
    });
  });

  describe('lists', function() {
    describe('ul', function() {
      it('should handle empty unordered lists', function() {
        var testString = '<ul></ul>';
        expect(htmlToText.fromString(testString)).to.equal('');
      });

      it('should handle an unordered list with multiple elements', function() {
        var testString = '<ul><li>foo</li><li>bar</li></ul>';
        expect(htmlToText.fromString(testString)).to.equal(' * foo\n * bar');
      });

      it('should handle an unordered list prefix option', function() {
        var testString = '<ul><li>foo</li><li>bar</li></ul>';
        var options = {unorderedListItemPrefix: ' test '};
        expect(htmlToText.fromString(testString, options)).to.equal(' test foo\n test bar');
      });
    });

    describe('ol', function() {
      it('should handle empty ordered lists', function() {
        var testString = '<ol></ol>';
        expect(htmlToText.fromString(testString)).to.equal('');
      });

      it('should handle an ordered list with multiple elements', function() {
        var testString = '<ol><li>foo</li><li>bar</li></ol>';
        expect(htmlToText.fromString(testString)).to.equal(' 1. foo\n 2. bar');
      });

      it('should support the ordered list type="1" attribute', function() {
        var testString = '<ol type="1"><li>foo</li><li>bar</li></ol>';
        expect(htmlToText.fromString(testString)).to.equal(' 1. foo\n 2. bar');
      });

      it('should fallback to type="!" behavior if type attribute is invalid', function() {
        var testString = '<ol type="1"><li>foo</li><li>bar</li></ol>';
        expect(htmlToText.fromString(testString)).to.equal(' 1. foo\n 2. bar');
      });

      it('should support the ordered list type="a" attribute', function() {
        var testString = '<ol type="a"><li>foo</li><li>bar</li></ol>';
        expect(htmlToText.fromString(testString)).to.equal(' a. foo\n b. bar');
      });

      it('should support the ordered list type="A" attribute', function() {
        var testString = '<ol type="A"><li>foo</li><li>bar</li></ol>';
        expect(htmlToText.fromString(testString)).to.equal(' A. foo\n B. bar');
      });

      it('should support the ordered list type="i" attribute by falling back to type="1"', function() {
        var testString = '<ol type="i"><li>foo</li><li>bar</li></ol>';
        // TODO Implement lowercase roman numerals
        // expect(htmlToText.fromString(testString)).to.equal('i. foo\nii. bar');
        expect(htmlToText.fromString(testString)).to.equal(' 1. foo\n 2. bar');
      });

      it('should support the ordered list type="I" attribute by falling back to type="1"', function() {
        var testString = '<ol type="I"><li>foo</li><li>bar</li></ol>';
        // TODO Implement uppercase roman numerals
        // expect(htmlToText.fromString(testString)).to.equal('I. foo\nII. bar');
        expect(htmlToText.fromString(testString)).to.equal(' 1. foo\n 2. bar');
      });

      it('should support the ordered list start attribute', function() {
        var testString = '<ol start="2"><li>foo</li><li>bar</li></ol>';
        expect(htmlToText.fromString(testString)).to.equal(' 2. foo\n 3. bar');
      });

      /*
       * Currently failing tests for continuing to fill out the specification
       *  Spec: https://html.spec.whatwg.org/multipage/semantics.html#the-ol-element
       *
      it('should support the ordered list type="a" attribute past 26 characters', function() {
        var testString = '<ol start="26" type="a"><li>foo</li><li>bar</li></ol>';
        expect(htmlToText.fromString(testString)).to.equal('z. foo\naa. bar');
      });

      it('should support the ordered list type="A" attribute past 26 characters', function() {
        var testString = '<ol start="26" type="A"><li>foo</li><li>bar</li></ol>';
        expect(htmlToText.fromString(testString)).to.equal('Z. foo\nAA. bar');
      });
      */
    });

    it('doesnt wrap li if wordwrap isnt', function () {
      var html = 'Good morning Jacob, \
        <p>Lorem ipsum dolor sit amet</p> \
        <p><strong>Lorem ipsum dolor sit amet.</strong></p> \
        <ul> \
          <li>run in the park <span style="color:#888888;">(in progress)</span></li> \
        </ul> \
      ';
      var resultExpected = 'Good morning Jacob, Lorem ipsum dolor sit amet\n\nLorem ipsum dolor sit amet.\n\n * run in the park (in progress)';
      var result = htmlToText.fromString(html, { wordwrap: false });
      expect(result).to.equal(resultExpected);
    });
  });

  describe('entities', function () {
    it('does not insert null bytes', function () {
      var html = '<a href="some-url?a=b&amp;b=c">Testing &amp; Done</a>';

      var result = htmlToText.fromString(html);
      expect(result).to.equal('Testing & Done [some-url?a=b&b=c]');
    });

    it('should replace entities inside `alt` attributes of images', function () {
      var html = '<img src="test.png" alt="&quot;Awesome&quot;">';

      var result = htmlToText.fromString(html);
      expect(result).to.equal('"Awesome" [test.png]');
    });
  });

  describe('unicode support', function () {
    it('should decode &#128514; to 😂', function () {
      var result = htmlToText.fromString('&#128514;');
      expect(result).to.equal('😂');
    });
  });

  describe('disable uppercaseHeadings', function () {
    [1, 2, 3, 4, 5, 6].forEach(function (i) {
      it('should return h' + i + ' in lowercase', function () {
        var result = htmlToText.fromString('<h' + i + '>test</h' + i + '>', {
          uppercaseHeadings: false
        });
        expect(result).to.equal('test');
      });
    });
  });

  describe('custom formatting', function () {
    it('should allow to pass custom formatting functions', function () {
      var result = htmlToText.fromString('<h1>TeSt</h1>', {
        format: {
          heading: function (elem, fn, options) {
            var h = fn(elem.children, options);
            return '====\n' + h.toLowerCase() + '\n====';
          }
        }
      });
      expect(result).to.equal('====\ntest\n====');
    });
  });

  describe('Base element', function () {
    it('should retrieve and convert the entire document under `body` by default', function() {
      var htmlFile = fs.readFileSync(path.join(__dirname, 'test.html'), 'utf8');
      var txtFile = fs.readFileSync(path.join(__dirname, 'test.txt'), 'utf8');

      var options = {
        tables: ['#invoice', '.address']
      };
      var text = htmlToText.fromString(htmlFile, options);
      expect(text).to.equal(txtFile);
    });

    it('should only retrieve and convert content under the specified base element if found', function() {
      var htmlFile = fs.readFileSync(path.join(__dirname, 'test.html'), 'utf8');
      var txtFile = fs.readFileSync(path.join(__dirname, 'test-address.txt'), 'utf8');

      var options = {
        tables: ['.address'],
        baseElement: 'table.address'
      };
      var text = htmlToText.fromString(htmlFile, options);
      expect(text).to.equal(txtFile);
    });

    it('should retrieve and convert content under multiple base elements', function() {
      var htmlFile = fs.readFileSync(path.join(__dirname, 'test.html'), 'utf8');
      var txtFile = fs.readFileSync(path.join(__dirname, 'test-address-dup.txt'), 'utf8');

      var options = {
        tables: ['.address'],
        baseElement: ['table.address', 'table.address']
      };
      var text = htmlToText.fromString(htmlFile, options);
      expect(text).to.equal(txtFile);
    });

    it('should retrieve and convert content under multiple base elements in any order', function() {
      var htmlFile = fs.readFileSync(path.join(__dirname, 'test.html'), 'utf8');
      var txtFile = fs.readFileSync(path.join(__dirname, 'test-any-order.txt'), 'utf8');

      var options = {
        tables: ['.address'],
        baseElement: ['table.address', 'p.normal-space', 'table.address']
      };
      var text = htmlToText.fromString(htmlFile, options);
      expect(text).to.equal(txtFile);
    });

    it('should process the first base element found when multiple exist', function() {
      var htmlFile = fs.readFileSync(path.join(__dirname, 'test.html'), 'utf8');
      var txtFile = fs.readFileSync(path.join(__dirname, 'test-first-element.txt'), 'utf8');

      var options = {
        tables: ['.address'],
        baseElement: 'p.normal-space'
      };
      var text = htmlToText.fromString(htmlFile, options);
      expect(text).to.equal(txtFile);
    });

    it('should retrieve and convert the entire document by default if no base element is found', function() {
      var htmlFile = fs.readFileSync(path.join(__dirname, 'test.html'), 'utf8');
      var txtFile = fs.readFileSync(path.join(__dirname, 'test.txt'), 'utf8');

      var options = {
        tables: ['#invoice', '.address'],
        baseElement: 'table.notthere'
      };
      var text = htmlToText.fromString(htmlFile, options);
      expect(text).to.equal(txtFile);
    });

    it('should return null if the base element isn\'t found and we\'re not returning the DOM by default', function() {
      var htmlFile = fs.readFileSync(path.join(__dirname, 'test.html'), 'utf8');

      var expectedTxt = '';
      var options = {
        tables: ['#invoice', '.address'],
        baseElement: 'table.notthere',
        returnDomByDefault: false
      };
      var text = htmlToText.fromString(htmlFile, options);
      expect(text).to.equal(expectedTxt);
    });
  });

  describe('Long words', function() {
    it('should split long words if forceWrapOnLimit is set, existing linefeeds converted to space', function() {
      var testString = '<p>_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlong\nword_with_following_text.</p>';
      expect(htmlToText.fromString(testString, { longWordSplit: { wrapCharacters: ['/'], forceWrapOnLimit: true }} ))
          .to.equal('_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlo\nng word_with_following_text.');
    });

    it('should not wrap a string if longWordSplit is not set', function() {
      var testString = '<p>_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlongword_with_following_text.</p>';
      expect(htmlToText.fromString(testString, {} ))
          .to.equal('_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlongword_with_following_text.');
    });

    it('should not wrap a string if not wrapCharacters are found and forceWrapOnLimit is not set', function() {
      var testString = '<p>_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlong\nword_with_following_text.</p>';
      expect(htmlToText.fromString(testString, { longWordSplit: { wrapCharacters: ['/'], forceWrapOnLimit: false }} ))
          .to.equal('_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlong\nword_with_following_text.');
    });

    it('should not wrap a string if no wrapCharacters are set and forceWrapOnLimit is not set', function() {
      var testString = '<p>_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlong\nword_with_following_text.</p>';
      expect(htmlToText.fromString(testString, { longWordSplit: { wrapCharacters: [], forceWrapOnLimit: false }} ))
          .to.equal('_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlong\nword_with_following_text.');
    });

    it('should wrap on the last instance of a wrap character before the wordwrap limit.', function() {
      var testString = '<p>_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlong\nword_with_following_text.</p>';
      expect(htmlToText.fromString(testString, { longWordSplit: { wrapCharacters: ['/', '_'], forceWrapOnLimit: false }} ))
          .to.equal('_This_string_is_meant_to_test_if_a_string_is_split_properly_across_\nanewlineandlong word_with_following_text.');
    });

    it('should wrap on the last instance of a wrap character before the wordwrap limit. Content of wrapCharacters shouldn\'t matter.', function() {
      var testString = '<p>_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlong\nword_with_following_text.</p>';
      expect(htmlToText.fromString(testString, { longWordSplit: { wrapCharacters: ['/','-', '_'], forceWrapOnLimit: false }} ))
          .to.equal('_This_string_is_meant_to_test_if_a_string_is_split_properly_across_\nanewlineandlong word_with_following_text.');
    });

    it('should wrap on the last instance of a wrap character before the wordwrap limit. Order of wrapCharacters shouldn\'t matter.', function() {
      var testString = '<p>_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlong\nword_with_following_text.</p>';
      expect(htmlToText.fromString(testString, { longWordSplit: { wrapCharacters: ['_', '/'], forceWrapOnLimit: false }} ))
          .to.equal('_This_string_is_meant_to_test_if_a_string_is_split_properly_across_\nanewlineandlong word_with_following_text.');
    });

    it('should wrap on the last instance of a wrap character before the wordwrap limit. Should preference wrapCharacters in order', function() {
      var testString = '<p>_This_string_is_meant_to_test_if_a_string_is_split-properly_across_anewlineandlong\nword_with_following_text.</p>';
      expect(htmlToText.fromString(testString, { longWordSplit: { wrapCharacters: ['-', '_', '/'], forceWrapOnLimit: false }} ))
          .to.equal('_This_string_is_meant_to_test_if_a_string_is_split-\nproperly_across_anewlineandlong word_with_following_text.');
    });

    it('should not wrap a string that is too short', function() {
      var testString = '<p>https://github.com/werk85/node-html-to-text/blob/master/lib/html-to-text.js</p>';
      expect(htmlToText.fromString(testString, { longWordSplit: { wrapCharacters: ['/', '-'], forceWrapOnLimit: false }} ))
          .to.equal('https://github.com/werk85/node-html-to-text/blob/master/lib/html-to-text.js');
    });

    it('should wrap a url string using \'/\'', function() {
      var testString = '<p>https://github.com/AndrewFinlay/node-html-to-text/commit/64836a5bd97294a672b24c26cb8a3ccdace41001</p>';
      expect(htmlToText.fromString(testString, { longWordSplit: { wrapCharacters: ['/', '-'], forceWrapOnLimit: false }} ))
          .to.equal('https://github.com/AndrewFinlay/node-html-to-text/commit/\n64836a5bd97294a672b24c26cb8a3ccdace41001');
    });

    it('should wrap very long url strings using \'/\'', function() {
      var testString = '<p>https://github.com/werk85/node-html-to-text/blob/master/lib/werk85/node-html-to-text/blob/master/lib/werk85/node-html-to-text/blob/master/lib/werk85/node-html-to-text/blob/master/lib/werk85/node-html-to-text/blob/master/lib/html-to-text.js</p>';
      expect(htmlToText.fromString(testString, { longWordSplit: { wrapCharacters: ['/', '-'], forceWrapOnLimit: false }} ))
          .to.equal('https://github.com/werk85/node-html-to-text/blob/master/lib/werk85/\nnode-html-to-text/blob/master/lib/werk85/node-html-to-text/blob/master/lib/\nwerk85/node-html-to-text/blob/master/lib/werk85/node-html-to-text/blob/master/\nlib/html-to-text.js');
    });

    it('should wrap very long url strings using limit', function() {
      var testString = '<p>https://github.com/werk85/node-html-to-text/blob/master/lib/werk85/node-html-to-text/blob/master/lib/werk85/node-html-to-text/blob/master/lib/werk85/node-html-to-text/blob/master/lib/werk85/node-html-to-text/blob/master/lib/html-to-text.js</p>';
      expect(htmlToText.fromString(testString, { longWordSplit: { wrapCharacters: [], forceWrapOnLimit: true }} ))
          .to.equal('https://github.com/werk85/node-html-to-text/blob/master/lib/werk85/node-html-to-\ntext/blob/master/lib/werk85/node-html-to-text/blob/master/lib/werk85/node-html-t\no-text/blob/master/lib/werk85/node-html-to-text/blob/master/lib/html-to-text.js');
    });

    it('should honour preserveNewlines and split long words', function() {
      var testString = '<p>_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlong\nword_with_following_text.</p>';
      expect(htmlToText.fromString(testString, { preserveNewlines: true, longWordSplit: { wrapCharacters: ['/', '_'], forceWrapOnLimit: false }} ))
          .to.equal('_This_string_is_meant_to_test_if_a_string_is_split_properly_across_\nanewlineandlong\nword_with_following_text.');
    });

    it('should not put in extra linefeeds if the end of the untouched long string coincides with a preserved line feed', function() {
      var testString = '<p>_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlong\nword_with_following_text.</p>';
      expect(htmlToText.fromString(testString, { preserveNewlines: true } ))
          .to.equal('_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlong\nword_with_following_text.');
    });

    it('should split long strings buried in links and hide the href', function() {
      var testString = '<a href="http://images.fb.com/2015/12/21/ivete-sangalo-launches-360-music-video-on-facebook/">http://images.fb.com/2015/12/21/ivete-sangalo-launches-360-music-video-on-facebook/</a>';
      expect(htmlToText.fromString(testString, { hideLinkHrefIfSameAsText: true, longWordSplit: { wrapCharacters: ['/', '_'], forceWrapOnLimit: false }} ))
          .to.equal('http://images.fb.com/2015/12/21/\nivete-sangalo-launches-360-music-video-on-facebook/');
    });

    it('should split long strings buried in links and show the href', function() {
      var testString = '<a href="http://images.fb.com/2015/12/21/ivete-sangalo-launches-360-music-video-on-facebook/">http://images.fb.com/2015/12/21/ivete-sangalo-launches-360-music-video-on-facebook/</a>';
      expect(htmlToText.fromString(testString, { hideLinkHrefIfSameAsText: false, longWordSplit: { wrapCharacters: ['/', '_'], forceWrapOnLimit: false }} ))
          .to.equal('http://images.fb.com/2015/12/21/\nivete-sangalo-launches-360-music-video-on-facebook/\n[http://images.fb.com/2015/12/21/\nivete-sangalo-launches-360-music-video-on-facebook/]');
    });
  });

  describe('whitespace', function() {
    it('should not be ignored inside a whitespace-only node', function() {
      var testString = 'foo<span> </span>bar';
      expect(htmlToText.fromString(testString)).to.equal('foo bar');
    });

    it('should not add additional whitespace after <sup>', function() {
      var testString = '<p>This text contains <sup>superscript</sup> text.</p>';
      var options = { preserveNewlines: true };

      expect(htmlToText.fromString(testString, options)).to.equal('This text contains superscript text.');
    });
  });

  describe('wbr', function() {
    it('should handle a large number of wbr tags w/o stack overflow', function() {
      var testString = "<!DOCTYPE html><html><head></head><body>\n";
      var expectedResult = "";
      for (var i = 0; i < 1000; i++){
        if (i !== 0 && i % 80 === 0) {
          expectedResult += "\n";
        }
        expectedResult += "n";
        testString += "<wbr>n";
      }
      testString += "</body></html>";
      expect(htmlToText.fromString(testString)).to.equal(expectedResult);
    });
  });

  describe('blockquote', function() {
    it('should handle format blockquote', function() {
      var testString = 'foo<blockquote>test</blockquote>bar';
      var expectedResult = 'foo> test\nbar';
      expect(htmlToText.fromString(testString)).to.equal(expectedResult);
    });
  });
});
