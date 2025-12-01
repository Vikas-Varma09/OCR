function mapNewBuild(rawText) {
	return {
		isNewBuildOrRecentlyConverted: null,
		isCompleted: null,
		isUnderConstruction: null,
		isFinalInspectionRequired: null,
		isNhbcCert: null,
		isBuildZone: null,
		isPremier: null,
		isProfessionalConsultant: null,
		isOtherCert: null,
		otherCertDetails: null,
		isSelfBuildProject: null,
		isInvolvesPartExchange: null,
		isDisclosureOfIncentivesSeen: null,
		incentivesDetails: null,
		newBuildDeveloperName: null
	};
}

module.exports = { mapNewBuild };


