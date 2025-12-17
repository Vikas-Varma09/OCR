const https = require("https");

function postJson(url, headers, data, timeoutMs = 12000) {
	return new Promise((resolve, reject) => {
		const { hostname, pathname } = new URL(url);
		const req = https.request(
			{
				hostname,
				path: pathname,
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					...headers
				},
				timeout: timeoutMs
			},
			(res) => {
				let body = "";
				res.on("data", (chunk) => (body += chunk));
				res.on("end", () => {
					if (res.statusCode >= 200 && res.statusCode < 300) {
						try {
							resolve(JSON.parse(body));
						} catch (e) {
							reject(e);
						}
					} else {
						const err = new Error(`AI HTTP ${res.statusCode}: ${body}`);
						err.statusCode = res.statusCode;
						err.body = body;
						reject(err);
					}
				});
			}
		);
		req.on("error", reject);
		req.write(JSON.stringify(data));
		req.end();
	});
}

function sleep(ms) {
	return new Promise((r) => setTimeout(r, ms));
}

function cleanAnswer(s) {
	if (!s) return null;
	let t = String(s).replace(/\r/g, "").trim();
	// Remove enclosing quotes or backticks
	if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'")) || (t.startsWith("`") && t.endsWith("`"))) {
		t = t.slice(1, -1);
	}
	// Collapse whitespace and newlines to single spaces
	t = t.replace(/\s+/g, " ").trim();
	// Reject placeholders
	if (!/[A-Za-z]/.test(t)) return null;
	if (/^(n\/a|null|none|unknown)$/i.test(t)) return null;
	return t;
}

async function extractResidentialNatureImpactAI(rawText, options = {}) {
	const { apiKey: overrideKey, model: overrideModel } = options || {};
	const apiKey = overrideKey || process.env.OPENAI_API_KEY || process.env.OPENAI_APIKEY || process.env.OPENAI_API_TOKEN;
	if (!apiKey) {
		console.warn("AI extractor: OPENAI_API_KEY not set; skipping OpenAI call");
		return null;
	}
	const model = overrideModel || process.env.OPENAI_MODEL || "gpt-4o-mini";

	console.log(
		"AI extractor: calling OpenAI chat.completions (model=%s, rawTextLen=%d, keySource=%s)",
		model,
		String(rawText || "").length,
		overrideKey ? "request" : "env"
	);

	const system = [
		"You extract structured answers from noisy OCR text.",
		"Task: Return ONLY the free-text answer for the field:",
		'"If Yes, please state if this would affect the residential nature of the property e.g. Noise, Odour".',
		"Rules:",
		"- The answer often appears between the lines near 'How many adults appear to live in the property?' and 'If Yes, please provide details'.",
		"- Ignore other prompts such as 'Does the property appear to be an HMO/Multi Unit Freehold Block? Yes/No X' and 'Tenure'.",
		"- If the answer spans multiple short fragments across lines (e.g., 'Simple Text for Odour test12345', 'test 34566', 'test 19374'), concatenate them in order with single spaces.",
		"- Return a concise single line. Do not include labels or explanations."
	].join(" ");

	const user = [
		"Here is the full raw report text:",
		"---BEGIN RAW TEXT---",
		String(rawText || ""),
		"---END RAW TEXT---",
		"Extract and return just the single-line answer."
	].join("\n");

	// Retry strategy: retry once on 5xx/timeouts; do not retry on 429/insufficient_quota
	const maxAttempts = 2;
	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		try {
			const resp = await postJson(
				"https://api.openai.com/v1/chat/completions",
				{
					Authorization: `Bearer ${apiKey}`
				},
				{
					model,
					messages: [
						{ role: "system", content: system },
						{ role: "user", content: user }
					],
					temperature: 0.1,
					max_tokens: 100
				},
				15000
			);
			console.log(
				"AI extractor: OpenAI response received (prompt_tokens=%s, completion_tokens=%s)",
				resp && resp.usage && resp.usage.prompt_tokens,
				resp && resp.usage && resp.usage.completion_tokens
			);
			const content = resp && resp.choices && resp.choices[0] && resp.choices[0].message && resp.choices[0].message.content;
			const cleaned = cleanAnswer(content);
			console.log("AI extractor: extracted residentialNatureImpact =", cleaned || "(null)");
			return cleaned;
		} catch (e) {
			const msg = e && e.message ? e.message : String(e);
			const status = e && e.statusCode;
			console.error(`AI extractor: OpenAI call failed (attempt ${attempt}/${maxAttempts}):`, msg);
			// 429 or explicit insufficient_quota: don't retry
			if (status === 429 || /insufficient_quota/i.test(msg)) {
				console.error("AI extractor: insufficient quota or rate limit hit; not retrying");
				return null;
			}
			// Retry on 5xx or network-ish errors
			if (status && String(status).startsWith("5") || /ECONNRESET|ETIMEDOUT|ENOTFOUND/i.test(msg)) {
				if (attempt < maxAttempts) {
					const waitMs = 800 * attempt;
					console.log(`AI extractor: retrying after ${waitMs}ms...`);
					await sleep(waitMs);
					continue;
				}
			}
			// Other errors: no retry
			return null;
		}
	}
	return null;
}

module.exports = {
	extractResidentialNatureImpactAI
};


