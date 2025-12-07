function normalize(text) {
	return String(text || "").replace(/\r/g, "").replace(/\t/g, " ").replace(/\u00A0/g, " ");
}

const LABEL_PATTERNS = [
	/Timber\/Damp/i,
	/Mining/i,
	/Electrical/i,
	/Drains/i,
	/Structural\s+Engineers/i,
	/Arboricultural/i,
	/Mundic/i,
	/Wall\s+Ties/i,
	/Roof/i,
	/Metalliferous/i,
	/Sulfate\s*\(Red\s*ash\)/i,
	/Other\s*\+/i
];

function isLabelLine(line) {
	return LABEL_PATTERNS.some(r => r.test(line));
}

function hasXInColumnAfterLabel(text, labelRegex, scanLines = 3, columnWindow = 24) {
	const lines = String(text).split("\n");
	for (let i = 0; i < lines.length; i++) {
		const line = String(lines[i] || "");
		const m = line.match(labelRegex);
		if (!m) continue;
		const colStart = m.index + m[0].length;
		for (let k = 0; k < scanLines && i + k < lines.length; k++) {
			const l = String(lines[i + k] || "");
			if (k > 0 && isLabelLine(l)) continue;
			const seg = l.slice(colStart, colStart + columnWindow);
			if (/\bX\b/.test(seg)) return true;
		}
	}
	return false;
}

function mapReports(rawText) {
	const text = normalize(rawText);

	return {
		isTimberDamp: hasXInColumnAfterLabel(text, /\bTimber\/Damp\b/i),
		isMining: hasXInColumnAfterLabel(text, /\bMining\b/i),
		isElectrical: hasXInColumnAfterLabel(text, /\bElectrical\b/i),
		isDrains: hasXInColumnAfterLabel(text, /\bDrains\b/i),
		isStructuralEngineers: hasXInColumnAfterLabel(text, /\bStructural\s+Engineers\b/i),
		isArboricultural: hasXInColumnAfterLabel(text, /\bArboricultural\b/i),
		isMundic: hasXInColumnAfterLabel(text, /\bMundic\b/i),
		isWallTies: hasXInColumnAfterLabel(text, /\bWall\s+Ties\b/i),
		isRoof: hasXInColumnAfterLabel(text, /\bRoof\b/i),
		isMetalliferous: hasXInColumnAfterLabel(text, /\bMetalliferous\b/i),
		isSulfateRedAsh: hasXInColumnAfterLabel(text, /\bSulfate\s*\(Red\s*ash\)\b/i),
		isOtherReport: hasXInColumnAfterLabel(text, /\bOther\s*\+/i),
		otherReportDetails: null
	};
}

module.exports = { mapReports };


