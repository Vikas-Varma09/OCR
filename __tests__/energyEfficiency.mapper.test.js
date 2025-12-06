const { mapEnergyEfficiency } = require("../src/mappers/energyEfficiency.mapper");

describe("mapEnergyEfficiency", () => {
	test("picks 'None' with X and EPC score", () => {
		const raw = [
			"ENERGY EFFICIENCY",
			"EPC Rating:             A               B             C            D",
			"    E              F                G            Exempt                 None        X",
			"Is re-inspection required?                                Yes          No   X",
			"EPC Score              1"
		].join("\n");
		const r = mapEnergyEfficiency(raw);
		expect(r).toEqual({ epcRating: "None", epcScore: 1 });
	});

	test("picks letter option with X and EPC score", () => {
		const raw = [
			"EPC Rating:               A               B   X         C            D",
			"    E                F                G            Exempt                 None",
			"EPC Score                83"
		].join("\n");
		const r = mapEnergyEfficiency(raw);
		expect(r).toEqual({ epcRating: "B", epcScore: 83 });
	});

	test("nulls when missing", () => {
		expect(mapEnergyEfficiency("")).toEqual({ epcRating: null, epcScore: null });
	});
});


