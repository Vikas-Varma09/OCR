const fs = require("fs");
const { extractTextFromPDF } = require("../services/pdfTextExtractor");
const { renderPdfToImages } = require("../pipelines/pdf-to-images/render");
const { ocrWithPaddle } = require("../pipelines/ocr/paddleOcr");

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

		// Try to extract text from PDF first (for digital PDFs)
		let rawText = "";
		try {
			rawText = await extractTextFromPDF(filePath);
		} catch (error) {
			console.log("PDF text extraction failed, falling back to OCR:", error.message);
		}

		// If little or no text extracted, use OCR
		if (!rawText || rawText.trim().length < 100) {
			try {
				// Render PDF to images
				const renderRes = await renderPdfToImages(filePath, { dpi: 350 });
				
				// OCR all pages
				const pageMap = {};
				renderRes.pages.forEach((pagePath, index) => {
					pageMap[`page_${index + 1}`] = pagePath;
				});
				
				const ocrResults = await ocrWithPaddle(pageMap, { 
					sessionId: renderRes.sessionId,
					lang: req.query.lang || "en"
				});
				
				// Combine all OCR results into single text
				rawText = Object.values(ocrResults)
					.map(text => String(text || "").trim())
					.filter(text => text.length > 0)
					.join("\n\n");
			} catch (ocrError) {
				console.error("OCR failed:", ocrError);
				return res.status(500).json({ 
					success: false, 
					message: "Both PDF text extraction and OCR failed", 
					error: ocrError.message || String(ocrError) 
				});
			}
		}

		return res.json({
			success: true,
			rawText: normalizeRawText(rawText)
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


