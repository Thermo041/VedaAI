"use client";

import { useState, useRef } from "react";
import { FileCheck2, UploadCloud, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FileUploadProps = {
  onFileSelect: (file: File | null) => void;
  onTextExtracted: (text: string) => void;
};

const MAX_IMAGE_BYTES = 1024 * 1024;
const isSupportedFile = (file: File) =>
  file.type === "application/pdf" || file.type.startsWith("image/");

export function FileUpload({ onFileSelect, onTextExtracted }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/process-file", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to process file");
      }

      const data = await response.json();
      onTextExtracted(data.text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process file");
      setSelectedFile(null);
      onFileSelect(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleSelectedFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleSelectedFile(file);
    }
  };

  const handleSelectedFile = (file: File) => {
    setError("");

    if (!isSupportedFile(file)) {
      setSelectedFile(null);
      onFileSelect(null);
      onTextExtracted("");
      setError("Unsupported file type. Please upload a PDF or image.");
      return;
    }

    if (file.type.startsWith("image/") && file.size > MAX_IMAGE_BYTES) {
      setSelectedFile(null);
      onFileSelect(null);
      onTextExtracted("");
      setError("File size exceeds 1MB. Please upload a smaller image.");
      return;
    }

    setSelectedFile(file);
    onFileSelect(file);
    processFile(file);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "rounded-lg border-2 border-dashed p-8 text-center transition sm:p-10",
        isDragging
          ? "border-orange-500 bg-orange-50"
          : "border-zinc-300 bg-white/70 hover:border-zinc-400"
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {isProcessing ? (
        <div className="flex flex-col items-center">
          <Loader2 className="mb-3 h-9 w-9 animate-spin text-orange-600" />
          <p className="text-sm font-bold text-zinc-900">
            Extracting text from {selectedFile?.name}...
          </p>
        </div>
      ) : selectedFile ? (
        <div className="flex flex-col items-center">
          <FileCheck2 className="mb-3 h-9 w-9 text-emerald-600" />
          <p className="mb-1 max-w-full truncate text-sm font-bold text-zinc-900">
            {selectedFile.name}
          </p>
          <p className="mb-3 text-xs text-emerald-600">✓ Text extracted successfully</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => {
              setSelectedFile(null);
              onFileSelect(null);
              onTextExtracted("");
              setError("");
            }}
          >
            <X className="h-4 w-4" />
            Remove File
          </Button>
        </div>
      ) : (
        <>
          <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-md bg-white shadow-sm">
            <UploadCloud className="h-7 w-7 text-zinc-900" />
          </div>
          <p className="mb-2 text-base font-semibold text-zinc-900">
            Choose a file or drag & drop it here
          </p>
          <p className="mb-5 text-sm text-zinc-400">PDF, JPEG, PNG (max 1MB for images, 3 pages for PDFs)</p>
          <Button
            type="button"
            variant="outline"
            className="rounded-full border-0 bg-zinc-100 px-6 shadow-none hover:bg-zinc-200"
            onClick={() => fileInputRef.current?.click()}
          >
            Browse Files
          </Button>
        </>
      )}
      
      {error && (
        <p className="mt-4 text-sm font-semibold text-rose-600">
          {error}
        </p>
      )}
      
      <p className="mx-auto mt-5 max-w-md text-sm leading-6 text-zinc-500">
        Text will be automatically extracted using OCR. Images must be under 1MB, PDFs limited to 3 pages.
      </p>
    </div>
  );
}
