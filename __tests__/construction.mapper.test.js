const { mapConstruction } = require("../src/mappers/construction.mapper");

describe("mapConstruction", () => {
	test("maps construction fields with start/end anchors", () => {
		const raw = [
			"Is the property of standard construction:                  Yes    X    No",
			"If non-standard construction specify name of system or type:",
			"If Yes please state % in commercial use                               X                         Non- standard text",
			"Main Walls:         Masonry",
			"Main Roof:          Tile",
			"Garage:             Is there",
			"Outbuildings:       not there",
			"Are there any alterations or extensions?                   Yes         No       X",
			"Did the alterations require Building Regs or Planning Consents?      Yes    X    No",
			"Age of any alterations or extensions?                                 12    Years"
		].join("\n");

		const r = mapConstruction(raw);
		expect(r).toEqual({
			isStandardConstruction: true,
			nonStandardConstructionType: "Non- standard text",
			mainWalls: "Masonry",
			mainRoof: "Tile",
			garageConstruction: "Is there",
			outbuildingsConstruction: "not there",
			isHasAlterationsOrExtensions: false,
			isAlterationsRequireConsents: true,
			alterationsAge: 12
		});
	});

	test("returns nulls when data not present", () => {
		const r = mapConstruction("");
		expect(r).toEqual({
			isStandardConstruction: null,
			nonStandardConstructionType: null,
			mainWalls: null,
			mainRoof: null,
			garageConstruction: null,
			outbuildingsConstruction: null,
			isHasAlterationsOrExtensions: null,
			isAlterationsRequireConsents: null,
			alterationsAge: null
		});
	});
});


