import * as MarkdownIt from "markdown-it";
import * as Token from "markdown-it/lib/token";
import { markdownItFancyListPlugin, MarkdownItFancyListPluginOptions } from "../src/index";
import { assert } from "chai";
import { HtmlDiffer } from "@markedjs/html-differ";


const assertHTML = async (expectedHtml: string, markdown: string, pluginOptions?: MarkdownItFancyListPluginOptions) => {
	const markdownConverter = new MarkdownIt("default", {
		"typographer": true,
	});
	markdownConverter.use(markdownItFancyListPlugin, pluginOptions);
	const actualOutput = markdownConverter.render(markdown);

	const htmlDiffer = new HtmlDiffer();
	const isEqual = await htmlDiffer.isEqual(actualOutput, expectedHtml);
	assert.isTrue(isEqual, `Expected:\n${expectedHtml}\n\nActual:\n${actualOutput}`);
};

const assertTokens = (expectedTokens: Partial<Token>[], markdown: string, pluginOptions?: MarkdownItFancyListPluginOptions) => {
	const markdownConverter = new MarkdownIt("default", {
		"typographer": true,
	});
	markdownConverter.use(markdownItFancyListPlugin, pluginOptions);
	const actualTokens = markdownConverter.parse(markdown, {});

	assert.strictEqual(actualTokens.length, expectedTokens.length);
	expectedTokens.map((expectedToken, i) => {
		const keys = Object.keys(expectedToken);
		keys.map((key) => {
			assert.strictEqual(actualTokens[i][key], expectedToken[key], `Expected ${key} at token ${i}`);
		});
	});
};



