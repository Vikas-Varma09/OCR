const fs = require("fs");
const { extractTextFromPDF } = require("../services/pdfTextExtractor");
const { parseHeader } = require("../services/valueParser");
const { mapAccommodation } = require("../mappers/accommodation.mapper");
const { mapCurrentOccupency } = require("../mappers/currentOccupency.mapper");
const { mapConstruction } = require("../mappers/construction.mapper");
const { mapNewBuild } = require("../mappers/newBuild.mapper");
const { mapPropertyType } = require("../mappers/propertyType.mapper");
const { mapValuersDeclaration } = require("../mappers/valuersDeclaration.mapper");
const { mapGeneralRemarks } = require("../mappers/generalRemarks.mapper");
const { mapValuationForFinancePurpose } = require("../mappers/valuationForFinancePurpose.mapper");
const { mapRentalInformation } = require("../mappers/rentalInformation.mapper");
const { mapEssentialRepairs } = require("../mappers/essentialRepairs.mapper");
const { mapEnergyEfficiency } = require("../mappers/energyEfficiency.mapper");
const { mapReports } = require("../mappers/reports.mapper");
const { mapServices } = require("../mappers/services.mapper");
const { mapConditionsOfProperty } = require("../mappers/conditionsOfProperty.mapper");
const { zonalExtract } = require("../pipelines/combine/zonalExtract");
const { mapLocalityAndDemand } = require("../mappers/localityAndDemand.mapper");
const path = require("path");

async function extractData(req, res) {
	try {
		if (!req.file || !req.file.path) {
			return res.status(400).json({ success: false, message: "No PDF uploaded" });
		}
		const filePath = req.file.path;

		// Query options
		const method = String(req.query.method || "auto");
		const template = String(req.query.template || "btl_v1");
		const debug = String(req.query.debug || "false") === "true";

		// Extract full text from PDF (digital PDFs)
		let pdfText = "";
		let useZonal = method === "zone-ocr";
		if (!useZonal) {
			try {
				pdfText = await extractTextFromPDF(filePath);
			} catch {
				useZonal = true;
			}
		}
		// Fallback to zonal if little text was extracted or forced
		if (method === "auto") {
			if (!pdfText || pdfText.trim().length < 800) {
				useZonal = true;
			}
		}

		if (useZonal) {
			const zonal = await zonalExtract(filePath, { template, debug });
			return res.json({
				success: true,
				method: "zone-ocr",
				data: zonal.data,
				debug: zonal.debug,
				sessionId: zonal.sessionId
			});
		}

		// Extract structured values
		const header = parseHeader(pdfText, req.body && req.body.applicationId ? String(req.body.applicationId) : null);
		const accommodation = { accommodation: mapAccommodation(pdfText) };
		const currentOccupency = { currentOccupency: mapCurrentOccupency(pdfText) };
		const construction = { construction: mapConstruction(pdfText) };
		const newBuild = { newBuild: mapNewBuild(pdfText) };
		const propertyType = mapPropertyType(pdfText);
		const valuersDeclaration = { valuersDeclaration: mapValuersDeclaration(pdfText) };
		const generalRemarks = { generalRemarks: mapGeneralRemarks(pdfText) };
		const valuationForFinancePurpose = { valuationForFinancePurpose: mapValuationForFinancePurpose(pdfText) };
		const rentalInformation = { rentalInformation: mapRentalInformation(pdfText) };
		const essentialRepairs = { essentialRepairs: mapEssentialRepairs(pdfText) };
		const energyEfficiency = { energyEfficiency: mapEnergyEfficiency(pdfText) };
		const reports = { reports: mapReports(pdfText) };
		const services = { services: mapServices(pdfText) };
		const conditionsOfProperty = { conditionsOfProperty: mapConditionsOfProperty(pdfText) };
		const localityAndDemand = { localityAndDemand: mapLocalityAndDemand(pdfText) };

		return res.json({
			success: true,
			method: "pdf-text",
			data: {
				// Keep only header fields and propertyType (remove other sections)
				...header,
				...accommodation,
				...currentOccupency,
				...construction,
				...newBuild,
				...generalRemarks,
				...valuationForFinancePurpose,
				...rentalInformation,
				...essentialRepairs,
				...energyEfficiency,
				...reports,
				...conditionsOfProperty,
				...localityAndDemand,
				...services,
				...valuersDeclaration,
				propertyType
			},
			rawText: pdfText
		});
	} catch (error) {
		console.error("Extraction error:", error);
		res.status(500).json({ success: false, message: "Extraction failed", error: error.message || String(error) });
	}
}

module.exports = { extractData };


