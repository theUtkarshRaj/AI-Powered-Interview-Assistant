import React, { useState } from 'react'
import { Card, Row, Col, Button, Popconfirm, message, Modal, Input, Select } from 'antd'
import { UserOutlined, CheckCircleOutlined, ClockCircleOutlined, StarOutlined, ReloadOutlined, DeleteOutlined, SearchOutlined, SortAscendingOutlined } from '@ant-design/icons'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../store'
import { clearCurrentCandidate, deleteAllCandidates } from '../store/candidateSlice'
import { setCurrentInterview } from '../store/interviewSlice'
import CandidateList from './CandidateList.tsx'
import CandidateDetail from './CandidateDetail.tsx'

const { Search } = Input
const { Option } = Select

const Dashboard: React.FC = () => {
  const dispatch = useDispatch()
  const { candidates } = useSelector((state: RootState) => state.candidates)
  // const { interviews } = useSelector((state: RootState) => state.interviews)
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'score' | 'date'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Filter and sort candidates
  const filteredAndSortedCandidates = candidates
    .filter((candidate: any) => 
      candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (candidate.phone && candidate.phone.includes(searchTerm))
    )
    .sort((a: any, b: any) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'score':
          comparison = (a.score || 0) - (b.score || 0)
          break
        case 'date':
          comparison = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })

  const handleRefresh = () => {
    // Clear all data and reset to initial state
    dispatch(clearCurrentCandidate())
    dispatch(setCurrentInterview(null))
    setSelectedCandidateId(null)
    // Reload the page to start completely fresh
    window.location.reload()
  }

  const handleDeleteAllCandidates = () => {
    dispatch(deleteAllCandidates())
    dispatch(setCurrentInterview(null))
    setSelectedCandidateId(null)
    message.success('All candidates deleted successfully')
  }

  const stats = {
    total: candidates.length,
    completed: candidates.filter((c: any) => c.status === 'completed').length,
    interviewing: candidates.filter((c: any) => c.status === 'interviewing').length,
    avgScore: candidates.length > 0 
      ? Math.round(candidates.filter((c: any) => c.score).reduce((sum: number, c: any) => sum + (c.score || 0), 0) / candidates.filter((c: any) => c.score).length || 0)
      : 0
  }


  return (
    <div className="h-full bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.05),transparent_50%)]"></div>
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_20%,rgba(99,102,241,0.05),transparent_50%)]"></div>
        <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_80%,rgba(16,185,129,0.05),transparent_50%)]"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_80%,rgba(139,92,246,0.05),transparent_50%)]"></div>
      </div>

      {/* Dashboard Content */}
      <div className="w-full py-6 relative z-10">
        <div className="px-6 space-y-6">
          {/* Statistics Cards */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
              <h3 className="text-2xl font-bold text-gray-800">Overview Statistics</h3>
              <div className="ml-auto px-3 py-1 bg-blue-100 rounded-full border border-blue-200">
                <span className="text-sm font-medium text-blue-700">Live Data</span>
              </div>
            </div>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} lg={6}>
                <Card className="dashboard-stat-card" style={{ height: '120px', overflow: 'hidden' }}>
                  <div className="h-full flex flex-col justify-center relative z-10">
                    <div className="flex items-center justify-center mb-3">
                      <UserOutlined className="text-white text-2xl mr-3 drop-shadow-lg" />
                      <span className="text-white font-semibold text-sm drop-shadow-md">Total Candidates</span>
                    </div>
                    <div className="text-center">
                      <span className="text-4xl font-bold text-white drop-shadow-lg">{stats.total}</span>
                    </div>
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card className="dashboard-stat-card" style={{ height: '120px', overflow: 'hidden' }}>
                  <div className="h-full flex flex-col justify-center relative z-10">
                    <div className="flex items-center justify-center mb-3">
                      <CheckCircleOutlined className="text-white text-2xl mr-3 drop-shadow-lg" />
                      <span className="text-white font-semibold text-sm drop-shadow-md">Completed</span>
                    </div>
                    <div className="text-center">
                      <span className="text-4xl font-bold text-white drop-shadow-lg">{stats.completed}</span>
                    </div>
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card className="dashboard-stat-card" style={{ height: '120px', overflow: 'hidden' }}>
                  <div className="h-full flex flex-col justify-center relative z-10">
                    <div className="flex items-center justify-center mb-3">
                      <ClockCircleOutlined className="text-white text-2xl mr-3 drop-shadow-lg" />
                      <span className="text-white font-semibold text-sm drop-shadow-md">In Progress</span>
                    </div>
                    <div className="text-center">
                      <span className="text-4xl font-bold text-white drop-shadow-lg">{stats.interviewing}</span>
                    </div>
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card className="dashboard-stat-card" style={{ height: '120px', overflow: 'hidden' }}>
                  <div className="h-full flex flex-col justify-center relative z-10">
                    <div className="flex items-center justify-center mb-3">
                      <StarOutlined className="text-white text-2xl mr-3 drop-shadow-lg" />
                      <span className="text-white font-semibold text-sm drop-shadow-md">Average Score</span>
                    </div>
                    <div className="text-center">
                      <span className="text-4xl font-bold text-white drop-shadow-lg">{stats.avgScore}</span>
                      <span className="text-white text-lg ml-2 drop-shadow-md opacity-90">/ 100</span>
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>
          </div>

          {/* Candidate Management */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-teal-600 rounded-full"></div>
                  <h3 className="text-xl font-bold text-gray-800">Candidate Management</h3>
                </div>
                <div className="px-3 py-1 bg-green-100 rounded-full text-sm font-medium text-green-700 border border-green-200">
                  {filteredAndSortedCandidates.length} of {candidates.length} candidates
                </div>
              </div>
              <div className="flex items-center gap-3">
                {candidates.length > 0 && (
                  <Popconfirm
                    title="Delete All Candidates"
                    description="Are you sure you want to delete all candidates? This action cannot be undone."
                    onConfirm={handleDeleteAllCandidates}
                    okText="Yes, Delete All"
                    cancelText="Cancel"
                    okType="danger"
                  >
                    <Button 
                      danger
                      icon={<DeleteOutlined />} 
                      title="Delete all candidates"
                      size="small"
                      className="!bg-red-500 hover:!bg-red-600 !border-0 !text-white !font-medium !shadow-md hover:!shadow-lg transition-all duration-200"
                    >
                      Delete All
                    </Button>
                  </Popconfirm>
                )}
                <Button 
                  type="default" 
                  icon={<ReloadOutlined />} 
                  onClick={handleRefresh}
                  title="Clear all data and start fresh"
                  size="small"
                  className="!bg-orange-500 hover:!bg-orange-600 !border-0 !text-white !font-medium !shadow-md hover:!shadow-lg transition-all duration-200"
                >
                  Clear All Data
                </Button>
                {candidates.some((c: any) => c.status === 'completed') && (
                  <Button 
                    type="primary" 
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('showCompletedInterviews'))
                    }}
                    title="View interview history"
                    size="small"
                    className="!bg-blue-500 hover:!bg-blue-600 !border-0 !text-white !font-medium !shadow-md hover:!shadow-lg transition-all duration-200"
                  >
                    View Interview History
                  </Button>
                )}
              </div>
            </div>
            
            {/* Search and Sort Controls */}
            <div className="mb-6 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Search
                    placeholder="Search candidates by name, email, or phone"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ maxWidth: 400 }}
                    prefix={<SearchOutlined className="text-blue-500" />}
                    className="search-input-subtle"
                  />
                </div>
                
                <div className="flex gap-3">
                  <Select
                    value={sortBy}
                    onChange={setSortBy}
                    style={{ width: 140 }}
                    suffixIcon={<SortAscendingOutlined className="text-blue-500" />}
                    className="sort-select-subtle"
                  >
                    <Option value="name">Name</Option>
                    <Option value="score">Score</Option>
                    <Option value="date">Date</Option>
                  </Select>
                  
                  <Button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    icon={<SortAscendingOutlined />}
                    className={`sort-button-subtle ${sortOrder === 'asc' ? 'rotate-180' : ''}`}
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </Button>
                </div>
              </div>
            </div>
            
            <CandidateList
              candidates={filteredAndSortedCandidates}
              onCandidateSelect={setSelectedCandidateId}
              selectedId={selectedCandidateId}
            />
          </div>
        </div>
      </div>

      {/* Candidate Detail Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-600 rounded-lg flex items-center justify-center">
              <UserOutlined className="text-white text-sm" />
            </div>
            <span className="text-lg font-semibold text-gray-700">Candidate Details</span>
          </div>
        }
        open={!!selectedCandidateId}
        onCancel={() => setSelectedCandidateId(null)}
        footer={null}
        width={700}
        style={{ 
          maxHeight: '90vh',
          top: '5vh'
        }}
        styles={{
          body: {
            maxHeight: '75vh',
            overflowY: 'auto',
            padding: '20px',
            background: '#fafafa'
          }
        }}
        className="candidate-modal"
      >
        {selectedCandidateId && (
          <CandidateDetail
            candidateId={selectedCandidateId}
          />
        )}
      </Modal>
    </div>
  )
}

export default Dashboard