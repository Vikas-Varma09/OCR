## Simple OCR API

A minimal OCR service that extracts raw text from PDFs using PaddleOCR.

- Primary: Extract embedded text from digital PDFs via `pdf-parse` (fast, accurate).
- Fallback: OCR using PaddleOCR for scanned PDFs or when text extraction fails.
- Returns: Raw text content from the PDF.


### Requirements
- Node.js 18+
- Python 3.9+ (required for PaddleOCR)
- Optional: Poppler tools for PDF rendering (pdftocairo, pdftotext)


### Installation
1) Install Node dependencies:

```bash
npm install
```

2) Install PaddleOCR:

```bash
pip install paddlepaddle paddleocr
# For GPU builds, install the appropriate paddlepaddle-gpu wheel for your CUDA/cuDNN, then:
# pip install paddleocr
```


### Run the server
```bash
npm start
```

Server runs on `http://localhost:3000` (default port).


### API Reference

**POST `/api/extract`**
- Content-Type: `multipart/form-data`
- Fields:
  - `file` (required): PDF file
- Query Parameters:
  - `lang` (optional): OCR language code (default: "en")
- Response:
  ```json
  {
    "success": true,
    "rawText": "extracted text content..."
  }
  ```

**GET `/health`**
- Health check endpoint
- Response: `{ "status": "ok" }`


### Configuration
Create a `.env` file (optional):

```
PORT=3000
UPLOAD_DIR=uploads
PYTHON_EXE=python
POPPLER_PATH=
```

- `PORT`: Server port (default: 3000)
- `UPLOAD_DIR`: Directory for temporary uploads (default: `uploads`)
- `PYTHON_EXE`: Python executable path (default: `python`)
- `POPPLER_PATH`: Path to Poppler tools (optional)


### How It Works
1. Tries to extract text directly from PDF using `pdf-parse` (for digital PDFs)
2. If text extraction fails or returns little text (< 100 characters), falls back to OCR:
   - Renders PDF pages to images
   - Runs PaddleOCR on each page
   - Combines all OCR results into a single text string
3. Returns normalized raw text


### Project Structure
```
src/
  index.js                    # Express server
  controllers/
    ocrController.js          # OCR extraction logic
  services/
    pdfTextExtractor.js      # PDF text extraction
  pipelines/
    pdf-to-images/
      render.js              # PDF to image conversion
    ocr/
      paddleOcr.js           # PaddleOCR integration
python/
  paddle_ocr.py              # Python OCR script
```


### Security & Privacy
- Only PDF uploads are accepted
- Uploaded PDFs are automatically deleted after processing
- Consider antivirus scanning and sandboxing in production environments


