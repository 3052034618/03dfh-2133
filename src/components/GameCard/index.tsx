import React from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import type { Game } from '@/types/game'
import StatusBadge from '../StatusBadge'
import TagBadge from '../TagBadge'
import { formatDate } from '@/utils/format'

export interface GameCardProps {
  game: Game
  className?: string
}

const GameCard: React.FC<GameCardProps> = ({ game, className }) => {
  const progress = Math.min(100, (game.currentPlayers / game.totalPlayers) * 100)

  const handleClick = () => {
    console.log('[GameCard] navigate to game detail:', game.id)
    Taro.navigateTo({
      url: `/pages/game-detail/index?id=${game.id}`
    })
  }

  return (
    <View className={classnames(styles.gameCard, className)} onClick={handleClick}>
      <View className={styles.coverWrap}>
        <Image
          className={styles.cover}
          src={game.cover}
          mode='aspectFill'
          onError={(e) => console.error('[GameCard] image load error:', e)}
        />
        <StatusBadge status={game.status} className={styles.statusBadge} />
      </View>
      <View className={styles.content}>
        <View className={styles.header}>
          <Text className={styles.title}>{game.title}</Text>
          <TagBadge text={game.type} variant='primary' className={styles.typeTag} />
        </View>
        <View className={styles.meta}>
          <View className={styles.metaItem}>
            <Text>📅</Text>
            <Text>{formatDate(game.sessionDate)}</Text>
          </View>
          <View className={styles.metaItem}>
            <Text>📍</Text>
            <Text>{game.location}</Text>
          </View>
          <View className={styles.metaItem}>
            <Text>💰</Text>
            <Text className={styles.fee}>¥{game.aaFee} AA</Text>
          </View>
        </View>
        <View className={styles.progressBar}>
          <View className={styles.progressFill} style={{ width: `${progress}%` }} />
        </View>
        <View className={styles.progressText}>
          <Text>已报名 {game.currentPlayers}/{game.totalPlayers} 人</Text>
          {game.waitlist.length > 0 && <Text>候补 {game.waitlist.length} 人</Text>}
        </View>
      </View>
    </View>
  )
}

export default GameCard
