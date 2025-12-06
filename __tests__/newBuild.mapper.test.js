const { mapNewBuild } = require("../src/mappers/newBuild.mapper");

describe("mapNewBuild", () => {
	test("maps fields from sample block", () => {
		const raw = [
			"Is the Property New Build or Recently Converted? Yes                       No    X",
			"If New Build:              Completed       X           Under Construction",
			"Is Final Inspection Required?                                 Yes    X     No",
			"NHBC Cert      X Build Zone           Premier        Professional Consultant",
			"Age of any alterations or extensions?                                 12    Years",
			"Other",
			"If Other, please provide details",
			"   Other details",
			"Is this a Self-build project?                                 Yes          No      X",
			"Does this transaction involve an element of",
			" part exchange?                                                Yes          No      X",
			"Has a Disclosure of Incentives form been seen?                Yes    X     No",
			"If Yes, please provide details",
			" Including total value of incentives & if part exchange",
			"   Exchange test text",
			"If property is New Build, please provide the name of Developer:",
			"   Text for new build"
		].join("\n");

		const r = mapNewBuild(raw);
		expect(r).toEqual({
			isNewBuildOrRecentlyConverted: false,
			isCompleted: true,
			isUnderConstruction: false,
			isFinalInspectionRequired: true,
			isNhbcCert: true,
			isBuildZone: null,
			isPremier: null,
			isProfessionalConsultant: null,
			isOtherCert: null,
			otherCertDetails: "Other details",
			isSelfBuildProject: false,
			isInvolvesPartExchange: false,
			isDisclosureOfIncentivesSeen: true,
			incentivesDetails: "Exchange test text",
			newBuildDeveloperName: "Text for new build"
		});
	});

	test("handles missing data with nulls", () => {
		expect(mapNewBuild("")).toEqual({
			isNewBuildOrRecentlyConverted: null,
			isCompleted: false,
			isUnderConstruction: false,
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
		});
	});
});


