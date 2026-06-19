import React, { useState, useMemo } from 'react'
import { View, Text, Image, Button } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import StatusBadge from '@/components/StatusBadge'
import TagBadge from '@/components/TagBadge'
import { useClubStore, getFilledRoleCounts, getBestMatchedRole, getRoleSchedule, getRecommendPromotion } from '@/store'
import { formatDate } from '@/utils/format'
import type { RoleType, TimeSlot } from '@/types/game'

const roleLabels: Record<RoleType, string> = {
  timeline: '时间线位',
  cipher: '密码题位',
  mentor: '带新位',
  hardcore: '硬核推理位'
}

const roleIcons: Record<RoleType, string> = {
  timeline: '🕐',
  cipher: '🔐',
  mentor: '🎓',
  hardcore: '🧠'
}

const GameDetailPage: React.FC = () => {
  const router = useRouter()
  const gameId = router.params.id || 'g1'

  const games = useClubStore(s => s.games)
  const currentUserId = useClubStore(s => s.currentUserId)
  const isPresident = useClubStore(s => s.isPresident)
  const signupToGame = useClubStore(s => s.signupToGame)
  const cancelSignup = useClubStore(s => s.cancelSignup)
  const moveWaitlistUp = useClubStore(s => s.moveWaitlistUp)
  const moveWaitlistDown = useClubStore(s => s.moveWaitlistDown)
  const promoteWaitlist = useClubStore(s => s.promoteWaitlist)
  const confirmGameTime = useClubStore(s => s.confirmGameTime)

  const game = useMemo(() => games.find(g => g.id === gameId), [games, gameId])
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([])
  const [selectedConfirmTime, setSelectedConfirmTime] = useState<string | null>(null)
  const [showRecommendPanel, setShowRecommendPanel] = useState(false)

  const isConfirmed = useMemo(() => {
    return game?.participants.some(p => p.memberId === currentUserId) ?? false
  }, [game, currentUserId])

  const isWaitlist = useMemo(() => {
    return game?.waitlist.some(p => p.memberId === currentUserId) ?? false
  }, [game, currentUserId])

  const myWaitlistRank = useMemo(() => {
    return game?.waitlist.find(p => p.memberId === currentUserId)?.waitlistRank
  }, [game, currentUserId])

  const isFull = (game?.currentPlayers ?? 0) >= (game?.totalPlayers ?? 0)
  const progress = game ? Math.min(100, (game.currentPlayers / game.totalPlayers) * 100) : 0

  const roleSchedule = useMemo(() => {
    if (!game) return []
    return getRoleSchedule(game.participants, game.roleRequirements)
  }, [game])

  const roleFilledCounts = useMemo(() => {
    if (!game) return {} as Record<RoleType, number>
    return getFilledRoleCounts(game.participants, game.roleRequirements)
  }, [game])

  const recommendations = useMemo(() => {
    if (!game) return []
    return getRecommendPromotion(game)
  }, [game])

  const timeSlotCounts = useMemo(() => {
    if (!game) return {} as Record<string, number>
    const counts: Record<string, number> = {}
    game.availableTimeSlots.forEach(t => { counts[t.id] = 0 })
    game.participants.forEach(p => {
      p.timeSlots.forEach(ts => {
        if (counts[ts] !== undefined) counts[ts]++
      })
    })
    return counts
  }, [game])

  if (!game) {
    return <View className={styles.page}><Text style={{ padding: '100rpx', textAlign: 'center', color: '#86909C' }}>未找到该车辆</Text></View>
  }

  const toggleTimeSlot = (slotId: string) => {
    console.log('[GameDetail] toggle time slot:', slotId)
    setSelectedTimeSlots(prev =>
      prev.includes(slotId)
        ? prev.filter(id => id !== slotId)
        : [...prev, slotId]
    )
  }

  const handleSignup = () => {
    if (selectedTimeSlots.length === 0) {
      Taro.showToast({ title: '请先选择可到时间', icon: 'none' })
      return
    }

    const doSignup = () => {
      const result = signupToGame(game.id, currentUserId, selectedTimeSlots)
      console.log('[GameDetail] signup result:', result)
      if (result.success) {
        if (result.isWaitlist) {
          Taro.showToast({ title: `候补第${result.waitlistRank}位`, icon: 'success' })
        } else {
          Taro.showToast({ title: '报名成功！', icon: 'success' })
        }
        setSelectedTimeSlots([])
      }
    }

    if (isFull) {
      Taro.showModal({
        title: '已报满，加入候补',
        content: '当前车辆已满，是否加入候补队列？\n\n候补排序规则：先按最近参车次数（少的优先），再结合角色缺口匹配度，最后报名时间。社长可手动调整顺序。',
        confirmText: '加入候补',
        success: (res) => {
          if (res.confirm) doSignup()
        }
      })
    } else {
      Taro.showModal({
        title: '确认报名',
        content: `已选择 ${selectedTimeSlots.length} 个时间段，确认报名《${game.title}》？`,
        confirmText: '确认报名',
        success: (res) => {
          if (res.confirm) doSignup()
        }
      })
    }
  }

  const handleCancel = () => {
    Taro.showModal({
      title: isConfirmed ? '取消报名' : '退出候补',
      content: isConfirmed
        ? '确定要取消本次报名吗？如有候补，系统将推荐最合适的人选递补。'
        : '确定要退出候补队列吗？',
      confirmText: '确定取消',
      confirmColor: '#F53F3F',
      success: (res) => {
        if (res.confirm) {
          cancelSignup(game.id, currentUserId)
          Taro.showToast({ title: isConfirmed ? '已取消报名' : '已退出候补', icon: 'none' })
        }
      }
    })
  }

  const handleMoveUp = (rank: number) => {
    console.log('[GameDetail] moveWaitlistUp:', rank)
    moveWaitlistUp(game.id, rank)
  }

  const handleMoveDown = (rank: number) => {
    console.log('[GameDetail] moveWaitlistDown:', rank)
    moveWaitlistDown(game.id, rank)
  }

  const handlePromote = (rank: number) => {
    console.log('[GameDetail] promoteWaitlist:', rank)
    if (game.currentPlayers >= game.totalPlayers) {
      Taro.showToast({ title: '名额已满，无法提拔', icon: 'none' })
      return
    }
    const target = game.waitlist.find(p => p.waitlistRank === rank)
    const rec = recommendations.find(r => r.rank === rank)
    const reasonText = rec && rec.reasons.length > 0 ? `\n\n推荐理由：${rec.reasons.join('、')}` : ''
    Taro.showModal({
      title: '提拔为正式成员',
      content: `确定将 ${target?.member.name || '该候补社员'} 提拔为正式成员吗？${reasonText}`,
      confirmText: '确认提拔',
      success: (res) => {
        if (res.confirm) {
          promoteWaitlist(game.id, rank)
          Taro.showToast({ title: '提拔成功', icon: 'success' })
        }
      }
    })
  }

  const handleShare = () => {
    console.log('[GameDetail] share game')
    Taro.showToast({ title: '分享功能开发中', icon: 'none' })
  }

  const handleConfirmTime = () => {
    if (!selectedConfirmTime) {
      Taro.showToast({ title: '请先选择一个时间段', icon: 'none' })
      return
    }
    const timeSlot = game.availableTimeSlots.find(t => t.id === selectedConfirmTime)
    if (!timeSlot) return

    Taro.showModal({
      title: '确认开车时间',
      content: `确定将《${game.title}》的开车时间确定为：\n${timeSlot.label} ${timeSlot.time}？\n\n确认后所有报名者和候补都会收到通知。`,
      confirmText: '确认时间',
      confirmColor: '#00B42A',
      success: (res) => {
        if (res.confirm) {
          confirmGameTime(game.id, selectedConfirmTime)
          Taro.showToast({ title: '时间已确认！', icon: 'success' })
        }
      }
    })
  }

  const hasSlots = game.participants.length < game.totalPlayers

  return (
    <View className={styles.page}>
      <View className={styles.coverWrap}>
        <Image
          className={styles.cover}
          src={game.cover}
          mode='aspectFill'
          onError={(e) => console.error('[GameDetail] cover load error:', e)}
        />
        <View className={styles.coverOverlay} />
        <StatusBadge status={game.status} className={styles.statusBadge} />
        <View className={styles.hostInfo}>
          <Image className={styles.hostAvatar} src={game.host.avatar} mode='aspectFill' />
          <View>
            <Text className={styles.hostName}>{game.host.name}</Text>
            <Text className={styles.hostRole}>车头 · 组织者</Text>
          </View>
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.titleRow}>
          <Text className={styles.title}>{game.title}</Text>
          <TagBadge text={game.type} variant='primary' className={styles.typeTag} />
        </View>

        <View className={styles.progressSection}>
          <View className={styles.progressHeader}>
            <Text className={styles.progressText}>报名进度</Text>
            <Text className={styles.progressCount}>{game.currentPlayers}/{game.totalPlayers} 人</Text>
          </View>
          <View className={styles.progressBar}>
            <View className={styles.progressFill} style={{ width: `${progress}%` }} />
          </View>
          <Text className={styles.progressHint}>
            {game.status === 'confirmed' && game.confirmedTime
              ? `已成车 · 确定时间：${game.confirmedTime}`
              : isFull ? '人员已满，正在协调时间' : `还差 ${game.totalPlayers - game.currentPlayers} 人开车`}
          </Text>
        </View>

        <View className={styles.infoCard}>
          <View className={styles.infoSectionTitle}>
            <Text className={styles.infoSectionIcon}>📋</Text>
            基本信息
          </View>
          <View className={styles.infoList}>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>开本日期</Text>
              <Text className={styles.infoValue}>{formatDate(game.sessionDate)}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>开本地点</Text>
              <Text className={styles.infoValue}>{game.location}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>AA费用</Text>
              <Text className={classnames(styles.infoValue, styles.infoValueHighlight)}>¥{game.aaFee} / 人</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>阅读要求</Text>
              <Text className={styles.infoValue}>{game.readingRequirement}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>剧本介绍</Text>
              <Text className={styles.infoValue}>{game.description || '暂无介绍'}</Text>
            </View>
          </View>
          <View className={styles.noticeBox}>
            <View className={styles.noticeTitle}>
              <Text>⚠️</Text>
              <Text style={{ marginLeft: '8rpx' }}>禁止剧透声明</Text>
            </View>
            <Text className={styles.noticeText}>{game.noSpoilerNotice}</Text>
          </View>
        </View>

        {game.roleRequirements.length > 0 && (
          <View className={styles.roleRequirementSection}>
            <View className={styles.roleRequirementTitle}>
              <Text className={styles.roleRequirementTitleIcon}>🎯</Text>
              角色排班表
            </View>
            <Text style={{ fontSize: '24rpx', color: '#86909C', marginBottom: '24rpx', display: 'block' }}>
              按报名人真实能力自动匹配，显示每个角色位由谁顶上
            </Text>
            <View className={styles.scheduleTable}>
              {game.roleRequirements.map(req => {
                const slots = roleSchedule.filter(s => s.roleType === req.type)
                const filled = roleFilledCounts[req.type] || 0
                const gap = req.count - filled
                return (
                  <View key={req.type} className={styles.scheduleRow}>
                    <View className={styles.scheduleRowHeader}>
                      <Text className={styles.scheduleRoleIcon}>{roleIcons[req.type]}</Text>
                      <Text className={styles.scheduleRoleName}>{req.label}</Text>
                      <Text className={classnames(styles.scheduleRoleCount, gap > 0 ? 'need' : 'full')}>
                        {filled}/{req.count}
                      </Text>
                    </View>
                    <View className={styles.scheduleSlots}>
                      {slots.map(slot => (
                        <View key={`${req.type}-${slot.index}`} className={styles.scheduleSlot}>
                          {slot.participant ? (
                            <View className={styles.scheduleSlotFilled}>
                              <Image
                                className={styles.scheduleSlotAvatar}
                                src={slot.participant.member.avatar}
                                mode='aspectFill'
                              />
                              <Text className={styles.scheduleSlotName}>{slot.participant.member.name}</Text>
                              {slot.participant.role && (
                                <Text className={styles.scheduleSlotTag}>{slot.participant.role}</Text>
                              )}
                            </View>
                          ) : (
                            <View className={styles.scheduleSlotEmpty}>
                              <Text className={styles.scheduleSlotEmptyIcon}>+</Text>
                              <Text className={styles.scheduleSlotEmptyText}>缺人</Text>
                            </View>
                          )}
                        </View>
                      ))}
                    </View>
                    {gap > 0 && (
                      <View className={styles.scheduleGapHint}>
                        <Text style={{ fontSize: '22rpx', color: '#FF7D00' }}>
                          ⚠️ 还缺 {gap} 人，候补中优先匹配{req.label}
                        </Text>
                      </View>
                    )}
                  </View>
                )
              })}
            </View>
          </View>
        )}

        {isPresident && game.waitlist.length > 0 && (
          <View className={styles.recommendSection}>
            <View
              className={styles.recommendHeader}
              onClick={() => setShowRecommendPanel(!showRecommendPanel)}
            >
              <View className={styles.recommendHeaderLeft}>
                <Text className={styles.recommendHeaderIcon}>💡</Text>
                <Text className={styles.recommendHeaderTitle}>推荐补位</Text>
                {recommendations.length > 0 && (
                  <View className={styles.recommendCount}>{recommendations.length}</View>
                )}
              </View>
              <Text className={styles.recommendToggle}>
                {showRecommendPanel ? '收起 ▲' : '展开 ▼'}
              </Text>
            </View>
            {showRecommendPanel && (
              <View className={styles.recommendList}>
                <Text style={{ fontSize: '22rpx', color: '#86909C', marginBottom: '16rpx', display: 'block' }}>
                  系统根据角色缺口匹配、参车次数、可到时间综合推荐
                </Text>
                {recommendations.map(rec => (
                  <View key={rec.participant.memberId} className={styles.recommendItem}>
                    <View className={styles.recommendRank}>#{rec.rank}</View>
                    <Image
                      className={styles.recommendAvatar}
                      src={rec.participant.member.avatar}
                      mode='aspectFill'
                    />
                    <View className={styles.recommendInfo}>
                      <Text className={styles.recommendName}>{rec.participant.member.name}</Text>
                      <View className={styles.recommendReasons}>
                        {rec.reasons.map((reason, idx) => (
                          <View key={idx} className={classnames(styles.recommendReason, rec.matchedGap && idx === 0 && 'primary')}>
                            {reason}
                          </View>
                        ))}
                      </View>
                    </View>
                    {hasSlots && (
                      <View
                        className={styles.recommendPromoteBtn}
                        onClick={() => handlePromote(rec.rank)}
                      >
                        提拔
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {isPresident && !game.confirmedTime && (
          <View className={styles.timeConfirmSection}>
            <View className={styles.timeConfirmTitle}>
              <Text className={styles.timeConfirmTitleIcon}>✅</Text>
              确定最终开车时间
            </View>
            <Text style={{ fontSize: '24rpx', color: '#86909C', marginBottom: '24rpx', display: 'block' }}>
              从已报名成员的可选时间中挑选一个，确认后所有人都会收到通知
            </Text>
            <View className={styles.timeOptionList}>
              {game.availableTimeSlots.map(slot => {
                const count = timeSlotCounts[slot.id] || 0
                const isConfirmedSlot = game.confirmedTimeSlotId === slot.id
                const isSelected = selectedConfirmTime === slot.id
                return (
                  <View
                    key={slot.id}
                    className={classnames(styles.timeOptionItem, isSelected && styles.selected, isConfirmedSlot && styles.confirmed)}
                    onClick={() => !isConfirmedSlot && setSelectedConfirmTime(slot.id)}
                  >
                    <View className={classnames(styles.timeOptionRadio, isSelected && styles.selected, isConfirmedSlot && styles.confirmed)}>
                      {(isSelected || isConfirmedSlot) && (
                        <View className={classnames(styles.timeOptionRadioInner, isConfirmedSlot && styles.confirmed)} />
                      )}
                    </View>
                    <View className={styles.timeOptionInfo}>
                      <Text className={styles.timeOptionLabel}>{slot.label}</Text>
                      <Text className={styles.timeOptionTime}>{slot.time}</Text>
                    </View>
                    <Text className={classnames(styles.timeOptionCount, isConfirmedSlot && styles.confirmed)}>
                      {isConfirmedSlot ? '✓ 已确认' : `${count}人可到`}
                    </Text>
                  </View>
                )
              })}
            </View>
            {selectedConfirmTime && (
              <Button
                className={classnames(styles.confirmTimeBtn, !selectedConfirmTime && styles.disabled)}
                onClick={handleConfirmTime}
              >
                确认此时间
              </Button>
            )}
            <Text className={styles.presidentNote}>
              <Text className={styles.presidentNoteIcon}>💡</Text>
              社长模式：选择一个时间段确认后，车辆状态变为"已成车"，集合提醒将自动展示
            </Text>
          </View>
        )}

        {!isConfirmed && !isWaitlist && !game.confirmedTime && (
          <View className={styles.timeSlotSection}>
            <View className={styles.infoSectionTitle}>
              <Text className={styles.infoSectionIcon}>⏰</Text>
              选择可到时间（可多选）
            </View>
            <View className={styles.timeSlotList}>
              {game.availableTimeSlots.map(slot => (
                <View
                  key={slot.id}
                  className={classnames(styles.timeSlot, selectedTimeSlots.includes(slot.id) && styles.selected)}
                  onClick={() => toggleTimeSlot(slot.id)}
                >
                  <Text className={classnames(styles.timeSlotLabel, selectedTimeSlots.includes(slot.id) && styles.selected)}>
                    {slot.label}
                  </Text>
                  <Text className={classnames(styles.timeSlotTime, selectedTimeSlots.includes(slot.id) && styles.selected)}>
                    {slot.time.split(' ')[1]}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {isWaitlist && myWaitlistRank && (
          <View style={{ background: 'rgba(255,125,0,0.08)', border: '1rpx solid rgba(255,125,0,0.2)', borderRadius: '16rpx', padding: '24rpx 32rpx', marginBottom: '24rpx' }}>
            <Text style={{ color: '#FF7D00', fontSize: '28rpx', fontWeight: '600' }}>
              🔄 当前候补第 {myWaitlistRank} 位
            </Text>
          </View>
        )}

        <View className={styles.participantSection}>
          <View className={styles.infoSectionTitle}>
            <Text className={styles.infoSectionIcon}>👥</Text>
            已确认名单 ({game.participants.length}/{game.totalPlayers})
          </View>
          <View className={styles.participantList}>
            {game.participants.map(p => {
              const matchedRole = getBestMatchedRole(p.member, game.roleRequirements)
              return (
                <View key={p.memberId} className={styles.participantItem}>
                  <Image
                    className={styles.participantAvatar}
                    src={p.member.avatar}
                    mode='aspectFill'
                    onError={(e) => console.error('[GameDetail] participant avatar error:', e)}
                  />
                  <Text className={styles.participantName}>{p.member.name}</Text>
                  {p.role && <Text className={styles.participantRole}>{p.role}</Text>}
                  {matchedRole && !p.role && (
                    <Text className={styles.participantRole}>{roleLabels[matchedRole]}</Text>
                  )}
                </View>
              )
            })}
            {Array.from({ length: game.totalPlayers - game.participants.length }).map((_, idx) => (
              <View key={`empty-${idx}`} className={styles.participantItem}>
                <View className={styles.participantAvatar} style={{ background: '#F2F3F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: '40rpx', color: '#C9CDD4' }}>+</Text>
                </View>
                <Text className={styles.participantName} style={{ color: '#C9CDD4' }}>虚位以待</Text>
              </View>
            ))}
          </View>
        </View>

        {game.waitlist.length > 0 && (
          <View className={styles.waitlistSection}>
            <View className={styles.waitlistHeader}>
              <Text className={styles.waitlistTitle}>🔄 候补队列 ({game.waitlist.length}人)</Text>
              <Text className={styles.waitlistRule}>
                {isPresident ? '社长模式 · 可调整顺序' : '按参车次数+专长排序'}
              </Text>
            </View>
            <View className={styles.sortHint}>
              排序规则：最近参车次数少的优先 → 缺口角色匹配优先 → 专长加权 → 报名时间先后
            </View>
            {game.waitlist.map(p => {
              const rec = recommendations.find(r => r.participant.memberId === p.memberId)
              return (
                <View key={p.memberId} className={styles.waitlistItem}>
                  <View className={styles.waitlistRank}>#{p.waitlistRank}</View>
                  <Image className={styles.waitlistAvatar} src={p.member.avatar} mode='aspectFill' />
                  <View className={styles.waitlistInfo}>
                    <Text className={styles.waitlistName}>{p.member.name}</Text>
                    <Text className={styles.waitlistMeta}>
                      近月参车 {p.member.recentSessionCount} 次 · {p.timeSlots.length}个时间可到
                    </Text>
                    {rec && rec.reasons.length > 0 && (
                      <View className={styles.waitlistReasons}>
                        {rec.reasons.slice(0, 3).map((reason, idx) => (
                          <View key={idx} className={classnames(styles.waitlistReasonTag, idx === 0 && rec.matchedGap && 'primary')}>
                            {reason}
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                  {isPresident && (
                    <View className={styles.waitlistActions}>
                      <View
                        className={classnames(styles.waitlistActionBtn, (p.waitlistRank || 1) <= 1 && styles.disabled)}
                        onClick={() => (p.waitlistRank || 1) > 1 && handleMoveUp(p.waitlistRank!)}
                      >
                        ↑
                      </View>
                      <View
                        className={classnames(styles.waitlistActionBtn, (p.waitlistRank || 0) >= game.waitlist.length && styles.disabled)}
                        onClick={() => (p.waitlistRank || 0) < game.waitlist.length && handleMoveDown(p.waitlistRank!)}
                      >
                        ↓
                      </View>
                      {hasSlots && (
                        <View className={styles.promoteBtn} onClick={() => handlePromote(p.waitlistRank!)}>
                          提拔
                        </View>
                      )}
                    </View>
                  )}
                </View>
              )
            })}
          </View>
        )}

        {game.status === 'confirmed' && game.confirmedTime && (
          <View className={styles.reminderCard}>
            <View className={styles.reminderTitle}>
              <Text className={styles.reminderTitleIcon}>✅</Text>
              集合提醒
            </View>
            <View className={styles.reminderList}>
              <View className={styles.reminderItem}>
                <Text className={styles.reminderItemIcon}>🕐</Text>
                <Text>确定时间：{game.confirmedTime}</Text>
              </View>
              <View className={styles.reminderItem}>
                <Text className={styles.reminderItemIcon}>📍</Text>
                <Text>集合地点：{game.location}</Text>
              </View>
              <View className={styles.reminderItem}>
                <Text className={styles.reminderItemIcon}>💰</Text>
                <Text>AA费用：¥{game.aaFee}，现场结算</Text>
              </View>
              <View className={styles.reminderItem}>
                <Text className={styles.reminderItemIcon}>📖</Text>
                <Text>请提前预留读本时间：{game.readingRequirement}</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      <View className={styles.bottomBar}>
        <Button className={styles.secondaryBtn} onClick={handleShare}>
          分享车头
        </Button>
        {isConfirmed || isWaitlist ? (
          <Button className={classnames(styles.primaryBtn, styles.disabled)} onClick={handleCancel}>
            {isConfirmed ? '取消报名' : '退出候补'}
          </Button>
        ) : (
          <Button className={styles.primaryBtn} onClick={handleSignup}>
            {isFull ? '加入候补队列' : '一键报名'}
          </Button>
        )}
      </View>
    </View>
  )
}

export default GameDetailPage
