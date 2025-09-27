import { openaiClient } from '../../api/openai/openaiClient'
import {
  GeneratedQuestion,
  AnswerEvaluation,
  NextQuestionRequest,
  EvaluateAnswerRequest,
  InterviewSummary
} from './types'

class AIInterviewService {
  private getDifficultyProgression(questionNumber: number): 'Easy' | 'Medium' | 'Hard' {
    if (questionNumber <= 2) return 'Easy'
    if (questionNumber <= 4) return 'Medium'
    return 'Hard'
  }

  private extractSkillsFromResume(resumeContent?: string): string[] {
    if (!resumeContent) return []
    
    const commonSkills = [
      'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'C++', 'C#',
      'SQL', 'MongoDB', 'PostgreSQL', 'AWS', 'Docker', 'Kubernetes', 'Git',
      'HTML', 'CSS', 'SASS', 'Webpack', 'Vite', 'Express', 'Django', 'Flask',
      'REST API', 'GraphQL', 'Microservices', 'Agile', 'Scrum', 'DevOps'
    ]
    
    const foundSkills = commonSkills.filter(skill => 
      resumeContent.toLowerCase().includes(skill.toLowerCase())
    )
    
    return foundSkills.length > 0 ? foundSkills : ['General Programming', 'Problem Solving']
  }

