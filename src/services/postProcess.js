function toNullableInt(value, opts = {}) {
	const n = Number.parseInt(String(value).replace(/[^\d-]/g, ""), 10);
	if (!Number.isFinite(n)) return null;
	if (Number.isFinite(opts.min) && n < opts.min) return opts.min;
	if (Number.isFinite(opts.max) && n > opts.max) return opts.max;
	return n;
}

function toNullableFloat(value, opts = {}) {
	const n = Number.parseFloat(String(value).replace(/[^0-9.\-]/g, ""));
	if (!Number.isFinite(n)) return null;
	if (Number.isFinite(opts.min) && n < opts.min) return opts.min;
	if (Number.isFinite(opts.max) && n > opts.max) return opts.max;
	return n;
}

function toNullableBool(value) {
	if (value === true || value === false) return value;
	const s = String(value || "").trim().toLowerCase();
	if (s === "yes" || s === "true" || s === "y") return true;
	if (s === "no" || s === "false" || s === "n") return false;
	return null;
}

function postProcessValuationReport(report) {
	const r = { ...report };
	if (r.accommodation) {
		const a = { ...r.accommodation };
		a.hall = toNullableInt(a.hall, { min: 0, max: 10 });
		a.livingRooms = toNullableInt(a.livingRooms, { min: 0, max: 10 });
		a.kitchen = toNullableInt(a.kitchen, { min: 0, max: 10 });
		a.bedrooms = toNullableInt(a.bedrooms, { min: 0, max: 20 });
		a.bathrooms = toNullableInt(a.bathrooms, { min: 0, max: 20 });
		a.utility = toNullableInt(a.utility, { min: 0, max: 10 });
		a.isLiftPresent = toNullableBool(a.isLiftPresent);
		r.accommodation = a;
	}
	if (r.propertyType) {
		const p = { ...r.propertyType };
		p.flatMaisonetteFloor = toNullableInt(p.flatMaisonetteFloor, { min: 0, max: 60 });
		p.numberOfFloorsInBlock = toNullableInt(p.numberOfFloorsInBlock, { min: 0, max: 100 });
		p.ownerOccupationPercentage = toNullableFloat(p.ownerOccupationPercentage, { min: 0, max: 100 });
		p.conversionYear = toNullableInt(p.conversionYear, { min: 1800, max: 2100 });
		p.numberOfUnitsInBlock = toNullableInt(p.numberOfUnitsInBlock, { min: 0, max: 1000 });
		p.flyingFreeholdPercentage = toNullableFloat(p.flyingFreeholdPercentage, { min: 0, max: 100 });
		p.maintenanceCharge = toNullableInt(p.maintenanceCharge, { min: 0, max: 100000 });
		p.roadCharges = toNullableInt(p.roadCharges, { min: 0, max: 100000 });
		p.groundRent = toNullableInt(p.groundRent, { min: 0, max: 100000 });
		p.remainingLeaseTermYears = toNullableInt(p.remainingLeaseTermYears, { min: 0, max: 999 });
		p.commercialUsePercentage = toNullableFloat(p.commercialUsePercentage, { min: 0, max: 100 });
		p.yearBuilt = toNullableInt(p.yearBuilt, { min: 1600, max: 2100 });
		r.propertyType = p;
	}
	return r;
}

module.exports = {
	postProcessValuationReport
};


