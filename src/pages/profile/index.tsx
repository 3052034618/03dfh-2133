import React, { useMemo } from 'react'
import { View, Text, Image, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import { useClubStore } from '@/store'
import { formatPlayCountLevel } from '@/utils/format'

const ProfilePage: React.FC = () => {
  const currentMember = useClubStore(s => s.getCurrentMember())
  const games = useClubStore(s => s.games)
  const currentUserId = useClubStore(s => s.currentUserId)

  const myBookings = useMemo(() => {
    return games.filter(g => {
      return g.participants.some(p => p.memberId === currentUserId) ||
        g.waitlist.some(p => p.memberId === currentUserId)
    }).map(g => {
      const inParticipants = g.participants.find(p => p.memberId === currentUserId)
      const inWaitlist = g.waitlist.find(p => p.memberId === currentUserId)
      return {
        ...g,
        myStatus: inParticipants ? 'confirmed' as const : 'waitlist' as const,
        waitlistRank: inWaitlist?.waitlistRank
      }
    })
  }, [games, currentUserId])

  const abilityTags = useMemo(() => {
    if (!currentMember) return []
    const tags: string[] = []
    if (currentMember.ability.timelineExpert) tags.push('时间线达人')
    if (currentMember.ability.cipherExpert) tags.push('密码破解')
    if (currentMember.ability.canLongSession) tags.push('耐6h+')
    if (currentMember.note.goodForNewbies) tags.push('适合带新')
    if (currentMember.note.goodForHardcore) tags.push('高压本选手')
    return tags
  }, [currentMember])

  const handleEditProfile = () => {
    console.log('[Profile] navigate to edit profile')
    Taro.navigateTo({ url: '/pages/edit-profile/index' })
  }

  const handleViewHistory = () => {
    console.log('[Profile] view history')
    Taro.showToast({ title: '历史记录开发中', icon: 'none' })
  }

  const handleGameClick = (gameId: string) => {
    console.log('[Profile] navigate to game detail:', gameId)
    Taro.navigateTo({ url: `/pages/game-detail/index?id=${gameId}` })
  }

  if (!currentMember) {
    return <View className={styles.page} />
  }

  return (
    <View className={styles.page}>
      <View className={styles.memberCardHeader}>
        <View className={styles.cardTop}>
          <Image
            className={styles.avatar}
            src={currentMember.avatar}
            mode='aspectFill'
            onError={(e) => console.error('[Profile] avatar load error:', e)}
          />
          <View className={styles.basicInfo}>
            <View className={styles.nameRow}>
              <Text className={styles.name}>{currentMember.name}</Text>
              <View className={styles.levelBadge}>{formatPlayCountLevel(currentMember.playCountLevel)}</View>
            </View>
            {currentMember.department && (
              <Text className={styles.subInfo}>{currentMember.department} · {currentMember.studentId}</Text>
            )}
          </View>
          <Button className={styles.editBtn} onClick={handleEditProfile}>编辑</Button>
        </View>

        {abilityTags.length > 0 && (
          <View className={styles.tagSection}>
            <Text className={styles.tagSectionTitle}>我的能力标签</Text>
            <View className={styles.tagList}>
              {abilityTags.map((tag, idx) => (
                <View key={idx} className={styles.tag}>{tag}</View>
              ))}
            </View>
          </View>
        )}

        {currentMember.preferredTypes.length > 0 && (
          <View className={styles.tagSection}>
            <Text className={styles.tagSectionTitle}>偏好类型</Text>
            <View className={styles.tagList}>
              {currentMember.preferredTypes.map((type, idx) => (
                <View key={idx} className={styles.tag}>{type}</View>
              ))}
            </View>
          </View>
        )}
      </View>

      <View className={styles.statsCard}>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{currentMember.playCount}</Text>
          <Text className={styles.statLabel}>累计本数</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{currentMember.recentSessionCount}</Text>
          <Text className={styles.statLabel}>本月参车</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{currentMember.totalSessions}</Text>
          <Text className={styles.statLabel}>历史成车</Text>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>我的报名</Text>
          <Text className={styles.sectionAction}>共 {myBookings.length} 场</Text>
        </View>
        {myBookings.length > 0 ? (
          myBookings.map(booking => (
            <View key={booking.id} className={styles.bookingItem} onClick={() => handleGameClick(booking.id)}>
              <Image
                className={styles.bookingCover}
                src={booking.cover}
                mode='aspectFill'
                onError={(e) => console.error('[Profile] booking cover error:', e)}
              />
              <View className={styles.bookingInfo}>
                <Text className={styles.bookingTitle}>{booking.title}</Text>
                <Text className={styles.bookingMeta}>
                  {new Date(booking.sessionDate).getMonth() + 1}月{new Date(booking.sessionDate).getDate()}日 · {booking.location}
                </Text>
                <View className={classnames(styles.bookingStatus, booking.myStatus)}>
                  {booking.myStatus === 'confirmed' ? '✓ 已确认' : `候补第 ${booking.waitlistRank} 位`}
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={{ padding: '48rpx', textAlign: 'center', color: '#86909C', fontSize: '28rpx' }}>
            暂无报名，去首页看看有什么好本吧～
          </View>
        )}
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>更多功能</Text>
        </View>
        <View className={styles.quickActions}>
          <View className={styles.actionItem} onClick={handleViewHistory}>
            <Text className={styles.actionIcon}>📚</Text>
            <Text className={styles.actionText}>参车记录</Text>
          </View>
          <View className={styles.actionItem} onClick={handleEditProfile}>
            <Text className={styles.actionIcon}>✏️</Text>
            <Text className={styles.actionText}>编辑资料</Text>
          </View>
          <View className={styles.actionItem} onClick={() => Taro.showToast({ title: '联系社长', icon: 'none' })}>
            <Text className={styles.actionIcon}>💬</Text>
            <Text className={styles.actionText}>联系社长</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

export default ProfilePage
