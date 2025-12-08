function normalize(text) {
	return String(text || "").replace(/\r/g, "").replace(/\t/g, " ").replace(/\u00A0/g, " ");
}

function windowAfter(text, labelRegex, span = 300) {
	const idx = text.search(labelRegex);
	if (idx === -1) return "";
	return text.slice(idx, idx + span);
}

function windowBetween(text, startRegex, endRegex, maxSpan = 600) {
	const startIdx = text.search(startRegex);
	if (startIdx === -1) return "";
	const after = text.slice(startIdx);
	const m = after.match(endRegex);
	const endIdx = m ? m.index : Math.min(maxSpan, after.length);
	return after.slice(0, endIdx);
}

function hasXForOption(seg, optionRegex, lookahead = 36) {
	const m = seg.match(optionRegex);
	if (!m) return false;
	const tail = seg.slice(m.index + m[0].length, m.index + m[0].length + lookahead);
	return /\bX\b/.test(tail);
}

function markOptionsWithX(seg, optionRegexes) {
	const indices = optionRegexes.map((re) => {
		const m = seg.match(re);
		return m ? m.index : -1;
	});
	const results = optionRegexes.map(() => false);
	const xPositions = [];
	let m;
	const xRegex = /X/g;
	while ((m = xRegex.exec(seg)) !== null) {
		xPositions.push(m.index);
	}
	if (!xPositions.length) return results;
	for (const xPos of xPositions) {
		let bestIdx = -1;
		let bestPos = -1;
		for (let i = 0; i < indices.length; i++) {
			const pos = indices[i];
			if (pos !== -1 && pos <= xPos && pos > bestPos) {
				bestPos = pos;
				bestIdx = i;
			}
		}
		if (bestIdx !== -1) results[bestIdx] = true;
	}
	return results;
}

function markMultiOptionsWithX(seg, optionRegexes) {
	const indices = optionRegexes.map((re) => {
		const m = seg.match(re);
		return m ? m.index : -1;
	});
	const results = optionRegexes.map(() => false);
	const xPositions = [];
	let m;
	const xRegex = /X/g;
	while ((m = xRegex.exec(seg)) !== null) {
		xPositions.push(m.index);
	}
	for (const xPos of xPositions) {
		let bestIdx = -1;
		let bestPos = -1;
		for (let i = 0; i < indices.length; i++) {
			const pos = indices[i];
			if (pos !== -1 && pos <= xPos && pos > bestPos) {
				bestPos = pos;
				bestIdx = i;
			}
		}
		if (bestIdx !== -1) results[bestIdx] = true;
	}
	return results;
}

function markOptionsWithXProximity(seg, optionRegexes, maxDistance = 28) {
	const results = optionRegexes.map(() => false);
	const lines = String(seg || "").split("\n");
	for (const raw of lines) {
		const line = String(raw || "");
		const xPositions = [];
		let m;
		const xRe = /X/g;
		while ((m = xRe.exec(line)) !== null) xPositions.push(m.index);
		if (!xPositions.length) continue;
		const labelPositions = optionRegexes.map((re) => {
			const lm = line.match(re);
			return lm ? lm.index : -1;
		});
		for (const xPos of xPositions) {
			let bestIdx = -1;
			let bestDist = Infinity;
			for (let i = 0; i < labelPositions.length; i++) {
				const lp = labelPositions[i];
				if (lp === -1) continue;
				const dist = xPos - lp;
				if (dist >= 0 && dist <= maxDistance && dist < bestDist) {
					bestDist = dist;
					bestIdx = i;
				}
			}
			if (bestIdx !== -1) results[bestIdx] = true;
		}
	}
	return results;
}

function markOptionsWithXTwoLines(line1, line2, optionRegexes, maxDistance = 28) {
	const results = optionRegexes.map(() => false);
	const l1 = String(line1 || "");
	const l2 = String(line2 || "");

	// Check on line1 proximity
	const fromL1 = markOptionsWithXProximity(l1, optionRegexes, maxDistance);
	for (let i = 0; i < results.length; i++) results[i] = results[i] || fromL1[i];

	// Map X positions on line2 to nearest option label position on line1
	const labelPositions = optionRegexes.map((re) => {
		const m = l1.match(re);
		return m ? m.index : -1;
	});
	const xPositions = [];
	let m;
	const xr = /X/g;
	while ((m = xr.exec(l2)) !== null) xPositions.push(m.index);
	for (const xp of xPositions) {
		let bestIdx = -1;
		let bestDist = Infinity;
		for (let i = 0; i < labelPositions.length; i++) {
			const lp = labelPositions[i];
			if (lp === -1) continue;
			const dist = Math.abs(xp - lp);
			if (dist <= maxDistance && dist < bestDist) {
				bestDist = dist;
				bestIdx = i;
			}
		}
		if (bestIdx !== -1) results[bestIdx] = true;
	}
	return results;
}

