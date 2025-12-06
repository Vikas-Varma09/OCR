function normalize(text) {
	return String(text || "").replace(/\r/g, "").replace(/\t/g, " ").replace(/\u00A0/g, " ");
}

function windowAfter(text, labelRegex, span = 320) {
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

function yesNoMarkedFlexible(text, labelRegex, span = 500) {
	const idx = text.search(labelRegex);
	if (idx === -1) return null;
	const seg = text.slice(idx, idx + span);
	if (/\bNo\b\s+X\b/i.test(seg)) return false;
	if (/\bYes\b\s+X\b/i.test(seg)) return true;
	return null;
}

function pickNumberInWindow(text, labelRegex, span = 300) {
	const seg = windowAfter(text, labelRegex, span);
	if (!seg) return null;
	const m = seg.match(/-?\d+(?:,\d{3})*(?:\.\d+)?/);
	if (!m) return null;
	const num = parseFloat(String(m[0]).replace(/,/g, ""));
	return Number.isFinite(num) ? num : null;
}

function pickMonthlyRentByOccurrence(text, occurrenceIndex = 1, span = 350) {
	let pos = 0;
	for (let i = 0; i < occurrenceIndex; i++) {
		const idx = text.indexOf("Monthly market rent sustainable assuming", pos);
		if (idx === -1) return null;
		if (i === occurrenceIndex - 1) {
			let seg = text.slice(idx, idx + span);
			// Truncate before unrelated value sections to avoid picking Borrowers/Market Value/Insurance amounts
			const cutAt = /(Market\s+Value|Borrowers?\s+Estimated\s+Value|Purchase\s+Price|Building\s+Insurance\s+Reinstatement\s+Cost|VALUATION\s+FOR\s+FINANCE)/i;
			const cutIdx = seg.search(cutAt);
			if (cutIdx !== -1) seg = seg.slice(0, cutIdx);
			const re = /-?\d+(?:,\d{3})*(?:\.\d+)?/g;
			let m;
			while ((m = re.exec(seg)) !== null) {
				const val = m[0];
				// Skip parts of "6/12" or similar fractional tokens
				const before = seg[m.index - 1] || "";
				const after = seg[m.index + val.length] || "";
				if (before === "/" || after === "/") continue;
				// Skip tiny integers likely from "6/12"
				if (val === "6" || val === "12") continue;
				const num = parseFloat(String(val).replace(/,/g, ""));
				if (Number.isFinite(num)) return num;
			}
			return null;
		}
		pos = idx + 1;
	}
	return null;
}

function mapRentalInformation(rawText) {
	const text = normalize(rawText);

	// Is there rental demand for a property of this type in the locality? Yes X No
	const isRentalDemandInLocality = yesNoMarkedFlexible(
		text,
		/Is\s+there\s+rental\s+demand\s+for\s+a\s+property\s+of\s+this\s+type[\s\S]*?in\s+the\s+locality\?/i,
		400
	);

	// Monthly market rent values by occurrence in the block
	const monthlyMarketRentPresentCondition =
		pickMonthlyRentByOccurrence(text, 1) ??
		pickNumberInWindow(text, /Monthly\s+market\s+rent\s+sustainable\s+assuming/i, 300);

	const monthlyMarketRentImprovedCondition =
		pickMonthlyRentByOccurrence(text, 2) ??
		pickNumberInWindow(text, /Monthly\s+market\s+rent\s+sustainable\s+assuming/i, 600);

	// Any other matters ... ongoing demand for residential letting Yes/No
	const isOtherLettingDemandFactors = yesNoMarkedFlexible(
		text,
		/on\s+the\s+ongoing\s+demand\s+for\s+residential\s+letting/i,
		300
	);

	// Investor to investor only?
	const investorOnlyDemand = yesNoMarked(text, /on\s+an\s+investor\s+to\s+investor\s+basis\?/i);

	return {
		isRentalDemandInLocality,
		rentalDemandDetails: null,
		monthlyMarketRentPresentCondition,
		monthlyMarketRentImprovedCondition,
		isOtherLettingDemandFactors,
		otherLettingDemandDetails: null,
		investorOnlyDemand,
		investorOnlyDemandDetails: null
	};
}

module.exports = { mapRentalInformation };


