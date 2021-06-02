
const { expect } = require('chai');

const { htmlToText } = require('..');


describe('tags', function () {

  describe('block-level elements', function () {

    it('should render common block-level elements on separate lines with default line breaks number', function () {
      const html =
        'a<article>article</article>b<aside>aside</aside>c<div>div</div>d<footer>footer</footer>' +
        'e<form>form</form>f<header>header</header>g<main>main</main>h<nav>nav</nav>i<section>section</section>j';
      const expected = 'a\narticle\nb\naside\nc\ndiv\nd\nfooter\ne\nform\nf\nheader\ng\nmain\nh\nnav\ni\nsection\nj';
      expect(htmlToText(html)).to.equal(expected);
    });

  });

  describe('hr', function () {

    it('should output horizontal line of default length', function () {
      const html = '<div>foo</div><hr/><div>bar</div>';
      const expected = 'foo\n\n--------------------------------------------------------------------------------\n\nbar';
      expect(htmlToText(html)).to.equal(expected);
    });

    it('should output horizontal line of specific length', function () {
      const html = '<div>foo</div><hr/><div>bar</div>';
      const expected = 'foo\n\n------------------------------\n\nbar';
      const options = {
        selectors: [
          { selector: 'hr', options: { length: 30 } }
        ]
      };
      expect(htmlToText(html, options)).to.equal(expected);
    });

    it('should output horizontal line of length 40 when wordwrap is disabled', function () {
      const html = '<div>foo</div><hr/><div>bar</div>';
      const expected = 'foo\n\n----------------------------------------\n\nbar';
      expect(htmlToText(html, { wordwrap: false })).to.equal(expected);
    });

  });

  describe('p', function () {

    it('should separate paragraphs from surrounding content by two linebreaks', function () {
      const html = 'text<p>first</p><p>second</p>text';
      const expected = 'text\n\nfirst\n\nsecond\n\ntext';
      expect(htmlToText(html)).to.equal(expected);
    });

    it('should allow to change the number of linebreaks', function () {
      const html = 'text<p>first</p><p>second</p>text';
      const options = {
        selectors: [
          { selector: 'p', options: { leadingLineBreaks: 1, trailingLineBreaks: 1 } }
        ]
      };
      const expected = 'text\nfirst\nsecond\ntext';
      expect(htmlToText(html, options)).to.equal(expected);
    });

  });

  describe('pre', function () {

    it('should support simple preformatted text', function () {
      const html = '<P>Code fragment:</P><PRE>  body {\n    color: red;\n  }</PRE>';
      const expected = 'Code fragment:\n\n  body {\n    color: red;\n  }';
      expect(htmlToText(html)).to.equal(expected);
    });

    it('should support preformatted text with inner tags', function () {
      const html = /*html*/`<p>Code fragment:</p>
<pre><code>  var total = 0;

  <em style="color: green;">// Add 1 to total and display in a paragraph</em>
  <strong style="color: blue;">document.write('&lt;p&gt;Sum: ' + (total + 1) + '&lt;/p&gt;');</strong></code></pre>`;
      const expected = `Code fragment:\n\n  var total = 0;\n\n  // Add 1 to total and display in a paragraph\n  document.write('<p>Sum: ' + (total + 1) + '</p>');`;
      expect(htmlToText(html)).to.equal(expected);
    });

    it('should support preformatted text with line break tags', function () {
      const html = '<pre> line 1 <br/> line 2 </pre>';
      const expected = ' line 1 \n line 2 ';
      expect(htmlToText(html)).to.equal(expected);
    });

    it('should support preformatted text with a table', function () {
      const html = /*html*/`
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
      const expected =
        '[a        b        c]\n' +
        '                     \n' +
        '                     \n' +
        '   d]     e     [f   ';
      expect(htmlToText(html, { tables: true })).to.equal(expected);
    });

  });

  describe('headings', function () {

    it('should allow to disable uppercased headings', function () {
      const html = /*html*/`
        <h1>Heading 1</h1>
        <h2>heading 2</h2>
        <h3>heading 3</h3>
        <h4>heading 4</h4>
        <h5>heading 5</h5>
        <h6>heading 6</h6>
      `;
      const expected = 'Heading 1\n\n\nheading 2\n\n\nheading 3\n\nheading 4\n\nheading 5\n\nheading 6';
      expect(htmlToText(html)).to.equal(expected.toUpperCase());

      const options = {
        selectors: [
          { selector: 'h1', options: { uppercase: false } },
          { selector: 'h2', options: { uppercase: false } },
          { selector: 'h3', options: { uppercase: false } },
          { selector: 'h4', options: { uppercase: false } },
          { selector: 'h5', options: { uppercase: false } },
          { selector: 'h6', options: { uppercase: false } },
        ]
      };
      expect(htmlToText(html, options)).to.equal(expected);
    });

  });

  describe('blockquote', function () {

    it('should handle format single-line blockquote', function () {
      const html = 'foo<blockquote>test</blockquote>bar';
      const expected = 'foo\n\n> test\n\nbar';
      expect(htmlToText(html)).to.equal(expected);
    });

    it('should format multi-line blockquote', function () {
      const html = '<blockquote>a<br/>b</blockquote>';
      const expected = '> a\n> b';
      expect(htmlToText(html)).to.equal(expected);
    });

    it('should trim newlines unless disabled', function () {
      const html = '<blockquote><br/>a<br/><br/><br/></blockquote>';

      const expectedDefault = '> a';
      expect(htmlToText(html)).to.equal(expectedDefault);

      const options = {
        selectors: [
          { selector: 'blockquote', options: { trimEmptyLines: false } }
        ]
      };
      const expectedCustom = '> \n> a\n> \n> \n> ';
      expect(htmlToText(html, options)).to.equal(expectedCustom);
    });

  });

  describe('img', function () {

    it('should replace entities inside `alt` attributes of images', function () {
      const html = '<img src="test.png" alt="&quot;Awesome&quot;">';
      const expected = '"Awesome" [test.png]';
      expect(htmlToText(html)).to.equal(expected);
    });

    it('should update relatively sourced images with baseUrl', function () {
      const html = '<img src="/test.png">';
      const options = {
        selectors: [
          { selector: 'img', options: { baseUrl: 'https://example.com' } }
        ]
      };
      const expected = '[https://example.com/test.png]';
      expect(htmlToText(html, options)).to.equal(expected);
    });

  });

  describe('a', function () {

    it('should decode html attribute entities from href', function () {
      const html = '<a href="/foo?a&#x3D;b">test</a>';
      const expected = 'test [/foo?a=b]';
      expect(htmlToText(html)).to.equal(expected);
    });

    it('should not insert null bytes', function () {
      const html = '<a href="some-url?a=b&amp;b=c">Testing &amp; Done</a>';
      const expected = 'Testing & Done [some-url?a=b&b=c]';
      expect(htmlToText(html)).to.equal(expected);
    });

    it('should update relatively sourced links with linkHrefBaseUrl', function () {
      const html = '<a href="/test.html">test</a>';
      const options = {
        selectors: [
          { selector: 'a', options: { baseUrl: 'https://example.com' } }
        ]
      };
      const expected = 'test [https://example.com/test.html]';
      expect(htmlToText(html, options)).to.equal(expected);
    });

    it('should strip mailto: from email links', function () {
      const html = '<a href="mailto:foo@example.com">email me</a>';
      const expected = 'email me [foo@example.com]';
      expect(htmlToText(html)).to.equal(expected);
    });

    it('should return link with brackets by default', function () {
      const html = '<a href="http://my.link">test</a>';
      const expected = 'test [http://my.link]';
      expect(htmlToText(html)).to.equal(expected);
    });

    it('should return link without brackets if noLinkBrackets is set to true', function () {
      const html = '<a href="http://my.link">test</a>';
      const expected = 'test http://my.link';
      const options = {
        selectors: [
          { selector: 'a', options: { noLinkBrackets: true } }
        ]
      };
      expect(htmlToText(html, options)).to.equal(expected);
    });

    it('should not return link for anchor if noAnchorUrl is set to true', function () {
      const html = '<a href="#link">test</a>';
      const options = {
        selectors: [
          { selector: 'a', options: { noAnchorUrl: true } }
        ]
      };
      expect(htmlToText(html, options)).to.equal('test');
    });

    it('should return link for anchor if noAnchorUrl is set to false', function () {
      const html = '<a href="#link">test</a>';
      const expected = 'test [#link]';
      const options = {
        selectors: [
          { selector: 'a', options: { noAnchorUrl: false } }
        ]
      };
      expect(htmlToText(html, options)).to.equal(expected);
    });

    it('should not uppercase links inside headings', function () {
      const html = /*html*/`<h1><a href="http://example.com">Heading</a></h1>`;
      const expected = 'HEADING [http://example.com]';
      expect(htmlToText(html)).to.equal(expected);
    });

    it('should not uppercase links inside table header cells', function () {
      const html = /*html*/`
        <table>
          <tr>
            <th>Header cell 1</th>
            <th><a href="http://example.com">Header cell 2</a></th>
            <td><a href="http://example.com">Regular cell</a></td>
          </tr>
        </table>
      `;
      const expected = 'HEADER CELL 1   HEADER CELL 2 [http://example.com]   Regular cell [http://example.com]';
      const options = {
        selectors: [
          { selector: 'table', format: 'dataTable' }
        ]
      };
      expect(htmlToText(html, options)).to.equal(expected);
    });

  });

  describe('lists', function () {

    describe('ul', function () {

      it('should handle empty unordered lists', function () {
        const html = '<ul></ul>';
        expect(htmlToText(html)).to.equal('');
      });

      it('should handle an unordered list with multiple elements', function () {
        const html = '<ul><li>foo</li><li>bar</li></ul>';
        const expected = ' * foo\n * bar';
        expect(htmlToText(html)).to.equal(expected);
      });

      it('should handle an unordered list prefix option', function () {
        const html = '<ul><li>foo</li><li>bar</li></ul>';
        const options = {
          selectors: [
            { selector: 'ul', options: { itemPrefix: ' test ' } }
          ]
        };
        const expected = ' test foo\n test bar';
        expect(htmlToText(html, options)).to.equal(expected);
      });

      it('should handle nested ul correctly', function () {
        const html = /*html*/`<ul><li>foo<ul><li>bar<ul><li>baz.1</li><li>baz.2</li></ul></li></ul></li></ul>`;
        const expected = ' * foo\n   * bar\n     * baz.1\n     * baz.2';
        expect(htmlToText(html)).to.equal(expected);
      });

      it('should handle long nested ul correctly', function () {
        const html = /*html*/`<ul>
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
        expect(htmlToText(html)).to.equal(expected);
      });

    });

    describe('ol', function () {

      it('should handle empty ordered lists', function () {
        const html = '<ol></ol>';
        expect(htmlToText(html)).to.equal('');
      });

      it('should handle an ordered list with multiple elements', function () {
        const html = '<ol><li>foo</li><li>bar</li></ol>';
        const expected = ' 1. foo\n 2. bar';
        expect(htmlToText(html)).to.equal(expected);
      });

      it('should support the ordered list type="1" attribute', function () {
        const html = '<ol type="1"><li>foo</li><li>bar</li></ol>';
        const expected = ' 1. foo\n 2. bar';
        expect(htmlToText(html)).to.equal(expected);
      });

      it('should fallback to type="1" behavior if type attribute is invalid', function () {
        const html = '<ol type="whatever"><li>foo</li><li>bar</li></ol>';
        const expected = ' 1. foo\n 2. bar';
        expect(htmlToText(html)).to.equal(expected);
      });

      it('should support the ordered list type="a" attribute', function () {
        const html = '<ol type="a"><li>foo</li><li>bar</li></ol>';
        const expected = ' a. foo\n b. bar';
        expect(htmlToText(html)).to.equal(expected);
      });

      it('should support the ordered list type="A" attribute', function () {
        const html = '<ol type="A"><li>foo</li><li>bar</li></ol>';
        const expected = ' A. foo\n B. bar';
        expect(htmlToText(html)).to.equal(expected);
      });

      it('should support the ordered list type="i" attribute', function () {
        const html1 = '<ol type="i"><li>foo</li><li>bar</li></ol>';
        const html2 = '<ol start="8" type="i"><li>foo</li><li>bar</li></ol>';
        expect(htmlToText(html1)).to.equal(' i.  foo\n ii. bar');
        expect(htmlToText(html2)).to.equal(' viii. foo\n ix.   bar');
      });

      it('should support the ordered list type="I" attribute', function () {
        const html1 = '<ol type="I"><li>foo</li><li>bar</li></ol>';
        const html2 = '<ol start="8" type="I"><li>foo</li><li>bar</li></ol>';
        expect(htmlToText(html1)).to.equal(' I.  foo\n II. bar');
        expect(htmlToText(html2)).to.equal(' VIII. foo\n IX.   bar');
      });

      it('should support the ordered list start attribute', function () {
        const html = '<ol start="100"><li>foo</li><li>bar</li></ol>';
        const expected = ' 100. foo\n 101. bar';
        expect(htmlToText(html)).to.equal(expected);
      });

      it('should handle nested ol correctly', function () {
        const html = '<ol><li>foo<ol><li>bar<ol><li>baz</li><li>baz</li></ol></li></ol></li></ol>';
        const expected = ' 1. foo\n    1. bar\n       1. baz\n       2. baz';
        expect(htmlToText(html)).to.equal(expected);
      });

      it('should handle long nested ol correctly', function () {
        const html = /*html*/`<ol>
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
        expect(htmlToText(html)).to.equal(expected);
      });

      it('should support the ordered list type="a" attribute past 26 characters', function () {
        const html1 = '<ol start="26" type="a"><li>foo</li><li>bar</li></ol>';
        const html2 = '<ol start="702" type="a"><li>foo</li><li>bar</li></ol>';
        expect(htmlToText(html1)).to.equal(' z.  foo\n aa. bar');
        expect(htmlToText(html2)).to.equal(' zz.  foo\n aaa. bar');
      });

      it('should support the ordered list type="A" attribute past 26 characters', function () {
        const html1 = '<ol start="26" type="A"><li>foo</li><li>bar</li></ol>';
        const html2 = '<ol start="702" type="A"><li>foo</li><li>bar</li></ol>';
        expect(htmlToText(html1)).to.equal(' Z.  foo\n AA. bar');
        expect(htmlToText(html2)).to.equal(' ZZ.  foo\n AAA. bar');
      });

      // HTML standard defines vinculum extension for large numbers.
      // But that doesn't seem to have any significance for practical purposes.

      // it('should support the ordered list type="i" attribute past 3999', function () {
      //   const html = '<ol start="3999" type="i"><li>foo</li><li>bar</li></ol>';
      //   expect(htmlToText(html)).to.equal(' mmmcmxcix. foo\n i̅v̅.        bar');
      // });

      // it('should support the ordered list type="I" attribute past 3999', function () {
      //   const html = '<ol start="3999" type="I"><li>foo</li><li>bar</li></ol>';
      //   expect(htmlToText(html)).to.equal(' MMMCMXCIX. foo\n I̅V̅.        bar');
      // });

    });

    it('should not wrap li when wordwrap is disabled', function () {
      const html = /*html*/`Good morning Jacob,
        <p>Lorem ipsum dolor sit amet</p>
        <p><strong>Lorem ipsum dolor sit amet.</strong></p>
        <ul>
          <li>run in the park <span style="color:#888888;">(in progress)</span></li>
        </ul>
      `;
      const expected = 'Good morning Jacob,\n\nLorem ipsum dolor sit amet\n\nLorem ipsum dolor sit amet.\n\n * run in the park (in progress)';
      expect(htmlToText(html, { wordwrap: false })).to.equal(expected);
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
      const expected = ' * list item\n   plain text\n * list item\n   div\n * list item\n\n   paragraph\n\n * list item';
      expect(htmlToText(html)).to.equal(expected);
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
      const expected = 'Good morning Jacob,\n\nLorem ipsum dolor sit amet.';
      const options = {
        selectors: [
          { selector: 'table', format: 'dataTable' }
        ]
      };
      expect(htmlToText(html, options)).to.equal(expected);
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
      const expected = 'Good morning Jacob,\n\nLorem ipsum dolor sit amet.';
      const options = {
        selectors: [
          { selector: 'table', format: 'dataTable' }
        ]
      };
      expect(htmlToText(html, options)).to.equal(expected);
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
      const expected =
        'aa   b   cccc      d\n' +
        'aa   b   cccc      d\n' +
        'aa   b   ee   ff   d\n' +
        'ggg      ee   ff   d\n' +
        'h   ii   ee   jjj\n' +
        'h   ii   k   ll   mm\n' +
        'nn   o   k   ll   pp\n' +
        'nn   qqqq         pp';
      const options = {
        selectors: [
          { selector: 'table', format: 'dataTable' }
        ]
      };
      expect(htmlToText(html, options)).to.equal(expected);
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
      const expected =
        'aa  b\n' +
        'aa\n' +
        '    c\n' +
        '\n' +
        'd e f';
      const options = {
        selectors: [
          { selector: 'table', format: 'dataTable', options: { colSpacing: 1, rowSpacing: 1 } }
        ]
      };
      expect(htmlToText(html, options)).to.equal(expected);
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
      const expected =
        'aaaaaaaaa   b\n' +
        'ccc         ddd   eee\n' +
        'f                 ggggggggg';
      const options = {
        selectors: [
          { selector: 'table', format: 'dataTable' }
        ]
      };
      expect(htmlToText(html, options)).to.equal(expected);
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
      const expected =
        'HEADER                                 > A quote\n' +
        '                                       > from somewhere.\n' +
        '   preformatted...        ...text       1. list item one\n' +
        '                                        2. list item two';
      const options = {
        selectors: [
          { selector: 'table', format: 'dataTable' }
        ]
      };
      expect(htmlToText(html, options)).to.equal(expected);
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
      const expected =
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
      const options = {
        selectors: [
          { selector: 'table', format: 'dataTable', options: { maxColumnWidth: 30 } }
        ]
      };
      expect(htmlToText(html, options)).to.equal(expected);
    });

  });

  describe('custom formatting', function () {

    it('should allow to override formatting of existing tags', function () {
      const html = '<h1>TeSt</h1><h1>mOrE tEsT</h1>';
      const options = {
        formatters: {
          heading: function (elem, walk, builder, formatOptions) {
            builder.openBlock({ leadingLineBreaks: 2 });
            builder.pushWordTransform(str => str.toLowerCase());
            walk(elem.children, builder);
            builder.popWordTransform();
            builder.closeBlock({
              trailingLineBreaks: 2,
              blockTransform: str => {
                const line = '='.repeat(str.length);
                return `${line}\n${str}\n${line}`;
              }
            });
          }
        }
      };
      const expected = '====\ntest\n====\n\n=========\nmore test\n=========';
      expect(htmlToText(html, options)).to.equal(expected);
    });

    it('should allow to skip tags with dummy formatting function', function () {
      const html = '<ruby>漢<rt>かん</rt>字<rt>じ</rt></ruby>';
      const expected = '漢字';
      const options = { selectors: [ { selector: 'rt', format: 'skip' } ] };
      expect(htmlToText(html, options)).to.equal(expected);
    });

    it('should allow to define basic support for inline tags', function () {
      const html = /*html*/`<p>a <span>b </span>c<span>  d  </span>e</p>`;
      const expected = 'a b c d e';
      const options = { selectors: [ { selector: 'span', format: 'inline' } ] };
      expect(htmlToText(html, options)).to.equal(expected);
    });

    it('should allow to define basic support for block-level tags', function () {
      const html = /*html*/`<widget><gadget>a</gadget><fidget>b</fidget></widget>c<budget>d</budget>e`;
      const expected = 'a\nb\nc\nd\ne';
      const options = {
        selectors: [
          { selector: 'budget', format: 'block' },
          { selector: 'fidget', format: 'block' },
          { selector: 'gadget', format: 'block' },
          { selector: 'widget', format: 'block' }
        ]
      };
      expect(htmlToText(html, options)).to.equal(expected);
    });

    it('should allow to add support for different tags', function () {
      const html = '<div><foo>foo<br/>content</foo><bar src="bar.src" /></div>';
      const expected = '[FOO]foo\ncontent[/FOO]\n[BAR src="bar.src"]';
      const options = {
        formatters: {
          'formatFoo': function (elem, walk, builder, formatOptions) {
            builder.openBlock({ leadingLineBreaks: 1 });
            walk(elem.children, builder);
            builder.closeBlock({
              trailingLineBreaks: 1,
              blockTransform: str => `[FOO]${str}[/FOO]`
            });
          },
          'formatBar': function (elem, walk, builder, formatOptions) {
            // attribute availability check is left out for brevity
            builder.addInline(`[BAR src="${elem.attribs.src}"]`, { noWordTransform: true });
          }
        },
        selectors: [
          { selector: 'foo', format: 'formatFoo' },
          { selector: 'bar', format: 'formatBar' }
        ]
      };
      expect(htmlToText(html, options)).to.equal(expected);
    });

  });

  describe('selectors', function () {

    it('should merge entries with the same selector', function () {
      const html = '<foo></foo><foo></foo><foo></foo>';
      const expected = '----------\n\n\n\n----------\n\n\n\n----------';
      const options = {
        selectors: [
          { selector: 'foo', format: 'somethingElse' },
          { selector: 'foo', options: { length: 20 } },
          { selector: 'foo', options: { leadingLineBreaks: 4 } },
          { selector: 'foo', options: { trailingLineBreaks: 4 } },
          { selector: 'foo', options: { length: 10 } },
          { selector: 'foo', format: 'horizontalLine' }
        ]
      };
      expect(htmlToText(html, options)).to.equal(expected);
    });

    it('should pick the most specific selector', function () {
      const html = '<hr/><hr class="foo" id="bar"/>';
      const expected = '---\n\n-----';
      const options = {
        selectors: [
          { selector: 'hr', options: { length: 3 } },
          { selector: 'hr#bar', format: 'horizontalLine', options: { length: 5 } },
          { selector: 'hr.foo', format: 'horizontalLine', options: { length: 7 } },
        ]
      };
      expect(htmlToText(html, options)).to.equal(expected);
    });

    it('should pick the last selector of equal specificity', function () {
      const html = '<hr class="bar baz"/><hr class="foo bar"/><hr class="foo baz"/>';
      const expected = '-----\n\n-------\n\n-------';
      const options = {
        selectors: [
          { selector: 'hr.foo', format: 'horizontalLine', options: { length: 7 } },
          { selector: 'hr.baz', format: 'horizontalLine', options: { length: 3 } },
          { selector: 'hr.bar', format: 'horizontalLine', options: { length: 5 } },
          { selector: 'hr.foo' }
        ]
      };
      expect(htmlToText(html, options)).to.equal(expected);
    });

  });

});
