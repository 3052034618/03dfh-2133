import React, { useState, useMemo } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro, { usePullDownRefresh } from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import MemberCard from '@/components/MemberCard'
import { mockMembers } from '@/data/members'
import type { Member, PlayCountLevel, GameType } from '@/types/member'

type AbilityFilter = 'timelineExpert' | 'cipherExpert' | 'canLongSession' | 'goodForNewbies' | 'goodForHardcore'

const MembersPage: React.FC = () => {
  const [searchText, setSearchText] = useState('')
  const [members, setMembers] = useState<Member[]>(mockMembers)
  const [selectedAbility, setSelectedAbility] = useState<AbilityFilter | null>(null)
  const [selectedLevel, setSelectedLevel] = useState<PlayCountLevel | 'all'>('all')
  const [selectedType, setSelectedType] = useState<GameType | 'all'>('all')

  const abilityFilters: { key: AbilityFilter; label: string }[] = [
    { key: 'timelineExpert', label: '时间线达人' },
    { key: 'cipherExpert', label: '密码破解' },
    { key: 'canLongSession', label: '耐6h+' },
    { key: 'goodForNewbies', label: '适合带新' },
    { key: 'goodForHardcore', label: '高压本选手' }
  ]

  const levelFilters: { key: PlayCountLevel | 'all'; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: '0-5', label: '新手' },
    { key: '6-20', label: '进阶' },
    { key: '21-50', label: '老手' },
    { key: '50+', label: '大神' }
  ]

  const typeFilters: { key: GameType | 'all'; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: '硬核推理', label: '硬核推理' },
    { key: '本格推理', label: '本格推理' },
    { key: '变格推理', label: '变格推理' },
    { key: '情感本', label: '情感本' },
    { key: '机制本', label: '机制本' },
    { key: '恐怖本', label: '恐怖本' },
    { key: '欢乐本', label: '欢乐本' }
  ]

  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      if (searchText && !m.name.includes(searchText) && !(m.department?.includes(searchText))) {
        return false
      }
      if (selectedLevel !== 'all' && m.playCountLevel !== selectedLevel) {
        return false
      }
      if (selectedType !== 'all' && !m.preferredTypes.includes(selectedType)) {
        return false
      }
      if (selectedAbility) {
        if (selectedAbility === 'goodForNewbies' && !m.note.goodForNewbies) return false
        if (selectedAbility === 'goodForHardcore' && !m.note.goodForHardcore) return false
        if (selectedAbility in m.ability && !m.ability[selectedAbility as keyof typeof m.ability]) return false
      }
      return true
    })
  }, [members, searchText, selectedAbility, selectedLevel, selectedType])

  const summary = useMemo(() => ({
    total: members.length,
    veteran: members.filter(m => m.playCountLevel === '50+' || m.playCountLevel === '21-50').length,
    hardCorer: members.filter(m => m.ability.timelineExpert || m.ability.cipherExpert).length
  }), [members])

  usePullDownRefresh(() => {
    console.log('[Members] pull down refresh')
    setTimeout(() => {
      setMembers([...mockMembers])
      Taro.stopPullDownRefresh()
    }, 800)
  })

  const handleAbilityClick = (key: AbilityFilter) => {
    console.log('[Members] click ability filter:', key)
    setSelectedAbility(selectedAbility === key ? null : key)
  }

  return (
    <View className={styles.page}>
      <View className={styles.searchSection}>
        <View className={styles.searchBar}>
          <Text className={styles.searchIcon}>🔍</Text>
          <Input
            className={styles.searchInput}
            placeholder='搜索社员姓名或学院'
            value={searchText}
            onInput={(e) => setSearchText(e.detail.value)}
          />
        </View>
        <View className={styles.summary}>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryValue}>{summary.total}</Text>
            <Text className={styles.summaryLabel}>社团总人数</Text>
          </View>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryValue}>{summary.veteran}</Text>
            <Text className={styles.summaryLabel}>资深玩家</Text>
          </View>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryValue}>{summary.hardCorer}</Text>
            <Text className={styles.summaryLabel}>硬核选手</Text>
          </View>
        </View>
      </View>

      <View className={styles.filterSection}>
        <View className={styles.filterGroup}>
          <Text className={styles.filterLabel}>能力标签</Text>
          <View className={styles.filterTags}>
            {abilityFilters.map(f => (
              <View
                key={f.key}
                className={classnames(styles.filterTag, selectedAbility === f.key && styles.active)}
                onClick={() => handleAbilityClick(f.key)}
              >
                {f.label}
              </View>
            ))}
          </View>
        </View>
        <View className={styles.filterGroup}>
          <Text className={styles.filterLabel}>玩本等级</Text>
          <View className={styles.filterTags}>
            {levelFilters.map(f => (
              <View
                key={f.key}
                className={classnames(styles.filterTag, selectedLevel === f.key && styles.active)}
                onClick={() => {
                  console.log('[Members] click level filter:', f.key)
                  setSelectedLevel(f.key)
                }}
              >
                {f.label}
              </View>
            ))}
          </View>
        </View>
        <View className={styles.filterGroup}>
          <Text className={styles.filterLabel}>偏好类型</Text>
          <View className={styles.filterTags}>
            {typeFilters.map(f => (
              <View
                key={f.key}
                className={classnames(styles.filterTag, selectedType === f.key && styles.active)}
                onClick={() => {
                  console.log('[Members] click type filter:', f.key)
                  setSelectedType(f.key)
                }}
              >
                {f.label}
              </View>
            ))}
          </View>
        </View>
      </View>

      <View className={styles.listHeader}>
        <Text className={styles.listTitle}>社员列表</Text>
        <Text className={styles.listCount}>共 {filteredMembers.length} 人</Text>
      </View>

      {filteredMembers.length > 0 ? (
        <View className={styles.memberList}>
          {filteredMembers.map(member => (
            <MemberCard key={member.id} member={member} />
          ))}
        </View>
      ) : (
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>🙈</Text>
          <Text className={styles.emptyText}>没有找到匹配的社员</Text>
        </View>
      )}
    </View>
  )
}

export default MembersPage
