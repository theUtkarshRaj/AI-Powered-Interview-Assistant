import React, { useState, useEffect } from 'react'
import { Progress, Typography, Button } from 'antd'
import { PlayCircleOutlined, PauseCircleOutlined, StopOutlined } from '@ant-design/icons'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../store'
import { startTimer, stopTimer } from '../store/interviewSlice'

const { Text } = Typography

interface QuestionTimerProps {
  maxTime: number // in seconds
  onTimeUp: () => void
  questionNumber: number
}

const QuestionTimer: React.FC<QuestionTimerProps> = ({ maxTime, onTimeUp, questionNumber }) => {
  const dispatch = useDispatch()
  const { timerActive } = useSelector((state: RootState) => state.interviews)
  const [timeLeft, setTimeLeft] = useState(maxTime)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (timerActive && !isPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            dispatch(stopTimer())
            onTimeUp()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [timerActive, isPaused, timeLeft, dispatch, onTimeUp])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getProgressColor = () => {
    const percentage = (timeLeft / maxTime) * 100
    if (percentage > 50) return '#52c41a'
    if (percentage > 20) return '#faad14'
    return '#ff4d4f'
  }

  const handleStart = () => {
    dispatch(startTimer())
    setIsPaused(false)
  }

  const handlePause = () => {
    setIsPaused(!isPaused)
  }

  const handleStop = () => {
    dispatch(stopTimer())
    setTimeLeft(maxTime)
    setIsPaused(false)
  }

  const percentage = ((maxTime - timeLeft) / maxTime) * 100

  return (
    <div className="space-y-3">
      <div className="text-center">
        <Text strong className="text-sm text-gray-700">Question {questionNumber}</Text>
      </div>
      
      <Progress
        percent={percentage}
        strokeColor={getProgressColor()}
        showInfo={false}
        size="small"
      />
      
      <div className="text-center">
        <Text 
          style={{ 
            fontSize: '20px', 
            fontWeight: 'bold', 
            color: getProgressColor(),
            fontFamily: 'monospace'
          }}
        >
          {formatTime(timeLeft)}
        </Text>
      </div>

      <div className="flex gap-2 justify-center">
        {!timerActive ? (
          <Button 
            type="primary" 
            icon={<PlayCircleOutlined />} 
            onClick={handleStart}
            size="small"
            className="bg-green-600 hover:bg-green-700"
          >
            Start
          </Button>
        ) : (
          <>
            <Button 
              icon={isPaused ? <PlayCircleOutlined /> : <PauseCircleOutlined />} 
              onClick={handlePause}
              size="small"
              className={isPaused ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-500 hover:bg-yellow-600'}
            >
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
            <Button 
              icon={<StopOutlined />} 
              onClick={handleStop}
              size="small"
              danger
            >
              Reset
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

export default QuestionTimer