function normalize(text) {
	return String(text || "").replace(/\r/g, "").replace(/\t/g, " ").replace(/[ \u00A0]+/g, " ");
}

function pickIntAfterLabel(line, labelRegex) {
	const s = String(line);
	const m = s.match(labelRegex);
	if (!m) return null;
	const after = s.slice(m.index + m[0].length);
	const n = after.match(/-?\d+/);
	return n ? parseInt(n[0], 10) : null;
}

function pickYesNo(line) {
	if (/yes\b/i.test(line)) return true;
	if (/no\b/i.test(line)) return false;
	return null;
}

function windowAfter(text, labelRegex, span = 200) {
	const idx = text.search(labelRegex);
	if (idx === -1) return null;
	const after = text.slice(idx);
	const lineEnd = after.indexOf("\n");
	const end = lineEnd !== -1 ? Math.min(lineEnd, span) : Math.min(after.length, span);
	return after.slice(0, end);
}

function yesNoImmediateAfterLabel(text, labelRegex) {
	const idx = text.search(labelRegex);
	if (idx === -1) return null;
	const after = text.slice(idx);
	const lineEnd = after.indexOf("\n");
	const line = lineEnd !== -1 ? after.slice(0, lineEnd) : after;
	const m = labelRegex.exec(line);
	if (!m) return null;
	const tail = line.slice(m.index + m[0].length).trim();
	// Take first non-empty token only
	const firstToken = (tail.split(/\s+/)[0] || "").toLowerCase();
	if (firstToken === "yes") return true;
	if (firstToken === "no") return false;
	return null;
}

function extractBetween(text, startRegex, endRegex) {
	const startIdx = text.search(startRegex);
	if (startIdx === -1) return null;
	const fromStart = text.slice(startIdx);
	const endRel = fromStart.search(endRegex);
	const between = endRel !== -1 ? fromStart.slice(0, endRel) : fromStart;
	// Remove the start label phrase itself
	const startMatch = between.match(startRegex);
	const content = startMatch ? between.slice(startMatch.index + startMatch[0].length) : between;
	return content;
}

function cleanOutbuildingDetails(raw) {
	let s = String(raw || "").replace(/\r/g, "").replace(/\s+/g, " ").trim();
	if (!s) return "";
	// Drop leading common label fragments
	s = s.replace(/^(Converted\s*X?\s*)?/i, "").trim();
	s = s.replace(/^please\s*state\s*year\s*of\s*conversion\s*/i, "").trim();
	// If it starts with a likely year (4 digits), remove just that one occurrence
	s = s.replace(/^(?:19|20)\d{2}\s+/, "");
	// Remove any lingering separators
	s = s.replace(/^[:\-.,]\s*/, "");
	return s.trim();
}

