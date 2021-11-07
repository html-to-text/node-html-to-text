const fs = require('fs');
const path = require('path');

const { expect } = require('chai');

const { compile, convert } = require('..');


const defaultConvert = compile();

describe('html-to-text', function () {

  describe('smoke test', function () {

    it('should return empty input unchanged', function () {
      expect(defaultConvert('')).to.equal('');
    });

    it('should return empty result if input undefined', function () {
      expect(defaultConvert()).to.equal('');
    });

    it('should return plain text (no line breaks) unchanged', function () {
      expect(defaultConvert('Hello world!')).to.equal('Hello world!');
    });

  });

  describe('skipped html content', function () {

    it('should ignore html comments', function () {
      const html = /*html*/`
        <!--[^-]*-->
        <!-- <h1>Hello World</h1> -->
        text
      `;
      expect(defaultConvert(html)).to.equal('text');
    });

    it('should ignore scripts', function () {
      const html = /*html*/`
        <script src="javascript.js"></script>
        <script>
          console.log("Hello World!");
        </script>
        <script id="data" type="application/json">{"userId":1234,"userName":"John Doe","memberSince":"2000-01-01T00:00:00.000Z"}</script>
        text
      `;
      expect(defaultConvert(html)).to.equal('text');
    });

    it('should ignore styles', function () {
      const html = /*html*/`
        <link href="main.css" rel="stylesheet">
        <style type="text/css" media="all and (max-width: 500px)">
          p { color: #26b72b; }
        </style>
        text
      `;
      expect(defaultConvert(html)).to.equal('text');
    });

  });

  describe('wordwrap option', function () {

    let longStr;

    beforeEach(function () {
      longStr = '111111111 222222222 333333333 444444444 555555555 666666666 777777777 888888888 999999999';
    });

    it('should wordwrap at 80 characters by default', function () {
      expect(defaultConvert(longStr)).to.equal('111111111 222222222 333333333 444444444 555555555 666666666 777777777 888888888\n999999999');
    });

    it('should wordwrap at given number of characters', function () {
      expect(convert(longStr, { wordwrap: 20 })).to.equal('111111111 222222222\n333333333 444444444\n555555555 666666666\n777777777 888888888\n999999999');
      expect(convert(longStr, { wordwrap: 50 })).to.equal('111111111 222222222 333333333 444444444 555555555\n666666666 777777777 888888888 999999999');
      expect(convert(longStr, { wordwrap: 70 })).to.equal('111111111 222222222 333333333 444444444 555555555 666666666 777777777\n888888888 999999999');
    });

    it('should not wordwrap when given null', function () {
      expect(convert(longStr, { wordwrap: null })).to.equal(longStr);
    });

    it('should not wordwrap when given false', function () {
      expect(convert(longStr, { wordwrap: false })).to.equal(longStr);
    });

    it('should not exceed the line width when processing embedded format tags', function () {
      const html = '<p><strong>This text isn\'t counted</strong> when calculating where to break a string for 80 character line lengths.</p>';
      const expected = 'This text isn\'t counted when calculating where to break a string for 80\ncharacter line lengths.';
      expect(convert(html, {})).to.equal(expected);
    });

    it('should work with a long string containing line feeds', function () {
      const html = '<p>If a word with a line feed exists over the line feed boundary then\nyou\nmust\nrespect it.</p>';
      const expected = 'If a word with a line feed exists over the line feed boundary then you must\nrespect it.';
      expect(convert(html, {})).to.equal(expected);
    });

    it('should not wrongly truncate lines when processing embedded format tags', function () {
      const html = '<p><strong>This text isn\'t counted</strong> when calculating where to break a string for 80 character line lengths.  However it can affect where the next line breaks and this could lead to having an early line break</p>';
      const expected = 'This text isn\'t counted when calculating where to break a string for 80\ncharacter line lengths. However it can affect where the next line breaks and\nthis could lead to having an early line break';
      expect(convert(html, {})).to.equal(expected);
    });

    it('should not exceed the line width when processing anchor tags', function () {
      const html = "<p>We appreciate your business. And we hope you'll check out our <a href=\"http://example.com/\">new products</a>!</p>";
      const expected = 'We appreciate your business. And we hope you\'ll check out our new products\n[http://example.com/]!';
      expect(convert(html, {})).to.equal(expected);
    });

    it('should honour line feeds from a long word across the wrap, where the line feed is before the wrap', function () {
      const html = '<p>This string is meant to test if a string is split properly across a\nnewlineandlongword with following text.</p>';
      const expected = 'This string is meant to test if a string is split properly across a\nnewlineandlongword with following text.';
      expect(convert(html, {})).to.equal(expected);
    });

    it('should remove line feeds from a long word across the wrap, where the line feed is after the wrap', function () {
      const html = '<p>This string is meant to test if a string is split properly across anewlineandlong\nword with following text.</p>';
      const expected = 'This string is meant to test if a string is split properly across\nanewlineandlong word with following text.';
      expect(convert(html, {})).to.equal(expected);
    });

  });

  describe('preserveNewlines option', function () {

    it('should not preserve newlines by default', function () {
      const html = '<p\n>One\nTwo\nThree</p>';
      const expected = 'One Two Three';
      expect(defaultConvert(html)).to.equal(expected);
    });

    it('should preserve newlines when provided with a truthy value', function () {
      const html = '<p\n>One\nTwo\nThree</p>';
      const expected = 'One\nTwo\nThree';
      expect(convert(html, { preserveNewlines: true })).to.equal(expected);
    });

    it('should preserve line feeds in a long wrapping string containing line feeds', function () {
      const html = '<p>If a word with a line feed exists over the line feed boundary then\nyou\nmust\nrespect it.</p>';
      const expected = 'If a word with a line feed exists over the line feed boundary then\nyou\nmust\nrespect it.';
      expect(convert(html, { preserveNewlines: true })).to.equal(expected);
    });

    it('should preserve line feeds in a long string containing line feeds across the wrap', function () {
      const html = '<p>If a word with a line feed exists over the line feed boundary then\nyou must respect it.</p>';
      const expected = 'If a word with a line feed exists over the line feed boundary then\nyou must respect it.';
      expect(convert(html, { preserveNewlines: true })).to.equal(expected);
    });

    it('should preserve line feeds in a long string containing line feeds across the wrap with a line feed before 80 chars', function () {
      const html = '<p>This string is meant to test if a string is split properly across a\nnewlineandlongword with following text.</p>';
      const expected = 'This string is meant to test if a string is split properly across a\nnewlineandlongword with following text.';
      expect(convert(html, { preserveNewlines: true })).to.equal(expected);
    });

    it('should preserve line feeds in a long string containing line feeds across the wrap with a line feed after 80 chars', function () {
      const html = '<p>This string is meant to test if a string is split properly across anewlineandlong\nword with following text.</p>';
      const expected = 'This string is meant to test if a string is split properly across\nanewlineandlong\nword with following text.';
      expect(convert(html, { preserveNewlines: true })).to.equal(expected);
    });

    it('should split long lines', function () {
      const html = '<p>If a word with a line feed exists over the line feed boundary then you must respect it.</p>';
      const expected = 'If a word with a line feed exists over the line feed boundary then you must\nrespect it.';
      expect(convert(html, { preserveNewlines: true })).to.equal(expected);
    });

    it('should remove spaces if they occur around line feed', function () {
      const html = '<p>A string of text\nwith \nmultiple\n spaces   \n   that \n \n can be safely removed.</p>';
      const expected = 'A string of text\nwith\nmultiple\nspaces\nthat\n\ncan be safely removed.';
      expect(convert(html, { preserveNewlines: true })).to.equal(expected);
    });

    it('should remove spaces if they occur around line feed 2', function () {
      const html = 'multiple\n spaces';
      const expected = 'multiple\nspaces';
      expect(convert(html, { preserveNewlines: true })).to.equal(expected);
    });

    it('should produce equal results regardless of newline position between blocks', function () {
      const newlineOutside = '<p>A</p>\n<p>B</p>';
      const newlineInside = '<p>A</p><p>\nB</p>';
      const r1 = convert(newlineOutside, { preserveNewlines: true });
      const r2 = convert(newlineInside, { preserveNewlines: true });
      expect(r1).to.equal(r2);
    });

    it('should produce equal results for preserved newlines and BR tags', function () {
      const nlHtml = '<p>A</p>\n<p>B</p><p>\nC</p>';
      const brHtml = '<p>A</p><br/><p>B</p><p><br/>C</p>';
      const nlResult = convert(nlHtml, { preserveNewlines: true });
      const brResult = convert(brHtml);
      expect(nlResult).to.equal(brResult);
    });

    it('should account for trailing/leading linebreaks of adjacent blocks equally', function () {
      const html = '<p>A</p>\n<div>B</div>\n<div>C</div>\n<p>D</p>';
      const newlineInside = 'A\n\n\nB\n\nC\n\n\nD';
      expect(convert(html, { preserveNewlines: true })).to.equal(newlineInside);
    });

    it('should work with multiple linebreaks and in presence of whitespaces', function () {
      const html = '<p>A</p> \n \n <p>B</p>';
      const newlineInside = 'A\n\n\n\nB';
      expect(convert(html, { preserveNewlines: true })).to.equal(newlineInside);
    });

    it('should have no special behavior in presence of words among linebreaks', function () {
      const html = '<p>A</p> \n B \n <p>C</p>';
      const newlineInside = 'A\n\n\nB\n\n\nC';
      expect(convert(html, { preserveNewlines: true })).to.equal(newlineInside);
    });

  });

  describe('unicode and html entities', function () {

    it('should decode &#128514; to 😂', function () {
      expect(defaultConvert('&#128514;')).to.equal('😂');
    });

    it('should decode &lt;&gt; to <>', function () {
      expect(defaultConvert('<span>span</span>, &lt;not a span&gt;')).to.equal('span, <not a span>');
    });

  });

  describe('base element', function () {

    it('should retrieve and convert the entire document under `body` by default', function () {
      const html = fs.readFileSync(path.join(__dirname, 'test.html'), 'utf8');
      const expected = fs.readFileSync(path.join(__dirname, 'test.txt'), 'utf8');
      const options = {
        selectors: [
          { selector: 'table#invoice', format: 'dataTable' },
          { selector: 'table.address', format: 'dataTable' }
        ]
      };
      expect(convert(html, options)).to.equal(expected);
    });

    it('should only retrieve and convert content under the specified base element if found', function () {
      const html = fs.readFileSync(path.join(__dirname, 'test.html'), 'utf8');
      const expected = fs.readFileSync(path.join(__dirname, 'test-address.txt'), 'utf8');
      const options = {
        baseElements: { selectors: ['table.address'] },
        selectors: [
          { selector: 'table.address', format: 'dataTable' }
        ]
      };
      expect(convert(html, options)).to.equal(expected);
    });

    it('should not repeat the same base element', function () {
      const html = fs.readFileSync(path.join(__dirname, 'test.html'), 'utf8');
      const expected = fs.readFileSync(path.join(__dirname, 'test-address.txt'), 'utf8');
      const options = {
        baseElements: { selectors: ['table.address', 'table.address'] },
        selectors: [
          { selector: 'table.address', format: 'dataTable' }
        ]
      };
      expect(convert(html, options)).to.equal(expected);
    });

    it('should retrieve base elements in order of occurrence', function () {
      const html = fs.readFileSync(path.join(__dirname, 'test.html'), 'utf8');
      const expected = fs.readFileSync(path.join(__dirname, 'test-orderby-occurrence.txt'), 'utf8');
      const options = {
        baseElements: {
          selectors: ['p.normal-space.small', 'table.address'],
          orderBy: 'occurrence'
        },
        selectors: [
          { selector: 'table.address', format: 'dataTable' }
        ]
      };
      expect(convert(html, options)).to.equal(expected);
    });

    it('should retrieve base elements in order of selectors', function () {
      const html = fs.readFileSync(path.join(__dirname, 'test.html'), 'utf8');
      const expected = fs.readFileSync(path.join(__dirname, 'test-orderby-selectors.txt'), 'utf8');
      const options = {
        baseElements: {
          selectors: ['p.normal-space.small', 'table.address'],
          orderBy: 'selectors'
        },
        selectors: [
          { selector: 'table.address', format: 'dataTable' }
        ]
      };
      expect(convert(html, options)).to.equal(expected);
    });

    it('should retrieve all different base elements matched the same selector', function () {
      const html = fs.readFileSync(path.join(__dirname, 'test.html'), 'utf8');
      const expected = fs.readFileSync(path.join(__dirname, 'test-multiple-elements.txt'), 'utf8');
      const options = { baseElements: { selectors: ['p.normal-space'] } };
      expect(convert(html, options)).to.equal(expected);
    });

    it('should respect maxBaseElements limit', function () {
      const html = /*html*/`<!DOCTYPE html><html><head></head><body><p>a</p><div>div</div><p>b</p><p>c</p><p>d</p><p>e</p><p>f</p><p>g</p><p>h</p><p>i</p><p>j</p></body></html>`;
      const expected = 'a\n\ndiv\n\nb';
      const options = {
        baseElements: { selectors: ['p', 'div'], orderBy: 'occurrence' },
        limits: { maxBaseElements: 3 }
      };
      expect(convert(html, options)).to.equal(expected);
    });

    it('should retrieve and convert the entire document by default if no base element is found', function () {
      const html = fs.readFileSync(path.join(__dirname, 'test.html'), 'utf8');
      const expected = fs.readFileSync(path.join(__dirname, 'test.txt'), 'utf8');
      const options = {
        baseElements: { selectors: ['table.notthere'] },
        selectors: [
          { selector: 'table#invoice', format: 'dataTable' },
          { selector: 'table.address', format: 'dataTable' }
        ]
      };
      expect(convert(html, options)).to.equal(expected);
    });

    it('should return null if the base element isn\'t found and we\'re not returning the DOM by default', function () {
      const html = fs.readFileSync(path.join(__dirname, 'test.html'), 'utf8');
      const expected = '';
      const options = {
        baseElements: {
          selectors: ['table.notthere'],
          returnDomByDefault: false
        },
        selectors: [
          { selector: 'table#invoice', format: 'dataTable' },
          { selector: 'table.address', format: 'dataTable' }
        ]
      };
      expect(convert(html, options)).to.equal(expected);
    });

  });

  describe('long words', function () {

    it('should split long words if forceWrapOnLimit is set, existing linefeeds converted to space', function () {
      const html = '<p>_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlong\nword_with_following_text.</p>';
      const options = { longWordSplit: { wrapCharacters: ['/'], forceWrapOnLimit: true } };
      const expected = '_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlo\nng word_with_following_text.';
      expect(convert(html, options)).to.equal(expected);
    });

    it('should not wrap a string if longWordSplit is not set', function () {
      const html = '<p>_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlongword_with_following_text.</p>';
      const expected = '_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlongword_with_following_text.';
      expect(convert(html, {})).to.equal(expected);
    });

    it('should not wrap a string if wrapCharacters are set but not found and forceWrapOnLimit is not set', function () {
      const html = '<p>_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlong\nword_with_following_text.</p>';
      const options = { longWordSplit: { wrapCharacters: ['/'], forceWrapOnLimit: false } };
      const expected = '_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlong\nword_with_following_text.';
      expect(convert(html, options)).to.equal(expected);
    });

    it('should not wrap a string if wrapCharacters are not set and forceWrapOnLimit is not set', function () {
      const html = '<p>_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlong\nword_with_following_text.</p>';
      const options = { longWordSplit: { wrapCharacters: [], forceWrapOnLimit: false } };
      const expected = '_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlong\nword_with_following_text.';
      expect(convert(html, options)).to.equal(expected);
    });

    it('should wrap on the last instance of a wrap character before the wordwrap limit.', function () {
      const html = '<p>_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlong\nword_with_following_text.</p>';
      const options = { longWordSplit: { wrapCharacters: ['/', '_'], forceWrapOnLimit: false } };
      const expected = '_This_string_is_meant_to_test_if_a_string_is_split_properly_across_\nanewlineandlong word_with_following_text.';
      expect(convert(html, options)).to.equal(expected);
    });

    it('should wrap on the last instance of a wrap character before the wordwrap limit. Content of wrapCharacters shouldn\'t matter.', function () {
      const html = '<p>_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlong\nword_with_following_text.</p>';
      const options = { longWordSplit: { wrapCharacters: ['/', '-', '_'], forceWrapOnLimit: false } };
      const expected = '_This_string_is_meant_to_test_if_a_string_is_split_properly_across_\nanewlineandlong word_with_following_text.';
      expect(convert(html, options)).to.equal(expected);
    });

    it('should wrap on the last instance of a wrap character before the wordwrap limit. Order of wrapCharacters shouldn\'t matter.', function () {
      const html = '<p>_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlong\nword_with_following_text.</p>';
      const options = { longWordSplit: { wrapCharacters: ['_', '/'], forceWrapOnLimit: false } };
      const expected = '_This_string_is_meant_to_test_if_a_string_is_split_properly_across_\nanewlineandlong word_with_following_text.';
      expect(convert(html, options)).to.equal(expected);
    });

    it('should wrap on the last instance of a wrap character before the wordwrap limit. Should preference wrapCharacters in order', function () {
      const html = '<p>_This_string_is_meant_to_test_if_a_string_is_split-properly_across_anewlineandlong\nword_with_following_text.</p>';
      const options = { longWordSplit: { wrapCharacters: ['-', '_', '/'], forceWrapOnLimit: false } };
      const expected = '_This_string_is_meant_to_test_if_a_string_is_split-\nproperly_across_anewlineandlong word_with_following_text.';
      expect(convert(html, options)).to.equal(expected);
    });

    it('should not wrap a string that is too short', function () {
      const html = '<p>https://github.com/werk85/node-html-to-text/blob/master/lib/html-to-text.js</p>';
      const options = { longWordSplit: { wrapCharacters: ['/', '-'], forceWrapOnLimit: false } };
      const expected = 'https://github.com/werk85/node-html-to-text/blob/master/lib/html-to-text.js';
      expect(convert(html, options)).to.equal(expected);
    });

    it('should wrap a url string using \'/\'', function () {
      const html = '<p>https://github.com/AndrewFinlay/node-html-to-text/commit/64836a5bd97294a672b24c26cb8a3ccdace41001</p>';
      const options = { longWordSplit: { wrapCharacters: ['/', '-'], forceWrapOnLimit: false } };
      const expected = 'https://github.com/AndrewFinlay/node-html-to-text/commit/\n64836a5bd97294a672b24c26cb8a3ccdace41001';
      expect(convert(html, options)).to.equal(expected);
    });

    it('should wrap very long url strings using \'/\'', function () {
      const html = '<p>https://github.com/werk85/node-html-to-text/blob/master/lib/werk85/node-html-to-text/blob/master/lib/werk85/node-html-to-text/blob/master/lib/werk85/node-html-to-text/blob/master/lib/werk85/node-html-to-text/blob/master/lib/html-to-text.js</p>';
      const options = { longWordSplit: { wrapCharacters: ['/', '-'], forceWrapOnLimit: false } };
      const expected = 'https://github.com/werk85/node-html-to-text/blob/master/lib/werk85/\nnode-html-to-text/blob/master/lib/werk85/node-html-to-text/blob/master/lib/\nwerk85/node-html-to-text/blob/master/lib/werk85/node-html-to-text/blob/master/\nlib/html-to-text.js';
      expect(convert(html, options)).to.equal(expected);
    });

    it('should wrap very long url strings using limit', function () {
      const html = '<p>https://github.com/werk85/node-html-to-text/blob/master/lib/werk85/node-html-to-text/blob/master/lib/werk85/node-html-to-text/blob/master/lib/werk85/node-html-to-text/blob/master/lib/werk85/node-html-to-text/blob/master/lib/html-to-text.js</p>';
      const options = { longWordSplit: { wrapCharacters: [], forceWrapOnLimit: true } };
      const expected = 'https://github.com/werk85/node-html-to-text/blob/master/lib/werk85/node-html-to-\ntext/blob/master/lib/werk85/node-html-to-text/blob/master/lib/werk85/node-html-t\no-text/blob/master/lib/werk85/node-html-to-text/blob/master/lib/html-to-text.js';
      expect(convert(html, options)).to.equal(expected);
    });

    it('should honour preserveNewlines and split long words', function () {
      const html = '<p>_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlong\nword_with_following_text.</p>';
      const options = { preserveNewlines: true, longWordSplit: { wrapCharacters: ['/', '_'], forceWrapOnLimit: false } };
      const expected = '_This_string_is_meant_to_test_if_a_string_is_split_properly_across_\nanewlineandlong\nword_with_following_text.';
      expect(convert(html, options)).to.equal(expected);
    });

    it('should not put in extra linefeeds if the end of the untouched long string coincides with a preserved line feed', function () {
      const html = '<p>_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlong\nword_with_following_text.</p>';
      const expected = '_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlong\nword_with_following_text.';
      expect(convert(html, { preserveNewlines: true })).to.equal(expected);
    });

    it('should split long strings buried in links and hide the href', function () {
      const html = '<a href="http://images.fb.com/2015/12/21/ivete-sangalo-launches-360-music-video-on-facebook/">http://images.fb.com/2015/12/21/ivete-sangalo-launches-360-music-video-on-facebook/</a>';
      const options = {
        longWordSplit: { wrapCharacters: ['/', '_'], forceWrapOnLimit: false },
        selectors: [
          { selector: 'a', options: { hideLinkHrefIfSameAsText: true } }
        ]
      };
      const expected = 'http://images.fb.com/2015/12/21/\nivete-sangalo-launches-360-music-video-on-facebook/';
      expect(convert(html, options)).to.equal(expected);
    });

    it('should split long strings buried in links and show the href', function () {
      const html = '<a href="http://images.fb.com/2015/12/21/ivete-sangalo-launches-360-music-video-on-facebook/">http://images.fb.com/2015/12/21/ivete-sangalo-launches-360-music-video-on-facebook/</a>';
      const options = { longWordSplit: { wrapCharacters: ['/', '_'], forceWrapOnLimit: false } };
      const expected = 'http://images.fb.com/2015/12/21/\nivete-sangalo-launches-360-music-video-on-facebook/\n[http://images.fb.com/2015/12/21/\nivete-sangalo-launches-360-music-video-on-facebook/]';
      expect(convert(html, options)).to.equal(expected);
    });

  });

  describe('whitespace', function () {

    it('should not be ignored inside a whitespace-only node', function () {
      const html = 'foo<span> </span>bar';
      const expected = 'foo bar';
      expect(defaultConvert(html)).to.equal(expected);
    });

    it('should handle html character entities for html whitespace characters', function () {
      const html = /*html*/`a<span>&#x0020;</span>b<span>&Tab;</span>c<span>&NewLine;</span>d<span>&#10;</span>e`;
      const result = defaultConvert(html);
      const expected = 'a b c d e';
      expect(result).to.equal(expected);
    });

    it('should not add additional whitespace after <sup>', function () {
      const html = '<p>This text contains <sup>superscript</sup> text.</p>';
      const options = { preserveNewlines: true };
      const expected = 'This text contains superscript text.';
      expect(convert(html, options)).to.equal(expected);
    });

    it('should handle custom whitespace characters', function () {
      // No-Break Space - decimal 160, hex \u00a0.
      const html = /*html*/`<span>first span\u00a0</span>&nbsp;<span>&#160;last span</span>`;

      const expectedDefault = 'first span\u00a0\u00a0\u00a0last span';
      expect(defaultConvert(html)).to.equal(expectedDefault);

      const options = { whitespaceCharacters: ' \t\r\n\f\u200b\u00a0' };
      const expectedCustom = 'first span last span';
      expect(convert(html, options)).to.equal(expectedCustom);
    });

    it('should handle space and newline combination - keep space when and only when needed', function () {
      const html = '<span>foo</span> \n<span>bar</span>\n <span>baz</span>';

      const expectedDefault = 'foo bar baz';
      expect(defaultConvert(html)).to.equal(expectedDefault);

      const expectedCustom = 'foo\nbar\nbaz';
      expect(convert(html, { preserveNewlines: true })).to.equal(expectedCustom);
    });

    it('should not have extra spaces at the beginning for space-indented html', function () {
      const html = /*html*/`<html>
<body>
    <p>foo</p>
    <p>bar</p>
</body>
</html>`;
      const expected = 'foo\n\nbar';
      expect(defaultConvert(html)).to.equal(expected);
    });

  });

  describe('lots of tags, limits', function () {

    it('should handle a large number of wbr tags w/o stack overflow', function () {
      let html = '<!DOCTYPE html><html><head></head><body>\n';
      let expected = '';
      for (let i = 0; i < 10000; i++) {
        if (i !== 0 && i % 80 === 0) {
          expected += '\n';
        }
        expected += 'n';
        html += '<wbr>n';
      }
      html += '</body></html>';
      expect(defaultConvert(html)).to.equal(expected);
    });

    it('should handle a very large number of wbr tags with limits', function () {
      let html = '<!DOCTYPE html><html><head></head><body>';
      for (let i = 0; i < 70000; i++) {
        html += '<wbr>n';
      }
      html += '</body></html>';
      const options = {
        limits: {
          maxChildNodes: 10,
          ellipsis: '(...)'
        }
      };
      const expected = 'nnnnn(...)';
      expect(convert(html, options)).to.equal(expected);
    });

    it('should respect maxDepth limit', function () {
      const html = /*html*/`<!DOCTYPE html><html><head></head><body><span>a<span>b<span>c<span>d</span>e</span>f</span>g<span>h<span>i<span>j</span>k</span>l</span>m</span></body></html>`;
      const options = {
        limits: {
          maxDepth: 2,
          ellipsis: '(...)'
        }
      };
      const expected = 'a(...)g(...)m';
      expect(convert(html, options)).to.equal(expected);
    });

    it('should respect maxChildNodes limit', function () {
      const html = /*html*/`<!DOCTYPE html><html><head></head><body><p>a</p><p>b</p><p>c</p><p>d</p><p>e</p><p>f</p><p>g</p><p>h</p><p>i</p><p>j</p></body></html>`;
      const options = {
        limits: {
          maxChildNodes: 6,
          ellipsis: '(skipped the rest)'
        },
        selectors: [
          { selector: 'p', options: { leadingLineBreaks: 1, trailingLineBreaks: 1 } }
        ]
      };
      const expected = 'a\nb\nc\nd\ne\nf\n(skipped the rest)';
      expect(convert(html, options)).to.equal(expected);
    });

    it('should not add ellipsis when maxChildNodes limit is exact match', function () {
      const html = /*html*/`<!DOCTYPE html><html><head></head><body><p>a</p><p>b</p><p>c</p><p>d</p><p>e</p><p>f</p><p>g</p><p>h</p><p>i</p><p>j</p></body></html>`;
      const options = {
        limits: {
          maxChildNodes: 10,
          ellipsis: 'can\'t see me'
        },
        selectors: [
          { selector: 'p', options: { leadingLineBreaks: 1, trailingLineBreaks: 1 } }
        ]
      };
      const expected = 'a\nb\nc\nd\ne\nf\ng\nh\ni\nj';
      expect(convert(html, options)).to.equal(expected);
    });

    it('should use default ellipsis value if none provided', function () {
      const html = /*html*/`<!DOCTYPE html><html><head></head><body><p>a</p><p>b</p><p>c</p><p>d</p><p>e</p><p>f</p><p>g</p><p>h</p><p>i</p><p>j</p></body></html>`;
      const options = {
        limits: { maxChildNodes: 6 },
        selectors: [
          { selector: 'p', options: { leadingLineBreaks: 1, trailingLineBreaks: 1 } }
        ]
      };
      const expected = 'a\nb\nc\nd\ne\nf\n...';
      expect(convert(html, options)).to.equal(expected);
    });

  });

  describe('limits.maxInputLength', function () {

    const processStderrWrite = process.stderr.write;

    let processStderrWriteBuffer;
    const overwriteProcessStderrWrite = () => {
      processStderrWriteBuffer = '';
      process.stderr.write = (text) => { processStderrWriteBuffer += text; };
    };
    const getProcessStderrBuffer = () => processStderrWriteBuffer;
    const resetProcessStderrWrite = () => { process.stderr.write = processStderrWrite; };

    beforeEach(function () { overwriteProcessStderrWrite(); });
    afterEach(function () { resetProcessStderrWrite(); });

    it('should respect default limit of maxInputLength', function () {
      const html = '0123456789'.repeat(2000000);
      const options = { wordwrap: false };
      expect(convert(html, options).length).to.equal(1 << 24);
      const expectedStderrBuffer = 'Input length 20000000 is above allowed limit of 16777216. Truncating without ellipsis.\n';
      expect(getProcessStderrBuffer()).to.equal(expectedStderrBuffer);
    });

    it('should respect custom maxInputLength', function () {
      const html = '0123456789'.repeat(2000000);
      const options = { limits: { maxInputLength: 42 } };
      expect(convert(html, options).length).to.equal(42);
      const expectedStderrBuffer = 'Input length 20000000 is above allowed limit of 42. Truncating without ellipsis.\n';
      expect(getProcessStderrBuffer()).to.equal(expectedStderrBuffer);
    });

  });

});
