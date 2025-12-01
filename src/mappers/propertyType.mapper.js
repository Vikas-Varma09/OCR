// Maps text -> propertyType section (heuristic parsing based on report layout)
function mapPropertyType(rawText) {
	const text = normalize(rawText);

	// For the three columns per row, only consider X that appears between this label and the next label on the same line
	const isDetachedHouse = hasXBetweenLabels(text, /Detached House/, /Semi-Detached House/);
	const isSemiDetachedHouse = hasXBetweenLabels(text, /Semi-Detached House/, /Terraced House/);
	const isTerracedHouse = hasXBetweenLabels(text, /Terraced House/, null);
	const isBungalow = hasXBetweenLabels(text, /Bungalow(?!.*Mortgage)/, /\bFlat\b/);
	// Flat: require X strictly between 'Flat' and 'Maisonette' on the same line to avoid false positives
	const isFlat = hasXBetweenLabels(text, /\bFlat\b/, /\bMaisonette\b/);
	const isMaisonette = hasXBetweenLabels(text, /\bMaisonette\b/, null);

	const flatMaisonetteFloor = numberAfter(text, /If flat\s*\/\s*maisonette on what floor\?/i);
	const numberOfFloorsInBlock = numberAfter(text, /No\.?\s*of\s*floors\s*in\s*block/i);

	const isBuiltOrOwnedByLocalAuthority = yesNoMarked(text, /Property\s*built\s*or\s*owned\s*by\s*the\s*Local\s*Authority\?/i);
	const ownerOccupationPercentage = floatAfterNullable(text, /approximate % of owner occupation/i);

	// Converted: only true if X appears between 'Converted' and the following label fragment
	const isFlatMaisonetteConverted = hasXBetweenLabels(text, /\bConverted\b/, /please state year of conversion|Purpose Built/i);
	const conversionYear = numberAfter(text, /year of conversion/i);
	const isPurposeBuilt = hasMarkedX(text, /Purpose Built/i);
	const numberOfUnitsInBlock = numberBetweenLabels(text, /No\s*of\s*units\s*in\s*block/i, /Gross\s+floor\s+area\s+of\s+dwelling/i);

	const isAboveCommercial = yesNoMarked(text, /Above commercial/i);

	// Capture the free-text area following the prompt about residential nature impact
	const residentialNatureImpact = extractFollowingText(
		text,
		/If\s*Yes,\s*please\s*state[\s\S]*?residential\s*nature[\s\S]*?property[\s\S]*?(Noise|Odou?r)/i,
		/CURRENT\s+OCCUPANCY|CURRENT\s+OCCUPENCY|NEW\s+BUILD|CONSTRUCTION|LOCALITY\s+AND\s+DEMAND/i,
		20
	);

	const tenure = pickMarkedOption(text, /Tenure:/i, ["Freehold", "Leasehold"]);

	const isFlyingFreehold = yesNoMarked(text, /Flying freehold/i);
	const flyingFreeholdPercentage = floatAfterNullable(text, /If Yes,\s*what %/i);

	const maintenanceCharge = numberAfterOrNull(text, /\bCharge\b/i);
	const roadCharges = numberAfterOrNull(text, /\bCharges\b/i);
	const groundRent = numberAfterOrNull(text, /\bRent\b/i);

	const remainingLeaseTermYears = numberAfter(text, /Remaining term of Lease/i);
	const isPartCommercialUse = yesNoMarked(text, /any part of the property in commercial use/i);
	const commercialUsePercentage = floatAfterNullable(text, /% in commercial use/i);
	const isPurchasedUnderSharedOwnership = yesNoMarked(text, /shared ownership scheme/i);
	const yearBuilt = numberAfter(text, /Year property built/i);

	return {
		isDetachedHouse: isDetachedHouse === true,
		isSemiDetachedHouse: isSemiDetachedHouse === true,
		isTerracedHouse: isTerracedHouse === true,
		isBungalow: isBungalow === true,
		isFlat: isFlat === true,
		isMaisonette: isMaisonette === true,
		flatMaisonetteFloor,
		numberOfFloorsInBlock,
		isBuiltOrOwnedByLocalAuthority: isBuiltOrOwnedByLocalAuthority === true,
		ownerOccupationPercentage,
		isFlatMaisonetteConverted: isFlatMaisonetteConverted === true,
		conversionYear,
		isPurposeBuilt: isPurposeBuilt === true,
		numberOfUnitsInBlock,
		isAboveCommercial: isAboveCommercial === true,
		residentialNatureImpact,
		tenure,
		isFlyingFreehold: isFlyingFreehold === true,
		flyingFreeholdPercentage,
		maintenanceCharge,
		roadCharges,
		groundRent,
		remainingLeaseTermYears,
		isPartCommercialUse: isPartCommercialUse === true,
		commercialUsePercentage,
		isPurchasedUnderSharedOwnership: isPurchasedUnderSharedOwnership === true,
		yearBuilt
	};
}

