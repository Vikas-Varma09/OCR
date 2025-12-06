const fs = require("fs");
const path = require("path");
const {
	mapAccommodation,
	mapPropertyType,
	mapNewBuild,
	mapCurrentOccupency,
	mapConstruction,
	mapLocalityAndDemand,
	mapServices,
	mapEnergyEfficiency,
	mapEssentialRepairs,
	mapReports,
	mapPropertyProneTo,
	mapConditionsOfProperty,
	mapRentalInformation,
	mapValuationForFinancePurpose,
	mapValuersDeclaration
} = require("../src/mappers");

function loadFixtures(dir, onlyName) {
	const rawDir = path.join(dir, "raw");
	if (!fs.existsSync(rawDir)) return [];
	let files = fs.readdirSync(rawDir).filter(f => f.toLowerCase().endsWith(".txt"));
	if (onlyName) {
		files = files.filter(f => path.basename(f, ".txt").toLowerCase() === String(onlyName).toLowerCase());
	}
	return files.map(file => ({
		name: path.basename(file, ".txt"),
		rawPath: path.join(rawDir, file),
		expectedPath: path.join(dir, "expected", path.basename(file, ".txt") + ".json")
	}));
}

function readRawTextWithFallback(rawPath) {
	const raw = fs.readFileSync(rawPath, "utf8");
	// If the fixture is a JSON-like fragment: "rawText": "...."
	if (/^\s*"rawText"\s*:/i.test(raw)) {
		try {
			const asJson = `{${raw}}`;
			const obj = JSON.parse(asJson);
			if (typeof obj.rawText === "string") {
				return obj.rawText;
			}
		} catch {}
		// Fallback: strip the leading key and unescape common sequences
		const m = raw.match(/"rawText"\s*:\s*"(.*)"/s);
		if (m && m[1]) {
			return m[1].replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n").replace(/\\t/g, "\t");
		}
	}
	return raw;
}

function runAllMappers(rawText) {
	return {
		accommodation: mapAccommodation(rawText),
		propertyType: mapPropertyType(rawText),
		currentOccupency: mapCurrentOccupency(rawText),
		newBuild: mapNewBuild(rawText),
		construction: mapConstruction(rawText),
		localityAndDemand: mapLocalityAndDemand(rawText),
		services: mapServices(rawText),
		conditionsOfProperty: mapConditionsOfProperty(rawText),
		reports: mapReports(rawText),
		energyEfficiency: mapEnergyEfficiency(rawText),
		essentialRepairs: mapEssentialRepairs(rawText),
		rentalInformation: mapRentalInformation(rawText),
		valuationForFinancePurpose: mapValuationForFinancePurpose(rawText),
		valuersDeclaration: mapValuersDeclaration(rawText)
	};
}

describe("Fixture-based mapper tests", () => {
	const fixturesRoot = path.join(__dirname, "fixtures");
	const only = process.env.FIXTURE;
	const skipExpected = /^1|true$/i.test(String(process.env.SKIP_EXPECTED || ""));
	const cases = loadFixtures(fixturesRoot, only);

	if (!cases.length) {
		test("no fixtures present (add .txt files under __tests__/fixtures/raw)", () => {
			expect(true).toBe(true);
		});
		return;
	}

	for (const fx of cases) {
		test(`maps '${fx.name}' without crashing`, () => {
			const rawText = readRawTextWithFallback(fx.rawPath);
			const out = runAllMappers(rawText);
			// Basic shape assertions
			expect(out).toBeTruthy();
			expect(out.accommodation).toBeTruthy();
			expect(out.propertyType).toBeTruthy();
		});

		if (!skipExpected) test(`matches expected subset when provided for '${fx.name}'`, () => {
			if (!fs.existsSync(fx.expectedPath)) {
				return;
			}
			const rawText = readRawTextWithFallback(fx.rawPath);
			const expected = JSON.parse(fs.readFileSync(fx.expectedPath, "utf8"));
			const out = runAllMappers(rawText);

			// Allow expected to be a subset. For each top-level key provided, match subset.
			for (const [section, exp] of Object.entries(expected)) {
				expect(out[section]).toMatchObject(exp);
			}
		});
	}
});


