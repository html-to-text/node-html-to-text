
import test from 'ava';

import { htmlToMarkdown } from '../src/html-to-md';


const snapshotMacro = test.macro({
  exec: function (t, html, options = undefined) {
    t.snapshot(htmlToMarkdown(html, options), '```html\n' + html + '\n```');
  }
});

test(
  'should encode characters that can be confused as a part of markdown',
  snapshotMacro,
  '<p>!#[]()*+-.\\_`{}</p>'
);

test(
  'should not encode characters inside urls',
  snapshotMacro,
  '<a href="/page_(1).html?foo=[1]&bar=baz+qux#qu-ux!"></a>'
);

test(
  'should encode characters inside alt text and title',
  snapshotMacro,
  '<img src="test.png" alt="**alt text**" title="*title*">'
);
