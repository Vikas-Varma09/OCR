const { mapEssentialRepairs } = require("../src/mappers/essentialRepairs.mapper");

describe("mapEssentialRepairs", () => {
	test("maps No for both essential repairs and re-inspection", () => {
		const raw = [
			"ESSENTIAL REPAIRS",
			"Are there any essential repairs required?                 Yes          No   X",
			"ENERGY EFFICIENCY",
			"Is re-inspection required?                                Yes          No   X"
		].join("\n");

		const r = mapEssentialRepairs(raw);
		expect(r).toEqual({
			isEssentialRepairsRequired: false,
			essentialRepairsDetails: null,
			isReinspectionRequired: false
		});
	});

	test("handles missing block with nulls", () => {
		expect(mapEssentialRepairs("")).toEqual({
			isEssentialRepairsRequired: null,
			essentialRepairsDetails: null,
			isReinspectionRequired: null
		});
	});
});


