const path = require("path");
const fs = require("fs-extra");
const sharp = require("sharp");

async function cropZones(sessionId, pageImages, zoneConfig, options = {}) {
	const outputRoot = options.outputRoot || path.join("output", "crops");
	const outDir = path.join(outputRoot, sessionId);
	await fs.ensureDir(outDir);

	const results = {};
	const pagesConfig = zoneConfig.pages || {};
	const defaultPad = Number.isFinite(zoneConfig.defaultPad) ? zoneConfig.defaultPad : 0;
	const defaultPadX = Number.isFinite(zoneConfig.defaultPadX) ? zoneConfig.defaultPadX : defaultPad;
	const defaultPadY = Number.isFinite(zoneConfig.defaultPadY) ? zoneConfig.defaultPadY : defaultPad;

	// Map filenames to page numbers (assumes page-<n>.png)
	const getPageNum = (filePath) => {
		const m = String(filePath).match(/page-(\d+)\.png$/i);
		return m ? m[1] : null;
	};

	for (const imgPath of pageImages) {
		const pnum = getPageNum(imgPath);
		if (!pnum || !pagesConfig[pnum]) continue;

		// Load image metadata to clamp crops to bounds
		const baseImg = sharp(imgPath);
		const meta = await baseImg.metadata();
		const imgW = meta.width || 0;
		const imgH = meta.height || 0;

		const zones = pagesConfig[pnum];
		const zoneNames = Object.keys(zones);
		for (const name of zoneNames) {
			const z = zones[name];
			if (!z || !Number.isFinite(z.x) || !Number.isFinite(z.y) || !Number.isFinite(z.w) || !Number.isFinite(z.h)) {
				continue;
			}

			// Optional padding to tolerate slight up/down or left/right drift
			const pad = Number.isFinite(z.pad) ? z.pad : 0;
			const padX = Number.isFinite(z.padX) ? z.padX : (pad || defaultPadX);
			const padY = Number.isFinite(z.padY) ? z.padY : (pad || defaultPadY);

			let left = Math.floor(z.x - padX);
			let top = Math.floor(z.y - padY);
			let width = Math.floor(z.w + 2 * padX);
			let height = Math.floor(z.h + 2 * padY);

			// Clamp to image bounds
			if (left < 0) {
				width += left;
				left = 0;
			}
			if (top < 0) {
				height += top;
				top = 0;
			}
			if (imgW && left + width > imgW) {
				width = Math.max(1, imgW - left);
			}
			if (imgH && top + height > imgH) {
				height = Math.max(1, imgH - top);
			}

			const outPath = path.join(outDir, `${name}.png`);
			await sharp(imgPath)
				.extract({
					left: Math.max(0, left),
					top: Math.max(0, top),
					width: Math.max(1, width),
					height: Math.max(1, height)
				})
				.toFile(outPath);
			results[name] = outPath;
		}
	}
	return { sessionId, outputDir: outDir, crops: results };
}

module.exports = {
	cropZones
};


