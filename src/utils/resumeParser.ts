import * as pdfjsLib from "pdfjs-dist";
import * as mammoth from "mammoth";
import { openaiResumeParser, OpenAIResumeParseRequest } from './openaiResumeParser';

export interface ParsedResumeData {
  name: string;
  email: string;
  phone: string;
  text: string;
}

// Configure PDF.js worker with fallback options
if (typeof window !== 'undefined') {
  try {
    // Use jsdelivr CDN with matching version (5.4.149)
    (pdfjsLib as any).GlobalWorkerOptions.workerSrc = 
      'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.149/build/pdf.worker.min.js';
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
        
        if (aiResult.success && aiResult.name && aiResult.name.trim().length > 0) {
          console.log('✅ OpenAI parsing successful:', aiResult);
          return { name: aiResult.name, email: aiResult.email, phone: aiResult.phone, text };
        } else {
          console.warn('⚠️ OpenAI extraction completed, but name not found. Using regex fallback.');
        }
      } catch (aiError) {
        console.warn('⚠️ OpenAI parsing error, using regex fallback:', aiError);
      }
    } else {
      console.warn('⚠️ No text extracted from resume, using regex fallback.');
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
        useSystemFonts: true,
        disableWorker: false,
        verbosity: 0
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
      console.warn('PDF parsing with worker failed, trying without worker:', pdfError);
      // Try without worker as fallback - need to create a new ArrayBuffer
      try {
        const newArrayBuffer = arrayBuffer.slice(); // Create a copy of the ArrayBuffer
        const pdf = await (pdfjsLib as any).getDocument({ 
          data: newArrayBuffer,
          useSystemFonts: true,
          disableWorker: true,
          verbosity: 0
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
        
        if (fullText.trim()) {
          return fullText.trim();
        }
      } catch (fallbackError) {
        console.warn('PDF parsing fallback also failed:', fallbackError);
      }
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

  // Name extraction - look in first 15 lines with better patterns
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  let name = '';
  
  for (let i = 0; i < Math.min(15, lines.length); i++) {
    const line = lines[i];
    
    // Skip common headers and empty lines
    if (/^(resume|cv|curriculum vitae|personal information|contact information|phone|email|address)$/i.test(line) || 
        line.length < 3) {
      continue;
    }
    
    // Look for name pattern - more flexible
    if (
      line.length >= 3 &&
      line.length <= 60 &&
      !line.includes('@') &&
      !/\d{3,}/.test(line) &&
      /^[A-Za-z\s\-\.']+$/.test(line) &&
      line.split(' ').length >= 1 &&
      line.split(' ').length <= 5 &&
      !/^(mr|mrs|ms|dr|prof|engr|mr\.|mrs\.|ms\.|dr\.|prof\.|engr\.)$/i.test(line.split(' ')[0])
    ) {
      name = line;
      break;
    }
  }
  
  // If still no name found, try extracting from filename
  if (!name && text.includes('Resume:')) {
    const match = text.match(/Resume:\s*([^.]+)/);
    if (match && match[1]) {
      name = match[1].trim();
    }
  }
  
  
  return { name, email, phone, text };
};
