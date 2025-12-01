function mapValuationForFinancePurpose(rawText) {
	return {
		valuationComparativeOnly: null,
		isSuitableForFinance: null,
		financeSuitabilityDetails: "",
		marketValuePresentCondition: null,
		marketValueAfterRepairs: null,
		purchasePriceOrBorrowerEstimate: null,
		buildingInsuranceReinstatementCost: null,
		isInsurancePremiumLoadingRisk: null,
		insurancePremiumLoadingDetails: null
	};
}

module.exports = { mapValuationForFinancePurpose };


