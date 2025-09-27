// Utility for managing app state persistence and restoration
export class PersistenceManager {
  private static STORAGE_KEY = 'ai-interview-app-session'
  
  static saveSessionState(data: {
    currentTab?: string
    lastActivity?: string
    hasOngoingInterview?: boolean
  }) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        ...data,
        timestamp: new Date().toISOString()
      }))
    } catch (error) {
      console.warn('Failed to save session state:', error)
    }
  }

  static getSessionState() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        const age = Date.now() - new Date(data.timestamp).getTime()
        // Consider session expired after 24 hours
        if (age < 24 * 60 * 60 * 1000) {
          return data
        }
      }
    } catch (error) {
      console.warn('Failed to retrieve session state:', error)
    }
    return null
  }

  static clearSessionState() {
    try {
      localStorage.removeItem(this.STORAGE_KEY)
    } catch (error) {
      console.warn('Failed to clear session state:', error)
    }
  }

  static shouldShowWelcomeBack(): boolean {
    const session = this.getSessionState()
    return session?.hasOngoingInterview || false
  }

  // Check if user has any persisted data
  static hasPersistedData(): boolean {
    try {
      const persistedData = localStorage.getItem('persist:ai-interview-assistant')
      if (persistedData) {
        const parsed = JSON.parse(persistedData)
        const candidates = parsed.candidates ? JSON.parse(parsed.candidates) : { candidates: [] }
        const interviews = parsed.interviews ? JSON.parse(parsed.interviews) : { interviews: [] }
        
        return candidates.candidates.length > 0 || interviews.interviews.length > 0
      }
    } catch (error) {
      console.warn('Error checking persisted data:', error)
    }
    return false
  }
}