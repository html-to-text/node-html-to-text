/**
 * @typedef { object } Options
 * HtmlToText options.
 *
 * @property { string | string[] }    [baseElement = body]
 * The resulting text output will be composed from the text content of this element
 * (or elements if an array of strings is specified).
 *
 * Each entry is a single tag name with optional css class and id parameters,
 * e.g. `['p.class1.class2#id1#id2', 'p.class1.class2#id1#id2']`.
 *
 * @property { DecodeOptions }        [decodeOptions]
 * Text decoding options given to `he.decode`.
 *
 * For more informations see the [he](https://github.com/mathiasbynens/he) module.
 *
 * @property { object.< string, FormatCallback > } [format = {}]
 * A dictionary with custom formatting functions for specific kinds of elements.
 *
 * Keys are custom string identifiers, values are callbacks.
 *
 * @property { boolean }              [hideLinkHrefIfSameAsText = false]
 * By default links are translated in the following way:
 *
 * `<a href='link'>text</a>` => becomes => `text [link]`.
 *
 * If this option is set to `true` and `link` and `text` are the same,
 * `[link]` will be hidden and only `text` visible.
 *
 * @property { boolean }              [ignoreHref = false]
 * Ignore all links.
 *
 * @property { boolean }              [ignoreImage = false]
 * Ignore all images.
 *
 * @property { LimitsOptions }        [limits]
 * Options for handling complex documents and limiting the output size.
 *
 * @property { string | null }        [linkHrefBaseUrl = null]
 * Server host for link `href` attributes and image `src` attributes
 * relative to the root (the ones that start with `/`).
 *
 * For example, with `linkHrefBaseUrl = 'http://asdf.com'` and `<a href='/dir/subdir'>...</a>`
 * the link in the text will be `http://asdf.com/dir/subdir`.
 *
 * Keep in mind that `linkHrefBaseUrl` shouldn't end with a `/`.
 *
 * @property { LongWordSplitOptions } [longWordSplit]
 * Describes how to wrap long words.
 *
 * @property { boolean }              [noAnchorUrl = true]
 * Ignore anchor links (where `href='#...'`).
 *
 * @property { boolean }              [noLinkBrackets = false]
 * Don't print brackets around links.
 *
 * @property { boolean }              [preserveNewlines = false]
 * By default, any newlines `\n` from the input HTML are dropped.
 *
 * If `true`, these newlines will be preserved in the output.
 *
 * @property { boolean }              [returnDomByDefault = true]
 * Use the entire document if we don't find the tag defined in `Options.baseElement`.
 *
 * @property { boolean }              [singleNewLineParagraphs = false]
 * By default, paragraphs are separated with two newlines `\n\n`.
 *
 * Set to `true` to use a single newline `\n`.
 *
 * @property { string[] | boolean }   [tables = []]
 * Allows to select and format certain tables by the `class` or `id` attribute from the HTML document.
 *
 * This is necessary because the majority of HTML E-Mails uses a table based layout.
 *
 * Prefix your table selectors with a `.` for the `class` and with a `#` for the `id` attribute.
 * All other tables are ignored (processed as layout containers, not tabular data).
 *
 * You can assign `true` to this property to format all tables.
 *
 * @property { object.< string, TagDefinition > } [tags = {}]
 * A dictionary with custom tag definitions.
 *
 * Use this to (re)define how to handle new or already supported tags.
 *
 * Empty string (`''`) as a key used for the default definition for "any other" tags.
 *
 * @property { string }               [unorderedListItemPrefix = ' * ']
 * The string that is used as an item prefix for unordered lists `<ul>`.
 *
 * @property { boolean }              [uppercaseHeadings = true]
 * By default, headings (`<h1>`, `<h2>`, etc) are uppercased.
 *
 * Set this to `false` to leave headings as they are.
 *
 * @property { number | boolean | null } [wordwrap = 80]
 * After how many chars a line break should follow in `p` elements.
 *
 * Set to `null` or `false` to disable word-wrapping.
 */

/**
 * @typedef { object } DecodeOptions
 * Text decoding options given to `he.decode`.
 *
 * For more informations see the [he](https://github.com/mathiasbynens/he) module.
 *
 * @property { boolean } [isAttributeValue = false]
 * TLDR: If set to `true` - leave attribute values raw, don't parse them as text content.
 *
 * @property { boolean } [strict = false]
 * TLDR: If set to `true` - throw an error on invalid HTML input.
 */

/**
 * @typedef { object } LimitsOptions
 * Options for handling complex documents and limiting the output size.
 *
 * @property { string } [ellipsis = ...]
 * A string to put in place of skipped content.
 *
 * @property { number | undefined } [maxChildNodes = undefined]
 * Process only this many child nodes of any element.
 *
 * Remaining nodes, if any, will be replaced with ellipsis.
 *
 * Text nodes are counted along with tags.
 *
 * No limit if undefined.
 *
 * @property { number | undefined } [maxDepth = undefined]
 * Only go to a certain depth starting from `Options.baseElement`.
 *
 * Replace deeper nodes with ellipsis.
 *
 * No depth limit if undefined.
 */

/**
 * @typedef { object } LongWordSplitOptions
 * Describes how to wrap long words.
 *
 * @property { boolean }  [forceWrapOnLimit = false]
 * Break long words on the `Options.wordwrap` limit when there are no characters to wrap on.
 *
 * @property { string[] } [wrapCharacters = []]
 * An array containing the characters that may be wrapped on.
 */

/**
 * @typedef { object } TagDefinition
 * Describes how to handle a tag.
 *
 * @property { string } formatter
 * Identifier of a {@link FormatCallback}, built-in or provided in `Options.format` dictionary.
 *
 * @property { boolean } [inline = false]
 * `true` if this tag is inline, otherwise it is block-level.
 */

/**
 * @typedef { object } DomNode
 * Simplified definition of [htmlparser2](https://github.com/fb55/htmlparser2) Node type.
 *
 * Makes no distinction between elements (tags) and data nodes (good enough for now).
 *
 * @property { string }                 type       Type of node - "text", "tag", "comment", "script", etc.
 * @property { string }                 [data]     Content of a data node.
 * @property { string }                 [name]     Tag name.
 * @property { object.<string,string> } [attribs]  Tag attributes dictionary.
 * @property { DomNode[] }              [children] Child nodes.
 * @property { DomNode }                [parent]   Parent node.
 */

/**
 * A function to stringify a DOM node.
 *
 * @callback FormatCallback
 *
 * @param   { DomNode }           elem    A DOM node as returned by [htmlparser2](https://github.com/fb55/htmlparser2).
 * @param   { RecursiveCallback } fn      Recursive callback to process child nodes.
 * @param   { Options }           options HtmlToText options.
 * @returns { string }
 */

/**
 * A function to process child nodes.
 * Passed into a {@link FormatCallback} as an argument.
 *
 * @callback RecursiveCallback
 *
 * @param   { DomNode[] } nodes   DOM nodes array.
 * @param   { Options }   options HtmlToText options.
 * @returns { string }
 */
