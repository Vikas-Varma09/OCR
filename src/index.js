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

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
	console.log(`OCR server running on http://localhost:${PORT}`);
});


