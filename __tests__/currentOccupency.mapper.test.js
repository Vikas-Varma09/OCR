const { mapCurrentOccupency } = require("../src/mappers/currentOccupency.mapper");

describe("mapCurrentOccupency", () => {
	test("maps expected fields from sample output block", () => {
		const raw = [
			"CURRENT OCCUPANCY",
			"Has the property ever been occupied?                       Yes    X    No",
			"How many adults appear to live in the property?                             3",
			"Does the property appear to be an HMO/Multi Unit",
			"Freehold Block?                                  Yes                   No       X",
			"If Yes, please provide details",
			"Tenure:        Freehold              Leasehold        X                                         Simple Text please",
			"Flying freehold Yes                  No   X               If Yes, what %     0.1              Does the property appear to",
			"be tenanted at present?                                    Yes    X    No"
		].join("\n");

		const r = mapCurrentOccupency(raw);
		expect(r).toEqual({
			isEverOccupied: true,
			numberOfAdultsInProperty: 3,
			isHmoOrMultiUnitFreeholdBlock: false,
			isCurrentlyTenanted: "Simple Text please",
			hmoOrMultiUnitDetails: true
		});
	});

	test("handles missing data returning nulls", () => {
		const r = mapCurrentOccupency("");
		expect(r).toEqual({
			isEverOccupied: null,
			numberOfAdultsInProperty: null,
			isHmoOrMultiUnitFreeholdBlock: null,
			isCurrentlyTenanted: null,
			hmoOrMultiUnitDetails: null
		});
	});
});


