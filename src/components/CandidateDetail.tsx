import React from 'react'
import { Card, Descriptions, Tag, Timeline, Button, Space, Progress, Typography, Divider } from 'antd'
import { DownloadOutlined, MessageOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { useSelector } from 'react-redux'
import { RootState } from '../store'

const { Text, Title } = Typography

interface CandidateDetailProps {
  candidateId: string
}

const CandidateDetail: React.FC<CandidateDetailProps> = ({ candidateId }) => {
  const { candidates } = useSelector((state: RootState) => state.candidates)
  const { interviews } = useSelector((state: RootState) => state.interviews)
  
  const candidate = candidates.find((c: any) => c.id === candidateId)
  const candidateInterview = interviews.find((i: any) => i.candidateId === candidateId)

  if (!candidate) {
    return (
      <Card>
        <Text>Candidate not found</Text>
      </Card>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'green'
      case 'interviewing': return 'blue'
      case 'pending': return 'orange'
      default: return 'default'
    }
  }

  const getScoreLevel = (score: number | undefined) => {
    if (!score) return { level: 'Unrated', color: '#999' }
    if (score >= 80) return { level: 'Excellent', color: '#52c41a' }
    if (score >= 60) return { level: 'Good', color: '#faad14' }
    return { level: 'Needs Improvement', color: '#ff4d4f' }
  }

  const formatDuration = (start: string, end?: string) => {
    const startTime = new Date(start)
    const endTime = end ? new Date(end) : new Date()
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000 / 60)
    return `${duration} minutes`
  }

  const scoreLevel = getScoreLevel(candidate.score)

  return (
    <div>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* Basic Info */}
        <div>
          <Title level={4}>{candidate.name}</Title>
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Email">{candidate.email}</Descriptions.Item>
            <Descriptions.Item label="Phone">{candidate.phone || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={getStatusColor(candidate.status)}>
                {candidate.status.toUpperCase()}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Uploaded">
              {new Date(candidate.uploadedAt).toLocaleString()}
            </Descriptions.Item>
          </Descriptions>
        </div>

        <Divider />

        {/* Score Section */}
        {candidate.score && (
          <div>
            <Title level={5}>Interview Score</Title>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <Progress
                type="circle"
                percent={candidate.score}
                format={() => `${candidate.score}/100`}
                strokeColor={scoreLevel.color}
                size={120}
              />
            </div>
            <div style={{ textAlign: 'center' }}>
              <Tag color={scoreLevel.color} style={{ fontSize: '14px', padding: '4px 12px' }}>
                {scoreLevel.level}
              </Tag>
            </div>
          </div>
        )}

        {/* Summary */}
        {candidate.summary && (
          <div>
            <Title level={5}>Summary</Title>
            <Text>{candidate.summary}</Text>
          </div>
        )}

        <Divider />

        {/* Interview Timeline */}
        {candidateInterview && (
          <div>
            <Title level={5}>Interview Timeline</Title>
            <Timeline
              items={[
                {
                  color: 'blue',
                  children: (
                    <div>
                      <Text strong>Interview Started</Text>
                      <br />
                      <Text type="secondary">
                        {candidateInterview.startTime 
                          ? new Date(candidateInterview.startTime).toLocaleString()
                          : 'N/A'
                        }
                      </Text>
                    </div>
                  )
                },
                {
                  color: candidateInterview.messages.length > 0 ? 'green' : 'gray',
                  children: (
                    <div>
                      <Text strong>Q&A Session</Text>
                      <br />
                      <Text type="secondary">
                        {candidateInterview.messages.length} messages exchanged
                      </Text>
                    </div>
                  )
                },
                candidateInterview.endTime && {
                  color: 'green',
                  children: (
                    <div>
                      <Text strong>Interview Completed</Text>
                      <br />
                      <Text type="secondary">
                        {new Date(candidateInterview.endTime).toLocaleString()}
                      </Text>
                      <br />
                      <Text type="secondary">
                        Duration: {formatDuration(candidateInterview.startTime!, candidateInterview.endTime)}
                      </Text>
                    </div>
                  )
                }
              ].filter(Boolean)}
            />
          </div>
        )}

        {/* Actions */}
        <Divider />
        <Space>
          {candidate.resumeFile && (
            <Button icon={<DownloadOutlined />}>
              Download Resume
            </Button>
          )}
          {candidateInterview && (
            <Button icon={<MessageOutlined />}>
              View Transcript ({candidateInterview.messages.length})
            </Button>
          )}
          {candidateInterview && candidateInterview.startTime && (
            <Button icon={<ClockCircleOutlined />}>
              Interview Duration: {formatDuration(
                candidateInterview.startTime,
                candidateInterview.endTime
              )}
            </Button>
          )}
        </Space>
      </Space>
    </div>
  )
}

export default CandidateDetail