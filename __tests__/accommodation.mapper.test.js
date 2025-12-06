const { mapAccommodation } = require("../src/mappers/accommodation.mapper");

describe("mapAccommodation", () => {
	test("maps full sample with numbers, lift yes/no, gardens private/communal, outbuildings simple text, gross area", () => {
		const raw = [
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
			"Purpose Built        X     No of units in block       46                                      Gross floor area of dwelling                       78        m2"
		].join("\n");

		const acc = mapAccommodation(raw);
		expect(acc).toEqual({
			hall: 0,
			livingRooms: 1,
			kitchen: 1,
			bedrooms: 2,
			bathrooms: 2,
			utility: 0,
			isLiftPresent: true,
			separateWc: 0,
			basement: 0,
			garage: 0,
			parking: 1,
			gardens: true,
			isPrivate: false,
			isCommunal: true,
			numberOfOutbuildings: 0,
			outbuildingDetails: "Simple Text for details",
			grossFloorAreaOfDwelling: 78
		});
	});

	test("maps outbuilding details between conversion label and Purpose Built (no explicit 'Simple Text for details')", () => {
		const raw = [
			"If Converted,",
			"Converted                  please state year of conversion                                      1 Store and 1 Swimming Pool",
			"Purpose Built"
		].join("\n");

		const acc = mapAccommodation(raw);
		expect(acc.outbuildingDetails).toBe("1 Store and 1 Swimming Pool");
	});

	test("handles missing fields gracefully (nulls)", () => {
		const raw = [
			"Some unrelated text",
			"Another line"
		].join("\n");

		const acc = mapAccommodation(raw);
		expect(acc).toEqual({
			hall: null,
			livingRooms: null,
			kitchen: null,
			bedrooms: null,
			bathrooms: null,
			utility: null,
			isLiftPresent: null,
			separateWc: null,
			basement: null,
			garage: null,
			parking: null,
			gardens: null,
			isPrivate: null,
			isCommunal: null,
			numberOfOutbuildings: null,
			outbuildingDetails: null,
			grossFloorAreaOfDwelling: null
		});
	});

	test("maps gardens No and leaves private/communal null if not provided", () => {
		const raw = "Gardens No";
		const acc = mapAccommodation(raw);
		expect(acc.gardens).toBe(false);
		expect(acc.isPrivate).toBeNull();
		expect(acc.isCommunal).toBeNull();
	});
});


