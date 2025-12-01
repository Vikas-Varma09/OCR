function normalize(text) {
	return String(text || "").replace(/\r/g, "").replace(/\t/g, " ").replace(/[ \u00A0]+/g, " ");
}

function pickInt(line) {
	const m = String(line).match(/-?\d+/);
	return m ? parseInt(m[0], 10) : null;
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
		if (hall === null && /\bhall\b/.test(l)) hall = pickInt(line);
		if (livingRooms === null && /(living\s*rooms?|livingrooms?)/i.test(line)) livingRooms = pickInt(line);
		if (kitchen === null && /\bkitchen\b/i.test(line)) kitchen = pickInt(line);
		if (bedrooms === null && /\bbedrooms?\b/i.test(line)) bedrooms = pickInt(line);
		if (bathrooms === null && /\bbathrooms?\b/i.test(line)) bathrooms = pickInt(line);
		if (utility === null && /\butility\b/i.test(line)) utility = pickInt(line);
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


