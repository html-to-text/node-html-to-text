import test from 'ava';

import { compile } from '../../src/html-to-text.js';
import { snapshotCompiledMacro } from '../snapshot-helpers.js';


const defaultConvert = compile();

test('should ignore html comments', snapshotCompiledMacro, {
  convert: defaultConvert,
  input: /*html*/`
    <!--[^-]*-->
    <!-- <h1>Hello World</h1> -->
    text
  `
});

test('should ignore scripts', snapshotCompiledMacro, {
  convert: defaultConvert,
  input: /*html*/`
    <script src="javascript.js"></script>
    <script>
      console.log("Hello World!");
    </script>
    <script id="data" type="application/json">{"userId":1234,"userName":"John Doe","memberSince":"2000-01-01T00:00:00.000Z"}</script>
    text
  `
});

test('should ignore styles', snapshotCompiledMacro, {
  convert: defaultConvert,
  input: /*html*/`
    <link href="main.css" rel="stylesheet">
    <style type="text/css" media="all and (max-width: 500px)">
      p { color: #26b72b; }
    </style>
    text
  `
});

test('should not break after special tag followed by an entity', snapshotCompiledMacro, {
  convert: defaultConvert,
  input: /*html*/`<style>a{}</style>&apos;<br/><span>text</span>`
});


