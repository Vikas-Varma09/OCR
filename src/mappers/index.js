const { mapPropertyType } = require("./propertyType.mapper");
const { mapAccommodation } = require("./accommodation.mapper");
const { mapNewBuild } = require("./newBuild.mapper");
const { mapCurrentOccupency } = require("./currentOccupency.mapper");
const { mapConstruction } = require("./construction.mapper");
const { mapLocalityAndDemand } = require("./localityAndDemand.mapper");
const { mapServices } = require("./services.mapper");
const { mapEnergyEfficiency } = require("./energyEfficiency.mapper");
const { mapEssentialRepairs } = require("./essentialRepairs.mapper");
const { mapReports } = require("./reports.mapper");
const { mapPropertyProneTo } = require("./propertyProneTo.mapper");
const { mapConditionsOfProperty } = require("./conditionsOfProperty.mapper");
const { mapRentalInformation } = require("./rentalInformation.mapper");
const { mapValuationForFinancePurpose } = require("./valuationForFinancePurpose.mapper");
const { mapValuersDeclaration } = require("./valuersDeclaration.mapper");

function mapValuationReport(rawText) {
	return {
		propertyType: mapPropertyType(rawText),
		accommodation: mapAccommodation(rawText),
		currentOccupency: mapCurrentOccupency(rawText),
		newBuild: mapNewBuild(rawText),
		construction: mapConstruction(rawText),
		localityAndDemand: mapLocalityAndDemand(rawText),
		services: mapServices(rawText),
		conditionsOfProperty: mapConditionsOfProperty(rawText),
		reports: mapReports(rawText),
		energyEfficiency: mapEnergyEfficiency(rawText),
		essentialRepairs: mapEssentialRepairs(rawText),
		rentalInformation: mapRentalInformation(rawText),
		valuationForFinancePurpose: mapValuationForFinancePurpose(rawText),
		valuersDeclaration: mapValuersDeclaration(rawText),
		// Top-level extras to be set by caller if needed:
		applicationId: null,
		applicationNumber: "",
		applicantName: "",
		propertyAddress: "",
		postCode: "",
		generalRemarks: "",
		extractedText: ""
	};
}

module.exports = {
	mapValuationReport,
	mapPropertyType,
	mapAccommodation,
	mapNewBuild,
	mapCurrentOccupency,
	mapConstruction,
	mapLocalityAndDemand,
	mapServices,
	mapEnergyEfficiency,
	mapEssentialRepairs,
	mapReports,
	mapPropertyProneTo,
	mapConditionsOfProperty,
	mapRentalInformation,
	mapValuationForFinancePurpose,
	mapValuersDeclaration
};


