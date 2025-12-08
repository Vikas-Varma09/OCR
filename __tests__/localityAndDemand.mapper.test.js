const { mapLocalityAndDemand } = require("../src/mappers/localityAndDemand.mapper");

describe("mapLocalityAndDemand", () => {
	test("maps expected fields from sample locality/demand block", () => {
		const raw = [
			"LOCALITY & DEMAND",
			"Is location:          Urban    X            Suburban            Rural",
			"Market Appeal: Good            X            Average             Poor",
			"Are surrounding properties:",
			"Owner                                     Residential                             Let",
			"                                               X",
			"                                                                       Commercial",
			"Are property prices in the area:",
			"                      Rising                Static        X     Falling",
			"Is demand for this type of property:",
			"                      Rising                Static        X     Falling",
			"Is the property likely to be affected by",
			"compulsory purchase or clearance?                             Yes             No       X",
			"Are there any vacant or boarded up",
			"properties in close proximity?                                Yes             No       X",
			"Is there a possibility of occupancy restriction?              Yes             No       X",
			"Is the property close to any high voltage",
			"electrical supply equipment?                                  Yes       X     No"
		].join("\n");

		const m = mapLocalityAndDemand(raw);
		expect(m).toEqual({
			isUrban: true,
			isSuburban: false,
			isRural: false,
			isGoodMarketAppeal: true,
			isAverageMarketAppeal: false,
			isPoorMarketAppeal: false,
			isOwnerResidential: false,
			isResidentialLet: true,
			isCommercial: false,
			isPricesRising: false,
			isPricesStatic: true,
			isPricesFalling: false,
			isDemandRising: false,
			isDemandStatic: true,
			isDemandFalling: false,
			isAffectedByCompulsoryPurchase: false,
			compulsoryPurchaseDetails: null,
			isVacantOrBoardedPropertiesNearby: false,
			vacantOrBoardedDetails: null,
			isOccupancyRestrictionPossible: false,
			occupancyRestrictionDetails: null,
			isCloseToHighVoltageEquipment: true,
			highVoltageEquipmentDetails: null
		});
	});

	test("returns nulls when block missing", () => {
		const m = mapLocalityAndDemand("");
		expect(m.isUrban).toBeNull();
		expect(m.isPricesStatic).toBeNull();
		expect(m.isCloseToHighVoltageEquipment).toBeNull();
	});
});


