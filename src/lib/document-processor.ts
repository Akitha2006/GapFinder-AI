import pdfParse from 'pdf-parse';

export interface ProcessedChunk {
  chunkIndex: number;
  pageNumber: number;
  sectionTitle: string;
  content: string;
}

export interface DocumentProcessResult {
  text: string;
  pageCount: number;
  chunks: ProcessedChunk[];
}

/**
 * Extracts raw text and page information from a Buffer (PDF or TXT)
 */
export async function extractTextFromBuffer(
  buffer: Buffer,
  fileType: 'pdf' | 'txt'
): Promise<{ text: string; pageCount: number }> {
  if (fileType === 'txt') {
    const text = buffer.toString('utf-8').trim();
    if (!text) {
      throw new Error("Uploaded text file is empty.");
    }
    return { text, pageCount: 1 };
  }

  if (fileType === 'pdf') {
    try {
      const data = await pdfParse(buffer);
      const text = data.text ? data.text.trim() : '';
      if (!text) {
        throw new Error("No readable text could be extracted from this PDF. It may be scanned or image-only.");
      }
      return {
        text,
        pageCount: data.numpages || 1,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown PDF parse error';
      throw new Error(`Failed to parse PDF document: ${message}`);
    }
  }

  throw new Error(`Unsupported file type: ${fileType}`);
}

/**
 * Splits document text into structured chunks with section titles and page indicators
 */
export function chunkDocumentText(
  text: string,
  pageCount: number = 1,
  targetChunkSize: number = 700,
  overlap: number = 100
): ProcessedChunk[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  // Normalize line endings
  const cleanText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const paragraphs = cleanText.split(/\n\s*\n/);

  const chunks: ProcessedChunk[] = [];
  let currentChunk = '';
  let currentSection = 'General Overview';
  let chunkIndex = 0;

  // Approximate page boundaries across the text length
  const totalLength = cleanText.length;
  const charsPerPage = Math.max(1, Math.floor(totalLength / Math.max(1, pageCount)));

  const sectionRegex = /^(?:chapter|unit|section|part|module|\d+\.\d+)\s*[:.-]?\s*([^\n]{3,60})/i;

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    // Detect section heading
    const firstLine = trimmed.split('\n')[0];
    const match = firstLine.match(sectionRegex);
    if (match) {
      currentSection = firstLine.slice(0, 70);
    } else if (firstLine.length < 50 && firstLine === firstLine.toUpperCase() && /[A-Z]/.test(firstLine)) {
      currentSection = firstLine;
    }

    if (currentChunk.length + trimmed.length > targetChunkSize && currentChunk.length > 0) {
      // Estimate page number
      const charOffset = chunks.length * targetChunkSize;
      const estimatedPage = Math.min(pageCount, Math.floor(charOffset / charsPerPage) + 1);

      chunks.push({
        chunkIndex,
        pageNumber: estimatedPage,
        sectionTitle: currentSection,
        content: currentChunk.trim(),
      });
      chunkIndex++;

      // Retain overlap from end of currentChunk
      const overlapStart = Math.max(0, currentChunk.length - overlap);
      currentChunk = currentChunk.slice(overlapStart) + '\n\n' + trimmed;
    } else {
      currentChunk = currentChunk ? `${currentChunk}\n\n${trimmed}` : trimmed;
    }
  }

  // Push remaining chunk
  if (currentChunk.trim().length > 0) {
    const charOffset = chunks.length * targetChunkSize;
    const estimatedPage = Math.min(pageCount, Math.floor(charOffset / charsPerPage) + 1);

    chunks.push({
      chunkIndex,
      pageNumber: estimatedPage,
      sectionTitle: currentSection,
      content: currentChunk.trim(),
    });
  }

  return chunks;
}
