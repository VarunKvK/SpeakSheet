export async function analyzeUploadedFile(prompt, filePreviewData) {
    const response = await fetch("api/analyze",{
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({prompt, filePreviewData})
    })
    const data= await response.json();
    return data;
} 