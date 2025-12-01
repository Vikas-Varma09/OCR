const sharp = require("sharp");

async function isBoxTicked(imagePath, options = {}) {
	const threshold = Number.isFinite(options.threshold) ? options.threshold : 0.5;
	const size = options.resize || 28;
	const img = sharp(imagePath).greyscale().resize(size, size, { fit: "fill" });
	const { data } = await img.raw().toBuffer({ resolveWithObject: true });
	let sum = 0;
	for (let i = 0; i < data.length; i++) {
		sum += data[i]; // 0..255
	}
	const avg = sum / data.length / 255; // 0..1
	// Darker (ink) -> lower avg; invert to get density
	const inkDensity = 1 - avg;
	return inkDensity >= threshold;
}

module.exports = {
	isBoxTicked
};


