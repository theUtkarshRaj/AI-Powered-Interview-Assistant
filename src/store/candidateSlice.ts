import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface Candidate {
  id: string
  name: string
  email: string
  phone: string
  resumeFile?: File
  uploadedAt: string
  status: 'pending' | 'interviewing' | 'completed'
  score?: number
  summary?: string
}

interface CandidateState {
  candidates: Candidate[]
  currentCandidate: Candidate | null
}

const initialState: CandidateState = {
  candidates: [],
  currentCandidate: null
}

const candidateSlice = createSlice({
  name: 'candidates',
  initialState,
  reducers: {
    addCandidate: (state, action: PayloadAction<Candidate>) => {
      state.candidates.push(action.payload)
    },
    setCurrentCandidate: (state, action: PayloadAction<Candidate>) => {
      state.currentCandidate = action.payload
    },
    updateCandidate: (state, action: PayloadAction<{ id: string; updates: Partial<Candidate> }>) => {
      const { id, updates } = action.payload
      const index = state.candidates.findIndex(c => c.id === id)
      if (index !== -1) {
        state.candidates[index] = { ...state.candidates[index], ...updates }
      }
      if (state.currentCandidate?.id === id) {
        state.currentCandidate = { ...state.currentCandidate, ...updates }
      }
    },
    clearCurrentCandidate: (state) => {
      state.currentCandidate = null
    },
    deleteCandidate: (state, action: PayloadAction<string>) => {
      const candidateId = action.payload
      state.candidates = state.candidates.filter(c => c.id !== candidateId)
      if (state.currentCandidate?.id === candidateId) {
        state.currentCandidate = null
      }
    },
    deleteAllCandidates: (state) => {
      state.candidates = []
      state.currentCandidate = null
    }
  }
})

export const { addCandidate, setCurrentCandidate, updateCandidate, clearCurrentCandidate, deleteCandidate, deleteAllCandidates } = candidateSlice.actions
export default candidateSlice.reducer