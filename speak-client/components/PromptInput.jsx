"use client";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { FileSpreadsheet, AlertCircle, Upload, X, FileCheck, Paperclip } from "lucide-react";
import { useState, useRef } from "react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { uploadToSupabase } from "@/lib/uploadToSupabase";


/**
 * PromptInput Component
 * 
 * An enhanced textarea component for natural language prompt input with inline file upload.
 * Features:
 * - Character counter with visual feedback
 * - Inline file upload icon
 * - Drag & drop file upload support
 * - Error state handling
 * - Helpful placeholder with examples
 * - Accessibility features (ARIA labels, keyboard navigation)
 * - Visual icon for context
 * - File preview with upload capability
 * 
 * @example
 * <PromptInput 
 *   value={prompt} 
 *   onChange={setPrompt}
 *   maxLength={500}
 *   error={validationError}
 *   setFile={Assign the value of the file}
 *  file={Used for validation of the file uploading}
 * />
 */
const PromptInput = ({
  value,
  promptValue,
  maxLength = 500,
  setError,
  error,
  className = "",
  setFile,
  file,
  uploading,
  setUploading,
  user
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);

  const characterCount = value.length;
  const isNearLimit = characterCount > maxLength * 0.8;
  const isOverLimit = characterCount > maxLength;

  /**
   * Calculates the character count color based on usage
   */
  const getCounterColor = () => {
    if (isOverLimit) return "text-red-500";
    if (isNearLimit) return "text-yellow-600";
    return "text-muted-foreground";
  };

  /**
   * Handle users prompts
   */
  const handlePrompt = (e) => {
    const newValue = e.target.value;
    if (!newValue) {
      toast.error("Prompt can't be empty");
      return;
    }
    if (newValue.length <= maxLength || newValue.length < value.length) {
      promptValue(newValue);
    }
  };

  /**
   * Validates file type and size
   */
  const validateFile = (file) => {
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "application/vnd.ms-excel", // .xls
      "text/csv", // .csv
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      toast.error("Please select a valid Excel (.xlsx, .xls) or CSV file");
      return false;
    }

    if (file.size > maxSize) {
      toast.error("File size must be less than 10MB");
      return false;
    }

    return true;
  };

  /**
   * Handles file selection
   */
  const handleFileSelect = async (selectedFile) => {
    if (!selectedFile) return;
    console.log
    if (validateFile(selectedFile)) {
      setFile(selectedFile);
      toast.success(`File "${selectedFile.name}" selected`);

      try {
        setUploading(true);

        // Use selectedFile directly, not file state
        const { publicUrl } = await uploadToSupabase(selectedFile, user.id);

        setFile(publicUrl);
        toast.success("File uploaded successfully!");
      } catch (error) {
        console.error("File upload failed:", error);
        toast.error("File upload failed");
      } finally {
        setUploading(false);
      }
    }
  };

  /**
   * Handles file upload
   */
  // const handleUpload = async () => {
  //   if (!file) {
  //     toast.error("Please select a file first");
  //     return;
  //   }

  //   setUploading(true);
  //   try {
  //     const { publicUrl, path } = await uploadToSupabase(file);
  //     toast.success("File uploaded successfully!");
  //     console.log("Uploaded file URL:", publicUrl);
  //   } catch (error) {
  //     console.error(error);
  //     toast.error("Upload failed. Please try again.");
  //   } finally {
  //     setUploading(false);
  //   }
  // };

  /**
   * Handles drag and drop events
   */
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    handleFileSelect(droppedFile);
  };

  /**
   * Removes selected file
   */
  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast.info("File removed");
  };

  /**
   * Triggers file input click
   */
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  /**
   * Formats file size for display
   */
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Label with icon */}
      <div className="flex items-center gap-2">
        <FileSpreadsheet
          className="h-4 w-4 text-muted-foreground"
          aria-hidden="true"
        />
        <label
          htmlFor="prompt-input"
          className="text-sm font-medium text-foreground"
        >
          Describe Your Spreadsheet
        </label>
      </div>

      {/* Helper text */}
      <p className="text-xs text-muted-foreground">
        Describe the data you want to track in natural language, or upload an existing spreadsheet
      </p>

      {/* Textarea container with focus ring */}
      <div
        className={`
          relative rounded-lg transition-all duration-200
          ${isFocused ? "ring-2 ring-primary ring-offset-2" : ""}
          ${error ? "ring-2 ring-red-500" : ""}
          ${isDragging ? "ring-2 ring-primary bg-primary/5" : ""}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Textarea
          id="prompt-input"
          className={`
            min-h-[120px] resize-none rounded-lg border-2 
            transition-colors duration-200 pr-24
            ${error ? "border-red-300 focus:border-red-500" : "border-border"}
            ${isOverLimit ? "text-red-600" : ""}
            ${isDragging ? "pointer-events-none" : ""}
          `}
          placeholder={isDragging
            ? "Drop your spreadsheet file here..."
            : "Example: Track gym members with their name, age, membership type (Basic/Premium/VIP), join date, and monthly fee"}
          value={value}
          onChange={(e) => { handlePrompt(e) }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          aria-describedby={error ? "prompt-error" : "prompt-help"}
          aria-invalid={!!error || isOverLimit}
          maxLength={maxLength}
        />

        {/* Bottom right controls */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          {/* Upload button icon */}
          <button
            type="button"
            onClick={handleUploadClick}
            className={`
              p-1.5 rounded-md transition-all duration-200
              hover:bg-primary/10 hover:scale-110 active:scale-95
              focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1
              ${file ? "text-green-600" : "text-muted-foreground hover:text-primary"}
            `}
            aria-label="Upload spreadsheet file"
            title="Upload spreadsheet"
          >
            {file ? (
              <FileCheck className="h-4 w-4" />
            ) : (
              <Paperclip className="h-4 w-4" />
            )}
          </button>

          {/* Character counter */}
          <div
            className={`
              text-xs font-medium px-1
              ${getCounterColor()}
            `}
            aria-live="polite"
            aria-atomic="true"
          >
            {characterCount}/{maxLength}
          </div>
        </div>

        {/* Hidden file input */}
        <Input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
          className="hidden"
          aria-label="Upload spreadsheet file"
        />

        {/* Drag overlay */}
        {isDragging && (
          <div className="absolute inset-0 rounded-lg bg-primary/5 border-2 border-primary border-dashed flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-primary animate-bounce" />
              <p className="text-sm font-medium text-primary">Drop your file here</p>
            </div>
          </div>
        )}
      </div>

      {/* File Preview Card - Shows when file is selected */}
      {file && (
        <div className="border-2 border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900 rounded-lg p-3 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <FileCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {file.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(file.size)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Upload status label */}
              {uploading ? (
                <span className="flex items-center text-xs text-muted-foreground">
                  <div className="mr-1.5 h-3 w-3 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  Uploading...
                </span>
              ) : file ? (
                <span className="flex items-center text-xs text-green-600">
                  <Upload className="mr-1.5 h-3 w-3" />
                  Uploaded successfully
                </span>
              ) : null}

              {/* Remove file button */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveFile}
                className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/30"
                aria-label="Remove file"
                disabled={uploading}
              >
                <X className="h-4 w-4 text-muted-foreground hover:text-red-600" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div
          id="prompt-error"
          className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-200 dark:border-red-900"
          role="alert"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {/* Helpful examples (shown when empty and not focused and no file) */}
      {!value && !isFocused && !file && (
        <div className="space-y-2 p-3 bg-muted/50 rounded-lg border border-dashed">
          <p className="font-medium text-xs text-foreground">💡 Try these examples:</p>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Track employee data: Name, Department, Salary, Start Date</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Inventory system with Product Name, SKU, Quantity, Price</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Student grades: Student Name, Subject, Score, Grade Level</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default PromptInput;