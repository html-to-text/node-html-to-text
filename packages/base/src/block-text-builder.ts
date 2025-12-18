import type { AnyNode } from 'domhandler';
import type { Picker } from 'selderee';

import {
  BlockStackItem,
  type WrapStateStackItem,
  TableCellStackItem, TableRowStackItem, TableStackItem,
  TransformerStackItem, ListStackItem, ListItemStackItem
} from './stack-item';
import type { Options, TablePrinter, TagDefinition } from './typedefs';
import { trimCharacter } from './util';
import { WhitespaceProcessor } from './whitespace-processor';


type TagPicker = Picker<AnyNode, TagDefinition>;

interface CloseBlockOptions {
  trailingLineBreaks?: number;
  blockTransform?: (str: string) => string;
}

interface OpenListOptions {
  maxPrefixLength?: number;
  prefixAlign?: 'left' | 'right';
  interRowLineBreaks?: number;
  leadingLineBreaks?: number;
}

interface OpenListItemOptions {
  prefix?: string;
}

interface OpenTableCellOptions {
  maxColumnWidth?: number;
}

interface CloseTableOptions {
  tableToString: TablePrinter;
  leadingLineBreaks?: number;
  trailingLineBreaks?: number;
}

function assertWrapStateStackItem (item: unknown): asserts item is WrapStateStackItem {
  if (
    !item
    || typeof item !== 'object'
    || !('isPre' in item)
    || !('isNoWrap' in item)
    || !('next' in item)
  ) {
    throw new Error('Stack underflow: unexpected stack item type.');
  }
}

type TextContainerStackItem = BlockStackItem | ListItemStackItem | TableCellStackItem;

function assertTextContainerStackItem (item: WrapStateStackItem): asserts item is TextContainerStackItem {
  if (!(item instanceof BlockStackItem || item instanceof TableCellStackItem)) {
    throw new Error('Unexpected stack item type for text container.');
  }
}

/**
 * Helps to build text from inline and block elements.
 *
 * @class BlockTextBuilder
 */
class BlockTextBuilder {
  options: Options;
  picker: TagPicker;
  metadata: unknown;
  whitespaceProcessor: WhitespaceProcessor;
  _stackItem: WrapStateStackItem;
  _wordTransformer: TransformerStackItem | null;

  /**
   * Creates an instance of BlockTextBuilder.
   *
   * @param { Options } options HtmlToText options.
   * @param { TagPicker } picker Selectors decision tree picker.
   * @param { unknown } [metadata] Optional metadata for HTML document, for use in formatters.
   */
  constructor (options: Options, picker: TagPicker, metadata: unknown = undefined) {
    this.options = options;
    this.picker = picker;
    this.metadata = metadata;
    this.whitespaceProcessor = new WhitespaceProcessor(options);
    this._stackItem = new BlockStackItem(options);
    this._wordTransformer = null;
  }

  /**
   * Put a word-by-word transform function onto the transformations stack.
   *
   * Mainly used for uppercasing. Can be bypassed to add unformatted text such as URLs.
   *
   * Word transformations applied before wrapping.
   *
   * @param { (str: string) => string } wordTransform Word transformation function.
   */
  pushWordTransform (wordTransform: (str: string) => string): void {
    this._wordTransformer = new TransformerStackItem(this._wordTransformer, wordTransform);
  }

  /**
   * Remove a function from the word transformations stack.
   *
   * @returns { (str: string) => string } A function that was removed.
   */
  popWordTransform (): ((str: string) => string) | undefined {
    if (!this._wordTransformer) { return undefined; }
    const transform = this._wordTransformer.transform;
    this._wordTransformer = this._wordTransformer.next;
    return transform;
  }

  /**
   * Ignore wordwrap option in followup inline additions and disable automatic wrapping.
   */
  startNoWrap (): void {
    this._stackItem.isNoWrap = true;
  }