  async generateNextQuestion(request: NextQuestionRequest): Promise<GeneratedQuestion> {
    const { candidateInfo, context } = request
    
    // Determine difficulty based on progression
    const difficulty = this.getDifficultyProgression(context.questionNumber)
    
    // Extract skills from resume if available
    const skills = candidateInfo.skills.length > 0 
      ? candidateInfo.skills 
      : this.extractSkillsFromResume(candidateInfo.resumeContent)

    try {
      const response = await openaiClient.generateQuestion({
        candidateInfo: {
          name: candidateInfo.name,
          email: candidateInfo.email,
          skills,
          experience: candidateInfo.experience,
          position: candidateInfo.position
        },
        context: {
          questionNumber: context.questionNumber,
          difficulty,
          previousQuestions: context.previousQuestions,
          previousAnswers: context.previousAnswers
        }
      })

      if (!response.success) {
        // Fallback question if API fails
        return this.getFallbackQuestion(difficulty, context.questionNumber)
      }


      return {
        id: `question_${Date.now()}`,
        content: response.question,
        difficulty,
        expectedKeywords: response.expectedKeywords,
        timeLimit: response.timeLimit,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error generating question:', error)
      return this.getFallbackQuestion(difficulty, context.questionNumber)
    }
  }

  async evaluateAnswer(request: EvaluateAnswerRequest): Promise<AnswerEvaluation> {
    const { candidateInfo, question, answer, expectedKeywords, timeSpent } = request

    try {
      const response = await openaiClient.evaluateAnswer({
        candidateInfo: {
          name: candidateInfo.name,
          email: candidateInfo.email,
          skills: candidateInfo.skills,
          experience: candidateInfo.experience,
          position: candidateInfo.position
        },
        context: {
          questionNumber: 0, // Not needed for evaluation
          difficulty: 'Medium', // Not needed for evaluation
          previousQuestions: [question],
          previousAnswers: [answer]
        }
      })

      if (!response.success) {
        // Fallback evaluation if API fails
        return this.getFallbackEvaluation(answer, expectedKeywords, timeSpent)
      }

      return {
        score: response.score,
        feedback: response.feedback,
        strengths: response.strengths,
        improvements: response.improvements,
        keywordsMatched: response.keywordsMatched,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error evaluating answer:', error)
      return this.getFallbackEvaluation(answer, expectedKeywords, timeSpent)
    }
  }

  async generateInterviewSummary(
    questions: GeneratedQuestion[],
    evaluations: AnswerEvaluation[],
    startTime: string,
    endTime?: string
  ): Promise<InterviewSummary> {
    const totalQuestions = questions.length
    const totalScore = evaluations.reduce((sum, evaluation) => sum + evaluation.score, 0)
    const averageScore = totalQuestions > 0 ? Math.round(totalScore / totalQuestions) : 0
    
    const totalTime = endTime 
      ? new Date(endTime).getTime() - new Date(startTime).getTime()
      : Date.now() - new Date(startTime).getTime()
    
    // Prepare interview data for AI analysis
    const interviewData = questions.map((question, index) => ({
      questionNumber: index + 1,
      question: question.content,
      difficulty: question.difficulty,
      evaluation: evaluations[index] || null
    }))

    try {
      // Generate AI-powered summary
      const response = await openaiClient.generateInterviewSummary({
        interviewData,
        totalScore: averageScore,
        totalTime: Math.round(totalTime / 1000)
      })

      if (response.success) {
        return {
          totalQuestions,
          averageScore,
          totalTime: Math.round(totalTime / 1000),
          strengths: response.strengths || [],
          improvements: response.improvements || [],
          overallFeedback: response.overallFeedback || this.getFallbackFeedback(averageScore)
        }
      }
    } catch (error) {
      console.error('Error generating AI summary:', error)
    }

    // Fallback to basic summary if AI fails
    const allStrengths = evaluations.flatMap(evaluation => evaluation.strengths)
    const allImprovements = evaluations.flatMap(evaluation => evaluation.improvements)
    
    const uniqueStrengths = [...new Set(allStrengths)].slice(0, 5)
    const uniqueImprovements = [...new Set(allImprovements)].slice(0, 5)

    return {
      totalQuestions,
      averageScore,
      totalTime: Math.round(totalTime / 1000),
      strengths: uniqueStrengths,
      improvements: uniqueImprovements,
      overallFeedback: this.getFallbackFeedback(averageScore)
    }
  }

  private getFallbackFeedback(averageScore: number): string {
    if (averageScore >= 80) {
      return 'Excellent performance! The candidate demonstrated strong technical knowledge and communication skills.'
    } else if (averageScore >= 60) {
      return 'Good performance with room for improvement. The candidate shows potential and understanding of key concepts.'
    } else if (averageScore >= 40) {
      return 'Fair performance. The candidate needs to improve technical knowledge and communication skills.'
    } else {
      return 'Below expectations. The candidate requires significant improvement in technical skills and interview preparation.'
    }
  }

  private getFallbackQuestion(difficulty: 'Easy' | 'Medium' | 'Hard', questionNumber: number): GeneratedQuestion {
    const fallbackQuestions = {
      Easy: [
        'Can you tell me about yourself and your background?',
        'What programming languages are you most comfortable with?',
        'Describe a project you worked on recently.',
        'What interests you most about software development?',
        'How do you stay updated with new technologies?'
      ],
      Medium: [
        'Explain the difference between let, const, and var in JavaScript.',
        'How would you optimize a slow-performing web application?',
        'Describe your experience with version control systems.',
        'What is your approach to debugging complex issues?',
        'How do you ensure code quality in your projects?'
      ],
      Hard: [
        'Design a scalable architecture for a real-time chat application.',
        'Explain the CAP theorem and its implications for database design.',
        'How would you implement a caching strategy for a high-traffic website?',
        'Describe your experience with microservices architecture.',
        'What are the security considerations when building a web API?'
      ]
    }

    const questions = fallbackQuestions[difficulty]
    const questionIndex = (questionNumber - 1) % questions.length

    const fallbackQuestion = {
      id: `fallback_question_${Date.now()}`,
      content: questions[questionIndex],
      difficulty,
      expectedKeywords: this.getDefaultKeywords(difficulty),
      timeLimit: this.getTimeLimit(difficulty),
      timestamp: new Date().toISOString()
    }
    return fallbackQuestion
  }

  private getFallbackEvaluation(
    answer: string,
    expectedKeywords: string[],
    timeSpent: number
  ): AnswerEvaluation {
    
    const answerLength = answer.length
    const answerLower = answer.toLowerCase()
    
    // Check for keyword matches
    const keywordMatches = expectedKeywords.filter(keyword =>
      answerLower.includes(keyword.toLowerCase())
    ).length
    
    // Check for quality indicators
    const hasTechnicalTerms = /(javascript|python|java|react|node|sql|api|database|algorithm|function|variable|loop|array|object|class|method|framework|library|git|github|deployment|testing|debugging|optimization|performance|security|scalability|architecture|design pattern|mvc|rest|json|html|css|bootstrap|typescript|angular|vue|mongodb|mysql|postgresql|redis|docker|kubernetes|aws|azure|gcp|ci\/cd|agile|scrum|kanban|tdd|bdd|unit test|integration test|end-to-end|code review|refactoring|clean code|solid principles|dry|kiss|yagni)/i.test(answer)
    
    const hasExperienceTerms = /(experience|worked|developed|built|created|implemented|designed|managed|led|collaborated|team|project|company|years|months|responsibilities|achievements|challenges|solved|improved|increased|reduced|optimized|learned|studied|certified|degree|bachelor|master|phd|university|college|course|training|workshop|conference|meetup|blog|portfolio|github|linkedin|resume|cv)/i.test(answer)
    
    const hasGarbage = /^[^a-zA-Z0-9\s]*$/.test(answer) || answer.length < 3 || /^(.)\1*$/.test(answer)
    
    let score = 0
    
    // Penalize garbage answers heavily
    if (hasGarbage) {
      score = 10
    } else {
      // Base score for non-garbage answers
      score = 30
      
      // Length scoring
      if (answerLength > 20) score += 10
      if (answerLength > 50) score += 10
      if (answerLength > 100) score += 10
      if (answerLength > 200) score += 10
      
      // Technical content scoring
      if (hasTechnicalTerms) score += 20
      if (hasExperienceTerms) score += 15
      
      // Keyword matching
      if (expectedKeywords.length > 0) {
        const keywordScore = (keywordMatches / expectedKeywords.length) * 25
        score += keywordScore
      }
      
      // Time-based scoring (thoughtful answers)
      if (timeSpent > 5 && timeSpent < 120) score += 5
    }
    
    score = Math.min(100, Math.max(0, Math.round(score)))

    const strengths = []
    const improvements = []

    // Analyze strengths
    if (answerLength > 100) {
      strengths.push('Provided detailed response')
    }
    if (hasTechnicalTerms) {
      strengths.push('Demonstrated technical knowledge')
    }
    if (hasExperienceTerms) {
      strengths.push('Shared relevant experience')
    }
    if (keywordMatches > 0) {
      strengths.push('Mentioned relevant keywords')
    }
    if (timeSpent > 10 && timeSpent < 60) {
      strengths.push('Took appropriate time to respond')
    }

    // Analyze improvements
    if (hasGarbage) {
      improvements.push('Please provide a meaningful answer')
    } else {
      if (answerLength < 50) {
        improvements.push('Provide more detailed answers')
      }
      if (!hasTechnicalTerms && expectedKeywords.some(k => /(javascript|python|java|react|node|sql|api|database|algorithm)/i.test(k))) {
        improvements.push('Include more technical keywords and concepts')
      }
      if (!hasExperienceTerms) {
        improvements.push('Elaborate more on your experience')
      }
      if (keywordMatches === 0 && expectedKeywords.length > 0) {
        improvements.push('Address the specific keywords mentioned in the question')
      }
    }

    const feedback = hasGarbage 
      ? `Your answer received a score of ${score}/100. This appears to be random text or gibberish. Please provide a meaningful response to the interview question.`
      : `Your answer received a score of ${score}/100. ${strengths.length > 0 ? 'Strengths: ' + strengths.join(', ') : ''} ${improvements.length > 0 ? 'Areas for improvement: ' + improvements.join(', ') : ''}`


    return {
      score,
      feedback,
      strengths,
      improvements,
      keywordsMatched: expectedKeywords.filter(keyword =>
        answerLower.includes(keyword.toLowerCase())
      ),
      timestamp: new Date().toISOString()
    }
  }

  private getDefaultKeywords(difficulty: 'Easy' | 'Medium' | 'Hard'): string[] {
    const keywordMap = {
      Easy: ['experience', 'background', 'skills', 'project', 'learning'],
      Medium: ['optimization', 'performance', 'debugging', 'testing', 'architecture'],
      Hard: ['scalability', 'security', 'microservices', 'caching', 'distributed systems']
    }
    return keywordMap[difficulty]
  }

  private getTimeLimit(difficulty: 'Easy' | 'Medium' | 'Hard'): number {
    const timeLimits = {
      Easy: 20,
      Medium: 60,
      Hard: 120
    }
    return timeLimits[difficulty]
  }
}

export const aiInterviewService = new AIInterviewService()
export default AIInterviewService
