import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface Message {
  id: string
  type: 'question' | 'answer'
  content: string
  timestamp: string
  timeSpent?: number
}

export interface Interview {
  id: string
  candidateId: string
  messages: Message[]
  currentQuestionIndex: number
  isActive: boolean
  startTime?: string
  endTime?: string
  totalScore: number
  questionStartTime?: string
}

interface InterviewState {
  interviews: Interview[]
  currentInterview: Interview | null
  timerActive: boolean
}

const initialState: InterviewState = {
  interviews: [],
  currentInterview: null,
  timerActive: false
}

const interviewSlice = createSlice({
  name: 'interviews',
  initialState,
  reducers: {
    startInterview: (state, action: PayloadAction<{ candidateId: string }>) => {
      const newInterview: Interview = {
        id: Date.now().toString(),
        candidateId: action.payload.candidateId,
        messages: [],
        currentQuestionIndex: 0,
        isActive: true,
        startTime: new Date().toISOString(),
        totalScore: 0
      }
      state.interviews.push(newInterview)
      state.currentInterview = newInterview
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      if (state.currentInterview) {
        state.currentInterview.messages.push(action.payload)
      }
    },
    startTimer: (state) => {
      state.timerActive = true
      if (state.currentInterview) {
        state.currentInterview.questionStartTime = new Date().toISOString()
      }
    },
    stopTimer: (state) => {
      state.timerActive = false
    },
    endInterview: (state) => {
      if (state.currentInterview) {
        state.currentInterview.isActive = false
        state.currentInterview.endTime = new Date().toISOString()
      }
      state.timerActive = false
    },
    setCurrentInterview: (state, action: PayloadAction<Interview | null>) => {
      state.currentInterview = action.payload
    }
  }
})

export const { 
  startInterview, 
  addMessage, 
  startTimer, 
  stopTimer, 
  endInterview, 
  setCurrentInterview 
} = interviewSlice.actions
export default interviewSlice.reducer