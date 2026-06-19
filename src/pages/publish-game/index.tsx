import React, { useState } from 'react'
import { View, Text, Input, Textarea, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import { useClubStore } from '@/store'
import type { GameType } from '@/types/member'
import type { RoleRequirement, RoleType } from '@/types/game'

const gameTypes: GameType[] = [
  '硬核推理', '本格推理', '变格推理', '情感本', '机制本', '恐怖本', '欢乐本'
]

const availableRoles: { type: RoleType; label: string; description: string }[] = [
  { type: 'timeline', label: '时间线位', description: '擅长梳理复杂时间线' },
  { type: 'cipher', label: '密码题位', description: '擅长破解密码和谜题' },
  { type: 'mentor', label: '带新位', description: '适合带新人熟悉规则' },
  { type: 'hardcore', label: '硬核推理位', description: '耐6小时+长本' }
]

interface TimeSlotForm {
  id: string
  label: string
  time: string
}

interface RoleForm extends RoleRequirement {
  enabled: boolean
}

const PublishGamePage: React.FC = () => {
  const addGame = useClubStore(s => s.addGame)

  const [title, setTitle] = useState('')
  const [selectedType, setSelectedType] = useState<GameType | ''>('')
  const [totalPlayers, setTotalPlayers] = useState(6)
  const [location, setLocation] = useState('')
  const [aaFee, setAaFee] = useState('')
  const [sessionDate, setSessionDate] = useState('2026-06-21')
  const [readingRequirement, setReadingRequirement] = useState('')
  const [noSpoilerNotice, setNoSpoilerNotice] = useState('严禁剧透！禁止讨论任何关于凶手身份、作案手法的信息')
  const [description, setDescription] = useState('')
  const [timeSlots, setTimeSlots] = useState<TimeSlotForm[]>([
    { id: '1', label: '周六下午', time: '14:00' },
    { id: '2', label: '周六晚上', time: '19:00' }
  ])
  const [roles, setRoles] = useState<RoleForm[]>([
    { type: 'timeline', label: '时间线位', description: '擅长梳理复杂时间线', count: 1, enabled: true },
    { type: 'cipher', label: '密码题位', description: '擅长破解密码和谜题', count: 1, enabled: true },
    { type: 'mentor', label: '带新位', description: '适合带新人熟悉规则', count: 1, enabled: false },
    { type: 'hardcore', label: '硬核推理位', description: '耐6小时+长本', count: 1, enabled: true }
  ])

  const canSubmit = title && selectedType && location && aaFee && timeSlots.length > 0

  const addTimeSlot = () => {
    const newId = Date.now().toString()
    setTimeSlots(prev => [...prev, { id: newId, label: '', time: '' }])
    console.log('[PublishGame] add time slot')
  }

  const removeTimeSlot = (id: string) => {
    if (timeSlots.length <= 1) {
      Taro.showToast({ title: '至少保留一个时间段', icon: 'none' })
      return
    }
    setTimeSlots(prev => prev.filter(t => t.id !== id))
    console.log('[PublishGame] remove time slot:', id)
  }

  const updateTimeSlot = (id: string, field: 'label' | 'time', value: string) => {
    setTimeSlots(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t))
  }

  const toggleRole = (type: RoleType) => {
    console.log('[PublishGame] toggle role:', type)
    setRoles(prev => prev.map(r => r.type === type ? { ...r, enabled: !r.enabled } : r))
  }

  const changeRoleCount = (type: RoleType, delta: number) => {
    console.log('[PublishGame] changeRoleCount:', type, delta)
    setRoles(prev => prev.map(r => {
      if (r.type !== type) return r
      const newCount = Math.max(1, Math.min(10, r.count + delta))
      return { ...r, count: newCount }
    }))
  }

  const handleCancel = () => {
    Taro.showModal({
      title: '取消发布',
      content: '确定要取消发布吗？已填写内容将丢失。',
      confirmText: '确定取消',
      confirmColor: '#F53F3F',
      success: (res) => {
        if (res.confirm) {
          Taro.navigateBack()
        }
      }
    })
  }

  const handleSubmit = () => {
    if (!canSubmit) {
      Taro.showToast({ title: '请填写完整信息', icon: 'none' })
      return
    }

    const validTimeSlots = timeSlots.filter(t => t.label && t.time)
    if (validTimeSlots.length === 0) {
      Taro.showToast({ title: '请填写时间段', icon: 'none' })
      return
    }

    Taro.showModal({
      title: '确认发布',
      content: `确认发布《${title}》？发布后将在首页展示。`,
      confirmText: '确认发布',
      success: (res) => {
        if (res.confirm) {
          const roleRequirements = roles.filter(r => r.enabled).map(({ enabled, ...rest }) => rest)
          console.log('[PublishGame] submit to store, roles:', roleRequirements)
          addGame({
            title,
            type: selectedType as GameType,
            totalPlayers,
            location,
            aaFee: parseInt(aaFee) || 0,
            readingRequirement,
            noSpoilerNotice,
            availableTimeSlots: validTimeSlots,
            sessionDate,
            description,
            roleRequirements
          })
          Taro.showToast({ title: '发布成功！', icon: 'success' })
          setTimeout(() => Taro.navigateBack(), 800)
        }
      }
    })
  }

  const onDateChange = (e: any) => {
    setSessionDate(e.detail.value)
  }

  return (
    <View className={styles.page}>
      <View className={styles.form}>
        <View className={styles.formCard}>
          <View className={styles.formSectionTitle}>
            <Text className={styles.formSectionIcon}>📜</Text>
            剧本基本信息
          </View>

          <View className={styles.formItem}>
            <View className={styles.formLabel}><Text className={styles.required}>*</Text>剧本名称</View>
            <Input
              className={styles.formInput}
              placeholder='如：月光下的谋杀案'
              value={title}
              onInput={(e) => setTitle(e.detail.value)}
              maxlength={30}
            />
          </View>

          <View className={styles.formItem}>
            <View className={styles.formLabel}><Text className={styles.required}>*</Text>剧本类型</View>
            <View className={styles.typeSelector}>
              {gameTypes.map(type => (
                <View
                  key={type}
                  className={classnames(styles.typeOption, selectedType === type && styles.active)}
                  onClick={() => {
                    console.log('[PublishGame] select type:', type)
                    setSelectedType(type)
                  }}
                >
                  {type}
                </View>
              ))}
            </View>
          </View>

          <View className={styles.formItem}>
            <View className={styles.formLabel}><Text className={styles.required}>*</Text>玩家人数</View>
            <View className={styles.counterRow}>
              <Text className={styles.counterLabel}>需要玩家</Text>
              <View className={styles.counterControl}>
                <View
                  className={classnames(styles.counterBtn, totalPlayers <= 4 && styles.disabled)}
                  onClick={() => totalPlayers > 4 && setTotalPlayers(p => p - 1)}
                >
                  -
                </View>
                <Text className={styles.counterValue}>{totalPlayers}</Text>
                <View
                  className={classnames(styles.counterBtn, totalPlayers >= 12 && styles.disabled)}
                  onClick={() => totalPlayers < 12 && setTotalPlayers(p => p + 1)}
                >
                  +
                </View>
              </View>
            </View>
          </View>
        </View>

        <View className={styles.formCard}>
          <View className={styles.formSectionTitle}>
            <Text className={styles.formSectionIcon}>📍</Text>
            开本信息
          </View>

          <View className={styles.formItem}>
            <View className={styles.formLabel}><Text className={styles.required}>*</Text>开本日期</View>
            <View className={styles.datePicker}>
              <Input
                type='text'
                value={sessionDate}
                onInput={onDateChange}
                placeholder='YYYY-MM-DD'
                style={{ flex: 1, background: 'transparent', fontSize: '28rpx', color: '#1D2129' }}
              />
            </View>
          </View>

          <View className={styles.formItem}>
            <View className={styles.formLabel}><Text className={styles.required}>*</Text>开本地点</View>
            <Input
              className={styles.formInput}
              placeholder='如：东区大学生活动中心302'
              value={location}
              onInput={(e) => setLocation(e.detail.value)}
              maxlength={50}
            />
          </View>

          <View className={styles.formItem}>
            <View className={styles.formLabel}><Text className={styles.required}>*</Text>AA费用（元/人）</View>
            <Input
              className={styles.formInput}
              type='digit'
              placeholder='如：35'
              value={aaFee}
              onInput={(e) => setAaFee(e.detail.value)}
              maxlength={5}
            />
          </View>

          <View className={styles.formItem}>
            <View className={styles.formLabel}><Text className={styles.required}>*</Text>可选时间段</View>
            <View className={styles.timeSlotList}>
              {timeSlots.map(slot => (
                <View key={slot.id} className={styles.timeSlotItem}>
                  <Input
                    className={styles.timeSlotInput}
                    placeholder='时段名称 如：周六下午'
                    value={slot.label}
                    onInput={(e) => updateTimeSlot(slot.id, 'label', e.detail.value)}
                    maxlength={10}
                    style={{ width: '40%', marginRight: '16rpx' }}
                  />
                  <Input
                    className={styles.timeSlotInput}
                    placeholder='时间 如：14:00'
                    value={slot.time}
                    onInput={(e) => updateTimeSlot(slot.id, 'time', e.detail.value)}
                    maxlength={10}
                    style={{ width: '30%' }}
                  />
                  <View className={styles.timeSlotDelete} onClick={() => removeTimeSlot(slot.id)}>
                    ✕
                  </View>
                </View>
              ))}
            </View>
            <Button className={styles.addTimeSlotBtn} onClick={addTimeSlot}>
              + 添加时间段
            </Button>
          </View>
        </View>

        <View className={styles.formCard}>
          <View className={styles.formSectionTitle}>
            <Text className={styles.formSectionIcon}>🎯</Text>
            角色需求配置
          </View>
          <Text style={{ fontSize: '24rpx', color: '#86909C', marginBottom: '24rpx', display: 'block' }}>
            勾选需要的角色类型并设置人数，候补排序会优先匹配角色需求
          </Text>
          <View className={styles.roleRequirementList}>
            {roles.map(role => (
              <View key={role.type} className={styles.roleRequirementItem}>
                <View
                  className={classnames(styles.roleCheckbox, role.enabled && styles.active)}
                  onClick={() => toggleRole(role.type)}
                >
                  {role.enabled && <Text className={styles.roleCheckIcon}>✓</Text>}
                </View>
                <View className={styles.roleInfo}>
                  <Text className={styles.roleName}>{role.label}</Text>
                  <Text className={styles.roleDesc}>{role.description}</Text>
                </View>
                {role.enabled && (
                  <View className={styles.roleCounter}>
                    <View
                      className={classnames(styles.roleCounterBtn, role.count <= 1 && styles.disabled)}
                      onClick={() => role.count > 1 && changeRoleCount(role.type, -1)}
                    >
                      -
                    </View>
                    <Text className={styles.roleCounterValue}>{role.count}</Text>
                    <View
                      className={classnames(styles.roleCounterBtn, role.count >= 10 && styles.disabled)}
                      onClick={() => role.count < 10 && changeRoleCount(role.type, 1)}
                    >
                      +
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        <View className={styles.formCard}>
          <View className={styles.formSectionTitle}>
            <Text className={styles.formSectionIcon}>📝</Text>
            其他说明
          </View>

          <View className={styles.formItem}>
            <View className={styles.formLabel}>阅读要求</View>
            <Textarea
              className={styles.formTextarea}
              placeholder='如：人均阅读量约2万字，建议预留30分钟读本时间'
              value={readingRequirement}
              onInput={(e) => setReadingRequirement(e.detail.value)}
              maxlength={200}
            />
          </View>

          <View className={styles.formItem}>
            <View className={styles.formLabel}><Text className={styles.required}>*</Text>禁止剧透声明</View>
            <Textarea
              className={styles.formTextarea}
              placeholder='请输入禁止剧透声明'
              value={noSpoilerNotice}
              onInput={(e) => setNoSpoilerNotice(e.detail.value)}
              maxlength={200}
            />
          </View>

          <View className={styles.formItem}>
            <View className={styles.formLabel}>剧本介绍</View>
            <Textarea
              className={styles.formTextarea}
              placeholder='简单介绍一下这个剧本的特色，吸引更多玩家报名~'
              value={description}
              onInput={(e) => setDescription(e.detail.value)}
              maxlength={300}
            />
          </View>
        </View>
      </View>

      <View className={styles.bottomBar}>
        <Button className={styles.cancelBtn} onClick={handleCancel}>
          取消
        </Button>
        <Button
          className={classnames(styles.submitBtn, !canSubmit && styles.disabled)}
          onClick={handleSubmit}
        >
          发布招募
        </Button>
      </View>
    </View>
  )
}

export default PublishGamePage
