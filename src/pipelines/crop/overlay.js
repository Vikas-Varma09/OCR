const path = require("path");
const fs = require("fs-extra");
const sharp = require("sharp");

async function drawZonesOverlay(pageImagePath, zonesForPage, outputPath) {
	await fs.ensureDir(path.dirname(outputPath));
	const img = sharp(pageImagePath);
	const meta = await img.metadata();
	const w = meta.width || 2480;
	const h = meta.height || 3508;

	const rects = Object.entries(zonesForPage || {}).map(([name, z]) => {
		if (!z) return "";
		const x = Math.max(0, z.x | 0);
		const y = Math.max(0, z.y | 0);
		const ww = Math.max(1, z.w | 0);
		const hh = Math.max(1, z.h | 0);
		return `<rect x="${x}" y="${y}" width="${ww}" height="${hh}" fill="none" stroke="#00E5FF" stroke-width="3"/><text x="${x + 6}" y="${y + 22}" font-size="18" fill="#00E5FF" font-family="Arial">${escapeXml(name)}</text>`;
	}).join("");

	const svg = Buffer.from(
		`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><g>${rects}</g></svg>`
	);

	await sharp(pageImagePath)
		.composite([{ input: svg, top: 0, left: 0 }])
		.toFile(outputPath);
	return outputPath;
}

function escapeXml(s) {
	return String(s).replace(/[<>&'"]/g, (c) => {
		switch (c) {
			case "<": return "&lt;";
			case ">": return "&gt;";
			case "&": return "&amp;";
			case "'": return "&apos;";
			case "\"": return "&quot;";
			default: return c;
		}
	});
}

module.exports = {
	drawZonesOverlay
};


