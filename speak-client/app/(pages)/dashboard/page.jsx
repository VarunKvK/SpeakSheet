"use client";
import GenerateButton from "@/components/GenerateButton";
import PromptInput from "@/components/PromptInput";
import React, { useEffect, useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { SchemaPreview } from "@/components/SchemaPreview";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";


/**
 * Dashboard Component
 *
 * Main dashboard for AI-powered spreadsheet schema generation.
 * Features:
 * - Clean, card-based layout
 * - Prompt input with validation
 * - Schema generation with success feedback
 * - Responsive design
 * - Clear visual hierarchy
 *
 * User Flow:
 * 1. User enters natural language description
 * 2. Clicks generate button
 * 3. System processes and displays schema
 * 4. Success message confirms generation
 */
const Dashboard = () => {
    const [prompt, setPrompt] = useState("");
    const [error, setError] = useState("");
    const [file, setFile] = useState()
    const [schema, setSchema] = useState(null);
    const [user, setUser] = useState()
    const [uploading, setUploading] = useState(false);
    const [excelUrl, setExcelUrl] = useState();

    useEffect(() => {
        const fetchUser = async () => {
            const { data, error } = await supabase.auth.getUser();
            if (error) {
                console.error("Error fetching user:", error);
            } else {
                setUser(data.user);
            }
        };
        fetchUser();
    }, []);


    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Main Content Card */}
                <Card className="shadow-xl border-2">
                    <CardHeader>
                        <CardTitle className="text-2xl">Create Your Spreadsheet</CardTitle>
                        <CardDescription className="text-base">
                            Describe what you want to track, and we'll generate the perfect
                            schema for you
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {/* Prompt Input */}
                        <PromptInput
                            value={prompt}
                            promptValue={setPrompt}
                            setError={setError}
                            error={error}
                            maxLength={500}
                            setFile={setFile}
                            file={file}
                            uploading={uploading}
                            setUploading={setUploading}
                            user={user}
                        />

                        {/* Generate Button */}
                        <div className="flex justify-end pt-4">
                            <GenerateButton
                                prompt={prompt}
                                setSchema={setSchema}
                                schema={schema}
                                fileUrl={file}
                                user={user}
                                setExcelUrl={setExcelUrl}
                            />
                        </div>
                        {excelUrl &&
                            <Link href={excelUrl}>
                                Download Link
                            </Link>}
                        {/* Schema Preview (if generated) */}
                        {schema && <SchemaPreview schema={schema} />}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;
