import OpenAI from 'openai'
import { OpenAIRequest, OpenAIResponse, QuestionGenerationResponse, AnswerEvaluationResponse, InterviewSummaryRequest, InterviewSummaryResponse } from './types'

const API_KEY = import.meta.env.VITE_OPENAI_API_KEY || ''

class OpenAIClient {
  private openai: OpenAI | null = null

  constructor(apiKey?: string) {
    const key = apiKey || API_KEY
    
    if (!key) {
    } else {
      this.openai = new OpenAI({
        apiKey: key,
        dangerouslyAllowBrowser: true // Required for browser usage
      })
    }
  }

  async makeRequest(prompt: string): Promise<OpenAIResponse> {
    if (!this.openai) {
      return {
        content: 'AI service unavailable. Please check API configuration.',
        success: false,
        error: 'API key not configured'
      }
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1024,
        temperature: 0.7
      })

      if (response.choices && response.choices[0] && response.choices[0].message) {
        return {
          content: response.choices[0].message.content || '',
          success: true
        }
      } else {
        throw new Error('Invalid response format from OpenAI API')
      }
    } catch (error) {
      // Handle CORS and network errors gracefully
      if (error instanceof Error) {
        if (error.message.includes('CORS') || error.message.includes('fetch')) {
          return {
            content: 'AI service is temporarily unavailable due to network restrictions. Using fallback mode.',
            success: false,
            error: 'Network/CORS error - using fallback'
          }
        }
      }
      
      return {
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async generateQuestion(request: OpenAIRequest): Promise<QuestionGenerationResponse> {
    const prompt = this.buildQuestionPrompt(request)
    const response = await this.makeRequest(prompt)
    
    if (!response.success) {
      return {
        content: response.content,
        success: false,
        error: response.error,
        question: 'What are your key strengths and how do they align with this role?',
        difficulty: 'Medium',
        expectedKeywords: ['strengths', 'role', 'alignment'],
        timeLimit: 60
      }
    }

    try {
      // Parse the AI response to extract structured data
      const lines = response.content.split('\n').filter(line => line.trim())
      const question = lines[0] || 'What are your key strengths and how do they align with this role?'
      
      // Extract difficulty and keywords from the response
      const difficulty = this.extractDifficulty(response.content) || 'Medium'
      const expectedKeywords = this.extractKeywords(response.content)
      const timeLimit = this.getTimeLimit(difficulty)

      return {
        content: response.content,
        success: true,
        question,
        difficulty,
        expectedKeywords,
        timeLimit
      }
    } catch (error) {
      return {
        content: response.content,
        success: false,
        error: 'Failed to parse question response',
        question: 'What are your key strengths and how do they align with this role?',
        difficulty: 'Medium',
        expectedKeywords: ['strengths', 'role', 'alignment'],
        timeLimit: 60
      }
    }
  }

  async evaluateAnswer(request: OpenAIRequest): Promise<AnswerEvaluationResponse> {
    const prompt = this.buildEvaluationPrompt(request)
    const response = await this.makeRequest(prompt)
    
    if (!response.success) {
      return {
        content: response.content,
        success: false,
        error: response.error,
        score: 50,
        feedback: 'Unable to evaluate response due to technical issues.',
        strengths: [],
        improvements: ['Please try again'],
        keywordsMatched: []
      }
    }

    try {
      // Parse the AI response to extract evaluation data
      const score = this.extractScore(response.content) || 50
      const feedback = this.extractFeedback(response.content)
      const strengths = this.extractStrengths(response.content)
      const improvements = this.extractImprovements(response.content)
      const keywordsMatched = this.extractMatchedKeywords(response.content)

      return {
        content: response.content,
        success: true,
        score,
        feedback,
        strengths,
        improvements,
        keywordsMatched
      }
    } catch (error) {
      return {
        content: response.content,
        success: false,
        error: 'Failed to parse evaluation response',
        score: 50,
        feedback: 'Unable to evaluate response properly.',
        strengths: [],
        improvements: ['Please try again'],
        keywordsMatched: []
      }
    }
  }

  private buildQuestionPrompt(request: OpenAIRequest): string {
    const { candidateInfo, context } = request
    const difficulty = context?.difficulty || 'Medium'
    
    let prompt = `You are an AI interviewer conducting a technical interview. Generate a ${difficulty.toLowerCase()} level interview question.

Context:
- Question Number: ${context?.questionNumber || 1}
- Difficulty: ${difficulty}
- Position: ${candidateInfo?.position || 'Software Developer'}`

    if (candidateInfo) {
      prompt += `
- Candidate: ${candidateInfo.name}
- Skills: ${candidateInfo.skills?.join(', ') || 'Not specified'}
- Experience: ${candidateInfo.experience || 'Not specified'}`
    }

    if (context?.previousQuestions?.length) {
      prompt += `
- Previous questions asked: ${context.previousQuestions.join(', ')}`
    }

    prompt += `

Please generate:
1. A clear, specific ${difficulty.toLowerCase()} level interview question
2. Expected keywords that should be mentioned in a good answer
3. Brief context about why this question is important

Format your response as:
QUESTION: [Your question here]
KEYWORDS: [comma-separated keywords]
CONTEXT: [Brief explanation of the question's importance]`

    return prompt
  }

  private buildEvaluationPrompt(request: OpenAIRequest): string {
    const { context } = request
    
    return `You are an AI interviewer evaluating a candidate's answer. Please provide a detailed evaluation.

Question: ${context?.previousQuestions?.[context.previousQuestions.length - 1] || 'Interview question'}

Answer: ${context?.previousAnswers?.[context.previousAnswers.length - 1] || 'No answer provided'}

Please evaluate and provide:
1. A score from 0-100
2. Constructive feedback
3. Key strengths in the answer
4. Areas for improvement
5. Keywords that were successfully addressed

Format your response as:
SCORE: [0-100]
FEEDBACK: [Detailed feedback]
STRENGTHS: [comma-separated strengths]
IMPROVEMENTS: [comma-separated improvements]
KEYWORDS: [comma-separated matched keywords]`
  }

  private extractDifficulty(content: string): 'Easy' | 'Medium' | 'Hard' | null {
    const lowerContent = content.toLowerCase()
    if (lowerContent.includes('easy') || lowerContent.includes('basic')) return 'Easy'
    if (lowerContent.includes('hard') || lowerContent.includes('advanced')) return 'Hard'
    if (lowerContent.includes('medium') || lowerContent.includes('intermediate')) return 'Medium'
    return null
  }

  private extractKeywords(content: string): string[] {
    const keywordsMatch = content.match(/KEYWORDS?:\s*(.+)/i)
    if (keywordsMatch) {
      return keywordsMatch[1].split(',').map(k => k.trim()).filter(k => k.length > 0)
    }
    return []
  }

  private extractScore(content: string): number | null {
    const scoreMatch = content.match(/SCORE:\s*(\d+)/i)
    return scoreMatch ? parseInt(scoreMatch[1], 10) : null
  }

  private extractFeedback(content: string): string {
    const feedbackMatch = content.match(/FEEDBACK:\s*(.+?)(?=STRENGTHS|IMPROVEMENTS|KEYWORDS|$)/is)
    return feedbackMatch ? feedbackMatch[1].trim() : 'No specific feedback provided.'
  }

  private extractStrengths(content: string): string[] {
    const strengthsMatch = content.match(/STRENGTHS?:\s*(.+?)(?=IMPROVEMENTS|KEYWORDS|$)/is)
    if (strengthsMatch) {
      return strengthsMatch[1].split(',').map(s => s.trim()).filter(s => s.length > 0)
    }
    return []
  }

  private extractImprovements(content: string): string[] {
    const improvementsMatch = content.match(/IMPROVEMENTS?:\s*(.+?)(?=KEYWORDS|$)/is)
    if (improvementsMatch) {
      return improvementsMatch[1].split(',').map(i => i.trim()).filter(i => i.length > 0)
    }
    return []
  }

  private extractMatchedKeywords(content: string): string[] {
    const keywordsMatch = content.match(/KEYWORDS?:\s*(.+?)$/is)
    if (keywordsMatch) {
      return keywordsMatch[1].split(',').map(k => k.trim()).filter(k => k.length > 0)
    }
    return []
  }

  private getTimeLimit(difficulty: 'Easy' | 'Medium' | 'Hard'): number {
    switch (difficulty) {
      case 'Easy': return 20
      case 'Medium': return 60
      case 'Hard': return 120
      default: return 60
    }
  }

  async generateInterviewSummary(request: InterviewSummaryRequest): Promise<InterviewSummaryResponse> {
    if (!this.openai) {
      return {
        content: 'AI service unavailable. Please check API configuration.',
        success: false,
        error: 'API key not configured',
        strengths: [],
        improvements: [],
        overallFeedback: 'Unable to generate summary due to API configuration issues.'
      }
    }

    try {
      const prompt = this.buildInterviewSummaryPrompt(request)
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.7
      })

      if (response.choices && response.choices[0] && response.choices[0].message) {
        const content = response.choices[0].message.content || ''
        return {
          content,
          success: true,
          strengths: this.extractStrengths(content),
          improvements: this.extractImprovements(content),
          overallFeedback: this.extractOverallFeedback(content)
        }
      } else {
        throw new Error('Invalid response format from OpenAI API')
      }
    } catch (error) {
      console.error('Error generating interview summary:', error)
      return {
        content: 'Failed to generate interview summary',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        strengths: [],
        improvements: [],
        overallFeedback: 'Unable to generate detailed summary.'
      }
    }
  }

  private buildInterviewSummaryPrompt(request: InterviewSummaryRequest): string {
    const interviewDetails = request.interviewData.map(item => {
      const evaluation = item.evaluation
      return `
Question ${item.questionNumber} (${item.difficulty}):
Q: ${item.question}
${evaluation ? `
Score: ${evaluation.score}/100
Feedback: ${evaluation.feedback}
Strengths: ${evaluation.strengths.join(', ')}
Improvements: ${evaluation.improvements.join(', ')}
Keywords Matched: ${evaluation.keywordsMatched.join(', ')}
` : 'No evaluation available'}
---`
    }).join('\n')

    return `You are an expert technical interviewer analyzing a candidate's interview performance. Based on the following interview data, provide a comprehensive summary.

INTERVIEW DATA:
${interviewDetails}

TOTAL SCORE: ${request.totalScore}/100
TOTAL TIME: ${request.totalTime} seconds

Please analyze the candidate's performance and provide:

1. OVERALL_FEEDBACK: A comprehensive 2-3 paragraph summary of the candidate's overall performance, highlighting their technical knowledge, communication skills, problem-solving approach, and areas of expertise. Be specific about what they did well and what needs improvement.

2. STRENGTHS: List 3-5 specific strengths based on their actual answers and performance. Focus on concrete examples from their responses.

3. IMPROVEMENTS: List 3-5 specific areas for improvement based on their actual answers. Be constructive and specific about what they should work on.

Format your response as:
OVERALL_FEEDBACK: [Detailed 2-3 paragraph analysis]
STRENGTHS: [comma-separated specific strengths]
IMPROVEMENTS: [comma-separated specific improvements]`
  }

  private extractOverallFeedback(content: string): string {
    const feedbackMatch = content.match(/OVERALL_FEEDBACK:\s*(.+?)(?=STRENGTHS|IMPROVEMENTS|$)/is)
    return feedbackMatch ? feedbackMatch[1].trim() : 'No overall feedback provided.'
  }
}

export const openaiClient = new OpenAIClient()
export default OpenAIClient
