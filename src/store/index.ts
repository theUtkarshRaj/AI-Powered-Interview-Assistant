import { configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import { combineReducers } from '@reduxjs/toolkit'
import candidateReducer from './candidateSlice'
import interviewReducer from './interviewSlice'
import { persistConfig } from './persistConfig'

const rootReducer = combineReducers({
  candidates: candidateReducer,
  interviews: interviewReducer,
})

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
  devTools: process.env.NODE_ENV !== 'production',
})

export const persistor = persistStore(store)

// Optional: Clear persisted state in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  (window as any).__CLEAR_PERSIST__ = () => {
    persistor.purge()
    window.location.reload()
  }
}

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch