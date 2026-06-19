import React, { useMemo } from 'react'
import { View, Text, Image, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import { useClubStore } from '@/store'
import { formatPlayCountLevel } from '@/utils/format'
import type { NotificationType } from '@/types/notification'

const notificationIcons: Record<NotificationType, string> = {
  promoted: '🎉',
  waitlist_moved: '🔄',
  time_confirmed: '✅',
  game_cancelled: '❌',
  new_game: '📢'
}

const ProfilePage: React.FC = () => {
  const currentMember = useClubStore(s => s.getCurrentMember())
  const games = useClubStore(s => s.games)
  const currentUserId = useClubStore(s => s.currentUserId)
  const getMyNotifications = useClubStore(s => s.getMyNotifications)
  const markAllNotificationsRead = useClubStore(s => s.markAllNotificationsRead)
  const markNotificationRead = useClubStore(s => s.markNotificationRead)
  const getUnreadCount = useClubStore(s => s.getUnreadCount)

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
    return tags
  }, [currentMember])

  const presidentNoteTags = useMemo(() => {
    if (!currentMember) return []
    const tags: string[] = []
    if (currentMember.note.goodForNewbies) tags.push('适合带新')
    if (currentMember.note.goodForHardcore) tags.push('高压本选手')
    return tags
  }, [currentMember])

  const unreadCount = useMemo(() => getUnreadCount(), [getUnreadCount])

  const myNotifications = useMemo(() => {
    return getMyNotifications()
  }, [getMyNotifications, games])

  const formatNotificationTime = (isoStr: string) => {
    const date = new Date(isoStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}小时前`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}天前`
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

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

  const handleNotificationClick = (notification: any) => {
    console.log('[Profile] notification click:', notification.id)
    markNotificationRead(notification.id)
    if (notification.gameId) {
      Taro.navigateTo({ url: `/pages/game-detail/index?id=${notification.gameId}` })
    }
  }

  const handleClearAllRead = () => {
    if (unreadCount === 0) return
    Taro.showModal({
      title: '标记全部已读',
      content: '确定将所有消息标记为已读吗？',
      confirmText: '确认',
      success: (res) => {
        if (res.confirm) {
          markAllNotificationsRead()
          Taro.showToast({ title: '已全部标记为已读', icon: 'success' })
        }
      }
    })
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

      {(presidentNoteTags.length > 0 || currentMember.note.customNote) && (
        <View className={styles.presidentNoteSection}>
          <View className={styles.presidentNoteTitle}>
            <Text className={styles.presidentNoteTitleIcon}>📋</Text>
            社长备注
          </View>
          {presidentNoteTags.length > 0 && (
            <View className={styles.presidentNoteTagList}>
              {presidentNoteTags.map((tag, idx) => (
                <View key={idx} className={styles.presidentNoteTag}>{tag}</View>
              ))}
            </View>
          )}
          {currentMember.note.customNote && (
            <Text className={styles.presidentNoteCustom}>
              {currentMember.note.customNote}
            </Text>
          )}
        </View>
      )}

      <View className={styles.notificationSection}>
        <View className={styles.notificationCard}>
          <View className={styles.notificationHeader}>
            <View className={styles.notificationTitle}>
              <Text className={styles.notificationTitleIcon}>🔔</Text>
              最近消息
              {unreadCount > 0 && (
                <View className={styles.notificationBadge}>{unreadCount}</View>
              )}
            </View>
            {unreadCount > 0 && (
              <Text className={styles.notificationClear} onClick={handleClearAllRead}>
                全部已读
              </Text>
            )}
          </View>
          {myNotifications.length > 0 ? (
            <View className={styles.notificationList}>
              {myNotifications.map(notif => (
                <View
                  key={notif.id}
                  className={classnames(styles.notificationItem, !notif.read && styles.unread)}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <View className={classnames(styles.notificationIcon, notif.type)}>
                    {notificationIcons[notif.type]}
                  </View>
                  <View className={styles.notificationContent}>
                    <Text className={styles.notificationItemTitle}>{notif.title}</Text>
                    <Text className={styles.notificationItemContent}>{notif.content}</Text>
                    <Text className={styles.notificationTime}>
                      {formatNotificationTime(notif.createdAt)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View className={styles.emptyNotification}>
              暂无新消息，快去首页报名吧～
            </View>
          )}
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
                {booking.confirmedTime && (
                  <Text style={{ fontSize: '22rpx', color: '#00B42A', marginTop: '4rpx' }}>
                    ✅ 已确认时间：{booking.confirmedTime}
                  </Text>
                )}
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
