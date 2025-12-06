Add your OCR raw text fixtures here to test mappers across many PDFs.

Structure:

- raw/
  - sample1.txt           (raw text extracted from a PDF)
- expected/
  - sample1.json          (optional expected subset to assert)

Expected JSON format (subset match):

{
  "accommodation": {
    "hall": 0,
    "livingRooms": 1
  },
  "propertyType": {
    "tenure": "Leasehold",
    "flatMaisonetteFloor": 3
  }
}

Any provided keys are matched using Jest's toMatchObject, so you can include only fields you care about. If no expected file is present, the tests will still ensure no crashes and basic shape.


