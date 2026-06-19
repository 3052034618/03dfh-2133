import React from 'react'
import { View, Text, Image } from '@tarojs/components'
import classnames from 'classnames'
import styles from './index.module.scss'
import type { Member } from '@/types/member'
import TagBadge from '../TagBadge'
import { formatPlayCountLevel } from '@/utils/format'

export interface MemberCardProps {
  member: Member
  className?: string
  onClick?: () => void
}

const MemberCard: React.FC<MemberCardProps> = ({ member, className, onClick }) => {
  const abilityTags = [
    member.ability.timelineExpert && { text: '时间线达人', variant: 'primary' as const },
    member.ability.cipherExpert && { text: '密码破解', variant: 'primary' as const },
    member.ability.canLongSession && { text: '耐6h+', variant: 'warm' as const },
    member.note.goodForNewbies && { text: '适合带新', variant: 'success' as const },
    member.note.goodForHardcore && { text: '适合高压本', variant: 'warning' as const }
  ].filter(Boolean) as { text: string; variant: 'primary' | 'warm' | 'success' | 'warning' }[]

  return (
    <View className={classnames(styles.memberCard, className)} onClick={onClick}>
      <View className={styles.header}>
        <Image
          className={styles.avatar}
          src={member.avatar}
          mode='aspectFill'
          onError={(e) => console.error('[MemberCard] avatar load error:', e)}
        />
        <View className={styles.info}>
          <View className={styles.nameRow}>
            <Text className={styles.name}>{member.name}</Text>
            <TagBadge text={formatPlayCountLevel(member.playCountLevel)} variant='accent' className={styles.levelTag} />
          </View>
          {member.department && <Text className={styles.department}>{member.department}</Text>}
        </View>
      </View>

      <View className={styles.stats}>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{member.playCount}</Text>
          <Text className={styles.statLabel}>累计本数</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{member.recentSessionCount}</Text>
          <Text className={styles.statLabel}>近月参车</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{member.totalSessions}</Text>
          <Text className={styles.statLabel}>历史成车</Text>
        </View>
      </View>

      {abilityTags.length > 0 && (
        <View className={styles.tagSection}>
          <Text className={styles.tagSectionTitle}>能力标签</Text>
          <View className={styles.tags}>
            {abilityTags.map((tag, idx) => (
              <TagBadge key={idx} text={tag.text} variant={tag.variant} />
            ))}
          </View>
        </View>
      )}

      {member.preferredTypes.length > 0 && (
        <View className={styles.tagSection}>
          <Text className={styles.tagSectionTitle}>偏好类型</Text>
          <View className={styles.tags}>
            {member.preferredTypes.map((type, idx) => (
              <TagBadge key={idx} text={type} variant='warm' />
            ))}
          </View>
        </View>
      )}

      {member.note.customNote && (
        <View className={styles.tagSection}>
          <Text className={styles.tagSectionTitle}>社长备注</Text>
          <Text style={{ fontSize: '24rpx', color: '#4E5969' }}>{member.note.customNote}</Text>
        </View>
      )}
    </View>
  )
}

export default MemberCard
