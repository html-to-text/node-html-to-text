# Changelog

## Version 0.6.0

- Based on `html-to-text` version 10.0.0 ([changelog](https://github.com/html-to-text/node-html-to-text/blob/master/packages/html-to-text/CHANGELOG.md))
- Requires Node.js version >= 20.19.0
- `aspargvs` dependency updated to version 0.7.0 ([changelog](https://github.com/mxxii/aspargvs/blob/main/CHANGELOG.md))
  - combination of presets/JSON files and explicit keys now works as expected
    - explicit keys override values from presets/JSON files
  - recursive subkeys (`::`, `:::`, etc.) now supported
- Replaced `deepmerge` dependency with `deepmerge-ts`
- Composition of options from presets/JSON files and explicit keys now behaves the same way as in `html-to-text`
  - (With exception of custom formatters and any functions, which can only be defined in code. CLI ignores `formatters` key completely)
- Added tests

## Version 0.5.4

- Based on `html-to-text` version 9.0.5

## Version 0.5.3

- Based on `html-to-text` version 9.0.4

## Version 0.5.2

- Based on `html-to-text` version 9.0.2

## Version 0.5.1

- Fix missing dependencies

## Version 0.5.0

- Initial release
- Requires Node.js version >= 14.13.1
- Based on `html-to-text` version 9.0.0
