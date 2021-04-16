[![NPM version](https://img.shields.io/npm/v/markdown-it-fancy-lists.svg?style=flat)](https://www.npmjs.org/package/markdown-it-fancy-lists)

markdown-it-fancy-lists
=======================

Plugin for the [markdown-it](https://github.com/markdown-it/markdown-it)
markdown parser.

Uses unofficial markdown syntax based on the syntax supported by
[Pandoc](https://pandoc.org/MANUAL.html#extension-fancy_lists).
See the section [Syntax](#syntax) below for details.

Installation
------
This library can be installed from the NPM package registry. Using NPM:
```
npm install markdown-it-fancy-lists
```
or Yarn
```
yarn add markdown-it-fancy-lists
```

Usage
------
ES module:
```javascript
import * as MarkdownIt from "markdown-it";
import { markdownItFancyListPlugin } from "markdown-it-fancy-lists";

const parser = new MarkdownIt("default");
parser.use(markdownItFancyListPlugin);
parser.render(/* markdown string */);
```

CommonJS:
```javascript
const MarkdownIt = require('markdown-it');
const markdownItFancyListPlugin = require("markdown-it-fancy-lists").markdownItFancyListPlugin;

const parser = new MarkdownIt("default");
parser.use(markdownItFancyListPlugin);
parser.render(/* markdown string */);
```


Syntax
------
The supported markdown syntax is based on the one used by
[Pandoc](https://pandoc.org/MANUAL.html#extension-fancy_lists).

A simple example:
```markdown
i. foo
ii. bar
iii. baz
```
The will yield HTML output like:
```html
<ol type="i">
  <li>foo</li>
  <li>bar</li>
  <li>baz</li>
</ol>
```

A more complex example:
```markdown
c. charlie
#. delta
   iv) subfour
   #) subfive
   #) subsix
#. echo
```

A short description of the syntactical rules:

* Apart from numbers, also letters (uppercase or lowercase) and
  Roman numerals (uppercase or lowercase) can be used to number
  ordered list items. Like lists marked with numbers, they need to
  be followed by a single right-parenthesis or period.
* Changing list marker types (also between uppercase and lowercase,
  or the symbol after the 'number') starts a new list.
* The numeral of the first item determines the numbering of the list.
  If the first item is numbered "b", the next item will be numbered
  "c", even if it is marked "z" in the source. This corresponds to
  the normal `markdown-it` behavior for numeric lists, and
  essentially also implements [Pandoc's `startnum` extension](https://pandoc.org/MANUAL.html#extension-fancy_lists).
* If the first list item is numbered "I" or "i", the list is considered
  to be numbered using Roman numerals, starting at 1. If the list
  starts with another single letter that could be interpreted as a
  Roman numeral, the list is numbered using letters: a first item
  marked with "C." uses uppercase letters starting at 3, not Roman
  numerals starting a 100.
* In subsequent list items, such symbols can be used without any
  ambiguity: in "B.", "C.", "D." the "C" is the letter "C"; in
  "IC.", "C.", "CI." the "C" is a Roman 100.
* A "#" may be used in place of any numeral to continue a list. If
  the first item in a list is marked with "#", that list is numbered
  "1", "2", "3", etc.
* A list marker consisting of a single uppercase letter followed by
  a period (including Roman numerals like "I." or "V.") needs to be
  followed by at least two spaces ([rationale](https://pandoc.org/MANUAL.html#fn1)).

All of the above are entirely compatible with how Pandoc works. There
are two small differences with Pandoc's syntax:

* This plugin does not support list numbers enclosed in parentheses,
  as the Commonmark spec does not support these either for lists
  numbered with Arabic numerals.
* Pandoc does not allow any list to interrupt a paragraph. In the
  spirit of the Commonmark spec (which allows only lists starting
  with 1 to interrupt a paragraph), this plugins allows lists that
  start with "A", "a", "I" or "i" (i.e. all 'first numerals') to
  interrupt a paragraph. The same holds for the "#" generic numbered
  list item marker.

Configuration
-------------
Options can be provided as a second argument when registering the plugin:
```javascript
parser.use(markdownItFancyListPlugin, {
    /* options */
});
```

Supported configuration options:

* `allowOrdinal` - Whether to allow an [ordinal indicator](https://en.wikipedia.org/wiki/Ordinal_indicator)
  (`º`) after the numeral, as occurs in e.g. legal documents (default: `false`). If this option is enabled,
  input like
  ```markdown
  1º. foo
  2º. bar
  3º. baz
  ```
  will be converted to
  ```html
  <ol class="ordinal">
    <li>foo</li>
    <li>bar</li>
    <li>baz</li>
  </ol>
  ```
  You will need [custom CSS](https://codepen.io/MoxioHD/pen/GRrjpRb) to re-insert the ordinal indicator
  into the displayed output based on the `ordinal` class.

  Because the ordinal indicator is commonly confused with other characters like the degree symbol, these
  characters are tolerated and considered equivalent to the ordinal indicator.

Versioning
----------
This project adheres to [Semantic Versioning](http://semver.org/).

Contributing
------------
Contributions to this project are more than welcome. When reporting an issue,
please include the input to reproduce the issue, along with the expected
output. When submitting a PR, please include tests with your changes.

License
-------
This project is released under the MIT license.
