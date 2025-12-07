const form = document.getElementById("uploadForm");
const statusEl = document.getElementById("status");
const responseEl = document.getElementById("response");

function setStatus(msg, kind = "info") {
	statusEl.textContent = msg || "";
	statusEl.className = `status ${kind}`;
}

function showResponse(obj) {
	responseEl.textContent = JSON.stringify(obj, null, 2);
}

form.addEventListener("submit", async (e) => {
	e.preventDefault();
	setStatus("Uploading...", "info");
	showResponse({});

	const fileInput = document.getElementById("file");
	const appIdInput = document.getElementById("applicationId");
	const file = fileInput.files && fileInput.files[0];
	if (!file) {
		setStatus("Please choose a PDF file.", "error");
		return;
	}

	const fd = new FormData();
	fd.append("file", file);
	if (appIdInput.value) fd.append("applicationId", appIdInput.value.trim());

	try {
		const res = await fetch("/api/extract", {
			method: "POST",
			body: fd
		});
		const json = await res.json();
		if (!res.ok || json.success === false) {
			setStatus(json.message || "Request failed", "error");
		} else {
			setStatus("Success", "success");
		}
		showResponse(json);
	} catch (err) {
		setStatus(String(err), "error");
		showResponse({ error: String(err) });
	}
});


