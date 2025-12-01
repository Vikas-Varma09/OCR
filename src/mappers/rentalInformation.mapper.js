function mapRentalInformation(rawText) {
	return {
		isRentalDemandInLocality: null,
		rentalDemandDetails: null,
		monthlyMarketRentPresentCondition: null,
		monthlyMarketRentImprovedCondition: null,
		isOtherLettingDemandFactors: null,
		otherLettingDemandDetails: null,
		investorOnlyDemand: null,
		investorOnlyDemandDetails: null
	};
}

module.exports = { mapRentalInformation };