function pickYesNo(text, startRegex, span = 200) {
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
	const endIdx = m ? m.index : Math.min(260, after.length);
	const seg = after.slice(0, endIdx);
	if (/\bYes\b[^A-Za-z0-9]{0,80}X\b/i.test(seg)) return true;
	if (/\bNo\b[^A-Za-z0-9]{0,80}X\b/i.test(seg)) return false;
	return null;
}

function yesNoFromLine(text, labelRegex) {
	const lines = String(text || "").split("\n");
	for (const raw of lines) {
		const line = String(raw || "");
		const m = line.match(labelRegex);
		if (!m) continue;
		const tail = line.slice(m.index + m[0].length);
		if (/\bNo\b[^A-Za-z0-9]{0,80}X\b/i.test(tail)) return false;
		if (/\bYes\b[^A-Za-z0-9]{0,80}X\b/i.test(tail)) return true;
		return null;
	}
	return null;
}

function mapLocalityAndDemand(rawText) {
	const text = normalize(rawText);

	// Location
	{
		const seg = windowBetween(text, /Is\s+location\s*:/i, /Market\s+Appeal\s*:/i, 300);
		if (seg) {
			const [u, s, r] = markOptionsWithXProximity(seg, [/\bUrban\b/i, /\bSuburban\b/i, /\bRural\b/i]);
			var isUrban = u;
			var isSuburban = s;
			var isRural = r;
		} else {
			var isUrban = null, isSuburban = null, isRural = null;
		}
	}

	// Market Appeal
	{
		const seg = windowBetween(text, /Market\s+Appeal\s*:/i, /Are\s+surrounding\s+properties\s*:/i, 400);
		if (seg) {
			const [g, a, p] = markOptionsWithXProximity(seg, [/\bGood\b/i, /\bAverage\b/i, /\bPoor\b/i]);
			var isGoodMarketAppeal = g;
			var isAverageMarketAppeal = a;
			var isPoorMarketAppeal = p;
		} else {
			var isGoodMarketAppeal = null, isAverageMarketAppeal = null, isPoorMarketAppeal = null;
		}
	}

	// Surrounding properties: Owner / Residential / Let / Commercial
	{
		const seg = windowBetween(text, /Are\s+surrounding\s+properties\s*:/i, /Are\s+property\s+prices\s+in\s+the\s+area\s*:/i, 600);
		// These blocks are often columnar; look for X near the word across the block
		if (seg) {
			const lines = seg.split("\n");
			let idx = 0;
			while (idx < lines.length && !/\bOwner\b|\bResidential\b|\bLet\b|\bCommercial\b/i.test(lines[idx] || "")) {
				idx++;
			}
			const l1 = lines[idx] || "";
			const l2 = lines[idx + 1] || "";
			const l3 = lines[idx + 2] || "";
			// Determine label columns: Owner, Let (prefer 'Let' else fallback to 'Residential'), Commercial
			const ownerPosM = l1.match(/\bOwner\b/i);
			const letPosM = (l1.match(/\bLet\b/i) || l2.match(/\bLet\b/i) || l1.match(/\bResidential\b/i) || l2.match(/\bResidential\b/i));
			const commPosM = (l1.match(/\bCommercial\b/i) || l2.match(/\bCommercial\b/i) || l3.match(/\bCommercial\b/i));
			const ownerPos = ownerPosM ? ownerPosM.index : -1;
			const letPos = letPosM ? letPosM.index : -1;
			const commPos = commPosM ? commPosM.index : -1;

			const xPositions = [];
			let xm;
			const xr = /X/g;
			while ((xm = xr.exec(l2)) !== null) xPositions.push(xm.index);
			while ((xm = xr.exec(l3)) !== null) xPositions.push(xm.index);

			let isOwnerResidential = false;
			let isResidentialLet = false;
			let isCommercial = false;
			for (const xp of xPositions) {
				const distances = [
					ownerPos !== -1 ? Math.abs(xp - ownerPos) : Infinity,
					letPos !== -1 ? Math.abs(xp - letPos) : Infinity,
					commPos !== -1 ? Math.abs(xp - commPos) : Infinity
				];
				// Prefer Let if within a reasonable tolerance, else nearest
				const minDist = Math.min(...distances);
				if (!isFinite(minDist)) continue;
				const tol = 12;
				if (distances[1] - minDist <= tol) {
					isResidentialLet = true;
				} else {
					const bestIdx = distances.indexOf(minDist);
					if (bestIdx === 0) isOwnerResidential = true;
					else if (bestIdx === 2) isCommercial = true;
				}
			}
			// Fallback heuristic: some layouts put an isolated 'X' line under the 'Residential' column which actually indicates 'Let'
			if (isResidentialLet === false) {
				const xOnlyIdx = lines.findIndex((ln) => /^\s*X\s*$/.test(String(ln || "")));
				if (xOnlyIdx !== -1) {
					// Look up a few lines for a standalone 'Residential' label line and presence of 'Let' on header
					const header = l1;
					const prev = lines[Math.max(0, xOnlyIdx - 1)] || "";
					if (/\bLet\b/i.test(header) && /\bResidential\b/i.test(prev) && !/\bOwner\b|\bCommercial\b/i.test(prev)) {
						isResidentialLet = true;
						isOwnerResidential = false;
					}
				}
			}
			var isOwnerResidentialVar = isOwnerResidential;
			var isResidentialLetVar = isResidentialLet;
			var isCommercialVar = isCommercial;
		} else {
			var isOwnerResidentialVar = null, isResidentialLetVar = null, isCommercialVar = null;
		}
	}

	// Property prices in the area
	{
		const seg = windowBetween(text, /Are\s+property\s+prices\s+in\s+the\s+area\s*:/i, /Is\s+demand\s+for\s+this\s+type\s+of\s+property\s*:/i, 400);
		if (seg) {
			const [r, s, f] = markOptionsWithXProximity(seg, [/\bRising\b/i, /\bStatic\b/i, /\bFalling\b/i]);
			var isPricesRising = r;
			var isPricesStatic = s;
			var isPricesFalling = f;
		} else {
			var isPricesRising = null, isPricesStatic = null, isPricesFalling = null;
		}
	}

	// Demand for this type of property
	{
		const seg = windowBetween(text, /Is\s+demand\s+for\s+this\s+type\s+of\s+property\s*:/i, /Is\s+the\s+property\s+likely\s+to\s+be\s+affected/i, 400);
		if (seg) {
			const [r, s, f] = markOptionsWithXProximity(seg, [/\bRising\b/i, /\bStatic\b/i, /\bFalling\b/i]);
			var isDemandRising = r;
			var isDemandStatic = s;
			var isDemandFalling = f;
		} else {
			var isDemandRising = null, isDemandStatic = null, isDemandFalling = null;
		}
	}

	// Compulsory purchase or clearance
	const isAffectedByCompulsoryPurchase = pickYesNo(text, /compulsory\s+purchase\s+or\s+clearance\?/i);
	const compulsoryPurchaseDetails = null;

	// Vacant or boarded up properties nearby (two-line label)
	const isVacantOrBoardedPropertiesNearby =
		pickYesNoBetween(
			text,
			/Are\s+there\s+any\s+vacant\s+or\s+boarded\s+up/i,
			/Are\s+the\s+plot\s+boundaries/i
		) ?? pickYesNo(text, /vacant\s+or\s+boarded\s+up[\s\S]*properties\s+in\s+close\s+proximity\?/i);
	const vacantOrBoardedDetails = null;

	// Occupancy restriction possible
	const isOccupancyRestrictionPossible = pickYesNo(text, /possibility\s+of\s+occupancy\s+restriction\?/i);
	// scope within next question boundary if possible
	const isOccupancyRestrictionScoped =
		yesNoFromLine(text, /possibility\s+of\s+occupancy\s+restriction\?/i) ??
		pickYesNoBetween(text, /possibility\s+of\s+occupancy\s+restriction\?/i, /Are\s+the\s+plot\s+boundaries/i) ??
		pickYesNoBetween(text, /possibility\s+of\s+occupancy\s+restriction\?/i, /Is\s+the\s+property\s+close\s+to\s+any\s+high\s+voltage/i);
	const isOccupancyRestrictionFinal = isOccupancyRestrictionScoped ?? isOccupancyRestrictionPossible;
	const occupancyRestrictionDetails = null;

	// Close to high voltage equipment (two-line label; scope until next question)
	const isCloseToHighVoltageEquipment =
		pickYesNoBetween(
			text,
			/Is\s+the\s+property\s+close\s+to\s+any\s+high\s+voltage/i,
			/Is\s+the\s+property\s+built\s+on\s+a\s+steeply\s+sloping\s+site/i
		) ?? pickYesNo(text, /high\s+voltage[\s\S]*electrical\s+supply\s+equipment\?/i);
	const highVoltageEquipmentDetails = null;

	return {
		isUrban,
		isSuburban,
		isRural,
		isGoodMarketAppeal,
		isAverageMarketAppeal,
		isPoorMarketAppeal,
		isOwnerResidential: isOwnerResidentialVar,
		isResidentialLet: isResidentialLetVar,
		isCommercial: isCommercialVar,
		isPricesRising,
		isPricesStatic,
		isPricesFalling,
		isDemandRising,
		isDemandStatic,
		isDemandFalling,
		isAffectedByCompulsoryPurchase,
		compulsoryPurchaseDetails,
		isVacantOrBoardedPropertiesNearby,
		vacantOrBoardedDetails,
		isOccupancyRestrictionPossible: isOccupancyRestrictionFinal,
		occupancyRestrictionDetails,
		isCloseToHighVoltageEquipment,
		highVoltageEquipmentDetails
	};
}

module.exports = { mapLocalityAndDemand };


