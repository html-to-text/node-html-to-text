import test from 'ava';

import { htmlToText } from '../../src/html-to-text.js';
import { snapshotMacro } from '../snapshot-helpers.js';


test('should render common block-level elements on separate lines with default line breaks number', snapshotMacro, {
  convert: htmlToText,
  input:
    'a<article>article</article>b<aside>aside</aside>c<div>div</div>d<footer>footer</footer>' +
    'e<form>form</form>f<header>header</header>g<main>main</main>h<nav>nav</nav>i<section>section</section>j'
});


