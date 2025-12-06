function normalize(text) {
	return String(text || "").replace(/\r/g, "").replace(/\t/g, " ").replace(/\u00A0/g, " ");
}

function windowAfter(text, labelRegex, span = 220) {
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

function mapEssentialRepairs(rawText) {
	const text = normalize(rawText);

	const isEssentialRepairsRequired = yesNoMarked(text, /Are\s+there\s+any\s+essential\s+repairs\s+required\?/i);
	const isReinspectionRequired = yesNoMarked(text, /Is\s+re-?inspection\s+required\?/i);

	return {
		isEssentialRepairsRequired,
		essentialRepairsDetails: null,
		isReinspectionRequired
	};
}

module.exports = { mapEssentialRepairs };


