import { useState, useCallback, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../store'
import { addMessage, startTimer, stopTimer, endInterview } from '../store/interviewSlice'
import { updateCandidate } from '../store/candidateSlice'
import { aiInterviewService } from '../services/aiInterview'
import { CandidateInfo, GeneratedQuestion, InterviewSession } from '../services/aiInterview/types'

interface UseAIInterviewReturn {
  // State
  currentQuestion: GeneratedQuestion | null
  userAnswer: string
  isGeneratingQuestion: boolean
  isEvaluatingAnswer: boolean
  interviewSession: InterviewSession | null
  error: string | null
  
  // Actions
  startAIInterview: (candidateInfo: CandidateInfo) => Promise<void>
  generateNextQuestion: () => Promise<void>
  submitAnswer: (answer: string, timeSpent: number) => Promise<void>
  endAIInterview: () => void
  clearError: () => void
}

export const useAIInterview = (): UseAIInterviewReturn => {
  const dispatch = useDispatch()
  // const { currentInterview, timerActive } = useSelector((state: RootState) => state.interviews)
  const { currentCandidate } = useSelector((state: RootState) => state.candidates)
  
  const [currentQuestion, setCurrentQuestion] = useState<GeneratedQuestion | null>(null)
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false)
  const [isEvaluatingAnswer, setIsEvaluatingAnswer] = useState(false)
  const [interviewSession, setInterviewSession] = useState<InterviewSession | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [userAnswer, setUserAnswer] = useState<string>('')
  
  const questionStartTimeRef = useRef<number>(Date.now())
  const maxQuestions = 6 // Maximum number of questions per interview

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const generateFirstQuestion = useCallback(async (candidateInfo: CandidateInfo, session: InterviewSession) => {
    try {
      setIsGeneratingQuestion(true)
      
      // Create the request object for the first question
      const request = {
        candidateInfo,
        context: {
          questionNumber: 1, // First question
          difficulty: 'Easy' as const,
          previousQuestions: [],
          previousAnswers: []
        }
      }
      
      const question = await aiInterviewService.generateNextQuestion(request)
      
      if (question) {
        setCurrentQuestion(question)
        
        // Add question to session
        const updatedSession = {
          ...session,
          questions: [...session.questions, question],
          currentQuestionIndex: session.currentQuestionIndex + 1
        }
        setInterviewSession(updatedSession)
        
        // Add question message to Redux store
        const questionMessage = {
          id: Date.now().toString(),
          content: question.content,
          type: 'question' as const,
          timestamp: new Date().toISOString(),
          questionId: question.id,
          difficulty: question.difficulty,
          timeLimit: question.timeLimit
        }
        dispatch(addMessage(questionMessage))
        
        // Start timer
        dispatch(startTimer())
        questionStartTimeRef.current = Date.now()
        
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate question'
      setError(errorMessage)
      console.error('Error generating first question:', err)
    } finally {
      setIsGeneratingQuestion(false)
    }
  }, [dispatch])

  const startAIInterview = useCallback(async (candidateInfo: CandidateInfo) => {
    try {
      setError(null)
      
      // Create new interview session
      const newSession: InterviewSession = {
        candidateId: candidateInfo.id,
        questions: [],
        evaluations: [],
        currentQuestionIndex: 0,
        totalScore: 0,
        averageScore: 0,
        isActive: true,
        startTime: new Date().toISOString()
      }
      
      setInterviewSession(newSession)
      
      // Generate first question directly
      await generateFirstQuestion(candidateInfo, newSession)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start AI interview'
      setError(errorMessage)
      console.error('Error starting AI interview:', err)
    }
  }, [generateFirstQuestion])

  const generateNextQuestion = useCallback(async (session?: InterviewSession) => {
    const currentSession = session || interviewSession
    if (!currentSession || !currentCandidate || isGeneratingQuestion) return

    try {
      setIsGeneratingQuestion(true)
      setError(null)

      const questionNumber = (currentSession.questions?.length || 0) + 1
      
      // Check if we've reached the maximum number of questions
      if (questionNumber > maxQuestions) {
        await endAIInterview(currentSession)
        return
      }

      const previousQuestions = (currentSession.questions || []).map(q => q.content)
      const previousAnswers = (currentSession.evaluations || []).map(e => e.feedback)

      const candidateInfo: CandidateInfo = {
        id: currentCandidate.id,
        name: currentCandidate.name,
        email: currentCandidate.email,
        skills: [], // Will be extracted from resume if available
        experience: 'Not specified',
        position: 'Software Developer',
        resumeContent: undefined // Could be extracted from uploaded resume
      }

      const question = await aiInterviewService.generateNextQuestion({
        candidateInfo,
        context: {
          questionNumber,
          difficulty: 'Easy' as const, // Will be determined by service based on question number
          previousQuestions,
          previousAnswers
        }
      })

      // Update interview session
      const updatedSession = {
        ...currentSession,
        questions: [...(currentSession.questions || []), question],
        currentQuestionIndex: (currentSession.questions?.length || 0)
      }
      setInterviewSession(updatedSession)
      setCurrentQuestion(question)

      // Add question to Redux store
      const questionMessage = {
        id: question.id,
        type: 'question' as const,
        content: question.content,
        timestamp: question.timestamp
      }
      dispatch(addMessage(questionMessage))

      // Start timer for this question
      dispatch(startTimer())
      questionStartTimeRef.current = Date.now()

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate question'
      setError(errorMessage)
      console.error('Error generating question:', err)
    } finally {
      setIsGeneratingQuestion(false)
    }
  }, [interviewSession, currentCandidate, isGeneratingQuestion, dispatch])

  const submitAnswer = useCallback(async (answer: string, timeSpent: number) => {
    if (!interviewSession || !currentQuestion || isEvaluatingAnswer) return

    try {
      setIsEvaluatingAnswer(true)
      setError(null)
      dispatch(stopTimer())

      // Store user answer temporarily for display
      setUserAnswer(answer)

      const candidateInfo: CandidateInfo = {
        id: currentCandidate!.id,
        name: currentCandidate!.name,
        email: currentCandidate!.email,
        skills: [],
        experience: 'Not specified',
        position: 'Software Developer'
      }

      // Evaluate the answer
      const evaluation = await aiInterviewService.evaluateAnswer({
        candidateInfo,
        question: currentQuestion.content,
        answer,
        expectedKeywords: currentQuestion.expectedKeywords,
        timeSpent
      })

      // Update interview session
      const currentEvaluations = interviewSession.evaluations || []
      const newEvaluations = [...currentEvaluations, evaluation]
      const newTotalScore = (interviewSession.totalScore || 0) + evaluation.score
      const newAverageScore = Math.round(newTotalScore / newEvaluations.length)
      
      const updatedSession = {
        ...interviewSession,
        evaluations: newEvaluations,
        totalScore: newTotalScore,
        averageScore: newAverageScore
      }
      setInterviewSession(updatedSession)
      
      // Clear current question and user answer after evaluation
      setCurrentQuestion(null)
      setUserAnswer('')

      // Check if interview should end (6 questions total)
      const totalEvaluations = newEvaluations.length
      if (totalEvaluations >= 6) {
        // End the interview
        await endAIInterview(updatedSession)
      } else {
        // Generate next question after a short delay using updated session
        setTimeout(() => {
          generateNextQuestion(updatedSession)
        }, 2000)
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to evaluate answer'
      setError(errorMessage)
      console.error('Error evaluating answer:', err)
    } finally {
      setIsEvaluatingAnswer(false)
    }
  }, [interviewSession, currentQuestion, currentCandidate, isEvaluatingAnswer, dispatch, generateNextQuestion])

  const endAIInterview = useCallback(async (session?: InterviewSession) => {
    const currentSession = session || interviewSession
    if (!currentSession) return

    try {
      // Generate final summary
      const summary = await aiInterviewService.generateInterviewSummary(
        currentSession.questions || [],
        currentSession.evaluations || [],
        currentSession.startTime,
        new Date().toISOString()
      )

      // Update interview session
      const finalSession = {
        ...currentSession,
        isActive: false,
        endTime: new Date().toISOString()
      }
      setInterviewSession(finalSession)

      // Update candidate with final results
      dispatch(updateCandidate({
        id: currentCandidate!.id,
        updates: {
          status: 'completed',
          score: summary.averageScore,
          summary: summary.overallFeedback
        }
      }))

      // End interview in Redux store
      dispatch(endInterview())

      // Add completion message
      const completionMessage = {
        id: `completion_${Date.now()}`,
        type: 'question' as const,
        content: `Interview completed! Final Score: ${summary.averageScore}/100\n\nOverall Feedback: ${summary.overallFeedback}\n\nTotal Questions: ${summary.totalQuestions}\nTotal Time: ${Math.round(summary.totalTime / 60)} minutes`,
        timestamp: new Date().toISOString()
      }
      dispatch(addMessage(completionMessage))

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to end interview'
      setError(errorMessage)
      console.error('Error ending interview:', err)
    }
  }, [interviewSession, currentCandidate, dispatch])

  return {
    // State
    currentQuestion,
    userAnswer,
    isGeneratingQuestion,
    isEvaluatingAnswer,
    interviewSession,
    error,
    
    // Actions
    startAIInterview,
    generateNextQuestion,
    submitAnswer,
    endAIInterview,
    clearError
  }
}

export default useAIInterview
