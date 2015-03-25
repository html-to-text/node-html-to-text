# node-html-to-text

An advanced converter that parses HTML and returns beautiful text. It was mainly designed to transform HTML E-Mail templates to a text representation. So it is currently optimized for table layouts.

### Features:

 * Transform headlines to uppercase text.
 * Convert tables to an appropiate text representation with rows and columns.
 * Word wrapping for paragraphs (default 80 chars)
 * Automatic extraction of href information from links.
 * `<br>` conversion to `\n`

## Installation

```
npm install html-to-text
```

Or when you want to use it as command line interface it is recommended to install it globally via

```
npm install html-to-text -g
```

## Usage
You can read from a file via:

```
var htmlToText = require('html-to-text');

htmlToText.fromFile(path.join(__dirname, 'test.html'), {
	tables: ['#invoice', '.address']
}, function(err, text) {
	if (err) return console.error(err);
	console.log(text);
});
```

or directly from a string:

```
var htmlToText = require('html-to-text');

var text = htmlToText.fromString('<h1>Hello World</h1>', {
	wordwrap: 130
});
console.log(text);
```

### Options:

You can configure the behaviour of html-to-text with the following options:

 * `tables` allows to select certain tables by the `class` or `id` attribute from the HTML document. This is necessary because the majority of HTML E-Mails uses a table based layout. Prefix your table selectors with an `.` for the `class` and with a `#` for the `id` attribute. All other tables are ignored. You can assign `true` to this attribute to select all tables. Default: `[]`
 * `wordwrap` defines after how many chars a line break should follow in `p` elements. Set to `null` or `false` to disable word-wrapping. Default: `80`
 * `linkHrefBaseUrl` allows you to specify the server host for href attributes, where the links start at the root (`/`). For example, `linkHrefBaseUrl = 'http://asdf.com'` and `<a href='/dir/subdir'>...</a>` the link in the text will be `http://asdf.com/dir/subdir`. Keep in mind that `linkHrefBaseUrl` shouldn't end with a `/`.
 * `hideLinkHrefIfSameAsText` by default links are translated the following `<a href='link'>text</a>` => becomes => `text [link]`. If this option is set to true and `link` and `text` are the same, `[link]` will be hidden and only `text` visible.
 * `ignoreHref` ignore all document links if `true`.
 * `ignoreImage` ignore all document images if `true`.

## Command Line Interface

It is possible to use html-to-text as command line interface. This allows an easy validation of your generated text and the integration in other systems that does not run on node.js.

`html-to-text` uses `stdin` and `stdout` for data in and output. So you can use `html-to-html` the following way:

```
cat example/test.html | html-to-text > test.txt
```

There also all options available as described above. You can use them like this:

```
cat example/test.html | html-to-text --tables=#invoice,.address --wordwrap=100 > test.txt
```

The `tables` option has to be declared as comma separated list without whitespaces.

## Example

```
<html>
	<head>
		<meta charset="utf-8">
	</head>

	<body>
		<table cellpadding="0" cellspacing="0" border="0">
			<tr>
				<td>
					<h2>Paragraphs</h2>
					<p class="normal-space">At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. <a href="www.github.com">Github</a>
					</p>
					<p class="normal-space">At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.
					</p>
				</td>
				<td></td>
			</tr>
			<tr>
				<td>
					<hr/>
					<h2>Pretty printed table</h2>
					<table id="invoice">
						<thead>
							<tr>
								<th>Article</th>
								<th>Price</th>
								<th>Taxes</th>
								<th>Amount</th>
								<th>Total</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td>
									<p>
										Product 1<br />
										<span style="font-size:0.8em">Contains: 1x Product 1</span>
									</p>
								</td>
								<td align="right" valign="top">6,99&euro;</td>
								<td align="right" valign="top">7%</td>
								<td align="right" valign="top">1</td>
								<td align="right" valign="top">6,99€</td>
							</tr>
							<tr>
								<td>Shipment costs</td>
								<td align="right">3,25€</td>
								<td align="right">7%</td>
								<td align="right">1</td>
								<td align="right">3,25€</td>
							</tr>
						</tbody>
						<tfoot>
							<tr>
								<td>&nbsp;</td>
								<td>&nbsp;</td>
								<td colspan="3">to pay: 10,24€</td>
							</tr>
							<tr>
								<td></td>
								<td></td>
								<td colspan="3">Taxes 7%: 0,72€</td>
							</tr>
						</tfoot>
					</table>

				</td>
				<td></td>
			</tr>
			<tr>
				<td>
					<hr/>
					<h2>Lists</h2>
					<ul>
						<li>At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.</li>
						<li>At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.</li>
					</ul>
					<ol>
						<li>At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.</li>
						<li>At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.</li>
					</ol>
				</td>
			</tr>
			<tr>
				<td>
					<hr />
					<h2>Column Layout with tables</h2>
					<table class="address">
						<tr>
							<th align="left">Invoice Address</th>
							<th align="left">Shipment Address</th>
						</tr>
						<tr>
							<td align="left">
								<p>
								Mr.<br/>
								John Doe<br/>
								Featherstone Street 49<br/>
								28199 Bremen<br/>
								</p>
							</td>
							<td align="left">
								<p>
								Mr.<br/>
								John Doe<br/>
								Featherstone Street 49<br/>
								28199 Bremen<br/>
								</p>
							</td>
						</tr>
					</table>
				</td>
				<td></td>
			</tr>
			<tr>
				<td>
					<hr/>
					<h2>Mailto formating</h2>
					<p class="normal-space small">
						Some Company<br />
						Some Street 42<br />
						Somewhere<br />
						E-Mail: <a href="mailto:test@example.com">Click here</a>
					</p>
				</td>
			</tr>
		</table>
	</body>
</html>
```

Gets converted to:

```
PARAGRAPHS
At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd
gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum
dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor
invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos
et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea
takimata sanctus est Lorem ipsum dolor sit amet. Github [www.github.com]

At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd
gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum
dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor
invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos
et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea
takimata sanctus est Lorem ipsum dolor sit amet.

--------------------------------------------------------------------------------

PRETTY PRINTED TABLE
ARTICLE                  PRICE   TAXES             AMOUNT   TOTAL   
Product 1                6,99€   7%                1        6,99€   
Contains: 1x Product 1                                              
Shipment costs           3,25€   7%                1        3,25€   
                                 to pay: 10,24€                     
                                 Taxes 7%: 0,72€                    

--------------------------------------------------------------------------------

LISTS
 * At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd
   gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.
 * At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd
   gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.

 1. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd
    gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.
 2. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd
    gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.

--------------------------------------------------------------------------------

COLUMN LAYOUT WITH TABLES
INVOICE ADDRESS          SHIPMENT ADDRESS         
Mr.                      Mr.                      
John Doe                 John Doe                 
Featherstone Street 49   Featherstone Street 49   
28199 Bremen             28199 Bremen             

--------------------------------------------------------------------------------

MAILTO FORMATING
Some Company
Some Street 42
Somewhere
E-Mail: Click here [test@example.com]
```

## License 

(The MIT License)

Copyright (c) 2012 Malte Legenhausen &lt;legenhausen@werk85.de&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

[![githalytics.com alpha](https://cruel-carlota.pagodabox.com/cc03826a7e68e1bb680cf2226276e031 "githalytics.com")](http://githalytics.com/werk85/node-html-to-text)
