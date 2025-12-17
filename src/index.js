const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs-extra");
require("dotenv").config();

const { extractData } = require("./controllers/ocrController");

const PORT = Number(process.env.PORT || 3000);
const UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads";

const app = express();
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// Serve static UI
app.use(express.static("public"));

// AI config visibility (non-sensitive)
{
	const keyPresent = Boolean(process.env.OPENAI_API_KEY || process.env.OPENAI_APIKEY || process.env.OPENAI_API_TOKEN);
	const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
	console.log(
		"AI config: key=%s, model=%s",
		keyPresent ? "present (from env)" : "NOT FOUND (set OPENAI_API_KEY in .env)",
		model
	);
}

const storage = multer.diskStorage({
	destination: async function (req, file, cb) {
		await fs.ensureDir(UPLOAD_DIR);
		cb(null, UPLOAD_DIR);
	},
	filename: function (req, file, cb) {
		const ext = path.extname(file.originalname) || ".pdf";
		const name = path.basename(file.originalname, ext);
		cb(null, `${name}-${Date.now()}${ext}`);
	}
});
const upload = multer({ storage });

app.post("/api/extract", upload.single("file"), extractData);

// Optional preview endpoint for zones overlay on first page
app.get("/api/zones/preview", async (req, res) => {
	try {
		const { file, template = "btl_v1" } = req.query || {};
		if (!file) {
			return res.status(400).json({ success: false, message: "Missing file query param" });
		}
		const { renderPdfToImages } = require("./pipelines/pdf-to-images/render");
		const { drawZonesOverlay } = require("./pipelines/crop/overlay");
		const fs = require("fs-extra");
		const path = require("path");
		const zones = require("./pipelines/crop/zones/" + template + ".json");

		// If file is a PDF, render first page; if it's an image, use directly
		let pageImage = String(file);
		if (/\.pdf$/i.test(pageImage)) {
			const rr = await renderPdfToImages(pageImage, { dpi: zones.dpi || 350 });
			if (!rr.pages.length) {
				return res.status(500).json({ success: false, message: "No pages rendered" });
			}
			pageImage = rr.pages[0];
		}
		const outPath = path.join("output", "debug", "zones-preview.png");
		await drawZonesOverlay(pageImage, (zones.pages || {})["1"] || {}, outPath);
		return res.json({ success: true, preview: outPath });
	} catch (e) {
		console.error("zones preview error", e);
		return res.status(500).json({ success: false, message: String(e) });
	}
});

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
	console.log(`OCR server running on http://localhost:${PORT}`);
});


