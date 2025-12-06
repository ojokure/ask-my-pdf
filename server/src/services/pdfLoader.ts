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

  async chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): Promise<string[]> {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      const chunk = text.slice(start, end);
      chunks.push(chunk);
      start = end - overlap;
    }

    return chunks;
  }
}

export const pdfLoader = new PDFLoader();