  /**
   * Return automatic wrapping to behavior defined by options.
   */
  stopNoWrap (): void {
    this._stackItem.isNoWrap = false;
  }

  /** @returns { (str: string) => string } */
  _getCombinedWordTransformer (): ((str: string) => string) | undefined {
    const wt = (this._wordTransformer)
      ? ((str: string) => applyTransformer(str, this._wordTransformer))
      : undefined;
    const ce = this.options.encodeCharacters;
    const ceFn = (typeof ce === 'function') ? ce : undefined;
    return (wt)
      ? ((ceFn) ? (str: string) => ceFn(wt(str)) : wt)
      : (ceFn || undefined);
  }

  _popStackItem (): WrapStateStackItem {
    const item = this._stackItem;
    const next = item.next;
    assertWrapStateStackItem(next);
    this._stackItem = next;
    return item;
  }

  /**
   * Add a line break into currently built block.
   */
  addLineBreak (): void {
    if (!(
      this._stackItem instanceof BlockStackItem
      || this._stackItem instanceof ListItemStackItem
      || this._stackItem instanceof TableCellStackItem
    )) { return; }
    if (this._stackItem.isPre) {
      this._stackItem.rawText += '\n';
    } else {
      this._stackItem.inlineTextBuilder.startNewLine();
    }
  }

  /**
   * Allow to break line in case directly following text will not fit.
   */
  addWordBreakOpportunity (): void {
    if (
      this._stackItem instanceof BlockStackItem
      || this._stackItem instanceof ListItemStackItem
      || this._stackItem instanceof TableCellStackItem
    ) {
      this._stackItem.inlineTextBuilder.wordBreakOpportunity = true;
    }
  }

  /**
   * Add a node inline into the currently built block.
   *
   * @param { string } str
   * Text content of a node to add.
   *
   * @param { object } [param1]
   * Object holding the parameters of the operation.
   *
   * @param { boolean } [param1.noWordTransform]
   * Ignore word transformers if there are any.
   * Don't encode characters as well.
   * (Use this for things like URL addresses).
   */
  addInline (str: string, { noWordTransform = false }: { noWordTransform?: boolean; } = {}): void {
    if (!(
      this._stackItem instanceof BlockStackItem
      || this._stackItem instanceof ListItemStackItem
      || this._stackItem instanceof TableCellStackItem
    )) { return; }

    if (this._stackItem.isPre) {
      this._stackItem.rawText += str;
      return;
    }

    if (
      str.length === 0 || // empty string
      (
        this._stackItem.stashedLineBreaks && // stashed linebreaks make whitespace irrelevant
        !this.whitespaceProcessor.testContainsWords(str) // no words to add
      )
    ) { return; }

    if (this.options.preserveNewlines) {
      const newlinesNumber = this.whitespaceProcessor.countNewlinesNoWords(str);
      if (newlinesNumber > 0) {
        this._stackItem.inlineTextBuilder.startNewLine(newlinesNumber);
        // keep stashedLineBreaks unchanged
        return;
      }
    }

    if (this._stackItem.stashedLineBreaks) {
      this._stackItem.inlineTextBuilder.startNewLine(this._stackItem.stashedLineBreaks);
    }
    this.whitespaceProcessor.shrinkWrapAdd(
      str,
      this._stackItem.inlineTextBuilder,
      (noWordTransform) ? undefined : this._getCombinedWordTransformer(),
      this._stackItem.isNoWrap
    );
    this._stackItem.stashedLineBreaks = 0; // inline text doesn't introduce line breaks
  }

