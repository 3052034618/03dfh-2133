import React from 'react'
import { View } from '@tarojs/components'
import classnames from 'classnames'
import styles from './index.module.scss'
import type { GameStatus } from '@/types/game'
import { formatGameStatus } from '@/utils/format'

export interface StatusBadgeProps {
  status: GameStatus
  className?: string
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const { text } = formatGameStatus(status)
  return (
    <View className={classnames(styles.statusBadge, styles[status], className)}>
      {text}
    </View>
  )
}

export default StatusBadge
