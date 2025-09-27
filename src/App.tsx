import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from './store'
import ResumeUpload from './components/ResumeUpload'
import ChatBox from './components/ChatBox'
import Dashboard from './components/Dashboard'
import HomePage from './components/HomePage'
import { PersistenceManager } from './utils/persistenceManager'
import { clearCurrentCandidate } from './store/candidateSlice'
import { setCurrentInterview } from './store/interviewSlice'
import { Home, User, BarChart3 } from 'lucide-react'

const App: React.FC = () => {
  const dispatch = useDispatch()
  const { currentCandidate } = useSelector((state: RootState) => state.candidates)
  const { interviews } = useSelector((state: RootState) => state.interviews)

  const [showChat, setShowChat] = useState(false)
  const [activeTab, setActiveTab] = useState('home')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initApp = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        console.error('App initialization error:', error)
      } finally {
        setIsLoading(false)
      }
    }
    initApp()
  }, [])


  useEffect(() => {
    if (!isLoading) {
      const interval = setInterval(() => {
        PersistenceManager.saveSessionState({
          currentTab: activeTab,
          lastActivity: new Date().toISOString(),
          hasOngoingInterview: interviews.some((i: any) => i.isActive)
        })
      }, 30000)
      return () => clearInterval(interval)
    }
  }, [activeTab, interviews, isLoading])

  useEffect(() => {
    if (!isLoading) {
      const handleBeforeUnload = () => {
        PersistenceManager.saveSessionState({
          currentTab: activeTab,
          lastActivity: new Date().toISOString(),
          hasOngoingInterview: interviews.some((i: any) => i.isActive)
        })
      }

      const handleNavigateToHome = () => {
        setActiveTab('home')
      }

      window.addEventListener('beforeunload', handleBeforeUnload)
      window.addEventListener('navigateToHome', handleNavigateToHome)
      
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload)
        window.removeEventListener('navigateToHome', handleNavigateToHome)
      }
    }
  }, [activeTab, interviews, isLoading])

  const handleStartInterview = () => {
    setActiveTab('interviewee')
    setShowChat(false)
  }

  const handleViewDashboard = () => {
    setActiveTab('interviewer')
  }

  const handleRefresh = () => {
    dispatch(clearCurrentCandidate())
    dispatch(setCurrentInterview(null))
    PersistenceManager.clearSessionState()
    setShowChat(false)
    setActiveTab('home')
  }


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Initializing AI Interview Assistant...</p>
        </div>
      </div>
    )
  }

  const navItems = [
    { id: 'home', label: 'Home', icon: <Home size={18} /> },
    { id: 'interviewee', label: 'Interviewee', icon: <User size={18} /> },
    { id: 'interviewer', label: 'Interviewer', icon: <BarChart3 size={18} /> },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors">
          {/* Navigation Bar */}
          <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm">
            <div className="w-full">
              <div className="flex items-center justify-between h-12 px-4">
                <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">AI Interview Assistant</h1>
                <nav className="flex gap-4">
                  {navItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`flex items-center gap-2 px-3 py-1 rounded-lg font-medium transition-all duration-200 ${
                        activeTab === item.id
                          ? 'bg-blue-600 text-white shadow'
                          : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                      }`}
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 w-full py-2">
            <div className="h-full animate-fade-in">
              {activeTab === 'home' && (
                <HomePage
                  onStartInterview={handleStartInterview}
                  onViewDashboard={handleViewDashboard}
                  onRefresh={handleRefresh}
                />
              )}

              {activeTab === 'interviewee' && (
                <div className="h-full">
                  {showChat || currentCandidate ? (
                    <ChatBox />
                  ) : (
                    <ResumeUpload onUploadComplete={() => setShowChat(true)} />
                  )}
                </div>
              )}

              {activeTab === 'interviewer' && (
                <div className="h-full">
                  <Dashboard />
                </div>
              )}
            </div>
          </main>
        </div>
  )
}

export default App
