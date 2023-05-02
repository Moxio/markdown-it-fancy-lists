import { isSpace } from "markdown-it/lib/common/utils";
import * as StateBlock from "markdown-it/lib/rules_block/state_block";
import * as Token from "markdown-it/lib/token";
import { toArabic } from "roman-numerals";
import * as MarkdownIt from "markdown-it";

// Search `[-+*][\n ]`, returns next pos after marker on success
// or -1 on fail.
function parseUnorderedListMarker(state: StateBlock, startLine: number): { type: "*" | "-" | "+"; posAfterMarker: number } | null {

	let pos = state.bMarks[startLine] + state.tShift[startLine];
	const max = state.eMarks[startLine];

	const marker = state.src.charCodeAt(pos);
	pos += 1;

	// Check bullet
	if (marker !== 0x2A/* * */ &&
		marker !== 0x2D/* - */ &&
		marker !== 0x2B/* + */) {
		return null;
	}

	if (pos < max) {
		const ch = state.src.charCodeAt(pos);

		if (!isSpace(ch)) {
			// " -test " - is not a list item
			return null;
		}
	}

	return {
		type: state.src.charAt(pos - 1) as "*" | "-" | "+",
		posAfterMarker: pos,
	};
}

// Search `^(\d{1,9}|[a-z]{1,3}|[A-Z]{1,3}|[ivxlcdm]+|[IVXLCDM]+|#)([\u00BA\u00B0\u02DA\u1D52]?)([.)])`, returns next pos after marker on success
// or -1 on fail.
function parseOrderedListMarker(state: StateBlock, startLine: number): { bulletChar: string; hasOrdinalIndicator: boolean, delimiter: ")" | "."; posAfterMarker: number } | null {
	const start = state.bMarks[startLine] + state.tShift[startLine];
	const max = state.eMarks[startLine];

	// List marker should have at least 2 chars (digit + dot)
	if (start + 1 >= max) {
		return null;
	}

	const stringContainingNumberAndMarker = state.src.substring(start, Math.min(max, start + 10));

	const match = /^(\d{1,9}|[a-z]{1,3}|[A-Z]{1,3}|[ivxlcdm]+|[IVXLCDM]+|#)([\u00BA\u00B0\u02DA\u1D52]?)([.)])/.exec(stringContainingNumberAndMarker);
	if (match === null) {
		return null;
	}

	const markerPos = start + match[1].length;
	const markerChar = state.src.charAt(markerPos);

	let finalPos = start + match[0].length;
	const finalChar = state.src.charCodeAt(finalPos);

	//  requires once space after marker or eol
	if (isSpace(finalChar) === false && finalPos !== max) {
		return null;
	}

	// requires two spaces after a capital letter and a period
	if (isCharCodeUppercaseAlpha(match[1].charCodeAt(0)) && match[1].length === 1 && markerChar === ".") {
		finalPos += 1; // consume another space
		const finalChar = state.src.charCodeAt(finalPos);
		if (isSpace(finalChar) === false) {
			return null;
		}
	}

	return {
		bulletChar: match[1],
		hasOrdinalIndicator: match[2] !== "",
		delimiter: match[3] as ")" | ".",
		posAfterMarker: finalPos,
	};
}

function markTightParagraphs(state: StateBlock, idx: number) {
	let i: number, l;
	const level = state.level + 2;

	for (i = idx + 2, l = state.tokens.length - 2; i < l; i += 1) {
		if (state.tokens[i].level === level && state.tokens[i].type === "paragraph_open") {
			state.tokens[i + 2].hidden = true;
			state.tokens[i].hidden = true;
			i += 2;
		}
	}
}

function isCharCodeDigit(charChode: number) {
	return charChode >= 0x30 /* 0 */ && charChode <= 0x39 /* 9 */;
}

function isCharCodeLowercaseAlpha(charChode: number) {
	return charChode >= 0x61 /* a */ && charChode <= 0x7A /* z */;
}

function isCharCodeUppercaseAlpha(charChode: number) {
	return charChode >= 0x41 /* A */ && charChode <= 0x5A /* Z */;
}

const analyzeRoman = (romanNumeralString: string) => {
	let parsedRomanNumber: number = 1;
	let isValidRoman = true;
	try {
		parsedRomanNumber = toArabic(romanNumeralString);
	} catch (e) {
		isValidRoman = false;
	}
	return {
		parsedRomanNumber,
		isValidRoman,
	};
};

const convertAlphaMarkerToOrdinalNumber = (alphaMarker: string): number => {
	const lastLetterValue = alphaMarker.toLowerCase().charCodeAt(alphaMarker.length - 1) - "a".charCodeAt(0) + 1;
	if (alphaMarker.length > 1) {
		const prefixValue = convertAlphaMarkerToOrdinalNumber(alphaMarker.substring(0, alphaMarker.length - 1));
		return prefixValue * 26 + lastLetterValue;
	} else {
		return lastLetterValue;
	}
};

function analyseMarker(state: StateBlock, startLine: number, endLine: number, previousMarker: Marker | null, options: MarkdownItFancyListPluginOptions): Marker | null {
	const orderedListMarker = parseOrderedListMarker(state, startLine);
	if (orderedListMarker !== null) {
		const bulletChar = orderedListMarker.bulletChar;
		const charCode = orderedListMarker.bulletChar.charCodeAt(0);
		const delimiter = orderedListMarker.delimiter;

		if (isCharCodeDigit(charCode)) {
			return {
				isOrdered: true,
				isRoman: false,
				isAlpha: false,
				type: "0",
				start: Number.parseInt(bulletChar),
				...orderedListMarker,
			};
		} else if (isCharCodeLowercaseAlpha(charCode)) {
			const isValidAlpha = bulletChar.length === 1 || options.allowMultiLetter === true;
			const preferRoman = ((previousMarker !== null && previousMarker.isRoman === true) || ((previousMarker === null || previousMarker.isAlpha === false) && (bulletChar === "i" || bulletChar.length > 1)));
			const { parsedRomanNumber, isValidRoman } = analyzeRoman(bulletChar);

			if (isValidRoman === true && (isValidAlpha === false || preferRoman === true)) {
				return {
					isOrdered: true,
					isRoman: true,
					isAlpha: false,
					type: "i",
					start: parsedRomanNumber,
					...orderedListMarker,
				};
			} else if (isValidAlpha === true) {
				return {
					isOrdered: true,
					isRoman: false,
					isAlpha: true,
					type: "a",
					start: convertAlphaMarkerToOrdinalNumber(bulletChar),
					...orderedListMarker,
				};
			}
			return null;
		} else if (isCharCodeUppercaseAlpha(charCode)) {
			const isValidAlpha = bulletChar.length === 1 || options.allowMultiLetter === true;
			const preferRoman = ((previousMarker !== null && previousMarker.isRoman === true) || ((previousMarker === null || previousMarker.isAlpha === false) && (bulletChar === "I" || bulletChar.length > 1)));
			const { parsedRomanNumber, isValidRoman } = analyzeRoman(bulletChar);

			if (isValidRoman === true && (isValidAlpha === false || preferRoman === true)) {
				return {
					isOrdered: true,
					isRoman: true,
					isAlpha: false,
					type: "I",
					start: parsedRomanNumber,
					...orderedListMarker,
				};
			} else if (isValidAlpha === true) {
				return {
					isOrdered: true,
					isRoman: false,
					isAlpha: true,
					type: "A",
					start: convertAlphaMarkerToOrdinalNumber(bulletChar),
					...orderedListMarker,
				};
			}
			return null;
		} else {
			return {
				isOrdered: true,
				isRoman: false,
				isAlpha: false,
				type: "#",
				start: 1,
				...orderedListMarker,
			};
		}
	}
	const unorderedListMarker = parseUnorderedListMarker(state, startLine);
	if (unorderedListMarker !== null) {
		const start = state.bMarks[startLine] + state.tShift[startLine];
		return {
			isOrdered: false,
			isRoman: false,
			isAlpha: false,
			bulletChar: "",
			hasOrdinalIndicator: false,
			delimiter: ")",
			start: 1,
			...unorderedListMarker,
		};
	} else {
		return null;
	}
}

type MarkerType = "0" | "a" | "A" | "i" | "I" | "#" | "*" | "-" | "+";
type Marker = {
	isOrdered: boolean;
	isRoman: boolean;
	isAlpha: boolean;
	type: MarkerType;
	bulletChar: string;
	hasOrdinalIndicator: boolean;
	delimiter: ")" | ".";
	start: number;
	posAfterMarker: number;
}

function areMarkersCompatible(previousMarker: Marker, currentMarker: Marker) {
	return previousMarker.isOrdered === currentMarker.isOrdered
		&& (previousMarker.type === currentMarker.type || currentMarker.type === "#")
		&& previousMarker.delimiter === currentMarker.delimiter
		&& previousMarker.hasOrdinalIndicator === currentMarker.hasOrdinalIndicator;
}

const createFancyList = (options: MarkdownItFancyListPluginOptions) => {
	return (state: StateBlock, startLine: number, endLine: number, silent: boolean): boolean => {

		// if it's indented more than 3 spaces, it should be a code block
		if (state.sCount[startLine] - state.blkIndent >= 4) { return false; }

		// Special case:
		//  - item 1
		//   - item 2
		//    - item 3
		//     - item 4
		//      - this one is a paragraph continuation
		if (state.listIndent >= 0 &&
			state.sCount[startLine] - state.listIndent >= 4 &&
			state.sCount[startLine] < state.blkIndent) {
			return false;
		}

		let isTerminatingParagraph = false;
		// limit conditions when list can interrupt
		// a paragraph (validation mode only)
		if (silent && state.parentType === "paragraph") {
			// Next list item should still terminate previous list item;
			//
			// This code can fail if plugins use blkIndent as well as lists,
			// but I hope the spec gets fixed long before that happens.
			//
			if (state.tShift[startLine] >= state.blkIndent) {
				isTerminatingParagraph = true;
			}
		}

		let marker: Marker | null = analyseMarker(state, startLine, endLine, null, options);
		if (marker === null) {
			return false;
		}
		if (marker.hasOrdinalIndicator === true && options.allowOrdinal !== true) {
			return false;
		}

		// do not allow subsequent numbers to interrupt paragraphs in non-nested lists
		const isNestedList = state.listIndent !== -1;
		if (isTerminatingParagraph && marker.start !== 1 && isNestedList === false) {
			return false;
		}

		// If we're starting a new unordered list right after
		// a paragraph, first line should not be empty.
		if (isTerminatingParagraph) {
			if (state.skipSpaces(marker.posAfterMarker) >= state.eMarks[startLine]) return false;
		}

		// We should terminate list on style change. Remember first one to compare.
		const markerCharCode = state.src.charCodeAt(marker.posAfterMarker - 1);

		// For validation mode we can terminate immediately
		if (silent) { return true; }

		// Start list
		const listTokIdx = state.tokens.length;

		let token: Token;
		if (marker.isOrdered === true) {
			token = state.push("ordered_list_open", "ol", 1);
			const attrs: [ string, string ][] = [];
			if (marker.type !== "0" && marker.type !== "#") {
				attrs.push([ "type", marker.type ]);
			}
			if (marker.start !== 1) {
				attrs.push([ "start", marker.start.toString(10) ]);
			}
			if (marker.hasOrdinalIndicator === true) {
				attrs.push([ "class", "ordinal" ]);
			}
			token.attrs = attrs;

		} else {
			token = state.push("bullet_list_open", "ul", 1);
		}

		const listLines: [ number, number ] = [ startLine, 0 ];
		token.map = listLines;
		token.markup = String.fromCharCode(markerCharCode);

		//
		// Iterate list items
		//

		let nextLine = startLine;
		let prevEmptyEnd = false;
		const terminatorRules = state.md.block.ruler.getRules("list");

		const oldParentType = state.parentType;
		state.parentType = "list";

		let tight = true;
		while (nextLine < endLine) {
			const nextMarker = analyseMarker(state, nextLine, endLine, marker, options);
			if (nextMarker === null || areMarkersCompatible(marker, nextMarker) === false) {
				break;
			}
			let pos: number = nextMarker.posAfterMarker;
			const max = state.eMarks[nextLine];

			const initial = state.sCount[nextLine] + pos - (state.bMarks[startLine] + state.tShift[startLine]);
			let offset = initial;

			while (pos < max) {
				const ch = state.src.charCodeAt(pos);

				if (ch === 0x09) {
					offset += 4 - (offset + state.bsCount[nextLine]) % 4;
				} else if (ch === 0x20) {
					offset += 1;
				} else {
					break;
				}

				pos += 1;
			}

			let contentStart = pos;

			let indentAfterMarker: number;
			if (contentStart >= max) {
				// trimming space in "-    \n  3" case, indent is 1 here
				indentAfterMarker = 1;
			} else {
				indentAfterMarker = offset - initial;
			}

			// If we have more than 4 spaces, the indent is 1
			// (the rest is just indented code block)
			if (indentAfterMarker > 4) { indentAfterMarker = 1; }

			// "  -  test"
			//  ^^^^^ - calculating total length of this thing
			const indent = initial + indentAfterMarker;

			// Run subparser & write tokens
			token = state.push("list_item_open", "li", 1);
			token.markup = String.fromCharCode(markerCharCode);
			const itemLines = [ startLine, 0 ] as [ number, number ];
			token.map = itemLines;

			// change current state, then restore it after parser subcall
			const oldTight = state.tight;
			const oldTShift = state.tShift[startLine];
			const oldSCount = state.sCount[startLine];

			//  - example list
			// ^ listIndent position will be here
			//   ^ blkIndent position will be here
			//
			const oldListIndent = state.listIndent;
			state.listIndent = state.blkIndent;
			state.blkIndent = indent;

			state.tight = true;
			state.tShift[startLine] = contentStart - state.bMarks[startLine];
			state.sCount[startLine] = offset;

			if (contentStart >= max && state.isEmpty(startLine + 1)) {
				// workaround for this case
				// (list item is empty, list terminates before "foo"):
				// ~~~~~~~~
				//   -
				//
				//     foo
				// ~~~~~~~~
				state.line = Math.min(state.line + 2, endLine);
			} else {
				state.md.block.tokenize(state, startLine, endLine);
			}

			// If any of list item is tight, mark list as tight
			if (!state.tight || prevEmptyEnd) {
				tight = false;
			}
			// Item become loose if finish with empty line,
			// but we should filter last element, because it means list finish
			prevEmptyEnd = (state.line - startLine) > 1 && state.isEmpty(state.line - 1);

			state.blkIndent = state.listIndent;
			state.listIndent = oldListIndent;
			state.tShift[startLine] = oldTShift;
			state.sCount[startLine] = oldSCount;
			state.tight = oldTight;

			token        = state.push("list_item_close", "li", -1);
			token.markup = String.fromCharCode(markerCharCode);

			nextLine = startLine = state.line;
			itemLines[1] = nextLine;
			contentStart = state.bMarks[startLine];

			if (nextLine >= endLine) { break; }

			//
			// Try to check if list is terminated or continued.
			//
			if (state.sCount[nextLine] < state.blkIndent) { break; }

			// if it's indented more than 3 spaces, it should be a code block
			if (state.sCount[startLine] - state.blkIndent >= 4) { break; }

			// fail if terminating block found
			let terminate = false;
			for (let i = 0, l = terminatorRules.length; i < l; i += 1) {
				if (terminatorRules[i](state, nextLine, endLine, true)) {
					terminate = true;
					break;
				}
			}
			if (terminate) { break; }

			marker = nextMarker;
		}

		// Finalize list
		if (marker.isOrdered) {
			token = state.push("ordered_list_close", "ol", -1);
		} else {
			token = state.push("bullet_list_close", "ul", -1);
		}
		token.markup = String.fromCharCode(markerCharCode);

		listLines[1] = nextLine;
		state.line = nextLine;

		state.parentType = oldParentType;

		// mark paragraphs tight if needed
		if (tight) {
			markTightParagraphs(state, listTokIdx);
		}

		return true;
	};
}

export type MarkdownItFancyListPluginOptions = {
	allowOrdinal?: boolean;
	allowMultiLetter?: boolean;
};

export const markdownItFancyListPlugin = (markdownIt: MarkdownIt, options?: MarkdownItFancyListPluginOptions): void => {
	markdownIt.block.ruler.at("list", createFancyList(options ?? {}), { alt: [ "paragraph", "reference", "blockquote" ] });
};
