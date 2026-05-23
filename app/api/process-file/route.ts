import { NextRequest, NextResponse } from "next/server";

async function extractTextFromImage(file: File): Promise<string> {
  const apiKey = process.env.OCR_API_KEY || "K87018872188957";

  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  const body = new URLSearchParams({
    base64Image: `data:${file.type};base64,${base64}`,
    apikey: apiKey,
    language: "eng",
    isOverlayRequired: "false",
    detectOrientation: "true",
    scale: "true",
    OCREngine: "1",
  });

  console.log("[OCR] Calling OCR.space API for:", file.name);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
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

    console.log("[OCR] Success! Extracted", extractedText.length, "characters");
    return extractedText.trim();
  } finally {
    clearTimeout(timeout);
  }
}

async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const { PDFParse, VerbosityLevel } = await import("pdf-parse");
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log("[PDF] Parsing PDF:", file.name, "Size:", buffer.length);

    const parser = new PDFParse({ data: buffer, verbosity: VerbosityLevel.ERRORS });
    const result = await parser.getText();

    if (!result.text || result.text.trim().length === 0) {
      throw new Error("No text found in PDF");
    }

    console.log("[PDF] Success! Extracted", result.text.length, "characters from", result.pages.length, "pages");
    return result.text.trim();
  } catch (error) {
    console.error("[PDF] Error:", error);
    throw new Error("PDF extraction failed. Make sure PDF has selectable text (not scanned image)");
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    console.log("[ProcessFile] Received:", file.name, "Type:", file.type, "Size:", file.size);

    let extractedText: string;

    if (file.type === "application/pdf") {
      extractedText = await extractTextFromPDF(file);
    } else if (file.type.startsWith("image/")) {
      extractedText = await extractTextFromImage(file);
    } else if (file.type === "text/plain") {
      extractedText = await file.text();
      console.log("[ProcessFile] Text file read:", extractedText.length, "characters");
    } else {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      text: extractedText,
      fileName: file.name,
      fileType: file.type,
    });
  } catch (error) {
    console.error("[ProcessFile] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to process file",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
