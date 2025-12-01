const path = require("path");
const fs = require("fs-extra");
const sharp = require("sharp");

async function cropZones(sessionId, pageImages, zoneConfig, options = {}) {
	const outputRoot = options.outputRoot || path.join("output", "crops");
	const outDir = path.join(outputRoot, sessionId);
	await fs.ensureDir(outDir);

	const results = {};
	const pagesConfig = zoneConfig.pages || {};

	// Map filenames to page numbers (assumes page-<n>.png)
	const getPageNum = (filePath) => {
		const m = String(filePath).match(/page-(\d+)\.png$/i);
		return m ? m[1] : null;
	};

	for (const imgPath of pageImages) {
		const pnum = getPageNum(imgPath);
		if (!pnum || !pagesConfig[pnum]) continue;
		const zones = pagesConfig[pnum];
		const zoneNames = Object.keys(zones);
		for (const name of zoneNames) {
			const z = zones[name];
			if (!z || !Number.isFinite(z.x) || !Number.isFinite(z.y) || !Number.isFinite(z.w) || !Number.isFinite(z.h)) {
				continue;
			}
			const outPath = path.join(outDir, `${name}.png`);
			await sharp(imgPath)
				.extract({ left: Math.max(0, Math.floor(z.x)), top: Math.max(0, Math.floor(z.y)), width: Math.max(1, Math.floor(z.w)), height: Math.max(1, Math.floor(z.h)) })
				.toFile(outPath);
			results[name] = outPath;
		}
	}
	return { sessionId, outputDir: outDir, crops: results };
}

module.exports = {
	cropZones
};


