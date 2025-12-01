const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
let cachedPdfParse = null;

function resolvePdfParseSync() {
	// Try CommonJS main export
	try {
		const m = require("pdf-parse");
		const fn = unwrapPdfParse(m);
		if (fn) return fn;
	} catch {}
	// Try legacy path
	try {
		const m = require("pdf-parse/lib/pdf-parse");
		const fn = unwrapPdfParse(m);
		if (fn) return fn;
	} catch {}
	// Last resort: dynamic import
	try {
		// eslint-disable-next-line no-new-func
		const dynamicImport = new Function("specifier", "return import(specifier)");
		return dynamicImport("pdf-parse").then((mod) => {
			const fn = unwrapPdfParse(mod);
			if (fn) return fn;
			throw new Error("pdf-parse dynamic import did not export a function");
		});
	} catch {}
	return null;
}

function unwrapPdfParse(mod) {
	// Unwrap nested default exports up to a few levels
	let cur = mod;
	let guard = 5;
	while (cur && typeof cur === "object" && "default" in cur && guard-- > 0) {
		cur = cur.default;
	}
	if (typeof cur === "function") return cur;
	// Some builds might attach under known keys
	if (cur && typeof cur.pdfParse === "function") return cur.pdfParse;
	if (cur && typeof cur.parse === "function") return cur.parse;
	return null;
}

async function extractTextFromPDF(filePath) {
	const dataBuffer = await fs.promises.readFile(filePath);
	if (!cachedPdfParse) {
		const resolved = resolvePdfParseSync();
		cachedPdfParse = resolved;
	}
	try {
		let parser = cachedPdfParse;
		if (!parser) {
			throw new Error("pdf-parse module did not export a function");
		}
		// If parser is a Promise (from dynamic import), await it
		if (typeof parser.then === "function") {
			parser = await parser;
			cachedPdfParse = parser;
		}
		if (typeof parser !== "function") {
			throw new Error("pdf-parse module did not export a function");
		}
		const result = await parser(dataBuffer);
		// Combine text; pdf-parse returns .text as a single large string
		return (result && result.text) ? result.text : "";
	} catch (e) {
		// Fallback to Poppler pdftotext CLI if available
		const text = extractTextWithPoppler(filePath);
		if (text != null) return text;
		throw e;
	}
}

module.exports = {
	extractTextFromPDF
};

function extractTextWithPoppler(pdfPath) {
	try {
		const popplerPath = process.env.POPPLER_PATH || "";
		const exe = process.platform === "win32" ? "pdftotext.exe" : "pdftotext";
		const bin = popplerPath ? path.join(popplerPath, exe) : exe;
		const args = ["-layout", "-nopgbrk", pdfPath, "-"];
		const proc = spawnSync(bin, args, { encoding: "utf8", maxBuffer: 50 * 1024 * 1024 });
		if (proc.error) {
			return null;
		}
		if (proc.status !== 0) {
			return null;
		}
		return proc.stdout || "";
	} catch {
		return null;
	}
}

