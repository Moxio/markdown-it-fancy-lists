import * as MarkdownIt from "markdown-it";
import { markdownItFancyListPlugin, MarkdownItFancyListPluginOptions } from "../src/index";
import { assert } from "chai";
import { HtmlDiffer } from "@markedjs/html-differ";


const assertMarkdownIsConvertedTo = async (expectedHtml: string, markdown: string, pluginOptions?: MarkdownItFancyListPluginOptions) => {
	const markdownConverter = new MarkdownIt("default", {
		"typographer": true,
	});
	markdownConverter.use(markdownItFancyListPlugin, pluginOptions);
	const actualOutput = markdownConverter.render(markdown);

	const htmlDiffer = new HtmlDiffer();
	const isEqual = await htmlDiffer.isEqual(actualOutput, expectedHtml);
	assert.isTrue(isEqual, `Expected:\n${expectedHtml}\n\nActual:\n${actualOutput}`);
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
		await assertMarkdownIsConvertedTo(expectedHtml, markdown);
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
		await assertMarkdownIsConvertedTo(expectedHtml, markdown);
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
		await assertMarkdownIsConvertedTo(expectedHtml, markdown);
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
		await assertMarkdownIsConvertedTo(expectedHtml, markdown);
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
		await assertMarkdownIsConvertedTo(expectedHtml, markdown);
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
		await assertMarkdownIsConvertedTo(expectedHtml, markdown);
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
		await assertMarkdownIsConvertedTo(expectedHtml, markdown);
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
		await assertMarkdownIsConvertedTo(expectedHtml, markdown);
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
		await assertMarkdownIsConvertedTo(expectedHtml, markdown);
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
		await assertMarkdownIsConvertedTo(expectedHtml, markdown);
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
		await assertMarkdownIsConvertedTo(expectedHtml, markdown);
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
		await assertMarkdownIsConvertedTo(expectedHtml, markdown);
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
		await assertMarkdownIsConvertedTo(expectedHtml, markdown);
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
		await assertMarkdownIsConvertedTo(expectedHtml, markdown);
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
		await assertMarkdownIsConvertedTo(expectedHtml, markdown);
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
		await assertMarkdownIsConvertedTo(expectedHtml, markdown);
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
		await assertMarkdownIsConvertedTo(expectedHtml, markdown);
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
		await assertMarkdownIsConvertedTo(expectedHtml, markdown);
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
		await assertMarkdownIsConvertedTo(expectedHtml, markdown);
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
		await assertMarkdownIsConvertedTo(expectedHtml, markdown);
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
		await assertMarkdownIsConvertedTo(expectedHtml, markdown);
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
		await assertMarkdownIsConvertedTo(expectedHtml, markdown);
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
			await assertMarkdownIsConvertedTo(expectedHtml, markdown);
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
			await assertMarkdownIsConvertedTo(expectedHtml, markdown, {
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
			await assertMarkdownIsConvertedTo(expectedHtml, markdown, {
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
			await assertMarkdownIsConvertedTo(expectedHtml, markdown, {
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
			await assertMarkdownIsConvertedTo(expectedHtml, markdown, {
				allowOrdinal: true,
			});
		});
	});
});
