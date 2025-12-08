import pdfParse from 'pdf-parse';
import fs from 'fs/promises';

class PDFLoader {
  async loadPDF(filePath: string): Promise<string> {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text;
    } catch (error) {
      console.error('Error loading PDF:', error);
      throw new Error('Failed to load PDF file');
    }
  }

  async chunkText(text: string, chunkSize: number = 2000, overlap: number = 200): Promise<string[]> {
    if (!text || text.trim().length === 0) {
      return [];
    }

    // Ensure overlap is less than chunkSize to prevent infinite loops
    const safeOverlap = Math.min(overlap, Math.floor(chunkSize / 2));
    const chunks: string[] = [];
    let start = 0;
    const textLength = text.length;

    while (start < textLength) {
      const end = Math.min(start + chunkSize, textLength);
      const chunk = text.slice(start, end);
      
      // Only add non-empty chunks
      if (chunk.trim().length > 0) {
        chunks.push(chunk);
      }
      
      // Move start position forward
      start = end - safeOverlap;
      
      // Safety check: ensure we always make progress
      if (start <= 0 || start >= textLength) {
        break;
      }
      
      // Prevent infinite loop - if we're not making progress, break
      if (chunks.length > 50000) { // Safety limit (reduced but still safe)
        console.warn(`Chunking limit reached at ${chunks.length} chunks. PDF is very large.`);
        break;
      }
    }

    console.log(`Created ${chunks.length} chunks from PDF (text length: ${textLength} characters)`);
    return chunks;
  }
}

export const pdfLoader = new PDFLoader();

