/* eslint-disable max-classes-per-file */

import { InlineTextBuilder } from './inline-text-builder';


class StackItem {
  constructor (next = null) { this.next = next; }

  getRoot () { return (this.next) ? this.next : this; }
}

class BlockStackItem extends StackItem {
  constructor (options, next = null, leadingLineBreaks = 1, maxLineLength = undefined) {
    super(next);
    this.leadingLineBreaks = leadingLineBreaks;
    this.inlineTextBuilder = new InlineTextBuilder(options, maxLineLength);
    this.rawText = '';
    this.stashedLineBreaks = 0;
    this.isPre = next && next.isPre;
    this.isNoWrap = next && next.isNoWrap;
  }
}

class ListStackItem extends BlockStackItem {
  constructor (
    options,
    next = null,
    {
      interRowLineBreaks = 1,
      leadingLineBreaks = 2,
      maxLineLength = undefined,
      maxPrefixLength = 0,
      prefixAlign = 'left',
    } = {}
  ) {
    super(options, next, leadingLineBreaks, maxLineLength);
    this.maxPrefixLength = maxPrefixLength;
    this.prefixAlign = prefixAlign;
    this.interRowLineBreaks = interRowLineBreaks;
  }
}

class ListItemStackItem extends BlockStackItem {
  constructor (
    options,
    next = null,
    {
      leadingLineBreaks = 1,
      maxLineLength = undefined,
      prefix = '',
    } = {}
  ) {
    super(options, next, leadingLineBreaks, maxLineLength);
    this.prefix = prefix;
  }
}

class TableStackItem extends StackItem {
  constructor (next = null) {
    super(next);
    this.rows = [];
    this.isPre = next && next.isPre;
    this.isNoWrap = next && next.isNoWrap;
  }
}

class TableRowStackItem extends StackItem {
  constructor (next = null) {
    super(next);
    this.cells = [];
    this.isPre = next && next.isPre;
    this.isNoWrap = next && next.isNoWrap;
  }
}

class TableCellStackItem extends StackItem {
  constructor (options, next = null, maxColumnWidth = undefined) {
    super(next);
    this.inlineTextBuilder = new InlineTextBuilder(options, maxColumnWidth);
    this.rawText = '';
    this.stashedLineBreaks = 0;
    this.isPre = next && next.isPre;
    this.isNoWrap = next && next.isNoWrap;
  }
}

class TransformerStackItem extends StackItem {
  constructor (next = null, transform) {
    super(next);
    this.transform = transform;
  }
}

export {
  BlockStackItem,
  ListItemStackItem,
  ListStackItem,
  StackItem,
  TableCellStackItem,
  TableRowStackItem,
  TableStackItem,
  TransformerStackItem,
};