function mapAccommodation(rawText) {
	const text = normalize(rawText);
	const lines = text.split("\n").map(s => s.trim());

	let hall = null;
	let livingRooms = null;
	let kitchen = null;
	let bedrooms = null;
	let bathrooms = null;
	let utility = null;
	let isLiftPresent = null;
	let separateWc = null;
	let basement = null;
	let garage = null;
	let parking = null;
	let gardens = null;
	let isPrivate = null;
	let isCommunal = null;
	let numberOfOutbuildings = null;
	let outbuildingDetails = null;
	let grossFloorAreaOfDwelling = null;

	for (const line of lines) {
		const l = line.toLowerCase();
		if (hall === null && /\bhall\b/.test(l)) hall = pickIntAfterLabel(line, /\bHall\b\s*/i);
		if (livingRooms === null && /(living\s*rooms?|livingrooms?)/i.test(line)) livingRooms = pickIntAfterLabel(line, /(Living\s*Rooms?)/i);
		if (kitchen === null && /\bkitchen\b/i.test(line)) kitchen = pickIntAfterLabel(line, /\bKitchen\b\s*/i);
		if (bedrooms === null && /\bbedrooms?\b/i.test(line)) bedrooms = pickIntAfterLabel(line, /\bBedrooms?\b\s*/i);
		if (bathrooms === null && /\bbathrooms?\b/i.test(line)) bathrooms = pickIntAfterLabel(line, /\bBathrooms?\b\s*/i);
		if (utility === null && /\butility\b/i.test(line)) utility = pickIntAfterLabel(line, /\bUtility\b\s*/i);
		if (isLiftPresent === null && /\blift\b/i.test(line)) isLiftPresent = pickYesNo(line);
		if (separateWc === null && /separate\s*wc/i.test(line)) separateWc = pickIntAfterLabel(line, /Separate\s*WC\s*/i);
		if (basement === null && /\bbasement\b/i.test(line)) basement = pickIntAfterLabel(line, /\bBasement\b\s*/i);
		if (garage === null && /\bgarage\b/i.test(line)) garage = pickIntAfterLabel(line, /\bGarage\b\s*/i);
		if (parking === null && /\bparking\b/i.test(line)) parking = pickIntAfterLabel(line, /\bParking\b\s*/i);
		if (numberOfOutbuildings === null && /number\s+of\s+outbuildings/i.test(line)) numberOfOutbuildings = pickIntAfterLabel(line, /Number\s+of\s+outbuildings\s*/i);
		if (grossFloorAreaOfDwelling === null && /gross\s*floor\s*area\s*of\s*dwelling/i.test(line)) {
			const n = pickIntAfterLabel(line, /Gross\s*floor\s*area\s*of\s*dwelling\s*/i);
			grossFloorAreaOfDwelling = Number.isFinite(n) ? n : null;
		}
	}

	// Gardens / Private / Communal (same-line markers)
	{
		const seg = windowAfter(text, /\bGardens\b/i, 240) || "";
		if (gardens === null) {
			// Prefer immediate token after "Gardens" to avoid matching the "If Yes" label
			const imm = yesNoImmediateAfterLabel(text, /\bGardens\b\s*/i);
			gardens = imm !== null ? imm : pickYesNo(seg);
		}
		if (/\bPrivate\b\s+X\b/i.test(seg)) isPrivate = true;
		if (/\bCommunal\b\s+X\b/i.test(seg)) isCommunal = true;
		if (isCommunal === true && isPrivate === null && /\bPrivate\b/i.test(seg)) isPrivate = false;
		if (isPrivate === true && isCommunal === null && /\bCommunal\b(?!\s+X\b)/i.test(seg)) isCommunal = false;
	}

	// Outbuilding details: look after "(please provide details)"
	{
		// Primary strategy: capture text between "please state year of conversion" and "Purpose Built"
		const between = extractBetween(text, /please\s*state\s*year\s*of\s*conversion/i, /Purpose\s*Built/i);
		if (between) {
			const cleaned = cleanOutbuildingDetails(between);
			if (cleaned) outbuildingDetails = cleaned;
		}
		// Secondary: look after "(please provide details)"
		if (!outbuildingDetails) {
			const detailsIdx = lines.findIndex(l => /\(please\s+provide\s+details\)/i.test(l));
			if (detailsIdx !== -1) {
				// Prefer explicit "Simple Text for details"
				for (let j = detailsIdx; j < Math.min(lines.length, detailsIdx + 6); j++) {
					const candidate = String(lines[j] || "");
					const m = candidate.match(/\bSimple\s+Text\s+for\s+details\b/i);
					if (m) {
						outbuildingDetails = m[0].trim();
						break;
					}
				}
				// If still not found, pick next non-label line
				if (!outbuildingDetails) {
					for (let j = detailsIdx + 1; j < Math.min(lines.length, detailsIdx + 6); j++) {
						const candidate = (lines[j] || "").trim();
						if (!candidate) continue;
						if (/^\s*(Yes|No)\s*(X)?\s*$/i.test(candidate)) continue;
						if (/^\s*(Converted|Purpose\s+Built)\b/i.test(candidate)) continue;
						outbuildingDetails = candidate;
						break;
					}
				}
			}
		}
		// Fallback global search
		if (!outbuildingDetails) {
			const m = text.match(/\bSimple\s+Text\s+for\s+details\b/i);
			if (m) outbuildingDetails = m[0].trim();
		}
	}

	return {
		hall,
		livingRooms,
		kitchen,
		bedrooms,
		bathrooms,
		utility,
		isLiftPresent,
		separateWc,
		basement,
		garage,
		parking,
		gardens,
		isPrivate,
		isCommunal,
		numberOfOutbuildings,
		outbuildingDetails,
		grossFloorAreaOfDwelling
	};
}

module.exports = { mapAccommodation };


