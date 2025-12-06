const fs = require("fs");
const { extractTextFromPDF } = require("../services/pdfTextExtractor");
const { parseHeader } = require("../services/valueParser");
const { mapAccommodation } = require("../mappers/accommodation.mapper");
const { mapCurrentOccupency } = require("../mappers/currentOccupency.mapper");
const { mapConstruction } = require("../mappers/construction.mapper");
const { mapNewBuild } = require("../mappers/newBuild.mapper");
const { mapPropertyType } = require("../mappers/propertyType.mapper");
const { mapValuersDeclaration } = require("../mappers/valuersDeclaration.mapper");
const { zonalExtract } = require("../pipelines/combine/zonalExtract");
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