function normalize(s) {
	return String(s || "")
		.replace(/\r/g, "")
		.replace(/[ \t]+/g, " ")
		.replace(/\u00A0/g, " ")
		.trim();
}

function hasMarkedX(text, labelRegex) {
	const seg = windowAfter(text, labelRegex, 120);
	if (!seg) return null;
	return /\bX\b/.test(seg);
}

function hasMarkedXShort(text, labelRegex) {
	// Strict short proximity window (20 chars) to avoid capturing next-column X
	const seg = windowAfter(text, labelRegex, 20);
	if (!seg) return null;
	return /\bX\b/.test(seg);
}

function hasMarkedXFlexible(text, labelRegex) {
	// Try same-line first
	const sameLine = hasMarkedX(text, labelRegex);
	if (sameLine === true) return true;
	// If explicitly false or null, try extended window that may cross newline
	const idx = text.search(labelRegex);
	if (idx === -1) return null;
	const seg = text.slice(idx, idx + 220);
	return /\bX\b/.test(seg);
}

function hasXBetweenLabels(text, labelRegex, nextLabelRegex) {
	const startIdx = text.search(labelRegex);
	if (startIdx === -1) return false;
	// Extract the rest of this line only
	const after = text.slice(startIdx);
	const lineEnd = after.indexOf("\n");
	const line = lineEnd !== -1 ? after.slice(0, lineEnd) : after;
	// Find end of current label within line
	const labelMatch = labelRegex.exec(line);
	if (!labelMatch) return false;
	const labelEnd = labelMatch.index + labelMatch[0].length;
	let segment = line.slice(labelEnd);
	if (nextLabelRegex) {
		const nextMatch = nextLabelRegex.exec(segment);
		if (nextMatch) segment = segment.slice(0, nextMatch.index);
	}
	return /\bX\b/.test(segment);
}

function numberBetweenLabels(text, labelRegex, nextLabelRegex) {
	const startIdx = text.search(labelRegex);
	if (startIdx === -1) return null;
	const after = text.slice(startIdx);
	const lineEnd = after.indexOf("\n");
	const line = lineEnd !== -1 ? after.slice(0, lineEnd) : after;
	const labelMatch = labelRegex.exec(line);
	if (!labelMatch) return null;
	const labelEnd = labelMatch.index + labelMatch[0].length;
	let segment = line.slice(labelEnd);
	if (nextLabelRegex) {
		const nextMatch = nextLabelRegex.exec(segment);
		if (nextMatch) segment = segment.slice(0, nextMatch.index);
	}
	const m = segment.match(/-?\d+/);
	return m ? parseInt(m[0], 10) : null;
}

function yesNoMarked(text, labelRegex) {
	// Returns true if "Yes X", false if "No X" near the label (same line window), else null
	const seg = windowAfter(text, labelRegex, 120);
	if (!seg) return null;
	if (/\bNo\b\s+X\b/i.test(seg)) return false;
	if (/\bYes\b\s+X\b/i.test(seg)) return true;
	return null;
}

function numberAfter(text, labelRegex) {
	const seg = windowAfter(text, labelRegex, 80);
	if (!seg) return null;
	const m = /-?\d+/.exec(seg);
	return m ? parseInt(m[0], 10) : null;
}

function numberAfterOrNull(text, labelRegex) {
	const seg = windowAfter(text, labelRegex, 80);
	if (!seg) return null;
	const m = /-?\d+/.exec(seg);
	if (!m) return null;
	const n = parseInt(m[0], 10);
	return Number.isFinite(n) ? n : null;
}

