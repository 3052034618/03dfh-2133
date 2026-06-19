import React, { useState, useMemo } from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro, { usePullDownRefresh } from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import GameCard from '@/components/GameCard'
import { mockGames } from '@/data/games'
import type { Game, GameStatus } from '@/types/game'

type TabType = 'all' | GameStatus

const HomePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [games, setGames] = useState<Game[]>(mockGames)

  const tabs: { key: TabType; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'recruiting', label: '招募中' },
    { key: 'confirmed', label: '已成车' },
    { key: 'full', label: '已满员' }
  ]

  const filteredGames = useMemo(() => {
    if (activeTab === 'all') return games
    return games.filter(g => g.status === activeTab)
  }, [games, activeTab])

  const stats = useMemo(() => ({
    recruiting: games.filter(g => g.status === 'recruiting').length,
    confirmed: games.filter(g => g.status === 'confirmed').length,
    total: games.length
  }), [games])

  usePullDownRefresh(() => {
    console.log('[Home] pull down refresh')
    setTimeout(() => {
      setGames([...mockGames])
      Taro.stopPullDownRefresh()
    }, 800)
  })

  const handlePublish = () => {
    console.log('[Home] navigate to publish game')
    Taro.navigateTo({ url: '/pages/publish-game/index' })
  }

  const today = useMemo(() => {
    const d = new Date()
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return `${d.getMonth() + 1}月${d.getDate()}日 ${weekDays[d.getDay()]}`
  }, [])

  return (
    <View className={styles.page}>
      <View className={styles.banner}>
        <View className={styles.bannerTop}>
          <View>
            <Text className={styles.clubName}>硬核推理社</Text>
            <Text className={styles.dateText}>{today}</Text>
          </View>
        </View>
        <View className={styles.stats}>
          <View className={styles.statCard}>
            <Text className={styles.statValue}>{stats.recruiting}</Text>
            <Text className={styles.statLabel}>招募中</Text>
          </View>
          <View className={styles.statCard}>
            <Text className={styles.statValue}>{stats.confirmed}</Text>
            <Text className={styles.statLabel}>已成车</Text>
          </View>
          <View className={styles.statCard}>
            <Text className={styles.statValue}>{stats.total}</Text>
            <Text className={styles.statLabel}>本周车次</Text>
          </View>
        </View>
      </View>

      <View className={styles.ctaSection}>
        <Button className={styles.ctaButton} onClick={handlePublish}>
          🚗 我要开车 · 发布新本
        </Button>
      </View>

      <View className={styles.noticeCard}>
        <Text className={styles.noticeIcon}>📢</Text>
        <View className={styles.noticeContent}>
          <Text className={styles.noticeTitle}>社团公告</Text>
          <Text className={styles.noticeText}>
            本周末共5场硬核本等你来！新社员首次参车立减10元，欢迎带同学入坑～
          </Text>
        </View>
      </View>

      <View className={styles.tabs}>
        {tabs.map(tab => (
          <View
            key={tab.key}
            className={classnames(styles.tab, activeTab === tab.key && styles.active)}
            onClick={() => {
              console.log('[Home] switch tab:', tab.key)
              setActiveTab(tab.key)
            }}
          >
            {tab.label}
          </View>
        ))}
      </View>

      <View className={styles.sectionTitle}>
        <Text className={styles.sectionTitleText}>周末车次</Text>
        <Text className={styles.sectionMore}>共 {filteredGames.length} 场</Text>
      </View>

      {filteredGames.length > 0 ? (
        <View className={styles.gameList}>
          {filteredGames.map(game => (
            <GameCard key={game.id} game={game} />
          ))}
        </View>
      ) : (
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>🎭</Text>
          <Text className={styles.emptyText}>暂无车辆，快去发布第一个本吧！</Text>
        </View>
      )}
    </View>
  )
}

export default HomePage
