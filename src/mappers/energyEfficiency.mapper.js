function normalize(text) {
	return String(text || "").replace(/\r/g, "").replace(/\t/g, " ").replace(/\u00A0/g, " ");
}

function windowAfter(text, labelRegex, span = 260) {
	const idx = text.search(labelRegex);
	if (idx === -1) return null;
	const after = text.slice(idx);
	// Take two lines worth
	const lineEnd = after.indexOf("\n");
	const end = lineEnd !== -1 ? Math.min(after.length, idx + span) : Math.min(after.length, span);
	return after.slice(0, end);
}

function pickEpcRating(block) {
	if (!block) return null;
	const options = ["A", "B", "C", "D", "E", "F", "G", "Exempt", "None"];
	for (const opt of options) {
		const re = new RegExp("\\b" + opt + "\\b\\s+X\\b", "i");
		if (re.test(block)) return opt;
	}
	return null;
}

function pickEpcScore(text) {
	const seg = windowAfter(text, /EPC\s+Score/i, 80);
	if (!seg) return null;
	const m = seg.match(/-?\d+/);
	return m ? parseInt(m[0], 10) : null;
}

function mapEnergyEfficiency(rawText) {
	const text = normalize(rawText);
	const ratingWindow = windowAfter(text, /EPC\s+Rating\s*:/i, 300);
	const epcRating = pickEpcRating(ratingWindow);
	const epcScore = pickEpcScore(text);
	return { epcRating, epcScore };
}

module.exports = { mapEnergyEfficiency };