function floatAfterNullable(text, labelRegex) {
	const seg = windowAfter(text, labelRegex, 100);
	if (seg) {
		// If explicit Null appears near the label, treat as null regardless of nearby numbers
		if (/\bNull\b/i.test(seg)) return null;
		const m = /-?\d+(?:\.\d+)?/.exec(seg);
		if (m) return parseFloat(m[0]);
	}
	return null;
}

function extractFollowingText(text, startRegex, stopRegex, maxLines = 20) {
	const startIdx = text.search(startRegex);
	if (startIdx === -1) return null;
	const slice = text.slice(startIdx);
	const stopIdx = slice.search(stopRegex);
	const block = stopIdx !== -1 ? slice.slice(0, stopIdx) : slice;
	const lines = block.split("\n").map(s => s.trim()).filter(Boolean);
	// Skip the first line (label)
	const rest = lines.slice(1);
	if (!rest.length) return null;
	// Drop the common second-line label fragment like "property e.g. Noise, Odour"
	const filtered = rest.filter(l => !/^\s*property\s*e\.?\s*g\.?\s*[:\-]?\s*Noise,\s*Odou?r\s*$/i.test(l));
	if (!filtered.length) return null;
	// Collect consecutive free-text answer lines, skipping prompts/labels/numeric-only lines
	const isPrompt = (line) => {
		return (
			/\b(Yes|No)\b/i.test(line) ||
			/(^([A-Z][A-Za-z/&\s-]+:)|Tenure\b|Has the property\b|Does the property\b|Number of\b|How many\b|HMO\b|Freehold\b|Leasehold\b|Freehold Block\b|CURRENT\s+OCCUPANCY|Maintenance\b|^\s*Charge\b|^\s*Charges\b|^\s*Rent\b|^\s*Road\b|^\s*Ground\b)/i.test(line)
		);
	};
	const collected = [];
	let started = false;
	for (const raw of filtered) {
		if (Number.isFinite(maxLines) && collected.length >= maxLines) break;
		let line = String(raw || "");
		if (!line.trim()) continue;
		// If a prompt phrase appears on the same physical line (two columns), keep left portion before prompt
		const promptSplitRe = /(?:\s{2,})(Tenure\b|Has the property\b|Does the property\b|Freehold\s*Block\b|CURRENT\s+OCCUPANCY|If\s+Yes,\s*please\s+provide\s+details|Maintenance\b|Charge\b|Charges\b|Rent\b|Road\b|Ground\b)/i;
		const mSplit = line.match(promptSplitRe);
		if (mSplit) {
			const idx = line.search(promptSplitRe);
			if (idx > 0) line = line.slice(0, idx);
		}
		line = line.replace(/\s+/g, " ").trim();
		if (!line) continue;
		// Skip numeric-only (e.g., "3")
		if (/^\d+(?:\.\d+)?$/.test(line)) {
			continue;
		}
		// Stop if we hit prompts after we started capturing
		if (isPrompt(line)) {
			if (started) break;
			continue;
		}
		// Must contain letters
		if (!/[A-Za-z]/.test(line)) {
			continue;
		}
		collected.push(line);
		started = true;
	}
	if (!collected.length) return null;
	// Join lines preserving line boundaries
	return collected.join("\n");
}

function pickMarkedOption(text, labelRegex, options) {
	const idx = text.search(labelRegex);
	if (idx === -1) return null;
	const window = text.slice(idx, idx + 200);
	for (const opt of options) {
		const re = new RegExp("\\b" + escapeRegExp(opt) + "\\b\\s+X\\b", "i");
		if (re.test(window)) return opt;
	}
	return null;
}

function escapeRegExp(s) {
	return s.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
}

function windowAfter(text, labelRegex, span = 120) {
	const idx = text.search(labelRegex);
	if (idx === -1) return null;
	const after = text.slice(idx);
	const lineEnd = after.indexOf("\n");
	const end = lineEnd !== -1 ? Math.min(lineEnd, span) : Math.min(after.length, span);
	return after.slice(0, end);
}

module.exports = { mapPropertyType };