  /**
   * Add a string inline into the currently built block.
   *
   * Use this for markup elements that don't have to adhere
   * to text layout rules.
   *
   * @param { string } str Text to add.
   */
  addLiteral (str: string): void {
    if (!(
      this._stackItem instanceof BlockStackItem
      || this._stackItem instanceof ListItemStackItem
      || this._stackItem instanceof TableCellStackItem
    )) { return; }

    if (str.length === 0) { return; }

    if (this._stackItem.isPre) {
      this._stackItem.rawText += str;
      return;
    }

    if (this._stackItem.stashedLineBreaks) {
      this._stackItem.inlineTextBuilder.startNewLine(this._stackItem.stashedLineBreaks);
    }
    this.whitespaceProcessor.addLiteral(
      str,
      this._stackItem.inlineTextBuilder,
      this._stackItem.isNoWrap
    );
    this._stackItem.stashedLineBreaks = 0;
  }

  /**
   * Start building a new block.
   *
   * @param { object } [param0]
   * Object holding the parameters of the block.
   *
   * @param { number } [param0.leadingLineBreaks]
   * This block should have at least this number of line breaks to separate it from any preceding block.
   *
   * @param { number }  [param0.reservedLineLength]
   * Reserve this number of characters on each line for block markup.
   *
   * @param { boolean } [param0.isPre]
   * Should HTML whitespace be preserved inside this block.
   */
  openBlock ({ leadingLineBreaks = 1, reservedLineLength = 0, isPre = false } = {}): void {
    assertTextContainerStackItem(this._stackItem);
    const maxLineLength = Math.max(20, this._stackItem.inlineTextBuilder.maxLineLength - reservedLineLength);
    this._stackItem = new BlockStackItem(
      this.options,
      this._stackItem,
      leadingLineBreaks,
      maxLineLength
    );
    if (isPre) { this._stackItem.isPre = true; }
  }

  /**
   * Finalize currently built block, add it's content to the parent block.
   *
   * @param { object } [param0]
   * Object holding the parameters of the block.
   *
   * @param { number } [param0.trailingLineBreaks]
   * This block should have at least this number of line breaks to separate it from any following block.
   *
   * @param { (str: string) => string } [param0.blockTransform]
   * A function to transform the block text before adding to the parent block.
   * This happens after word wrap and should be used in combination with reserved line length
   * in order to keep line lengths correct.
   * Used for whole block markup.
   */
  closeBlock ({ trailingLineBreaks = 1, blockTransform }: CloseBlockOptions = {}): void {
    const block = this._popStackItem();
    assertTextContainerStackItem(block);
    assertTextContainerStackItem(this._stackItem);
    const blockText = (blockTransform) ? blockTransform(getText(block)) : getText(block);
    addText(this._stackItem, blockText, block.leadingLineBreaks, Math.max(block.stashedLineBreaks, trailingLineBreaks));
  }

  /**
   * Start building a new list.
   *
   * @param { object } [param0]
   * Object holding the parameters of the list.
   *
   * @param { number } [param0.maxPrefixLength]
   * Length of the longest list item prefix.
   * If not supplied or too small then list items won't be aligned properly.
   *
   * @param { 'left' | 'right' } [param0.prefixAlign]
   * Specify how prefixes of different lengths have to be aligned
   * within a column.
   *
   * @param { number } [param0.interRowLineBreaks]
   * Minimum number of line breaks between list items.
   *
   * @param { number } [param0.leadingLineBreaks]
   * This list should have at least this number of line breaks to separate it from any preceding block.
   */
  openList (
    { maxPrefixLength = 0, prefixAlign = 'left', interRowLineBreaks = 1, leadingLineBreaks = 2 }: OpenListOptions = {}
  ): void {
    assertTextContainerStackItem(this._stackItem);
    this._stackItem = new ListStackItem(this.options, this._stackItem, {
      interRowLineBreaks: interRowLineBreaks,
      leadingLineBreaks: leadingLineBreaks,
      maxLineLength: this._stackItem.inlineTextBuilder.maxLineLength,
      maxPrefixLength: maxPrefixLength,
      prefixAlign: prefixAlign
    });
  }

