const { mapValuersDeclaration } = require("../src/mappers/valuersDeclaration.mapper");

describe("mapValuersDeclaration", () => {
	test("maps valuer details from sample block", () => {
		const raw = [
			"Signature of Valuer / Electronic Signature          551909 = 8664                                       Address of Valuer",
			"",
			"Name of Valuer            A Bassan                                                                      Valuation Management Centre, Cumbria Hous",
			"For and on behalf of      Connells Survey & Valuation Ltd                                               Leighton Buzzard",
			"Telephone (inc. STD code) 01525218647                                                                   Postcode LU7 1GN",
			"",
			"Fax (inc. STD code)       01525218632                                                                   Report Date 13/01/2025",
			"",
			"E-mail                    customercare@connells.co.uk",
			"",
			"Professional Qualifications of the Valuer                                      MRICS          FRICS               AssocRICS       X",
			"RICS Number                        1294262"
		].join("\n");

		const r = mapValuersDeclaration(raw);
		expect(r).toEqual({
			valuerSignature: "551909 = 8664",
			valuerName: "A Bassan",
			onBehalfOf: "Connells Survey & Valuation Ltd",
			telephone: 1525218647,
			fax: 1525218632,
			email: "customercare@connells.co.uk",
			valuerQualifications: { mrics: false, frics: false, assocRics: true },
			ricsNumber: 1294262,
			valuerAddress: "Valuation Management Centre, Cumbria Hous Leighton Buzzard",
			valuerPostcode: "LU7 1GN",
			reportDate: "13/01/2025"
		});
	});

	test("returns nulls if missing", () => {
		const r = mapValuersDeclaration("");
		expect(r).toEqual({
			valuerSignature: null,
			valuerName: null,
			onBehalfOf: null,
			telephone: null,
			fax: null,
			email: null,
			valuerQualifications: { mrics: null, frics: null, assocRics: null },
			ricsNumber: null,
			valuerAddress: null,
			valuerPostcode: null,
			reportDate: null
		});
	});
});


