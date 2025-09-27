import { ErrorHandler, ErrorType } from './errorHandler'

export const ValidationRules = {
  email: (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      throw ErrorHandler.createError(ErrorType.VALIDATION, 'Please enter a valid email address')
    }
    return true
  },

  phone: (value: string) => {
    if (value && value.length > 0) {
      // More lenient phone validation - just check it has some digits
      const phoneRegex = /[\d]{7,15}/
      if (!phoneRegex.test(value.replace(/[\s\-\(\)\+]/g, ''))) {
        throw ErrorHandler.createError(ErrorType.VALIDATION, 'Please enter a valid phone number')
      }
    }
    return true
  },

  name: (value: string) => {
    if (!value || value.trim().length < 2) {
      throw ErrorHandler.createError(ErrorType.VALIDATION, 'Name must be at least 2 characters long')
    }
    if (value.length > 50) {
      throw ErrorHandler.createError(ErrorType.VALIDATION, 'Name must be less than 50 characters')
    }
    return true
  },

  fileSize: (file: File, maxSizeMB: number = 10) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      throw ErrorHandler.createError(
        ErrorType.FILE_UPLOAD, 
        `File size must be less than ${maxSizeMB}MB`
      )
    }
    return true
  },

  fileType: (file: File, allowedTypes: string[]) => {
    if (!allowedTypes.includes(file.type)) {
      throw ErrorHandler.createError(
        ErrorType.FILE_UPLOAD,
        `File type not supported. Please upload: ${allowedTypes.join(', ')}`
      )
    }
    return true
  }
}