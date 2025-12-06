const { mapGeneralRemarks } = require("../src/mappers/generalRemarks.mapper");

describe("mapGeneralRemarks", () => {
	test("extracts full block (refined, no newlines) between labels", () => {
		const raw = [
			"GENERAL REMARKS:",
			"Any other information which in your opinion Gatehouse Bank plc should note:",
			"No information has been provided in respect of the ground rent and service charge. Our valuation",
			"assumes that these are reasonable.",
			"There was no loft access.",
			"The property's EPC rating is D.",
			"The building has cladding and/or balconies but further information has not been requested about",
			"whether remediation works may be required because it falls outside RICS advice current at the time",
			"of this valuation.",
			"",
			"IMPORTANT NOTICE TO THE APPLICANT:"
		].join("\n");

		expect(mapGeneralRemarks(raw)).toBe(
			"No information has been provided in respect of the ground rent and service charge. Our valuation assumes that these are reasonable. There was no loft access. The property's EPC rating is D. The building has cladding and/or balconies but further information has not been requested about whether remediation works may be required because it falls outside RICS advice current at the time of this valuation."
		);
	});

	test("returns compact text if EPC sentence not present", () => {
		const raw = [
			"GENERAL REMARKS:",
			"Any other information which in your opinion Gatehouse Bank plc should note:",
			"No loft access."
		].join("\n");
		expect(mapGeneralRemarks(raw)).toContain("No loft access.");
	});

	test("returns empty string if block not found", () => {
		expect(mapGeneralRemarks("no remarks here")).toBe("");
	});
});


