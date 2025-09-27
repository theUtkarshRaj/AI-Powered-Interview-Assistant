import { message } from 'antd'

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
  static handle(error: AppError | Error | string): void {
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
    
    // Show user-friendly messages
    switch (errorType) {
      case ErrorType.NETWORK:
        message.error('Network connection failed. Please check your internet connection.')
        break
      case ErrorType.FILE_UPLOAD:
        message.error('File upload failed. Please try again with a valid PDF or DOCX file.')
        break
      case ErrorType.STORAGE:
        message.warning('Failed to save data locally. Your progress may not be preserved.')
        break
      case ErrorType.VALIDATION:
        message.error(errorMessage)
        break
      default:
        message.error(errorMessage)
    }
  }

  static createError(type: ErrorType, message: string, details?: any): AppError {
    return { type, message, details }
  }
}

// Global error boundary hook
export const useErrorHandler = () => {
  return {
    handleError: ErrorHandler.handle,
    createError: ErrorHandler.createError
  }
}