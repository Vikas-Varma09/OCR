function normalize(text) {
	return String(text || "").replace(/\r/g, "").replace(/\t/g, " ").replace(/\u00A0/g, " ");
}

function windowAfter(text, labelRegex, span = 260) {
	const idx = text.search(labelRegex);
	if (idx === -1) return null;
	const after = text.slice(idx);
	const lineEnd = after.indexOf("\n");
	const end = lineEnd !== -1 ? Math.min(lineEnd, span) : Math.min(after.length, span);
	return after.slice(0, end);
}

function yesNoMarked(text, labelRegex) {
	const seg = windowAfter(text, labelRegex, 220);
	if (!seg) return null;
	if (/\bNo\b\s+X\b/i.test(seg)) return false;
	if (/\bYes\b\s+X\b/i.test(seg)) return true;
	return null;
}

function yesNoMarkedFlexible(text, labelRegex, span = 400) {
	const idx = text.search(labelRegex);
	if (idx === -1) return null;
	const seg = text.slice(idx, idx + span);
	if (/\bNo\b\s+X\b/i.test(seg)) return false;
	if (/\bYes\b\s+X\b/i.test(seg)) return true;
	return null;
}

function pickNumberAfter(text, labelRegex) {
	const seg = windowAfter(text, labelRegex, 120);
	if (!seg) return null;
	const m = seg.match(/-?\d+(?:,\d{3})*(?:\.\d+)?/);
	if (!m) return null;
	const num = parseFloat(String(m[0]).replace(/,/g, ""));
	return Number.isFinite(num) ? num : null;
}

function mapValuationForFinancePurpose(rawText) {
	const text = normalize(rawText);

	// Suitable for finance
	const isSuitableForFinance = yesNoMarked(text, /Is\s+the\s+property\s+suitable\s+security\s+for\s+finance\s+purposes\?/i);

	// Monetary values
	const marketValuePresentCondition = pickNumberAfter(text, /Market\s+Value\s+in\s+present\s+condition/i);
	const marketValueAfterRepairs = pickNumberAfter(text, /Market\s+Value\s+after\s+essential\s+repairs\/completion/i);
	const purchasePriceOrBorrowerEstimate = pickNumberAfter(text, /Borrowers?\s+Estimated\s+Value/i);
	const buildingInsuranceReinstatementCost = pickNumberAfter(text, /Building\s+Insurance\s+Reinstatement\s+Cost/i);

	// Insurance premium loading risk (spans lines)
	const isInsurancePremiumLoadingRisk = yesNoMarkedFlexible(
		text,
		/to\s+cause\s+a\s+loading\s+to\s+the\s+building\s+insurance[\s\S]*?premium\?/i,
		400
	);

	return {
		valuationComparativeOnly: null,
		isSuitableForFinance,
		financeSuitabilityDetails: null,
		marketValuePresentCondition,
		marketValueAfterRepairs,
		purchasePriceOrBorrowerEstimate,
		buildingInsuranceReinstatementCost,
		isInsurancePremiumLoadingRisk,
		insurancePremiumLoadingDetails: null
	};
}

module.exports = { mapValuationForFinancePurpose };


