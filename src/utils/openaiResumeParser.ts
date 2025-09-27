// /src/utils/openaiResumeParser.ts
import { openaiClient } from '../api/openai/openaiClient'
import { ParsedResumeData } from './resumeParser'

export interface OpenAIResumeParseRequest {
  text: string
  fileName?: string
}

export interface OpenAIResumeParseResponse {
  name: string
  email: string
  phone: string
  confidence: number
  rawResponse: string
  success: boolean
  error?: string
}

export class OpenAIResumeParser {
  private openaiClient = openaiClient

  async parseResumeWithAI(request: OpenAIResumeParseRequest): Promise<OpenAIResumeParseResponse> {
    try {
      const prompt = this.buildResumeParsePrompt(request.text, request.fileName)

      const response = await this.openaiClient.makeRequest(prompt)
      if (!response.success) {
        return {
          name: '',
          email: '',
          phone: '',
          confidence: 0,
          rawResponse: response.content,
          success: false,
          error: response.error || 'OpenAI request failed'
        }
      }

      const parsedData = this.parseAIResponse(response.content)
      return { ...parsedData, rawResponse: response.content, success: true }
    } catch (error) {
      console.error('OpenAI Resume Parser Error:', error)
      return {
        name: '',
        email: '',
        phone: '',
        confidence: 0,
        rawResponse: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Stronger prompt: force strict JSON output
   */
  private buildResumeParsePrompt(text: string, fileName?: string): string {
    return `You are a precise resume parser. 
Extract NAME, EMAIL, PHONE, and CONFIDENCE from the resume text below.

Return a SINGLE VALID JSON object only, no extra words, no markdown:
{
  "name": "",
  "email": "",
  "phone": "",
  "confidence": 0
}

Resume file: ${fileName ?? '[unknown]'}

---BEGIN RESUME TEXT---
${text}
---END RESUME TEXT---

Rules:
- name: Full name only (not company/job title)
- email: Best-matching email address or empty string
- phone: Best-matching phone number or empty string
- confidence: Integer 0–100 representing confidence in name extraction`
  }

  /**
   * Safe parse — JSON first, fallback to line parsing if model misbehaves
   */
  private parseAIResponse(response: string): Omit<OpenAIResumeParseResponse, 'rawResponse' | 'success' | 'error'> {
    let name = '', email = '', phone = '', confidence = 0
    const cleaned = response.trim().replace(/^```(json)?\n?|```$/g, '')

    // Try JSON parse
    try {
      const obj = JSON.parse(cleaned)
      name = (obj.name ?? '').toString().trim()
      email = (obj.email ?? '').toString().trim()
      phone = (obj.phone ?? '').toString().trim()
      confidence = Number.isFinite(+obj.confidence) ? parseInt(obj.confidence, 10) : 0
      return { name, email, phone, confidence }
    } catch {
      // Fallback: line-based parsing
      const lines = cleaned.split('\n').map(l => l.trim()).filter(Boolean)
      for (const line of lines) {
        if (line.startsWith('NAME:')) name = line.replace('NAME:', '').trim()
        else if (line.startsWith('EMAIL:')) email = line.replace('EMAIL:', '').trim()
        else if (line.startsWith('PHONE:')) phone = line.replace('PHONE:', '').trim()
        else if (line.startsWith('CONFIDENCE:')) confidence = parseInt(line.replace('CONFIDENCE:', '').trim(), 10) || 0
      }
      return { name, email, phone, confidence }
    }
  }

  /**
   * Regex fallback for extra safety
   */
  fallbackToRegex(text: string): ParsedResumeData {
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/)
    const phoneMatch = text.match(/(\+?\d[\d\s().-]{6,}\d)/)

    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    let name = ''
    for (const line of lines.slice(0, 6)) {
      if (line.length > 3 && line.length < 60 && !line.includes('@') && !/\d/.test(line)) {
        name = line
        break
      }
    }
    return { name, email: emailMatch?.[0] ?? '', phone: phoneMatch?.[0] ?? '', text }
  }
}

export const openaiResumeParser = new OpenAIResumeParser()
