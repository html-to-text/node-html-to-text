# Changelog

## Version 4.0.0

* Support dropped for node version < 4.
* New option `unorderedListItemPrefix` added.
* HTML entities in links are not supported.

## Version 3.3.0

* Ability to pass custom formatting via the `format` option #128
* Enhanced support for alpha ordered list types added #123

## Version 3.2.0

* Basic support for alpha ordered list types added #122
  * This includes support for the `ol` type values `1`, `a` and `A`

## Version 3.1.0

* Support for the ordered list start attribute added #117
* Option to format paragraph with single new line #112
* `noLinksBrackets` options added #119

## Version 3.0.0

* Switched from `htmlparser` to `htmlparser2` #113
* Treat non-numeric colspans as zero and handle them gracefully #105

## Version 2.1.1

 * Extra space ploblem fixed. #88

## Version 2.1.0

* New option to disable `uppercaseHeadings` added. #86
* Starting point of html to text conversion can now be defined in the options via the `baseElement` option. #83
* Support for long words added. The behaviour can be configured via the `longWordSplit` option. #83

## Version 2.0.0

* Unicode support added. #81
* New option `decodeOptions` added.
* Dependencies updated.

Breaking Changes:

* Minimum node version increased to >=0.10.0

## Version 1.6.2

* Fixed: correctly handle HTML entities for images #82

## Version 1.6.1

* Fixed: using --tables=true doesn't produce the expected results. #80

## Version 1.6.0

* Preserve newlines in text feature added #75

## Version 1.5.1

* Support for h5 and h6 tags added #74

## Version 1.5.0

* Entity regex is now less greedy #69 #70

## Version 1.4.0

* Uppercase tag processing added. Table center support added. #56
* Unuused dependencies removed.

## Version 1.3.2

* Support Node 4 engine #64