  /**
   * Start building a new list item.
   *
   * @param {object} param0
   * Object holding the parameters of the list item.
   *
   * @param { string } [param0.prefix]
   * Prefix for this list item (item number, bullet point, etc).
   */
  openListItem ({ prefix = '' }: OpenListItemOptions = {}): void {
    if (!(this._stackItem instanceof ListStackItem)) {
      throw new Error('Can\'t add a list item to something that is not a list! Check the formatter.');
    }
    const list = this._stackItem;
    const prefixLength = Math.max(prefix.length, list.maxPrefixLength);
    const maxLineLength = Math.max(20, list.inlineTextBuilder.maxLineLength - prefixLength);
    this._stackItem = new ListItemStackItem(this.options, list, {
      prefix: prefix,
      maxLineLength: maxLineLength,
      leadingLineBreaks: list.interRowLineBreaks
    });
  }

  /**
   * Finalize currently built list item, add it's content to the parent list.
   */
  closeListItem (): void {
    const listItem = this._popStackItem();
    if (!(listItem instanceof ListItemStackItem)) {
      throw new Error('Can\'t close a list item outside of a list item.');
    }
    const list = listItem.next;
    if (!(list instanceof ListStackItem)) {
      throw new Error('Can\'t close a list item without a parent list.');
    }

    const prefixLength = Math.max(listItem.prefix.length, list.maxPrefixLength);
    const spacing = '\n' + ' '.repeat(prefixLength);
    const prefix = (list.prefixAlign === 'right')
      ? listItem.prefix.padStart(prefixLength)
      : listItem.prefix.padEnd(prefixLength);
    const text = prefix + getText(listItem).replace(/\n/g, spacing);

    addText(
      list,
      text,
      listItem.leadingLineBreaks,
      Math.max(listItem.stashedLineBreaks, list.interRowLineBreaks)
    );
  }

  /**
   * Finalize currently built list, add it's content to the parent block.
   *
   * @param { object } param0
   * Object holding the parameters of the list.
   *
   * @param { number } [param0.trailingLineBreaks]
   * This list should have at least this number of line breaks to separate it from any following block.
   */
  closeList ({ trailingLineBreaks = 2 } = {}): void {
    const list = this._popStackItem();
    if (!(list instanceof ListStackItem)) {
      throw new Error('Can\'t close a list outside of a list.');
    }
    assertTextContainerStackItem(this._stackItem);
    const text = getText(list);
    if (text) {
      addText(this._stackItem, text, list.leadingLineBreaks, trailingLineBreaks);
    }
  }

  /**
   * Start building a table.
   */
  openTable (): void {
    assertTextContainerStackItem(this._stackItem);
    this._stackItem = new TableStackItem(this._stackItem);
  }

  /**
   * Start building a table row.
   */
  openTableRow (): void {
    if (!(this._stackItem instanceof TableStackItem)) {
      throw new Error('Can\'t add a table row to something that is not a table! Check the formatter.');
    }
    this._stackItem = new TableRowStackItem(this._stackItem);
  }

  /**
   * Start building a table cell.
   *
   * @param { object } [param0]
   * Object holding the parameters of the cell.
   *
   * @param { number } [param0.maxColumnWidth]
   * Wrap cell content to this width. Fall back to global wordwrap value if undefined.
   */
  openTableCell ({ maxColumnWidth }: OpenTableCellOptions = {}): void {
    if (!(this._stackItem instanceof TableRowStackItem)) {
      throw new Error('Can\'t add a table cell to something that is not a table row! Check the formatter.');
    }
    this._stackItem = new TableCellStackItem(this.options, this._stackItem, maxColumnWidth);
  }

  /**
   * Finalize currently built table cell and add it to parent table row's cells.
   *
   * @param { object } [param0]
   * Object holding the parameters of the cell.
   *
   * @param { number } [param0.colspan] How many columns this cell should occupy.
   * @param { number } [param0.rowspan] How many rows this cell should occupy.
   */
  closeTableCell ({ colspan = 1, rowspan = 1 } = {}): void {
    const cell = this._popStackItem();
    if (!(cell instanceof TableCellStackItem)) {
      throw new Error('Can\'t close a table cell outside of a table cell.');
    }
    const text = trimCharacter(getText(cell), '\n');
    if (!(cell.next instanceof TableRowStackItem)) {
      throw new Error('Can\'t close a table cell without a parent table row.');
    }
    cell.next.cells.push({ colspan: colspan, rowspan: rowspan, text: text });
  }

