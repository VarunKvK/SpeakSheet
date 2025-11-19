"use client";

import { useState, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  FileSpreadsheet,
  AlertCircle,
  Upload,
  X,
  FileCheck,
  Plus,
  Lightbulb,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Logic imports
import { uploadToSupabase } from "@/lib/uploadToSupabase";
import { readFileData } from "@/app/(pages)/dashboard/functions/readUploadedFile";
import { analyzeUploadedFile } from "@/app/(pages)/dashboard/functions/analyzeUploadedFile";

// --- Constants ---
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_MIME_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-excel", // .xls
  "text/csv", // .csv
];

/**
 * Helper: Sanitize filename for Supabase Storage
 * Removes special characters to prevent storage path errors
 */
const sanitizeFilename = (originalName) => {
  const name = originalName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const timestamp = Date.now();
  return `${timestamp}-${name}`;
};

const PromptInput = ({
  value,
  promptValue,
  maxLength = 500,
  error,
  className = "",
  setFile,
  file,
  uploading,
  setUploading,
  setReadFile,
  user,
  setFileSchema,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const characterCount = value.length;
  const isOverLimit = characterCount > maxLength;

  // --- Handlers ---

  const handlePromptChange = (e) => {
    promptValue(e.target.value);
  };

  /**
   * Strictly validates file type and size
   */
  const validateFile = (fileToCheck) => {
    if (!ALLOWED_MIME_TYPES.includes(fileToCheck.type)) {
      toast.error("Invalid File Type", {
        description: "Please upload an Excel (.xlsx) or CSV file.",
      });
      return false;
    }

    if (fileToCheck.size > MAX_FILE_SIZE_BYTES) {
      toast.error("File Too Large", {
        description: `Max file size is ${MAX_FILE_SIZE_MB}MB.`,
      });
      return false;
    }
    return true;
  };

  const handleFileSelect = async (selectedFile) => {
    if (!selectedFile) return;

    // 1. Validation Layer
    if (!validateFile(selectedFile)) {
      // Reset input so user can try selecting the same file again if they fixed it
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // 2. Preparation Layer
    // Create a sanitized copy of the file to send to Supabase
    const sanitizedName = sanitizeFilename(selectedFile.name);
    const fileToUpload = new File([selectedFile], sanitizedName, {
      type: selectedFile.type,
    });

    setUploading(true);
    // Optimistic UI update (show file immediately)
    setFile(fileToUpload);
    toast.info("Processing file...");

    try {
      // 3. Upload Layer (Supabase)
      const uploadResult = await uploadToSupabase(fileToUpload, user.id);
      
      if (!uploadResult?.publicUrl) {
        throw new Error("Upload failed: No public URL returned.");
      }

      // 4. Parsing Layer (Client-side Read)
      // We read original file to save memory/latency vs fetching from URL immediately
      const fileData = await readFileData(selectedFile);
      if (!fileData) throw new Error("Failed to parse file data.");

      // 5. Intelligence Layer (Gemini/Analysis)
      const schema = await analyzeUploadedFile(value, fileData);
      
      if (!schema) throw new Error("AI Analysis failed to generate schema.");

      // 6. Success State Update
      setFile(uploadResult.publicUrl); // Store URL for persistence
      setReadFile(fileData);
      setFileSchema(schema);

      toast.success("Complete", {
        description: "File uploaded and analyzed successfully.",
      });

    } catch (err) {
      console.error("File Pipeline Error:", err);
      
      // Granular Error Messaging
      let errorMessage = "Something went wrong processing your file.";
      const msg = err.message || "";

      if (msg.includes("Upload")) errorMessage = "Failed to upload to cloud storage.";
      else if (msg.includes("parse")) errorMessage = "Could not read file contents.";
      else if (msg.includes("AI")) errorMessage = "AI Analysis failed. Please try again.";

      toast.error("Process Failed", { description: errorMessage });
      
      // Rollback state on failure
      handleRemoveFile(); 
    } finally {
      setUploading(false);
      // Reset input value to allow selecting the same file again if failed
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setReadFile(null);
    setFileSchema(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    // Only show toast if not currently uploading (prevents toast spam during error rollback)
    if (!uploading) toast.info("File removed");
  };

  // --- Drag & Drop Handlers ---

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // --- Helper for UI ---
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Helper to display file name safely
  const getFileName = () => {
    if (!file) return "";
    if (typeof file === "object" && file.name) return file.name;
    if (typeof file === "string") return file.split("/").pop() || "Uploaded File";
    return "File";
  };

  const getFileSize = () => {
    if (typeof file === "object" && file.size) return file.size;
    return 0;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Container */}
      <div
        className={cn(
          "relative w-full overflow-hidden transition-all duration-300",
          "bg-gradient-to-br from-background to-emerald-50/30 dark:to-emerald-950/10",
          "rounded-sm",
          "border-2 border-emerald-200/40 dark:border-emerald-800/40",
          "bg-[linear-gradient(to_right,#10b98114_1px,transparent_1px),linear-gradient(to_bottom,#10b98114_1px,transparent_1px)]",
          "bg-[size:20px_20px]",
          {
            "border-emerald-500 shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-500/20": isFocused,
            "border-red-400 shadow-lg shadow-red-500/20": error,
            "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20": isDragging,
          }
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Decorative Lines */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500" />
        <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500/20 via-emerald-400/10 to-transparent" />

        <div className="relative p-5">
          {/* File Preview Section */}
          {file && (
            <div className="mb-4 animate-in slide-in-from-top-2 duration-300">
              <div className="group relative flex items-center gap-3 border border-emerald-200 dark:border-emerald-800 bg-gradient-to-r from-emerald-50 to-white dark:from-emerald-950/50 dark:to-background p-3 shadow-sm">
                {/* Decorative corners */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-emerald-500" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-emerald-500" />
                
                <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-emerald-500 shadow-sm">
                  <FileSpreadsheet className="h-5 w-5 text-white" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate flex items-center gap-2">
                    {getFileName()}
                    <FileCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                   {formatFileSize(getFileSize())}
                  </p>
                </div>
                
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveFile}
                  className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-950 transition-colors"
                  disabled={uploading}
                >
                  <X className="h-4 w-4 text-muted-foreground hover:text-red-600" />
                  <span className="sr-only">Remove File</span>
                </Button>
              </div>
            </div>
          )}

          {/* Main Text Area */}
          <Textarea
            ref={textareaRef}
            id="prompt-input"
            className={cn(
              "w-full resize-none border-none bg-transparent p-0 pb-14 text-base",
              "min-h-[100px] focus-visible:ring-0 focus-visible:ring-offset-0",
              "placeholder:text-muted-foreground/60",
              { "text-red-600 dark:text-red-400": isOverLimit }
            )}
            placeholder={
              isDragging
                ? "📊 Drop your spreadsheet file here..."
                : "Describe your spreadsheet... e.g., 'A project tracker with columns for Task, Assignee, Status, and Deadline'"
            }
            value={value}
            onChange={handlePromptChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            maxLength={maxLength}
            aria-invalid={!!error || isOverLimit}
            disabled={uploading} 
          />

          {/* Bottom Controls */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className={cn(
                  "h-9 gap-2 rounded-sm border-emerald-300 dark:border-emerald-700",
                  "bg-white dark:bg-background shadow-sm",
                  "hover:bg-emerald-50 hover:border-emerald-400 dark:hover:bg-emerald-950/50",
                  "transition-all duration-200"
                )}
              >
                <Plus className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium">Add File</span>
              </Button>
            </div>
            
            <div
              className={cn(
                "flex items-center gap-2 rounded-sm px-3 py-1.5 text-xs font-mono font-semibold",
                "border shadow-sm transition-all duration-200",
                isOverLimit 
                  ? "bg-red-50 dark:bg-red-950/50 border-red-300 dark:border-red-800 text-red-700 dark:text-red-400" 
                  : "bg-white dark:bg-background border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
              )}
            >
              <span className="text-[10px] opacity-60">CHARS</span>
              <span>{characterCount}/{maxLength}</span>
            </div>
          </div>
        </div>

        <Input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
          className="hidden"
        />

        {isDragging && (
          <div className="absolute inset-0 z-50 bg-emerald-100/90 dark:bg-emerald-950/90 border-2 border-dashed border-emerald-500 flex flex-col items-center justify-center pointer-events-none backdrop-blur-sm">
            <div className="rounded-sm bg-emerald-500 p-4 shadow-lg">
              <Upload className="h-10 w-10 text-white animate-bounce" />
            </div>
            <p className="mt-4 text-base font-bold text-emerald-700 dark:text-emerald-300">
              Drop spreadsheet to upload
            </p>
            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-mono">
              .xlsx, .xls, .csv supported
            </p>
          </div>
        )}
      </div>

      {/* Processing State */}
      {uploading && (
        <div className="flex items-center justify-center gap-3 rounded-sm border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 animate-in fade-in duration-300">
          <div className="relative">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-600 dark:text-emerald-400" />
            <div className="absolute inset-0 h-5 w-5 animate-ping rounded-full bg-emerald-400/20" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              Processing spreadsheet...
            </span>
            <span className="text-xs text-emerald-600/70 dark:text-emerald-400/70">
              Uploading securely and analyzing structure
            </span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div
          className="flex items-center gap-3 rounded-sm border-l-4 border-red-500 bg-red-50 dark:bg-red-950/20 p-4 text-sm animate-in slide-in-from-left-2"
          role="alert"
        >
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
          <span className="font-medium text-red-700 dark:text-red-300">{error}</span>
        </div>
      )}

      {/* Quick Start Templates (Only show when empty) */}
      {!value && !file && !isFocused && !uploading && (
        <div className="space-y-3 animate-in fade-in duration-500">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <p className="font-semibold text-sm text-emerald-700 dark:text-emerald-300">
              Quick Start Templates
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
               { label: "Employee Tracker", prompt: "Track employee data: Name, Department, Salary, Experience, Start Date" },
               { label: "Inventory System", prompt: "Inventory system with Product Name, SKU, Quantity, Price" },
               { label: "Student Grades", prompt: "Student grades: Student Name, Subject, Score, Grade Level" }
            ].map((item, i) => (
              <Button
                key={i}
                size="sm"
                variant="outline"
                className="rounded-sm text-xs font-medium border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:border-emerald-400 transition-all"
                onClick={() => promptValue(item.prompt)}
              >
                <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptInput;