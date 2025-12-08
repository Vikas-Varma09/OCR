## OCR Project (Node.js + Zonal OCR)

End-to-end PDF text extraction and mapping for mortgage valuation reports.

- Primary: Extract embedded text from digital PDFs via `pdf-parse` (fast, accurate).
- Fallback: Zonal OCR for scanned/low-text PDFs (render pages → crop zones → OCR via PaddleOCR).
- Parsing: Dedicated mappers in `src/mappers/*` normalize raw text to structured JSON.
- UI: Simple upload page served from `public/` to submit PDFs and view JSON responses.
- Tests: Jest unit tests; fixture-based runner for multiple raw samples.


### Requirements
- Node.js 18+ (recommended)
- Python 3.9+ (only required if you use the zonal OCR fallback)
- Optional OS tools for robust PDF/image handling (e.g., poppler/ghostscript on some platforms)


### Installation
1) Install Node dependencies:

```bash
npm install
```

2) (Optional) Install PaddleOCR for zonal OCR fallback:

```bash
pip install paddlepaddle paddleocr
# For GPU builds, install the appropriate paddlepaddle-gpu wheel for your CUDA/cuDNN, then:
# pip install paddleocr
```


### Run the server
```bash
npm start
```
Then open the UI at `http://localhost:3000`. Use the Upload tab to select a PDF and view the JSON response.


### API Reference
- POST `/api/extract`
  - Content-Type: multipart/form-data
  - Fields:
    - `file` (required): PDF file
    - `applicationId` (optional): string
  - Response:
    - `success`: boolean
    - `method`: `"pdf-text"` or `"zone-ocr"`
    - `data`: structured JSON with header fields and mapped sections (e.g., `accommodation`, `construction`, `newBuild`, `valuationForFinancePurpose`, `rentalInformation`, `essentialRepairs`, `energyEfficiency`, `reports`, `conditionsOfProperty`, `valuersDeclaration`, `propertyType`)
    - `rawText`: full extracted text for debugging/validation

- GET `/api/zones/preview?file=/abs/path&template=btl_v1`
  - Optional helper for visualizing a zone template over the first page. Returns an image path.

- GET `/health`
  - Simple health check.


### Configuration
Create a `.env` (optional):

```
PORT=3000
UPLOAD_DIR=uploads
```

- `PORT`: server port (default 3000)
- `UPLOAD_DIR`: where uploads are stored (default `uploads`)

Query options (for internal/testing purposes):
- `method`: `auto` (default), `zone-ocr` (force zonal OCR)
- `template`: zone template (default `btl_v1`)
- `debug`: `true|false` (extra info in zonal pipeline)


### Zonal OCR Overview
Used for scanned/low-text PDFs:
1) Render page(s) to images at configured DPI.
2) Crop configured zones (from JSON templates in `src/pipelines/crop/zones/`).
3) Run OCR (PaddleOCR) on cropped regions.
4) Normalize and map text via mappers.

You can preview zones with `/api/zones/preview` to verify positions.


### Testing
```bash
npm test
```

Fixture Runner (see `__tests__/fixtures`):
- Env vars:
  - `FIXTURE=sample1` to run a single raw sample
  - `SKIP_EXPECTED=true` to skip expected JSON assertions and only ensure mappers run


### Project Structure (selected)
```
src/
  controllers/ocrController.js      # Orchestrates extraction and mapping
  mappers/                          # Each mapper parses a logical section
    accommodation.mapper.js
    currentOccupency.mapper.js
    construction.mapper.js
    newBuild.mapper.js
    valuersDeclaration.mapper.js
    generalRemarks.mapper.js
    valuationForFinancePurpose.mapper.js
    rentalInformation.mapper.js
    essentialRepairs.mapper.js
    energyEfficiency.mapper.js
    reports.mapper.js
    conditionsOfProperty.mapper.js
    propertyType.mapper.js
  services/
    valueParser.js                  # Header extraction, shared helpers
public/                             # Static upload UI (index.html, app.js, styles.css)
__tests__/                          # Jest tests and fixtures
```


### Mappers (How data is extracted)
Each mapper consumes the full `rawText` and extracts specific fields using robust regex/window-based logic.
Examples:
- `accommodation`: room counts, lift, gardens, outbuildings, floor area.
- `construction`: standard vs non-standard construction, materials, alterations/consents.
- `newBuild`: status, certificates, incentives, developer name.
- `valuersDeclaration`: valuer details, signature, qualifications, RICS number, address.
- `valuationForFinancePurpose`: market values, reinstatement cost, finance suitability.
- `rentalInformation`: rent in present/improved conditions, demand flags.
- `essentialRepairs`: essential repairs, re-inspection.
- `energyEfficiency`: EPC rating and score.
- `reports`: required reports flags (Timber/Damp, Mining, etc.).
- `services`: utilities, drainage, solar panels, shared access, rights of way.
- `conditionsOfProperty`: structural movement/modifications, communal maintenance, plot area, trees, slope, prone-to risks.


### UI (Static)
Located in `public/` and served by Express.
- Upload a PDF and (optionally) `applicationId`.
- View the full JSON in the Response panel.
- Documentation tab summarizes architecture, OCR modes, and usage.


### Known Limitations / Notes
- OCR accuracy depends on scan quality and layout consistency.
- Zonal templates may require adjustment for new document variants.
- Heuristics are tuned to provided samples; unusual formats may need mapper refinements.


### Security & Privacy
- Only PDF uploads are expected; sanitize and validate inputs in production.
- Configure retention policy for `UPLOAD_DIR` per organization requirements.
- Consider antivirus scanning and sandboxing in regulated environments.


### Repository
GitHub: https://github.com/Vikas-Varma09/OCR


