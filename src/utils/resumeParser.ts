import * as pdfjsLib from "pdfjs-dist";
import * as mammoth from "mammoth";
import { openaiResumeParser, OpenAIResumeParseRequest } from './openaiResumeParser';

export interface ParsedResumeData {
  name: string;
  email: string;
  phone: string;
  text: string;
}

// Configure PDF.js worker with local file path
if (typeof window !== 'undefined') {
  try {
    // Use local worker file to avoid CDN issues
    (pdfjsLib as any).GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  } catch (error) {
    console.warn('⚠️ PDF.js worker setup failed:', error);
  }
}

export const parseResume = async (file: File): Promise<ParsedResumeData> => {
  let text = '';

  try {
    if (file.type === 'application/pdf') {
      text = await parsePDF(file);
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      text = await parseDOCX(file);
    } else {
      throw new Error('Unsupported file type');
    }


    // Try OpenAI parsing first
    if (text.trim().length > 0) {
      try {
        const aiRequest: OpenAIResumeParseRequest = { text, fileName: file.name };
        const aiResult = await openaiResumeParser.parseResumeWithAI(aiRequest);
        
        if (aiResult.success && aiResult.name) {
          return { name: aiResult.name, email: aiResult.email, phone: aiResult.phone, text };
        } else {
        }
      } catch (aiError) {
        console.warn('⚠️ OpenAI parsing error, using regex fallback:', aiError);
      }
    } else {
    }

    // Regex fallback
    return regexFallback(text);

  } catch (error) {
    console.error('❌ Resume parsing failed:', error);
    return { name: '', email: '', phone: '', text: '' };
  }
};

// PDF parsing with simple fallback approach
const parsePDF = async (file: File): Promise<string> => {
  
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Try PDF parsing with proper worker
    try {
      const pdf = await (pdfjsLib as any).getDocument({ 
        data: arrayBuffer,
        useSystemFonts: true
      }).promise;
      
      let fullText = '';

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str || item.text || '')
            .filter((str: string) => str.trim().length > 0)
            .join(' ');
          
          if (pageText.trim()) {
            fullText += pageText + '\n';
          }
        } catch (pageError) {
          continue;
        }
      }

      fullText = fullText.trim();
      if (fullText.length > 0) {
        return fullText;
      }
    } catch (pdfError) {
    }

    // Fallback: Use filename to extract basic info
    const fileName = file.name.replace('.pdf', '').replace(/[_-]/g, ' ');
    return `Resume: ${fileName}. Please fill in your contact details manually.`;

  } catch (error) {
    console.error('❌ PDF parsing failed completely:', error);
    return 'PDF content could not be parsed. Please fill in details manually.';
  }
};

// DOCX parsing
const parseDOCX = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value || 'DOCX content could not be parsed. Please fill in details manually.';
  } catch (error) {
    console.warn('❌ DOCX parsing failed:', error);
    return 'DOCX content could not be parsed. Please fill in details manually.';
  }
};

// Regex fallback
const regexFallback = (text: string): ParsedResumeData => {
  
  // Email extraction
  const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/);
  const email = emailMatch?.[0] || '';

  // Phone extraction - multiple patterns
  const phonePatterns = [
    /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/,
    /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/,
    /\(\d{3}\)\s?\d{3}[-.\s]?\d{4}/
  ];
  
  let phone = '';
  for (const pattern of phonePatterns) {
    const match = text.match(pattern);
    if (match) {
      phone = match[0];
      break;
    }
  }

  // Name extraction - look in first 10 lines
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  let name = '';
  
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i];
    
    // Skip common headers
    if (/^(resume|cv|curriculum vitae|personal information|contact information)$/i.test(line)) {
      continue;
    }
    
    // Look for name pattern
    if (
      line.length >= 3 &&
      line.length <= 50 &&
      !line.includes('@') &&
      !/\d{3,}/.test(line) &&
      /^[A-Za-z\s\-\.]+$/.test(line) &&
      line.split(' ').length >= 2 &&
      line.split(' ').length <= 4
    ) {
      name = line;
      break;
    }
  }
  
  
  return { name, email, phone, text };
};
