function mapLocalityAndDemand(rawText) {
	return {
		isUrban: null,
		isSuburban: null,
		isRural: null,
		isGoodMarketAppeal: null,
		isAverageMarketAppeal: null,
		isPoorMarketAppeal: null,
		isOwnerResidential: null,
		isResidentialLet: null,
		isCommercial: null,
		isPricesRising: null,
		isPricesStatic: null,
		isPricesFalling: null,
		isDemandRising: null,
		isDemandStatic: null,
		isDemandFalling: null,
		isAffectedByCompulsoryPurchase: null,
		compulsoryPurchaseDetails: null,
		isVacantOrBoardedPropertiesNearby: null,
		vacantOrBoardedDetails: null,
		isOccupancyRestrictionPossible: null,
		occupancyRestrictionDetails: null,
		isCloseToHighVoltageEquipment: null,
		highVoltageEquipmentDetails: null
	};
}

module.exports = { mapLocalityAndDemand };


