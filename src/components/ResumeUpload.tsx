import React, { useState } from 'react'
import { Upload, Button, Form, Input, Card, Alert, App } from 'antd'
import { InboxOutlined, UserOutlined, MailOutlined, PhoneOutlined, ReloadOutlined } from '@ant-design/icons'
import { useDispatch } from 'react-redux'
import { addCandidate, setCurrentCandidate, clearCurrentCandidate } from '../store/candidateSlice'
import { setCurrentInterview } from '../store/interviewSlice'
import { parseResume } from '../utils/resumeParser'
import { ValidationRules } from '../utils/validation'
import { useErrorHandler } from '../utils/errorHandler'
import type { UploadProps } from 'antd'

const { Dragger } = Upload

interface ResumeUploadProps {
  onUploadComplete: () => void
}

const ResumeUpload: React.FC<ResumeUploadProps> = ({ onUploadComplete }) => {
  const [form] = Form.useForm()
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { message } = App.useApp()
  const isMobile = window.innerWidth < 768
  
  const [uploading, setUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [aiParsingStatus, setAiParsingStatus] = useState<string | null>(null)

  const uploadProps: UploadProps = {
    name: 'resume',
    multiple: false,
    accept: '.pdf,.docx',
    beforeUpload: (file) => {
      try {
        ValidationRules.fileType(file, [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ])
        ValidationRules.fileSize(file, 10)
        handleFileUpload(file)
        return false
      } catch (error) {
        handleError(error as Error)
        return false
      }
    },
  }

  const handleFileUpload = async (file: File) => {
    setUploading(true)
    setParseError(null)
    setAiParsingStatus('🤖 Using OpenAI to extract information from resume...')
    
    try {
      const data = await parseResume(file)
      setUploadedFile(file)
      
      form.setFieldsValue({
        name: data.name,
        email: data.email,
        phone: data.phone
      })

      if (data.name) {
        setAiParsingStatus('✅ OpenAI successfully extracted information from resume!')
        message.success('Resume uploaded and parsed successfully with OpenAI!')
      } else {
        setAiParsingStatus('⚠️ OpenAI extraction completed, but name not found. Please verify the information below.')
        message.warning('Resume parsed, but name extraction was uncertain. Please verify the details.')
      }
    } catch (error) {
      setParseError('Failed to parse resume. Please fill in the details manually.')
      setAiParsingStatus('❌ OpenAI parsing failed. Using fallback method.')
      console.warn('Resume parsing failed:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleRefresh = () => {
    // Clear all data and reset form
    dispatch(clearCurrentCandidate())
    dispatch(setCurrentInterview(null))
    form.resetFields()
    message.success('Data cleared! You can start fresh now.')
  }



  const handleSubmit = async (values: { name: string; email: string; phone: string }) => {
    try {
      // Validate inputs
      ValidationRules.name(values.name)
      ValidationRules.email(values.email)
      if (values.phone) ValidationRules.phone(values.phone)

      const candidate = {
        id: Date.now().toString(),
        name: values.name.trim(),
        email: values.email.toLowerCase().trim(),
        phone: values.phone?.trim() || '',
        resumeFile: uploadedFile || undefined,
        uploadedAt: new Date().toISOString(),
        status: 'pending' as const
      }

      dispatch(addCandidate(candidate))
      dispatch(setCurrentCandidate(candidate))
      message.success('Candidate information saved!')
      onUploadComplete()
    } catch (error) {
      handleError(error as Error)
    }
  }

  return (
    <div className="h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 flex items-center justify-center p-4 overflow-hidden">
      <div className="w-full max-w-4xl h-[90vh]">
        <Card 
          className="shadow-2xl border-0 rounded-2xl overflow-hidden h-full"
          styles={{ body: { padding: 0, height: '100%' } }}
        >
          {/* Header Section */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <InboxOutlined className="text-white text-lg" />
              </div>
              <div>
                <h2 className="text-xl font-bold m-0">Upload Resume & Enter Details</h2>
                <p className="text-emerald-100 m-0 text-xs">Get started with your AI interview</p>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-4 h-[calc(100%-80px)] flex flex-col">
            {parseError && (
              <Alert
                message="Resume parsing failed"
                description={parseError}
                type="warning"
                showIcon
                closable
                onClose={() => setParseError(null)}
                className="mb-3 rounded-lg border-l-4 border-orange-400"
              />
            )}

            {aiParsingStatus && (
              <Alert
                message="OpenAI Resume Parsing"
                description={aiParsingStatus}
                type={aiParsingStatus.includes('✅') ? 'success' : aiParsingStatus.includes('⚠️') ? 'warning' : 'info'}
                showIcon
                closable
                onClose={() => setAiParsingStatus(null)}
                className="mb-3 rounded-lg border-l-4"
              />
            )}

            {/* Two Column Layout */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Resume Upload */}
              <div className="flex flex-col">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full"></div>
                  Upload Your Resume
                </h3>
                <Dragger 
                  {...uploadProps} 
                  className="resume-upload-dragger flex-1"
                  disabled={uploading}
                >
                  <div className="p-6 h-full flex flex-col justify-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <InboxOutlined className="text-white text-xl" />
                    </div>
                    <p className="text-lg font-semibold text-gray-900 mb-2">
                      {isMobile ? 'Tap to upload resume' : 'Click or drag resume to upload'}
                    </p>
                    <p className="text-sm text-gray-600 mb-3">
                      Support PDF and DOCX files only. Maximum size 10MB.
                    </p>
                    {uploading && (
                      <div className="flex items-center justify-center gap-2 text-emerald-600">
                        <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm font-medium">Processing...</span>
                      </div>
                    )}
                  </div>
                </Dragger>
              </div>

              {/* Right Column - Personal Information */}
              <div className="flex flex-col">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-teal-500 to-cyan-600 rounded-full"></div>
                  Personal Information
                </h3>
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleSubmit}
                  autoComplete="off"
                  size="middle"
                  className="flex-1 flex flex-col"
                >
                  <div className="flex-1 space-y-4">
                    <Form.Item
                      label={<span className="text-gray-700 font-medium text-sm">Full Name</span>}
                      name="name"
                      rules={[
                        { required: true, message: 'Please enter your name!' },
                        { min: 2, message: 'Name must be at least 2 characters' },
                        { max: 50, message: 'Name must be less than 50 characters' }
                      ]}
                    >
                      <Input 
                        prefix={<UserOutlined className="text-emerald-500" />} 
                        placeholder="Enter your full name"
                        size="large"
                        className="h-12 rounded-lg border-2 border-gray-200 focus:border-emerald-500 hover:border-emerald-400 transition-colors"
                      />
                    </Form.Item>

                    <Form.Item
                      label={<span className="text-gray-700 font-medium text-sm">Email Address</span>}
                      name="email"
                      rules={[
                        { required: true, message: 'Please enter your email!' },
                        { type: 'email', message: 'Please enter a valid email!' }
                      ]}
                    >
                      <Input 
                        prefix={<MailOutlined className="text-emerald-500" />} 
                        placeholder="Enter your email"
                        size="large"
                        className="h-12 rounded-lg border-2 border-gray-200 focus:border-emerald-500 hover:border-emerald-400 transition-colors"
                      />
                    </Form.Item>

                    <Form.Item
                      label={<span className="text-gray-700 font-medium text-sm">Phone Number <span className="text-gray-400 font-normal">(Optional)</span></span>}
                      name="phone"
                    >
                      <Input 
                        prefix={<PhoneOutlined className="text-emerald-500" />} 
                        placeholder="Enter your phone number"
                        size="large"
                        className="h-12 rounded-lg border-2 border-gray-200 focus:border-emerald-500 hover:border-emerald-400 transition-colors"
                      />
                    </Form.Item>
                  </div>
                </Form>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  size="large"
                  loading={uploading}
                  onClick={() => form.submit()}
                  className="h-12 bg-gradient-to-r from-emerald-600 to-teal-600 border-0 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex-1"
                >
                  Continue to Interview
                </Button>
                <Button 
                  type="default" 
                  icon={<ReloadOutlined />}
                  onClick={handleRefresh}
                  size="large"
                  className="h-12 rounded-lg font-semibold border-2 border-gray-300 hover:border-emerald-400 transition-all duration-300 flex-1"
                >
                  Clear & Start Fresh
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default ResumeUpload