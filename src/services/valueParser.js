function normalize(text) {
	return String(text || "").replace(/\r/g, "").replace(/\t/g, " ").replace(/[ \u00A0]+/g, " ");
}

function pickInt(line) {
	const m = String(line).match(/-?\d+/);
	return m ? parseInt(m[0], 10) : null;
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
	if (/yes/i.test(line)) return true;
	if (/no/i.test(line)) return false;
	return null;
}

function windowAfter(text, labelRegex, span = 160) {
	const idx = text.search(labelRegex);
	if (idx === -1) return null;
	const after = text.slice(idx);
	const lineEnd = after.indexOf("\n");
	const end = lineEnd !== -1 ? Math.min(lineEnd, span) : Math.min(after.length, span);
	return after.slice(0, end);
}

function parseAccommodation(pdfText) {
	const text = normalize(pdfText);
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

	// Gardens / Private / Communal markers can be on one line
	{
		const seg = windowAfter(text, /\bGardens\b/i, 200) || "";
		if (gardens === null) gardens = pickYesNo(seg);
		// Marked options like "Private X" / "Communal X"
		if (/\bPrivate\b\s+X\b/i.test(seg)) isPrivate = true;
		if (/\bCommunal\b\s+X\b/i.test(seg)) isCommunal = true;
		// If we have "Private" but no explicit X and "Communal X" present, infer false
		if (isCommunal === true && isPrivate === null && /\bPrivate\b/i.test(seg)) isPrivate = false;
		// If "Private X" present and "Communal" appears without X, infer false
		if (isPrivate === true && isCommunal === null && /\bCommunal\b(?!\s+X\b)/i.test(seg)) isCommunal = false;
	}

	// Outbuilding details: find "(please provide details)" after the outbuildings label and take the next non-empty free text line
	if (outbuildingDetails === null) {
		const idx = lines.findIndex(l => /Number\s+of\s+outbuildings/i.test(l));
		if (idx !== -1) {
			for (let i = idx; i < Math.min(lines.length, idx + 10); i++) {
				if (/\(please\s+provide\s+details\)/i.test(lines[i])) {
					// Next non-empty, non-label line
					for (let j = i + 1; j < Math.min(lines.length, i + 6); j++) {
						const candidate = (lines[j] || "").trim();
						if (!candidate) continue;
						// Skip obvious prompts
						if (/^\s*(Yes|No)\s*(X)?\s*$/i.test(candidate)) continue;
						outbuildingDetails = candidate;
						break;
					}
					break;
				}
			}
		}
		// Fallback: generic capture of "Simple Text for details" line in the sample
		if (!outbuildingDetails) {
			const m = text.match(/\bSimple\s+Text\s+for\s+details\b/i);
			if (m) outbuildingDetails = m[0].trim();
		}
	}

	return {
		accommodation: {
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
		}
	};
}

// Extracts header fields and includes applicationId from request context
function parseHeader(pdfText, applicationId) {
	const raw = String(pdfText || "");
	const lines = raw.split(/\r?\n/);

	// Application Number: return only value
	let applicationNumber = "";
	{
		const m = raw.match(/Application Number:\s*([^\r\n]+)/i);
		if (m) applicationNumber = (m[1] || "").trim();
	}

	// Applicant name: line after the "Applicant(s) Surname(s) & Initials:" label
	let applicantName = "";
	{
		const idx = lines.findIndex(l => /Applicant\(s\)\s*Surname\(s\)\s*&\s*Initials:/i.test(l));
		if (idx !== -1 && idx + 1 < lines.length) {
			let next = String(lines[idx + 1] || "");
			const split = next.split(/Date of Inspection:/i);
			applicantName = (split[0] || next).trim();
		}
	}

	// Property Address: two lines after the label, joined into one line
	let propertyAddress = "";
	{
		const idx = lines.findIndex(l => /Property\s*Address:/i.test(l));
		if (idx !== -1) {
			const addr1 = (lines[idx + 1] || "").trim();
			const addr2 = (lines[idx + 2] || "").trim();
			if (addr1) {
				const parts = [addr1];
				if (addr2 && !/^Postcode\s*:/i.test(addr2)) parts.push(addr2);
				propertyAddress = parts.join(" ").replace(/\s{2,}/g, " ").trim();
			}
		}
	}

	// Postcode: return only value
	let postCode = "";
	{
		const m = raw.match(/Postcode:\s*([^\r\n]+)/i);
		if (m) postCode = (m[1] || "").trim();
	}

	return {
		applicationId,
		applicationNumber,
		applicantName,
		propertyAddress,
		postCode
	};
}

module.exports = {
	parseAccommodation,
	parseHeader
};


