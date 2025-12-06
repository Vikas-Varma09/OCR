const { mapRentalInformation } = require("../src/mappers/rentalInformation.mapper");

describe("mapRentalInformation", () => {
	test("maps fields from rental information block", () => {
		const raw = [
			"Is there rental demand for a property of this type",
			"in the locality?                                             Yes     X     No",
			"",
			"Monthly market rent sustainable assuming",
			"let on a 6/12 month AST basis, with the                             0                         Market Value in present condition                         0",
			"property in its present condition?",
			"Monthly market rent sustainable assuming",
			"let on a 6/12 month AST basis, with the",
			"                                                                    2000                      Borrowers Estimated Value                                 390150",
			"property in an improved condition and",
			"after any essential repairs?",
			"Any other matters which may have an impact",
			"on the ongoing demand for residential letting                Yes           No    X",
			"Is the demand for this property only",
			"on an investor to investor basis?                            Yes           No    X"
		].join("\n");

		const r = mapRentalInformation(raw);
		expect(r).toEqual({
			isRentalDemandInLocality: true,
			rentalDemandDetails: null,
			monthlyMarketRentPresentCondition: 0,
			monthlyMarketRentImprovedCondition: 2000,
			isOtherLettingDemandFactors: false,
			otherLettingDemandDetails: null,
			investorOnlyDemand: false,
			investorOnlyDemandDetails: null
		});
	});

	test("handles missing input with nulls", () => {
		expect(mapRentalInformation("")).toEqual({
			isRentalDemandInLocality: null,
			rentalDemandDetails: null,
			monthlyMarketRentPresentCondition: null,
			monthlyMarketRentImprovedCondition: null,
			isOtherLettingDemandFactors: null,
			otherLettingDemandDetails: null,
			investorOnlyDemand: null,
			investorOnlyDemandDetails: null
		});
	});
});


