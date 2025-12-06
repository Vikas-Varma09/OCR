function normalize(text) {
	return String(text || "").replace(/\r/g, "").replace(/\t/g, " ").replace(/[ \u00A0]+/g, " ");
}

function windowAfter(text, labelRegex, span = 200) {
	const idx = text.search(labelRegex);
	if (idx === -1) return null;
	const after = text.slice(idx);
	const lineEnd = after.indexOf("\n");
	const end = lineEnd !== -1 ? Math.min(lineEnd, span) : Math.min(after.length, span);
	return after.slice(0, end);
}

function yesNoMarked(text, labelRegex) {
	const seg = windowAfter(text, labelRegex, 160);
	if (!seg) return null;
	if (/\bNo\b\s+X\b/i.test(seg)) return false;
	if (/\bYes\b\s+X\b/i.test(seg)) return true;
	return null;
}

function pickIntAfterLabelLine(text, labelRegex) {
	const seg = windowAfter(text, labelRegex, 120);
	if (!seg) return null;
	const m = seg.match(/-?\d+/);
	return m ? parseInt(m[0], 10) : null;
}

function extractTenureDetail(text) {
	// Capture any free text following the tenure options on the same physical line
	// Strategy: take a small window after Tenure:, strip known options and X markers, return the remainder if any
	const seg = windowAfter(text, /Tenure\s*:/i, 260);
	if (!seg) return null;
	// Remove the label
	let s = seg.replace(/^\s*Tenure\s*:\s*/i, "");
	// Remove options and their X marks, keep leftover free text
	s = s.replace(/\bFreehold\b\s*X?/i, "");
	s = s.replace(/\bLeasehold\b\s*X?/i, "");
	// Remove common filler and multiple spaces
	s = s.replace(/\s{2,}/g, " ").trim();
	// If nothing left or it's clearly another prompt, return null
	if (!s || /^(Flying\s+freehold|Maintenance|Charge|Road|Ground|Rent)\b/i.test(s)) return null;
	return s;
}

function mapCurrentOccupency(rawText) {
	const text = normalize(rawText);

	// 1) Has the property ever been occupied? Yes X No
	const isEverOccupied = yesNoMarked(text, /Has\s+the\s+property\s+ever\s+been\s+occupied\?/i);

	// 2) How many adults appear to live in the property? 3
	const numberOfAdultsInProperty = pickIntAfterLabelLine(text, /How\s+many\s+adults\s+appear\s+to\s+live\s+in\s+the\s+property\?/i);

	// 3) Does the property appear to be an HMO/Multi Unit ... Freehold Block? Yes No X
	// Anchor on "Freehold Block?" which is the question with Yes/No
	const isHmoOrMultiUnitFreeholdBlock = yesNoMarked(text, /Freehold\s+Block\?/i);

	// 4) be tenanted at present? Yes X No -> per requirement map this boolean into hmoOrMultiUnitDetails (string field by schema)
	const beTenantedBoolean = yesNoMarked(text, /be\s+tenanted\s+at\s+present\?/i);

	// 5) "If Yes, please provide details" -> pick trailing detail after Tenure options on same row e.g. "Simple Text please"
	const tenureDetail = extractTenureDetail(text);

	// Per user's expected mapping:
	// - isCurrentlyTenanted should carry the textual detail (e.g., "Simple Text please")
	// - hmoOrMultiUnitDetails should carry the boolean from "be tenanted at present?"
	return {
		isEverOccupied,
		numberOfAdultsInProperty,
		isHmoOrMultiUnitFreeholdBlock,
		isCurrentlyTenanted: tenureDetail,
		hmoOrMultiUnitDetails: beTenantedBoolean
	};
}

module.exports = { mapCurrentOccupency };


