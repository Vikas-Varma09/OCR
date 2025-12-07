const { mapReports } = require("../src/mappers/reports.mapper");

describe("mapReports", () => {
	test("maps X markers to true, others false", () => {
		const raw = [
			"REPORTS",
			"Timber/Damp                Mining                         Electrical",
			"Drains                     Structural Engineers           Arboricultural",
			"Mundic                     Wall Ties                      Roof",
			"Metalliferous              Sulfate (Red ash)              Other +",
			"",
			"Electrical X   Roof   X"
		].join("\n");

		const r = mapReports(raw);
		expect(r).toEqual({
			isTimberDamp: false,
			isMining: false,
			isElectrical: true,
			isDrains: false,
			isStructuralEngineers: false,
			isArboricultural: false,
			isMundic: false,
			isWallTies: false,
			isRoof: true,
			isMetalliferous: false,
			isSulfateRedAsh: false,
			isOtherReport: false,
			otherReportDetails: null
		});
	});

	test("all false when no X present", () => {
		const r = mapReports("Timber/Damp Mining Electrical");
		expect(Object.values(r).every(v => v === false || v === null)).toBe(true);
	});
});


