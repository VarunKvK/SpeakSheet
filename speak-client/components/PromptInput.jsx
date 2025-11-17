"use client";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
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
import { useState, useRef } from "react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { uploadToSupabase } from "@/lib/uploadToSupabase";
import { readFileData } from "@/app/(pages)/dashboard/functions/readUploadedFile";
import { cn } from "@/lib/utils"; // Make sure you have this from shadcn

/**
 * PromptInput Component (Refactored for Modern AI UX)
 * 
 * An enhanced textarea component for natural language prompt input with inline file upload,
 * inspired by modern AI interface designs.
 * 
 * Features:
 * - Unified, rounded container for a "canvas" feel.
 * - Integrated file preview token at the top.
 * - Floating pill-style controls for adding files and seeing character count.
 * - Seamless, borderless textarea.
 * - External "Thinking..." indicator for async operations.
 * - Retains all original functionality: drag & drop, validation, error handling.
 * 
 * @example
 * <PromptInput 
 *   value={prompt} 
 *   promptValue={setPrompt}
 *   maxLength={500}
 *   setError={setValidationError}
 *   error={validationError}
 *   setFile={setFile}
 *   file={file}
 *   uploading={uploading}
 *   setUploading={setUploading}
 *   setReadFile={setReadFile}
 *   user={user}
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
  setReadFile,
  user,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const characterCount = value.length;
  const isOverLimit = characterCount > maxLength;

  // --- All your original functions are preserved ---
  const handlePrompt = (e) => {
    const newValue = e.target.value;
    promptValue(newValue);
    // Note: Removed the toast on empty because it can be annoying while typing.
    // Validation should happen on submit, not on change.
  };

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

  const handleFileSelect = async (selectedFile) => {
    if (!selectedFile) return;

    if (validateFile(selectedFile)) {
      setFile(selectedFile); // Set the file object for preview first
      toast.success(`File "${selectedFile.name}" selected`);
      setUploading(true);

      try {
        const { publicUrl } = await uploadToSupabase(selectedFile, user.id);
        const fileData = await readFileData(selectedFile);
        
        // Update state after successful async operations
        setFile(publicUrl); // Now set the public URL
        setReadFile(fileData);

        toast.success("File uploaded and processed!");
      } catch (error) {
        console.error("File handling failed:", error);
        toast.error("File handling failed");
        setFile(null); // Clear file on failure
      } finally {
        setUploading(false);
      }
    }
  };

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
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setReadFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast.info("File removed");
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };


  return (
    <div className={cn("space-y-4", className)}>
      {/* The main input container inspired by the image */}
      <div
        className={cn(
          "relative w-full rounded-2xl bg-muted/20 p-4 transition-all duration-300",
          "border border-border/20",
          {
            "ring-2 ring-primary ring-offset-2 ring-offset-background": isFocused,
            "ring-2 ring-destructive": error,
            "border-primary bg-primary/5": isDragging,
          }
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
         {/* --- 3. Floating Pill Controls (Bottom) --- */}
        <div className="absolute bottom-4 left-4 flex items-center gap-2">
          {/* Add file button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUploadClick}
            className="h-8 gap-2 rounded-full bg-background shadow-sm"
          >
            <Plus className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Add File</span>
          </Button>

          {/* Ideas button (optional, for future use or examples) */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => textareaRef.current?.focus()}
            className="h-8 gap-2 rounded-full bg-background shadow-sm"
          >
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            <span className="text-sm">Ideas</span>
          </Button>
          
          {/* Character counter */}
          <div
            className={cn(
              "text-xs font-medium rounded-full px-2 py-1",
              isOverLimit ? "bg-destructive/20 text-destructive-foreground" : 
              isFocused ? "bg-background shadow-sm" : "bg-transparent text-muted-foreground"
            )}
          >
            {characterCount}/{maxLength}
          </div>
        </div>
        {/* --- 1. Integrated File Preview (Top Token) --- */}
        {file && (
          <div className="mb-3 flex animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2 rounded-lg bg-background p-2 pl-3 border shadow-sm">
                <FileCheck className="h-4 w-4 text-green-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {/* Show name from file object if it exists, otherwise show name from URL */}
                  {typeof file === 'object' && file.name ? file.name : file.split('/').pop()}
                </p>
                {typeof file === 'object' && file.size && (
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveFile}
                className="h-7 w-7 p-0 rounded-full hover:bg-destructive/10"
                aria-label="Remove file"
                disabled={uploading}
              >
                <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
          </div>
        )}

        {/* --- 2. Seamless Textarea --- */}
        <Textarea
          ref={textareaRef}
          id="prompt-input"
          className={cn(
            "w-full resize-none border-none bg-transparent p-0 pb-16 text-base",
            "min-h-[80px] focus-visible:ring-0 focus-visible:ring-offset-0",
            { "text-destructive": isOverLimit }
          )}
          placeholder={
            isDragging
              ? "Drop your spreadsheet file here..."
              : "Describe a spreadsheet, e.g., 'A weekly content calendar with columns for Topic, Channel, and Status'"
          }
          value={value}
          onChange={handlePrompt}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          maxLength={maxLength}
          aria-invalid={!!error || isOverLimit}
        />

        {/* --- 3. Floating Pill Controls (Bottom) --- */}
        <div className="absolute bottom-4 left-4 flex items-center gap-2">
          {/* Add file button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUploadClick}
            className="h-8 gap-2 rounded-full bg-background shadow-sm"
          >
            <Plus className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Add File</span>
          </Button>

          {/* Ideas button (optional, for future use or examples) */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => textareaRef.current?.focus()}
            className="h-8 gap-2 rounded-full bg-background shadow-sm"
          >
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            <span className="text-sm">Ideas</span>
          </Button>
          
          {/* Character counter */}
          <div
            className={cn(
              "text-xs font-medium rounded-full px-2 py-1",
              isOverLimit ? "bg-destructive/20 text-destructive-foreground" : 
              isFocused ? "bg-background shadow-sm" : "bg-transparent text-muted-foreground"
            )}
          >
            {characterCount}/{maxLength}
          </div>
        </div>

        {/* Hidden file input remains the same */}
        <Input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
          className="hidden"
        />

        {/* Drag overlay */}
        {isDragging && (
          <div className="absolute inset-0 rounded-2xl bg-primary/10 border-2 border-primary border-dashed flex flex-col items-center justify-center pointer-events-none">
            <Upload className="h-8 w-8 text-primary" />
            <p className="mt-2 text-sm font-medium text-primary">Drop to upload</p>
          </div>
        )}
      </div>

      {/* --- 4. "Thinking..." Indicator (External) --- */}
      {uploading && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground animate-in fade-in duration-300">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Uploading & processing file...</span>
        </div>
      )}

      {/* Error message remains for accessibility */}
      {error && (
        <div
          id="prompt-error"
          className="flex items-center gap-2 text-sm text-destructive"
          role="alert"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Example prompts can still be shown below */}
      {!value && !file && !isFocused && (
        <div className="space-y-2">
          <p className="font-medium text-xs text-muted-foreground">💡 Some ideas to get you started:</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="rounded-full text-xs" onClick={() => promptValue("Track employee data: Name, Department, Salary, Experience ,Start Date")}>Employee Tracker</Button>
            <Button size="sm" variant="outline" className="rounded-full text-xs" onClick={() => promptValue("Inventory system with Product Name, SKU, Quantity, Price")}>Inventory System</Button>
            <Button size="sm" variant="outline" className="rounded-full text-xs" onClick={() => promptValue("Student grades: Student Name, Subject, Score, Grade Level")}>Student Grades</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptInput;