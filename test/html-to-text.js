const fs = require('fs');
const path = require('path');

const { expect } = require('chai');

const { htmlToText } = require('..');


describe('html-to-text', function () {

  describe('Smoke test', function () {
    it('should return empty input unchanged', function () {
      expect(htmlToText('')).to.equal('');
    });

    it('should return empty result if input undefined', function () {
      expect(htmlToText()).to.equal('');
    });

    it('should return plain text (no line breaks) unchanged', function () {
      expect(htmlToText('Hello world!')).to.equal('Hello world!');
    });
  });

  describe('.htmlToText()', function () {
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
        newlineStr = '<p\n>One\nTwo\nThree</p>'; // newline inside a tag is intentional
      });

      it('should not preserve newlines by default', function () {
        expect(htmlToText(newlineStr)).to.equal('One Two Three');
      });

      it('should preserve newlines when provided with a truthy value', function () {
        expect(htmlToText(newlineStr, { preserveNewlines: true })).to.equal('One\nTwo\nThree');
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

      it('should remove spaces if they occur around line feed', function () {
        const testString = '<p>A string of text\nwith \nmultiple\n spaces   \n   that \n \n can be safely removed.</p>';
        expect(htmlToText(testString, { preserveNewlines: true }))
          .to.equal('A string of text\nwith\nmultiple\nspaces\nthat\n\ncan be safely removed.');
      });

      it('should remove spaces if they occur around line feed 2', function () {
        const testString = 'multiple\n spaces';
        expect(htmlToText(testString, { preserveNewlines: true }))
          .to.equal('multiple\nspaces');
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

  describe('block-level elements', function () {

    it('should render common block-level elements on separate lines with default line breaks number', function () {
      const testString =
        'a<article>article</article>b<aside>aside</aside>c<div>div</div>d<footer>footer</footer>' +
        'e<form>form</form>f<header>header</header>g<main>main</main>h<nav>nav</nav>i<section>section</section>j';
      const expectedResult = 'a\narticle\nb\naside\nc\ndiv\nd\nfooter\ne\nform\nf\nheader\ng\nmain\nh\nnav\ni\nsection\nj';
      expect(htmlToText(testString)).to.equal(expectedResult);
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
      const resultExpected = 'Good morning Jacob,\n\nLorem ipsum dolor sit amet.';
      const result = htmlToText(html, { tables: true });
      expect(result).to.equal(resultExpected);
    });

    it('should handle non-integer colspan on td element gracefully', function () {
      const html = `Good morning Jacob,
        <table>
        <tbody>
        <tr>
        <td colspan="abc">Lorem ipsum dolor sit amet.</td>
        </tr>
        </tbody>
        </table>
      `;
      const resultExpected = 'Good morning Jacob,\n\nLorem ipsum dolor sit amet.';
      const result = htmlToText(html, { tables: true });
      expect(result).to.equal(resultExpected);
    });

    it('should handle tables with colspans and rowspans', function () {
      const html = /*html*/`
<table>
    <tr>
        <td colspan="2" rowspan="3">aa<br/>aa<br/>aa</td>
        <td colspan="1" rowspan="3">b<br/>b<br/>b</td>
        <td colspan="4" rowspan="2">cccc<br/>cccc</td>
        <td colspan="1" rowspan="4">d<br/>d<br/>d<br/>d</td>
    </tr>
    <tr></tr>
    <tr>
        <td colspan="2" rowspan="3">ee<br/>ee<br/>ee</td>
        <td colspan="2" rowspan="2">ff<br/>ff</td>
    </tr>
    <tr>
        <td colspan="3" rowspan="1">ggg</td>
    </tr>
    <tr>
        <td colspan="1" rowspan="2">h<br/>h</td>
        <td colspan="2" rowspan="2">ii<br/>ii</td>
        <td colspan="3" rowspan="1">jjj</td>
    </tr>
    <tr>
        <td colspan="1" rowspan="2">k<br/>k</td>
        <td colspan="2" rowspan="2">ll<br/>ll</td>
        <td colspan="2" rowspan="1">mm</td>
    </tr>
    <tr>
        <td colspan="2" rowspan="2">nn<br/>nn</td>
        <td colspan="1" rowspan="1">o</td>
        <td colspan="2" rowspan="2">pp<br/>pp</td>
    </tr>
    <tr>
        <td colspan="4" rowspan="1">qqqq</td>
    </tr>
</table>`;
      const resultExpected =
        'aa   b   cccc      d\n' +
        'aa   b   cccc      d\n' +
        'aa   b   ee   ff   d\n' +
        'ggg      ee   ff   d\n' +
        'h   ii   ee   jjj\n' +
        'h   ii   k   ll   mm\n' +
        'nn   o   k   ll   pp\n' +
        'nn   qqqq         pp';
      const result = htmlToText(html, { tables: true });
      expect(result).to.equal(resultExpected);
    });

    it('should support custom spacing for tables', function () {
      const html = /*html*/`
<table>
    <tr>
        <td colspan="2" rowspan="2">aa<br/>aa</td>
        <td>b</td>
    </tr>
    <tr>
        <td>c</td>
    </tr>
    <tr>
        <td>d</td>
        <td>e</td>
        <td>f</td>
    </tr>
</table>`;
      const resultExpected =
        'aa  b\n' +
        'aa\n' +
        '    c\n' +
        '\n' +
        'd e f';
      const result = htmlToText(html, { tables: true, tags: { 'table': { options: { colSpacing: 1, rowSpacing: 1 } } } });
      expect(result).to.equal(resultExpected);
    });

    it('should properly align columns in tables with thead, tfoot', function () {
      const html = /*html*/`
<table>
    <thead>
        <tr>
            <td>aaaaaaaaa</td>
            <td colspan="2">b</td>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>ccc</td>
            <td>ddd</td>
            <td>eee</td>
        </tr>
    </tbody>
    <tfoot>
        <tr>
            <td colspan="2">f</td>
            <td>ggggggggg</td>
        </tr>
    </tfoot>
</table>`;
      const resultExpected =
        'aaaaaaaaa   b\n' +
        'ccc         ddd   eee\n' +
        'f                 ggggggggg';
      const result = htmlToText(html, { tables: true });
      expect(result).to.equal(resultExpected);
    });

    it('should render block-level elements inside table cells properly', function () {
      const html = /*html*/`
<table>
    <tr>
        <td><h1>hEaDeR</h1></td>
        <td><blockquote>A quote<br/>from somewhere.</blockquote></td>
    </tr>
    <tr>
    <td>
        <pre>   preformatted...        ...text   </pre>
    </td>
    <td>
        <ol>
            <li>list item one</li>
            <li>list item two</li>
        </ol>
    </td>
    </tr>
</table>`;
      const resultExpected =
        'HEADER                                 > A quote\n' +
        '                                       > from somewhere.\n' +
        '   preformatted...        ...text       1. list item one\n' +
        '                                        2. list item two';
      const result = htmlToText(html, { tables: true });
      expect(result).to.equal(resultExpected);
    });

    it('should wrap table contents to custom max column width', function () {
      const html = /*html*/`
<table>
    <tr>
        <td>short</td>
        <td>short</td>
        <td>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</td>
    </tr>
    <tr>
        <td>short</td>
        <td>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</td>
        <td>short</td>
    </tr>
</table>`;
      const resultExpected =
      'short   short                           Lorem ipsum dolor sit amet,\n' +
      '                                        consectetur adipiscing elit,\n' +
      '                                        sed do eiusmod tempor\n' +
      '                                        incididunt ut labore et dolore\n' +
      '                                        magna aliqua. Ut enim ad minim\n' +
      '                                        veniam, quis nostrud\n' +
      '                                        exercitation ullamco laboris\n' +
      '                                        nisi ut aliquip ex ea commodo\n' +
      '                                        consequat.\n' +
      'short   Duis aute irure dolor in        short\n' +
      '        reprehenderit in voluptate\n' +
      '        velit esse cillum dolore eu\n' +
      '        fugiat nulla pariatur.\n' +
      '        Excepteur sint occaecat\n' +
      '        cupidatat non proident, sunt\n' +
      '        in culpa qui officia deserunt\n' +
      '        mollit anim id est laborum.';
      const result = htmlToText(html, { tables: true, tags: { 'table': { options: { maxColumnWidth: 30 } } } });
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
        expect(htmlToText(testString)).to.equal(' * foo\n   * bar\n     * baz.1\n     * baz.2');
      });

      it('should handle long nested ul correctly', function () {
        const testString = /*html*/`<ul>
          <li>At vero eos et accusam et justo duo dolores et ea rebum. Stet clita k a s d g u b e r g r e n, no sea takimata sanctus est Lorem ipsum dolor sit amet.</li>
          <li>At vero eos et accusam et justo duo dolores et ea rebum. Stet clita k a s d g u b e r g r e n, no sea takimata sanctus est Lorem ipsum dolor sit amet.</li>
          <li>Inner:
            <ul>
              <li>At vero eos et accusam et justo duo dolores et ea rebum. Stet clita k a s d g u b e r g r e n, no sea takimata sanctus est Lorem ipsum dolor sit amet.</li>
              <li>At vero eos et accusam et justo duo dolores et ea rebum. Stet clita k a s d g u b e r g r e n, no sea takimata sanctus est Lorem ipsum dolor sit amet.</li>
            </ul>
          </li>
        </ul>`;
        const expected =
        ' * At vero eos et accusam et justo duo dolores et ea rebum. Stet clita k a s d g\n' +
        '   u b e r g r e n, no sea takimata sanctus est Lorem ipsum dolor sit amet.\n' +
        ' * At vero eos et accusam et justo duo dolores et ea rebum. Stet clita k a s d g\n' +
        '   u b e r g r e n, no sea takimata sanctus est Lorem ipsum dolor sit amet.\n' +
        ' * Inner:\n' +
        '   * At vero eos et accusam et justo duo dolores et ea rebum. Stet clita k a s d\n' +
        '     g u b e r g r e n, no sea takimata sanctus est Lorem ipsum dolor sit amet.\n' +
        '   * At vero eos et accusam et justo duo dolores et ea rebum. Stet clita k a s d\n' +
        '     g u b e r g r e n, no sea takimata sanctus est Lorem ipsum dolor sit amet.';
        expect(htmlToText(testString)).to.equal(expected);
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

      it('should fallback to type="1" behavior if type attribute is invalid', function () {
        const testString = '<ol type="whatever"><li>foo</li><li>bar</li></ol>';
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

      it('should support the ordered list type="i" attribute', function () {
        const testString1 = '<ol type="i"><li>foo</li><li>bar</li></ol>';
        const testString2 = '<ol start="8" type="i"><li>foo</li><li>bar</li></ol>';
        expect(htmlToText(testString1)).to.equal(' i.  foo\n ii. bar');
        expect(htmlToText(testString2)).to.equal(' viii. foo\n ix.   bar');
      });

      it('should support the ordered list type="I" attribute', function () {
        const testString1 = '<ol type="I"><li>foo</li><li>bar</li></ol>';
        const testString2 = '<ol start="8" type="I"><li>foo</li><li>bar</li></ol>';
        expect(htmlToText(testString1)).to.equal(' I.  foo\n II. bar');
        expect(htmlToText(testString2)).to.equal(' VIII. foo\n IX.   bar');
      });

      it('should support the ordered list start attribute', function () {
        const testString = '<ol start="100"><li>foo</li><li>bar</li></ol>';
        expect(htmlToText(testString)).to.equal(' 100. foo\n 101. bar');
      });

      it('should handle nested ol correctly', function () {
        const testString = '<ol><li>foo<ol><li>bar<ol><li>baz</li><li>baz</li></ol></li></ol></li></ol>';
        expect(htmlToText(testString)).to.equal(' 1. foo\n    1. bar\n       1. baz\n       2. baz');
      });

      it('should handle long nested ol correctly', function () {
        const testString = /*html*/`<ol>
          <li>At vero eos et accusam et justo duo dolores et ea rebum. Stet clita k a s d g u b e r g r e n, no sea takimata sanctus est Lorem ipsum dolor sit amet.</li>
          <li>At vero eos et accusam et justo duo dolores et ea rebum. Stet clita k a s d g u b e r g r e n, no sea takimata sanctus est Lorem ipsum dolor sit amet.</li>
          <li>Inner:
            <ol>
              <li>At vero eos et accusam et justo duo dolores et ea rebum. Stet clita k a s d g u b e r g r e n, no sea takimata sanctus est Lorem ipsum dolor sit amet.</li>
              <li>At vero eos et accusam et justo duo dolores et ea rebum. Stet clita k a s d g u b e r g r e n, no sea takimata sanctus est Lorem ipsum dolor sit amet.</li>
            </ol>
          </li>
        </ol>`;
        const expected =
        ' 1. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita k a s d\n' +
        '    g u b e r g r e n, no sea takimata sanctus est Lorem ipsum dolor sit amet.\n' +
        ' 2. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita k a s d\n' +
        '    g u b e r g r e n, no sea takimata sanctus est Lorem ipsum dolor sit amet.\n' +
        ' 3. Inner:\n' +
        '    1. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita k a s\n' +
        '       d g u b e r g r e n, no sea takimata sanctus est Lorem ipsum dolor sit\n' +
        '       amet.\n' +
        '    2. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita k a s\n' +
        '       d g u b e r g r e n, no sea takimata sanctus est Lorem ipsum dolor sit\n' +
        '       amet.';
        expect(htmlToText(testString)).to.equal(expected);
      });

      it('should support the ordered list type="a" attribute past 26 characters', function () {
        const testString1 = '<ol start="26" type="a"><li>foo</li><li>bar</li></ol>';
        const testString2 = '<ol start="702" type="a"><li>foo</li><li>bar</li></ol>';
        expect(htmlToText(testString1)).to.equal(' z.  foo\n aa. bar');
        expect(htmlToText(testString2)).to.equal(' zz.  foo\n aaa. bar');
      });

      it('should support the ordered list type="A" attribute past 26 characters', function () {
        const testString1 = '<ol start="26" type="A"><li>foo</li><li>bar</li></ol>';
        const testString2 = '<ol start="702" type="A"><li>foo</li><li>bar</li></ol>';
        expect(htmlToText(testString1)).to.equal(' Z.  foo\n AA. bar');
        expect(htmlToText(testString2)).to.equal(' ZZ.  foo\n AAA. bar');
      });

      // HTML standard defines vinculum extension for large numbers.
      // But that doesn't seem to have any significance for practical purposes.

      // it('should support the ordered list type="i" attribute past 3999', function () {
      //   const testString = '<ol start="3999" type="i"><li>foo</li><li>bar</li></ol>';
      //   expect(htmlToText(testString)).to.equal(' mmmcmxcix. foo\n i̅v̅.        bar');
      // });

      // it('should support the ordered list type="I" attribute past 3999', function () {
      //   const testString = '<ol start="3999" type="I"><li>foo</li><li>bar</li></ol>';
      //   expect(htmlToText(testString)).to.equal(' MMMCMXCIX. foo\n I̅V̅.        bar');
      // });
    });

    it('should not wrap li when wordwrap is disabled', function () {
      const html = `Good morning Jacob,
        <p>Lorem ipsum dolor sit amet</p>
        <p><strong>Lorem ipsum dolor sit amet.</strong></p>
        <ul>
          <li>run in the park <span style="color:#888888;">(in progress)</span></li>
        </ul>
      `;
      const resultExpected = 'Good morning Jacob,\n\nLorem ipsum dolor sit amet\n\nLorem ipsum dolor sit amet.\n\n * run in the park (in progress)';
      const result = htmlToText(html, { wordwrap: false });
      expect(result).to.equal(resultExpected);
    });

    it('should handle non-li elements inside a list gracefully', function () {
      const html = /*html*/`
        <ul>
          <li>list item</li>
          plain text
          <li>list item</li>
          <div>div</div>
          <li>list item</li>
          <p>paragraph</p>
          <li>list item</li>
        </ul>
      `;
      const resultExpected = ' * list item\n   plain text\n * list item\n   div\n * list item\n\n   paragraph\n\n * list item';
      const result = htmlToText(html);
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
    it('should allow to override formatting of existing tags', function () {
      const result = htmlToText('<h1>TeSt</h1><h1>mOrE tEsT</h1>', {
        formatters: {
          heading: function (elem, walk, builder, formatOptions) {
            builder.openBlock(2);
            builder.pushWordTransform(str => str.toLowerCase());
            walk(elem.children, builder);
            builder.popWordTransform();
            builder.closeBlock(2, str => {
              const line = '='.repeat(str.length);
              return `${line}\n${str}\n${line}`;
            });
          }
        }
      });
      expect(result).to.equal('====\ntest\n====\n\n=========\nmore test\n=========');
    });

    it('should allow to skip tags with dummy formatting function', function () {
      const input = '<ruby>漢<rt>かん</rt>字<rt>じ</rt></ruby>';
      const expected = '漢字';
      const result = htmlToText(
        input,
        { tags: { 'rt': { format: 'skip' } } }
      );
      expect(result).to.equal(expected);
    });

    it('should allow to define basic support for inline tags', function () {
      const input = /*html*/`<p>a <span>b </span>c<span>  d  </span>e</p>`;
      const expected = 'a b c d e';
      const result = htmlToText(
        input,
        { tags: { 'span': { format: 'inline' } } }
      );
      expect(result).to.equal(expected);
    });

    it('should allow to define basic support for block-level tags', function () {
      const input = /*html*/`<widget><gadget>a</gadget><fidget>b</fidget></widget>c<budget>d</budget>e`;
      const expected = 'a\nb\nc\nd\ne';
      const result = htmlToText(
        input,
        {
          tags: {
            'budget': { format: 'block' },
            'fidget': { format: 'block' },
            'gadget': { format: 'block' },
            'widget': { format: 'block' },
          }
        }
      );
      expect(result).to.equal(expected);
    });

    it('should allow to add support for different tags', function () {
      const input = '<div><foo>foo<br/>content</foo><bar src="bar.src" /></div>';
      const expected = '[FOO]foo\ncontent[/FOO]\n[BAR src="bar.src"]';
      const result = htmlToText(
        input,
        {
          formatters: {
            'formatFoo': function (elem, walk, builder, formatOptions) {
              builder.openBlock(1);
              walk(elem.children, builder);
              builder.closeBlock(1, str => `[FOO]${str}[/FOO]`);
            },
            'formatBar': function (elem, walk, builder, formatOptions) {
              // attribute availability check is left out for brevity
              builder.addInline(`[BAR src="${elem.attribs.src}"]`, true);
            }
          },
          tags: {
            'foo': { format: 'formatFoo' },
            'bar': { format: 'formatBar' }
          }
        }
      );
      expect(result).to.equal(expected);
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

    it('should not wrap a string if wrapCharacters are set but not found and forceWrapOnLimit is not set', function () {
      const testString = '<p>_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlong\nword_with_following_text.</p>';
      expect(htmlToText(testString, { longWordSplit: { wrapCharacters: ['/'], forceWrapOnLimit: false } }))
        .to.equal('_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlong\nword_with_following_text.');
    });

    it('should not wrap a string if wrapCharacters are not set and forceWrapOnLimit is not set', function () {
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

    it('should handle custom whitespace characters', function () {
      // No-Break Space - decimal 160, hex \u00a0.
      const testString = '<span>first span\u00a0</span>\u00a0<span>\u00a0last span</span>';
      const expectedDefault = 'first span\u00a0\u00a0\u00a0last span';
      const expectedCustom = 'first span last span';
      const options = { whitespaceCharacters: ' \t\r\n\f\u200b\u00a0' };
      expect(htmlToText(testString)).to.equal(expectedDefault);
      expect(htmlToText(testString, options)).to.equal(expectedCustom);
    });

    it('should handle space and newline combination - keep space when and only when needed', function () {
      const testString = '<span>foo</span> \n<span>bar</span>\n <span>baz</span>';
      const defaultResult = htmlToText(testString);
      const resultWithNewLine = htmlToText(testString, { preserveNewlines: true });
      expect(defaultResult).to.equal('foo bar baz');
      expect(resultWithNewLine).to.equal('foo\nbar\nbaz');
    });

    it('should not have extra spaces at the beginning for space-indented html', function () {
      const html = /*html*/`<html>
<body>
    <p>foo</p>
    <p>bar</p>
</body>
</html>`;
      const text = htmlToText(html);
      expect(text).to.equal('foo\n\nbar');
    });

    it('should not have extra spaces at the beginning for space-indented html with explicitly block-level tags', function () {
      const html = /*html*/`<html>
<body>
    <div>foo</div>
    <div>bar</div>
</body>
</html>`;
      expect(htmlToText(html, { tags: { 'div': { format: 'block', level: 'block' } } })).to.equal('foo\nbar');
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
      let testString = '<!DOCTYPE html><html><head></head><body>';
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
      const expectedResult = 'nnnnn(...)';
      expect(htmlToText(testString, options)).to.equal(expectedResult);
    });

    it('should respect maxDepth limit', function () {
      const testString = /*html*/`<!DOCTYPE html><html><head></head><body><span>a<span>b<span>c<span>d</span>e</span>f</span>g<span>h<span>i<span>j</span>k</span>l</span>m</span></body></html>`;
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

    it('should use default ellipsis value if none provided', function () {
      const testString = /*html*/`<!DOCTYPE html><html><head></head><body><p>a</p><p>b</p><p>c</p><p>d</p><p>e</p><p>f</p><p>g</p><p>h</p><p>i</p><p>j</p></body></html>`;
      const options = {
        singleNewLineParagraphs: true,
        limits: { maxChildNodes: 6 }
      };
      const expectedResult = 'a\nb\nc\nd\ne\nf\n...';
      expect(htmlToText(testString, options)).to.equal(expectedResult);
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
      const testString = '0123456789'.repeat(2000000);
      const options = { wordwrap: false };
      expect(htmlToText(testString, options).length).to.equal(1 << 24);
      expect(getProcessStderrBuffer()).to.equal('Input lenght 20000000 is above allowed limit of 16777216. Truncating without ellipsis.\n');
    });

    it('should respect custom maxInputLength', function () {
      const testString = '0123456789'.repeat(2000000);
      const options = { limits: { maxInputLength: 42 } };
      expect(htmlToText(testString, options).length).to.equal(42);
      expect(getProcessStderrBuffer()).to.equal('Input lenght 20000000 is above allowed limit of 42. Truncating without ellipsis.\n');
    });
  });

  describe('blockquote', function () {
    it('should handle format single-line blockquote', function () {
      const testString = 'foo<blockquote>test</blockquote>bar';
      const expectedResult = 'foo\n\n> test\n\nbar';
      expect(htmlToText(testString)).to.equal(expectedResult);
    });

    it('should format multi-line blockquote', function () {
      const testString = '<blockquote>a<br/>b</blockquote>';
      const expectedResult = '> a\n> b';
      expect(htmlToText(testString)).to.equal(expectedResult);
    });

    it('should trim newlines unless disabled', function () {
      const testString = '<blockquote><br/>a<br/><br/><br/></blockquote>';
      const expectedDefaultResult = '> a';
      const expectedCustomResult = '> \n> a\n> \n> \n> ';
      expect(htmlToText(testString)).to.equal(expectedDefaultResult);
      expect(htmlToText(testString, { tags: { 'blockquote': { options: { trimEmptyLines: false } } } })).to.equal(expectedCustomResult);
    });
  });

  describe('pre', function () {
    it('should support simple preformatted text', function () {
      const testString = '<P>Code fragment:</P><PRE>  body {\n    color: red;\n  }</PRE>';
      const expectedResult = 'Code fragment:\n\n  body {\n    color: red;\n  }';
      expect(htmlToText(testString)).to.equal(expectedResult);
    });

    it('should support preformatted text with inner tags', function () {
      const testString = /*html*/`<p>Code fragment:</p>
<pre><code>  var total = 0;

  <em style="color: green;">// Add 1 to total and display in a paragraph</em>
  <strong style="color: blue;">document.write('&lt;p&gt;Sum: ' + (total + 1) + '&lt;/p&gt;');</strong></code></pre>`;
      const expectedResult = `Code fragment:\n\n  var total = 0;\n\n  // Add 1 to total and display in a paragraph\n  document.write('<p>Sum: ' + (total + 1) + '</p>');`;
      expect(htmlToText(testString)).to.equal(expectedResult);
    });

    it('should support preformatted text with line break tags', function () {
      const testString = '<pre> line 1 <br/> line 2 </pre>';
      const expectedResult = ' line 1 \n line 2 ';
      expect(htmlToText(testString)).to.equal(expectedResult);
    });

    it('should support preformatted text with a table', function () {
      const testString = /*html*/`
<pre><table>
    <tr>
        <td>[a&#32;&#32;&#32;
     </td>
        <td>  b&#32;&#32;
     </td>
        <td>   c]
     </td>
    </tr>
    <tr>
        <td>&#32;&#32;&#32;&#32;&#32;
   d]</td>
        <td>&#32;&#32;&#32;&#32;&#32;
  e  </td>
        <td>&#32;&#32;&#32;&#32;&#32;
[f   </td>
    </tr>
</table></pre>`;
      const expectedResult =
        '[a        b        c]\n' +
        '                     \n' +
        '                     \n' +
        '   d]     e     [f   ';
      expect(htmlToText(testString, { tables: true })).to.equal(expectedResult);
    });

  });

  describe('hr', function () {
    it('should output horizontal line of default length', function () {
      const testString = '<div>foo</div><hr/><div>bar</div>';
      const expectedResult = 'foo\n\n--------------------------------------------------------------------------------\n\nbar';
      expect(htmlToText(testString)).to.equal(expectedResult);
    });

    it('should output horizontal line of specific length', function () {
      const testString = '<div>foo</div><hr/><div>bar</div>';
      const expectedResult = 'foo\n\n------------------------------\n\nbar';
      expect(htmlToText(testString, { tags: { 'hr': { options: { length: 30 } } } })).to.equal(expectedResult);
    });

    it('should output horizontal line of length 40 when wordwrap is disabled', function () {
      const testString = '<div>foo</div><hr/><div>bar</div>';
      const expectedResult = 'foo\n\n----------------------------------------\n\nbar';
      expect(htmlToText(testString, { wordwrap: false })).to.equal(expectedResult);
    });
  });
});
