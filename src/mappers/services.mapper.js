function normalize(text) {
	return String(text || "").replace(/\r/g, "").replace(/\t/g, " ").replace(/\u00A0/g, " ");
}

function windowAfter(text, labelRegex, span = 240) {
	const idx = text.search(labelRegex);
	if (idx === -1) return "";
	return text.slice(idx, idx + span);
}

function hasXNearOption(text, labelRegex, optionRegex, scan = 220) {
	const seg = windowAfter(text, labelRegex, scan);
	if (!seg) return false;
	const m = seg.match(optionRegex);
	if (!m) return false;
	const tail = seg.slice(m.index + m[0].length, m.index + m[0].length + 24);
	return /\bX\b/.test(tail);
}

function pickYesNo(text, labelRegex) {
	const seg = windowAfter(text, labelRegex, 160);
	if (!seg) return null;
	if (/\bYes\b/i.test(seg) && /\bNo\b/i.test(seg)) {
		if (/\bYes\b[^A-Za-z0-9]{0,10}X\b/i.test(seg)) return true;
		if (/\bNo\b[^A-Za-z0-9]{0,10}X\b/i.test(seg)) return false;
	}
	if (/\bYes\b/i.test(seg) && !/\bNo\b/i.test(seg)) return true;
	if (/\bNo\b/i.test(seg) && !/\bYes\b/i.test(seg)) return false;
	return null;
}

