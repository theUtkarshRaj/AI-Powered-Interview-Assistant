import { App } from 'antd'

export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  FILE_UPLOAD = 'FILE_UPLOAD',
  STORAGE = 'STORAGE',
  UNKNOWN = 'UNKNOWN'
}

export interface AppError {
  type: ErrorType
  message: string
  details?: any
}

export class ErrorHandler {
  static handle(error: AppError | Error | string, messageApi?: any): void {
    let errorMessage = 'An unexpected error occurred'
    let errorType = ErrorType.UNKNOWN

    if (typeof error === 'string') {
      errorMessage = error
    } else if (error instanceof Error) {
      errorMessage = error.message
    } else {
      errorMessage = error.message
      errorType = error.type
    }

    console.error('Application Error:', { type: errorType, message: errorMessage })
    
    // Use messageApi if available, otherwise fallback to console
    if (messageApi) {
      switch (errorType) {
        case ErrorType.NETWORK:
          messageApi.error('Network connection failed. Please check your internet connection.')
          break
        case ErrorType.FILE_UPLOAD:
          messageApi.error('File upload failed. Please try again with a valid PDF or DOCX file.')
          break
        case ErrorType.STORAGE:
          messageApi.warning('Failed to save data locally. Your progress may not be preserved.')
          break
        case ErrorType.VALIDATION:
          messageApi.error(errorMessage)
          break
        default:
          messageApi.error(errorMessage)
      }
    } else {
      console.error('Error (no message API available):', errorMessage)
    }
  }

  static createError(type: ErrorType, message: string, details?: any): AppError {
    return { type, message, details }
  }
}

// Global error boundary hook
export const useErrorHandler = () => {
  const { message } = App.useApp()
  
  return {
    handleError: (error: AppError | Error | string) => ErrorHandler.handle(error, message),
    createError: ErrorHandler.createError
  }
}