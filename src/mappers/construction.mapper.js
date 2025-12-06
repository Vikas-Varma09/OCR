function normalize(text) {
	return String(text || "").replace(/\r/g, "").replace(/\t/g, " ").replace(/[ \u00A0]+/g, " ");
}

function windowAfter(text, labelRegex, span = 240) {
	const idx = text.search(labelRegex);
	if (idx === -1) return null;
	const after = text.slice(idx);
	const lineEnd = after.indexOf("\n");
	const end = lineEnd !== -1 ? Math.min(lineEnd, span) : Math.min(after.length, span);
	return after.slice(0, end);
}

function yesNoMarked(text, labelRegex) {
	const seg = windowAfter(text, labelRegex, 200);
	if (!seg) return null;
	if (/\bNo\b\s+X\b/i.test(seg)) return false;
	if (/\bYes\b\s+X\b/i.test(seg)) return true;
	return null;
}

function yesNoMarkedFlexible(text, labelRegex, span = 260) {
	const idx = text.search(labelRegex);
	if (idx === -1) return null;
	const seg = text.slice(idx, idx + span);
	if (/\bNo\b\s+X\b/i.test(seg)) return false;
	if (/\bYes\b\s+X\b/i.test(seg)) return true;
	return null;
}

function pickAfterLabel(text, labelRegex) {
	const seg = windowAfter(text, labelRegex, 200);
	if (!seg) return null;
	const m = seg.replace(labelRegex, "").match(/([^\n]+)/i);
	if (!m) return null;
	return String(m[1] || "").trim();
}

function pickIntAfterLabel(text, labelRegex) {
	const seg = windowAfter(text, labelRegex, 120);
	if (!seg) return null;
	const m = seg.match(/-?\d+/);
	return m ? parseInt(m[0], 10) : null;
}

function extractNonStandardConstructionType(text) {
	// Anchor on the label
	const start = text.search(/If\s+non-standard\s+construction\s+specify\s+name\s+of\s+system\s+or\s+type:/i);
	if (start === -1) return null;
	const slice = text.slice(start, start + 1200);
	const lines = slice.split("\n").map(s => s.trim());
	// Look over the next few lines to find content after an 'X' marker
	for (let i = 0; i < Math.min(lines.length, 8); i++) {
		const ln = lines[i];
		// Skip the label line itself
		if (/If\s+non-standard\s+construction\s+specify\s+name\s+of\s+system\s+or\s+type:$/i.test(ln)) {
			continue;
		}
		// Prefer text after an 'X' marker
		const mAfterX = ln.match(/\bX\b\s+([A-Za-z][^\n:]+)/i);
		if (mAfterX) {
			const val = mAfterX[1].trim();
			if (val) return val;
		}
	}
	// Fallback: pick a line that contains a likely free text (e.g., "Non- standard text"), but avoid picking the label itself
	for (let i = 1; i < Math.min(lines.length, 8); i++) {
		const ln = lines[i];
		if (/system\s+or\s+type:$/i.test(ln)) continue; // skip label again
		if (/^\s*If\s+Yes\b/i.test(ln)) continue;
		if (/[A-Za-z]/.test(ln) && !/:$/.test(ln)) {
			// Avoid obvious prompts
			if (!/^(Yes|No)\b/i.test(ln)) {
				return ln.trim();
			}
		}
	}
	return null;
}

function mapConstruction(rawText) {
	const text = normalize(rawText);

	const isStandardConstruction = yesNoMarked(text, /Is\s+the\s+property\s+of\s+standard\s+construction\s*:/i);
	const nonStandardConstructionType = extractNonStandardConstructionType(text);
	const mainWalls = pickAfterLabel(text, /Main\s+Walls\s*:\s*/i);
	const mainRoof = pickAfterLabel(text, /Main\s+Roof\s*:\s*/i);
	const garageConstruction = pickAfterLabel(text, /\bGarage\s*:\s*/i);
	const outbuildingsConstruction = pickAfterLabel(text, /\bOutbuildings\s*:\s*/i);
	const isHasAlterationsOrExtensions = yesNoMarked(text, /Are\s+there\s+any\s+alterations\s+or\s+extensions\?/i);
	// Prefer 'or Planning Consents?' line first (often holds the Yes/No), then fall back
	let isAlterationsRequireConsents = yesNoMarked(text, /or\s+Planning\s+Consents\?/i);
	if (isAlterationsRequireConsents === null) {
		isAlterationsRequireConsents = yesNoMarked(text, /Did\s+the\s+alterations\s+require\s+Building\s+Regs/i);
	}
	if (isAlterationsRequireConsents === null) {
		isAlterationsRequireConsents = yesNoMarkedFlexible(text, /Did\s+the\s+alterations\s+require\s+Building\s+Regs/i);
	}
	const alterationsAge = pickIntAfterLabel(text, /Age\s+of\s+any\s+alterations\s+or\s+extensions\?/i);

	return {
		isStandardConstruction,
		nonStandardConstructionType,
		mainWalls,
		mainRoof,
		garageConstruction,
		outbuildingsConstruction,
		isHasAlterationsOrExtensions,
		isAlterationsRequireConsents,
		alterationsAge
	};
}

module.exports = { mapConstruction };