function yesNoOnSameLine(text, labelRegex) {
	const lines = String(text || "").split("\n");
	for (const raw of lines) {
		const line = String(raw || "");
		const m = line.match(labelRegex);
		if (!m) continue;
		const tail = line.slice(m.index + m[0].length);
		const hasYes = /\bYes\b/i.test(tail);
		const hasNo = /\bNo\b/i.test(tail);
		if (hasYes && !hasNo) return true;
		if (hasNo && !hasYes) return false;
		// If both present without X, unclear; skip
	}
	return null;
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

function pickCentralHeatingType(text) {
	// Look near the central heating type label for common fuel keywords
	const seg = windowAfter(text, /If\s+Yes,\s*please\s*state\s*the\s*type\s*of\s*central\s*heating/i, 400);
	if (!seg) return null;
	// Prefer exact type tokens; avoid picking "Electrical" from Reports line
	const types = ["Electric", "Gas", "Oil", "Solid Fuel", "LPG", "Biomass", "Heat Pump"];
	for (const t of types) {
		const re = new RegExp(`\\b${t.replace(/\s+/g, "\\s+")}\\b`, "i");
		const m = seg.match(re);
		if (m) return t;
	}
	return null;
}

function pickServicesSeparate(text) {
	const seg = windowAfter(text, /If\s+house\s+split\s+in\s+to\s+flats,\s*are\s*services\s*separate\s*for\s*each\s*unit\?/i, 260);
	if (!seg) return { value: "", details: "" };
	if (/\bYes\b[^A-Za-z0-9]{0,10}X\b/i.test(seg)) return { value: "Yes", details: "" };
	if (/\bNo\b[^A-Za-z0-9]{0,10}X\b/i.test(seg)) return { value: "No", details: "" };
	if (/\bN\/?A\b[^A-Za-z0-9]{0,10}X\b/i.test(seg)) return { value: "N/A", details: "" };
	// If no X marker, try simple presence fallback
	if (/\bN\/?A\b/i.test(seg)) return { value: "N/A", details: "" };
	return { value: "", details: "" };
}

function mapServices(rawText) {
	const text = normalize(rawText);

	// Water
	const waterWindow = windowAfter(text, /\bWater\s*:\s*/i, 180);
	const isMainsWater = hasXNearOption(text, /\bWater\s*:\s*/i, /\bMains\b/i);
	const isPrivateWater = hasXNearOption(text, /\bWater\s*:\s*/i, /\bPrivate\b/i);
	const isUnknownWater = hasXNearOption(text, /\bWater\s*:\s*/i, /\bUnknown\b/i);

	// Gas / Electricity (Yes/No) - constrain to label column to avoid bleeding into next label on same line
	const isGasSupply =
		yesNoInColumnAfterLabel(text, /\bGas\b/i) ??
		yesNoOnSameLine(text, /\bGas\b/i) ??
		pickYesNo(text, /\bGas\b/i);
	const isElectricitySupply =
		yesNoInColumnAfterLabel(text, /\bElectricity\b/i) ??
		yesNoOnSameLine(text, /\bElectricity\b/i) ??
		pickYesNo(text, /\bElectricity\b/i);

	// Central heating
	const isCentralHeating = yesNoOnSameLine(text, /\bCentral\s+Heating\b/i) ?? pickYesNo(text, /\bCentral\s+Heating\b/i);
	const centralHeatingType = pickCentralHeatingType(text);

	// Drainage
	const isMainDrainage = hasXNearOption(text, /\bMains\s+drainage\b/i, /\bMains\s+drainage\b/i);
	const isSepticTankPlant = hasXNearOption(text, /\bMains\s+drainage\b/i, /Septic\s+tank\/Cesspit\/Treatment\s+Plant/i);
	const isUnknownDrainage = hasXNearOption(text, /\bMains\s+drainage\b/i, /\bUnknown\b/i);

	// Panels / Access / Road
	const isSolarPanels =
		yesNoInColumnAfterLabel(text, /\bSolar\s+panels\b/i) ??
		yesNoOnSameLine(text, /\bSolar\s+panels\b/i) ??
		pickYesNo(text, /\bSolar\s+panels\b/i);
	const isSharedAccess =
		yesNoInColumnAfterLabel(text, /\bShared\s+access\b/i) ??
		yesNoOnSameLine(text, /\bShared\s+access\b/i) ??
		pickYesNo(text, /\bShared\s+access\b/i);
	const isRoadAdopted =
		yesNoInColumnAfterLabel(text, /\bRoad\s+Adopted\b/i) ??
		yesNoOnSameLine(text, /\bRoad\s+Adopted\b/i) ??
		pickYesNo(text, /\bRoad\s+Adopted\b/i);

	// Easements / rights of way
	const easementStartIdx = text.search(/Any\s+easements\s+or\s+rights\s+of\s+way/i);
	const easementSeg = easementStartIdx !== -1 ? text.slice(easementStartIdx, easementStartIdx + 600) : "";
	let isHasEasementsOrRightsOfWay = null;
	if (easementSeg) {
		if (/\bYes\b[^A-Za-z0-9]{0,10}X\b/i.test(easementSeg)) isHasEasementsOrRightsOfWay = true;
		else if (/\bNo\b[^A-Za-z0-9]{0,10}X\b/i.test(easementSeg)) isHasEasementsOrRightsOfWay = false;
	}
	let easementsOrRightsDetails = null;
	if (isHasEasementsOrRightsOfWay === true) {
		let detailsSeg = "";
		if (easementStartIdx !== -1) {
			const after = text.slice(easementStartIdx);
			const m = after.match(/If\s+Yes,\s*please\s*provide\s*details/i);
			if (m) {
				const idx = m.index + m[0].length;
				detailsSeg = after.slice(idx, idx + 400);
			}
		}
		if (detailsSeg) {
			// take next non-empty line (without leading bullets) as detail
			const lines = detailsSeg.split("\n").map(s => s.trim());
			for (let i = 1; i < Math.min(lines.length, 6); i++) {
				const ln = lines[i];
				if (!ln) continue;
				// skip repeated labels
				if (/^If\s+Yes/i.test(ln)) continue;
				// skip lines that look like other labels (contain colon)
				if (/:/.test(ln)) continue;
				easementsOrRightsDetails = ln.replace(/^\-\s*/, "");
				break;
			}
		}
	}

	// Separate services for flats
	const separate = pickServicesSeparate(text);

	return {
		isMainsWater,
		isPrivateWater,
		isUnknownWater,
		isGasSupply,
		isElectricitySupply,
		isCentralHeating,
		centralHeatingType,
		isMainDrainage,
		isSepticTankPlant,
		isUnknownDrainage,
		isSolarPanels,
		isSharedAccess,
		isRoadAdopted,
		isHasEasementsOrRightsOfWay,
		easementsOrRightsDetails,
		servicesSeparateForFlats: separate.value,
		servicesSeparateDetails: separate.details || null
	};
}

module.exports = { mapServices };


