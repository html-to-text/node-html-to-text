# @html-to/text-cli

[![npm](https://img.shields.io/npm/v/@html-to/text-cli?logo=npm)](https://www.npmjs.com/package/@html-to/text-cli)

Command line interface for [html-to-text](https://www.npmjs.com/package/html-to-text) Node.js package.


## Features

- almost all `html-to-text` options can be specified via command line arguments or json config (the only exception is functions such as custom formatters);
- a couple of presets for common use cases (human reading in terminal and machine indexing/search).


## Changelog

Available here: [CHANGELOG.md](https://github.com/html-to-text/node-html-to-text/blob/master/packages/html-to-text-cli/CHANGELOG.md)


## Installation

```
npm i -g @html-to/text-cli
```

### Name collisions

- old versions of `html-to-text` package expose a command with the same name. Make sure that package is not installed globally anymore.
- there is an old abandoned CLI package that exposes a command with the same name and actually has nothing to do with `html-to-text` package. Make sure to only use namespaced package `@html-to/text-cli`.


## Usage

- Use `html-to-text` command (`html-to-text.cmd` in PowerShell);
- Pipe HTML to `stdin`;
- Get plain text from `stdout`;
- Pass converter options as command arguments.

### Command line arguments

```shell
> cat ./input.html | html-to-text [commands...] [keys and values...] > ./output.txt
  ```

In PowerShell:

```shell
PS> Get-Content .\input.html | html-to-text.cmd [commands...] [keys and values...] > .\output.txt
  ```

`.ps1` wrapper installed by npm might not work with `stdin`, so use `.cmd` instead.

### Available commands

| Command   | Alias | Argument       | Description
| --------- | ----- | -------------- | -----------
| `json`    | `-j`  | \<file_name>   | Merge given json file contents with the parsed options object. This way you can provide all or some options from a file rather than explicitly from CLI.
| `preset`  | `-p`  | \<preset_name> | Merge given preset into the parsed options object. Available presets listed below.
| `inspect` | `-i`  |                | Pretty print the parsed options object and exit. Useful as a dry run to check how options are parsed.
| `unparse` | `-u`  |                | Print the parsed options object back as args string and exit. Can be used to check what arguments produce the result equivalent to a given json file.
| `help`    | `-h`  |                | Print help message end exit.
| `version` | `-v`  |                | Print version number and exit.

Note: short aliases cannot be merged.

### Available presets

| Preset    | Description
| --------- | -----------
| `human`   | Some options more suitable for human reading in terminal (ensure line length of 80 characters, format tables visually)
| `machine` | Some options more suitable for machine processing (no line length limit, format tables and cells as blocks)

### Options syntax

Refer to `html-to-text help` output for brief syntax information.

Refer to [aspargvs](https://github.com/mxxii/aspargvs) readme for more detailed information.

Note: PowerShell requires to escape quotes and curly braces.

### Option examples

All options that are representable in JSON format (that is all except functions) can be specified via CLI arguments. Below are some examples.

| JSON                  | CLI
| --------------------- | ---
| `{ preserveNewlines: true }` | `--preserveNewlines`
| `{ wordwrap: 100 }`   | `--wordwrap=100`
| `{ wordwrap: false }` | `--!wordwrap`
| `{ baseElements: { orderBy: 'occurrence' } }` | `--baseElements.orderBy=occurrence`
| `{ selectors: [`<br/>`{ selector: 'img', format: 'skip' }`<br/>`] }` | `--selectors[] {} :selector=img :format=skip`
| `{ selectors: [`<br/>`{ selector: 'h1', options: { uppercase: false } },`<br/>`{ selector: 'h2', options: { uppercase: false } }`<br/>`] }`| `--selectors[] {} :selector=h1 :!options.uppercase {} :selector=h2 :!options.uppercase`
| `{ selectors: [`<br/>`{ selector: 'table', format: 'dataTable', options: { uppercaseHeaderCells: false } }`<br/>`] }` | `--selectors[] {} :selector=table :format=dataTable :options.uppercase-header-cells=false`
| `{ selectors: [`<br/>`{ selector: 'a', options: { linkBrackets: ['<', '>'] } }`<br/>`] }` | `--selectors[] {} :selector=a :options.linkBrackets=['<','>']`


## License

[MIT License](https://github.com/html-to-text/node-html-to-text/blob/master/LICENSE)
