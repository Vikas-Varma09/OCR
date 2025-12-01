function mapConditionsOfProperty(rawText) {
	return {
		isStructuralMovement: null,
		isStructuralMovementHistoricOrNonProgressive: null,
		structuralMovementDetails: "",
		isStructuralModifications: null,
		structuralModificationsDetails: null,
		communalAreasMaintained: null,
		propertyProneTo: null,
		isPlotBoundariesDefinedUnderPointFourHectares: null,
		isTreesWithinInfluencingDistance: null,
		treesInfluenceDetails: null,
		isBuiltOnSteepSlope: null,
		steepSlopeDetails: null
	};
}

module.exports = { mapConditionsOfProperty };


