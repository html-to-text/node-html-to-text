import { InlineTextBuilder } from './inline-text-builder';
import type { Options } from './typedefs';


interface WrapState {
  isPre: boolean;
  isNoWrap: boolean;
}

type WrapStateStackItem = StackItem & WrapState;

class StackItem {
  next: StackItem | null;
  constructor (next: StackItem | null = null) { this.next = next; }

  getRoot (): StackItem { return (this.next) ? this.next.getRoot() : this; }
}

class BlockStackItem extends StackItem {
  leadingLineBreaks: number;
  inlineTextBuilder: InlineTextBuilder;
  rawText: string;
  stashedLineBreaks: number;
  isPre: boolean;
  isNoWrap: boolean;
  constructor (
    options: Options,
    next: WrapStateStackItem | null = null,
    leadingLineBreaks = 1,
    maxLineLength: number | undefined = undefined
  ) {
    super(next);
    this.leadingLineBreaks = leadingLineBreaks;
    this.inlineTextBuilder = new InlineTextBuilder(options, maxLineLength);
    this.rawText = '';
    this.stashedLineBreaks = 0;
    this.isPre = next?.isPre ?? false;
    this.isNoWrap = next?.isNoWrap ?? false;
  }
}

interface ListStackItemOptions {
  interRowLineBreaks?: number;
  leadingLineBreaks?: number;
  maxLineLength?: number;
  maxPrefixLength?: number;
  prefixAlign?: 'left' | 'right';
}

class ListStackItem extends BlockStackItem {
  maxPrefixLength: number;
  prefixAlign: 'left' | 'right';
  interRowLineBreaks: number;
  constructor (
    options: Options,
    next: WrapStateStackItem | null = null,
    {
      interRowLineBreaks = 1,
      leadingLineBreaks = 2,
      maxLineLength,
      maxPrefixLength = 0,
      prefixAlign = 'left',
    }: ListStackItemOptions = {}
  ) {
    super(options, next, leadingLineBreaks, maxLineLength);
    this.maxPrefixLength = maxPrefixLength;
    this.prefixAlign = prefixAlign;
    this.interRowLineBreaks = interRowLineBreaks;
  }
}

interface ListItemStackItemOptions {
  leadingLineBreaks?: number;
  maxLineLength?: number;
  prefix?: string;
}

class ListItemStackItem extends BlockStackItem {
  prefix: string;
  constructor (
    options: Options,
    next: WrapStateStackItem | null = null,
    {
      leadingLineBreaks = 1,
      maxLineLength,
      prefix = '',
    }: ListItemStackItemOptions = {}
  ) {
    super(options, next, leadingLineBreaks, maxLineLength);
    this.prefix = prefix;
  }
}

interface TableCell {
  colspan: number;
  rowspan: number;
  text: string;
}

class TableStackItem extends StackItem {
  rows: TableCell[][];
  isPre: boolean;
  isNoWrap: boolean;
  constructor (next: WrapStateStackItem | null = null) {
    super(next);
    this.rows = [];
    this.isPre = next?.isPre ?? false;
    this.isNoWrap = next?.isNoWrap ?? false;
  }
}

class TableRowStackItem extends StackItem {
  cells: TableCell[];
  isPre: boolean;
  isNoWrap: boolean;
  constructor (next: WrapStateStackItem | null = null) {
    super(next);
    this.cells = [];
    this.isPre = next?.isPre ?? false;
    this.isNoWrap = next?.isNoWrap ?? false;
  }
}

class TableCellStackItem extends StackItem {
  inlineTextBuilder: InlineTextBuilder;
  leadingLineBreaks: number;
  rawText: string;
  stashedLineBreaks: number;
  isPre: boolean;
  isNoWrap: boolean;
  constructor (options: Options, next: WrapStateStackItem | null = null, maxColumnWidth: number | undefined = undefined) {
    super(next);
    this.inlineTextBuilder = new InlineTextBuilder(options, maxColumnWidth);
    this.leadingLineBreaks = 1;
    this.rawText = '';
    this.stashedLineBreaks = 0;
    this.isPre = next?.isPre ?? false;
    this.isNoWrap = next?.isNoWrap ?? false;
  }
}

class TransformerStackItem extends StackItem {
  transform: (str: string) => string;
  declare next: TransformerStackItem | null;
  constructor (next: TransformerStackItem | null = null, transform: (str: string) => string) {
    super(next);
    this.next = next;
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

export type { TableCell };
export type { WrapStateStackItem };
