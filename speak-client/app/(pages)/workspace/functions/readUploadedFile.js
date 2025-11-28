import * as XLSX from "xlsx";

export async function readFileData(file) {
    return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName]; 

      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      resolve(jsonData);
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}