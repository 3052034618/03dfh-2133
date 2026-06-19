import React, { useState, useMemo } from 'react'
import { View, Text, Textarea, Button, Switch } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import { useClubStore } from '@/store'
import type { GameType } from '@/types/member'
import { formatPlayCountLevel } from '@/utils/format'

const gameTypes: GameType[] = [
  '硬核推理', '本格推理', '变格推理', '情感本', '机制本', '恐怖本', '欢乐本'
]

const EditProfilePage: React.FC = () => {
  const currentMember = useClubStore(s => s.getCurrentMember())
  const updateMemberProfile = useClubStore(s => s.updateMemberProfile)
  const currentUserId = useClubStore(s => s.currentUserId)

  const [playCount, setPlayCount] = useState(currentMember?.playCount ?? 0)
  const [preferredTypes, setPreferredTypes] = useState<GameType[]>(currentMember?.preferredTypes ?? [])
  const [timelineExpert, setTimelineExpert] = useState(currentMember?.ability.timelineExpert ?? false)
  const [cipherExpert, setCipherExpert] = useState(currentMember?.ability.cipherExpert ?? false)
  const [canLongSession, setCanLongSession] = useState(currentMember?.ability.canLongSession ?? false)
  const [goodForNewbies, setGoodForNewbies] = useState(currentMember?.note.goodForNewbies ?? false)
  const [goodForHardcore, setGoodForHardcore] = useState(currentMember?.note.goodForHardcore ?? false)
  const [customNote, setCustomNote] = useState(currentMember?.note.customNote ?? '')

  const levelText = useMemo(() => formatPlayCountLevel(
    playCount <= 5 ? '0-5' : playCount <= 20 ? '6-20' : playCount <= 50 ? '21-50' : '50+'
  ), [playCount])

  const toggleType = (type: GameType) => {
    setPreferredTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  const handleCancel = () => {
    Taro.navigateBack()
  }

  const handleSave = () => {
    if (!currentMember) return

    console.log('[EditProfile] save profile:', {
      playCount, preferredTypes, timelineExpert, cipherExpert,
      canLongSession, goodForNewbies, goodForHardcore, customNote
    })

    updateMemberProfile(currentUserId, {
      playCount,
      preferredTypes,
      ability: { timelineExpert, cipherExpert, canLongSession },
      note: { goodForNewbies, goodForHardcore, customNote: customNote.trim() || undefined }
    })

    Taro.showToast({ title: '保存成功！', icon: 'success' })
    setTimeout(() => Taro.navigateBack(), 800)
  }

  return (
    <View className={styles.page}>
      <View className={styles.form}>
        <View className={styles.formCard}>
          <View className={styles.formSectionTitle}>
            <Text className={styles.formSectionIcon}>📚</Text>
            玩本经验
          </View>
          <View className={styles.formItem}>
            <View className={styles.formLabel}>累计已玩本数量</View>
            <View className={styles.counterRow}>
              <Text className={styles.counterLabel}>已玩本数</Text>
              <View className={styles.counterControl}>
                <View
                  className={classnames(styles.counterBtn, playCount <= 0 && styles.disabled)}
                  onClick={() => playCount > 0 && setPlayCount(p => p - 1)}
                >
                  -
                </View>
                <View>
                  <Text className={styles.counterValue}>{playCount}</Text>
                  <Text className={styles.counterLevel}>{levelText}</Text>
                </View>
                <View
                  className={styles.counterBtn}
                  onClick={() => setPlayCount(p => p + 1)}
                >
                  +
                </View>
              </View>
            </View>
          </View>
        </View>

        <View className={styles.formCard}>
          <View className={styles.formSectionTitle}>
            <Text className={styles.formSectionIcon}>🎭</Text>
            偏好类型（可多选）
          </View>
          <View className={styles.tagSelector}>
            {gameTypes.map(type => (
              <View
                key={type}
                className={classnames(styles.tagOption, preferredTypes.includes(type) && styles.active)}
                onClick={() => toggleType(type)}
              >
                {type}
              </View>
            ))}
          </View>
        </View>

        <View className={styles.formCard}>
          <View className={styles.formSectionTitle}>
            <Text className={styles.formSectionIcon}>💪</Text>
            能力标签
          </View>
          <View className={styles.switchRow}>
            <View className={styles.switchLabel}>
              <Text className={styles.switchIcon}>⏱️</Text>
              擅长时间线推理
            </View>
            <Switch checked={timelineExpert} onChange={(e) => setTimelineExpert(e.detail.value)} color='#6B4EFF' />
          </View>
          <View className={styles.switchRow}>
            <View className={styles.switchLabel}>
              <Text className={styles.switchIcon}>🔐</Text>
              擅长密码破解
            </View>
            <Switch checked={cipherExpert} onChange={(e) => setCipherExpert(e.detail.value)} color='#6B4EFF' />
          </View>
          <View className={styles.switchRow}>
            <View className={styles.switchLabel}>
              <Text className={styles.switchIcon}>⏳</Text>
              能接受 6 小时以上长本
            </View>
            <Switch checked={canLongSession} onChange={(e) => setCanLongSession(e.detail.value)} color='#6B4EFF' />
          </View>
        </View>

        <View className={styles.formCard}>
          <View className={styles.formSectionTitle}>
            <Text className={styles.formSectionIcon}>📝</Text>
            社长备注
          </View>
          <View className={styles.switchRow}>
            <View className={styles.switchLabel}>
              <Text className={styles.switchIcon}>🌱</Text>
              适合带新玩家
            </View>
            <Switch checked={goodForNewbies} onChange={(e) => setGoodForNewbies(e.detail.value)} color='#6B4EFF' />
          </View>
          <View className={styles.switchRow}>
            <View className={styles.switchLabel}>
              <Text className={styles.switchIcon}>🔥</Text>
              适合高压硬核本
            </View>
            <Switch checked={goodForHardcore} onChange={(e) => setGoodForHardcore(e.detail.value)} color='#6B4EFF' />
          </View>
          <View className={styles.formItem} style={{ marginTop: '24rpx' }}>
            <View className={styles.formLabel}>自定义备注</View>
            <Textarea
              className={styles.formTextarea}
              placeholder='如：扛推位专业户、推土机、情感喷泉等...'
              value={customNote}
              onInput={(e) => setCustomNote(e.detail.value)}
              maxlength={50}
            />
          </View>
        </View>
      </View>

      <View className={styles.bottomBar}>
        <Button className={styles.cancelBtn} onClick={handleCancel}>
          取消
        </Button>
        <Button className={styles.submitBtn} onClick={handleSave}>
          保存资料
        </Button>
      </View>
    </View>
  )
}

export default EditProfilePage
