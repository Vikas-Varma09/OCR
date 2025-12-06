const { mapValuationForFinancePurpose } = require("../src/mappers/valuationForFinancePurpose.mapper");

describe("mapValuationForFinancePurpose", () => {
	test("maps expected values from sample valuation block", () => {
		const raw = [
			"VALUATION FOR FINANCE PURPOSES",
			"Valuation to be provided on a comparative basis only",
			"Is the property suitable security for finance purposes? Yes     X   No",
			"",
			"Market Value in present condition                         275000",
			"Market Value after essential repairs/completion",
			"Purchase Price/",
			"Borrowers Estimated Value                                 282000",
			"Building Insurance Reinstatement Cost                     215000",
			"Is there anything in the valuer's opinion likely",
			"to cause a loading to the building insurance",
			"premium?                                                  Yes       No   X"
		].join("\n");

		const r = mapValuationForFinancePurpose(raw);
		expect(r).toEqual({
			valuationComparativeOnly: null,
			isSuitableForFinance: true,
			financeSuitabilityDetails: null,
			marketValuePresentCondition: 275000,
			marketValueAfterRepairs: null,
			purchasePriceOrBorrowerEstimate: 282000,
			buildingInsuranceReinstatementCost: 215000,
			isInsurancePremiumLoadingRisk: false,
			insurancePremiumLoadingDetails: null
		});
	});

	test("handles missing values returning nulls", () => {
		const r = mapValuationForFinancePurpose("");
		expect(r).toEqual({
			valuationComparativeOnly: null,
			isSuitableForFinance: null,
			financeSuitabilityDetails: null,
			marketValuePresentCondition: null,
			marketValueAfterRepairs: null,
			purchasePriceOrBorrowerEstimate: null,
			buildingInsuranceReinstatementCost: null,
			isInsurancePremiumLoadingRisk: null,
			insurancePremiumLoadingDetails: null
		});
	});
});


