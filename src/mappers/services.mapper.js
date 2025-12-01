function mapServices(rawText) {
	return {
		isMainsWater: null,
		isPrivateWater: null,
		isUnknownWater: null,
		isGasSupply: null,
		isElectricitySupply: null,
		isCentralHeating: null,
		centralHeatingType: null,
		isMainDrainage: null,
		isSepticTankPlant: null,
		isUnknownDrainage: null,
		isSolarPanels: null,
		isSharedAccess: null,
		isRoadAdopted: null,
		isHasEasementsOrRightsOfWay: null,
		easementsOrRightsDetails: null,
		servicesSeparateForFlats: "",
		servicesSeparateDetails: ""
	};
}

module.exports = { mapServices };


