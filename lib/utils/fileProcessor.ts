// File processing utilities for OCR and PDF text extraction

/**
 * Extract text from image using OCR.space API
 */
export async function extractTextFromImage(file: File): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_OCR_API_KEY || process.env.OCR_API_KEY;
  if (!apiKey) {
    throw new Error("OCR_API_KEY not configured");
  }

  const arrayBuffer = await file.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

  const formData = new FormData();
  formData.append("base64Image", base64);
  formData.append("apikey", apiKey);
  formData.append("language", "eng");
  formData.append("isOverlayRequired", "false");
  formData.append("detectOrientation", "true");
  formData.append("scale", "true");
  formData.append("OCREngine", "2");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`OCR API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.IsErroredOnProcessing) {
      throw new Error(data.ErrorMessage?.[0] || "OCR processing failed");
    }

    const extractedText = data.ParsedResults?.[0]?.ParsedText || "";

    if (!extractedText.trim()) {
      throw new Error("No text found in image");
    }

    return extractedText.trim();
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Extract text from PDF file
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const { PDFParse, VerbosityLevel } = await import("pdf-parse");
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const parser = new PDFParse({ data: buffer, verbosity: VerbosityLevel.ERRORS });
    const result = await parser.getText();
    
    if (!result.text || result.text.trim().length === 0) {
      throw new Error("No text found in PDF");
    }
    
    return result.text.trim();
  } catch (error) {
    throw new Error(`PDF extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Process uploaded file and extract text content
 */
export async function processUploadedFile(file: File): Promise<string> {
  const fileType = file.type;

  if (fileType === "application/pdf") {
    console.log(`[FileProcessor] Extracting text from PDF: ${file.name}`);
    return await extractTextFromPDF(file);
  } 
  
  if (fileType.startsWith("image/")) {
    console.log(`[FileProcessor] Extracting text from image: ${file.name}`);
    return await extractTextFromImage(file);
  }
  
  if (fileType === "text/plain") {
    console.log(`[FileProcessor] Reading text file: ${file.name}`);
    return await file.text();
  }

  throw new Error(`Unsupported file type: ${fileType}`);
}
