'use strict'

let once = true;
const
fs = require('fs'),
htmlparser = require('htmlparser'),
includes = (a,k)=>~a.indexOf(k),
helper = require('./helper'),
format = require('./formatter'),
// Which type of tags should not be parsed
SKIP_TYPES = [
	'style',
	'script'
]

function htmlToText(html, options) {
	options = Object.assign({
		wordwrap: 80,
		tables: [],
		preserveNewlines: false,
		uppercaseHeadings: true,
		hideLinkHrefIfSameAsText: false,
		linkHrefBaseUrl: null,
		baseElement: 'body',
		returnDomByDefault: true,
		decodeOptions: {
			isAttributeValue: false,
			strict: false
		},
		longWordSplit: {
			wrapCharacters: [],
			forceWrapOnLimit: false
		}
	}, options)

	let handler = new htmlparser.DefaultHandler((error, dom) => {}, {
		verbose: true,
		ignoreWhitespace: true
	})
	new htmlparser.Parser(handler).parseComplete(html)

	options.lineCharCount = 0

	let result = ''
	let baseElements = Array.isArray(options.baseElement) ? options.baseElement : [options.baseElement]
	for(let elm of baseElements)
		result += walk(filterBody(handler.dom, options, elm), options)

	return result.trim()
}

function filterBody(dom, options, baseElement) {
	let splitTag = helper.splitCssSearchTag(baseElement),
	result

	function walk(dom) {
		if (result) return
		for(let elem of dom){
			if (result) return
			if (elem.name === splitTag.element) {
				let documentClasses = elem.attribs && elem.attribs.class ? elem.attribs.class.split(" ") : []
				let documentIds = elem.attribs && elem.attribs.id ? elem.attribs.id.split(" ") : []

				if ((splitTag.classes.every(val => documentClasses.indexOf(val) >= 0 )) &&
					(splitTag.ids.every(val => documentIds.indexOf(val) >= 0 ))) {
					result = [elem]
					return
				}
			}
			if (elem.children) walk(elem.children)
		}
	}
	walk(dom)
	return options.returnDomByDefault ? result || dom : result
}

function containsTable(attr, tables){
	let i = tables.length
	while(i--)
		if((tables[i][0] === '#' ? attr.id : attr.class) === tables[i].substr(1))
			return true
}

function walk(dom, options, result) {
	if(!dom) return ''

	if (arguments.length < 3)
		result = ''

	let whiteSpaceRegex = /\S$/

	for(let elem of dom) {
		switch(elem.type) {
			case 'tag':
				switch(elem.name.toLowerCase()) {
					case 'img':
						result += format.image(elem, options)
						break
					case 'a':
						// Inline element needs a leading space if `result`
						// currently doesn't end with whitespace
						elem.needsSpace = whiteSpaceRegex.test(result)
						result += format.anchor(elem, walk, options)
						break
					case 'p':
						result += format.paragraph(elem, walk, options)
						break
					case 'h1':
					case 'h2':
					case 'h3':
					case 'h4':
					case 'h5':
					case 'h6':
						result += format.heading(elem, walk, options)
						break
					case 'br':
						result += format.lineBreak(elem, walk, options)
						break
					case 'hr':
						result += format.horizontalLine(elem, walk, options)
						break
					case 'ul':
						result += format.unorderedList(elem, walk, options)
						break
					case 'ol':
						result += format.orderedList(elem, walk, options)
						break
					case 'pre':
						var newOptions = Object.assign({}, options)
						newOptions.isInPre = true
						result += format.paragraph(elem, walk, newOptions)
						break
					case 'table':
						if (options.tables == true || elem.attribs &&
							containsTable(elem.attribs, options.tables)) {
							result += format.table(elem, walk, options)
							break
						}
					default:
						result = walk(elem.children || [], options, result)
				}
				break
			case 'text':
				if (elem.raw !== '\r\n') {
					// Text needs a leading space if `result` currently
					// doesn't end with whitespace
					elem.needsSpace = whiteSpaceRegex.test(result)
					result += format.text(elem, options)
				}
				break
			default:
				if (!includes(SKIP_TYPES, elem.type)) {
					result = walk(elem.children || [], options, result)
				}
		}

		options.lineCharCount = result.length - (result.lastIndexOf('\n') + 1)
	}
	return result
}

exports.fromFile = (file, options, callback) => {
	if (!callback) {
		callback = options
		options = {}
	}
	fs.readFile(file, 'utf8', (err, str) =>
		callback(null, htmlToText(str, options))
	)
}

exports.fromString = (str, options) => htmlToText(str, options || {})
