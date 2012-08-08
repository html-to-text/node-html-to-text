# node-html-to-text

A simple converter that parses HTML and returns beautiful text. It was mainly designed to transform HTML E-Mail templates to a text representation. So it is currently optimized for table layouts.

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

## Usage
You can read from a file via:

```
var htmlToText = require('html-to-text');

htmlToText.fromFile(path.join(__dirname, 'test.html'), {
	tables: ['invoice', 'address']
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

 * `tables` allows to select certain tables by the `class` attribute from the HTML document. This is necessary because the majority of HTML E-Mails uses a table based layout. So you have to define which tables should be treaded as `table`. All other tables are ignored.
 * `wordwrap` defines after how many chars a line break should follow in `p` elements.
 

## Example

```
<html>
	<head>
		<meta charset="utf-8">
	</head>

	<body>
		<table cellpadding="0" cellspacing="0" border="0">
			<tr>
				<td width="100%" valign="bottom">
					<h1>Dear John Doe,</h1>
				</td>
				<td><img src="logo.png" /></td>
			</tr>
			<tr>
				<td>
					<p class="normal-space">At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. <a href="www.github.com">Github</a>
					</p>
					<p class="normal-space">At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.
					</p>
				</td>
				<td></td>
			</tr>
			<tr>
				<td>
					<table>
						<tr>
							<th>Article</th>
							<th>Price</th>
							<th>Taxes</th>
							<th>Amount</th>
							<th>Total</th>
						</tr>
						<tr>
							<td>
								<p>
									Product 1<br />
									<span style="font-size:0.8em">Contains: 1x Product 1</span>
								</p>
							</td>
							<td align="right" valign="top">6,99€</td>
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
					</table>

				</td>
				<td></td>
			</tr>
			<tr>
				<td>
					<hr />
					<table>
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
					<hr />
					<h2>Law of Revocation</h2>
					<p class="normal-space small">At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.</p>
				</td>
				<td></td>
			</tr>
			<tr>
				<td>
					<hr />
					<h2>Terms of Condition</h2>
					<p class="normal-space small">At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.</p>
					<p class="normal-space small">At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.</p>
					<p class="normal-space small">At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.</p>
				</td>
				<td></td>
			</tr>
		</table>
	</body>
</html>
```

Gets converted to:

```
DEAR JOHN DOE,
At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd  no sea
takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet,    
diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed 
voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita   
sea takimata sanctus est Lorem ipsum dolor sit amet. www.github.com

At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd  no sea
takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet,    
diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed 
voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita   
sea takimata sanctus est Lorem ipsum dolor sit amet. 

ARTICLE                  PRICE   TAXES             AMOUNT   TOTAL   
Product 1                6,99€   7%                1        6,99€   
Contains: 1x Product 1                                   
Shipment costs           3,25€   7%                1        3,25€   
                                 to pay: 10,24€    
                                 Taxes 7%: 0,72€         

INVOICE ADDRESS          SHIPMENT ADDRESS         
Mr.                      Mr.                      
John Doe                 John Doe                 
Featherstone Street 49   Featherstone Street 49   
28199 Bremen             28199 Bremen             

LAW OF REVOCATION
At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd  no sea
takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet,    
diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed 
voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita   
sea takimata sanctus est Lorem ipsum dolor sit amet. 

TERMS OF CONDITION
At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd  no sea
takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet,    
diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed 
voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita   
sea takimata sanctus est Lorem ipsum dolor sit amet. 

At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd  no sea
takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet,    
diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed 
voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita   
sea takimata sanctus est Lorem ipsum dolor sit amet. 

At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd  no sea
takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet,    
diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed 
voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita   
sea takimata sanctus est Lorem ipsum dolor sit amet.
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