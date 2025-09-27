import React, { useState } from 'react'
import { Card, Table, Tag, Input, Select, Button, Space, Avatar, Popconfirm, message } from 'antd'
import { UserOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons'
import { useDispatch } from 'react-redux'
import { Candidate, deleteCandidate } from '../store/candidateSlice'
import type { ColumnsType } from 'antd/es/table'

const { Search } = Input
const { Option } = Select

interface CandidateListProps {
  candidates: Candidate[]
  onCandidateSelect: (candidateId: string) => void
  selectedId: string | null
}

const CandidateList: React.FC<CandidateListProps> = ({ candidates, onCandidateSelect, selectedId }) => {
  const dispatch = useDispatch()
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('uploadedAt')

  const handleDeleteCandidate = (candidateId: string, candidateName: string) => {
    dispatch(deleteCandidate(candidateId))
    message.success(`Candidate ${candidateName} deleted successfully`)
    // Clear selection if the deleted candidate was selected
    if (selectedId === candidateId) {
      onCandidateSelect('')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'green'
      case 'interviewing': return 'blue'
      case 'pending': return 'orange'
      default: return 'default'
    }
  }

  const getScoreColor = (score: number | undefined) => {
    if (!score) return '#999'
    if (score >= 80) return '#52c41a'
    if (score >= 60) return '#faad14'
    return '#ff4d4f'
  }

  const filteredAndSortedCandidates = candidates
    .filter((candidate: any) => {
      const matchesSearch = candidate.name.toLowerCase().includes(searchText.toLowerCase()) ||
                          candidate.email.toLowerCase().includes(searchText.toLowerCase())
      const matchesStatus = statusFilter === 'all' || candidate.status === statusFilter
      return matchesSearch && matchesStatus
    })
    .sort((a: any, b: any) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'score':
          return (b.score || 0) - (a.score || 0)
        case 'uploadedAt':
        default:
          return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      }
    })

  const columns: ColumnsType<Candidate> = [
    {
      title: 'Candidate',
      key: 'candidate',
      render: (_, candidate) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 'bold' }}>{candidate.name}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{candidate.email}</div>
          </div>
        </Space>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)} style={{ textTransform: 'capitalize' }}>
          {status}
        </Tag>
      )
    },
    {
      title: 'Score',
      dataIndex: 'score',
      key: 'score',
      render: (score: number | undefined) => (
        <span style={{ 
          color: getScoreColor(score),
          fontWeight: 'bold'
        }}>
          {score ? `${score}/100` : 'N/A'}
        </span>
      )
    },
    {
      title: 'Uploaded',
      dataIndex: 'uploadedAt',
      key: 'uploadedAt',
      render: (date: string) => new Date(date).toLocaleDateString()
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, candidate) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => onCandidateSelect(candidate.id)}
            style={{ 
              backgroundColor: selectedId === candidate.id ? '#e6f7ff' : 'transparent',
              borderColor: selectedId === candidate.id ? '#1890ff' : 'transparent'
            }}
          >
            View
          </Button>
          <Popconfirm
            title={
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-red-100 rounded-lg flex items-center justify-center">
                  <DeleteOutlined className="text-red-600 text-sm" />
                </div>
                <span className="text-lg font-semibold text-gray-800">Delete Candidate</span>
              </div>
            }
            description={
              <div className="mt-2 text-gray-600">
                Are you sure you want to delete <span className="font-semibold text-gray-800">{candidate.name}</span>? 
                <br />
                <span className="text-red-600 font-medium">This action cannot be undone.</span>
              </div>
            }
            onConfirm={() => handleDeleteCandidate(candidate.id, candidate.name)}
            okText="Yes, Delete"
            cancelText="Cancel"
            okType="danger"
            className="delete-popconfirm"
            overlayClassName="delete-popconfirm-overlay"
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              title="Delete candidate"
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <Card 
      title="Candidates" 
      extra={
        <Space>
          <Search
            placeholder="Search candidates..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 120 }}
          >
            <Option value="all">All Status</Option>
            <Option value="pending">Pending</Option>
            <Option value="interviewing">Interviewing</Option>
            <Option value="completed">Completed</Option>
          </Select>
          <Select
            value={sortBy}
            onChange={setSortBy}
            style={{ width: 120 }}
          >
            <Option value="uploadedAt">Latest</Option>
            <Option value="name">Name</Option>
            <Option value="score">Score</Option>
          </Select>
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={filteredAndSortedCandidates}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        size="middle"
        onRow={(candidate) => ({
          onClick: (e) => {
            // Only select candidate if not clicking on action buttons
            if (!(e.target as HTMLElement).closest('.ant-btn') && 
                !(e.target as HTMLElement).closest('.ant-popconfirm')) {
              onCandidateSelect(candidate.id)
            }
          },
          style: { 
            cursor: 'pointer',
            backgroundColor: selectedId === candidate.id ? '#f0f8ff' : 'transparent'
          }
        })}
      />
    </Card>
  )
}

export default CandidateList