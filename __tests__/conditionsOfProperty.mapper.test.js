const { mapConditionsOfProperty } = require("../src/mappers/conditionsOfProperty.mapper");

describe("mapConditionsOfProperty", () => {
	test("maps fields from sample block", () => {
		const raw = [
			"CONDITION OF PROPERTY",
			"Is there any evidence of past or ongoing structural",
			"movement to the property?                           Yes                    No   X",
			"If Yes, is this historic or non progressive?              Yes    X     No",
			"Have any structural modifications been effected to",
			"the original building of which we as lenders should",
			"be aware?                                           Yes                    No   X",
			"If internal or external communal areas exist have they",
			"been maintained to a satisfactory standard             Yes           X     No",
			"Is there any evidence of or is the property prone to:",
			"Flooding    X      Subsidence                     Heave   X          Landslip   X",
			"Are the plot boundaries well defined and the total",
			"below 0.4 hectares? (1 acre)                                  Yes    X     No",
			"Are there any trees within influencing distance",
			"of the property?                                              Yes          No   X",
			"Is the property built on a steeply sloping site?          Yes          No   X"
		].join("\n");

		const m = mapConditionsOfProperty(raw);
		expect(m).toEqual({
			isStructuralMovement: false,
			isStructuralMovementHistoricOrNonProgressive: true,
			structuralMovementDetails: null,
			isStructuralModifications: false,
			structuralModificationsDetails: null,
			communalAreasMaintained: true,
			propertyProneTo: {
				flooding: true,
				subsidence: false,
				heave: true,
				landslip: true
			},
			isPlotBoundariesDefinedUnderPointFourHectares: true,
			isTreesWithinInfluencingDistance: false,
			treesInfluenceDetails: null,
			isBuiltOnSteepSlope: false,
			steepSlopeDetails: null
		});
	});

	test("returns nulls on missing input", () => {
		const m = mapConditionsOfProperty("");
		expect(m.isStructuralMovement).toBeNull();
		expect(m.propertyProneTo.flooding).toBeNull();
		expect(m.isBuiltOnSteepSlope).toBeNull();
	});
});


