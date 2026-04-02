import test from 'ava';

import { convert } from '../../src/html-to-text.js';
import { snapshotMacro } from '../snapshot-helpers.js';


test('should split long words if forceWrapOnLimit is set, existing linefeeds converted to space', snapshotMacro, {
  convert: convert,
  input: '<p>_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlong\nword_with_following_text.</p>',
  options: { longWordSplit: { wrapCharacters: ['/'], forceWrapOnLimit: true } }
});

test('should not wrap a string if longWordSplit is not set', snapshotMacro, {
  convert: convert,
  input: '<p>_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlongword_with_following_text.</p>',
  options: {}
});

test('should not wrap a string if wrapCharacters are set but not found and forceWrapOnLimit is not set', snapshotMacro, {
  convert: convert,
  input: '<p>_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlong\nword_with_following_text.</p>',
  options: { longWordSplit: { wrapCharacters: ['/'], forceWrapOnLimit: false } }
});

test('should not wrap a string if wrapCharacters are not set and forceWrapOnLimit is not set', snapshotMacro, {
  convert: convert,
  input: '<p>_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlong\nword_with_following_text.</p>',
  options: { longWordSplit: { wrapCharacters: [], forceWrapOnLimit: false } }
});

test('should wrap on last instance of a wrap character before wordwrap limit', snapshotMacro, {
  convert: convert,
  input: '<p>_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlong\nword_with_following_text.</p>',
  options: { longWordSplit: { wrapCharacters: ['/', '_'], forceWrapOnLimit: false } }
});

test('should wrap regardless of additional wrapCharacters content', snapshotMacro, {
  convert: convert,
  input: '<p>_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlong\nword_with_following_text.</p>',
  options: { longWordSplit: { wrapCharacters: ['/', '-', '_'], forceWrapOnLimit: false } }
});

test('should wrap regardless of wrapCharacters order', snapshotMacro, {
  convert: convert,
  input: '<p>_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlong\nword_with_following_text.</p>',
  options: { longWordSplit: { wrapCharacters: ['_', '/'], forceWrapOnLimit: false } }
});

test('should prefer wrapCharacters in order when several are possible', snapshotMacro, {
  convert: convert,
  input: '<p>_This_string_is_meant_to_test_if_a_string_is_split-properly_across_anewlineandlong\nword_with_following_text.</p>',
  options: { longWordSplit: { wrapCharacters: ['-', '_', '/'], forceWrapOnLimit: false } }
});

test('should not wrap a string that is too short', snapshotMacro, {
  convert: convert,
  input: '<p>https://github.com/werk85/node-html-to-text/blob/master/lib/html-to-text.js</p>',
  options: { longWordSplit: { wrapCharacters: ['/', '-'], forceWrapOnLimit: false } }
});

test('should wrap a url string using slash', snapshotMacro, {
  convert: convert,
  input: '<p>https://github.com/AndrewFinlay/node-html-to-text/commit/64836a5bd97294a672b24c26cb8a3ccdace41001</p>',
  options: { longWordSplit: { wrapCharacters: ['/', '-'], forceWrapOnLimit: false } }
});

test('should wrap very long url strings using slash', snapshotMacro, {
  convert: convert,
  input: '<p>https://github.com/werk85/node-html-to-text/blob/master/lib/werk85/node-html-to-text/blob/master/lib/werk85/node-html-to-text/blob/master/lib/werk85/node-html-to-text/blob/master/lib/werk85/node-html-to-text/blob/master/lib/html-to-text.js</p>',
  options: { longWordSplit: { wrapCharacters: ['/', '-'], forceWrapOnLimit: false } }
});

test('should wrap very long url strings using limit', snapshotMacro, {
  convert: convert,
  input: '<p>https://github.com/werk85/node-html-to-text/blob/master/lib/werk85/node-html-to-text/blob/master/lib/werk85/node-html-to-text/blob/master/lib/werk85/node-html-to-text/blob/master/lib/werk85/node-html-to-text/blob/master/lib/html-to-text.js</p>',
  options: { longWordSplit: { wrapCharacters: [], forceWrapOnLimit: true } }
});

test('should honour preserveNewlines and split long words', snapshotMacro, {
  convert: convert,
  input: '<p>_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlong\nword_with_following_text.</p>',
  options: { preserveNewlines: true, longWordSplit: { wrapCharacters: ['/', '_'], forceWrapOnLimit: false } }
});

test('should not put extra linefeeds when untouched long string ends at preserved line feed', snapshotMacro, {
  convert: convert,
  input: '<p>_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlong\nword_with_following_text.</p>',
  options: { preserveNewlines: true }
});

test('should split long strings in links and hide href when text matches', snapshotMacro, {
  convert: convert,
  input: '<a href="http://images.fb.com/2015/12/21/ivete-sangalo-launches-360-music-video-on-facebook/">http://images.fb.com/2015/12/21/ivete-sangalo-launches-360-music-video-on-facebook/</a>',
  options: {
    longWordSplit: { wrapCharacters: ['/', '_'], forceWrapOnLimit: false },
    selectors: [
      { selector: 'a', options: { hideLinkHrefIfSameAsText: true } }
    ]
  }
});

test('should split long strings in links and show href', snapshotMacro, {
  convert: convert,
  input: '<a href="http://images.fb.com/2015/12/21/ivete-sangalo-launches-360-music-video-on-facebook/">http://images.fb.com/2015/12/21/ivete-sangalo-launches-360-music-video-on-facebook/</a>',
  options: { longWordSplit: { wrapCharacters: ['/', '_'], forceWrapOnLimit: false } }
});
