import test from 'ava';

import { htmlToText } from '../../src/html-to-text.js';
import { snapshotMacro } from '../snapshot-helpers.js';


test('should handle center tag in tables', snapshotMacro, {
  convert: htmlToText,
  input: `Good morning Jacob, \
    <TABLE>
    <CENTER>
    <TBODY>
    <TR>
    <TD>Lorem ipsum dolor sit amet.</TD>
    </TR>
    </CENTER>
    </TBODY>
    </TABLE>
  `,
  options: {
    selectors: [
      { selector: 'table', format: 'dataTable' }
    ]
  }
});

test('should handle non-integer colspan on td element gracefully', snapshotMacro, {
  convert: htmlToText,
  input: `Good morning Jacob,
    <table>
    <tbody>
    <tr>
    <td colspan="abc">Lorem ipsum dolor sit amet.</td>
    </tr>
    </tbody>
    </table>
  `,
  options: {
    selectors: [
      { selector: 'table', format: 'dataTable' }
    ]
  }
});

test('should handle tables with colspans and rowspans', snapshotMacro, {
  convert: htmlToText,
  input: /*html*/`
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
</table>`,
  options: {
    selectors: [
      { selector: 'table', format: 'dataTable' }
    ]
  }
});

test('should support custom spacing for tables', snapshotMacro, {
  convert: htmlToText,
  input: /*html*/`
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
</table>`,
  options: {
    selectors: [
      { selector: 'table', format: 'dataTable', options: { colSpacing: 1, rowSpacing: 2 } }
    ]
  }
});

test('should support zero column spacing', snapshotMacro, {
  convert: htmlToText,
  input: /*html*/`
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
</table>`,
  options: {
    selectors: [
      { selector: 'table', format: 'dataTable', options: { colSpacing: 0 } }
    ]
  }
});

test('should properly align columns in tables with thead and tfoot', snapshotMacro, {
  convert: htmlToText,
  input: /*html*/`
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
</table>`,
  options: {
    selectors: [
      { selector: 'table', format: 'dataTable' }
    ]
  }
});

test('should render block-level elements inside table cells properly', snapshotMacro, {
  convert: htmlToText,
  input: /*html*/`
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
</table>`,
  options: {
    selectors: [
      { selector: 'table', format: 'dataTable' }
    ]
  }
});

test('should wrap table contents to custom max column width', snapshotMacro, {
  convert: htmlToText,
  input: /*html*/`
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
</table>`,
  options: {
    selectors: [
      { selector: 'table', format: 'dataTable', options: { maxColumnWidth: 30 } }
    ]
  }
});

test('should not miss content in tables with variable number of cells per row', snapshotMacro, {
  convert: htmlToText,
  input: /*html*/`
  <table>
    <tr><td>a</td></tr>
    <tr><td>b</td><td>c</td></tr>
    <tr></tr>
    <tr><td>d</td></tr>
  </table>`,
  options: {
    selectors: [
      { selector: 'table', format: 'dataTable' }
    ]
  }
});


