export interface OpenAIRequest {
  candidateInfo?: {
    name: string
    email?: string
    position?: string
    skills?: string[]
    experience?: string
  }
  context?: {
    difficulty?: 'Easy' | 'Medium' | 'Hard'
    questionNumber?: number
    previousQuestions?: string[]
    previousAnswers?: string[]
  }
}

export interface OpenAIResponse {
  content: string
  success: boolean
  error?: string
}

export interface QuestionGenerationResponse extends OpenAIResponse {
  question: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  expectedKeywords: string[]
  timeLimit: number
}

export interface AnswerEvaluationResponse extends OpenAIResponse {
  score: number
  feedback: string
  strengths: string[]
  improvements: string[]
  keywordsMatched: string[]
}

export interface InterviewSummaryRequest {
  interviewData: Array<{
    questionNumber: number
    question: string
    difficulty: 'Easy' | 'Medium' | 'Hard'
    evaluation: {
      score: number
      feedback: string
      strengths: string[]
      improvements: string[]
      keywordsMatched: string[]
    } | null
  }>
  totalScore: number
  totalTime: number
}

export interface InterviewSummaryResponse extends OpenAIResponse {
  strengths: string[]
  improvements: string[]
  overallFeedback: string
}
