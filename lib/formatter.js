'use strict'

const he = require('he')
const helper = require('./helper')
const zip = a=>a.reduce((a, b)=>a.length>b.length?a:b).map((_,c)=>a.map(a=>a[c]))

function formatText(elem, options) {
	let text = (options.isInPre ? elem.raw : elem.raw.trim())
	text = he.decode(text, options.decodeOptions)

	return options.isInPre
		? text
		: helper.wordwrap(elem.needsSpace ? ' ' + text : text, options)
}

function formatImage(elem, options) {
	if (options.ignoreImage)
		return ''

	var result = '', attribs = elem.attribs || {}
	if (attribs.alt) {
		result += he.decode(attribs.alt, options.decodeOptions)
		if (attribs.src)
			result += ' '
	}
	if (attribs.src)
		result += `[${attribs.src}]`

	return result
}

function formatLineBreak(elem, fn, options) {
	return '\n' + fn(elem.children, options)
}

function formatParagraph(elem, fn, options) {
	return fn(elem.children, options) + '\n\n'
}

function formatHeading(elem, fn, options) {
	let heading = fn(elem.children, options)
	if (options.uppercaseHeadings)
		heading = heading.toUpperCase()

	return heading + '\n'
}

// If we have both href and anchor text, format it in a useful manner:
// - "anchor text [href]"
// Otherwise if we have only anchor text or an href, we return the part we have:
// - "anchor text" or
// - "href"
function formatAnchor(elem, fn, options) {
	let href = ''
	// Always get the anchor text
	let storedCharCount = options.lineCharCount
	let result = fn(elem.children || [], options).trim()

	if (!options.ignoreHref) {
		// Get the href, if present
		if (elem.attribs && elem.attribs.href)
			href = elem.attribs.href.replace(/^mailto\:/, '')

		if (href) {
			if (options.linkHrefBaseUrl && href.startsWith('/'))
				href = options.linkHrefBaseUrl + href

			if (!options.hideLinkHrefIfSameAsText || href != result.replace('\n', ''))
				result += ` [${href}]`
		}
	}

	options.lineCharCount = storedCharCount

	return formatText({ raw: result || href, needsSpace: elem.needsSpace }, options)
}

function formatHorizontalLine(elem, fn, options) {
	return '\n' + '-'.repeat(options.wordwrap) + '\n\n'
}

function formatListItem(prefix, elem, fn, options) {
	options = Object.assign({}, options)
	// Reduce the wordwrap for sub elements.
	if (options.wordwrap)
		options.wordwrap -= prefix.length

	// Process sub elements.
	var text = fn(elem.children, options)
	// Replace all line breaks with line break + prefix spacing.
	.replace(/\n/g, '\n' + ' '.repeat(prefix.length))
	// Add first prefix and line break at the end.
	return prefix + text + '\n'
}

function formatUnorderedList(elem, fn, options) {
	return elem.children.reduce((result, elem) =>
		result += formatListItem(' * ', elem, fn, options)
	, '') + '\n'
}

function formatOrderedList(elem, fn, options) {
	let result = ''
	// Make sure there are list items present
	if (elem.children && elem.children.length) {
		// Calculate the maximum length to i.
		var maxLength = elem.children.length.toString().length
		elem.children.forEach( (elem, index) => {
			index++
			// Calculate the needed spacing for nice indentation.
			let spacing = maxLength - index.toString().length
			let prefix = ` ${index}. ` + ' '.repeat(spacing)
			result += formatListItem(prefix, elem, fn, options)
		})
	}

	return result + '\n'
}

function tableToString(table) {
	let text = ''
	// Determine space width per column
	// Convert all rows to lengths
	let widths = table.map(row => row.map(col => col.length))
	// Invert rows with colums
	widths = zip(widths)
	// Determine the max values for each column
	widths = widths.map(col => Math.max(...col))
	// Build the table
	for(let row of table) {
		let i=0

		for (let col of row) {
			let msg = col.trim()
			text += msg + ' '.repeat(widths[i++] - msg.length) + '   '
		}

		text += '\n'
	}

	return text + '\n'
}

function formatTable(elem, fn, options) {
	let table = []

	function tryParseRows(elem) {
		if (elem.type !== 'tag')
			return

		switch (elem.name.toLowerCase()) {
			case "thead":
			case "tbody":
			case "tfoot":
			case "center":
				return elem.children.forEach(tryParseRows)
			case 'tr':
				let rows = []
				elem.children.forEach(elem => {
					if (elem.type === 'tag') {
						let tokens
						switch (elem.name.toLowerCase()) {
							case 'th':
								tokens = formatHeading(elem, fn, options).split('\n')
								rows.push(tokens.filter(x=>x)) // push truthly values
								break

							case 'td':
								tokens = fn(elem.children, options).split('\n')
								rows.push(tokens.filter(x=>x)) // push truthly values
								// Fill colspans with empty values
								if (elem.attribs && elem.attribs.colspan) {
									let times = elem.attribs.colspan - 1
									while(times--) rows.push([''])
								}
								break
						}
					}
				})
				rows = zip(rows)
				for(let row of rows) {
					row = row.map(col => col || '')
					table.push(row)
				}
		}
	}

	elem.children.forEach(tryParseRows)
	return tableToString(table)
}

exports.text = formatText
exports.image = formatImage
exports.lineBreak = formatLineBreak
exports.paragraph = formatParagraph
exports.anchor = formatAnchor
exports.heading = formatHeading
exports.table = formatTable
exports.orderedList = formatOrderedList
exports.unorderedList = formatUnorderedList
exports.listItem = formatListItem
exports.horizontalLine = formatHorizontalLine
