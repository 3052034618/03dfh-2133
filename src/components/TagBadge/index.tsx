import React from 'react'
import { View } from '@tarojs/components'
import classnames from 'classnames'
import styles from './index.module.scss'

export interface TagBadgeProps {
  text: string
  variant?: 'primary' | 'warm' | 'success' | 'warning' | 'error' | 'default' | 'accent'
  className?: string
}

const TagBadge: React.FC<TagBadgeProps> = ({ text, variant = 'primary', className }) => {
  return (
    <View className={classnames(styles.tagBadge, styles[variant], className)}>
      {text}
    </View>
  )
}

export default TagBadge
