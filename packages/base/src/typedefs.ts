import type { BlockTextBuilder } from './block-text-builder';


export type DomNode = any;

export type EncodeCharacters =
  | Record<string, string | false>
  | ((str: string) => string)
  | undefined;

export interface BaseElementsOptions {
  selectors: string[];
  orderBy: 'selectors' | 'occurrence';
  returnDomByDefault: boolean;
}

export interface LimitsOptions {
  ellipsis?: string;
  maxBaseElements?: number;
  maxChildNodes?: number;
  maxDepth?: number;
  maxInputLength?: number;
}

export interface LongWordSplitOptions {
  forceWrapOnLimit?: boolean;
  wrapCharacters?: string[];
}

export interface FormatOptions {
  leadingLineBreaks?: number;
  trailingLineBreaks?: number;

  baseUrl?: string | null;
  pathRewrite?: (path: string, metadata: unknown, element: any) => string;
  hideLinkHrefIfSameAsText?: boolean;
  ignoreHref?: boolean;
  linkBrackets?: [string, string] | false;
  noAnchorUrl?: boolean;

  itemPrefix?: string;
  marker?: string;
  interRowLineBreaks?: number;
  uppercase?: boolean;
  uppercaseHeaderCells?: boolean;
  length?: number;
  level?: number;
  string?: string;
  prefix?: string;
  suffix?: string;
  trimEmptyLines?: boolean;
  language?: string;
  spanMode?: string;
  start?: number | string;
  maxColumnWidth?: number;
  colSpacing?: number;
  rowSpacing?: number;

  [key: string]: unknown;
}

export interface SelectorDefinition {
  selector: string;
  format: string;
  options?: FormatOptions;
}

export type TagDefinition = SelectorDefinition;

export type RecursiveCallback = (dom: DomNode[] | undefined, builder: BlockTextBuilder) => void;

export interface TableCell {
  colspan: number;
  rowspan: number;
  text: string;
}

export type TablePrinter = (rows: TableCell[][]) => string;

export type FormatCallback = (
  elem: any,
  walk: RecursiveCallback,
  builder: BlockTextBuilder,
  formatOptions: FormatOptions
) => void;

export interface Options {
  baseElements: BaseElementsOptions;
  decodeEntities: boolean;
  encodeCharacters?: EncodeCharacters;
  formatters: Record<string, FormatCallback>;
  limits: LimitsOptions;
  longWordSplit?: LongWordSplitOptions;
  preserveNewlines?: boolean;
  selectors: SelectorDefinition[];
  tables?: string[] | boolean;
  whitespaceCharacters: string;
  wordwrap: number | boolean | null;

  // Backwards-compatible support for deprecated / unknown options.
  [key: string]: unknown;
}
