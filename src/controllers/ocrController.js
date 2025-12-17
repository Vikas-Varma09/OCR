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
const { extractResidentialNatureImpactAI, extractNonStandardConstructionTypeAI, extractIncentivesDetailsAI, extractCompulsoryPurchaseDetailsAI } = require("../services/aiExtractor");
const path = require("path");

function normalizeRawText(input) {
	// Preserve line structure but remove excess spaces and blank lines
	const s = String(input || "").replace(/\r\n/g, "\n");
	const lines = s.split("\n").map((line) => line.replace(/[ \t]+/g, " ").trim());
	const compact = [];
	for (const ln of lines) {
		if (ln === "" && compact.length > 0 && compact[compact.length - 1] === "") {
			continue; // collapse multiple blank lines
		}
		compact.push(ln);
	}
	return compact.join("\n").trim();
}

async function extractData(req, res) {
	let filePath;
	try {
		if (!req.file || !req.file.path) {
			return res.status(400).json({ success: false, message: "No PDF uploaded" });
		}
		filePath = req.file.path;

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
		// AI-backed enhancement: prefer AI extraction for residentialNatureImpact when available
		console.log("Controller: invoking AI extractor for residentialNatureImpact");
		try {
			const openaiKey = (req.headers && (req.headers["x-openai-key"] || req.headers["x-openai_api_key"])) || (req.body && req.body.openaiKey) || null;
			const openaiModel = (req.headers && (req.headers["x-openai-model"] || req.headers["x-openai_model"])) || (req.body && req.body.openaiModel) || null;
			if (openaiKey) {
				console.log("Controller: using OpenAI key from request headers/body");
			} else {
				console.log("Controller: using OpenAI key from environment");
			}
			const aiValue = await extractResidentialNatureImpactAI(pdfText, { apiKey: openaiKey, model: openaiModel });
			if (aiValue) {
				console.log("Controller: AI extractor returned value; applying to propertyType.residentialNatureImpact");
				propertyType.residentialNatureImpact = aiValue;
			} else {
				console.log("Controller: AI extractor returned null; keeping heuristic value");
			}
		} catch (e) {
			console.error("Controller: AI extractor threw an error:", e && e.message ? e.message : String(e));
		}

		// AI-backed enhancement: nonStandardConstructionType
		console.log("Controller: invoking AI extractor for nonStandardConstructionType");
		try {
			const openaiKey = (req.headers && (req.headers["x-openai-key"] || req.headers["x-openai_api_key"])) || (req.body && req.body.openaiKey) || null;
			const openaiModel = (req.headers && (req.headers["x-openai-model"] || req.headers["x-openai_model"])) || (req.body && req.body.openaiModel) || null;
			const aiC = await extractNonStandardConstructionTypeAI(pdfText, { apiKey: openaiKey, model: openaiModel });
			if (aiC) {
				console.log("Controller: AI extractor returned value; applying to construction.nonStandardConstructionType");
				construction.construction.nonStandardConstructionType = aiC;
			} else {
				console.log("Controller: AI extractor returned null; keeping heuristic nonStandardConstructionType");
			}
		} catch (e) {
			console.error("Controller: AI extractor (construction) threw an error:", e && e.message ? e.message : String(e));
		}

		// AI-backed enhancement: incentivesDetails
		console.log("Controller: invoking AI extractor for incentivesDetails");
		try {
			const openaiKey = (req.headers && (req.headers["x-openai-key"] || req.headers["x-openai_api_key"])) || (req.body && req.body.openaiKey) || null;
			const openaiModel = (req.headers && (req.headers["x-openai-model"] || req.headers["x-openai_model"])) || (req.body && req.body.openaiModel) || null;
			const aiIncent = await extractIncentivesDetailsAI(pdfText, { apiKey: openaiKey, model: openaiModel });
			if (aiIncent) {
				console.log("Controller: AI extractor returned value; applying to newBuild.incentivesDetails");
				newBuild.newBuild.incentivesDetails = aiIncent;
			} else {
				console.log("Controller: AI extractor returned null; keeping heuristic incentivesDetails");
			}
		} catch (e) {
			console.error("Controller: AI extractor (incentives) threw an error:", e && e.message ? e.message : String(e));
		}
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
		// AI-backed enhancement: compulsoryPurchaseDetails
		console.log("Controller: invoking AI extractor for compulsoryPurchaseDetails");
		try {
			const openaiKey2 = (req.headers && (req.headers["x-openai-key"] || req.headers["x-openai_api_key"])) || (req.body && req.body.openaiKey) || null;
			const openaiModel2 = (req.headers && (req.headers["x-openai-model"] || req.headers["x-openai_model"])) || (req.body && req.body.openaiModel) || null;
			const aiComp = await extractCompulsoryPurchaseDetailsAI(pdfText, { apiKey: openaiKey2, model: openaiModel2 });
			if (aiComp) {
				console.log("Controller: AI extractor returned value; applying to localityAndDemand.compulsoryPurchaseDetails");
				localityAndDemand.localityAndDemand.compulsoryPurchaseDetails = aiComp;
			} else {
				console.log("Controller: AI extractor returned null; keeping heuristic compulsoryPurchaseDetails");
			}
		} catch (e) {
			console.error("Controller: AI extractor (compulsory) threw an error:", e && e.message ? e.message : String(e));
		}

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
			rawText: normalizeRawText(pdfText)
		});
	} catch (error) {
		console.error("Extraction error:", error);
		res.status(500).json({ success: false, message: "Extraction failed", error: error.message || String(error) });
	} finally {
		// Best-effort cleanup of uploaded file
		if (filePath) {
			try {
				await fs.promises.unlink(filePath);
			} catch {}
		}
	}
}

module.exports = { extractData };


