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

function yesNoMarkedFlexible(text, labelRegex, span = 300) {
	const idx = text.search(labelRegex);
	if (idx === -1) return null;
	const seg = text.slice(idx, idx + span);
	if (/\bNo\b\s+X\b/i.test(seg)) return false;
	if (/\bYes\b\s+X\b/i.test(seg)) return true;
	return null;
}

function hasXAfterLabelOnLine(text, labelRegex) {
	const idx = text.search(labelRegex);
	if (idx === -1) return null;
	const after = text.slice(idx);
	const lineEnd = after.indexOf("\n");
	const line = lineEnd !== -1 ? after.slice(0, lineEnd) : after;
	const m = labelRegex.exec(line);
	if (!m) return null;
	const tail = line.slice(m.index + m[0].length);
	return /\bX\b/.test(tail);
}

function pickTextAfterLabel(text, labelRegex) {
	const idx = text.search(labelRegex);
	if (idx === -1) return null;
	const after = text.slice(idx);
	const lines = after.split("\n");
	// Take the next non-empty line's content
	for (let i = 1; i < Math.min(lines.length, 5); i++) {
		const s = (lines[i] || "").trim();
		if (s) return s;
	}
	return null;
}

function extractFollowingFreeText(text, startRegex, stopRegex, maxLines = 6) {
	const startIdx = text.search(startRegex);
	if (startIdx === -1) return null;
	const slice = text.slice(startIdx);
	const stopIdx = slice.search(stopRegex);
	const block = stopIdx !== -1 ? slice.slice(0, stopIdx) : slice;
	const lines = block.split("\n").map(s => s.trim());
	for (let i = 1; i < Math.min(lines.length, maxLines); i++) {
		const ln = lines[i];
		if (!ln) continue;
		if (/^(Yes|No)\b/i.test(ln)) continue;
		// Skip helper prompt line for incentives
		if (/^Including\b/i.test(ln)) continue;
		return ln;
	}
	return null;
}

function extractIncentivesDetails(text) {
	// Anchor to Disclosure of Incentives section to avoid Tenure/Other "If Yes, please provide details" earlier
	const anchorIdx = text.search(/Has\s+a\s+Disclosure\s+of\s+Incentives\s+form\s+been\s+seen\?/i);
	if (anchorIdx === -1) {
		// Fallback to generic extractor
		return extractFollowingFreeText(
			text,
			/If\s+Yes,\s*please\s*provide\s*details/i,
			/If\s+property\s+is\s+New\s+Build|GENERAL\s+REMARKS|VALUATION|VALUERS\s+DECLARATION/i,
			8
		);
	}
	const tail = text.slice(anchorIdx, anchorIdx + 2000);
	// Find the "If Yes, please provide details" that comes AFTER the disclosure question
	const startRel = tail.search(/If\s+Yes,\s*please\s*provide\s*details/i);
	if (startRel === -1) return null;
	const sub = tail.slice(startRel);
	// Stop at the next big section
	const stopRel = sub.search(/If\s+property\s+is\s+New\s+Build|GENERAL\s+REMARKS|VALUATION|VALUERS\s+DECLARATION/i);
	const block = stopRel !== -1 ? sub.slice(0, stopRel) : sub;
	const lines = block.split("\n").map(s => s.trim());
	for (let i = 1; i < Math.min(lines.length, 8); i++) {
		const ln = lines[i];
		if (!ln) continue;
		if (/^(Yes|No)\b/i.test(ln)) continue;
		if (/^Including\b/i.test(ln)) continue;
		// Skip leftover 'X' alone
		if (/^\bX\b$/.test(ln)) continue;
		return ln;
	}
	return null;
}

function mapNewBuild(rawText) {
	const text = normalize(rawText);

	const isNewBuildOrRecentlyConverted = yesNoMarked(text, /Is\s+the\s+Property\s+New\s+Build\s+or\s+Recently\s+Converted\?/i);

	// Completed / Under Construction on same line
	const isCompleted = hasXAfterLabelOnLine(text, /\bCompleted\b/i);
	const isUnderConstruction = hasXAfterLabelOnLine(text, /Under\s+Construction\b/i);

	const isFinalInspectionRequired = yesNoMarked(text, /Is\s+Final\s+Inspection\s+Required\?/i);

	// Certificates line(s)
	const nhbcRaw = hasXAfterLabelOnLine(text, /\bNHBC\s+Cert\b/i);
	const isNhbcCert = nhbcRaw === true ? true : null;
	const buildZoneRaw = hasXAfterLabelOnLine(text, /\bBuild\s+Zone\b/i);
	const isBuildZone = buildZoneRaw === true ? true : null;
	const premierRaw = hasXAfterLabelOnLine(text, /\bPremier\b/i);
	const isPremier = premierRaw === true ? true : null;
	const professionalRaw = hasXAfterLabelOnLine(text, /\bProfessional\s+Consultant\b/i);
	const isProfessionalConsultant = professionalRaw === true ? true : null;

	// "Other" certificate appears as a standalone label if present with X; otherwise null
	const otherRaw = hasXAfterLabelOnLine(text, /^\s*Other\s*$/im);
	const isOtherCert = otherRaw === true ? true : null;

	// Details for Other
	const otherCertDetails = extractFollowingFreeText(
		text,
		/If\s+Other,\s*please\s*provide\s*details/i,
		/Is\s+this\s+a\s+Self-build|Does\s+this\s+transaction|Has\s+a\s+Disclosure|If\s+property\s+is\s+New\s+Build/i,
		5
	);

	const isSelfBuildProject = yesNoMarked(text, /Is\s+this\s+a\s+Self-build\s+project\?/i);
	// The label often breaks over two lines; use flexible window
	const isInvolvesPartExchange = yesNoMarkedFlexible(text, /Does\s+this\s+transaction\s+involve\s+an\s+element\s+of\s+part\s+exchange\?/i);
	const isDisclosureOfIncentivesSeen = yesNoMarked(text, /Has\s+a\s+Disclosure\s+of\s+Incentives\s+form\s+been\s+seen\?/i);

	const incentivesDetails = extractIncentivesDetails(text);

	const newBuildDeveloperName = pickTextAfterLabel(
		text,
		/If\s+property\s+is\s+New\s+Build,\s*please\s*provide\s*the\s*name\s*of\s*Developer\s*:/i
	);

	return {
		isNewBuildOrRecentlyConverted,
		isCompleted: isCompleted === true,
		isUnderConstruction: isUnderConstruction === true,
		isFinalInspectionRequired,
		isNhbcCert,
		isBuildZone,
		isPremier,
		isProfessionalConsultant,
		isOtherCert,
		otherCertDetails,
		isSelfBuildProject,
		isInvolvesPartExchange,
		isDisclosureOfIncentivesSeen,
		incentivesDetails,
		newBuildDeveloperName
	};
}

module.exports = { mapNewBuild };


