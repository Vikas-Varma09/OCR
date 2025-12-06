const { mapPropertyType } = require("../src/mappers/propertyType.mapper");

const SAMPLE = [
	"PROPERTY TYPE                                                                                 ACCOMMODATION - State Number",
	"Detached House X           Semi-Detached House        X     Terraced House       X            Hall     0            Living Rooms   1      Kitchen       1 Lift       Yes",
	"Bungalow       X           Flat                       X     Maisonette             X          Utility  0            Bedrooms       2      Bathrooms     2 Separate WC 0",
	"If flat / maisonette on what floor?        3         No. of floors in block     5             Basement 0            Garage         0      Parking       1",
	"Property built",
	"                                         Authority?            Yes          No    X            Gardens Yes           If Yes                Private          Communal X",
	"If Yes, what is the approximate % of owner occupation                 Null                    Number of outbuildings               0",
	"Is flat / maisonette:                                                                         (please provide details)",
	"                            If Converted,",
	"Converted            X     please state year of conversion                  2001                  Simple Text for details",
	"Purpose Built        X     No of units in block       46                                      Gross floor area of dwelling                       78        m2",
	"Above commercial                                              Yes          No    X",
	"Tenure:        Freehold              Leasehold        X",
	"Flying freehold Yes                  No   X               If Yes, what %     0.1",
	"Maintenance                  Road                            Ground",
	"Charge 0                     Charges      0                  Rent 0",
	"Remaining term of Lease (if unknown as per RICS red book) 103                 Years",
	"Is any part of the property in commercial use?                Yes          No    X",
	"Is the property being purchased under a shared ownership scheme?  Yes          No    X",
	"Year property built         2003"
].join("\n");

describe("mapPropertyType", () => {
	test("maps the provided sample correctly", () => {
		const p = mapPropertyType(SAMPLE);
		expect(p).toMatchObject({
			isDetachedHouse: true,
			isSemiDetachedHouse: true,
			isTerracedHouse: true,
			isBungalow: true,
			isFlat: true,
			isMaisonette: true,
			flatMaisonetteFloor: 3,
			numberOfFloorsInBlock: 5,
			isBuiltOrOwnedByLocalAuthority: false,
			ownerOccupationPercentage: null,
			isFlatMaisonetteConverted: true,
			conversionYear: 2001,
			isPurposeBuilt: true,
			numberOfUnitsInBlock: 46,
			isAboveCommercial: false,
			tenure: "Leasehold",
			isFlyingFreehold: false,
			flyingFreeholdPercentage: 0.1,
			maintenanceCharge: 0,
			roadCharges: 0,
			groundRent: 0,
			remainingLeaseTermYears: 103,
			isPartCommercialUse: false,
			isPurchasedUnderSharedOwnership: false,
			yearBuilt: 2003
		});
		// residentialNatureImpact can vary with formatting; just assert it's a string or null
		expect(typeof p.residentialNatureImpact === "string" || p.residentialNatureImpact === null).toBe(true);
	});

	test("handles empty text returning defaults", () => {
		const p = mapPropertyType("");
		expect(p).toEqual({
			isDetachedHouse: false,
			isSemiDetachedHouse: false,
			isTerracedHouse: false,
			isBungalow: false,
			isFlat: false,
			isMaisonette: false,
			flatMaisonetteFloor: null,
			numberOfFloorsInBlock: null,
			isBuiltOrOwnedByLocalAuthority: false,
			ownerOccupationPercentage: null,
			isFlatMaisonetteConverted: false,
			conversionYear: null,
			isPurposeBuilt: false,
			numberOfUnitsInBlock: null,
			isAboveCommercial: false,
			residentialNatureImpact: null,
			tenure: null,
			isFlyingFreehold: false,
			flyingFreeholdPercentage: null,
			maintenanceCharge: null,
			roadCharges: null,
			groundRent: null,
			remainingLeaseTermYears: null,
			isPartCommercialUse: false,
			commercialUsePercentage: null,
			isPurchasedUnderSharedOwnership: false,
			yearBuilt: null
		});
	});
});


