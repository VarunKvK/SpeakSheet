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
  Grid3x3,
} from "lucide-react";
import { useState, useRef } from "react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { uploadToSupabase } from "@/lib/uploadToSupabase";
import { readFileData } from "@/app/(pages)/dashboard/functions/readUploadedFile";
import { cn } from "@/lib/utils";

/**
 * PromptInput Component - Excel-Inspired Design
 * 
 * Features sharp, table-like aesthetics with green color theory
 * Subtle spreadsheet visual elements for brand consistency
 */
const   PromptInput = ({
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

  const handlePrompt = (e) => {
    const newValue = e.target.value;
    promptValue(newValue);
  };

  const validateFile = (file) => {
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];
    const maxSize = 10 * 1024 * 1024;

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
      setFile(selectedFile);
      toast.success(`File "${selectedFile.name}" selected`);
      setUploading(true);

      try {
        const { publicUrl } = await uploadToSupabase(selectedFile, user.id);
        const fileData = await readFileData(selectedFile);
        
        setFile(publicUrl);
        setReadFile(fileData);

        toast.success("File uploaded and processed!");
      } catch (error) {
        console.error("File handling failed:", error);
        toast.error("File handling failed");
        setFile(null);
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
      {/* Main Container - Sharp, Table-like Design */}
      <div
        className={cn(
          "relative w-full overflow-hidden transition-all duration-300",
          "bg-gradient-to-br from-background to-emerald-50/30 dark:to-emerald-950/10",
          // Sharp corners with subtle rounding
          "rounded-sm",
          // Table-inspired borders
          "border-2 border-emerald-200/40 dark:border-emerald-800/40",
          // Grid background pattern (subtle)
          "bg-[linear-gradient(to_right,#10b98114_1px,transparent_1px),linear-gradient(to_bottom,#10b98114_1px,transparent_1px)]",
          "bg-[size:20px_20px]",
          {
            // Focus state - green accent
            "border-emerald-500 shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-500/20": isFocused,
            // Error state
            "border-red-400 shadow-lg shadow-red-500/20": error,
            // Dragging state
            "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20": isDragging,
          }
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Top Header Bar (Excel-like) */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500" />
        
        {/* Left Accent Line */}
        <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500/20 via-emerald-400/10 to-transparent" />

        {/* Main Content Area */}
        <div className="relative p-5">
          {/* File Preview - Spreadsheet Header Style */}
          {file && (
            <div className="mb-4 animate-in slide-in-from-top-2 duration-300">
              <div className="group relative flex items-center gap-3 border border-emerald-200 dark:border-emerald-800 bg-gradient-to-r from-emerald-50 to-white dark:from-emerald-950/50 dark:to-background p-3 shadow-sm">
                {/* Decorative corner */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-emerald-500" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-emerald-500" />
                
                {/* File icon with green background */}
                <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-emerald-500 shadow-sm">
                  <FileSpreadsheet className="h-5 w-5 text-white" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate flex items-center gap-2">
                    {typeof file === 'object' && file.name ? file.name : file.split('/').pop()}
                    <FileCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  </p>
                  {typeof file === 'object' && file.size && (
                    <p className="text-xs text-muted-foreground font-mono">
                      {formatFileSize(file.size)}
                    </p>
                  )}
                </div>
                
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveFile}
                  className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-950 transition-colors"
                  aria-label="Remove file"
                  disabled={uploading}
                >
                  <X className="h-4 w-4 text-muted-foreground hover:text-red-600" />
                </Button>
              </div>
            </div>
          )}

          {/* Textarea */}
          <Textarea
            ref={textareaRef}
            id="prompt-input"
            className={cn(
              "w-full resize-none border-none bg-transparent p-2 pb-14 text-base",
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
            onChange={handlePrompt}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            maxLength={maxLength}
            aria-invalid={!!error || isOverLimit}
          />

          {/* Bottom Control Bar - Sharp Design */}
          <div className="absolute bottom-4 left-6.5 right-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {/* Add File Button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleUploadClick}
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

              {/* Grid Icon Button (Decorative) */}
              {/* <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => textareaRef.current?.focus()}
                className={cn(
                  "h-9 w-9 p-0 rounded-sm border-emerald-300 dark:border-emerald-700",
                  "bg-white dark:bg-background shadow-sm",
                  "hover:bg-emerald-50 hover:border-emerald-400 dark:hover:bg-emerald-950/50"
                )}
                title="Focus input"
              >
                <Grid3x3 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </Button> */}
            </div>
            
            {/* Character Counter - Table Cell Style */}
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

        {/* Hidden File Input */}
        <Input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
          className="hidden"
        />

        {/* Drag Overlay - Spreadsheet Theme */}
        {isDragging && (
          <div className="absolute inset-0 bg-emerald-100/90 dark:bg-emerald-950/90 border-2 border-dashed border-emerald-500 flex flex-col items-center justify-center pointer-events-none backdrop-blur-sm">
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

      {/* Upload Progress Indicator */}
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
              Uploading and analyzing file structure
            </span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          id="prompt-error"
          className="flex items-center gap-3 rounded-sm border-l-4 border-red-500 bg-red-50 dark:bg-red-950/20 p-4 text-sm"
          role="alert"
        >
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
          <span className="font-medium text-red-700 dark:text-red-300">{error}</span>
        </div>
      )}

      {/* Example Prompts - Table Style Pills */}
      {!value && !file && !isFocused && (
        <div className="space-y-3 animate-in fade-in duration-500">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <p className="font-semibold text-sm text-emerald-700 dark:text-emerald-300">
              Quick Start Templates
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              className="rounded-sm text-xs font-medium border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:border-emerald-400 transition-all"
              onClick={() => promptValue("Track employee data: Name, Department, Salary, Experience, Start Date")}
            >
              <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
              Employee Tracker
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-sm text-xs font-medium border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:border-emerald-400 transition-all"
              onClick={() => promptValue("Inventory system with Product Name, SKU, Quantity, Price")}
            >
              <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
              Inventory System
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-sm text-xs font-medium border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:border-emerald-400 transition-all"
              onClick={() => promptValue("Student grades: Student Name, Subject, Score, Grade Level")}
            >
              <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
              Student Grades
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptInput;