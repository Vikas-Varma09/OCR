const {
	mapAccommodation,
	mapPropertyType,
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
} = require("../src/mappers");

describe("mappers - sanity no-crash with empty input", () => {
	const empty = "";

	test("accommodation returns all nullable fields", () => {
		const m = mapAccommodation(empty);
		expect(m).toBeTruthy();
	});

	test("propertyType returns structure", () => {
		const m = mapPropertyType(empty);
		expect(m).toBeTruthy();
	});

	test("newBuild returns structure", () => {
		const m = mapNewBuild(empty);
		expect(m).toBeTruthy();
	});

	test("currentOccupency returns structure", () => {
		const m = mapCurrentOccupency(empty);
		expect(m).toBeTruthy();
	});

	test("construction returns structure", () => {
		const m = mapConstruction(empty);
		expect(m).toBeTruthy();
	});

	test("localityAndDemand returns structure", () => {
		const m = mapLocalityAndDemand(empty);
		expect(m).toBeTruthy();
	});

	test("services returns structure", () => {
		const m = mapServices(empty);
		expect(m).toBeTruthy();
	});

	test("energyEfficiency returns structure", () => {
		const m = mapEnergyEfficiency(empty);
		expect(m).toBeTruthy();
	});

	test("essentialRepairs returns structure", () => {
		const m = mapEssentialRepairs(empty);
		expect(m).toBeTruthy();
	});

	test("reports returns structure", () => {
		const m = mapReports(empty);
		expect(m).toBeTruthy();
	});

	test("propertyProneTo returns structure", () => {
		const m = mapPropertyProneTo(empty);
		expect(m).toBeTruthy();
	});

	test("conditionsOfProperty returns structure", () => {
		const m = mapConditionsOfProperty(empty);
		expect(m).toBeTruthy();
	});

	test("rentalInformation returns structure", () => {
		const m = mapRentalInformation(empty);
		expect(m).toBeTruthy();
	});

	test("valuationForFinancePurpose returns structure", () => {
		const m = mapValuationForFinancePurpose(empty);
		expect(m).toBeTruthy();
	});

	test("valuersDeclaration returns structure", () => {
		const m = mapValuersDeclaration(empty);
		expect(m).toBeTruthy();
	});
});


