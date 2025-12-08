function normalize(text) {
	return String(text || "").replace(/\r/g, "").replace(/\t/g, " ").replace(/\u00A0/g, " ");
}

function windowAfter(text, labelRegex, span = 300) {
	const idx = text.search(labelRegex);
	if (idx === -1) return "";
	return text.slice(idx, idx + span);
}

function yesNoInColumnAfterLabel(text, labelRegex, columnWindow = 24) {
	const lines = String(text || "").split("\n");
	for (const raw of lines) {
		const line = String(raw || "");
		const m = line.match(labelRegex);
		if (!m) continue;
		const colStart = m.index + m[0].length;
		const seg = line.slice(colStart, colStart + columnWindow);
		const hasYes = /\bYes\b/i.test(seg);
		const hasNo = /\bNo\b/i.test(seg);
		if (hasYes && !hasNo) return true;
		if (hasNo && !hasYes) return false;
	}
	return null;
}

function pickYesNo(text, labelRegex) {
	const seg = windowAfter(text, labelRegex, 160);
	if (!seg) return null;
	if (/\bYes\b[^A-Za-z0-9]{0,80}X\b/i.test(seg)) return true;
	if (/\bNo\b[^A-Za-z0-9]{0,80}X\b/i.test(seg)) return false;
	return null;
}

function pickYesNoWindow(text, startRegex, span = 180) {
	const seg = windowAfter(text, startRegex, span);
	if (!seg) return null;
	if (/\bYes\b[^A-Za-z0-9]{0,80}X\b/i.test(seg)) return true;
	if (/\bNo\b[^A-Za-z0-9]{0,80}X\b/i.test(seg)) return false;
	return null;
}

function pickYesNoBetween(text, startRegex, endRegex) {
	const startIdx = text.search(startRegex);
	if (startIdx === -1) return null;
	const after = text.slice(startIdx);
	const m = after.match(endRegex);
	const endIdx = m ? m.index : Math.min(240, after.length);
	const seg = after.slice(0, endIdx);
	if (/\bYes\b[^A-Za-z0-9]{0,80}X\b/i.test(seg)) return true;
	if (/\bNo\b[^A-Za-z0-9]{0,80}X\b/i.test(seg)) return false;
	return null;
}

function yesNoWithXAfterLabelAcrossLines(text, startRegex, lookLines = 2) {
	const lines = String(text || "").split("\n");
	for (let i = 0; i < lines.length; i++) {
		const line = String(lines[i] || "");
		const m = line.match(startRegex);
		if (!m) continue;
		const colStart = m.index + m[0].length;
		let buf = line.slice(colStart);
		for (let k = 1; k <= lookLines && i + k < lines.length; k++) {
			buf += "\n" + String(lines[i + k] || "");
		}
		// Prefer explicit X near No over Yes
		if (/\bNo\b[^A-Za-z0-9]{0,160}X\b/i.test(buf)) return false;
		if (/\bYes\b[^A-Za-z0-9]{0,160}X\b/i.test(buf)) return true;
		return null;
	}
	return null;
}

function hasXForOption(seg, optionRegex, lookahead = 24) {
	const m = seg.match(optionRegex);
	if (!m) return false;
	const tail = seg.slice(m.index + m[0].length, m.index + m[0].length + lookahead);
	return /\bX\b/.test(tail);
}

function mapConditionsOfProperty(rawText) {
	const text = normalize(rawText);

	// Structural movement
	const isStructuralMovement =
		yesNoInColumnAfterLabel(text, /movement\s+to\s+the\s+property\?/i) ??
		pickYesNoBetween(text, /movement\s+to\s+the\s+property\?/i, /If\s+Yes,\s*is\s+this\s+historic/i) ??
		pickYesNoWindow(text, /movement\s+to\s+the\s+property\?/i) ??
		pickYesNo(text, /movement\s+to\s+the\s+property\?/i);
	const isStructuralMovementHistoricOrNonProgressive =
		pickYesNoWindow(text, /historic\s+or\s+non\s+progressive\?/i) ??
		yesNoInColumnAfterLabel(text, /historic\s+or\s+non\s+progressive\?/i) ??
		pickYesNo(text, /historic\s+or\s+non\s+progressive\?/i);

	// Structural modifications
	const isStructuralModifications =
		pickYesNoWindow(text, /be\s+aware\?/i) ??
		yesNoInColumnAfterLabel(text, /structural\s+modifications[\s\S]*be\s+aware\?/i) ??
		pickYesNo(text, /structural\s+modifications/i);

	// Communal areas maintained
	const communalAreasMaintained =
		pickYesNoWindow(text, /maintained\s+to\s+a\s+satisfactory\s+standard/i) ??
		yesNoInColumnAfterLabel(text, /maintained\s+to\s+a\s+satisfactory\s+standard/i) ??
		pickYesNo(text, /communal\s+areas\s+exist/i);

	// Property prone to block
	const proneSeg = windowAfter(text, /property\s+prone\s+to\s*:/i, 300);
	const flooding = proneSeg ? hasXForOption(proneSeg, /\bFlooding\b/i) : null;
	const subsidence = proneSeg ? hasXForOption(proneSeg, /\bSubsidence\b/i) : null;
	const heave = proneSeg ? hasXForOption(proneSeg, /\bHeave\b/i) : null;
	const landslip = proneSeg ? hasXForOption(proneSeg, /\bLandslip\b/i) : null;

	// Plot boundaries below 0.4 hectares
	const isPlotBoundariesDefinedUnderPointFourHectares =
		pickYesNo(text, /below\s*0\.4\s*hectares/i) ??
		yesNoInColumnAfterLabel(text, /below\s*0\.4\s*hectares/i);

	// Trees within influencing distance
	const isTreesWithinInfluencingDistance =
		yesNoWithXAfterLabelAcrossLines(
			text,
			/Are\s+there\s+any\s+trees\s+within\s+influencing\s+distance/i,
			2
		) ??
		pickYesNoBetween(
			text,
			/Are\s+there\s+any\s+trees\s+within\s+influencing\s+distance/i,
			/Is\s+the\s+property\s+built\s+on\s+a\s+steeply\s+sloping\s+site/i
		) ??
		pickYesNoWindow(text, /trees\s+within\s+influencing\s+distance/i, 280) ??
		yesNoInColumnAfterLabel(text, /trees\s+within\s+influencing\s+distance/i) ??
		pickYesNo(text, /trees\s+within\s+influencing\s+distance/i);

	// Built on steep slope
	const isBuiltOnSteepSlope =
		pickYesNo(text, /built\s+on\s+a\s+steeply\s+sloping\s+site/i) ??
		yesNoInColumnAfterLabel(text, /built\s+on\s+a\s+steeply\s+sloping\s+site/i);

	return {
		isStructuralMovement,
		isStructuralMovementHistoricOrNonProgressive,
		structuralMovementDetails: null,
		isStructuralModifications,
		structuralModificationsDetails: null,
		communalAreasMaintained,
		propertyProneTo: {
			flooding,
			subsidence,
			heave,
			landslip
		},
		isPlotBoundariesDefinedUnderPointFourHectares,
		isTreesWithinInfluencingDistance,
		treesInfluenceDetails: null,
		isBuiltOnSteepSlope,
		steepSlopeDetails: null
	};
}

module.exports = { mapConditionsOfProperty };