  /**
   * Finalize currently built table row and add it to parent table's rows.
   */
  closeTableRow (): void {
    const row = this._popStackItem();
    if (!(row instanceof TableRowStackItem)) {
      throw new Error('Can\'t close a table row outside of a table row.');
    }
    if (!(row.next instanceof TableStackItem)) {
      throw new Error('Can\'t close a table row without a parent table.');
    }
    row.next.rows.push(row.cells);
  }

  /**
   * Finalize currently built table and add the rendered text to the parent block.
   *
   * @param { object } param0
   * Object holding the parameters of the table.
   *
   * @param { TablePrinter } param0.tableToString
   * A function to convert a table of stringified cells into a complete table.
   *
   * @param { number } [param0.leadingLineBreaks]
   * This table should have at least this number of line breaks to separate if from any preceding block.
   *
   * @param { number } [param0.trailingLineBreaks]
   * This table should have at least this number of line breaks to separate it from any following block.
   */
  closeTable ({ tableToString, leadingLineBreaks = 2, trailingLineBreaks = 2 }: CloseTableOptions): void {
    const table = this._popStackItem();
    if (!(table instanceof TableStackItem)) {
      throw new Error('Can\'t close a table outside of a table.');
    }
    assertTextContainerStackItem(this._stackItem);
    const output = tableToString(table.rows);
    if (output) {
      addText(this._stackItem, output, leadingLineBreaks, trailingLineBreaks);
    }
  }

  /**
   * Return the rendered text content of this builder.
   *
   * @returns { string }
   */
  toString (): string {
    const root = this._stackItem.getRoot();
    if (!(root instanceof BlockStackItem)) {
      throw new Error('Invalid stack root item type.');
    }
    return getText(root);
    // There should only be the root item if everything is closed properly.
  }

}

function getText (stackItem: TextContainerStackItem): string {
  if (!(
    stackItem instanceof BlockStackItem
    || stackItem instanceof ListItemStackItem
    || stackItem instanceof TableCellStackItem
  )) {
    throw new Error('Only blocks, list items and table cells can be requested for text contents.');
  }
  return (stackItem.inlineTextBuilder.isEmpty())
    ? stackItem.rawText
    : stackItem.rawText + stackItem.inlineTextBuilder.toString();
}

function addText (
  stackItem: TextContainerStackItem,
  text: string,
  leadingLineBreaks: number,
  trailingLineBreaks: number
): void {
  if (!(
    stackItem instanceof BlockStackItem
    || stackItem instanceof ListItemStackItem
    || stackItem instanceof TableCellStackItem
  )) {
    throw new Error('Only blocks, list items and table cells can contain text.');
  }
  const parentText = getText(stackItem);
  const lineBreaks = Math.max(stackItem.stashedLineBreaks, leadingLineBreaks);
  stackItem.inlineTextBuilder.clear();
  if (parentText) {
    stackItem.rawText = parentText + '\n'.repeat(lineBreaks) + text;
  } else {
    stackItem.rawText = text;
    stackItem.leadingLineBreaks = lineBreaks;
  }
  stackItem.stashedLineBreaks = trailingLineBreaks;
}

/**
 * @param { string } str A string to transform.
 * @param { TransformerStackItem } transformer A transformer item (with possible continuation).
 * @returns { string }
 */
function applyTransformer (str: string, transformer: TransformerStackItem | null): string {
  return ((transformer) ? applyTransformer(transformer.transform(str), transformer.next) : str);
}

export { BlockTextBuilder };
