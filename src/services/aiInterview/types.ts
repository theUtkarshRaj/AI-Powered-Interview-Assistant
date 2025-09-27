export interface CandidateInfo {
  id: string
  name: string
  email: string
  skills: string[]
  experience: string
  position: string
  resumeContent?: string
}

export interface QuestionContext {
  questionNumber: number
  difficulty: 'Easy' | 'Medium' | 'Hard'
  previousQuestions: string[]
  previousAnswers: string[]
  timeSpent?: number
}

export interface GeneratedQuestion {
  id: string
  content: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  expectedKeywords: string[]
  timeLimit: number
  timestamp: string
}

export interface AnswerEvaluation {
  score: number
  feedback: string
  strengths: string[]
  improvements: string[]
  keywordsMatched: string[]
  timestamp: string
}

export interface InterviewSession {
  candidateId: string
  questions: GeneratedQuestion[]
  evaluations: AnswerEvaluation[]
  currentQuestionIndex: number
  totalScore: number
  averageScore: number
  isActive: boolean
  startTime: string
  endTime?: string
}

export interface NextQuestionRequest {
  candidateInfo: CandidateInfo
  context: QuestionContext
}

export interface EvaluateAnswerRequest {
  candidateInfo: CandidateInfo
  question: string
  answer: string
  expectedKeywords: string[]
  timeSpent: number
}

export interface InterviewSummary {
  totalQuestions: number
  averageScore: number
  totalTime: number
  strengths: string[]
  improvements: string[]
  overallFeedback: string
}
