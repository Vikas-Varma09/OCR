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

function parseAccommodation(pdfText) {
	const text = normalize(pdfText);
	const lines = text.split("\n").map(s => s.trim()).filter(Boolean);

	let hall = null;
	let livingRooms = null;
	let kitchen = null;
	let bedrooms = null;
	let bathrooms = null;
	let utility = null;
	let isLiftPresent = null;

	for (const line of lines) {
		const l = line.toLowerCase();
		if (hall === null && /\bhall\b/.test(l)) hall = pickIntAfterLabel(line, /\bHall\b\s*/i);
		if (livingRooms === null && /(living\s*rooms?|livingrooms?)/i.test(line)) livingRooms = pickIntAfterLabel(line, /(Living\s*Rooms?)/i);
		if (kitchen === null && /\bkitchen\b/i.test(line)) kitchen = pickIntAfterLabel(line, /\bKitchen\b\s*/i);
		if (bedrooms === null && /\bbedrooms?\b/i.test(line)) bedrooms = pickIntAfterLabel(line, /\bBedrooms?\b\s*/i);
		if (bathrooms === null && /\bbathrooms?\b/i.test(line)) bathrooms = pickIntAfterLabel(line, /\bBathrooms?\b\s*/i);
		if (utility === null && /\butility\b/i.test(line)) utility = pickIntAfterLabel(line, /\bUtility\b\s*/i);
		if (isLiftPresent === null && /\blift\b/i.test(line)) isLiftPresent = pickYesNo(line);
	}

	return {
		accommodation: {
			hall,
			livingRooms,
			kitchen,
			bedrooms,
			bathrooms,
			utility,
			isLiftPresent
		}
	};
}

module.exports = {
	parseAccommodation
};


