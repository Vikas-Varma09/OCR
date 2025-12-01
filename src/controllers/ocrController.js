const fs = require("fs");
const { extractTextFromPDF } = require("../services/pdfTextExtractor");
const { parseAccommodation } = require("../services/valueParser");
const { mapPropertyType } = require("../mappers/propertyType.mapper");

async function extractData(req, res) {
	try {
		if (!req.file || !req.file.path) {
			return res.status(400).json({ success: false, message: "No PDF uploaded" });
		}
		const filePath = req.file.path;

		// Extract full text from PDF
		const pdfText = await extractTextFromPDF(filePath);

		// Extract structured values
		const accommodation = parseAccommodation(pdfText);
		const propertyType = mapPropertyType(pdfText);

		return res.json({
			success: true,
			data: {
				...accommodation,
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


