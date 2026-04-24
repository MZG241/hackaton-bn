// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParseModule = require("pdf-parse");
const mammoth = require("mammoth");
import csv from "csv-parser";
import { Readable } from "stream";

/**
 * Parser Service for PDF, Word and CSV files
 */
export const parserService = {
    /**
     * Parse PDF into text
     */
    async parsePDF(buffer: Buffer): Promise<string> {
        if (!buffer || buffer.length === 0) {
            throw new Error("Empty file buffer received");
        }

        let parser;
        try {
            // pdf-parse v2.x uses a class-based API
            const { PDFParse } = pdfParseModule;
            if (!PDFParse) {
                // Fallback for v1 if someone downgrades
                const fn = typeof pdfParseModule === "function" ? pdfParseModule : pdfParseModule.default;
                if (typeof fn !== "function") throw new Error("pdf-parse is not a function or class");
                const data = await fn(buffer);
                return data.text || "";
            }

            parser = new PDFParse({ data: buffer });
            const result = await parser.getText();
            return result.text || "";
        } catch (error: any) {
            console.error("[Parser Service] PDF Parse Error details:", error.message || error);
            throw new Error(`Failed to parse PDF file: ${error.message || 'Unknown error'}`);
        } finally {
            if (parser && typeof parser.destroy === "function") {
                await parser.destroy().catch(() => {});
            }
        }
    },

    /**
     * Parse Word (.docx) into text
     */
    async parseDocx(buffer: Buffer): Promise<string> {
        try {
            if (!buffer || buffer.length === 0) {
                throw new Error("Empty file buffer received");
            }
            
            const result = await mammoth.extractRawText({ buffer });
            return result.value || "";
        } catch (error: any) {
            console.error("[Parser Service] DOCX Parse Error details:", error.message || error);
            throw new Error(`Failed to parse Word document: ${error.message || 'Unknown error'}`);
        }
    },

    /**
     * Auto-detect and parse Resume (PDF or Docx)
     */
    async parseResume(buffer: Buffer, originalName?: string): Promise<string> {
        const name = (originalName || "").toLowerCase();
        
        // Check by extension first if provided
        if (name.endsWith(".docx")) {
            return this.parseDocx(buffer);
        }
        if (name.endsWith(".pdf")) {
            return this.parsePDF(buffer);
        }

        // Fallback to signature check
        const signature = buffer.slice(0, 4).toString("hex");
        
        // PDF signature: 25504446 (%PDF)
        if (signature === "25504446") {
            return this.parsePDF(buffer);
        }
        // ZIP/DOCX signature: 504b0304 (PK..)
        if (signature === "504b0304") {
            return this.parseDocx(buffer);
        }

        // Final fallback: try PDF then DOCX
        try {
            return await this.parsePDF(buffer);
        } catch (e) {
            return await this.parseDocx(buffer);
        }
    },

    /**
     * Parse CSV into JSON array
     */
    async parseCSV(buffer: Buffer): Promise<any[]> {
        return new Promise((resolve, reject) => {
            const results: any[] = [];
            const stream = Readable.from(buffer);
            stream
                .pipe(csv())
                .on("data", (data: any) => results.push(data))
                .on("end", () => resolve(results))
                .on("error", (error: Error) => reject(error));
        });
    }
};
