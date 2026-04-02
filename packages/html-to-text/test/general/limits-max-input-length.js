import test from 'ava';

import { convert } from '../../src/html-to-text.js';


const processStderrWrite = process.stderr.write;

function overwriteProcessStderrWrite () {
  let processStderrWriteBuffer = '';
  process.stderr.write = (text) => { processStderrWriteBuffer += text; };
  return () => processStderrWriteBuffer;
}

function resetProcessStderrWrite () {
  process.stderr.write = processStderrWrite;
}

test.afterEach.always(function () {
  resetProcessStderrWrite();
});

test('should respect default limit of maxInputLength', function (t) {
  const getProcessStderrBuffer = overwriteProcessStderrWrite();
  const html = '0123456789'.repeat(2000000);
  const options = { wordwrap: false };
  t.is(convert(html, options).length, 1 << 24);
  t.is(getProcessStderrBuffer(), 'Input length 20000000 is above allowed limit of 16777216. Truncating without ellipsis.\n');
});

test('should respect custom maxInputLength', function (t) {
  const getProcessStderrBuffer = overwriteProcessStderrWrite();
  const html = '0123456789'.repeat(2000000);
  const options = { limits: { maxInputLength: 42 } };
  t.is(convert(html, options).length, 42);
  t.is(getProcessStderrBuffer(), 'Input length 20000000 is above allowed limit of 42. Truncating without ellipsis.\n');
});


