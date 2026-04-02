import test from 'ava';

import { htmlToText } from '../../src/html-to-text.js';
import { snapshotMacro } from '../snapshot-helpers.js';


test('should replace entities inside alt attributes of images', snapshotMacro, {
  convert: htmlToText,
  input: '<img src="test.png" alt="&quot;Awesome&quot;">'
});

test('should update relatively sourced images with baseUrl', snapshotMacro, {
  convert: htmlToText,
  input: '<img src="/test.png">',
  options: {
    selectors: [
      { selector: 'img', options: { baseUrl: 'https://example.com' } }
    ]
  }
});

test('should return image link without brackets if linkBrackets is false', snapshotMacro, {
  convert: htmlToText,
  input: '<img src="test.png" alt="Awesome">',
  options: {
    selectors: [
      { selector: 'img', options: { linkBrackets: false } }
    ]
  }
});

test('should return image link without brackets if linkBrackets is ["", ""]', snapshotMacro, {
  convert: htmlToText,
  input: '<img src="test.png" alt="Awesome">',
  options: {
    selectors: [
      { selector: 'img', options: { linkBrackets: ['', ''] } }
    ]
  }
});

test('should return image link with custom brackets', snapshotMacro, {
  convert: htmlToText,
  input: '<img src="test.png" alt="Awesome">',
  options: {
    selectors: [
      { selector: 'img', options: { linkBrackets: ['===> ', ' <==='] } }
    ]
  }
});

test('should rewrite image source path with provided metadata', snapshotMacro, {
  convert: htmlToText,
  input: '<img src="pictures/test.png">',
  metadata: { assetsPath: 'assets/' },
  options: {
    selectors: [
      {
        selector: 'img',
        options: { pathRewrite: (path, meta) => path.replace('pictures/', meta.assetsPath) }
      }
    ]
  }
});
