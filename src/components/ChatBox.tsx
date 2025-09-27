import React, { useState, useRef, useEffect } from 'react'
import { Card, Input, Button, Typography, Spin, Alert, Progress, Tag } from 'antd'
import { 
  SendOutlined, 
  UserOutlined, 
  RobotOutlined, 
  ExclamationCircleOutlined, 
  ReloadOutlined,
  HomeOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  BulbOutlined
} from '@ant-design/icons'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../store'
import { startInterview, setCurrentInterview } from '../store/interviewSlice'
import { updateCandidate, clearCurrentCandidate } from '../store/candidateSlice'
import QuestionTimer from './QuestionTimer'
import { useAIInterview } from '../hooks/useAIInterview'
import { CandidateInfo } from '../services/aiInterview/types'

const { TextArea } = Input
const { Text, Title } = Typography

const ChatBox: React.FC = () => {
  const dispatch = useDispatch()
  const { currentInterview, timerActive } = useSelector((state: RootState) => state.interviews)
  const { currentCandidate } = useSelector((state: RootState) => state.candidates)
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const interviewStartedRef = useRef(false)
  
  // AI Interview hook
  const {
    currentQuestion,
    userAnswer,
    isGeneratingQuestion,
    isEvaluatingAnswer,
    interviewSession,
    error,
    startAIInterview,
    submitAnswer,
    clearError
  } = useAIInterview()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleRefresh = () => {
    // Clear all data and reset to initial state
    interviewStartedRef.current = false
    dispatch(clearCurrentCandidate())
    dispatch(setCurrentInterview(null))
    setInputValue('')
    // Reload the page to start completely fresh
    window.location.reload()
  }

  const handleBackToHome = () => {
    // Navigate back to home tab
    window.dispatchEvent(new CustomEvent('navigateToHome'))
  }

  useEffect(() => {
    scrollToBottom()
  }, [currentInterview?.messages])

  useEffect(() => {
    // Start AI interview if candidate exists but no active interview
    if (currentCandidate && !currentInterview && !interviewSession && !interviewStartedRef.current) {
      interviewStartedRef.current = true
      
      const candidateInfo: CandidateInfo = {
        id: currentCandidate.id,
        name: currentCandidate.name,
        email: currentCandidate.email,
        skills: [], // Will be extracted from resume if available
        experience: 'Not specified',
        position: 'Software Developer',
        resumeContent: undefined
      }
      
      dispatch(startInterview({ candidateId: currentCandidate.id }))
      dispatch(updateCandidate({ 
        id: currentCandidate.id, 
        updates: { status: 'interviewing' } 
      }))
      
      // Start AI interview
      startAIInterview(candidateInfo)
    }
  }, [currentCandidate, currentInterview, interviewSession, dispatch])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !currentInterview || isEvaluatingAnswer) return

    const timeSpent = timerActive ? Math.floor((Date.now() - (currentQuestion?.timestamp ? new Date(currentQuestion.timestamp).getTime() : Date.now())) / 1000) : 120
    
    // Submit answer to AI for evaluation
    await submitAnswer(inputValue.trim(), timeSpent)
    setInputValue('')
  }

  const handleTimeUp = () => {
    if (inputValue.trim()) {
      handleSendMessage()
    } else {
      // Auto-submit "no response" if time runs out
      const timeSpent = currentQuestion?.timeLimit || 60
      submitAnswer('[No response provided within time limit]', timeSpent)
    }
  }

  const getCurrentQuestionNumber = () => {
    return interviewSession?.questions?.length || 0
  }

  const getTotalQuestions = () => {
    return 6 // Total questions in the interview
  }

  const isLoading = isGeneratingQuestion || isEvaluatingAnswer

  if (!currentCandidate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="shadow-2xl border-0 rounded-3xl p-8 text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <UserOutlined className="text-3xl text-white" />
          </div>
          <Title level={3} className="text-gray-800 mb-4">
            Resume Required
          </Title>
          <Text className="text-gray-600 text-lg">
            Please upload your resume to start the interview
          </Text>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-6">
        <Card className="shadow-2xl border-0 rounded-3xl max-w-lg">
          <Alert
            message="AI Interview Error"
            description={error}
            type="error"
            icon={<ExclamationCircleOutlined />}
            action={
              <Button size="small" danger onClick={clearError} className="mt-4">
                Dismiss
              </Button>
            }
          />
        </Card>
      </div>
    )
  }

  // Show loading state while AI is generating first question
  if (isGeneratingQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        <div className="bg-white shadow-lg border-b border-gray-200 px-6 py-4">
          <div className="w-full flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <RobotOutlined className="text-2xl text-white" />
              </div>
              <div>
                <Title level={2} className="mb-0 text-gray-800">
                  AI Interview - {currentCandidate.name}
                </Title>
                <Text type="secondary" className="text-base">
                  Preparing your interview...
                </Text>
              </div>
            </div>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={handleRefresh}
              className="h-10 px-4 bg-red-50 hover:bg-red-100 border-red-200 text-red-600"
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Loading Content */}
        <div className="w-full p-6">
          <Card className="shadow-2xl border-0 rounded-3xl">
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-8">
                <Spin size="large" className="text-white" />
              </div>
              <Title level={3} className="text-gray-800 mb-4">
                Preparing Your Interview
              </Title>
              <Text className="text-gray-600 text-lg text-center">
                Our AI is generating personalized questions based on your resume and experience.
                This may take a few moments...
              </Text>
            </div>
          </Card>
        </div>
      </div>
    )
  }

    return (
      <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Interview Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <RobotOutlined className="text-white text-lg" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 m-0">
                    Interview with {currentCandidate.name}
                  </h2>
                  <p className="text-sm text-gray-600 m-0">
                    Technical Interview Session
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button 
                  icon={<HomeOutlined />} 
                  onClick={handleBackToHome}
                  className="h-9 px-4"
                >
                  Home
                </Button>
                <Button 
                  icon={<ReloadOutlined />} 
                  onClick={handleRefresh}
                  danger
                  className="h-9 px-4"
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Fixed Height Layout with 2/3 + 1/3 split */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[calc(100vh-80px)] flex gap-4">
        {/* Chat Area - Left Side (2/3) */}
        <div className="flex-[2] bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col">
          {/* Messages Area - Single Question Display */}
          <div className="flex-1 flex flex-col p-3 overflow-hidden">
            {(!currentInterview?.messages || currentInterview.messages.length === 0) ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-3">
                  <RobotOutlined className="text-xl text-blue-600" />
                </div>
                <h3 className="text-base font-medium text-gray-900 mb-1">
                  Welcome to your AI Interview!
                </h3>
                <p className="text-gray-500 text-sm mb-3">
                  Our AI is preparing personalized questions for you.
                </p>
                <div className="flex items-center gap-2 text-blue-600">
                  <Spin size="small" />
                  <span className="text-xs">Setting up your interview...</span>
                </div>
              </div>
            ) : (
              <div className="space-y-1 flex-1 overflow-y-auto">
                {/* Current Question Display - Top Aligned */}
                {currentQuestion && (
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <RobotOutlined className="text-white text-lg" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-blue-900 mb-3 text-base">
                          Question {getCurrentQuestionNumber()}
                        </h4>
                        <p className="text-gray-800 text-base leading-relaxed m-0">
                          {currentQuestion.content}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Current Answer Display (if user has answered) */}
                {currentQuestion && userAnswer && (
                  <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <UserOutlined className="text-white text-lg" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-green-900 mb-3 text-base">
                          Your Answer
                        </h4>
                        <p className="text-gray-800 text-base leading-relaxed m-0">
                          {userAnswer}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Loading State */}
                {isLoading && (
                  <div className="flex justify-center py-3">
                    <div className="flex items-center gap-2 bg-gray-50 px-4 py-3 rounded-lg">
                      <Spin size="small" />
                      <span className="text-sm text-gray-600">
                        {isGeneratingQuestion ? 'Generating next question...' : 'Evaluating your answer...'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input Area - Fixed at bottom, same level as right column */}
          {currentInterview?.isActive && interviewSession?.isActive && currentQuestion && !userAnswer && (
            <div className="bg-gray-50 border-t border-gray-200 p-4 rounded-b-lg flex-shrink-0">
              <div className="flex gap-4">
                <TextArea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type your answer here..."
                  autoSize={{ minRows: 3, maxRows: 4 }}
                  onPressEnter={(e) => {
                    if (e.shiftKey) return
                    e.preventDefault()
                    handleSendMessage()
                  }}
                  disabled={isLoading}
                  className="flex-1 rounded-xl border-2 border-gray-200 focus:border-blue-500 pb-2"
                />
                <Button 
                  type="primary" 
                  icon={<SendOutlined />} 
                  onClick={handleSendMessage}
                  loading={isLoading}
                  disabled={!inputValue.trim() || isLoading}
                  className="h-12 px-6 bg-blue-600 border-0 rounded-xl font-semibold shadow-lg hover:shadow-xl"
                >
                  {isEvaluatingAnswer ? 'Evaluating...' : 'Send'}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Right Side (1/3) */}
        <div className="flex-[1] bg-white rounded-lg border border-gray-200 shadow-sm p-4 overflow-y-auto">
          <div className="space-y-3">
            {/* Progress */}
            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg p-3 border border-yellow-200">
              <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2 text-sm">
                <TrophyOutlined className="text-yellow-600 text-base" />
                PROGRESS
              </h4>
              <div className="mb-2">
                <Progress
                  percent={Math.round(((getCurrentQuestionNumber()) / getTotalQuestions()) * 100)}
                  strokeColor="#3b82f6"
                  className="mb-2"
                />
              </div>
              <p className="text-xs text-gray-700 m-0 font-semibold">
                Question {getCurrentQuestionNumber()} of {getTotalQuestions()}
              </p>
            </div>

            {/* Timer */}
            {currentQuestion && !userAnswer && currentInterview?.isActive && interviewSession?.isActive && (
              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-3 border border-green-200">
                <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2 text-sm">
                  <ClockCircleOutlined className="text-green-600 text-base" />
                  Timer
                </h4>
                <QuestionTimer
                  maxTime={currentQuestion.timeLimit || 60}
                  onTimeUp={handleTimeUp}
                  questionNumber={getCurrentQuestionNumber()}
                />
              </div>
            )}

            {/* Question Info */}
            {currentQuestion && !userAnswer && (
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-3 border border-orange-200">
                <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2 text-sm">
                  <BulbOutlined className="text-orange-600 text-base" />
                  Question Info
                </h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-xs text-gray-700 font-semibold">Difficulty: </span>
                    <Tag 
                      color={
                        currentQuestion?.difficulty === 'Easy' ? 'green' :
                        currentQuestion?.difficulty === 'Medium' ? 'orange' : 'red'
                      }
                      className="text-xs font-semibold"
                    >
                      {currentQuestion?.difficulty || 'Easy'}
                    </Tag>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-700 mb-1 font-semibold">Expected Keywords:</p>
                    <div className="flex flex-wrap gap-1">
                      {currentQuestion?.expectedKeywords?.map((keyword: string, index: number) => (
                        <Tag key={index} color="blue" className="text-xs font-semibold">
                          {keyword}
                        </Tag>
                      )) || <span className="text-xs text-gray-500">None specified</span>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Status */}
            <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
              <h4 className="font-bold text-gray-900 mb-2 text-sm">STATUS</h4>
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 font-semibold">Status:</span>
                  <Tag color={currentInterview?.isActive ? "green" : "red"} className="text-xs font-semibold">
                    {currentInterview?.isActive ? "ACTIVE" : "INACTIVE"}
                  </Tag>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 font-semibold">Mode:</span>
                  <span className="font-bold text-gray-800 text-xs">AI Interview</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 font-semibold">Candidate:</span>
                  <span className="font-bold text-blue-600 text-xs">{currentCandidate.name}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interview Completion - Overlay */}
      {(!currentInterview?.isActive || !interviewSession?.isActive) && currentInterview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrophyOutlined className="text-white text-xl" />
            </div>
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              Interview Completed! 🎉
            </h3>
            <p className="text-green-600 mb-4">
              Thank you for your time and effort.
            </p>
            {interviewSession && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-6 text-center">
                  <div>
                    <p className="text-2xl font-bold text-green-600 m-0">
                      {interviewSession.averageScore}/100
                    </p>
                    <p className="text-sm text-gray-600 m-0">Final Score</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600 m-0">
                      {interviewSession.questions.length}
                    </p>
                    <p className="text-sm text-gray-600 m-0">Questions Answered</p>
                  </div>
                </div>
              </div>
            )}
            <Button 
              type="primary" 
              onClick={handleBackToHome}
              className="mt-4"
            >
              Back to Home
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatBox