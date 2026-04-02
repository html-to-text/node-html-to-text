import test from 'ava';

import { htmlToText } from '../../src/html-to-text.js';
import { snapshotMacro } from '../snapshot-helpers.js';


test('should support simple preformatted text', snapshotMacro, {
  convert: htmlToText,
  input: '<P>Code fragment:</P><PRE>  body {\n    color: red;\n  }</PRE>'
});

test('should support preformatted text with inner tags', snapshotMacro, {
  convert: htmlToText,
  input: /*html*/`<p>Code fragment:</p>
<pre><code>  var total = 0;

  <em style="color: green;">// Add 1 to total and display in a paragraph</em>
  <strong style="color: blue;">document.write('&lt;p&gt;Sum: ' + (total + 1) + '&lt;/p&gt;');</strong></code></pre>`
});

test('should support preformatted text with line break tags', snapshotMacro, {
  convert: htmlToText,
  input: '<pre> line 1 <br/> line 2 </pre>'
});

test('should support preformatted text with a table', snapshotMacro, {
  convert: htmlToText,
  input: /*html*/`
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
</table></pre>`,
  options: { tables: true }
});


