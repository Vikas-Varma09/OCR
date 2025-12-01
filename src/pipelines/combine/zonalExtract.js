const path = require("path");
const fs = require("fs-extra");
const { renderPdfToImages } = require("../pdf-to-images/render");
const { cropZones } = require("../crop/cropZones");
const { ocrWithPaddle } = require("../ocr/paddleOcr");
const { drawZonesOverlay } = require("../crop/overlay");
const { mapValuationReport } = require("../../mappers");
const { postProcessValuationReport } = require("../../services/postProcess");

async function loadZoneConfig(template = "btl_v1") {
	const fp = path.join(__dirname, "..", "crop", "zones", `${template}.json`);
	const buf = await fs.readFile(fp, "utf8");
	return JSON.parse(buf);
}

async function zonalExtract(pdfPath, opts = {}) {
	const template = opts.template || "btl_v1";
	const debug = !!opts.debug;
	const zoneConfig = await loadZoneConfig(template);
	const renderRes = await renderPdfToImages(pdfPath, { dpi: zoneConfig.dpi || 350 });
	const cropRes = await cropZones(renderRes.sessionId, renderRes.pages, zoneConfig);
	const ocrMap = await ocrWithPaddle(cropRes.crops, { sessionId: renderRes.sessionId });

	// Combine OCR text, one section per heading, to improve mappers' signal
	const combinedText = Object.entries(ocrMap)
		.map(([k, v]) => `=== ${k.toUpperCase()} ===\n${String(v || "").trim()}`)
		.join("\n\n");

	const mapped = mapValuationReport(combinedText);
	mapped.extractedText = combinedText;
	const processed = postProcessValuationReport(mapped);

	const debugPaths = {};
	if (debug) {
		if (!process.env.MAPPER_DEBUG) process.env.MAPPER_DEBUG = "1";
		// Overlay zones on first page for quick visual check
		const first = renderRes.pages[0];
		if (first) {
			const pnum = "1";
			const outDbg = path.join("output", "debug", `${renderRes.sessionId}-${pnum}-zones-preview.png`);
			await fs.ensureDir(path.dirname(outDbg));
			await drawZonesOverlay(first, (zoneConfig.pages || {})[pnum] || {}, outDbg);
			debugPaths.overlay = outDbg;
		}
		debugPaths.imagesDir = renderRes.outputDir;
		debugPaths.cropsDir = cropRes.outputDir;
	}

	return {
		sessionId: renderRes.sessionId,
		data: processed,
		debug: debug ? debugPaths : undefined
	};
}

module.exports = {
	zonalExtract
};


