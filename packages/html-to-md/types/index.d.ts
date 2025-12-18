import type { AnyNode, Element } from 'domhandler';
export type Metadata = unknown;
export type DomNode = AnyNode;
export type metaData = Metadata;
export type EncodeCharacters = Record<string, string | false> | ((str: string) => string) | undefined;
export interface BaseElementsOptions {
    selectors?: string[];
    orderBy?: 'selectors' | 'occurrence';
    returnDomByDefault?: boolean;
}
export interface LimitsOptions {
    ellipsis?: string;
    maxBaseElements?: number;
    maxChildNodes?: number;
    maxDepth?: number;
    maxInputLength?: number;
}
export interface FormatOptions {
    leadingLineBreaks?: number;
    trailingLineBreaks?: number;
    baseUrl?: string | null;
    noAnchorUrl?: boolean;
    level?: number;
    marker?: string;
    interRowLineBreaks?: number;
    trimEmptyLines?: boolean;
    language?: string;
    spanMode?: 'repeat' | 'empty' | 'html' | 'td' | 'th' | 'tag';
    maxColumnWidth?: number;
    start?: number | string;
    pathRewrite?: (path: string, metadata: Metadata, element: Element) => string;
    [key: string]: unknown;
}
export interface TablePrinterCell {
    colspan: number;
    rowspan: number;
    text: string;
}
export type TablePrinter = (tableRows: TablePrinterCell[][]) => string;
export interface BlockTextBuilder {
    options: {
        decodeEntities: boolean;
        whitespaceCharacters: string;
        wordwrap: number | boolean | null;
        limits?: LimitsOptions;
        [key: string]: unknown;
    };
    metadata?: Metadata;
    pushWordTransform(wordTransform: (str: string) => string): void;
    popWordTransform(): ((str: string) => string) | undefined;
    startNoWrap(): void;
    stopNoWrap(): void;
    addLineBreak(): void;
    addWordBreakOpportunity(): void;
    addInline(str: string, opts?: {
        noWordTransform?: boolean;
    }): void;
    addLiteral(str: string): void;
    openBlock(opts?: {
        leadingLineBreaks?: number;
        reservedLineLength?: number;
        isPre?: boolean;
    }): void;
    closeBlock(opts?: {
        trailingLineBreaks?: number;
        blockTransform?: (str: string) => string;
    }): void;
    openList(opts?: {
        maxPrefixLength?: number;
        prefixAlign?: 'left' | 'right';
        interRowLineBreaks?: number;
        leadingLineBreaks?: number;
    }): void;
    openListItem(opts?: {
        prefix?: string;
    }): void;
    closeListItem(): void;
    closeList(opts?: {
        trailingLineBreaks?: number;
    }): void;
    openTable(): void;
    openTableRow(): void;
    openTableCell(opts?: {
        maxColumnWidth?: number;
    }): void;
    closeTableCell(opts?: {
        colspan?: number;
        rowspan?: number;
    }): void;
    closeTableRow(): void;
    closeTable(opts: {
        tableToString: TablePrinter;
        leadingLineBreaks?: number;
        trailingLineBreaks?: number;
    }): void;
}
export interface SelectorDefinition {
    selector: string;
    format: string;
    options?: FormatOptions;
}
export type RecursiveCallback = (dom: DomNode[] | undefined, builder: BlockTextBuilder) => void;
export type FormatCallback = (elem: Element, walk: RecursiveCallback, builder: BlockTextBuilder, formatOptions: FormatOptions) => void;
export interface Options {
    baseElements?: BaseElementsOptions;
    decodeEntities?: boolean;
    encodeCharacters?: EncodeCharacters;
    formatters?: Record<string, FormatCallback>;
    limits?: LimitsOptions;
    selectors?: SelectorDefinition[];
    whitespaceCharacters?: string;
    wordwrap?: number | boolean | null;
    baseElement?: string | string[];
    returnDomByDefault?: boolean;
    tags?: Record<string, Partial<Omit<SelectorDefinition, 'selector'>> & {
        selector?: string;
    }>;
    [key: string]: unknown;
}
export declare function compile(options?: Options): (html?: string, metadata?: Metadata) => string;
export declare function convert(html?: string, options?: Options, metadata?: Metadata): string;
export { convert as htmlToMarkdown };
