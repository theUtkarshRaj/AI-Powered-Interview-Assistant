import storage from 'redux-persist/lib/storage'
import { PersistConfig } from 'redux-persist'

// Enhanced persistence configuration
export const persistConfig: PersistConfig<any> = {
  key: 'ai-interview-assistant',
  storage,
  version: 1,
  whitelist: ['candidates', 'interviews'],
  // Add migration for version updates
  migrate: (state: any) => {
    // Handle any data migrations between app versions
    return Promise.resolve(state)
  },
  // Throttle saves to reduce frequent writes
  throttle: 1000,
  // Transform data before persisting (optional)
  transforms: [],
  // Debug mode for development
  debug: process.env.NODE_ENV === 'development'
}
