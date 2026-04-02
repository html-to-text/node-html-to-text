import test from 'ava';

import { convert } from '../../src/html-to-text.js';
import { assertSnapshot, snapshotMacro } from '../snapshot-helpers.js';


const HTML_EXAMPLE = /*html*/`<html><body>
<div id="outside-hat">OUTSIDE_HAT</div>
<section id="main-a" class="pick common">
  <p>MAIN_A_P1</p>
  <p>MAIN_A_P2</p>
</section>
<section id="main-b" class="common">
  <p>MAIN_B_P1</p>
</section>
<section id="main-c" class="pick">
  <p>MAIN_C_P1</p>
  <p>MAIN_C_P2</p>
  <p>MAIN_C_P3</p>
  <p>MAIN_C_P4</p>
  <p>MAIN_C_P5</p>
</section>
<div id="outside-footer">OUTSIDE_FOOTER</div>
</body></html>`;

const HTML_INVALID_EXAMPLE = /*html*/`<html><body>
<div id="outside-hat">OUTSIDE_HAT</div>
<section id="main-a" class="pick common">
  <p>MAIN_A_P1</p>
  <p>MAIN_A_P2</p>
</section>
<div id="outside-footer">OUTSIDE_FOOTER</div>
</body>
<section id="main-b" class="common">
  <p>MAIN_B_P1</p>
</section>
</html>`;


test('should retrieve and convert the entire document under body by default', snapshotMacro, {
  convert: convert,
  input: HTML_EXAMPLE
});

test('should only retrieve and convert content under the specified base element if found', snapshotMacro, {
  convert: convert,
  input: HTML_EXAMPLE,
  options: { baseElements: { selectors: ['#main-a'] } }
});

test('should not repeat the same base element', snapshotMacro, {
  convert: convert,
  input: HTML_EXAMPLE,
  options: { baseElements: { selectors: ['#main-a', '#main-a'] } }
});

test('should retrieve base elements in order of occurrence', snapshotMacro, {
  convert: convert,
  input: HTML_EXAMPLE,
  options: {
    baseElements: {
      selectors: ['#main-c', '#main-a'],
      orderBy: 'occurrence'
    }
  }
});

test('should retrieve base elements in order of selectors', snapshotMacro, {
  convert: convert,
  input: HTML_EXAMPLE,
  options: {
    baseElements: {
      selectors: ['#main-c', '#main-a'],
      orderBy: 'selectors'
    }
  }
});

test('should retrieve all different base elements matched the same selector', snapshotMacro, {
  convert: convert,
  input: HTML_EXAMPLE,
  options: { baseElements: { selectors: ['.common'] } }
});

test('should respect maxBaseElements limit', snapshotMacro, {
  convert: convert,
  input: HTML_EXAMPLE,
  options: {
    baseElements: { selectors: ['p'], orderBy: 'occurrence' },
    limits: { maxBaseElements: 5 }
  }
});

test('should retrieve and convert entire document by default if no base element is found', snapshotMacro, {
  convert: convert,
  input: HTML_EXAMPLE,
  options: { baseElements: { selectors: ['#not-there'] } }
});

test('should return empty string if base element is not found and returnDomByDefault is false', snapshotMacro, {
  convert: convert,
  input: HTML_EXAMPLE,
  options: {
    baseElements: {
      selectors: ['#not-there'],
      returnDomByDefault: false
    }
  }
});

test('should handle outside-body content depending on base element options', (t) => {
  assertSnapshot(t, {
    convert: convert,
    input: HTML_INVALID_EXAMPLE,
    options: { baseElements: { returnDomByDefault: true } },
    title: 'only base element content is included by default'
  });
  assertSnapshot(t, {
    convert: convert,
    input: HTML_INVALID_EXAMPLE,
    options: {
      baseElements: {
        selectors: [],
        returnDomByDefault: true
      }
    },
    title: 'empty base element selectors to include entire document even in presence of body'
  });
});