describe("markdownFancyLists",  () => {
	it("does not alter ordinary ordered list syntax", async () => {
		const markdown = `
1. foo
2. bar
3) baz
`;
		const expectedHtml = `
<ol>
  <li>foo</li>
  <li>bar</li>
</ol>
<ol start="3">
  <li>baz</li>
</ol>
`;
		await assertHTML(expectedHtml, markdown);
	});

	it("supports lowercase alphabetical numbering", async () => {
		const markdown = `
a. foo
b. bar
c. baz
`;
		const expectedHtml = `
<ol type="a">
  <li>foo</li>
  <li>bar</li>
  <li>baz</li>
</ol>
`;
		await assertHTML(expectedHtml, markdown);
	});

	it("supports offsets for lowercase alphabetical numbering", async () => {
		const markdown = `
b. foo
c. bar
d. baz
`;
		const expectedHtml = `
<ol type="a" start="2">
  <li>foo</li>
  <li>bar</li>
  <li>baz</li>
</ol>
`;
		await assertHTML(expectedHtml, markdown);
	});

	it("supports uppercase alphabetical numbering", async () => {
		const markdown = `
A) foo
B) bar
C) baz
`;
		const expectedHtml = `
<ol type="A">
  <li>foo</li>
  <li>bar</li>
  <li>baz</li>
</ol>
`;
		await assertHTML(expectedHtml, markdown);
	});

	it("supports offsets for uppercase alphabetical numbering", async () => {
		const markdown = `
B) foo
C) bar
D) baz
`;
		const expectedHtml = `
<ol type="A" start="2">
  <li>foo</li>
  <li>bar</li>
  <li>baz</li>
</ol>
`;
		await assertHTML(expectedHtml, markdown);
	});

	it("test supports lowercase roman numbering", async () => {
		const markdown = `
i. foo
ii. bar
iii. baz
`;
		const expectedHtml = `
<ol type="i">
  <li>foo</li>
  <li>bar</li>
  <li>baz</li>
</ol>
`;
		await assertHTML(expectedHtml, markdown);
	});

	it("supports offsets for lowercase roman numbering", async () => {
		const markdown = `
iv. foo
v. bar
vi. baz
`;
		const expectedHtml = `
<ol type="i" start="4">
  <li>foo</li>
  <li>bar</li>
  <li>baz</li>
</ol>
`;
		await assertHTML(expectedHtml, markdown);
	});

	it("supports uppercase roman numbering", async () => {
		const markdown = `
I) foo
II) bar
III) baz
`;
		const expectedHtml = `
<ol type="I">
  <li>foo</li>
  <li>bar</li>
  <li>baz</li>
</ol>
`;
		await assertHTML(expectedHtml, markdown);
	});

	it("supports offsets for uppercase roman numbering", async () => {
		const markdown = `
XII. foo
XIII. bar
XIV. baz
`;
		const expectedHtml = `
<ol type="I" start="12">
  <li>foo</li>
  <li>bar</li>
  <li>baz</li>
</ol>
`;
		await assertHTML(expectedHtml, markdown);
	});

	it("ignores invalid roman numerals as list marker", async () => {
		const markdown = `
VV. foo
VVI. bar
VVII. baz
`;
		const expectedHtml = `
<p>VV. foo
VVI. bar
VVII. baz</p>
`;
		await assertHTML(expectedHtml, markdown);
	});

	it("supports hash as list marker for subsequent items", async () => {
		const markdown = `
1. foo
#. bar
#. baz
`;
		const expectedHtml = `
<ol>
  <li>foo</li>
  <li>bar</li>
  <li>baz</li>
</ol>
`;
		await assertHTML(expectedHtml, markdown);
	});

	it("supports hash as list marker for subsequent roman numeric marker", async () => {
		const markdown = `
i. foo
#. bar
#. baz
`;
		const expectedHtml = `
<ol type="i">
  <li>foo</li>
  <li>bar</li>
  <li>baz</li>
</ol>
`;
		await assertHTML(expectedHtml, markdown);
	});

	it("supports hash as list marker for subsequent alphanumeric marker", async () => {
		const markdown = `
a. foo
#. bar
#. baz
`;
		const expectedHtml = `
<ol type="a">
  <li>foo</li>
  <li>bar</li>
  <li>baz</li>
</ol>
`;
		await assertHTML(expectedHtml, markdown);
	});

	it("supports hash as list marker for initial item", async () => {
		const markdown = `
#. foo
#. bar
#. baz
`;
		const expectedHtml = `
<ol>
  <li>foo</li>
  <li>bar</li>
  <li>baz</li>
</ol>
`;
		await assertHTML(expectedHtml, markdown);
	});

	it("allows first numbers to interrupt paragraphs", async () => {
		const markdown = `
I need to buy
a. new shoes
b. a coat
c. a plane ticket

I also need to buy
i. new shoes
ii. a coat
iii. a plane ticket
`;
		const expectedHtml = `
<p>I need to buy</p>
<ol type="a">
  <li>new shoes</li>
  <li>a coat</li>
  <li>a plane ticket</li>
</ol>
<p>I also need to buy</p>
<ol type="i">
  <li>new shoes</li>
  <li>a coat</li>
  <li>a plane ticket</li>
</ol>
`;
		await assertHTML(expectedHtml, markdown);
	});

	it("does not allow subsequent numbers to interrupt paragraphs", async () => {
		const markdown = `
I need to buy
b. new shoes
c. a coat
d. a plane ticket

I also need to buy
ii. new shoes
iii. a coat
iv. a plane ticket
`;
		const expectedHtml = `
<p>I need to buy
b. new shoes
c. a coat
d. a plane ticket</p>
<p>I also need to buy
ii. new shoes
iii. a coat
iv. a plane ticket</p>
`;
		await assertHTML(expectedHtml, markdown);
	});

	it("supports nested lists", async () => {
		const markdown = `
 9)  Ninth
10)  Tenth
11)  Eleventh
       i. subone
      ii. subtwo
     iii. subthree
`;
		const expectedHtml = `
<ol start="9">
  <li>Ninth</li>
  <li>Tenth</li>
  <li>Eleventh
<ol type="i">
  <li>subone</li>
  <li>subtwo</li>
  <li>subthree</li>
</ol>
</li>
</ol>
`;
		await assertHTML(expectedHtml, markdown);
	});

	it("supports nested lists with start", async () => {
		const markdown = `
c. charlie
#. delta
   iv) subfour
   #) subfive
   #) subsix
#. echo
`;
		const expectedHtml = `
<ol type="a" start="3">
  <li>charlie</li>
  <li>delta
    <ol type="i" start="4">
      <li>subfour</li>
      <li>subfive</li>
      <li>subsix</li>
    </ol>
  </li>
  <li>echo</li>
</ol>
`;
		await assertHTML(expectedHtml, markdown);
	});

	it("supports nested lists with extra newline", async () => {
		const markdown = `
c. charlie
#. delta

   sigma
   iv) subfour
   #) subfive
   #) subsix
#. echo
`;
		const expectedHtml = `
<ol type="a" start="3">
  <li><p>charlie</p></li>
  <li><p>delta</p>
    <p>sigma</p>
    <ol type="i" start="4">
      <li>subfour</li>
      <li>subfive</li>
      <li>subsix</li>
    </ol>
  </li>
  <li><p>echo</p></li>
</ol>
`;
		await assertHTML(expectedHtml, markdown);
	});

	it("starts a new list when a different type of numbering is used", async () => {
		const markdown = `
1) First
A) First again
i) Another first
ii) Second
`;
		const expectedHtml = `
<ol>
  <li>First</li>
</ol>
<ol type="A">
  <li>First again</li>
</ol>
<ol type="i">
  <li>Another first</li>
  <li>Second</li>
</ol>
`;
		await assertHTML(expectedHtml, markdown);
	});

	it("starts a new list when a sequence of letters is not a valid roman numeral", async () => {
		const markdown = `
I) First
A) First again
`;
		const expectedHtml = `
<ol type="I">
  <li>First</li>
</ol>
<ol type="A">
  <li>First again</li>
</ol>
`;
		await assertHTML(expectedHtml, markdown);
	});

	it("marker is considered to be alphabetical when part of an alphabetical list", async () => {
		const markdown = `
A) First
I) Second
II) First of new list

a) First
i) Second
ii) First of new list
`;
		const expectedHtml = `
<ol type="A">
  <li>First</li>
  <li>Second</li>
</ol>
<ol type="I" start="2">
  <li>First of new list</li>
</ol>
<ol type="a">
  <li>First</li>
  <li>Second</li>
</ol>
<ol type="i" start="2">
  <li>First of new list</li>
</ol>
`;
		await assertHTML(expectedHtml, markdown);
	});

	it("single letter roman numerals other than I are considered alphabetical without context", async () => {
		const markdown = `
v. foo

X) foo

l. foo

C) foo

d. foo

M) foo
`;
		const expectedHtml = `
<ol type="a" start="22">
  <li>foo</li>
</ol>
<ol type="A"  start="24">
  <li>foo</li>
</ol>
<ol type="a"  start="12">
  <li>foo</li>
</ol>
<ol type="A"  start="3">
  <li>foo</li>
</ol>
<ol type="a" start="4">
  <li>foo</li>
</ol>
<ol type="A" start="13">
  <li>foo</li>
</ol>
`;
		await assertHTML(expectedHtml, markdown);
	});

	it("requires two spaces after a capital letter and a period", async () => {
		const markdown = `
B. Russell was an English philosopher.

I. Elba is an English actor.

I.  foo
II. bar

B.  foo
C.  bar
`;
		const expectedHtml = `
<p>B. Russell was an English philosopher.</p>
<p>I. Elba is an English actor.</p>
<ol type="I">
  <li>foo</li>
  <li>bar</li>
</ol>
<ol start="2" type="A">
  <li>foo</li>
  <li>bar</li>
</ol>
`;
		await assertHTML(expectedHtml, markdown);
	});

	describe("support for ordinal indicator", () => {
		it("does not support an ordinal indicator by default", async () => {
			const markdown = `
1º. foo
2º. bar
3º. baz
`;
			const expectedHtml = `
<p>1&#xBA;. foo
2&#xBA;. bar
3&#xBA;. baz</p>
`;
			await assertHTML(expectedHtml, markdown);
		});

		it("supports an ordinal indicator if enabled in options", async () => {
			const markdown = `
1º. foo
2º. bar
3º. baz
`;
			const expectedHtml = `
<ol class="ordinal">
  <li>foo</li>
  <li>bar</li>
  <li>baz</li>
</ol>
`;
			await assertHTML(expectedHtml, markdown, {
				allowOrdinal: true,
			});
		});

		it("allows ordinal indicators with Roman numerals", async () => {
			const markdown = `
IIº. foo
IIIº. bar
IVº. baz
`;
			const expectedHtml = `
<ol type="I" start="2" class="ordinal">
  <li>foo</li>
  <li>bar</li>
  <li>baz</li>
</ol>
`;
			await assertHTML(expectedHtml, markdown, {
				allowOrdinal: true,
			});
		});

		it("starts a new list when ordinal indicators are introduced or omitted", async () => {
			const markdown = `
1) First
1º) First again
2º) Second
1) Another first
`;
			const expectedHtml = `
<ol>
  <li>First</li>
</ol>
<ol class="ordinal">
  <li>First again</li>
  <li>Second</li>
</ol>
<ol>
  <li>Another first</li>
</ol>
`;
			await assertHTML(expectedHtml, markdown, {
				allowOrdinal: true,
			});
		});

		it("tolerates characters commonly mistaken for ordinal indicators", async () => {
			const markdown = `
1°. degree sign
2˚. ring above
3ᵒ. modifier letter small o
4º. ordinal indicator
`;
			const expectedHtml = `
<ol class="ordinal">
  <li>degree sign</li>
  <li>ring above</li>
  <li>modifier letter small o</li>
  <li>ordinal indicator</li>
</ol>
`;
			await assertHTML(expectedHtml, markdown, {
				allowOrdinal: true,
			});
		});

		it("produces correct markup character regression for issue#4", () => {
			const markdown = `
### title

a. first item
#. second item

1) first item
2) second item

1°. degree sign
2˚. ring above
3ᵒ. modifier letter small o
4º. ordinal indicator
`;
			assertTokens([
				{ type: "heading_open" },
				{ type: "inline", content: "title" },
				{ type: "heading_close" },
				{ type: "ordered_list_open" },
				{ type: "list_item_open", markup: "." },
				{ type: "paragraph_open" },
				{ type: "inline", content: "first item" },
				{ type: "paragraph_close" },
				{ type: "list_item_close" },
				{ type: "list_item_open", markup: "." },
				{ type: "paragraph_open" },
				{ type: "inline", content: "second item" },
				{ type: "paragraph_close" },
				{ type: "list_item_close" },
				{ type: "ordered_list_close" },
				{ type: "ordered_list_open" },
				{ type: "list_item_open", markup: ")" },
				{ type: "paragraph_open" },
				{ type: "inline", content: "first item" },
				{ type: "paragraph_close" },
				{ type: "list_item_close" },
				{ type: "list_item_open", markup: ")" },
				{ type: "paragraph_open" },
				{ type: "inline", content: "second item" },
				{ type: "paragraph_close" },
				{ type: "list_item_close" },
				{ type: "ordered_list_close" },
				{ type: "ordered_list_open" },
				{ type: "list_item_open", markup: "." },
				{ type: "paragraph_open" },
				{ type: "inline", content: "degree sign" },
				{ type: "paragraph_close" },
				{ type: "list_item_close" },
				{ type: "list_item_open", markup: "." },
				{ type: "paragraph_open" },
				{ type: "inline", content: "ring above" },
				{ type: "paragraph_close" },
				{ type: "list_item_close" },
				{ type: "list_item_open", markup: "." },
				{ type: "paragraph_open" },
				{ type: "inline", content: "modifier letter small o" },
				{ type: "paragraph_close" },
				{ type: "list_item_close" },
				{ type: "list_item_open", markup: "." },
				{ type: "paragraph_open" },
				{ type: "inline", content: "ordinal indicator" },
				{ type: "paragraph_close" },
				{ type: "list_item_close" },
				{ type: "ordered_list_close" }
			], markdown, {
				allowOrdinal: true,
			});
		});
	});

	describe("support for multi-letter list markers", () => {
		it("does not support multi-letter list markers by default", async () => {
			const markdown = `
AA) foo
AB) bar
AC) baz
`;
			const expectedHtml = `
<p>AA) foo
AB) bar
AC) baz</p>
`;
			await assertHTML(expectedHtml, markdown);
		});

		it("supports multi-letter list markers if enabled in options", async () => {
			const markdown = `
AA) foo
AB) bar
AC) baz
`;
			const expectedHtml = `
<ol type="A" start="27">
  <li>foo</li>
  <li>bar</li>
  <li>baz</li>
</ol>
`;
			await assertHTML(expectedHtml, markdown, {
				allowMultiLetter: true,
			});
		});

		it("supports continuing a single-letter list with multi-letter list markers", async () => {
			const markdown = `
Z) foo
AA) bar
AB) baz
`;
			const expectedHtml = `
<ol type="A" start="26">
  <li>foo</li>
  <li>bar</li>
  <li>baz</li>
</ol>
`;
			await assertHTML(expectedHtml, markdown, {
				allowMultiLetter: true,
			});
		});

		it("supports lowercase multi-letter list markers", async () => {
			const markdown = `
aa) foo
ab) bar
ac) baz
`;
			const expectedHtml = `
<ol type="a" start="27">
  <li>foo</li>
  <li>bar</li>
  <li>baz</li>
</ol>
`;
			await assertHTML(expectedHtml, markdown, {
				allowMultiLetter: true,
			});
		});

		it("allows at most 3 characters for multi-letter list markers", async () => {
			const markdown = `
AAAA) foo
AAAB) bar
AAAC) baz
`;
			const expectedHtml = `
<p>AAAA) foo
AAAB) bar
AAAC) baz</p>
`;
			await assertHTML(expectedHtml, markdown, {
				allowMultiLetter: true,
			});
		});

		it("does not support mixing uppercase and lowercase letters", async () => {
			const markdown = `
Aa) foo
Ab) bar
Ac) baz
`;
			const expectedHtml = `
<p>Aa) foo
Ab) bar
Ac) baz</p>
`;
			await assertHTML(expectedHtml, markdown, {
				allowMultiLetter: true,
			});
		});
	});
});
