import React from 'react'
import { Button } from 'antd'
import { 
  UserOutlined, 
  FileTextOutlined, 
  PlayCircleOutlined, 
  BarChartOutlined
} from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../store'
import { clearCurrentCandidate } from '../store/candidateSlice'
import { setCurrentInterview } from '../store/interviewSlice'

// const { Title, Text } = Typography

interface HomePageProps {
  onStartInterview: () => void
  onViewDashboard: () => void
  onRefresh: () => void
}

const HomePage: React.FC<HomePageProps> = ({ 
  onStartInterview, 
  onViewDashboard, 
  onRefresh 
}) => {
  const dispatch = useDispatch()
  const { candidates } = useSelector((state: RootState) => state.candidates)

  const stats = {
    totalCandidates: candidates.length,
    completedInterviews: candidates.filter((c: any) => c.status === 'completed').length,
    ongoingInterviews: candidates.filter((c: any) => c.status === 'interviewing').length,
    averageScore: candidates.length > 0 
      ? Math.round(candidates.filter((c: any) => c.score).reduce((sum: number, c: any) => sum + (c.score || 0), 0) / candidates.filter((c: any) => c.score).length || 0)
      : 0
  }

  const handleStartFresh = () => {
    dispatch(clearCurrentCandidate())
    dispatch(setCurrentInterview(null))
    onStartInterview()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              AI Interview
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Assistant
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Master your technical interviews with AI-powered practice sessions, real-time feedback, and personalized questions tailored to your experience.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                type="primary" 
                size="large"
                onClick={handleStartFresh}
                className="bg-gradient-to-r from-blue-600 to-purple-600 border-0 h-12 px-8 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Start Practice Session
              </Button>
              <Button 
                size="large"
                onClick={onViewDashboard}
                className="h-12 px-8 text-lg font-semibold rounded-full border-2 border-gray-300 hover:border-blue-500 transition-all duration-300"
              >
                View Analytics
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalCandidates}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <UserOutlined className="text-2xl text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-green-600">{stats.completedInterviews}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <FileTextOutlined className="text-2xl text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-3xl font-bold text-orange-600">{stats.ongoingInterviews}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <PlayCircleOutlined className="text-2xl text-orange-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Score</p>
                <p className="text-3xl font-bold text-purple-600">{stats.averageScore}/100</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <BarChartOutlined className="text-2xl text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <PlayCircleOutlined className="text-3xl text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Start Your Journey</h3>
              <p className="text-gray-600 mb-8 text-lg">
                Upload your resume and begin practicing with AI-powered interview questions tailored to your experience level.
              </p>
              <div className="space-y-4">
                <Button 
                  type="primary" 
                  size="large"
                  onClick={handleStartFresh}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 border-0 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Start Practice Session
                </Button>
                <Button 
                  size="large"
                  onClick={onRefresh}
                  className="w-full h-12 rounded-xl text-lg font-semibold border-2 border-gray-200 hover:border-red-300 hover:text-red-600 transition-all duration-300"
                >
                  Clear All Data
                </Button>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <BarChartOutlined className="text-3xl text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Track Your Progress</h3>
              <p className="text-gray-600 mb-8 text-lg">
                Monitor your performance, review past interviews, and analyze your improvement over time with detailed analytics.
              </p>
              <Button 
                type="primary" 
                size="large"
                onClick={onViewDashboard}
                className="w-full h-12 bg-gradient-to-r from-green-600 to-teal-600 border-0 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                View Analytics Dashboard
              </Button>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Our Platform?</h2>
          <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
            Experience the future of interview preparation with cutting-edge AI technology and comprehensive analytics.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">🤖</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">AI-Powered Questions</h3>
              <p className="text-gray-600">
                Get personalized interview questions generated by advanced AI based on your resume and experience level.
              </p>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">⚡</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Real-Time Feedback</h3>
              <p className="text-gray-600">
                Receive instant feedback on your answers with detailed analysis and improvement suggestions.
              </p>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">📊</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Advanced Analytics</h3>
              <p className="text-gray-600">
                Track your progress over time with comprehensive analytics and performance insights.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage